const env = require('./config/env');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const morgan = require('morgan');
const { errors: celebrateErrors } = require('celebrate');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const { isProduction, isTest } = env;
const app = express();

// Never advertise the framework.
app.disable('x-powered-by');

// Explicit proxy trust: required for correct client IPs (rate limiting) behind a
// load balancer, but must not be enabled blindly or X-Forwarded-For is spoofable.
app.set('trust proxy', env.TRUST_PROXY);

// Security headers
app.use(
  helmet({
    // Swagger UI is served from /docs with its own relaxed policy below.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// CORS: environment-aware tightening
const corsOriginsEnv =
  process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || (isProduction ? '' : '*');
const allowAllOrigins = corsOriginsEnv.trim() === '*';
const allowedOrigins = corsOriginsEnv
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowCredentials = env.toBool(process.env.CORS_CREDENTIALS, false);

// `Access-Control-Allow-Origin: *` with credentials is rejected by browsers and
// would mean "any site may act as any logged-in user" if it were honoured.
if (allowAllOrigins && allowCredentials) {
  throw new Error(
    'Invalid CORS configuration: CORS_CREDENTIALS=true cannot be combined with a wildcard ' +
      'CORS_ORIGINS. List the exact allowed origins instead.'
  );
}
if (isProduction && allowAllOrigins) {
  throw new Error(
    'Invalid CORS configuration: wildcard CORS_ORIGINS is not allowed in production.'
  );
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // same-origin, curl/postman, server-to-server
    if (allowAllOrigins || allowedOrigins.includes(origin)) return callback(null, true);
    // Signal a deliberate policy decision rather than an unhandled 500.
    const err = new Error('Origin not allowed by CORS policy.');
    err.status = 403;
    err.expose = true;
    return callback(err);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: allowCredentials,
  optionsSuccessStatus: 204,
  maxAge: 60 * 60 * 24, // cache preflight 1 day
};
app.use(cors(corsOptions));

// Logging (quiet during tests, Apache-combined in production)
if (!isTest) {
  app.use(morgan(isProduction ? 'combined' : 'dev'));
}

// Body parsing with explicit, bounded limits
app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT, parameterLimit: 100 }));

// Simple in-memory metrics middleware
app.use(require('./controllers/metrics.controller').increment);

// Rate limiting (configurable per env)
const windowMs = env.toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const limit = env.toInt(process.env.RATE_LIMIT_MAX, isProduction ? 100 : 1000);
const limiterOptions = {
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
};
// A wide net first so /, /docs and unknown paths are not free, then the
// stricter API budget. Order matters: the last limiter to run writes the
// RateLimit-* headers, so /api/* advertises the limit that actually binds.
app.use(rateLimit({ ...limiterOptions, limit: limit * 5 }));
app.use('/api/', rateLimit(limiterOptions));

// simple route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Simple API. Upgraded and secured.' });
});

// API routes
require('./routes/customer.route')(app);
require('./routes/health.route')(app);
require('./routes/status.route')(app);
require('./routes/utility.route')(app);

// Swagger docs (disabled by default in production; set ENABLE_DOCS=true to expose)
if (env.ENABLE_DOCS) {
  const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${env.PORT}`;
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Simple API',
        version: require('../package.json').version,
      },
      servers: [{ url: serverUrl, description: 'API Server' }],
      components: {
        securitySchemes: {
          ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
        schemas: {
          Customer: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              customer_name: { type: 'string', example: 'Ali' },
              customer_surname: { type: 'string', example: 'Veli' },
              customer_age: { type: 'integer', example: 30 },
              customer_gender: {
                type: 'string',
                enum: ['male', 'female', 'other'],
                example: 'male',
              },
            },
            required: ['customer_name', 'customer_surname', 'customer_age', 'customer_gender'],
          },
          CustomerCreate: {
            type: 'object',
            properties: {
              customer_name: { type: 'string' },
              customer_surname: { type: 'string' },
              customer_age: { type: 'integer' },
              customer_gender: { type: 'string', enum: ['male', 'female', 'other'] },
            },
            required: ['customer_name', 'customer_surname', 'customer_age', 'customer_gender'],
          },
        },
      },
    },
    apis: ['./app/routes/*.js'],
  });

  // Swagger UI ships inline styles; scope the looser policy to /docs only.
  const docsCsp = helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  });
  app.use('/docs', docsCsp, swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
}

// celebrate validation errors
app.use(celebrateErrors());

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Centralized error handler (4 args required for Express to treat it as one)
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error('Unhandled error:', err);
  }

  // 5xx messages come from the driver or the runtime and leak SQL text, file
  // paths and connection details, so clients only ever see a generic string.
  // 4xx messages are authored for clients (validation, CORS, payload limits).
  const message = status >= 500 ? 'Internal Server Error' : err.message || 'Bad Request';

  res.status(status).json({ message });
});

module.exports = { app };
