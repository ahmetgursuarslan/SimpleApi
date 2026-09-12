const { toBool, toInt } = require('./env');

module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || '',
  DB: process.env.DB_NAME || 'simpleapi',
  PORT: toInt(process.env.DB_PORT, 3306),
  CONNECTION_LIMIT: toInt(process.env.DB_CONNECTION_LIMIT, 10),
  CONNECT_TIMEOUT: toInt(process.env.DB_CONNECT_TIMEOUT, 10000),
  // Encrypt the DB connection (set DB_SSL=true for any non-local database).
  // DB_SSL_REJECT_UNAUTHORIZED must stay true unless you pin a private CA.
  SSL: toBool(process.env.DB_SSL, false),
  SSL_REJECT_UNAUTHORIZED: toBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, true),
};
