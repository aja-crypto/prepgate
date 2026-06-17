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
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

// Warn on missing production config at startup
if (process.env.NODE_ENV === 'production') {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGIN',
    'OPENROUTER_API_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'FROM_EMAIL',
  ];
  required.forEach(key => {
    if (!process.env[key] || process.env[key].includes('placeholder') || process.env[key].includes('your_')) {
      console.error(`[STARTUP WARNING] ${key} is missing or still a placeholder. Set it in environment variables.`);
    }
  });
}

// ─── Security Middleware ────────────────────────────────────
const isViteDev = process.env.NODE_ENV !== 'production';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", ...(isViteDev ? ["'unsafe-inline'", "'unsafe-eval'"] : ["'unsafe-inline'"])],
      connectSrc: ["'self'", ...(isViteDev
        ? ["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5200", "http://127.0.0.1:5200"]
        : [process.env.CORS_ORIGIN].filter(Boolean)),
        "https://api.openai.com", "https://openrouter.ai"
      ],
      imgSrc: ["'self'", "data:", "https:", ...(isViteDev
        ? ["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5200", "http://127.0.0.1:5200"]
        : [])],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5200', 'http://127.0.0.1:5200', 'http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-User']
}));

// ─── Rate Limiting ──────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
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
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/resources', express.static(path.join(__dirname, '..', 'resources')));

// ─── Logging ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    server: 'ok',
    database: isMongoConnected() ? 'connected' : 'disconnected',
  });
});
// Legacy health endpoint (backward compat)
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
app.use('/api/feedback', require('./src/routes/feedback'));
app.use('/api/weekly-tests', require('./src/routes/weeklyTests'));
app.use('/api/short-notes', require('./src/routes/shortNotes'));
app.use('/api/mock-tests', require('./src/routes/mockTests'));
app.use('/api/mistakes', require('./src/routes/mistakeEntries'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/study-plan', require('./src/routes/studyPlan'));
app.use('/api/admin', require('./src/routes/adminAuth'));
app.use('/api/admin', require('./src/routes/adminPdfs'));
app.use('/api/admin', require('./src/routes/adminMockTests'));
app.use('/api/admin', require('./src/routes/adminPyqManager'));
app.use('/api/protected', require('./src/routes/protectedDocs'));

// ─── 404 Handler ────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Seed default dev admin ────────────────────────────────
if (!isMongoConnected() && process.env.NODE_ENV !== 'production') {
  const localAdminStore = require('./src/store/localAdminStore');
  if (!localAdminStore.findAdminByEmail('admin@prepgate.dev')) {
    localAdminStore.createAdmin({
      name: 'Dev Admin',
      email: 'admin@prepgate.dev',
      password: 'admin123',
      role: 'super_admin',
    }).then(() => console.log('👤 Dev admin seeded: admin@prepgate.dev / admin123'))
    .catch(() => {}); // ignore if already exists
  }
}

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
