const request = require('supertest');
const { app } = require('../app/app');

describe('Utility controllers', () => {
  it('GET /api/version returns name and version', async () => {
    const res = await request(app).get('/api/version');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('version');
  });

  it('POST /api/echo echoes payload', async () => {
    const payload = { x: 1 };
    const res = await request(app).post('/api/echo?y=2').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('body');
    expect(res.body.body).toEqual(payload);
    expect(res.body).toHaveProperty('query');
    expect(res.body.query).toHaveProperty('y', '2');
  });

  it('GET /api/time/now returns time fields', async () => {
    const res = await request(app).get('/api/time/now');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('iso');
    expect(res.body).toHaveProperty('epochMs');
    expect(res.body).toHaveProperty('tz');
  });

  it('GET /api/metrics increases count', async () => {
    const r1 = await request(app).get('/api/metrics');
    expect(r1.status).toBe(200);
    const c1 = r1.body.requestCount;
    const r2 = await request(app).get('/api/metrics');
    const c2 = r2.body.requestCount;
    expect(c2).toBeGreaterThanOrEqual(c1);
  });
});
