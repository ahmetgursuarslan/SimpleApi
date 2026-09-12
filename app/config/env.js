'use strict';

// dotenv v17 prints a banner on load unless silenced.
require('dotenv').config({ quiet: true });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

/** Parse a boolean-ish environment variable. */
function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

/** Parse an integer environment variable, falling back when absent/invalid. */
function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * `trust proxy` must be explicit: leaving it off breaks rate limiting behind a
 * load balancer, while blindly enabling it lets clients spoof X-Forwarded-For
 * and bypass the limiter. Accepts `false`, `true`, a hop count, or a CIDR list.
 */
function parseTrustProxy(raw) {
  if (raw === undefined || raw === '') return false;
  const value = String(raw).trim();
  if (['false', '0', 'no', 'off'].includes(value.toLowerCase())) return false;
  if (['true', '1', 'yes', 'on'].includes(value.toLowerCase())) return true;
  const hops = Number.parseInt(value, 10);
  if (String(hops) === value && hops >= 0) return hops;
  return value; // subnet name or comma-separated CIDR list, handled by proxy-addr
}

module.exports = {
  NODE_ENV,
  isProduction,
  isTest,
  toBool,
  toInt,
  PORT: toInt(process.env.PORT, 3000),
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
  BODY_LIMIT: process.env.BODY_LIMIT || '100kb',
  // Debug/introspection endpoints are opt-in and stay off in production.
  ENABLE_ECHO: toBool(process.env.ENABLE_ECHO, !isProduction),
  ENABLE_DOCS: toBool(process.env.ENABLE_DOCS, !isProduction),
};
