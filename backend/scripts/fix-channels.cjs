const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const fix = await db.collection('learninghubvideos').updateMany(
    { channel: 'Rahuram Chanthrakumar' },
    { $set: { channel: 'Rahuram Chandrakumar' } }
  );
  console.log('Fixed typo:', JSON.stringify(fix));
  const count = await db.collection('learninghubvideos').countDocuments({ $or: [{ channel: '' }, { channel: null }, { channel: 'Unknown' }] });
  console.log('Videos with empty/unknown channel:', count);
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
