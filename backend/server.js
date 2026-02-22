const express = require("express");
const cors = require("cors");
const pool = require('./db'); // single pool import from db.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
require("dotenv").config();

// Import route files
const programRoutes = require('./routes/programs');
const tuteeRoutes = require('./routes/tutees');
const tutorRoutes = require('./routes/tutors');

const app = express();

// ============ AUTHENTICATION MIDDLEWARE ============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============ MIDDLEWARE ============
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5001',
        'https://peerbridgepacs.vercel.app',
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
            debug_programs: "/debug/programs",
            suggestions: "/api/suggestions/:tutorId",
            accept_suggestion: "/api/suggestions/:id/accept",
            reject_suggestion: "/api/suggestions/:id/reject",
            run_matching: "/api/matching/run"
        }
    });
});

const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: [
            'http://localhost:5173', 
            'http://127.0.0.1:5173',
            'https://peerbridgepacs.vercel.app'
        ],
        credentials: true,
        methods: ["GET", "POST"] 
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

// ============ ROUTES (old, may still work) ============
app.use('/api', programRoutes);
app.use('/', tuteeRoutes);
app.use('/', tutorRoutes);

// ============ OLD ENDPOINTS (keep for now) ============
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
        console.error('Error in /api/programs/:programId/courses:', error);
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});

app.get('/debug/programs', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM programs LIMIT 10');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Debug programs error:', error);
        res.status(500).json({ success: false, error: error.message });
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

// ============ UPDATED ADMIN OVERVIEW (using new schema) ============
app.get("/admin/overview", async (req, res) => {
    try {
        // Fetch all users with their roles and departments
        const users = await pool.query(`
            SELECT u.id, u.email, u.name, u.role, u.program_level, u.term, u.created_at,
                   d.name as department,
                   COALESCE(u.program_id::text, 'N/A') as program_id
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            ORDER BY u.created_at DESC
        `);

        // For each user, get their selected courses
        const usersWithCourses = await Promise.all(users.rows.map(async (user) => {
            let courses = [];
            if (user.role === 'tutor') {
                const result = await pool.query(`
                    SELECT c.code, c.name
                    FROM tutor_courses tc
                    JOIN courses c ON tc.course_id = c.id
                    WHERE tc.tutor_id = $1
                `, [user.id]);
                courses = result.rows.map(r => `${r.code} - ${r.name}`).join(', ') || 'None';
            } else if (user.role === 'tutee') {
                const result = await pool.query(`
                    SELECT c.code, c.name
                    FROM tutee_courses tc
                    JOIN courses c ON tc.course_id = c.id
                    WHERE tc.tutee_id = $1
                `, [user.id]);
                courses = result.rows.map(r => `${r.code} - ${r.name}`).join(', ') || 'None';
            }
            return { ...user, units: courses };
        }));

        const tutors = usersWithCourses.filter(u => u.role === 'tutor');
        const tutees = usersWithCourses.filter(u => u.role === 'tutee');

        res.json({
            summary: {
                total_users: usersWithCourses.length,
                tutors: tutors.length,
                tutees: tutees.length
            },
            tutors,
            tutees
        });
    } catch (err) {
        console.error('Admin overview error:', err);
        res.status(500).json({ message: "Server error", error: String(err) });
    }
});

// ============ UPDATED SIGNIN (using users table) ============
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // Admin hardcoded (kept for compatibility)
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
        // Query the users table
        const result = await pool.query(
            `SELECT id, email, password, name as full_name, role 
             FROM users 
             WHERE email = $1`,
            [email]
        );

        const userRecord = result.rows[0];
        if (!userRecord) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const passwordMatch = await bcrypt.compare(password, userRecord.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const { password: _, ...userWithoutPassword } = userRecord;

        const token = jwt.sign(
            { id: userRecord.id, email: userRecord.email, role: userRecord.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

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

// ============ SIGNUP (basic, creates a user with role 'pending') ============
app.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password required" });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO users (email, password, role) VALUES ($1, $2, 'pending')",
            [email, hashedPassword]
        );
        res.status(201).json({ success: true, message: "User created. Please complete your profile." });
    } catch (error) {
        if (error.code === '23505') { // unique violation
            return res.status(400).json({ success: false, message: "Email already exists" });
        }
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ============ MATCHING LOGIC FUNCTIONS ============
const matching = require('./matching');

// ============ NEW MATCHING ENDPOINTS ============

// Trigger matching manually (admin only – you should add auth middleware)
app.post('/api/matching/run', async (req, res) => {
    try {
        await matching.autoMatch();
        await matching.generateSuggestions();
        res.json({ message: 'Matching and suggestions completed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get pending suggestions for a specific tutor
app.get('/api/suggestions/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const suggestions = await pool.query(`
            SELECT s.id, s.tutee_id, s.course_id, c.code, c.name, s.status, s.created_at
            FROM suggestions s
            JOIN courses c ON s.course_id = c.id
            WHERE s.tutor_id = $1 AND s.status = 'pending'
            ORDER BY s.created_at DESC
        `, [tutorId]);
        res.json(suggestions.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Accept a suggestion
app.post('/api/suggestions/:id/accept', async (req, res) => {
    try {
        const result = await matching.acceptSuggestion(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Reject a suggestion
app.post('/api/suggestions/:id/reject', async (req, res) => {
    try {
        await pool.query(
            `UPDATE suggestions SET status = 'rejected' WHERE id = $1`,
            [req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all matches for a user (tutor or tutee)
app.get('/api/matches/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const matches = await pool.query(`
            SELECT m.id, m.tutor_id, m.tutee_id, m.created_at,
                   json_agg(json_build_object('code', c.code, 'name', c.name)) as courses
            FROM matches m
            JOIN match_courses mc ON m.id = mc.match_id
            JOIN courses c ON mc.course_id = c.id
            WHERE m.tutor_id = $1 OR m.tutee_id = $1
            GROUP BY m.id
        `, [userId]);
        res.json(matches.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Optional: scheduled matching (runs every hour)
cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled matching...');
    try {
        await matching.autoMatch();
        await matching.generateSuggestions();
    } catch (err) {
        console.error('Scheduled matching error:', err);
    }
});

// ============ TUTEE SPECIFIC ENDPOINTS ============

// Get matches for a specific tutee (by tutee_id)
app.get('/api/matches/tutee/:tuteeId', authenticateToken, async (req, res) => {
  const { tuteeId } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT m.id, m.tutor_id, m.tutee_id, m.created_at,
             json_agg(json_build_object('code', c.code, 'name', c.name)) as courses
      FROM matches m
      JOIN match_courses mc ON m.id = mc.match_id
      JOIN courses c ON mc.course_id = c.id
      WHERE m.tutee_id = $1
      GROUP BY m.id
    `, [tuteeId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending suggestions for a tutee
app.get('/api/suggestions/tutee/:tuteeId', authenticateToken, async (req, res) => {
  const { tuteeId } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.tutor_id, s.course_id, c.code, c.name, s.status, s.created_at
      FROM suggestions s
      JOIN courses c ON s.course_id = c.id
      WHERE s.tutee_id = $1 AND s.status = 'pending'
      ORDER BY s.created_at DESC
    `, [tuteeId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get courses needed by a tutee
app.get('/api/tutee/:id/courses', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.code, c.name
      FROM tutee_courses tc
      JOIN courses c ON tc.course_id = c.id
      WHERE tc.tutee_id = $1
    `, [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update (replace) courses needed by a tutee
app.put('/api/tutee/:id/courses', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { courseIds } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tutee_courses WHERE tutee_id = $1', [id]);
    for (const courseId of courseIds) {
      await client.query(
        'INSERT INTO tutee_courses (tutee_id, course_id) VALUES ($1, $2)',
        [id, courseId]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============ PROFILE & COURSES ENDPOINTS ============

// Get user by ID
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { id } = req.params;
    const user = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.department_id, d.name as department,
              u.program_level, u.term
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [id]
    );
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { id } = req.params;
  const { name, department_id, term } = req.body;
  try {
    await pool.query(
      `UPDATE users SET name = $1, department_id = $2, term = $3 WHERE id = $4`,
      [name, department_id, term, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all departments
app.get('/api/departments', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM departments ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, code, name FROM courses ORDER BY code');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get courses offered by a specific tutor (protected)
app.get('/api/tutor/:id/courses', authenticateToken, async (req, res) => {
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.code, c.name
       FROM tutor_courses tc
       JOIN courses c ON tc.course_id = c.id
       WHERE tc.tutor_id = $1`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update (replace) courses offered by a tutor
app.put('/api/tutor/:id/courses', authenticateToken, async (req, res) => {
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { id } = req.params;
  const { courseIds } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tutor_courses WHERE tutor_id = $1', [id]);
    for (const courseId of courseIds) {
      await client.query(
        'INSERT INTO tutor_courses (tutor_id, course_id) VALUES ($1, $2)',
        [id, courseId]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============ 404 HANDLER ============
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
    console.log('Admin Login:  admin@usiu.ac.ke / PACS1234');
    console.log('='.repeat(60));
});