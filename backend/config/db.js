const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host    : process.env.DB_HOST,
  port    : process.env.DB_PORT || 3306,
  user    : process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl     : { rejectUnauthorized: false },
  dateStrings: true,
  timezone   : 'local',
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0
});

// ── Test Connection ────────────────────────────────────
pool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL Database connected successfully! (Aiven Cloud)');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;