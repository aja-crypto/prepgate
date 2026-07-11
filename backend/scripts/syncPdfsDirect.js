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
  const uri = 'mongodb://gate2027:l2M2shH2nRfQVLFA@ac-pmpdzxm-shard-00-00.sa6kujd.mongodb.net:27017,ac-pmpdzxm-shard-00-01.sa6kujd.mongodb.net:27017,ac-pmpdzxm-shard-00-02.sa6kujd.mongodb.net:27017/gate2027?ssl=true&replicaSet=atlas-l9vk3z-shard-0&authSource=admin&retryWrites=true&w=majority';
  
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
