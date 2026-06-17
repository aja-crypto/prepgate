// MongoDB connection + local-dev fallback
require('./loadEnv');
const mongoose = require('mongoose');
const { enableMockAuth, isMockAuthEnabled } = require('./devMode');
const { seedDemoUser } = require('../store/mockStore');
const { seedLocalSyllabus } = require('../store/localDataStore');

let mongoConnected = false;

const connectDB = async () => {
  // Disable buffering so failed queries fail immediately instead of hanging 10s
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
    });

    mongoConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
      mongoConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      mongoConnected = false;
    });

    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      enableMockAuth();
      await seedDemoUser();
      seedLocalSyllabus();
      console.warn('⚠️  Falling back to local in-memory data (dev only)');
      return false;
    }
    process.exit(1);
  }
};

function isMongoConnected() {
  return mongoConnected && mongoose.connection.readyState === 1;
}

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;
