const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// Register tutor with password and multiple courses
router.post('/tutors', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
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
        
        // Debug log
        console.log('Registering tutor with department:', department);
        console.log('Selected courses:', selected_courses);
        
        // Validate max 2 courses
        if (!selected_courses || selected_courses.length > 2 || selected_courses.length === 0) {
            return res.status(400).json({ 
                message: 'Please select 1-2 courses' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Convert courses array to JSON string
        const coursesJson = JSON.stringify(selected_courses);
        
        // Check if tutor already exists
        const [existing] = await connection.query(
            "SELECT id FROM tutors WHERE email = ?", [email]
        );
        
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        // Insert tutor with department and selected_courses as JSON
        const [result] = await connection.query(`
            INSERT INTO tutors 
            (email, password, full_name, id_number, term, program_level, program_id, selected_courses, department) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

        // Update users table
        await connection.query(
            "UPDATE users SET role = 'tutor', full_name = ? WHERE email = ?",
            [name, email]
        );
                        
        await connection.commit();
        
        res.status(201).json({ 
            message: 'Tutor registered successfully!',
            tutorId: result.insertId 
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error registering tutor:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        res.status(500).json({ message: 'Error registering tutor' });
    } finally {
        connection.release();
    }
});

// Get tutor's registered courses
router.get('/tutors/:id/courses', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.query(`
            SELECT selected_courses, program_id, full_name, department 
            FROM tutors 
            WHERE id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tutor not found' });
        }
        
        const tutor = rows[0];
        const courseIds = JSON.parse(tutor.selected_courses || '[]');
        
        if (courseIds.length === 0) {
            return res.json([]);
        }
        
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
        console.error('Error fetching tutor courses:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

module.exports = router;