const request = require('supertest');

// Mock DB as in happy test but with more records
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
    const obj = params;
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
  function selectAges(sql, params, cb) {
    // SELECT customer_age FROM customer
    cb(
      null,
      mockStore.map(({ customer_age }) => ({ customer_age }))
    );
  }
  function selectGenderGroup(sql, params, cb) {
    const map = {};
    for (const r of mockStore) {
      const g = r.customer_gender;
      map[g] = (map[g] || 0) + 1;
    }
    const rows = Object.entries(map).map(([gender, count]) => ({ gender, count }));
    cb(null, rows);
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
      if (sql.startsWith('SELECT customer_age FROM customer')) return selectAges(sql, params, cb);
      if (sql.startsWith('SELECT customer_gender AS gender'))
        return selectGenderGroup(sql, params, cb);
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
      cb(null, { release() {} });
    },
    end(cb) {
      if (cb) cb();
    },
    __mockReset() {
      mockStore = [];
      mockIdSeq = 1;
    },
    __mockSeed(data) {
      mockStore = data.map((d) => ({ id: mockIdSeq++, ...d }));
    },
  };
  return pool;
});

const mockPool = require('../app/models/db.js');
const { app } = require('../app/app');

describe('Customers analytics endpoints (mocked DB)', () => {
  beforeEach(() => {
    mockPool.__mockReset();
    mockPool.__mockSeed([
      { customer_name: 'A', customer_surname: '1', customer_age: 15, customer_gender: 'male' },
      { customer_name: 'B', customer_surname: '2', customer_age: 22, customer_gender: 'female' },
      { customer_name: 'C', customer_surname: '3', customer_age: 35, customer_gender: 'male' },
      { customer_name: 'D', customer_surname: '4', customer_age: 50, customer_gender: 'other' },
      { customer_name: 'E', customer_surname: '5', customer_age: 70, customer_gender: 'female' },
    ]);
  });

  it('GET /api/customers/stats/gender returns grouped counts', async () => {
    const res = await request(app).get('/api/customers/stats/gender');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    const genders = res.body.data.reduce((acc, r) => ({ ...acc, [r.gender]: r.count }), {});
    expect(genders.male).toBe(2);
    expect(genders.female).toBe(2);
    expect(genders.other).toBe(1);
  });

  it('GET /api/customers/stats/age returns bins', async () => {
    const res = await request(app).get('/api/customers/stats/age');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    const bins = res.body.data;
    expect(bins['0-17']).toBe(1);
    expect(bins['18-25']).toBe(1);
    expect(bins['26-40']).toBe(1);
    expect(bins['41-65']).toBe(1);
    expect(bins['66+']).toBe(1);
  });
});
