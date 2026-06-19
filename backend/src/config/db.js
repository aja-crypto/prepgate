// MongoDB connection + local-dev fallback
require('./loadEnv');
const mongoose = require('mongoose');
const { enableMockAuth, isMockAuthEnabled } = require('./devMode');
const { seedDemoUser } = require('../store/mockStore');
const { seedLocalSyllabus } = require('../store/localDataStore');

let mongoConnected = false;
let reconnectTimer = null;

const RECONNECT_INTERVAL_MS = 10000; // check every 10s
const MAX_RECONNECT_ATTEMPTS = 0; // 0 = unlimited

let reconnectAttempts = 0;

function setConnected(val) {
  mongoConnected = val;
  if (val) reconnectAttempts = 0;
}

function startReconnectPing() {
  if (reconnectTimer) return;
  reconnectTimer = setInterval(async () => {
    if (mongoConnected || isMockAuthEnabled()) return;
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        setConnected(true);
        console.log('✅ MongoDB reconnected (detected by health ping)');
      } else if (mongoose.connection.readyState === 0) {
        // Try reconnecting if the driver hasn't auto-recovered
        console.log('⏳ Attempting MongoDB reconnection...');
        await mongoose.connect(process.env.MONGO_URI, {
          serverSelectionTimeoutMS: 8000,
          connectTimeoutMS: 8000,
          socketTimeoutMS: 45000,
          heartbeatFrequencyMS: 10000,
          maxPoolSize: 10,
          minPoolSize: 2,
          retryWrites: true,
          w: 'majority',
        });
        setConnected(true);
        console.log('✅ MongoDB reconnected (fresh connection)');
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

  if (isMockAuthEnabled()) {
    await seedDemoUser();
    seedLocalSyllabus();
    console.warn('⚠️  MongoDB not configured – using local in-memory data (dev only)');
    console.warn('   Set a real MONGO_URI in backend/.env for full MongoDB features');
    console.warn('   Run: cd backend && npm run seed   (after setting MONGO_URI)');
    return false;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority',
    });

    setConnected(true);
    stopReconnectPing();
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

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

    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      enableMockAuth();
      await seedDemoUser();
      seedLocalSyllabus();
      console.warn('⚠️  Falling back to local in-memory data (dev only)');
      startReconnectPing(); // keep trying in background
      return false;
    }
    // In production, keep retrying instead of crashing
    console.error('⏳ Will retry MongoDB connection in background...');
    startReconnectPing();
    return false;
  }
};

function isMongoConnected() {
  return mongoConnected && mongoose.connection.readyState === 1;
}

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;
