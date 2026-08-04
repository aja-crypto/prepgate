require('../src/config/loadEnv');
const mongoose = require('mongoose');
const CcmtCutoff = require('../src/models/CcmtCutoff');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  // Fix remaining comma-variant NITs
  const fixes = [
    { from: 'National Institute of Technology, Jamshedpur', to: 'National Institute of Technology Jamshedpur' },
    { from: 'National Institute of Technology, Srinagar', to: 'National Institute of Technology Srinagar' },
    { from: 'National Institute of Technology, Manipur', to: 'National Institute of Technology Manipur' },
    { from: 'National Institute of Technology, Silchar', to: 'National Institute of Technology Silchar' },
  ];
  let n = 0;
  for (const f of fixes) {
    const r = await CcmtCutoff.updateMany({ institute: f.from }, { $set: { institute: f.to } });
    n += r.modifiedCount;
    if (r.modifiedCount) console.log('  Normalized: ' + f.from + ' -> ' + f.to + ' (' + r.modifiedCount + ')');
  }
  console.log('  Total: ' + n);

  // Delete duplicate from bad "Computer Science" merge (close=730, round=3)
  const toDelete = await CcmtCutoff.findOne({
    institute: 'National Institute of Technology Jamshedpur',
    program: 'Computer Science and Engineering',
    category: 'General',
    closingScore: 730,
  });
  if (toDelete) {
    await CcmtCutoff.deleteOne({ _id: toDelete._id });
    console.log('  Deleted bad merge: close=730 (was "Computer Science" entry)');
  }

  // Final
  const all = await CcmtCutoff.find({ year: 2025 }).lean();
  const insts = [...new Set(all.map(c => c.institute))];
  const progs = [...new Set(all.map(c => c.institute + '|' + c.program))];
  console.log('\nFinal: ' + insts.length + ' institutes | ' + progs.length + ' programmes | ' + all.length + ' records');
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
