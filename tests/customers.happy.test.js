const request = require('supertest');

// Mock the pool used by models (self-contained store inside factory)
jest.mock('../app/models/db.js', () => {
  let mockStore = [];
  let mockIdSeq = 1;

  function selectCount(sql, params, cb) {
    cb(null, [{ total: mockStore.length }]);
  }
  function selectPaged(sql, params, cb) {
    const limit = params[params.length - 2];
    const offset = params[params.length - 1];
    const sorted = [...mockStore].sort((a, b) => b.id - a.id);
    cb(null, sorted.slice(offset, offset + limit));
  }
  function selectById(sql, params, cb) {
    const id = Number(params[0]);
    const row = mockStore.find((r) => r.id === id);
    cb(null, row ? [row] : []);
  }
  function insert(sql, params, cb) {
    const obj = params; // INSERT ... SET ? (object)
    const row = { id: mockIdSeq++, ...obj };
    mockStore.push(row);
    cb(null, { insertId: row.id });
  }
  function update(sql, params, cb) {
    const [name, surname, age, gender, id] = params;
    const idx = mockStore.findIndex((r) => r.id === Number(id));
    if (idx === -1) return cb(null, { affectedRows: 0 });
    mockStore[idx] = {
      ...mockStore[idx],
      customer_name: name,
      customer_surname: surname,
      customer_age: age,
      customer_gender: gender,
    };
    cb(null, { affectedRows: 1 });
  }
  function delOne(sql, params, cb) {
    const id = Number(params[0]);
    const before = mockStore.length;
    mockStore = mockStore.filter((r) => r.id !== id);
    const affected = before - mockStore.length;
    cb(null, { affectedRows: affected });
  }
  function delAll(sql, params, cb) {
    const affected = mockStore.length;
    mockStore = [];
    mockIdSeq = 1;
    cb(null, { affectedRows: affected });
  }

  const pool = {
    query(sql, params, cb) {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      if (sql.startsWith('INSERT INTO customer SET')) return insert(sql, params, cb);
      if (sql.startsWith('SELECT COUNT(*) as total FROM customer'))
        return selectCount(sql, params, cb);
      if (sql.startsWith('SELECT * FROM customer WHERE id =')) return selectById(sql, params, cb);
      if (sql.startsWith('SELECT * FROM customer')) return selectPaged(sql, params, cb);
      if (sql.startsWith('UPDATE customer SET')) return update(sql, params, cb);
      if (sql.startsWith('DELETE FROM customer WHERE id =')) return delOne(sql, params, cb);
      if (sql.startsWith('DELETE FROM customer')) return delAll(sql, params, cb);
      cb(null, []);
    },
    promise() {
      return {
        query(sql) {
          if (sql.includes('SELECT 1 as db')) {
            return Promise.resolve([[{ db: 1 }], []]);
          }
          return Promise.resolve([[{}], []]);
        },
      };
    },
    getConnection(cb) {
      // Pretend connection succeeds to avoid console errors
      cb(null, { release() {} });
    },
    end(cb) {
      if (cb) cb();
    },
    __mockReset() {
      mockStore = [];
      mockIdSeq = 1;
    },
  };
  return pool;
});

const { app } = require('../app/app');
const mockPool = require('../app/models/db.js');

describe('Customers happy path CRUD (mocked DB)', () => {
  beforeEach(() => {
    mockPool.__mockReset();
  });

  it('creates, reads, updates, lists, and deletes a customer', async () => {
    // Ensure clean slate
    await request(app).delete('/api/customers');

    // Create
    const createBody = {
      customer_name: 'Ali',
      customer_surname: 'Veli',
      customer_age: 30,
      customer_gender: 'other',
    };
    const createRes = await request(app).post('/api/customers').send(createBody);
    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject(createBody);
    expect(createRes.body).toHaveProperty('id');
    const id = createRes.body.id;

    // Read by id
    const getRes = await request(app).get(`/api/customers/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject({ ...createBody, id });

    // Update
    const updateBody = {
      customer_name: 'AliUpdated',
      customer_surname: 'VeliUpdated',
      customer_age: 31,
      customer_gender: 'male',
    };
    const updateRes = await request(app).put(`/api/customers/${id}`).send(updateBody);
    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toMatchObject({ ...updateBody, id });

    // List (pagination)
    const listRes = await request(app).get('/api/customers?page=1&pageSize=10');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveProperty('data');
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body).toHaveProperty('total');
    expect(listRes.body.total).toBeGreaterThanOrEqual(1);

    // Delete
    const delRes = await request(app).delete(`/api/customers/${id}`);
    expect(delRes.status).toBe(200);

    // Verify 404 after delete
    const getAfterDel = await request(app).get(`/api/customers/${id}`);
    expect(getAfterDel.status).toBe(404);
  });
});
