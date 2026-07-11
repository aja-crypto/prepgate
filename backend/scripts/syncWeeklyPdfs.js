// Run from backend directory: node scripts/syncWeeklyPdfs.js
// Syncs weekly test PDFs from disk to MongoDB/localStore

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://gate2027:l2M2shH2nRfQVLFA@ac-pmpdzxm-shard-00-00.sa6kujd.mongodb.net/gate2027?retryWrites=true&w=majority&appName=Cluster0';
const base = path.join(__dirname, '..', '..', 'resources', 'weekly-tests');

async function main() {
  // Connect to MongoDB
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (e) {
    console.log('❌ MongoDB connection failed, using localDataStore');
    // Fall back to localDataStore
    const store = require('../src/store/localDataStore');
    return syncLocal(store);
  }

  // Build file map
  const filesBySubject = {};
  if (fs.existsSync(base)) {
    fs.readdirSync(base).forEach(d => {
      const p = path.join(base, d);
      if (fs.statSync(p).isDirectory()) {
        filesBySubject[d] = fs.readdirSync(p).filter(f => f.endsWith('.pdf'));
      }
    });
  }
  console.log('Files on disk:', Object.keys(filesBySubject).length, 'subjects');

  // Define model
  const WeeklyTest = mongoose.model('WeeklyTest', new mongoose.Schema({
    subject: String, testNumber: Number, pdfUrl: String,
  }, { strict: false, collection: 'weeklytests' }));

  const tests = await WeeklyTest.find({});
  console.log('Tests in MongoDB:', tests.length);

  let updated = 0;
  for (const t of tests) {
    const fn = 'Test-' + String(t.testNumber).padStart(2, '0') + '.pdf';
    if (filesBySubject[t.subject] && filesBySubject[t.subject].includes(fn)) {
      const pdfUrl = '/resources/weekly-tests/' + t.subject + '/' + fn;
      if (t.pdfUrl !== pdfUrl) {
        await WeeklyTest.findByIdAndUpdate(t._id, { pdfUrl });
        console.log(`  ✅ ${t.subject} Test-${t.testNumber}: ${pdfUrl}`);
        updated++;
      }
    }
  }
  console.log(`\nUpdated ${updated} tests in MongoDB`);
  await mongoose.disconnect();
}

function syncLocal(store) {
  const filesBySubject = {};
  fs.readdirSync(base).forEach(d => {
    const p = path.join(base, d);
    if (fs.statSync(p).isDirectory()) {
      filesBySubject[d] = fs.readdirSync(p).filter(f => f.endsWith('.pdf'));
    }
  });
  // The localDataStore's array can be updated directly
  const tests = store.getLocalWeeklyTests();
  tests.forEach(t => {
    const fn = 'Test-' + String(t.testNumber).padStart(2, '0') + '.pdf';
    if (filesBySubject[t.subject] && filesBySubject[t.subject].includes(fn)) {
      const pdfUrl = '/resources/weekly-tests/' + t.subject + '/' + fn;
      store.updateLocalWeeklyTestPdfUrl(t._id || t.id, pdfUrl);
      console.log(`  ✅ ${t.subject} Test-${t.testNumber}: ${pdfUrl}`);
    }
  });
  console.log('Local store updated');
  process.exit(0);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
