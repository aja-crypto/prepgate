require('../src/config/loadEnv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

(async () => {
  try {
    await connectDB();
    const LearningHubVideo = require('../src/models/LearningHubVideo');

    // Drop existing text index to recreate with language_override
    const col = mongoose.connection.collection('learninghubvideos');
    const indexes = await col.indexes();
    for (const idx of indexes) {
      if (idx.key && idx.key._fts === 'text') {
        await col.dropIndex(idx.name);
        console.log('Dropped old text index:', idx.name);
      }
    }

    // Ensure indexes are recreated with new options
    await LearningHubVideo.syncIndexes();
    console.log('Indexes synced');

    const dataFile = path.join(__dirname, '..', '..', 'data', 'learning_hub_videos.json');
    const videos = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    let imported = 0, skipped = 0;
    for (const v of videos) {
      if (!v.title || !v.youtubeUrl || !v.category) { skipped++; continue; }
      const exists = await LearningHubVideo.findOne({ youtubeId: v.youtubeId });
      if (exists) { skipped++; continue; }
      await LearningHubVideo.create({
        title: v.title.trim(), youtubeUrl: v.youtubeUrl, youtubeId: v.youtubeId,
        channel: v.channel || '', category: v.category, subject: v.subject || '',
        description: v.description || '', tags: v.tags || [],
        duration: v.duration || null, difficulty: v.difficulty || null,
        language: v.language || 'English', featured: v.featured || false,
        viewCount: v.viewCount || 0,
      });
      imported++;
    }
    const total = await LearningHubVideo.countDocuments();
    console.log(`Imported: ${imported}, Skipped: ${skipped}, Total: ${total}`);
    process.exit(0);
  } catch (e) {
    console.error('Failed:', e.message);
    process.exit(1);
  }
})();
