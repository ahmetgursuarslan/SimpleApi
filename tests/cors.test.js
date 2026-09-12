// CORS behaviour depends on env read at module load, so each block configures
// the environment before requiring a fresh copy of the app.
jest.mock('../app/models/db.js', () => ({
  query: (sql, params, cb) => (typeof params === 'function' ? params : cb)(null, []),
  promise: () => ({ query: () => Promise.resolve([[{ db: 1 }], []]) }),
  getConnection: (cb) => cb(null, { release() {} }),
  end: (cb) => cb && cb(),
}));

const request = require('supertest');

const ORIGINAL_ENV = { ...process.env };

function loadApp(overrides) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...overrides };
  return require('../app/app').app;
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe('CORS allow-list', () => {
  const env = { CORS_ORIGINS: 'https://allowed.example' };

  it('allows a listed origin', async () => {
    const res = await request(loadApp(env)).get('/').set('Origin', 'https://allowed.example');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://allowed.example');
  });

  it('rejects an unlisted origin with 403, not 500', async () => {
    const res = await request(loadApp(env)).get('/').set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/CORS/);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows requests without an Origin header (curl, server-to-server)', async () => {
    const res = await request(loadApp(env)).get('/');
    expect(res.status).toBe(200);
  });
});

describe('CORS misconfiguration guards', () => {
  it('refuses to start with wildcard origins plus credentials', () => {
    expect(() => loadApp({ CORS_ORIGINS: '*', CORS_CREDENTIALS: 'true' })).toThrow(
      /cannot be combined with a wildcard/i
    );
  });

  it('refuses to start with wildcard origins in production', () => {
    expect(() => loadApp({ NODE_ENV: 'production', CORS_ORIGINS: '*' })).toThrow(
      /not allowed in production/i
    );
  });
});
