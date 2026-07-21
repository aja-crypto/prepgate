require('./src/config/loadEnv');
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const m = mongoose.connection;
  const c = m.collection('learningcontents');
  
  const all = await c.find({}).project({title:1, type:1, youtubeId:1, category:1, isActive:1, isFeatured:1}).toArray();
  
  console.log('Total remaining: ' + all.length);
  
  var types = {};
  all.forEach(function(r) {
    types[r.type] = (types[r.type] || 0) + 1;
  });
  
  console.log('\nBy type:');
  Object.keys(types).forEach(function(t) {
    console.log('  ' + t + ': ' + types[t]);
  });
  
  console.log('\nAll items:');
  all.forEach(function(r) {
    console.log('  [' + r.type + '] ' + r.title?.substring(0,70) + ' | ytId=' + r.youtubeId?.substring(0,11));
  });
  
  await m.close();
  process.exit(0);
}

main().catch(function(e) { console.error(e.message); process.exit(1); });
