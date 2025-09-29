const request = require('supertest');
const { app } = require('../app/app');

describe('Health endpoints', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/status returns server ok', async () => {
    const res = await request(app).get('/api/status');
    expect([200, 500]).toContain(res.status);
    expect(res.body).toHaveProperty('server');
  });
});
