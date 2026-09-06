const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
const db = require('../src/config/db');

setTimeout(async () => {
  const bcrypt = require('bcryptjs');
  const all = await Admin.find({}).lean();
  console.log('Admins:', all.length);
  for (const a of all) {
    console.log(`  ${a.email} | role: ${a.role} | password hash present: ${Boolean(a.passwordHash)}`);
  }
  process.exit(0);
}, 10000);
