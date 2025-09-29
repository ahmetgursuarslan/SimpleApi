/* Simple seeder: inserts sample customers */
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const {
    DB_HOST = 'localhost',
    DB_USER = 'root',
    DB_PASSWORD = '',
    DB_NAME = 'simpleapi',
    DB_PORT = 3306,
  } = process.env;

  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
  });

  const sample = [
    ['Ayşe', 'Yılmaz', 25, 'female'],
    ['Mehmet', 'Demir', 40, 'male'],
    ['Elif', 'Kaya', 19, 'female'],
    ['Deniz', 'Arslan', 33, 'other'],
  ];

  await conn.query('DELETE FROM customer');
  for (const row of sample) {
    await conn.query(
      'INSERT INTO customer (customer_name, customer_surname, customer_age, customer_gender) VALUES (?, ?, ?, ?)',
      row
    );
  }

  console.log('Seed data inserted.');
  await conn.end();
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
