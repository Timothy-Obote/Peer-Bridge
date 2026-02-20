const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import route files
const programRoutes = require('./routes/programs');
const tuteeRoutes = require('./routes/tutees');
const tutorRoutes = require('./routes/tutors');

const app = express();

// ============ MIDDLEWARE ============
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5001',
        // ADD YOUR ACTUAL VERCEL FRONTEND URL HERE
        'https://peerbridgepacs.vercel.app',
        // Keep any other preview URLs if needed
        'https://peerbridge-5zyu38rxf-gors-projects-57d8ecd6.vercel.app'
    ],
    credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ============ ROOT ROUTE ============
app.get("/", (req, res) => {
    res.json({ 
        message: "Peer Bridge API is running",
        endpoints: {
            health: "/health",
            programs: "/api/programs",
            program_courses: "/api/programs/:programId/courses",
            tutees: "/tutees",
            tutee_courses: "/tutees/:id/courses",
            tutors: "/tutors",
            tutor_courses: "/tutors/:id/courses",
            signin: "/signin",
            admin: "/admin/overview",
            test_db: "/test-db",
            matches: "/api/matches",
            debug_programs: "/debug/programs"   // new debug endpoint
        }
    });
});

const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: [
            'http://localhost:5173', 
            'http://127.0.0.1:5173',
            'https://peerbridgepacs.vercel.app'   //  already present
        ],
        credentials: true,
        methods: ["GET", "POST"] 
    } 
});

// ============ DATABASE POOL (PostgreSQL) ============
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false   // required for Render
    }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err.stack);
    } else {
        console.log('Connected to PostgreSQL database');
        release();
    }
});

// Active socket tracking
const activeSockets = new Map();
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("registerUser", (email) => {
    if (email) activeSockets.set(email, socket.id);
  });
  socket.on("disconnect", () => {
    for (const [email, id] of activeSockets.entries()) {
      if (id === socket.id) activeSockets.delete(email);
    }
  });
});

// ============ ENSURE TABLES (optional) ============
async function ensureTables() { /* ... (keep as is) ... */ }
// ensureTables().catch(console.error);

// ============ ROUTES ============
app.use('/api', programRoutes);
app.use('/', tuteeRoutes);
app.use('/', tutorRoutes);

// ============ PROGRAM COURSES ENDPOINT ============
app.get('/api/programs/:programId/courses', async (req, res) => {
    try {
        const { programId } = req.params;
        const { rows } = await pool.query(`
            SELECT 
                c.id,
                c.course_code AS unit_code,
                c.course_name AS unit_name
            FROM courses_1 c
            INNER JOIN program_courses pc ON c.id = pc.course_id
            WHERE pc.program_id = $1
            ORDER BY c.course_name
        `, [programId]);
        res.json(rows);
    } catch (error) {
        console.error('Error in /api/programs/:programId/courses:', error);  // log full error
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});

// ============ DEBUG: TEST PROGRAMS LIST ============
// This will help diagnose if the programs table exists and what data it contains
app.get('/debug/programs', async (req, res) => {
    try {
        // Try to query the programs table (adjust table name if needed)
        const { rows } = await pool.query('SELECT * FROM programs LIMIT 10');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Debug programs error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT 1 + 1 AS solution');
        res.json({ message: 'Database connected!', result: rows[0].solution });
    } catch (error) {
        console.error('Test-db error:', error);
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
});

app.get('/debug/courses-schema', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'courses_1'
            ORDER BY ordinal_position;
        `);
        res.json({ table: 'courses_1', columns: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ SIGNIN ============
app.post("/signin", async (req, res) => { /* ... keep as is ... */ });

// ============ ADMIN OVERVIEW ============
app.get("/admin/overview", async (req, res) => { /* ... keep as is ... */ });

// ============ MATCHES PLACEHOLDER ============
app.get("/api/matches", (req, res) => {
    res.json([]);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('Server Status: RUNNING');
    console.log(`Backend Server:   http://localhost:${PORT}`);
    console.log(`Frontend (Vite):  http://localhost:5173`);
    console.log('='.repeat(60));
    console.log('Admin Login:  admin@usiu.ac.ke / git checkout master');
    console.log('='.repeat(60));
});