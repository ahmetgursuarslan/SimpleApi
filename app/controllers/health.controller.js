const pool = require('../models/db');
const { isTest } = require('../config/env');

exports.ping = async (req, res) => {
  let dbMs = null;
  if (!isTest) {
    const start = process.hrtime.bigint();
    try {
      await pool.promise().query('SELECT 1 as db');
      dbMs = Number(process.hrtime.bigint() - start) / 1e6;
    } catch (e) {
      console.error('Health DB ping failed:', e.message);
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
