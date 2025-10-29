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

// Active socket tracking
const activeSockets = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("registerUser", (email) => {
    if (email) {
      activeSockets.set(email, socket.id);
      console.log("Registered socket for", email);
    }
  });

  socket.on("disconnect", () => {
    for (const [email, id] of activeSockets.entries()) {
      if (id === socket.id) activeSockets.delete(email);
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// Ensure tables exist
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
}
ensureTables().catch(console.error);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Signup route — registers user with default 'user' role
app.post("/signup", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'user')",
      [full_name || "", email, hashed]
    );

    res.status(201).json({
      message: "User created successfully",
      user: { id: result.insertId, full_name, email, role: "user" },
    });
  } catch (err) {
    console.error("/signup error:", err);
    if (err.code === "ER_DUP_ENTRY")
      return res.status(400).json({ message: "Email already exists" });
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Signin — authenticates and redirects users by role
app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    // Admin hardcoded login
    if (email === "admin@usiu.ac.ke" && password === "PACS1234") {
      return res.json({
        message: "Admin login successful",
        user: { id: 0, full_name: "Administrator", email, role: "admin" },
      });
    }

    const [users] = await pool.execute(
      "SELECT id, full_name, email, password, role FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password" });

    let role = user.role;
    let full_name = user.full_name || "";

    // Resolve missing roles dynamically
    if (!role || role === "user") {
      const [tutorRows] = await pool.execute(
        "SELECT name FROM tutors WHERE email = ?",
        [email]
      );
      const [tuteeRows] = await pool.execute(
        "SELECT name FROM tutees WHERE email = ?",
        [email]
      );

      if (tutorRows.length > 0) {
        role = "tutor";
        full_name = tutorRows[0].name;
      } else if (tuteeRows.length > 0) {
        role = "tutee";
        full_name = tuteeRows[0].name;
      } else {
        role = "user";
      }

      await pool.execute("UPDATE users SET role = ?, full_name = ? WHERE email = ?", [
        role,
        full_name,
        email,
      ]);
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        full_name,
        email: user.email,
        role,
      },
    });
  } catch (err) {
    console.error("/signin error:", err);
    res
      .status(500)
      .json({ message: "Server error during sign-in", error: String(err) });
  }
});

// Admin overview
app.get("/admin/overview", async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, full_name, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    const [tutors] = await pool.execute(`
      SELECT id, email, name, id_number, term, department, units, created_at
      FROM tutors 
      ORDER BY created_at DESC
    `);

    const [tutees] = await pool.execute(`
      SELECT id, email, name, id_number, term , department, unit, created_at
      FROM tutees 
      ORDER BY created_at DESC
    `);

    const summary = {
      total_users: users.length,
      tutors: tutors.length,
      tutees: tutees.length,
    };

    res.json({ summary, users, tutors, tutees });
  } catch (err) {
    console.error("/admin/overview error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Tutor registration
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

    await pool.execute(
      "UPDATE users SET role = 'tutor', full_name = ? WHERE email = ?",
      [name, email]
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

    await pool.execute(
      "UPDATE users SET role = 'tutee', full_name = ? WHERE email = ?",
      [name, email]
    );

    res.status(201).json({ message: "Tutee registered successfully", tuteeId: result.insertId });
  } catch (err) {
    console.error("/tutees error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Matches routes
app.get("/matches", async (req, res) => {
  try {
    const { email } = req.query;
    const [rows] = await pool.execute(
      "SELECT * FROM match_requests WHERE tutor_email = ? OR tutee_email = ?",
      [email, email]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching matches:", err);
    res.status(500).json({ message: "Server error fetching matches" });
  }
});

app.put("/matches/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("UPDATE match_requests SET status = 'accepted' WHERE id = ?", [id]);
    res.json({ message: "Match accepted" });
  } catch (err) {
    console.error("Error accepting match:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/matches/:id/decline", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("UPDATE match_requests SET status = 'declined' WHERE id = ?", [id]);
    res.json({ message: "Match declined" });
  } catch (err) {
    console.error("Error declining match:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
