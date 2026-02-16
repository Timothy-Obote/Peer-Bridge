const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");// <-- new
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
        // ADD YOUR VERCEL URL HERE 👇
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
            matches: "/api/matches"
        }
    });
});

const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: [
            'http://localhost:5173', 
            'http://127.0.0.1:5173',
            // ADD YOUR VERCEL URL HERE FOR SOCKET.IO 👇
            'https://peerbridge-5zyu38rxf-gors-projects-57d8ecd6.vercel.app'
        ],
        credentials: true 
    } 
});

// ============ DATABASE POOL ============
const pool = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

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

// ============ ENSURE TABLES ============
async function ensureTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tutors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      full_name VARCHAR(255),
      id_number VARCHAR(255),
      term VARCHAR(255),
      program_level ENUM('undergraduate', 'graduate'),
      program_id INT,
      selected_courses JSON,
      department VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tutees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      full_name VARCHAR(255),
      id_number VARCHAR(255),
      term VARCHAR(255),
      program_level ENUM('undergraduate', 'graduate'),
      program_id INT,
      selected_courses JSON,
      department VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS match_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tutor_email VARCHAR(255) NOT NULL,
      tutee_email VARCHAR(255) NOT NULL,
      unit VARCHAR(255) NOT NULL,
      mode VARCHAR(50) DEFAULT 'online',
      status ENUM('pending','accepted','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS matches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tutor_id INT,
      tutee_id INT,
      unit VARCHAR(255),
      mode VARCHAR(50),
      status ENUM('pending','accepted','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_match (tutor_id, tutee_id, unit)
    )
  `);
  
  console.log('Database tables ensured');
}
ensureTables().catch(console.error);

// ============ ROUTES ============
app.use('/api', programRoutes);
app.use('/', tuteeRoutes);
app.use('/', tutorRoutes);

// ============ PROGRAM COURSES ENDPOINT ============
app.get('/api/programs/:programId/courses', async (req, res) => {
    try {
        const { programId } = req.params;
        const [rows] = await pool.query(`
            SELECT 
                c.id,
                c.\`COL 2\` as unit_code,
                c.\`COL 3\` as unit_name
            FROM courses_1 c
            INNER JOIN program_courses pc ON c.id = pc.course_id
            WHERE pc.program_id = ?
            ORDER BY c.\`COL 3\`
        `, [programId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        res.json({ message: 'Database connected!', result: rows[0].solution });
    } catch (error) {
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
});

// ============ SIGNIN (TUTORS, TUTEES, AND ADMIN) ============
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // 1. Check for the hardcoded admin (optional – you could move admin to a DB table)
    if (email === "admin@usiu.ac.ke" && password === "PACS1234") {
        const token = jwt.sign(
            { id: 0, email, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            user: { id: 0, full_name: "Administrator", email, role: "admin" },
            token
        });
    }

    try {
        // 2. Search in tutors table
        const [tutors] = await pool.execute(
            "SELECT id, email, password, full_name, 'tutor' as role FROM tutors WHERE email = ?",
            [email]
        );

        // 3. Search in tutees table
        const [tutees] = await pool.execute(
            "SELECT id, email, password, full_name, 'tutee' as role FROM tutees WHERE email = ?",
            [email]
        );

        const userRecord = tutors[0] || tutees[0];

        if (!userRecord) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // 4. Compare password (assumes passwords are hashed with bcrypt)
        const passwordMatch = await bcrypt.compare(password, userRecord.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // 5. Remove password from user object
        const { password: _, ...userWithoutPassword } = userRecord;

        // 6. Generate JWT token
        const token = jwt.sign(
            { id: userRecord.id, email: userRecord.email, role: userRecord.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // 7. Send response
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ============ ADMIN OVERVIEW (ONLY TUTORS & TUTEES) ============
app.get("/admin/overview", async (req, res) => {
    try {
        // 1. Fetch all tutors
        const [tutors] = await pool.execute(`
            SELECT 
                id, 
                email, 
                COALESCE(full_name, 'N/A') AS name, 
                COALESCE(id_number, 'N/A') AS id_number, 
                COALESCE(term, 'N/A') AS term, 
                COALESCE(department, 'N/A') AS department,
                created_at
            FROM tutors 
            ORDER BY created_at DESC
        `);

        // 2. Fetch all tutees
        const [tutees] = await pool.execute(`
            SELECT 
                id, 
                email, 
                COALESCE(full_name, 'N/A') AS name, 
                COALESCE(id_number, 'N/A') AS id_number, 
                COALESCE(term, 'N/A') AS term, 
                COALESCE(department, 'N/A') AS department,
                created_at
            FROM tutees 
            ORDER BY created_at DESC
        `);

        // 3. Enrich tutors with their selected courses (as unit codes)
        const tutorsWithUnits = await Promise.all(tutors.map(async (tutor) => {
            const [courseRows] = await pool.execute(
                "SELECT selected_courses FROM tutors WHERE id = ?",
                [tutor.id]
            );
            let units = '';
            if (courseRows.length && courseRows[0].selected_courses) {
                const courseIds = JSON.parse(courseRows[0].selected_courses);
                if (courseIds.length > 0) {
                    const [courses] = await pool.query(`
                        SELECT \`COL 2\` as unit_code 
                        FROM courses_1 
                        WHERE id IN (?)
                    `, [courseIds]);
                    units = courses.map(c => c.unit_code).join(', ');
                }
            }
            return { ...tutor, units: units || 'N/A' };
        }));

        // 4. Enrich tutees with their selected courses
        const tuteesWithUnits = await Promise.all(tutees.map(async (tutee) => {
            const [courseRows] = await pool.execute(
                "SELECT selected_courses FROM tutees WHERE id = ?",
                [tutee.id]
            );
            let units = '';
            if (courseRows.length && courseRows[0].selected_courses) {
                const courseIds = JSON.parse(courseRows[0].selected_courses);
                if (courseIds.length > 0) {
                    const [courses] = await pool.query(`
                        SELECT \`COL 2\` as unit_code 
                        FROM courses_1 
                        WHERE id IN (?)
                    `, [courseIds]);
                    units = courses.map(c => c.unit_code).join(', ');
                }
            }
            return { ...tutee, units: units || 'N/A' };
        }));

        // 5. Response
        res.json({
            summary: {
                total_users: tutorsWithUnits.length + tuteesWithUnits.length,
                tutors: tutorsWithUnits.length,
                tutees: tuteesWithUnits.length
            },
            tutors: tutorsWithUnits,
            tutees: tuteesWithUnits
        });

    } catch (err) {
        console.error('Admin overview error:', err);
        res.status(500).json({ message: "Server error", error: String(err) });
    }
});

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
const PORT = 5001;
server.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('Server Status: RUNNING');
    console.log(`Backend Server:   http://localhost:${PORT}`);
    console.log(`Frontend (Vite):  http://localhost:5173`);
    console.log('='.repeat(60));
    console.log('Admin Login:  admin@usiu.ac.ke / PACS1234');
    console.log('='.repeat(60));
});