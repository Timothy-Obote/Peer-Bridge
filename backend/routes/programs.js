const express = require('express');
const router = express.Router();
const pool = require('../db'); // assume this exports a pg.Pool instance

// Get all programs grouped by level
router.get('/programs', async (req, res) => {
    try {
        // PostgreSQL uses $1, $2... placeholders, and returns a result object with .rows
        const result = await pool.query(`
            SELECT id, program_name, program_level, department
            FROM programs 
            ORDER BY program_level, program_name
        `);
        
        const rows = result.rows;
        
        const grouped = {
            undergraduate: rows.filter(p => p.program_level === 'undergraduate'),
            graduate: rows.filter(p => p.program_level === 'graduate')
        };
        
        res.json(grouped);
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ message: 'Error fetching programs', error: error.message });
    }
});

// Get courses for a specific program - FIXED COLUMN NAMES
router.get('/programs/:programId/courses', async (req, res) => {
    try {
        const { programId } = req.params;
        
        console.log(`Fetching courses for program ID: ${programId}`);
        
        // Check if program exists
        const programCheck = await pool.query(
            "SELECT * FROM programs WHERE id = $1", 
            [programId]
        );
        
        if (programCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Program not found' });
        }
        
        // Get courses with CORRECT column names: "COL 2" = code, "COL 3" = name
        // PostgreSQL requires double quotes for identifiers with spaces
        const result = await pool.query(`
            SELECT 
                c.id,
                c."COL 2" AS unit_code,
                c."COL 3" AS unit_name
            FROM courses_1 c
            INNER JOIN program_courses pc ON c.id = pc.course_id
            WHERE pc.program_id = $1
            ORDER BY c."COL 3"
        `, [programId]);
        
        console.log(`Returning ${result.rows.length} courses`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ 
            message: 'Error fetching courses',
            error: error.message 
        });
    }
});

// Get program details
router.get('/programs/:programId', async (req, res) => {
    try {
        const { programId } = req.params;
        
        const result = await pool.query(`
            SELECT * FROM programs WHERE id = $1
        `, [programId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Program not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching program:', error);
        res.status(500).json({ message: 'Error fetching program', error: error.message });
    }
});

module.exports = router;