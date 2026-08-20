// MongoDB connection + local-dev fallback
require('./loadEnv');
const mongoose = require('mongoose');
const { enableMockAuth, isMockAuthEnabled, isAutoModeEnabled, isPlaceholderUri } = require('./devMode');
const { seedDemoUser } = require('../store/mockStore');
const { seedLocalSyllabus } = require('../store/localDataStore');

let mongoConnected = false;
let reconnectTimer = null;

const RECONNECT_INTERVAL_MS = 10000;
const MAX_RECONNECT_ATTEMPTS = 0;

const POOL_SIZE = parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10;

let reconnectAttempts = 0;

function setConnected(val) {
  mongoConnected = val;
  if (val) reconnectAttempts = 0;
}

function startReconnectPing() {
  if (reconnectTimer) return;
  reconnectTimer = setInterval(async () => {
    if (mongoConnected && mongoose.connection.readyState === 1) return;
    // Keep trying to reconnect even in mock mode — predictor needs MongoDB data
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        setConnected(true);
        if (isMockAuthEnabled() && isAutoModeEnabled()) {
          console.log('✅ MongoDB reconnected — exiting local fallback mode');
        } else {
          console.log('✅ MongoDB reconnected (detected by health ping)');
        }
      } else if (mongoose.connection.readyState === 0) {
        console.log('⏳ Attempting MongoDB reconnection...');
        await mongoose.connect(process.env.MONGO_URI, {
          serverSelectionTimeoutMS: 8000,
          connectTimeoutMS: 8000,
          socketTimeoutMS: 45000,
          heartbeatFrequencyMS: 10000,
          maxPoolSize: POOL_SIZE,
          minPoolSize: 2,
          retryWrites: true,
          w: 'majority',
        });
        setConnected(true);
        stopReconnectPing();
        console.log(`✅ MongoDB reconnected (pool: ${POOL_SIZE})`);
      }
    } catch (e) {
      if (e?.message) console.error(`⏳ MongoDB reconnect attempt failed: ${e.message}`);
    }
  }, RECONNECT_INTERVAL_MS);
}

function stopReconnectPing() {
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
}

const connectDB = async () => {
  // Disable buffering so failed queries fail immediately instead of hanging
  mongoose.set('bufferCommands', false);

  // Forced mock mode — seed local data but still try MongoDB for datasets (predictor, etc.)
  if (isMockAuthEnabled() && !isAutoModeEnabled()) {
    await seedDemoUser();
    seedLocalSyllabus();
    console.warn('⚠️  USE_MOCK_AUTH=true — using local in-memory data for auth');
    // Don't return — continue to MongoDB connection attempt for data access
  }

  // Auto mode or forced MongoDB — attempt MongoDB connection
  if (process.env.MONGO_URI && !isPlaceholderUri(process.env.MONGO_URI)) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000,
        maxPoolSize: POOL_SIZE,
        minPoolSize: 2,
        retryWrites: true,
        w: 'majority',
      });

      setConnected(true);
      stopReconnectPing();
      console.log(`✅ MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name}) (pool: ${POOL_SIZE})`);

      mongoose.connection.on('connected', () => {
        console.log('🔌 MongoDB connection established');
      });

      mongoose.connection.on('error', (err) => {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        mongoConnected = false;
        startReconnectPing();
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected — will auto-reconnect');
        mongoConnected = false;
        startReconnectPing();
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        setConnected(true);
        stopReconnectPing();
      });

      // Seed demo user, local syllabus, and mock tests (even when MongoDB is connected)
      await seedDemoUser();
      seedLocalSyllabus();
      const { seedMongoMockData } = require('../utils/seedMockTests');
      await seedMongoMockData();
      console.log('📦 Local fallback data seeded (available if MongoDB disconnects)');

      // Phase 1 boot hook: ensure MediaFile indexes (additive, idempotent, guarded).
      try {
        const mediaFile = require('../models/MediaFile');
        if (mediaFile && typeof mediaFile.ensureMediaFileIndexes === 'function') {
          mediaFile.ensureMediaFileIndexes();
        }
      } catch (e) {
        console.warn('[MediaFile] index boot hook skipped:', e.message);
      }

      return true;
    } catch (error) {
      console.error(`❌ MongoDB connection failed: ${error.message}`);

      // Auto mode — fall back to local
      if (isAutoModeEnabled()) {
        console.warn('⚠️  USE_MOCK_AUTH=auto — falling back to local in-memory data');
        enableMockAuth();
        await seedDemoUser();
        seedLocalSyllabus();
        startReconnectPing(); // keep trying in background
        return false;
      }

      // Forced MongoDB in dev — fall back to local
      if (process.env.NODE_ENV === 'development') {
        enableMockAuth();
        await seedDemoUser();
        seedLocalSyllabus();
        console.warn('⚠️  Falling back to local in-memory data (dev only)');
        startReconnectPing();
        return false;
      }

      // Production — keep retrying
      console.error('⏳ Will retry MongoDB connection in background...');
      startReconnectPing();
      return false;
    }
  }

  // No valid MONGO_URI — local mode
  enableMockAuth();
  await seedDemoUser();
  seedLocalSyllabus();
  console.warn('⚠️  No valid MONGO_URI — using local in-memory data');
  return false;
};

function isMongoConnected() {
  return mongoConnected && mongoose.connection.readyState === 1;
}

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;
module.exports.isMockAuthEnabled = isMockAuthEnabled;
