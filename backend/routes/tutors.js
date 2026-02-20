const express = require('express');
const router = express.Router();
const pool = require('../db');   // now a pg.Pool instance
const bcrypt = require('bcrypt');

// Register tutor with password and multiple courses
router.post('/tutors', async (req, res) => {
    const client = await pool.connect();   // get a client for transaction
    
    try {
        await client.query('BEGIN');
        
        const { 
            email, 
            password, 
            name, 
            idNumber, 
            term, 
            program_level,
            program_id,
            selected_courses,
            department
        } = req.body;
        
        console.log('Registering tutor with department:', department);
        console.log('Selected courses:', selected_courses);
        
        // Validate max 2 courses
        if (!selected_courses || selected_courses.length > 2 || selected_courses.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: 'Please select 1-2 courses' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Convert courses array to JSON string (or let pg handle it)
        const coursesJson = JSON.stringify(selected_courses);
        
        // Check if tutor already exists
        const existing = await client.query(
            'SELECT id FROM tutors WHERE email = $1', [email]
        );
        
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        // Insert tutor – use RETURNING to get the new id
        const result = await client.query(`
            INSERT INTO tutors 
            (email, password, full_name, id_number, term, program_level, program_id, selected_courses, department) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, [
            email, 
            hashedPassword, 
            name, 
            idNumber, 
            term, 
            program_level, 
            program_id, 
            coursesJson,
            department
        ]);

        const tutorId = result.rows[0].id;

        // Update users table (if it exists)
        await client.query(
            'UPDATE users SET role = $1, full_name = $2 WHERE email = $3',
            ['tutor', name, email]
        );
                        
        await client.query('COMMIT');
        
        res.status(201).json({ 
            message: 'Tutor registered successfully!',
            tutorId 
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registering tutor:', error);
        
        // Handle unique violation (PostgreSQL error code 23505)
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        res.status(500).json({ message: 'Error registering tutor', error: error.message });
    } finally {
        client.release();
    }
});

// Get tutor's registered courses
router.get('/tutors/:id/courses', async (req, res) => {
    try {
        const { id } = req.params;
        
        const tutorResult = await pool.query(`
            SELECT selected_courses, program_id, full_name, department 
            FROM tutors 
            WHERE id = $1
        `, [id]);
        
        if (tutorResult.rows.length === 0) {
            return res.status(404).json({ message: 'Tutor not found' });
        }
        
        const tutor = tutorResult.rows[0];
        const courseIds = JSON.parse(tutor.selected_courses || '[]');
        
        if (courseIds.length === 0) {
            return res.json([]);
        }
        
        // Use ANY($1) with type cast for integer array
        const coursesResult = await pool.query(`
            SELECT 
                id, 
                "COL 2" AS unit_code, 
                "COL 3" AS unit_name 
            FROM courses_1 
            WHERE id = ANY($1::int[])
        `, [courseIds]);
        
        res.json(coursesResult.rows);
        
    } catch (error) {
        console.error('Error fetching tutor courses:', error);
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});

module.exports = router;