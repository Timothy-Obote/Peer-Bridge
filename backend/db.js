const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,  // Render provides this automatically
    ssl: {
        rejectUnauthorized: false  // Required for Render's self-signed cert
    }
});

module.exports = pool;