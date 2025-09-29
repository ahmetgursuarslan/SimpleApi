module.exports = (app) => {
  const status = require('../controllers/status.controller');

  /**
   * @openapi
   * /api/status:
   *   get:
   *     summary: Service and DB status
   */
  app.get('/api/status', status.info);
};
