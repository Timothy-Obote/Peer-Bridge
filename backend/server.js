// server.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Database connection
const pool = mysql
  .createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "peerbridge",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

// Track connected users
const activeSockets = new Map();

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("registerUser", (email) => {
    if (email) {
      activeSockets.set(email, socket.id);
      console.log("Registered socket for", email, socket.id);
    }
  });

  socket.on("disconnect", () => {
    for (const [email, id] of activeSockets.entries()) {
      if (id === socket.id) activeSockets.delete(email);
    }
    console.log("socket disconnected:", socket.id);
  });
});

// Ensure essential tables exist
async function ensureTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS matches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tutor_id INT,
      tutee_id INT,
      unit VARCHAR(255),
      status ENUM('pending','accepted','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_match (tutor_id, tutee_id, unit)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS match_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tutor_email VARCHAR(255) NOT NULL,
      tutee_email VARCHAR(255) NOT NULL,
      unit VARCHAR(255) NOT NULL,
      status ENUM('pending','accepted','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
ensureTables().catch(console.error);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashed]
    );

    res.status(201).json({ message: "User created", user: { id: result.insertId, email } });
  } catch (err) {
    console.error("/signup error:", err);
    if (err.code === "ER_DUP_ENTRY")
      return res.status(400).json({ message: "Email already exists" });
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Signin
app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    // Check for admin login
    if (email === "admin@usiu.ac.ke" && password === "PACS1234") {
      return res.json({
        message: "Admin login successful",
        user: {
          id: "admin",
          email,
          role: "admin",
        },
      });
    }

    // Normal user login
    const [rows] = await pool.execute(
      "SELECT id, email, password FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password" });

    return res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role: "user" },
    });
  } catch (err) {
    console.error("/signin error:", err);
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
});


// Admin overview
app.get("/admin/overview", async (req, res) => {
  try {
    const [tutors] = await pool.execute("SELECT * FROM tutors");
    const [tutees] = await pool.execute("SELECT * FROM tutees");
    res.json({ tutors, tutees });
  } catch (err) {
    console.error("/admin/overview error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Tutor registration (stores selectedUnits directly in tutors table)
app.post("/tutors", async (req, res) => {
  try {
    const { email, name, idNumber, term, department, selectedUnits } = req.body;

    if (!email || !name || !idNumber || !department)
      return res.status(400).json({ message: "Missing required fields" });

    const unitsString = Array.isArray(selectedUnits)
      ? selectedUnits.join(", ")
      : selectedUnits || "";

    const [result] = await pool.execute(
      "INSERT INTO tutors (email, name, id_number, term, department, units) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, idNumber, term, department, unitsString]
    );

    res.status(201).json({ message: "Tutor registered successfully", tutorId: result.insertId });
  } catch (err) {
    console.error("/tutors error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Tutee registration
app.post("/tutees", async (req, res) => {
  try {
    const { email, name, idNumber, term, department, selectedUnit } = req.body;

    if (!email || !name || !idNumber || !department || !selectedUnit)
      return res.status(400).json({ message: "Missing required fields" });

    const [result] = await pool.execute(
      "INSERT INTO tutees (email, name, id_number, term, department, unit) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, idNumber, term, department, selectedUnit]
    );

    res.status(201).json({ message: "Tutee registered successfully", tuteeId: result.insertId });
  } catch (err) {
    console.error("/tutees error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Recommendation (uses tutors.units column)
app.get("/recommend/:role/:department/:unit", async (req, res) => {
  try {
    const { role, department, unit } = req.params;

    if (role === "tutor") {
      const [rows] = await pool.execute(
        "SELECT id, name, email, unit FROM tutees WHERE department = ? AND unit = ?",
        [department, unit]
      );
      return res.json({ availableTutees: rows });
    }

    if (role === "tutee") {
      const [rows] = await pool.execute(
        "SELECT id, name, email, units FROM tutors WHERE department = ? AND FIND_IN_SET(?, REPLACE(units, ', ', ','))",
        [department, unit]
      );
      return res.json({ availableTutors: rows });
    }

    res.status(400).json({ message: "Invalid role" });
  } catch (err) {
    console.error("/recommend error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Match request
app.post("/match-request", async (req, res) => {
  try {
    const { tutorEmail, tuteeEmail, unit } = req.body;
    if (!tutorEmail || !tuteeEmail || !unit)
      return res.status(400).json({ message: "Missing required fields" });

    await pool.execute(
      "INSERT INTO match_requests (tutor_email, tutee_email, unit) VALUES (?, ?, ?)",
      [tutorEmail, tuteeEmail, unit]
    );

    const socketId = activeSockets.get(tuteeEmail);
    if (socketId) {
      io.to(socketId).emit("matchRequestReceived", { tutorEmail, unit });
    }

    res.status(201).json({ message: "Match request sent successfully" });
  } catch (err) {
    console.error("/match-request error:", err);
    res.status(500).json({ message: "Server error while sending match request", error: String(err) });
  }
});

// Fetch matches
app.get("/matches/:role/:id", async (req, res) => {
  try {
    const { role, id } = req.params;

    if (role === "tutor") {
      const [rows] = await pool.execute(
        `SELECT m.id as match_id, m.unit, m.status, m.created_at,
         tutee.id AS tutee_id, tutee.name AS tutee_name, tutee.email AS tutee_email
         FROM matches m
         JOIN tutees tutee ON m.tutee_id = tutee.id
         WHERE m.tutor_id = ? ORDER BY m.created_at DESC`,
        [id]
      );
      return res.json({ matches: rows });
    } else if (role === "tutee") {
      const [rows] = await pool.execute(
        `SELECT m.id as match_id, m.unit, m.status, m.created_at,
         tutor.id AS tutor_id, tutor.name AS tutor_name, tutor.email AS tutor_email
         FROM matches m
         JOIN tutors tutor ON m.tutor_id = tutor.id
         WHERE m.tutee_id = ? ORDER BY m.created_at DESC`,
        [id]
      );
      return res.json({ matches: rows });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }
  } catch (err) {
    console.error("/matches error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Accept / Reject match
app.post("/matches/:id/accept", async (req, res) => {
  try {
    const matchId = req.params.id;
    await pool.execute("UPDATE matches SET status = 'accepted' WHERE id = ?", [matchId]);
    res.json({ message: "Match accepted" });
  } catch (err) {
    console.error("/matches/accept error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

app.post("/matches/:id/reject", async (req, res) => {
  try {
    const matchId = req.params.id;
    await pool.execute("UPDATE matches SET status = 'rejected' WHERE id = ?", [matchId]);
    res.json({ message: "Match rejected" });
  } catch (err) {
    console.error("/matches/reject error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
