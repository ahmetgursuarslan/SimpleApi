const mysql = require('mysql2');
const dbConfig = require('../config/db.config.js');

// Create a connection pool
const pool = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  port: dbConfig.PORT,
  connectionLimit: dbConfig.CONNECTION_LIMIT,
  supportBigNumbers: true,
  waitForConnections: true,
  queueLimit: 0,
  // Enable named placeholders for safer query composition when needed
  namedPlaceholders: true,
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Successfully connected to the database.');
    conn.release();
  }
});

module.exports = pool;
