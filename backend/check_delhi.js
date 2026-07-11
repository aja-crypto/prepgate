const mongoose = require('mongoose');
require('./src/config/loadEnv');
const CcmtCutoff = require('./src/models/CcmtCutoff');
async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const delhi = await CcmtCutoff.find({ institute: /Indian Institute of Technology Delhi/i, category: 'General' }).select('institute program category closingScore openingScore year').sort({closingScore:-1}).lean();
  console.log('=== IIT Delhi General programs ===');
  console.log('Total:', delhi.length);
  delhi.forEach(r => console.log('  '+r.year+' | '+r.program+' | closing='+r.closingScore+' | opening='+r.openingScore));

  const names = await CcmtCutoff.distinct('institute', { institute: /delhi/i });
  console.log('\nDistinct institute names for Delhi:', names);

  for (const name of ['Indian Institute of Technology Delhi', 'Indian Institute of Technology Madras', 'Indian Institute of Technology Bombay', 'Indian Institute of Technology Kanpur']) {
    const count = await CcmtCutoff.countDocuments({ institute: name, category: 'General' });
    console.log(name + ' General programs: ' + count);
  }
  
  await mongoose.disconnect();
  process.exit(0);
}
check().catch(e => { console.error(e.message); process.exit(1); });
