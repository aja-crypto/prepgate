const router = require('express').Router();
const { isMongoConnected } = require('../config/db');
const Insight = require('../models/Insight');

// GET /api/insights — list all insights with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, category, featured, search, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (!isMongoConnected()) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const insights = await Insight.find(filter)
      .select('title slug type category icon color hero summary kpis tags isFeatured views createdAt updatedAt')
      .sort({ isFeatured: -1, views: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: insights.length, data: insights });
  } catch (err) {
    console.error('[Insights] List error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch insights' });
  }
});

// GET /api/insights/:slug — single insight with full data
router.get('/:slug', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(404).json({ success: false, message: 'Insight not found' });
    }

    const insight = await Insight.findOne({ slug: req.params.slug, isActive: true })
      .populate('relatedInsights', 'title slug type icon color hero');

    if (!insight) {
      return res.status(404).json({ success: false, message: 'Insight not found' });
    }

    // Increment views
    Insight.updateOne({ _id: insight._id }, { $inc: { views: 1 } }).catch(() => {});

    res.json({ success: true, data: insight });
  } catch (err) {
    console.error('[Insights] Get error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch insight' });
  }
});

module.exports = router;
