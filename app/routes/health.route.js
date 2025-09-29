module.exports = (app) => {
  const health = require('../controllers/health.controller');

  /**
   * @openapi
   * /api/health:
   *   get:
   *     summary: Health check
   *     responses:
   *       200:
   *         description: OK
   */
  app.get('/api/health', health.ping);

  /**
   * @openapi
   * /api/health/ready:
   *   get:
   *     summary: Readiness probe
   */
  app.get('/api/health/ready', health.readiness);

  /**
   * @openapi
   * /api/health/live:
   *   get:
   *     summary: Liveness probe
   */
  app.get('/api/health/live', health.liveness);
};
