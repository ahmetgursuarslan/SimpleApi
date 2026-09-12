const mysql = require('mysql2');
const dbConfig = require('../config/db.config.js');
const { isTest } = require('../config/env');

// Create a connection pool
const pool = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  port: dbConfig.PORT,
  connectionLimit: dbConfig.CONNECTION_LIMIT,
  connectTimeout: dbConfig.CONNECT_TIMEOUT,
  supportBigNumbers: true,
  waitForConnections: true,
  queueLimit: 0,
  // NOTE: do not enable `namedPlaceholders` here. No query in this codebase uses
  // `:name` placeholders, and turning it on silently breaks positional `?`
  // expansion (an object passed for `SET ?` serialises to `SET NULL`).
  // Defence in depth: stacked statements turn any injection into arbitrary SQL.
  multipleStatements: false,
  ...(dbConfig.SSL ? { ssl: { rejectUnauthorized: dbConfig.SSL_REJECT_UNAUTHORIZED } } : {}),
});

// Fail fast on a bad DSN, but stay quiet under test where the pool is mocked.
if (!isTest) {
  pool.getConnection((err, conn) => {
    if (err) {
      console.error('Database connection failed:', err.message);
    } else {
      console.log('Successfully connected to the database.');
      conn.release();
    }
  });
}

module.exports = pool;
