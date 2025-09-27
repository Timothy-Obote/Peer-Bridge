// server.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// Use a pool + promise API (more robust)
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "peerbridge",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}).promise();

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------------- SIGNUP ----------------
app.post("/signup", async (req, res) => {
  try {
    console.log("/signup body:", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashed]
    );

    console.log("Insert result:", result.insertId);
    res.status(201).json({ message: "User created successfully", user: { id: result.insertId, email } });
  } catch (err) {
    console.error(" /signup error:", err && err.code ? err.code : err);
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// ---------------- SIGNIN ----------------
app.post("/signin", async (req, res) => {
  try {
    console.log("/signin body:", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [rows] = await pool.execute("SELECT id, email, password FROM users WHERE email = ?", [email]);

    if (!rows || rows.length === 0) {
      console.log("🔍 No user found for:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      console.log("Password mismatch for:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("Login successful for:", email);
    // don't include password
    res.json({ message: "Login successful", user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("/signin error:", err);
    res.status(500).json({ message: "Server error", error: String(err) });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
