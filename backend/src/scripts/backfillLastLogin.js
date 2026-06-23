// Usage: node src/scripts/backfillLastLogin.js
// Backfills lastLogin from streak.lastStudyDate for existing users

require('../config/loadEnv');

async function main() {
  console.log('=== Backfill lastLogin ===\n');

  // ── 1. MongoDB users ──
  try {
    const mongoose = require('mongoose');
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/gate2027';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    const User = require('../models/User');

    const result = await User.updateMany(
      { lastLogin: null, 'streak.lastStudyDate': { $ne: null } },
      [{ $set: { lastLogin: '$streak.lastStudyDate' } }]
    );

    console.log(`MongoDB: ${result.modifiedCount} user(s) updated`);

    await mongoose.disconnect();
  } catch (err) {
    console.log('MongoDB not available, skipping MongoDB migration.');
    console.log(`  (${err.message})`);
  }

  // ── 2. Local mock users ──
  try {
    const fs = require('fs');
    const path = require('path');
    const USERS_FILE = path.join(__dirname, '../../data/mock_users.json');

    if (!fs.existsSync(USERS_FILE)) {
      console.log('No mock_users.json found, skipping local migration.');
    } else {
      let users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      let count = 0;

      users.forEach(u => {
        if (!u.lastLogin && u.streak?.lastStudyDate) {
          u.lastLogin = u.streak.lastStudyDate;
          count++;
        }
      });

      if (count > 0) {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        console.log(`Local: ${count} mock user(s) updated`);
      } else {
        console.log('Local: no updates needed');
      }
    }
  } catch (err) {
    console.log('Failed to update local mock users:', err.message);
  }

  console.log('\nDone.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});