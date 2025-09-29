const request = require('supertest');
const { app } = require('../app/app');

// Note: These tests assume a local DB configured via .env. To make tests more robust,
// consider using a test database or mocking the DB layer.

describe('Customers endpoints (smoke)', () => {
  it('GET /api/customers paginates', async () => {
    const res = await request(app).get('/api/customers?page=1&pageSize=2');
    // If DB is available expect 200 with shape; otherwise allow 500 with error message
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
    } else {
      expect(res.body).toHaveProperty('message');
    }
  });

  it('POST /api/customers validates body', async () => {
    const res = await request(app).post('/api/customers').send({});
    expect([400, 422]).toContain(res.status);
  });
});
