const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const videos = await db.collection('learninghubvideos').find({ channel: { $nin: ['', null, 'Unknown'] } }).project({ channel: 1, category: 1, tags: 1, subject: 1, title: 1, viewCount: 1 }).toArray();
  const byCh = {};
  videos.forEach(v => {
    const ch = v.channel.trim();
    if (!byCh[ch]) byCh[ch] = { count: 0, categories: new Set(), subjects: new Set(), tags: new Set(), totalViews: 0, sampleTitle: v.title };
    byCh[ch].count++;
    if (v.category) byCh[ch].categories.add(v.category);
    if (v.subject) byCh[ch].subjects.add(v.subject);
    (v.tags || []).forEach(t => byCh[ch].tags.add(t));
    byCh[ch].totalViews += (v.viewCount || 0);
  });
  const sorted = Object.entries(byCh).sort((a, b) => b[1].count - a[1].count);
  sorted.forEach(([ch, info]) => {
    console.log(ch + '|' + info.count + '|' + [...info.categories].join(',') + '|' + [...info.subjects].join(',') + '|' + info.totalViews + '|' + info.sampleTitle.substring(0, 40));
  });
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
