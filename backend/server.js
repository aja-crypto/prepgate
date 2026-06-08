// server.js – GATE 2027 Backend Entry Point
require('./src/config/loadEnv');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { isMockAuthEnabled } = require('./src/config/devMode');
const { isMongoConnected } = require('./src/config/db');

const app = express();

// ─── Security Middleware ────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", "https://api.openai.com"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5000", "http://127.0.0.1:5000"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true, // Allow all origins for local development to avoid 127.0.0.1 vs localhost issues
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-User']
}));

// ─── Rate Limiting ──────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300, // Increased for dev, and more generous for prod
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => isDev && req.path.startsWith('/api/ai'), // Skip rate limit for AI routes in dev to allow testing
});

// Strict limit only for credential endpoints — NOT refresh/me (those fire often on app load)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 30,
  message: { success: false, message: 'Too many auth attempts. Wait a few minutes or restart the backend in dev.' },
  skip: (req) => {
    const p = req.path || '';
    // Token refresh + session checks should not burn the login attempt budget
    return p === '/refresh' || p === '/me' || p.endsWith('/refresh');
  },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

const path = require('path');

// ─── Middleware ─────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Logging ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'GATE 2027 API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mockAuth: isMockAuthEnabled(),
    mongoConnected: isMongoConnected(),
    dataSource: isMongoConnected() ? 'mongodb' : 'local',
  });
});

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/subjects', require('./src/routes/subjects'));
app.use('/api/topics', require('./src/routes/topics'));
app.use('/api/progress', require('./src/routes/progress'));
app.use('/api/mocks', require('./src/routes/mocks'));
app.use('/api/pyq', require('./src/routes/pyq'));
app.use('/api/admin/pyq', require('./src/routes/adminPyq'));
app.use('/api/mock-sessions', require('./src/routes/mockSessions'));
app.use('/api/notes', require('./src/routes/notes'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/admin', require('./src/routes/adminLiveData'));
app.use('/api/live', require('./src/routes/liveData'));
app.use('/api/cron', require('./src/routes/cron'));
app.use('/api/ai', require('./src/routes/ai'));

// ─── 404 Handler ────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`\n🎓 GATE 2027 API running on port ${PORT} [${process.env.NODE_ENV}]`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`💾 Data source: ${isMongoConnected() ? 'MongoDB' : 'Local (in-memory)'}\n`);

    const { startScheduler } = require('./src/services/scheduler/cronJobs');
    startScheduler();
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
});

module.exports = app;
