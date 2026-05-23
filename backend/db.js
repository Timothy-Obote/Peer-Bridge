// db.js
const dns = require('node:dns');
const { Pool } = require('pg');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Supabase pooler connections are often more stable over IPv4 on local Windows setups.
dns.setDefaultResultOrder('ipv4first');

const connectionString = process.env.DATABASE_URL || '';
const originalConnectionString = process.env.DATABASE_URL || '';
// Avoid conflicting SSL behavior from URL params like sslmode=require.
const sanitizedConnectionString = connectionString
    .replace(/([?&])sslmode=[^&]*/i, '$1')
    .replace(/[?&]$/, '');

// Allow explicit control of SSL via env var `DB_SSL` (set to 'true')
// or autodetect from the original connection string containing sslmode=require.
const useSSL = process.env.DB_SSL === 'true' || /sslmode=require/i.test(originalConnectionString);

const pool = new Pool({
    connectionString: sanitizedConnectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err.stack);
    } else {
        console.log('Connected to PostgreSQL database');
        release();
    }
});

module.exports = pool;
