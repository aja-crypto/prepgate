const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const CcmtCutoff = require('../src/models/CcmtCutoff');

  const types = await CcmtCutoff.distinct('instituteType');
  console.log('Institute types:');
  for (const t of types.sort()) {
    const count = await CcmtCutoff.countDocuments({ instituteType: t });
    const institutes = await CcmtCutoff.distinct('institute', { instituteType: t });
    console.log(`  ${t}: ${count} records, ${institutes.length} institutes`);
  }

  const total = await CcmtCutoff.countDocuments();
  console.log(`\nTotal records: ${total}`);

  const pipelines = [
    { $group: { _id: { institute: '$institute', program: '$program', category: '$category', year: '$year', round: '$round' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'total' }
  ];
  const dups = await CcmtCutoff.aggregate(pipelines);
  console.log(`Duplicate groups: ${dups[0]?.total || 0}`);

  // Deduplicate: keep first occurrence, remove rest
  if (dups[0]?.total > 0) {
    const dupGroups = await CcmtCutoff.aggregate([
      { $group: { _id: { institute: '$institute', program: '$program', category: '$category', year: '$year', round: '$round' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    let removed = 0;
    for (const g of dupGroups) {
      const [keep, ...remove] = g.ids;
      await CcmtCutoff.deleteMany({ _id: { $in: remove } });
      removed += remove.length;
    }
    console.log(`Removed ${removed} duplicate records`);
  }

  await mongoose.disconnect();
})();
