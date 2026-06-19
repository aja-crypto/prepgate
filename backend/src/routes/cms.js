const router = require('express').Router();
const mongoose = require('mongoose');
const { isMongoConnected } = require('../config/db');
const { CmsFeaturedResource } = require('../models/CmsContent');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Lazy-load models (they may not exist if MongoDB isn't connected at module bootstrap)
function getModel(name) {
  try {
    return mongoose.model(name);
  } catch {
    return null;
  }
}

// ─── Fallback data ──────────────────────────────────────────
const FALLBACK_INSIGHT = {
  title: 'GATE 2027 Monthly Insights',
  description: 'Stay updated with the latest GATE exam patterns, important topics, and strategic recommendations.',
  priority: 1,
  relatedSubjects: ['Mathematics', 'Aptitude', 'Data Structures'],
  topics: [
    { name: 'Linear Algebra', weightage: 8.5, trend: 'increasing' },
    { name: 'Graph Theory', weightage: 7.2, trend: 'stable' },
  ],
  recommendations: ['Focus on numerical problems', 'Practice daily revision'],
};

const FALLBACK_QUOTE = {
  quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
  author: 'Winston Churchill',
  category: 'daily',
};

const FALLBACK_RESOURCES = [
  { title: 'Complete Engineering Mathematics Notes', description: 'Comprehensive notes covering all topics', resourceType: 'notes', url: '/study-hub' },
  { title: 'PYQ Solutions 2020-2024', description: 'Previous year question solutions with explanations', resourceType: 'pdf', url: '/pyq' },
];

// ─── GET Insights ───────────────────────────────────────────
router.get('/insights', asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    return res.json({ success: true, data: [FALLBACK_INSIGHT] });
  }

  const Insight = getModel('Insight');
  if (!Insight) return res.json({ success: true, data: [FALLBACK_INSIGHT] });

  const insights = await Insight.find({ isPublished: true, isDeleted: { $ne: true } })
    .sort({ priority: -1, createdAt: -1 })
    .limit(10)
    .lean();

  res.json({ success: true, data: insights.length ? insights : [FALLBACK_INSIGHT] });
}));

// ─── GET Active Challenges ──────────────────────────────────
router.get('/challenges', asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    return res.json({ success: true, data: [] });
  }

  const Challenge = getModel('Challenge');
  if (!Challenge) return res.json({ success: true, data: [] });

  const challenges = await Challenge.find({
    isPublished: true,
    isDeleted: { $ne: true },
    endDate: { $gte: new Date() },
  })
    .sort({ startDate: -1 })
    .lean();

  res.json({ success: true, data: challenges });
}));

// ─── GET Daily Motivation ───────────────────────────────────
router.get('/motivation', asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    return res.json({ success: true, data: FALLBACK_QUOTE });
  }

  const MotivationQuote = getModel('MotivationQuote');
  if (!MotivationQuote) return res.json({ success: true, data: FALLBACK_QUOTE });

  const quotes = await MotivationQuote.find({ isActive: true, isDeleted: { $ne: true } }).lean();
  if (!quotes.length) return res.json({ success: true, data: FALLBACK_QUOTE });

  const today = new Date().getDate();
  const dailyQuote = quotes[today % quotes.length];
  res.json({ success: true, data: dailyQuote });
}));

// ─── GET Featured Resources ─────────────────────────────────
router.get('/featured-resources', asyncHandler(async (req, res) => {
  const { type, limit = 6 } = req.query;

  if (!isMongoConnected()) {
    let data = FALLBACK_RESOURCES;
    if (type) data = data.filter(r => r.resourceType === type);
    return res.json({ success: true, data: data.slice(0, parseInt(limit)) });
  }

  if (!CmsFeaturedResource) return res.json({ success: true, data: FALLBACK_RESOURCES.slice(0, parseInt(limit)) });

  const filter = { isPublished: true, isDeleted: { $ne: true } };
  if (type) filter.resourceType = type;

  const resources = await CmsFeaturedResource.find(filter)
    .sort({ isFeatured: -1, priority: -1 })
    .limit(parseInt(limit))
    .lean();

  res.json({ success: true, data: resources.length ? resources : FALLBACK_RESOURCES.slice(0, parseInt(limit)) });
}));

// ─── GET Featured Content ───────────────────────────────────
router.get('/featured-content', asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    return res.json({ success: true, data: [] });
  }

  const FeaturedContent = getModel('FeaturedContent');
  if (!FeaturedContent) return res.json({ success: true, data: [] });

  const items = await FeaturedContent.find({ isPublished: true, isDeleted: { $ne: true } })
    .sort({ priority: -1 })
    .limit(12)
    .lean();

  res.json({ success: true, data: items });
}));

// ─── GET Active Announcements ───────────────────────────────
router.get('/announcements', asyncHandler(async (req, res) => {
  const now = new Date();

  if (!isMongoConnected()) {
    return res.json({ success: true, data: [] });
  }

  const Announcement = getModel('Announcement');
  if (!Announcement) return res.json({ success: true, data: [] });

  const announcements = await Announcement.find({
    isPublished: true,
    isDeleted: { $ne: true },
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .sort({ priority: -1, createdAt: -1 })
    .limit(5)
    .lean();

  res.json({ success: true, data: announcements });
}));

module.exports = router;
