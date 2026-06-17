// Usage: node src/scripts/createAdmin.js
// Creates the initial super admin account (MongoDB or local fallback)

require('../config/loadEnv');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const email = await ask('Admin email: ');
  const name = await ask('Admin name: ');

  const password = await ask('Admin password (min 8 chars): ');
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const confirm = await ask('Confirm password: ');
  if (password !== confirm) {
    console.error('Passwords do not match.');
    process.exit(1);
  }

  // Try MongoDB first
  let mongoose;
  try {
    mongoose = require('mongoose');
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/gate2027';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB\n');

    const Admin = require('../models/Admin');

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      console.error('An admin with this email already exists.');
      await mongoose.disconnect();
      rl.close();
      process.exit(1);
    }

    const admin = await Admin.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: 'super_admin',
      permissions: ['users.manage', 'content.manage', 'mocks.manage', 'analytics.view', 'settings.manage'],
      isActive: true,
    });

    console.log(`\n✅ Super admin created (MongoDB):`);
    console.log(`   Name:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);

    await mongoose.disconnect();
  } catch (mongoErr) {
    console.log('MongoDB not available, using local fallback...\n');

    const localAdminStore = require('../store/localAdminStore');

    try {
      const admin = await localAdminStore.createAdmin({
        name,
        email,
        password,
        role: 'super_admin',
        permissions: ['users.manage', 'content.manage', 'mocks.manage', 'analytics.view', 'settings.manage'],
      });

      console.log(`\n✅ Super admin created (local store):`);
      console.log(`   Name:  ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role:  ${admin.role}`);
      console.log(`   File:  backend/data/local_admins.json`);
    } catch (localErr) {
      console.error(localErr.message);
      process.exit(1);
    }
  }

  console.log(`\nYou can now log in at /admin/login`);
  rl.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
