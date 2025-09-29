// Ensure any DB pools or servers are closed after tests
try {
  const pool = require('../app/models/db');
  if (pool && typeof pool.end === 'function') {
    afterAll((done) => {
      // end may be sync or callback-based depending on mock/real implementation
      try {
        const maybePromise = pool.end?.((err) => done());
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then(() => done()).catch(() => done());
        }
      } catch (_) {
        done();
      }
    });
  }
} catch (e) {
  // ignore
}
