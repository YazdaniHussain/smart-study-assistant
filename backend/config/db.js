const mysql  = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host              : process.env.DB_HOST,
  user              : process.env.DB_USER,
  password          : process.env.DB_PASSWORD,
  database          : process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit   : 10,
  timezone          : 'local',
  dateStrings       : true,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ MySQL Database connected successfully!');
  connection.release();
});

module.exports = pool.promise();