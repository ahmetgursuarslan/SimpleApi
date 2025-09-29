require('dotenv').config();

module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || '',
  DB: process.env.DB_NAME || 'simpleapi',
  PORT: process.env.DB_PORT || '3306',
  CONNECTION_LIMIT: Number(process.env.DB_CONNECTION_LIMIT || 10),
};
