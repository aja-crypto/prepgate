require('../config/loadEnv');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }
  
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');
  
  const existing = await Admin.findOne({ email: 'qaadmin@test.com' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }
  
  // Use collection.insertOne to bypass pre-save hook (avoids double hashing)
  const passwordHash = await bcrypt.hash('QaAdmin123!', 12);
  const result = await Admin.collection.insertOne({
    name: 'QA Admin',
    email: 'qaadmin@test.com',
    passwordHash,
    role: 'super_admin',
    permissions: ['users.manage', 'content.manage', 'mocks.manage', 'analytics.view', 'settings.manage'],
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  console.log('Admin created in MongoDB:', result.insertedId);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
