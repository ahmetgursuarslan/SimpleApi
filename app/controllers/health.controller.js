const pool = require('../models/db');

exports.ping = async (req, res) => {
  const start = process.hrtime.bigint();
  let dbMs = null;
  if (process.env.NODE_ENV !== 'test') {
    try {
      const [[row]] = await pool.promise().query('SELECT 1 as db');
      void row;
      const end = process.hrtime.bigint();
      dbMs = Number(end - start) / 1e6;
    } catch (e) {
      dbMs = -1; // indicate failure
    }
  }
  res.status(200).json({ status: 'ok', time: new Date().toISOString(), dbPingMs: dbMs });
};

exports.readiness = (req, res) => {
  res.status(200).json({ ready: true });
};

exports.liveness = (req, res) => {
  res.status(200).json({ alive: true });
};
