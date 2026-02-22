// matching.js
const pool = require('./db');

/**
 * Automatically match tutors and tutees based on common courses and department.
 * Respects max 2 tutees per tutor and 2 tutors per tutee.
 */
async function autoMatch() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find all tutees who have fewer than 2 tutors
        const tutees = await client.query(`
            SELECT u.id, u.department_id
            FROM users u
            WHERE u.role = 'tutee'
              AND (SELECT COUNT(*) FROM matches WHERE tutee_id = u.id) < 2
        `);

        for (const tutee of tutees.rows) {
            // Get tutee's needed courses
            const tuteeCourses = await client.query(
                `SELECT course_id FROM tutee_courses WHERE tutee_id = $1`,
                [tutee.id]
            );
            if (tuteeCourses.rows.length === 0) continue;

            const courseIds = tuteeCourses.rows.map(r => r.course_id);

            // Find tutors in same department who offer any of these courses and have capacity
            const tutors = await client.query(`
                SELECT DISTINCT t.id
                FROM users t
                JOIN tutor_courses tc ON t.id = tc.tutor_id
                WHERE t.role = 'tutor'
                  AND t.department_id = $1
                  AND tc.course_id = ANY($2::int[])
                  AND (SELECT COUNT(*) FROM matches WHERE tutor_id = t.id) < 2
                  AND NOT EXISTS (
                      SELECT 1 FROM matches WHERE tutor_id = t.id AND tutee_id = $3
                  )
            `, [tutee.department_id, courseIds, tutee.id]);

            for (const tutor of tutors.rows) {
                // Get common courses between this tutor and tutee
                const common = await client.query(`
                    SELECT course_id FROM tutor_courses
                    WHERE tutor_id = $1 AND course_id = ANY($2::int[])
                `, [tutor.id, courseIds]);

                if (common.rows.length > 0) {
                    // Create match
                    const match = await client.query(
                        `INSERT INTO matches (tutor_id, tutee_id) VALUES ($1, $2) RETURNING id`,
                        [tutor.id, tutee.id]
                    );
                    const matchId = match.rows[0].id;

                    // Add common courses to match_courses
                    for (const c of common.rows) {
                        await client.query(
                            `INSERT INTO match_courses (match_id, course_id) VALUES ($1, $2)`,
                            [matchId, c.course_id]
                        );
                    }
                }

                // Stop if tutee reached 2 tutors
                const tuteeCount = await client.query(
                    `SELECT COUNT(*) FROM matches WHERE tutee_id = $1`,
                    [tutee.id]
                );
                if (parseInt(tuteeCount.rows[0].count) >= 2) break;
            }
        }

        await client.query('COMMIT');
        console.log('Auto-match completed');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Auto-match error:', err);
    } finally {
        client.release();
    }
}

/**
 * Generate suggestions for tutors to take on new courses for unmatched tutees.
 * A suggestion is created for each course a tutee needs that the tutor does NOT already offer.
 */
async function generateSuggestions() {
    const client = await pool.connect();
    try {
        const tutees = await client.query(`
            SELECT u.id, u.department_id
            FROM users u
            WHERE u.role = 'tutee'
              AND (SELECT COUNT(*) FROM matches WHERE tutee_id = u.id) < 2
              AND EXISTS (SELECT 1 FROM tutee_courses WHERE tutee_id = u.id)
        `);

        for (const tutee of tutees.rows) {
            const tuteeCourses = await client.query(
                `SELECT course_id FROM tutee_courses WHERE tutee_id = $1`,
                [tutee.id]
            );

            const tutors = await client.query(`
                SELECT t.id
                FROM users t
                WHERE t.role = 'tutor'
                  AND t.department_id = $1
                  AND (SELECT COUNT(*) FROM matches WHERE tutor_id = t.id) < 2
            `, [tutee.department_id]);

            for (const tutor of tutors.rows) {
                // Get courses the tutor already offers
                const tutorCourses = await client.query(
                    `SELECT course_id FROM tutor_courses WHERE tutor_id = $1`,
                    [tutor.id]
                );
                const tutorCourseIds = tutorCourses.rows.map(c => c.course_id);

                for (const tc of tuteeCourses.rows) {
                    if (!tutorCourseIds.includes(tc.course_id)) {
                        // Check if suggestion already pending
                        const exists = await client.query(`
                            SELECT id FROM suggestions
                            WHERE tutor_id = $1 AND tutee_id = $2 AND course_id = $3 AND status = 'pending'
                        `, [tutor.id, tutee.id, tc.course_id]);

                        if (exists.rows.length === 0) {
                            await client.query(`
                                INSERT INTO suggestions (tutor_id, tutee_id, course_id)
                                VALUES ($1, $2, $3)
                            `, [tutor.id, tutee.id, tc.course_id]);
                        }
                    }
                }
            }
        }
        console.log('Suggestions generated');
    } catch (err) {
        console.error('Suggestion generation error:', err);
    } finally {
        client.release();
    }
}

/**
 * Accept a suggestion: drop tutor's current courses, add the suggested course,
 * create a match, and mark suggestion as accepted.
 * @param {number} suggestionId - ID of the suggestion to accept
 * @returns {Object} result with success and matchId
 */
async function acceptSuggestion(suggestionId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const sugg = await client.query(
            `SELECT * FROM suggestions WHERE id = $1 AND status = 'pending'`,
            [suggestionId]
        );
        if (sugg.rows.length === 0) throw new Error('Suggestion not found');

        const { tutor_id, tutee_id, course_id } = sugg.rows[0];

        // Check limits
        const tutorMatches = await client.query(
            `SELECT COUNT(*) FROM matches WHERE tutor_id = $1`,
            [tutor_id]
        );
        if (parseInt(tutorMatches.rows[0].count) >= 2) {
            throw new Error('Tutor already has 2 tutees');
        }

        const tuteeMatches = await client.query(
            `SELECT COUNT(*) FROM matches WHERE tutee_id = $1`,
            [tutee_id]
        );
        if (parseInt(tuteeMatches.rows[0].count) >= 2) {
            throw new Error('Tutee already has 2 tutors');
        }

        // Drop tutor's current courses
        await client.query(
            `DELETE FROM tutor_courses WHERE tutor_id = $1`,
            [tutor_id]
        );

        // Add the new course
        await client.query(
            `INSERT INTO tutor_courses (tutor_id, course_id) VALUES ($1, $2)`,
            [tutor_id, course_id]
        );

        // Create match
        const match = await client.query(
            `INSERT INTO matches (tutor_id, tutee_id) VALUES ($1, $2) RETURNING id`,
            [tutor_id, tutee_id]
        );
        const matchId = match.rows[0].id;

        // Add course to match_courses
        await client.query(
            `INSERT INTO match_courses (match_id, course_id) VALUES ($1, $2)`,
            [matchId, course_id]
        );

        // Update suggestion status
        await client.query(
            `UPDATE suggestions SET status = 'accepted' WHERE id = $1`,
            [suggestionId]
        );

        await client.query('COMMIT');
        return { success: true, matchId };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    autoMatch,
    generateSuggestions,
    acceptSuggestion
};