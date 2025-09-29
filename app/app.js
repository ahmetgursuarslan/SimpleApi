require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { errors: celebrateErrors } = require('celebrate');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Security headers
app.use(helmet());

// CORS: environment-aware tightening
const isProd = process.env.NODE_ENV === 'production';
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || (isProd ? '' : '*');
const allowedOrigins = corsOriginsEnv
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow curl/postman
    if (corsOriginsEnv === '*' || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  optionsSuccessStatus: 204,
  maxAge: 60 * 60 * 24, // cache preflight 1 day
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory metrics middleware
app.use(require('./controllers/metrics.controller').increment);

// Rate limiting for API endpoints (configurable per env)
app.use(
  '/api/',
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || (isProd ? 100 : 1000)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  })
);

// simple route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Simple API. Upgraded and secured.' });
});

// API routes
require('./routes/customer.route')(app);
require('./routes/health.route')(app);
require('./routes/status.route')(app);
require('./routes/utility.route')(app);

// Swagger docs
const port = Number(process.env.PORT || 3000);
const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Simple API',
      version: '1.1.0',
    },
    servers: [{ url: serverUrl, description: 'API Server' }],
    components: {
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            customer_name: { type: 'string', example: 'Ali' },
            customer_surname: { type: 'string', example: 'Veli' },
            customer_age: { type: 'integer', example: 30 },
            customer_gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
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
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// celebrate validation errors
app.use(celebrateErrors());

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Centralized error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

module.exports = { app };
