const pool = require('../models/db');
const { isProduction, isTest } = require('../config/env');

exports.info = async (req, res) => {
  try {
    if (isTest) {
      return res.status(200).json({ server: 'ok', db: 'skipped', env: 'test', dbPingMs: null });
    }
    const start = process.hrtime.bigint();
    const [[row]] = await pool.promise().query('SELECT 1 as db');
    const end = process.hrtime.bigint();
    return res.status(200).json({
      server: 'ok',
      db: row && row.db === 1 ? 'ok' : 'unknown',
      env: process.env.NODE_ENV || 'development',
      dbPingMs: Number(end - start) / 1e6,
    });
  } catch (e) {
    console.error('Status check failed:', e.message);
    // Driver messages carry host names, users and SQL text - keep them server-side.
    return res.status(503).json({
      server: 'ok',
      db: 'down',
      ...(isProduction ? {} : { error: e.message }),
      dbPingMs: -1,
    });
  }
};
