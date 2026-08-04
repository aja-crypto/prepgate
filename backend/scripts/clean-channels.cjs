const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const coll = db.collection('learninghubvideos');

  // Fix verify handle placeholders
  const r1 = await coll.updateMany({ channel: { $regex: 'verify handle', $options: 'i' } }, { $set: { channel: 'GATE Prep Videos' } });
  console.log('Fixed verify handles:', r1.modifiedCount);

  // Consolidate GO Classes
  const r2 = await coll.updateMany({ channel: 'GO Classes' }, { $set: { channel: 'GO Classes for GATE CS, DA' } });
  console.log('Merged GO Classes:', r2.modifiedCount);

  // Consolidate Gate Smashers
  const r3 = await coll.updateMany({ channel: { $regex: '^Gate Smashers' } }, { $set: { channel: 'Gate Smashers' } });
  console.log('Merged Gate Smashers:', r3.modifiedCount);

  // Consolidate Amit Khurana
  const r4 = await coll.updateMany({ channel: { $regex: 'AMIT KHURANA', $options: 'i' } }, { $set: { channel: 'Amit Khurana' } });
  console.log('Merged Amit Khurana:', r4.modifiedCount);

  const remaining = await coll.countDocuments({ channel: { $in: ['', null, 'Unknown'] } });
  console.log('Still empty channels:', remaining);

  const channels = await coll.distinct('channel');
  console.log('Unique channels:', channels.length);
  channels.filter(c => c && c !== 'Unknown').sort().forEach(c => console.log('  - ' + c));

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
