'use strict';

const { ENABLE_ECHO } = require('../config/env');

// Reflecting these back would hand an attacker the caller's credentials, and
// makes the endpoint a convenient oracle for anyone who can trigger a request.
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'proxy-authorization',
  'x-api-key',
  'x-auth-token',
  'x-csrf-token',
  'x-forwarded-authorization',
]);

function redactHeaders(headers) {
  const safe = {};
  for (const [name, value] of Object.entries(headers)) {
    safe[name] = SENSITIVE_HEADERS.has(name.toLowerCase()) ? '[REDACTED]' : value;
  }
  return safe;
}

exports.echo = (req, res) => {
  if (!ENABLE_ECHO) {
    return res.status(404).json({ message: 'Not Found' });
  }

  return res.json({
    method: req.method,
    path: req.path,
    query: req.query,
    headers: redactHeaders(req.headers),
    body: req.body ?? null,
  });
};

exports.redactHeaders = redactHeaders;
