const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Database connection
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

// Ensure tables exist
async function ensureTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('user','tutor','tutee','admin') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tutors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      id_number VARCHAR(255),
      term VARCHAR(255),
      department VARCHAR(255),
      units VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tutees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      id_number VARCHAR(255),
      term VARCHAR(255),
      department VARCHAR(255),
      units VARCHAR(255),
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
}
ensureTables().catch(console.error);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ================= USERS =================
app.post("/signup", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'user')",
      [full_name || "", email, hashed]
    );

    res.status(201).json({ message: "User created successfully", user: { id: result.insertId, full_name, email, role: "user" } });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Email already exists" });
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    // Hardcoded admin
    if (email === "admin@usiu.ac.ke" && password === "PACS1234") {
      return res.json({ message: "Admin login successful", user: { id: 0, full_name: "Administrator", email, role: "admin" } });
    }

    const [users] = await pool.execute("SELECT id, full_name, email, password, role FROM users WHERE email = ?", [email]);
    if (!users.length) return res.status(401).json({ message: "Invalid email or password" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    let role = user.role;
    let full_name = user.full_name || "";

    if (!role || role === "user") {
      const [tutorRows] = await pool.execute("SELECT full_name FROM tutors WHERE email = ?", [email]);
      const [tuteeRows] = await pool.execute("SELECT full_name FROM tutees WHERE email = ?", [email]);

      if (tutorRows.length) { role = "tutor"; full_name = tutorRows[0].full_name; }
      else if (tuteeRows.length) { role = "tutee"; full_name = tuteeRows[0].full_name; }
      else { role = "user"; }

      await pool.execute("UPDATE users SET role = ?, full_name = ? WHERE email = ?", [role, full_name, email]);
    }

    res.json({ message: "Login successful", user: { id: user.id, full_name, email, role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// ================= ADMIN OVERVIEW =================
app.get("/admin/overview", async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT u.id, COALESCE(u.full_name, t.full_name, te.full_name, 'N/A') AS full_name, u.email, u.role, u.created_at
      FROM users u
      LEFT JOIN tutors t ON u.email = t.email
      LEFT JOIN tutees te ON u.email = te.email
      ORDER BY u.created_at DESC
    `);

    const [tutors] = await pool.execute(`
      SELECT id, email, COALESCE(full_name, 'N/A') AS name, id_number, term, department, COALESCE(units, '-') AS units, created_at
      FROM tutors ORDER BY created_at DESC
    `);

    const [tutees] = await pool.execute(`
      SELECT id, email, COALESCE(full_name, 'N/A') AS name, id_number, term, department, COALESCE(units, '-') AS units, created_at
      FROM tutees ORDER BY created_at DESC
    `);

    res.json({ summary: { total_users: users.length, tutors: tutors.length, tutees: tutees.length }, users, tutors, tutees });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// ================= TUTOR / TUTEE REGISTRATION =================
app.post("/tutors", async (req, res) => {
  try {
    const { email, name, idNumber, term, department, selectedUnits } = req.body;
    if (!email || !name || !idNumber || !department) return res.status(400).json({ message: "Missing required fields" });

    const unitsString = Array.isArray(selectedUnits) ? selectedUnits.join(", ") : selectedUnits || "";

    const [result] = await pool.execute(
      "INSERT INTO tutors (email, full_name, id_number, term, department, units) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, idNumber, term, department, unitsString]
    );

    await pool.execute("UPDATE users SET role = 'tutor', full_name = ? WHERE email = ?", [name, email]);

    res.status(201).json({ message: "Tutor registered successfully", tutorId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

app.post("/tutees", async (req, res) => {
  try {
    const { email, name, idNumber, term, department, selectedUnit } = req.body;
    if (!email || !name || !idNumber || !department || !selectedUnit) return res.status(400).json({ message: "Missing required fields" });

    const [result] = await pool.execute(
      "INSERT INTO tutees (email, full_name, id_number, term, department, units) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, idNumber, term, department, selectedUnit]
    );

    await pool.execute("UPDATE users SET role = 'tutee', full_name = ? WHERE email = ?", [name, email]);

    res.status(201).json({ message: "Tutee registered successfully", tuteeId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// ================= MATCHING ENDPOINTS =================
app.get("/api/tutor/suggestions/:tutorId", async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    const [tutorRows] = await pool.execute("SELECT email, department, units FROM tutors WHERE id = ?", [tutorId]);
    if (!tutorRows.length) return res.status(404).json({ message: "Tutor not found" });

    const tutor = tutorRows[0];
    const [suggestions] = await pool.execute(`
      SELECT te.id AS tutee_id, te.full_name, te.units, te.email
      FROM tutees te
      WHERE te.department = ?
      AND (
        FIND_IN_SET(SUBSTRING_INDEX(te.units, ',', 1), ?) > 0
        OR FIND_IN_SET(SUBSTRING_INDEX(te.units, ',', -1), ?) > 0
      )
      AND te.email NOT IN (SELECT tutee_email FROM match_requests WHERE tutor_email = ? AND status = 'pending')
    `, [tutor.department, tutor.units, tutor.units, tutor.email]);

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
});

app.post("/api/match-request", async (req, res) => {
  try {
    const { tutorEmail, tuteeEmail, unit, mode } = req.body;
    if (!tutorEmail || !tuteeEmail || !unit || !mode) return res.status(400).json({ message: "Missing fields" });

    await pool.execute(
      "INSERT INTO match_requests (tutor_email, tutee_email, unit, status, mode) VALUES (?, ?, ?, 'pending', ?)",
      [tutorEmail, tuteeEmail, unit, mode]
    );

    res.json({ message: "Match request sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send request" });
  }
});

app.get("/api/tutee/requests/:tuteeEmail", async (req, res) => {
  try {
    const tuteeEmail = req.params.tuteeEmail;
    const [requests] = await pool.execute(
      "SELECT id, tutor_email, unit, mode, created_at FROM match_requests WHERE tutee_email = ? AND status = 'pending'",
      [tuteeEmail]
    );
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

app.post("/api/match-request/:id/accept", async (req, res) => {
  const requestId = req.params.id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [requestRows] = await conn.execute("SELECT * FROM match_requests WHERE id = ?", [requestId]);
    if (!requestRows.length) { await conn.rollback(); return res.status(404).json({ message: "Request not found" }); }
    const request = requestRows[0];

    await conn.execute("UPDATE match_requests SET status = 'accepted' WHERE id = ?", [requestId]);

    const [tutorRows] = await conn.execute("SELECT id FROM tutors WHERE email = ?", [request.tutor_email]);
    const [tuteeRows] = await conn.execute("SELECT id FROM tutees WHERE email = ?", [request.tutee_email]);
    if (!tutorRows.length || !tuteeRows.length) { await conn.rollback(); return res.status(404).json({ message: "Tutor or Tutee not found" }); }

    await conn.execute(
      "INSERT INTO matches (tutor_id, tutee_id, unit, status, mode, created_at) VALUES (?, ?, ?, 'accepted', ?, NOW())",
      [tutorRows[0].id, tuteeRows[0].id, request.unit, request.mode]
    );

    await conn.commit();
    res.json({ message: "Match accepted and confirmed" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Failed to accept match" });
  } finally {
    conn.release();
  }
});

app.post("/api/match-request/:id/reject", async (req, res) => {
  try {
    const requestId = req.params.id;
    await pool.execute("UPDATE match_requests SET status = 'rejected' WHERE id = ?", [requestId]);
    res.json({ message: "Match request rejected" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject request" });
  }
});

app.get("/api/matches", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email required" });

    const [matches] = await pool.execute(`
      SELECT m.id AS match_id, t.full_name AS tutor_name, te.full_name AS tutee_name, m.unit, m.mode, m.status, m.created_at
      FROM matches m
      LEFT JOIN tutors t ON m.tutor_id = t.id
      LEFT JOIN tutees te ON m.tutee_id = te.id
      WHERE t.email = ? OR te.email = ?
      ORDER BY m.created_at DESC
    `, [email, email]);

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch matches" });
  }
});

// Start server
const PORT = 5000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
