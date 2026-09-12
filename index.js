const { app } = require('./app/app');
const env = require('./app/config/env');
const pool = require('./app/models/db');

const server = app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT} (${env.NODE_ENV}).`);
});

server.on('error', (err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

let shuttingDown = false;

/** Drain in-flight requests and close the pool so no work is lost on deploy. */
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error('Shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close((closeErr) => {
    if (closeErr) console.error('Error closing server:', closeErr.message);
    pool.end((poolErr) => {
      if (poolErr) console.error('Error closing database pool:', poolErr.message);
      clearTimeout(forceExit);
      process.exit(closeErr || poolErr ? 1 : 0);
    });
  });
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => shutdown(signal));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown('uncaughtException');
});

module.exports = { server };
