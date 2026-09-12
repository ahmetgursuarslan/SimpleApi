'use strict';

const crypto = require('crypto');
const { isProduction } = require('../config/env');

let warned = false;

/** Constant-time string compare that does not leak length via early return. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  // timingSafeEqual throws on length mismatch, so hash first to equalise length.
  const hashA = crypto.createHash('sha256').update(bufA).digest();
  const hashB = crypto.createHash('sha256').update(bufB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function extractKey(req) {
  const header = req.get('x-api-key');
  if (header) return header.trim();
  const auth = req.get('authorization');
  if (auth && /^bearer\s+/i.test(auth)) return auth.replace(/^bearer\s+/i, '').trim();
  return null;
}

/**
 * Guards state-changing endpoints.
 *
 * `API_KEY` is read per request so it can be rotated (and toggled in tests)
 * without a restart. When it is not configured the guard fails closed in
 * production and stays open in development/test so local setup needs no config.
 */
function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;

  if (!expected) {
    if (isProduction) {
      return res.status(503).json({
        message: 'Write operations are disabled: API_KEY is not configured.',
      });
    }
    if (!warned) {
      warned = true;
      console.warn(
        '[security] API_KEY is not set - write endpoints are unauthenticated. ' +
          'Set API_KEY before deploying.'
      );
    }
    return next();
  }

  const provided = extractKey(req);
  if (!provided || !safeEqual(provided, expected)) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="api"');
    return res.status(401).json({ message: 'Invalid or missing API key.' });
  }

  return next();
}

module.exports = { requireApiKey, __resetWarning: () => (warned = false) };
