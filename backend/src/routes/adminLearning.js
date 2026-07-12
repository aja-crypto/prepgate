const router = require('express').Router();
const { adminProtect } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');
const LearningContent = require('../models/LearningContent');

// In-memory fallback
const localStore = [];
let localIdCounter = 1;

const validTypes = ['roadmap', 'academy', 'success_story', 'resource', 'update'];

// Helper to extract YouTube ID from URL
function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// POST /api/admin/learning — create content
router.post('/', adminProtect, async (req, res) => {
  try {
    const { type, title, description, youtubeUrl, duration, difficulty, estimatedWatches, tags, category, resourceUrl, resourceCategory, resourceType, isFeatured, isOfficial, version, updateType } = req.body;

    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const youtubeId = extractYoutubeId(youtubeUrl);
    const thumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null;

    if (!isMongoConnected()) {
      const item = {
        _id: String(++localIdCounter),
        id: String(localIdCounter),
        type, title: title.trim(),
        description: description || '',
        youtubeUrl: youtubeUrl || null,
        youtubeId,
        thumbnail,
        duration: duration || null,
        difficulty: difficulty || null,
        estimatedWatches: estimatedWatches || null,
        tags: tags || [],
        category: category || null,
        resourceUrl: resourceUrl || null,
        resourceCategory: resourceCategory || null,
        resourceType: resourceType || null,
        isFeatured: isFeatured || false,
        isOfficial: isOfficial || false,
        isActive: true,
        order: 0,
        version: version || null,
        updateType: updateType || null,
        views: 0,
        uploadDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStore.unshift(item);
      return res.status(201).json({ success: true, data: item });
    }

    const item = await LearningContent.create({
      type, title: title.trim(), description, youtubeUrl, youtubeId, thumbnail,
      duration, difficulty, estimatedWatches, tags, category, resourceUrl,
      resourceCategory, resourceType, isFeatured, isOfficial, version, updateType,
      order: 0,
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error('[Admin Learning] Create error:', err);
    res.status(500).json({ success: false, message: 'Failed to create content' });
  }
});

// PUT /api/admin/learning/:id — update content
router.put('/:id', adminProtect, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.youtubeUrl) {
      updates.youtubeId = extractYoutubeId(updates.youtubeUrl);
      updates.thumbnail = updates.youtubeId ? `https://img.youtube.com/vi/${updates.youtubeId}/mqdefault.jpg` : null;
    }

    if (!isMongoConnected()) {
      const idx = localStore.findIndex(i => i._id === id || i.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Content not found' });
      localStore[idx] = { ...localStore[idx], ...updates, updatedAt: new Date() };
      return res.json({ success: true, data: localStore[idx] });
    }

    const item = await LearningContent.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Content not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    console.error('[Admin Learning] Update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update content' });
  }
});

// DELETE /api/admin/learning/:id — delete content
router.delete('/:id', adminProtect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoConnected()) {
      const idx = localStore.findIndex(i => i._id === id || i.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Content not found' });
      localStore.splice(idx, 1);
      return res.json({ success: true, message: 'Content deleted' });
    }

    const item = await LearningContent.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: 'Content not found' });
    res.json({ success: true, message: 'Content deleted' });
  } catch (err) {
    console.error('[Admin Learning] Delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete content' });
  }
});

// PATCH /api/admin/learning/:id/toggle — toggle active/featured
router.patch('/:id/toggle', adminProtect, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isFeatured } = req.body;

    if (!isMongoConnected()) {
      const idx = localStore.findIndex(i => i._id === id || i.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Content not found' });
      if (isActive !== undefined) localStore[idx].isActive = isActive;
      if (isFeatured !== undefined) localStore[idx].isFeatured = isFeatured;
      return res.json({ success: true, data: localStore[idx] });
    }

    const update = {};
    if (isActive !== undefined) update.isActive = isActive;
    if (isFeatured !== undefined) update.isFeatured = isFeatured;

    const item = await LearningContent.findByIdAndUpdate(id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Content not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    console.error('[Admin Learning] Toggle error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle content' });
  }
});

// GET /api/admin/learning — list all content (including inactive)
router.get('/', adminProtect, async (req, res) => {
  try {
    const { type } = req.query;

    if (!isMongoConnected()) {
      let items = [...localStore];
      if (type && validTypes.includes(type)) items = items.filter(i => i.type === type);
      items.sort((a, b) => b.createdAt - a.createdAt);
      return res.json({ success: true, data: items });
    }

    const filter = type && validTypes.includes(type) ? { type } : {};
    const items = await LearningContent.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('[Admin Learning] List error:', err);
    res.status(500).json({ success: false, message: 'Failed to list content' });
  }
});

module.exports = router;
