const { Pool } = require('pg');
require('dotenv').config();

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('No DATABASE_URL in environment');
  process.exit(1);
}

async function testConfig(useSSL) {
  const pool = new Pool({ connectionString: conn, ssl: useSSL ? { rejectUnauthorized: false } : false, connectionTimeoutMillis: 5000 });
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT 1 AS x');
    console.log(`SSL=${useSSL} -> OK:`, res.rows[0]);
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.error(`SSL=${useSSL} -> ERROR:`, err.message || err);
    try { await pool.end(); } catch(e) {}
    return false;
  }
}

(async () => {
  console.log('Testing DB connection with SSL=false');
  await testConfig(false);
  console.log('\nTesting DB connection with SSL=true');
  await testConfig(true);
})();
