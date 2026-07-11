// Uses backend's mongoose connection to update weekly test pdfUrls
const path = require('path');
const fs = require('fs');

// Change to backend dir for module resolution
process.chdir(path.join(__dirname, '..'));

// This will trigger mongoose connection via the db config
const db = require('../src/config/db');

const base = path.join(__dirname, '..', '..', 'resources', 'weekly-tests');

async function run() {
  // Wait for mongoose connection
  const maxWait = 15000;
  const start = Date.now();
  while (require('mongoose').connection.readyState !== 1) {
    if (Date.now() - start > maxWait) {
      console.log('MongoDB connection timeout');
      process.exit(1);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('MongoDB connected');

  const filesBySubject = {};
  fs.readdirSync(base).forEach(d => {
    const p = path.join(base, d);
    if (fs.statSync(p).isDirectory()) {
      filesBySubject[d] = fs.readdirSync(p).filter(f => f.endsWith('.pdf'));
    }
  });

  const mongoose = require('mongoose');
  const coll = mongoose.connection.collection('weeklytests');
  const tests = await coll.find({}).toArray();
  console.log('Tests in MongoDB:', tests.length);

  let updated = 0;
  for (const t of tests) {
    const fn = 'Test-' + String(t.testNumber).padStart(2, '0') + '.pdf';
    if (filesBySubject[t.subject] && filesBySubject[t.subject].includes(fn)) {
      const pdfUrl = '/resources/weekly-tests/' + t.subject + '/' + fn;
      if (t.pdfUrl !== pdfUrl) {
        await coll.updateOne({ _id: t._id }, { $set: { pdfUrl } });
        console.log('  ' + t.subject + ' T' + t.testNumber + ' -> ' + pdfUrl);
        updated++;
      }
    }
  }
  console.log('Updated:', updated);
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
