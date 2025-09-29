const pool = require('../models/db');

exports.info = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ server: 'ok', db: 'skipped', env: 'test', dbPingMs: null });
    }
    const start = process.hrtime.bigint();
    const [[row]] = await pool.promise().query('SELECT 1 as db');
    const end = process.hrtime.bigint();
    res.status(200).json({
      server: 'ok',
      db: row && row.db === 1 ? 'ok' : 'unknown',
      env: process.env.NODE_ENV || 'development',
      dbPingMs: Number(end - start) / 1e6,
    });
  } catch (e) {
    res.status(500).json({ server: 'ok', db: 'down', error: e.message, dbPingMs: -1 });
  }
};
