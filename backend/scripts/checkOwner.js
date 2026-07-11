const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
const path = require('path');
const db = require('../src/config/db');

setTimeout(async () => {
  const bcrypt = require('bcryptjs');
  const all = await Admin.find({}).lean();
  console.log('Admins:', all.length);
  for (const a of all) {
    const pw = 'GateNexa@Owner2026';
    const plainCompare = a.email === 'purruajaykumar@gmail.com' ? await bcrypt.compare(pw, a.passwordHash) : null;
    const adminCompare = a.email === 'admin@gatenexa.dev' ? await bcrypt.compare('admin123', a.passwordHash) : null;
    console.log(`  ${a.email} | role: ${a.role} | hash: ${a.passwordHash?.substring(0, 30)}... | pw_match: ${plainCompare !== null ? (plainCompare ? '✅' : '❌') : adminCompare !== null ? (adminCompare ? '✅' : '❌') : '-'}`);
  }
  process.exit(0);
}, 10000);
