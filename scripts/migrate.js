/* Simple migration runner: creates database (if needed) and customer table using customer.sql */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const {
    DB_HOST = 'localhost',
    DB_USER = 'root',
    DB_PASSWORD = '',
    DB_NAME = 'simpleapi',
    DB_PORT = 3306,
  } = process.env;

  const sqlFile = path.resolve(__dirname, '..', 'customer.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
  });
  // Use identifier placeholders to avoid injection via DB_NAME
  await conn.query('CREATE DATABASE IF NOT EXISTS ??', [DB_NAME]);
  await conn.query('USE ??', [DB_NAME]);

  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await conn.query(stmt);
  }

  console.log('Migration applied.');
  await conn.end();
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
