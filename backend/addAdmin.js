// Quick script to add admin to MongoDB
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('./src/config/loadEnv');

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: String,
  role: String,
  permissions: [String],
  isActive: Boolean,
  lastLogin: Date,
}, { timestamps: true });

async function addAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Admin = mongoose.model('Admin', AdminSchema);
    
    const passwordHash = await bcrypt.hash('ajay0911', 12);
    
    const admin = await Admin.findOneAndUpdate(
      { email: 'apex@admin' },
      {
        email: 'apex@admin',
        name: 'PrepGate Admin',
        password: passwordHash,
        role: 'super_admin',
        permissions: ['users.manage', 'content.manage', 'mocks.manage', 'analytics.view', 'settings.manage'],
        isActive: true,
      },
      { upsert: true, new: true }
    );
    
    console.log('Admin created/updated:', admin.email);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

addAdmin();