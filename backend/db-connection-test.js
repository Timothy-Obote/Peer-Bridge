const { Pool } = require('pg');
require('dotenv').config();
const connectionString = process.env.DATABASE_URL || '';
const sanitizedConnectionString = connectionString.replace(/([?&])sslmode=[^&]*/i, '$1').replace(/[?&]$/, '');
const pool = new Pool({ connectionString: sanitizedConnectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
(async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT 1');
    console.log('Query success', res.rows);
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Connection test failed:', err);
    process.exit(1);
  }
})();
