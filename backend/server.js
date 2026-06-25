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

// ─── Server start tracking ────────────────────────────────
const SERVER_START_TIME = Date.now();
let isShuttingDown = false;

// Fail startup if critical secrets are missing in production
if (process.env.NODE_ENV === 'production') {
  const critical = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGIN', 'MONGO_URI'];
  const missing = critical.filter(key => !process.env[key] || process.env[key].includes('placeholder') || process.env[key].includes('your_'));
  if (missing.length > 0) {
    console.error(`[STARTUP FAIL] Critical secrets missing or placeholder: ${missing.join(', ')}`);
    console.error('Set these in environment variables before starting in production.');
    process.exit(1);
  }
  const recommended = ['OPENROUTER_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  recommended.forEach(key => {
    if (!process.env[key] || process.env[key].includes('placeholder') || process.env[key].includes('your_')) {
      console.error(`[STARTUP WARNING] ${key} is missing or still a placeholder. Set it in environment variables.`);
    }
  });
}

// ─── Global crash handlers (must be before anything else) ──
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason instanceof Error ? reason.message : reason);
  // Do NOT exit — let the app continue running
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  // Log full error but don't exit — the app may still function
  console.error(err.stack);
  // Only exit if the error indicates corruption (e.g., EADDRINUSE)
  if (err.code === 'EADDRINUSE') {
    console.error('Port in use — cannot start server. Exiting.');
    process.exit(1);
  }
  // For all other uncaught exceptions, attempt graceful recovery
});

// ─── Security Middleware ────────────────────────────────────
const isViteDev = process.env.NODE_ENV !== 'production';
const cspDirectives = {
  defaultSrc: ["'self'"],
  // Vite dev needs 'unsafe-inline' for HMR, but production should be strict
  scriptSrc: ["'self'", ...(isViteDev ? ["'unsafe-inline'", "'unsafe-eval'"] : [])],
  connectSrc: ["'self'", ...(isViteDev
    ? ["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5200", "http://127.0.0.1:5200"]
    : [process.env.CORS_ORIGIN].filter(Boolean)),
    "https://api.openai.com", "https://openrouter.ai", "https://api.cloudinary.com"
  ],
  imgSrc: ["'self'", "data:", "https:", ...(isViteDev
    ? ["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5200", "http://127.0.0.1:5200"]
    : [])],
  // In production, use nonce-based styles; fallback to unsafe-inline only when necessary
  styleSrc: ["'self'", "'unsafe-inline'", "https:"],
  fontSrc: ["'self'", "https:", "data:"],
  frameAncestors: ["'self'"],
  // Upgrade insecure requests in production
  ...(isViteDev ? {} : { upgradeInsecureRequests: [] }),
};
app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Enable HSTS for production
  hsts: isViteDev ? false : { maxAge: 31536000, includeSubDomains: true, preload: true },
  // Hide server info
  hidePoweredBy: true,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // No sniffing MIME types
  noSniff: true,
  // XSS filter
  xssFilter: true,
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 30,
  message: { success: false, message: 'Too many auth attempts. Wait a few minutes or restart the backend in dev.' },
  skip: (req) => {
    const p = req.path || '';
    return p === '/refresh' || p === '/me' || p.endsWith('/refresh');
  },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 100,
  message: { success: false, message: 'Too many admin requests. Slow down.' },
});
app.use('/api/admin/', adminLimiter);

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isDev ? 30 : 10,
  message: { success: false, message: 'Too many AI requests. Wait a minute.' },
});
app.use('/api/ai/', aiLimiter);

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
  const mem = process.memoryUsage();
  res.json({
    server: 'ok',
    database: isMongoConnected() ? 'connected' : 'disconnected',
    uptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
});
app.get('/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'OK',
    service: 'GATE 2027 API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mockAuth: isMockAuthEnabled(),
    mongoConnected: isMongoConnected(),
    dataSource: isMongoConnected() ? 'mongodb' : 'local',
    uptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
    },
  });
});

// ─── Admin Health Check ─────────────────────────────────────
app.get('/admin/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'OK',
    service: 'GATE 2027 Admin API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mongoConnected: isMongoConnected(),
    dataSource: isMongoConnected() ? 'mongodb' : 'local',
    uptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
    },
  });
});

// ─── Admin API Health Check ─────────────────────────────────
app.get('/api/admin/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'OK',
    service: 'GATE 2027 Admin API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mockAuth: isMockAuthEnabled(),
    mongoConnected: isMongoConnected(),
    dataSource: isMongoConnected() ? 'mongodb' : 'local',
    uptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
    },
  });
});

// ─── Startup Validation ──────────────────────────────────────
const validateStartup = () => {
  console.log('🔍 Validating startup configuration...');
  
  const issues = [];
  
  // Check critical secrets
  const criticalSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGIN'];
  criticalSecrets.forEach(key => {
    if (!process.env[key] || process.env[key].includes('placeholder') || process.env[key].includes('your_')) {
      issues.push(`Critical secret ${key} missing or invalid`);
    }
  });
  
  // Check MongoDB connection status
  if (!isMongoConnected()) {
    issues.push('MongoDB not connected - using local fallback mode');
  }
  
  // Check for admin configuration
  try {
    const localAdminStore = require('./src/store/localAdminStore');
    const adminExists = localAdminStore.findAdminByEmail('admin@gateapex.dev');
    if (!adminExists) {
      issues.push('Default admin account not found');
    }
  } catch (e) {
    issues.push('Cannot verify admin configuration');
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ Startup validation issues:');
    issues.forEach(issue => console.warn('  ', issue));
  } else {
    console.log('✅ Startup validation passed');
  }
  
  return issues;
};

// Run startup validation after health checks
validateStartup();

// ─── Middleware: reject requests during shutdown ────────────
app.use((req, res, next) => {
  if (isShuttingDown) {
    return res.status(503).json({ success: false, message: 'Server is shutting down. Try again shortly.' });
  }
  next();
});



// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/subjects', require('./src/routes/subjects'));
app.use('/api/topics', require('./src/routes/topics'));
app.use('/api/progress', require('./src/routes/progress'));
app.use('/api/mocks', require('./src/routes/mocks'));
app.use('/api/pyq', require('./src/routes/pyq'));
app.use('/api/admin/pyq', require('./src/routes/adminPyq'));
app.use('/api/admin/pyq-papers', require('./src/routes/adminPyqPapers'));
app.use('/api/pyq-papers', require('./src/routes/pyqPapers'));
app.use('/api/mock-sessions', require('./src/routes/mockSessions'));
app.use('/api/notes', require('./src/routes/notes'));
app.use('/api/flashcards', require('./src/routes/flashcards'));
app.use('/api/community', require('./src/routes/community'));
app.use('/api/formula-sheets', require('./src/routes/formulaSheets'));
app.use('/api/video-lectures', require('./src/routes/videoLectures'));
app.use('/api/admin/auth', require('./src/routes/adminAuth'));
app.use('/api/admin/pdfs', require('./src/routes/adminPdfs'));
app.use('/api/admin/mock-tests', require('./src/routes/adminMockTests'));
app.use('/api/admin/pyq-manager', require('./src/routes/adminPyqManager'));
app.use('/api/admin/gate-vault', require('./src/routes/adminGateVault'));
app.use('/api/admin/live-data', require('./src/routes/adminLiveData'));
app.use('/api/admin/cms', require('./src/routes/adminCms'));
app.use('/api/admin/question-bank', require('./src/routes/adminQuestionBank'));
app.use('/api/admin/notifications', require('./src/routes/adminNotifications'));
app.use('/api/admin/feedback', require('./src/routes/adminFeedback'));
app.use('/api/gate-vault', require('./src/routes/gateVault'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/user/feedback', require('./src/routes/userFeedback'));
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
app.use('/api/protected', require('./src/routes/protectedDocs'));
app.use('/api/landing', require('./src/routes/landing'));
app.use('/api/admin/cms', require('./src/routes/adminCms'));
app.use('/api/cms', require('./src/routes/cms'));
app.use('/api/gate-papers', require('./src/routes/gatePapers'));

// ─── 404 Handler ────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Seed default dev admin ─────────────────────────────────
if (!isMongoConnected() && process.env.NODE_ENV !== 'production') {
  try {
    const localAdminStore = require('./src/store/localAdminStore');
    if (!localAdminStore.findAdminByEmail('admin@gateapex.dev')) {
      localAdminStore.createAdmin({
        name: 'Dev Admin',
        email: 'admin@gateapex.dev',
        password: 'admin123',
        role: 'super_admin',
      }).then(() => console.log('👤 Dev admin seeded: admin@gateapex.dev / admin123'))
      .catch((e) => console.error('Admin seed failed:', e.message));
    }
  } catch (e) {
    console.error('Admin seed error:', e.message);
  }
}

// ─── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Global error caught:', err.message);
  console.error(err.stack);

  // Ensure we don't crash on already-sent responses
  if (res.headersSent) {
    return next(err);
  }

  // Log the error with request context
  console.error('Request:', req.method, req.path);
  console.error('User:', req.user ? req.user._id : 'anonymous');
  console.error('Timestamp:', new Date().toISOString());

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ─── Error handling for validation middleware ────────────────
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError' || (err.message && err.message.includes('validation failed'))) {
    console.error('Validation error:', err.message);
    if (res.headersSent) {
      return next(err);
    }
    res.status(400).json({
      success: false,
      message: err.message || 'Validation failed'
    });
  }
  next(err);
});

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
let server = null;

connectDB().then(() => {
  server = app.listen(PORT, () => {
    console.log(`\n🎓 GATE 2027 API running on port ${PORT} [${process.env.NODE_ENV}]`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`💾 Data source: ${isMongoConnected() ? 'MongoDB' : 'Local (in-memory)'}\n`);

    // Start scheduler in background (non-blocking, wrapped in try/catch)
    try {
      const { startScheduler } = require('./src/services/scheduler/cronJobs');
      startScheduler();
    } catch (e) {
      console.error('⚠️ Scheduler failed to start:', e.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Close the other process or change PORT in .env`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', err.message);
    }
  });

  // ─── Graceful shutdown ─────────────────────────────────────
  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 ${signal} received — shutting down gracefully...`);

    // Stop accepting new connections
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }

    // Close MongoDB connection if connected
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      }
    } catch (e) {
      console.error('⚠️ Error closing MongoDB:', e.message);
    }

    console.log('👋 Goodbye!');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}).catch((err) => {
  console.error('FATAL: Database connection failed:', err.message);
  process.exit(1);
});

module.exports = app;
