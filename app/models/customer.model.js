const pool = require('./db.js');

// constructor
const Customer = function (customer) {
  this.customer_name = customer.customer_name;
  this.customer_surname = customer.customer_surname;
  this.customer_age = customer.customer_age;
  this.customer_gender = customer.customer_gender;
};

Customer.create = (newCustomer, result) => {
  pool.query('INSERT INTO customer SET ?', newCustomer, (err, res) => {
    if (err) {
      console.log('error: ', err);
      result(err, null);
      return;
    }

    console.log('created customer: ', { id: res.insertId, ...newCustomer });
    result(null, { id: res.insertId, ...newCustomer });
  });
};

Customer.findById = (customerId, result) => {
  pool.query('SELECT * FROM customer WHERE id = ?', [customerId], (err, res) => {
    if (err) {
      console.log('error: ', err);
      result(err, null);
      return;
    }

    if (res.length) {
      console.log('found customer: ', res[0]);
      result(null, res[0]);
      return;
    }

    // not found Customer with the id
    result({ kind: 'not_found' }, null);
  });
};

Customer.getAll = (options = {}, result) => {
  const {
    page = 1,
    pageSize = 50,
    search,
    sortBy = 'id',
    order = 'desc',
    gender,
    minAge,
    maxAge,
    fields,
    advancedFilter,
  } = options;
  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 50, 1), 100);
  const offset = Math.max(((parseInt(page, 10) || 1) - 1) * limit, 0);

  // Build static WHERE clause and parameter list safely
  const clauses = [];
  const params = [];
  if (typeof search === 'string' && search.trim() !== '') {
    clauses.push('(customer_name LIKE ? OR customer_surname LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like);
  }
  if (typeof gender === 'string') {
    clauses.push('customer_gender = ?');
    params.push(gender);
  }
  if (Number.isInteger(Number(minAge))) {
    clauses.push('customer_age >= ?');
    params.push(Number(minAge));
  }
  if (Number.isInteger(Number(maxAge))) {
    clauses.push('customer_age <= ?');
    params.push(Number(maxAge));
  }

  // Advanced filter parsing (JSON string)
  // Format: { fieldOp: value } where fieldOp is key like 'age.gte', 'age.in', 'gender.eq'
  // Operators whitelist: eq, lt, lte, gt, gte, in
  // Fields whitelist: id, name, surname, age, gender
  const opMap = { eq: '=', lt: '<', lte: '<=', gt: '>', gte: '>=', in: 'IN' };
  const fieldMap = {
    id: 'id',
    name: 'customer_name',
    surname: 'customer_surname',
    age: 'customer_age',
    gender: 'customer_gender',
  };
  const allowedOpsByField = {
    id: new Set(['eq', 'lt', 'lte', 'gt', 'gte', 'in']),
    age: new Set(['eq', 'lt', 'lte', 'gt', 'gte', 'in']),
    gender: new Set(['eq', 'in']),
    name: new Set(['eq', 'in']),
    surname: new Set(['eq', 'in']),
  };
  const genderSet = new Set(['male', 'female', 'other']);
  const maxConditions = 10;
  const maxInItems = 100;
  if (typeof advancedFilter === 'string' && advancedFilter.trim() !== '') {
    try {
      const parsed = JSON.parse(advancedFilter);
      if (parsed && typeof parsed === 'object') {
        let added = 0;
        for (const [key, valueRaw] of Object.entries(parsed)) {
          if (added >= maxConditions) break;
          const parts = String(key).split('.');
          if (parts.length !== 2) continue;
          const [fieldKey, opKey] = parts;
          const col = fieldMap[fieldKey];
          const allowedOps = allowedOpsByField[fieldKey];
          const sqlOp = opMap[opKey];
          if (!col || !allowedOps || !allowedOps.has(opKey) || !sqlOp) continue; // skip non-whitelisted

          // Coerce/validate value by field type and operator
          if (sqlOp === 'IN') {
            if (!Array.isArray(valueRaw) || valueRaw.length === 0) continue;
            let arr = valueRaw.slice(0, maxInItems);
            if (fieldKey === 'id' || fieldKey === 'age') {
              arr = arr.map((v) => Number(v)).filter((n) => Number.isFinite(n));
            } else if (fieldKey === 'gender') {
              arr = arr.map((v) => String(v).toLowerCase().trim()).filter((s) => genderSet.has(s));
            } else if (fieldKey === 'name' || fieldKey === 'surname') {
              arr = arr.map((v) => String(v).trim()).filter((s) => s.length > 0 && s.length <= 100);
            }
            // Deduplicate
            arr = Array.from(new Set(arr));
            if (arr.length === 0) continue;
            const placeholders = arr.map(() => '?').join(',');
            clauses.push(`${col} IN (${placeholders})`);
            params.push(...arr);
            added += 1;
          } else {
            let val;
            if (fieldKey === 'id' || fieldKey === 'age') {
              const n = Number(valueRaw);
              if (!Number.isFinite(n)) continue;
              val = n;
            } else if (fieldKey === 'gender') {
              const s = String(valueRaw).toLowerCase().trim();
              if (!genderSet.has(s)) continue;
              val = s;
            } else if (fieldKey === 'name' || fieldKey === 'surname') {
              const s = String(valueRaw).trim();
              if (!s || s.length > 100) continue;
              val = s;
            }
            if (typeof val === 'undefined') continue;
            clauses.push(`${col} ${sqlOp} ?`);
            params.push(val);
            added += 1;
          }
        }
      }
    } catch (_e) {
      // ignore invalid JSON
    }
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sqlCount = `SELECT COUNT(*) as total FROM customer ${whereClause}`;
  // Whitelist mapping for sort columns
  const sortMap = {
    id: 'id',
    name: 'customer_name',
    surname: 'customer_surname',
    age: 'customer_age',
    gender: 'customer_gender',
  };
  const col = sortMap[sortBy] || 'id';
  const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  // Field selection whitelist (reuse map)
  let selectCols = '*';
  if (typeof fields === 'string' && fields.trim() !== '') {
    const requested = fields
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const mapped = requested.map((k) => fieldMap[k]).filter(Boolean);
    if (mapped.length) selectCols = mapped.join(', ');
  }
  const sqlQuery = `SELECT ${selectCols} FROM customer ${whereClause} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`;

  pool.query(sqlCount, params, (err, countRows) => {
    if (err) {
      console.log('error: ', err);
      result(err, null);
      return;
    }
    const total = countRows[0]?.total || 0;
    pool.query(sqlQuery, [...params, limit, offset], (qErr, rows) => {
      if (qErr) {
        console.log('error: ', qErr);
        result(qErr, null);
        return;
      }
      // Meta: returnedFieldsCount and totalPages
      const returnedFieldsCount = Array.isArray(rows) && rows[0] ? Object.keys(rows[0]).length : 0;
      const totalPages = Math.ceil(total / (limit || 1));
      result(null, { data: rows, page, pageSize: limit, total, totalPages, returnedFieldsCount });
    });
  });
};

Customer.updateById = (id, customer, result) => {
  pool.query(
    'UPDATE customer SET customer_name = ?, customer_surname = ?, customer_age = ?, customer_gender = ? WHERE id = ?',
    [
      customer.customer_name,
      customer.customer_surname,
      customer.customer_age,
      customer.customer_gender,
      id,
    ],
    (err, res) => {
      if (err) {
        console.log('error: ', err);
        result(null, err);
        return;
      }

      if (res.affectedRows == 0) {
        // not found Customer with the id
        result({ kind: 'not_found' }, null);
        return;
      }

      console.log('updated customer: ', { id: id, ...customer });
      result(null, { id: id, ...customer });
    }
  );
};

Customer.remove = (id, result) => {
  pool.query('DELETE FROM customer WHERE id = ?', [id], (err, res) => {
    if (err) {
      console.log('error: ', err);
      result(null, err);
      return;
    }

    if (res.affectedRows == 0) {
      // not found Customer with the id
      result({ kind: 'not_found' }, null);
      return;
    }

    console.log('deleted customer with id: ', id);
    result(null, res);
  });
};

Customer.removeAll = (result) => {
  pool.query('DELETE FROM customer', (err, res) => {
    if (err) {
      console.log('error: ', err);
      result(null, err);
      return;
    }

    console.log(`deleted ${res.affectedRows} customer`);
    result(null, res);
  });
};

module.exports = Customer;

// Analytics helpers
Customer.statsByGender = (result) => {
  const sql =
    'SELECT customer_gender AS gender, COUNT(*) AS count FROM customer GROUP BY customer_gender';
  pool.query(sql, (err, rows) => {
    if (err) {
      console.log('error: ', err);
      result(err, null);
      return;
    }
    result(null, rows);
  });
};

Customer.statsByAgeBins = (result) => {
  // Fetch ages and bin in app layer (portable, test-friendly)
  const sql = 'SELECT customer_age FROM customer';
  pool.query(sql, (err, rows) => {
    if (err) {
      console.log('error: ', err);
      result(err, null);
      return;
    }
    const bins = {
      '0-17': 0,
      '18-25': 0,
      '26-40': 0,
      '41-65': 0,
      '66+': 0,
    };
    for (const r of rows) {
      const age = Number(r.customer_age);
      if (age <= 17) bins['0-17']++;
      else if (age <= 25) bins['18-25']++;
      else if (age <= 40) bins['26-40']++;
      else if (age <= 65) bins['41-65']++;
      else bins['66+']++;
    }
    result(null, bins);
  });
};
