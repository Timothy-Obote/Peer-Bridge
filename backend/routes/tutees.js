const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// Register tutee with password and multiple courses
router.post('/tutees', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            email, 
            password, 
            name, 
            idNumber, 
            program_level,
            program_id,
            selected_courses,
            term 
        } = req.body;
        
        // Validate max 2 courses
        if (!selected_courses || selected_courses.length > 2 || selected_courses.length === 0) {
            return res.status(400).json({ 
                message: 'Please select 1-2 courses' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Convert courses array to JSON
        const coursesJson = JSON.stringify(selected_courses);
        
        // Check if tutee already exists
        const [existing] = await connection.query(
            "SELECT id FROM tutees WHERE email = ?", [email]
        );
        
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        // Insert tutee with new schema
        const [result] = await connection.query(`
            INSERT INTO tutees 
            (email, password, full_name, id_number, program_level, program_id, selected_courses, term) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            email, 
            hashedPassword, 
            name, 
            idNumber, 
            program_level, 
            program_id, 
            coursesJson, 
            term
        ]);
        
        // Update users table
        await connection.query(
            "UPDATE users SET role = 'tutee', full_name = ? WHERE email = ?",
            [name, email]
        );
        
        await connection.commit();
        
        res.status(201).json({ 
            message: 'Tutee registered successfully!',
            tuteeId: result.insertId 
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error registering tutee:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        res.status(500).json({ message: 'Error registering tutee' });
    } finally {
        connection.release();
    }
});

// Get tutee's registered courses - FIXED COLUMN NAMES
router.get('/tutees/:id/courses', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.query(`
            SELECT selected_courses, program_id, full_name 
            FROM tutees 
            WHERE id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tutee not found' });
        }
        
        const tutee = rows[0];
        const courseIds = JSON.parse(tutee.selected_courses || '[]');
        
        if (courseIds.length === 0) {
            return res.json([]);
        }
        
        // FIXED: Use COL 2 and COL 3 instead of unit_code/unit_name
        const [courses] = await pool.query(`
            SELECT 
                id, 
                \`COL 2\` as unit_code, 
                \`COL 3\` as unit_name 
            FROM courses_1 
            WHERE id IN (?)
        `, [courseIds]);
        
        res.json(courses);
        
    } catch (error) {
        console.error('Error fetching tutee courses:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

module.exports = router;