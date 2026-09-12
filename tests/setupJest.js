// Ensure any DB pools opened by the app are closed once the suite finishes,
// otherwise Jest hangs on open handles.
let pool;
try {
  pool = require('../app/models/db');
} catch {
  pool = null;
}

if (pool && typeof pool.end === 'function') {
  afterAll(async () => {
    await new Promise((resolve) => {
      try {
        const maybePromise = pool.end(() => resolve());
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then(resolve, resolve);
        }
      } catch {
        resolve();
      }
    });
  });
}
