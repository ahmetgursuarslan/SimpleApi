module.exports = (app) => {
  const version = require('../controllers/version.controller');
  const echo = require('../controllers/echo.controller');
  const time = require('../controllers/time.controller');
  const metrics = require('../controllers/metrics.controller');

  /**
   * @openapi
   * /api/version:
   *   get:
   *     summary: Service version and runtime info
   */
  app.get('/api/version', version.info);

  /**
   * @openapi
   * /api/echo:
   *   post:
   *     summary: Echo back posted body, headers and query
   */
  app.post('/api/echo', echo.echo);

  /**
   * @openapi
   * /api/time/now:
   *   get:
   *     summary: Current server time
   */
  app.get('/api/time/now', time.now);

  /**
   * @openapi
   * /api/metrics:
   *   get:
   *     summary: In-memory request metrics
   */
  app.get('/api/metrics', metrics.stats);
};
