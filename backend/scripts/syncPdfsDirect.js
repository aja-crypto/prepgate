// Direct MongoDB update with mongoose - run from backend dir
// This re-uses the backend's models

const path = require('path');
const fs = require('fs');

// Use NODE_PATH to find modules
process.env.NODE_PATH = path.join(__dirname, '..', 'node_modules');
require('module').Module._initPaths();

const mongoose = require('mongoose');
const base = path.join(__dirname, '..', '..', 'resources', 'weekly-tests');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gate2027';
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Connected');

  // Build file map
  const filesBySubject = {};
  fs.readdirSync(base).forEach(d => {
    const p = path.join(base, d);
    if (fs.statSync(p).isDirectory()) {
      filesBySubject[d] = fs.readdirSync(p).filter(f => f.endsWith('.pdf'));
    }
  });

  const coll = mongoose.connection.collection('weeklytests');
  const tests = await coll.find({}).toArray();
  console.log(`Found ${tests.length} tests`);

  let updated = 0;
  for (const t of tests) {
    const fn = 'Test-' + String(t.testNumber).padStart(2, '0') + '.pdf';
    if (filesBySubject[t.subject] && filesBySubject[t.subject].includes(fn)) {
      const pdfUrl = '/resources/weekly-tests/' + t.subject + '/' + fn;
      if (t.pdfUrl !== pdfUrl) {
        await coll.updateOne({ _id: t._id }, { '$set': { pdfUrl } });
        console.log(`  ✅ ${t.subject} T${t.testNumber}: ${pdfUrl}`);
        updated++;
      }
    }
  }
  
  console.log(`\nUpdated ${updated} tests`);
  await mongoose.disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
