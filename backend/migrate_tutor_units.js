// migrate_tutor_units.js
const mysql = require("mysql2/promise");

(async () => {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "peerbridge",
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    const [rows] = await pool.execute("SELECT id, units FROM tutors_backup"); // use backup table
    for (const row of rows) {
      if (!row.units) continue;
      const units = row.units.split(",").map(u => u.trim()).filter(Boolean);
      for (const unit of units) {
        // avoid duplicates
        await pool.execute(
          `INSERT IGNORE INTO tutor_units (tutor_id, unit) VALUES (?, ?)`,
          [row.id, unit]
        );
      }
    }
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
})();
