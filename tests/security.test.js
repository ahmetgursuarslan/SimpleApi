const request = require('supertest');

jest.mock('../app/models/db.js', () => {
  let failWith = null;
  let lastSql = null;
  let lastParams = null;

  const row = {
    id: 1,
    customer_name: 'Ali',
    customer_surname: 'Veli',
    customer_age: 30,
    customer_gender: 'male',
  };

  const pool = {
    query(sql, params, cb) {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      lastSql = sql;
      lastParams = params;
      if (failWith) return cb(failWith, null);
      if (sql.startsWith('SELECT COUNT(*) as total FROM customer')) return cb(null, [{ total: 1 }]);
      if (sql.startsWith('INSERT INTO customer (')) return cb(null, { insertId: 7 });
      if (sql.startsWith('UPDATE customer SET')) return cb(null, { affectedRows: 1 });
      if (sql.startsWith('DELETE FROM customer WHERE id =')) return cb(null, { affectedRows: 1 });
      if (sql.startsWith('DELETE FROM customer')) return cb(null, { affectedRows: 3 });
      return cb(null, [row]);
    },
    promise: () => ({ query: () => Promise.resolve([[{ db: 1 }], []]) }),
    getConnection: (cb) => cb(null, { release() {} }),
    end: (cb) => cb && cb(),
    __setFailure: (e) => {
      failWith = e;
    },
    __lastSql: () => lastSql,
    __lastParams: () => lastParams,
  };
  return pool;
});

const mockPool = require('../app/models/db.js');
const { app } = require('../app/app');

const validBody = {
  customer_name: 'Ali',
  customer_surname: 'Veli',
  customer_age: 30,
  customer_gender: 'male',
};

describe('Sensitive header disclosure', () => {
  it('POST /api/echo redacts credential headers instead of reflecting them', async () => {
    const res = await request(app)
      .post('/api/echo')
      .set('Authorization', 'Bearer super-secret-token')
      .set('Cookie', 'session=secret-session-value')
      .set('X-API-Key', 'secret-api-key')
      .send({ hello: 'world' });

    expect(res.status).toBe(200);
    expect(res.body.headers.authorization).toBe('[REDACTED]');
    expect(res.body.headers.cookie).toBe('[REDACTED]');
    expect(res.body.headers['x-api-key']).toBe('[REDACTED]');

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('super-secret-token');
    expect(serialized).not.toContain('secret-session-value');
    expect(serialized).not.toContain('secret-api-key');

    // Non-sensitive headers are still echoed.
    expect(res.body.body).toEqual({ hello: 'world' });
  });
});

describe('API key guard on write endpoints', () => {
  afterEach(() => {
    delete process.env.API_KEY;
  });

  it('allows writes when no API_KEY is configured (development convenience)', async () => {
    const res = await request(app).post('/api/customers').send(validBody);
    expect(res.status).toBe(201);
  });

  it.each([
    ['post', '/api/customers'],
    ['put', '/api/customers/1'],
    ['delete', '/api/customers/1'],
    ['delete', '/api/customers'],
  ])('rejects %s %s without a key once API_KEY is set', async (method, path) => {
    process.env.API_KEY = 'correct-horse-battery-staple';
    const res = await request(app)[method](path).send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/api key/i);
  });

  it('rejects a wrong key', async () => {
    process.env.API_KEY = 'correct-horse-battery-staple';
    const res = await request(app).delete('/api/customers').set('X-API-Key', 'wrong-key').send();
    expect(res.status).toBe(401);
  });

  it('accepts the correct key via X-API-Key and via Bearer', async () => {
    process.env.API_KEY = 'correct-horse-battery-staple';

    const headerRes = await request(app)
      .post('/api/customers')
      .set('X-API-Key', 'correct-horse-battery-staple')
      .send(validBody);
    expect(headerRes.status).toBe(201);

    const bearerRes = await request(app)
      .post('/api/customers')
      .set('Authorization', 'Bearer correct-horse-battery-staple')
      .send(validBody);
    expect(bearerRes.status).toBe(201);
  });

  it('leaves read endpoints open', async () => {
    process.env.API_KEY = 'correct-horse-battery-staple';
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(200);
  });
});

describe('Internal error disclosure', () => {
  const dbError = Object.assign(new Error("ER_BAD_FIELD_ERROR: Unknown column 'x' in 'customer'"), {
    code: 'ER_BAD_FIELD_ERROR',
    sqlMessage: "Unknown column 'x'",
    sql: 'SELECT secret FROM customer',
  });

  afterEach(() => mockPool.__setFailure(null));

  it.each([
    ['get', '/api/customers'],
    ['get', '/api/customers/1'],
    ['post', '/api/customers'],
    ['put', '/api/customers/1'],
    ['delete', '/api/customers/1'],
    ['delete', '/api/customers'],
  ])('returns a generic 500 for %s %s when the database fails', async (method, path) => {
    mockPool.__setFailure(dbError);
    const res = await request(app)[method](path).send(validBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Internal Server Error' });
    expect(JSON.stringify(res.body)).not.toMatch(/ER_BAD_FIELD_ERROR|Unknown column|SELECT secret/);
  });
});

describe('Query building hardening', () => {
  it('escapes LIKE metacharacters in search', async () => {
    await request(app).get('/api/customers').query({ search: '100%_x' });
    const params = mockPool.__lastParams();
    expect(params[0]).toBe('%100!%!_x%');
    expect(mockPool.__lastSql()).toContain("ESCAPE '!'");
  });

  it('ignores prototype-chain keys in advancedFilter', async () => {
    await request(app)
      .get('/api/customers')
      .query({
        advancedFilter: JSON.stringify({
          'constructor.eq': 'x',
          '__proto__.eq': 'x',
          'toString.eq': 'x',
        }),
      });
    expect(mockPool.__lastSql()).not.toContain('WHERE');
    expect(mockPool.__lastParams()).toHaveLength(2); // LIMIT + OFFSET only
  });

  it('ignores prototype-chain keys in the fields selector', async () => {
    await request(app).get('/api/customers').query({ fields: 'constructor,__proto__,toString' });
    expect(mockPool.__lastSql()).toMatch(/^SELECT \* FROM customer/);
    expect(mockPool.__lastSql()).not.toMatch(/native code|object Object/);
  });

  it('still applies whitelisted advancedFilter conditions', async () => {
    await request(app)
      .get('/api/customers')
      .query({ advancedFilter: JSON.stringify({ 'age.gte': 18, 'gender.eq': 'female' }) });
    const sql = mockPool.__lastSql();
    expect(sql).toContain('customer_age >= ?');
    expect(sql).toContain('customer_gender = ?');
    expect(mockPool.__lastParams().slice(0, 2)).toEqual([18, 'female']);
  });

  it('rejects unknown query parameters', async () => {
    const res = await request(app).get('/api/customers').query({ notARealParam: '1' });
    expect(res.status).toBe(400);
  });

  // Regression: `INSERT ... SET ?` relies on driver-side object expansion, which
  // silently serialises to `SET NULL` if the pool ever enables namedPlaceholders.
  // Pin the positional form so the insert cannot depend on pool options again.
  it('inserts with an explicit column list and positional parameters', async () => {
    const res = await request(app).post('/api/customers').send(validBody);
    expect(res.status).toBe(201);

    const sql = mockPool.__lastSql();
    expect(sql).toContain(
      'INSERT INTO customer (customer_name, customer_surname, customer_age, customer_gender)'
    );
    expect(sql).toContain('VALUES (?, ?, ?, ?)');
    expect(sql).not.toMatch(/SET \?/);
    expect(mockPool.__lastParams()).toEqual(['Ali', 'Veli', 30, 'male']);
  });
});

describe('Baseline responses', () => {
  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Not Found' });
  });

  it('does not advertise the framework', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sets hardening headers', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});
