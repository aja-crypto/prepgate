const router = require('express').Router();
const { parsePagination } = require('../utils/pagination');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');
const LearningHubVideo = require('../models/LearningHubVideo');
const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, '..', '..', '..', 'data', 'learning_hub_videos.json');

function readLocalVideos() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch { return []; }
}

function writeLocalVideos(videos) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2), 'utf-8');
}

// ─── Public: GET / — list videos with filters, search, pagination ───
router.get('/', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      let videos = readLocalVideos();
      const { category, subject, difficulty, language, featured, search, sort } = req.query;
      const { page, limit, skip } = parsePagination(req.query, { limit: 50 });
      if (category && category !== 'All') videos = videos.filter(v => v.category === category);
      if (subject) videos = videos.filter(v => v.subject === subject);
      if (difficulty) videos = videos.filter(v => v.difficulty === difficulty);
      if (language) videos = videos.filter(v => v.language === language);
      if (featured === 'true') videos = videos.filter(v => v.featured);
      if (search) {
        const q = String(search).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        videos = videos.filter(v =>
          (v.title && v.title.toLowerCase().includes(q)) ||
          (v.description && v.description.toLowerCase().includes(q)) ||
          (v.channel && v.channel.toLowerCase().includes(q)) ||
          (v.tags && v.tags.some(t => t.toLowerCase().includes(q)))
        );
      }
      if (sort === 'title') videos.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      else if (sort === 'oldest') videos.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      else if (sort === 'views') videos.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      else videos.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      const total = videos.length;
      const paged = videos.slice(skip, skip + limit);
      return res.json({ success: true, count: paged.length, data: paged, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }
    const { category, subject, difficulty, language, featured, search, sort } = req.query;
    const { page, limit, skip } = parsePagination(req.query, { limit: 50 });

    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (language) filter.language = language;
    if (featured === 'true') filter.featured = true;
    if (search) {
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { channel: { $regex: safe, $options: 'i' } },
        { tags: { $regex: safe, $options: 'i' } },
      ];
    }

    let sortOption = { featured: -1, createdAt: -1 };
    if (sort === 'title') sortOption = { title: 1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'views') sortOption = { viewCount: -1 };

    const [videos, total] = await Promise.all([
      LearningHubVideo.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      LearningHubVideo.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: videos.length,
      data: videos,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (e) { next(e); }
});

// ─── Admin: GET /export/json — export all videos as JSON ───
router.get('/export/json', adminProtect, async (req, res, next) => {
  try {
    const videos = !isMongoConnected() ? readLocalVideos() : await LearningHubVideo.find().sort({ createdAt: -1 }).lean();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=learning_hub_videos_${Date.now()}.json`);
    res.json({ success: true, count: videos.length, data: videos });
  } catch (e) { next(e); }
});

// ─── Public: GET /:id — single video ───
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const videos = readLocalVideos();
      const video = videos.find(v => v._id === req.params.id || v.youtubeId === req.params.id);
      if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
      return res.json({ success: true, data: video });
    }
    const video = await LearningHubVideo.findById(req.params.id).lean();
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, data: video });
  } catch (e) { next(e); }
});

// ─── Public: PATCH /:id/view — increment view count ───
router.patch('/:id/view', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const videos = readLocalVideos();
      const idx = videos.findIndex(v => v._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Video not found' });
      videos[idx].viewCount = (videos[idx].viewCount || 0) + 1;
      writeLocalVideos(videos);
      return res.json({ success: true, data: { viewCount: videos[idx].viewCount } });
    }
    const video = await LearningHubVideo.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true, select: 'viewCount' }
    );
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, data: { viewCount: video.viewCount } });
  } catch (e) { next(e); }
});

// ─── Admin: POST / — create video ───
router.post('/', adminProtect, async (req, res, next) => {
  try {
    const { title, youtubeUrl, channel, category, subject, description, tags, duration, difficulty, language, featured } = req.body;
    if (!title || !youtubeUrl || !category) {
      return res.status(400).json({ success: false, message: 'Title, YouTube URL, and category are required' });
    }
    const youtubeId = LearningHubVideo.extractYoutubeId(youtubeUrl);
    if (!youtubeId) {
      return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
    }
    const thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    if (!isMongoConnected()) {
      const videos = readLocalVideos();
      if (videos.find(v => v.youtubeId === youtubeId)) {
        return res.status(409).json({ success: false, message: 'Video already exists with this YouTube ID' });
      }
      const video = {
        _id: `local_${Date.now()}`,
        title: title.trim(), youtubeUrl, youtubeId, thumbnail,
        channel: channel || '', category, subject: subject || '',
        description: description || '', tags: tags || [],
        duration: duration || null, difficulty: difficulty || null,
        language: language || 'English', featured: featured || false,
        viewCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      videos.push(video);
      writeLocalVideos(videos);
      return res.status(201).json({ success: true, data: video });
    }
    const existing = await LearningHubVideo.findOne({ youtubeId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Video already exists with this YouTube ID' });
    }
    const video = await LearningHubVideo.create({
      title: title.trim(), youtubeUrl, youtubeId, thumbnail,
      channel: channel || '', category, subject: subject || '',
      description: description || '', tags: tags || [],
      duration: duration || null, difficulty: difficulty || null,
      language: language || 'English', featured: featured || false,
    });
    res.status(201).json({ success: true, data: video });
  } catch (e) { next(e); }
});

// ─── Admin: PUT /:id — update video ───
router.put('/:id', adminProtect, async (req, res, next) => {
  try {
    const updates = {};
    const allowed = ['title', 'youtubeUrl', 'channel', 'category', 'subject', 'description', 'tags', 'duration', 'difficulty', 'language', 'featured'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.youtubeUrl) {
      const youtubeId = LearningHubVideo.extractYoutubeId(updates.youtubeUrl);
      if (!youtubeId) return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
      updates.youtubeId = youtubeId;
      updates.thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
    if (!isMongoConnected()) {
      const videos = readLocalVideos();
      const idx = videos.findIndex(v => v._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Video not found' });
      if (updates.youtubeId && videos.find((v, i) => i !== idx && v.youtubeId === updates.youtubeId)) {
        return res.status(409).json({ success: false, message: 'Another video already has this YouTube ID' });
      }
      videos[idx] = { ...videos[idx], ...updates, updatedAt: new Date().toISOString() };
      writeLocalVideos(videos);
      return res.json({ success: true, data: videos[idx] });
    }
    if (updates.youtubeUrl) {
      const dup = await LearningHubVideo.findOne({ youtubeId: updates.youtubeId, _id: { $ne: req.params.id } });
      if (dup) return res.status(409).json({ success: false, message: 'Another video already has this YouTube ID' });
    }
    const video = await LearningHubVideo.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, data: video });
  } catch (e) { next(e); }
});

// ─── Admin: DELETE /:id — delete video ───
router.delete('/:id', adminProtect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      let videos = readLocalVideos();
      const idx = videos.findIndex(v => v._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Video not found' });
      videos.splice(idx, 1);
      writeLocalVideos(videos);
      return res.json({ success: true, message: 'Video deleted' });
    }
    const video = await LearningHubVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, message: 'Video deleted' });
  } catch (e) { next(e); }
});

// ─── Admin: POST /import — import videos from JSON ───
router.post('/import', adminProtect, async (req, res, next) => {
  try {
    const { videos } = req.body;
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide a videos array' });
    }
    let created = 0, skipped = 0, errors = [];
    for (const v of videos) {
      try {
        if (!v.title || !v.youtubeUrl || !v.category) { errors.push(`Skipped: missing required fields`); skipped++; continue; }
        const youtubeId = LearningHubVideo.extractYoutubeId(v.youtubeUrl);
        if (!youtubeId) { errors.push(`Skipped ${v.title}: invalid YouTube URL`); skipped++; continue; }
        const entry = {
          title: v.title.trim(), youtubeUrl: v.youtubeUrl, youtubeId,
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
          channel: v.channel || '', category: v.category, subject: v.subject || '',
          description: v.description || '', tags: v.tags || [],
          duration: v.duration || null, difficulty: v.difficulty || null,
          language: v.language || 'English', featured: v.featured || false,
        };
        if (!isMongoConnected()) {
          const existing = readLocalVideos();
          if (existing.find(x => x.youtubeId === youtubeId)) { skipped++; continue; }
          entry._id = `local_${Date.now()}_${created}`;
          entry.createdAt = new Date().toISOString();
          entry.updatedAt = new Date().toISOString();
          entry.viewCount = 0;
          existing.push(entry);
          writeLocalVideos(existing);
          created++;
        } else {
          const exists = await LearningHubVideo.findOne({ youtubeId });
          if (exists) { skipped++; continue; }
          await LearningHubVideo.create(entry);
          created++;
        }
      } catch (e) { errors.push(`${v.title}: ${e.message}`); skipped++; }
    }
    res.json({ success: true, created, skipped, errors: errors.slice(0, 10) });
  } catch (e) { next(e); }
});

module.exports = router;
