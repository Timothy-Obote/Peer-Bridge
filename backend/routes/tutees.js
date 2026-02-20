const express = require('express');
const router = express.Router();
const pool = require('../db');   // pg.Pool
const bcrypt = require('bcrypt');

// Register tutee with password and multiple courses
router.post('/tutees', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { 
            email, 
            password, 
            name, 
            idNumber, 
            program_level,
            program_id,
            selected_courses,
            term,
            department
        } = req.body;
        
        console.log('Registering tutee with department:', department);
        
        // Validate max 2 courses
        if (!selected_courses || selected_courses.length > 2 || selected_courses.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: 'Please select 1-2 courses' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Convert courses array to JSON
        const coursesJson = JSON.stringify(selected_courses);
        
        // Check if tutee already exists
        const existing = await client.query(
            'SELECT id FROM tutees WHERE email = $1', [email]
        );
        
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        // Insert tutee with RETURNING id
        const result = await client.query(`
            INSERT INTO tutees 
            (email, password, full_name, id_number, program_level, program_id, selected_courses, term, department) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, [
            email, 
            hashedPassword, 
            name, 
            idNumber, 
            program_level, 
            program_id, 
            coursesJson, 
            term,
            department
        ]);

        const tuteeId = result.rows[0].id;

        // Update users table
        await client.query(
            'UPDATE users SET role = $1, full_name = $2 WHERE email = $3',
            ['tutee', name, email]
        );
                        
        await client.query('COMMIT');
        
        res.status(201).json({ 
            message: 'Tutee registered successfully!',
            tuteeId
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error registering tutee:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        res.status(500).json({ message: 'Error registering tutee', error: error.message });
    } finally {
        client.release();
    }
});

// Get tutee's registered courses
router.get('/tutees/:id/courses', async (req, res) => {
    try {
        const { id } = req.params;
        
        const tuteeResult = await pool.query(`
            SELECT selected_courses, program_id, full_name, department 
            FROM tutees 
            WHERE id = $1
        `, [id]);
        
        if (tuteeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Tutee not found' });
        }
        
        const tutee = tuteeResult.rows[0];
        const courseIds = JSON.parse(tutee.selected_courses || '[]');
        
        if (courseIds.length === 0) {
            return res.json([]);
        }
        
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
        console.error('Error fetching tutee courses:', error);
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});

module.exports = router;