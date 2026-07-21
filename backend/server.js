// server.js — GATE 2027 Backend Entry Point
require('./src/config/loadEnv');

const Sentry = require('@sentry/node');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { isMockAuthEnabled } = require('./src/config/devMode');
const { isMongoConnected } = require('./src/config/db');

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
});
const mongoSanitize = require('express-mongo-sanitize');
const { getAuditLogs } = require('./src/services/auditLog');
const { adminProtect, requirePermission } = require('./src/middleware/adminAuth');
const { responseCacheMiddleware } = require('./src/middleware/cache');

const app = express();

// --- Server start tracking ─────────────────────────────---
const SERVER_START_TIME = Date.now();
let isShuttingDown = false;

// Fail startup if critical secrets are missing or placeholders
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGIN', 'MONGO_URI', 'BACKEND_URL'];
const PLACEHOLDER_PATTERNS = ['placeholder', 'your_', 'replace_with'];
function isPlaceholder(val) {
  return !val || PLACEHOLDER_PATTERNS.some(p => val.includes(p));
}
const missing = REQUIRED_ENV.filter(key => isPlaceholder(process.env[key]));
if (missing.length > 0) {
  console.error(`[STARTUP FAIL] Missing or placeholder env vars: ${missing.join(', ')}`);
  console.error('  Copy .env.example to .env and fill in your values:');
  console.error('  cp .env.example .env');
  process.exit(1);
}

// Warn about optional but recommended env vars
const RECOMMENDED_ENV = ['OPENROUTER_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'GOOGLE_CLIENT_ID', 'CRON_SECRET'];
RECOMMENDED_ENV.forEach(key => {
  if (isPlaceholder(process.env[key])) {
    console.warn(`[STARTUP WARNING] ${key} is missing or still a placeholder. Set it for full functionality.`);
  }
});

// --- Global crash handlers (must be before anything else) --
process.on('unhandledRejection', (reason) => {
  console.error('?? Unhandled Rejection:', reason instanceof Error ? reason.message : reason);
  // Do NOT exit � let the app continue running
});

process.on('uncaughtException', (err) => {
  console.error('?? Uncaught Exception:', err.message);
  // Log full error but don't exit � the app may still function
  console.error(err.stack);
  // Only exit if the error indicates corruption (e.g., EADDRINUSE)
  if (err.code === 'EADDRINUSE') {
    console.error('Port in use � cannot start server. Exiting.');
    process.exit(1);
  }
  // For all other uncaught exceptions, attempt graceful recovery
});

// --- Security Middleware ─────────────────────────────────---
const isViteDev = process.env.NODE_ENV !== 'production';
const cspDirectives = {
  defaultSrc: ["'self'"],
  // Vite dev needs 'unsafe-inline' for HMR, but production should be strict
  scriptSrc: ["'self'", ...(isViteDev ? ["'unsafe-inline'", "'unsafe-eval'"] : [])],
  connectSrc: ["'self'", ...(isViteDev
    ? ["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5200", "http://127.0.0.1:5200"]
    : (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)),
    "https://api.openai.com", "https://openrouter.ai", "https://api.cloudinary.com"
  ],
  imgSrc: ["'self'", "data:", "https:", ...(isViteDev
    ? ["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5200", "http://127.0.0.1:5200"]
    : [])],
  // In production, use nonce-based styles; fallback to unsafe-inline only when necessary
  styleSrc: ["'self'", ...(isViteDev ? ["'unsafe-inline'"] : []), "https:"],
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
  frameguard: { action: 'sameorigin' },
  // No sniffing MIME types
  noSniff: true,
  // XSS filter
  xssFilter: true,
}));
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : (process.env.NODE_ENV === 'production'
    ? (() => { console.error('[STARTUP FAIL] CORS_ORIGIN not set in production � cannot start.'); process.exit(1); })()
    : ['http://localhost:5200', 'http://127.0.0.1:5200', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']);

// In production, also allow Vercel preview deployments (*.vercel.app)
if (process.env.NODE_ENV === 'production') {
  ALLOWED_ORIGINS.push(/^https:\/\/.*\.vercel\.app$/);
}

// @sentry/node v10+ removed Handlers.requestHandler(); Express instrumentation is automatic via init
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Check against string origins
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Check against regex patterns (for Vercel preview deployments)
    if (ALLOWED_ORIGINS.some(pattern => pattern instanceof RegExp && pattern.test(origin))) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-User']
}));



// --- Rate Limiting ───────────────────────────────────────---
const isDev = process.env.NODE_ENV !== 'production';

// Custom in-memory sliding window rate limiter (replaces express-rate-limit which hangs on routes)
function rl(windowMs, max, skip) {
  const store = new Map();
  // Periodic cleanup of expired entries (runs every windowMs/2)
  const cleanup = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, record] of store) {
      if (record.start < cutoff) store.delete(key);
    }
  }, Math.max(windowMs / 2, 30000));
  cleanup.unref();
  return (req, res, next) => {
    if (skip && skip(req)) return next();
    const key = req.ip || req.headers['x-forwarded-for'] || 'default';
    const now = Date.now();
    let record = store.get(key);
    if (!record || now - record.start > windowMs) {
      record = { start: now, count: 0 };
    }
    record.count++;
    store.set(key, record);
    if (record.count > max) {
      return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
    }
    next();
  };
}

app.use('/api/auth/login', rl(15 * 60 * 1000, isDev ? 30 : 10));
app.use('/api/auth/forgot-password', rl(60 * 60 * 1000, isDev ? 10 : 3));
app.use('/api/auth/reset-password', rl(60 * 60 * 1000, isDev ? 10 : 3));

app.use('/api/admin/', rl(15 * 60 * 1000, isDev ? 500 : 100));

app.use('/api/ai/', rl(1 * 60 * 1000, isDev ? 120 : 10));

app.use('/api/predictor/predict', rl(1 * 60 * 1000, isDev ? 120 : 5, (req) => req.headers['x-demo-user'] || req.headers['x-testing']));

app.use('/api/notes', rl(1 * 60 * 1000, isDev ? 30 : 5));
app.use('/api/short-notes/upload', rl(1 * 60 * 1000, isDev ? 20 : 5));
app.use('/api/weekly-tests/upload', rl(1 * 60 * 1000, isDev ? 20 : 5));
app.use('/api/admin/pdfs/upload', rl(1 * 60 * 1000, isDev ? 30 : 10));
app.use('/api/admin/pyq/upload-pdf', rl(1 * 60 * 1000, isDev ? 20 : 5));
app.use('/api/admin/gate-vault/upload', rl(1 * 60 * 1000, isDev ? 20 : 5));

const path = require('path');

// --- Middleware ──────────────────────────────────────────---
// --- Middleware ---
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));
app.use(responseCacheMiddleware);
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Ensure uploads directory exists on startup (Render disk or local)
const uploadsDir = path.join(__dirname, 'uploads');
const uploadsNotesDir = path.join(uploadsDir, 'notes');
if (!require('fs').existsSync(uploadsDir)) require('fs').mkdirSync(uploadsDir, { recursive: true });
if (!require('fs').existsSync(uploadsNotesDir)) require('fs').mkdirSync(uploadsNotesDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));
app.use('/resources', express.static(path.join(__dirname, '..', 'resources')));

// --- Logging (production: combined, development: dev) ---
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: (req) => req.url === '/health' || req.url === '/api/health',
  }));
} else {
  app.use(morgan('dev'));
}

// --- Health Check ────────────────────────────────────────---
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

// --- Admin Health Check ──────────────────────────────────---
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

// --- Admin API Health Check ──────────────────────────────---
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

// --- Startup Validation ───────────────────────────────────---
const validateStartup = () => {
  console.log('?? Validating startup configuration...');
  
  const issues = [];
  
  // Check critical secrets
  const criticalSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGIN', 'BACKEND_URL'];
  criticalSecrets.forEach(key => {
    if (!process.env[key] || PLACEHOLDER_PATTERNS.some(p => process.env[key].includes(p))) {
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
    const adminExists = localAdminStore.findAdminByEmail('admin@gatenexa.dev');
    if (!adminExists) {
      issues.push('Default admin account not found');
    }
  } catch (e) {
    issues.push('Cannot verify admin configuration');
  }
  
  if (issues.length > 0) {
    console.warn('?? Startup validation issues:');
    issues.forEach(issue => console.warn('  ', issue));
  } else {
    console.log('? Startup validation passed');
  }
  
  return issues;
};

// Run startup validation after health checks
validateStartup();

// --- Middleware: reject requests during shutdown ─────────---
app.use((req, res, next) => {
  if (isShuttingDown) {
    return res.status(503).json({ success: false, message: 'Server is shutting down. Try again shortly.' });
  }
  next();
});



// --- API Routes ──────────────────────────────────────────---
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/referral', require('./src/routes/referral'));
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

// Admin audit log endpoint
app.get('/api/admin/audit-logs', adminProtect, requirePermission('settings.manage'), (req, res) => {
  const logs = getAuditLogs({ action: req.query.action, admin: req.query.admin, resource: req.query.resource, since: req.query.since, limit: parseInt(req.query.limit) });
  res.json({ success: true, ...logs });
});
app.use('/api/gate-vault', require('./src/routes/gateVault'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/user/feedback', require('./src/routes/userFeedback'));
app.use('/api/live', require('./src/routes/liveData'));
app.use('/api/cron', require('./src/routes/cron'));
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/resources', require('./src/routes/resources'));
app.use('/api/feedback', require('./src/routes/feedback'));
app.use('/api/weekly-tests', require('./src/routes/weeklyTests'));
app.use('/api/short-notes', require('./src/routes/shortNotes'));
app.use('/api/mock-tests', require('./src/routes/mockTests'));
app.use('/api/mistakes', require('./src/routes/mistakeEntries'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/study-plan', require('./src/routes/studyPlan'));
app.use('/api/protected', require('./src/routes/protectedDocs'));
app.use('/api/landing', require('./src/routes/landing'));
app.use('/api/cms', require('./src/routes/cms'));
app.use('/api/gate-papers', require('./src/routes/gatePapers'));
app.use('/api/calendar', require('./src/routes/calendar'));
app.use('/api/predictor', require('./src/routes/predictor'));
app.use('/api/admin/predictor', require('./src/routes/adminPredictor'));
app.use('/api/learning', require('./src/routes/learning'));
app.use('/api/admin/learning', require('./src/routes/adminLearning'));

// --- 404 Handler ─────────────────────────────────────────---
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// --- Seed default dev admin & owner ──────────────────────---
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'GateNexa@Owner2026';
const DEV_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

if (!isMongoConnected() && process.env.NODE_ENV !== 'production') {
  try {
    const localAdminStore = require('./src/store/localAdminStore');
    if (!localAdminStore.findAdminByEmail('admin@gatenexa.dev')) {
      localAdminStore.createAdmin({
        name: 'Dev Admin',
        email: 'admin@gatenexa.dev',
        password: DEV_ADMIN_PASSWORD,
        role: 'super_admin',
      }).then(() => console.log('?? Dev admin seeded: admin@gatenexa.dev / admin123'))
      .catch((e) => console.error('Admin seed failed:', e.message));
    }
    if (!localAdminStore.findAdminByEmail('purruajaykumar@gmail.com')) {
      localAdminStore.createAdmin({
        name: 'Owner',
        email: 'purruajaykumar@gmail.com',
        password: OWNER_PASSWORD,
        role: 'owner',
      }).then(() => console.log('?? Owner seeded: purruajaykumar@gmail.com'))
      .catch((e) => console.error('Owner seed failed:', e.message));
    }
  } catch (e) {
    console.error('Admin seed error:', e.message);
  }
}

// --- Sentry Error Handler (must be before global handler) ---
  if (typeof Sentry.expressErrorHandler === 'function') {
    app.use(Sentry.expressErrorHandler());
  }

// --- Global Error Handler ────────────────────────────────---
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('Global error:', err.message, req.method, req.path, 'User:', req.user?._id || 'anon');
  errorHandler(err, req, res, next);
});

// --- Error handling for validation middleware ─────────────---
// --- Start Server ────────────────────────────────────────---
const PORT = process.env.PORT || 5000;
let server = null;

// Only auto-start when run directly (not when imported by tests)
if (require.main === module) {
connectDB().then(async () => {
  // Seed dev admin in MongoDB if connected
  if (isMongoConnected()) {
    try {
      const Admin = require('./src/models/Admin');
      let existing = await Admin.findOne({ email: 'admin@gatenexa.dev' });
      if (!existing) {
        await Admin.create({
          name: 'Dev Admin',
          email: 'admin@gatenexa.dev',
          passwordHash: DEV_ADMIN_PASSWORD,
          role: 'super_admin',
          isActive: true,
        });
        console.log('Dev admin seeded in MongoDB: admin@gatenexa.dev');
      } else {
        existing.passwordHash = DEV_ADMIN_PASSWORD;
        await existing.save();
        console.log('Dev admin password updated');
      }
    } catch (e) {
      console.error('Admin MongoDB seed error:', e.message);
    }

    // Seed owner in Admin model
    try {
      const Admin = require('./src/models/Admin');
      const User = require('./src/models/User');
      const ownerEmail = 'purruajaykumar@gmail.com';
      const existing = await Admin.findOne({ email: ownerEmail });
      if (!existing) {
        await Admin.create({
          name: 'Owner', email: ownerEmail,
          passwordHash: OWNER_PASSWORD, role: 'owner', isActive: true,
        });
        console.log('?? Owner created in Admin model');
      } else {
        existing.passwordHash = OWNER_PASSWORD;
        existing.role = 'owner';
        await existing.save();
        console.log('?? Owner password updated in Admin model');
      }
      // Also seed owner in User model so they can login via /api/auth/login
      let ownerUser = await User.findOne({ email: ownerEmail }).select('+password');
      if (!ownerUser) {
        await User.create({
          name: 'Owner',
          email: ownerEmail,
          password: OWNER_PASSWORD,
          role: 'owner',
          isPremium: true,
        });
        console.log('?? Owner User created');
      } else {
        ownerUser.password = OWNER_PASSWORD;
        ownerUser.role = 'owner';
        await ownerUser.save({ validateBeforeSave: false });
        console.log('?? Owner User password updated');
      }
    } catch (e) {
      console.error('Owner seed error:', e.message);
    }
  }

  server = app.listen(PORT, () => {
    console.log(`\nGATE 2027 API running on port ${PORT} [${process.env.NODE_ENV}]`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Data source: ${isMongoConnected() ? 'MongoDB' : 'Local (in-memory)'}\n`);

    // Start scheduler in background (non-blocking, wrapped in try/catch)
    try {
      const { startScheduler } = require('./src/services/scheduler/cronJobs');
      startScheduler();
    } catch (e) {
      console.error('?? Scheduler failed to start:', e.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`? Port ${PORT} is already in use. Close the other process or change PORT in .env`);
      process.exit(1);
    } else {
      console.error('? Server error:', err.message);
    }
  });

  // --- Graceful shutdown ──────────────────────────────────---
  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n?? ${signal} received � shutting down gracefully...`);

    // Stop accepting new connections
    if (server) {
      server.close(() => {
        console.log('? HTTP server closed');
      });
    }

    // Close MongoDB connection if connected
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('? MongoDB connection closed');
      }
    } catch (e) {
      console.error('?? Error closing MongoDB:', e.message);
    }

    console.log('?? Goodbye!');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}).catch((err) => {
  console.error('FATAL: Database connection failed:', err.message);
  process.exit(1);
});
}

module.exports = app;
