const router = require('express').Router();
const mongoose = require('mongoose');
const { requirePermission, adminProtect } = require('../middleware/adminAuth');
const {
  Insight, Challenge, MotivationQuote,
  CmsFeaturedResource, FeaturedContent, Announcement,
} = require('../models/CmsContent');
const { isMongoConnected } = require('../config/db');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Helper: create CRUD routes for a model
function createCrudRoutes(basePath, Model, options = {}) {
  const {
    searchFields = ['title', 'description'],
    sortDefault = { createdAt: -1 },
    populateFields = [],
  } = options;

  // ─── List (paginated, searchable, filterable) ─────────────
  router.get(`/${basePath}`, adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }

    const {
      page = 1, limit = 20, search = '', sort = '-createdAt',
      isPublished, isDeleted, ...filters
    } = req.query;

    const query = {};

    // Search across specified fields
    if (search) {
      query.$or = searchFields.map(f => ({
        [f]: { $regex: search, $options: 'i' },
      }));
    }

    // Filter by publish/deleted status
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (isDeleted !== undefined) query.isDeleted = isDeleted === 'true';
    else query.isDeleted = { $ne: true }; // hide soft-deleted by default

    // Additional filters (e.g., contentType, resourceType, month)
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        query[key] = val;
      }
    });

    // Parse sort
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith('-') ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Model.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .populate(populateFields)
        .lean(),
      Model.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  }));

  // ─── Get single ────────────────────────────────────────────
  router.get(`/${basePath}/:id`, adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }

    const item = await Model.findById(req.params.id).populate(populateFields).lean();
    if (!item) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, data: item });
  }));

  // ─── Create ────────────────────────────────────────────────
  router.post(`/${basePath}`, adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }

    const item = await Model.create(req.body);
    res.status(201).json({ success: true, data: item });
  }));

  // ─── Update ────────────────────────────────────────────────
  router.put(`/${basePath}/:id`, adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }

    const item = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, data: item });
  }));

  // ─── Soft delete ───────────────────────────────────────────
  router.delete(`/${basePath}/:id`, adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }

    const item = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, message: 'Deleted successfully' });
  }));

  // ─── Toggle publish ────────────────────────────────────────
  router.patch(`/${basePath}/:id/publish`, adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }

    const { isPublished } = req.body;
    const item = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: { isPublished } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({ success: true, data: item });
  }));

  // ─── Bulk delete ───────────────────────────────────────────
  router.post(`/${basePath}/bulk/delete`, adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }

    await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: true } }
    );

    res.json({ success: true, message: `${ids.length} items deleted` });
  }));

  // ─── Bulk publish ──────────────────────────────────────────
  router.post(`/${basePath}/bulk/publish`, adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }

    const { ids, isPublished } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }

    await Model.updateMany(
      { _id: { $in: ids } },
      { $set: { isPublished } }
    );

    res.json({ success: true, message: `${ids.length} items updated` });
  }));
}

// ─── Register CRUD for all 6 content types ──────────────────
createCrudRoutes('insights', Insight, {
  searchFields: ['title', 'description'],
  sortDefault: { month: -1, priority: -1 },
});

createCrudRoutes('challenges', Challenge, {
  searchFields: ['title', 'description', 'goal'],
  sortDefault: { startDate: -1 },
});

createCrudRoutes('motivation', MotivationQuote, {
  searchFields: ['quote', 'author'],
  sortDefault: { createdAt: -1 },
});

createCrudRoutes('featured-resources', CmsFeaturedResource, {
  searchFields: ['title', 'description'],
  sortDefault: { priority: -1, createdAt: -1 },
});

createCrudRoutes('featured-content', FeaturedContent, {
  searchFields: ['title', 'description'],
  sortDefault: { priority: -1, createdAt: -1 },
});

createCrudRoutes('announcements', Announcement, {
  searchFields: ['title', 'message'],
  sortDefault: { startDate: -1, priority: -1 },
});

// ─── CMS Dashboard Stats ────────────────────────────────────
router.get('/stats', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, message: 'Requires MongoDB' });
  }

  const [
    insightsTotal, insightsPublished,
    challengesTotal, challengesActive,
    quotesTotal, quotesActive,
    resourcesTotal, resourcesFeatured,
    featuredTotal, featuredPublished,
    announcementsTotal, announcementsActive,
  ] = await Promise.all([
    Insight.countDocuments({ isDeleted: { $ne: true } }),
    Insight.countDocuments({ isDeleted: { $ne: true }, isPublished: true }),
    Challenge.countDocuments({ isDeleted: { $ne: true } }),
    Challenge.countDocuments({ isDeleted: { $ne: true }, isPublished: true, endDate: { $gte: new Date() } }),
    MotivationQuote.countDocuments({ isDeleted: { $ne: true } }),
    MotivationQuote.countDocuments({ isDeleted: { $ne: true }, isActive: true }),
    CmsFeaturedResource.countDocuments({ isDeleted: { $ne: true } }),
    CmsFeaturedResource.countDocuments({ isDeleted: { $ne: true }, isFeatured: true }),
    FeaturedContent.countDocuments({ isDeleted: { $ne: true } }),
    FeaturedContent.countDocuments({ isDeleted: { $ne: true }, isPublished: true }),
    Announcement.countDocuments({ isDeleted: { $ne: true } }),
    Announcement.countDocuments({ isDeleted: { $ne: true }, isPublished: true, endDate: { $gte: new Date() } }),
  ]);

  res.json({
    success: true,
    data: {
      insights: { total: insightsTotal, published: insightsPublished },
      challenges: { total: challengesTotal, active: challengesActive },
      motivation: { total: quotesTotal, active: quotesActive },
      resources: { total: resourcesTotal, featured: resourcesFeatured },
      featuredContent: { total: featuredTotal, published: featuredPublished },
      announcements: { total: announcementsTotal, active: announcementsActive },
    },
  });
}));

module.exports = router;
