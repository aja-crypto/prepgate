const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const { isMongoConnected } = require('../config/db');
const {
  ensurePrefs,
  generateAndDeliver,
  getGateNexaNow,
} = require('../services/notificationEngine');

function userObjectId(req) {
  const id = req.user && (req.user._id || req.user.id);
  if (!id) return null;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  if (String(new mongoose.Types.ObjectId(id)) !== String(id)) return null;
  return id;
}

function safeError(res, status = 500) {
  return res.status(status).json({
    success: false,
    message: 'Unable to complete the request. Please try again.',
  });
}

function serialize(doc) {
  const item = doc.toObject ? doc.toObject() : doc;
  return {
    _id: item._id,
    id: item._id,
    type: item.type,
    title: item.title,
    message: item.message,
    description: item.description || '',
    category: item.category,
    priority: item.priority,
    isRead: Boolean(item.isRead),
    isBookmarked: Boolean(item.isBookmarked),
    scheduledAt: item.scheduledAt,
    deliveredAt: item.deliveredAt,
    expiresAt: item.expiresAt,
    metadata: item.metadata || {},
    action: item.action || null,
    notificationKey: item.notificationKey,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function publicPrefs(prefs) {
  return {
    enabled: prefs.enabled,
    maxPerDay: prefs.maxPerDay,
    todayCount: prefs.todayCount,
    todayDate: prefs.todayDate,
    lastSentAt: prefs.lastSentAt,
    quietHoursStart: prefs.quietHoursStart,
    quietHoursEnd: prefs.quietHoursEnd,
    categories: prefs.categories,
  };
}

router.get('/', protect, async (req, res) => {
  try {
    const userId = userObjectId(req);
    if (!isMongoConnected() || !userId) {
      return res.json({
        success: true,
        notifications: [],
        total: 0,
        unreadCount: 0,
        page: 1,
        pages: 0,
      });
    }

    await generateAndDeliver(userId);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const unreadOnly = String(req.query.unreadOnly) === 'true';
    const type = typeof req.query.type === 'string' ? req.query.type.trim() : '';

    const filter = { user: userId };
    if (unreadOnly) filter.isRead = false;
    if (type) filter.type = type;

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, isRead: false }),
      Notification.find(filter)
        .sort({ scheduledAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const pages = Math.ceil(total / limit) || 0;
    return res.json({
      success: true,
      notifications: notifications.map(serialize),
      total,
      unreadCount,
      page,
      pages,
    });
  } catch {
    return safeError(res);
  }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const userId = userObjectId(req);
    if (!isMongoConnected() || !userId) {
      return res.json({ success: true, unreadCount: 0 });
    }
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    return res.json({ success: true, unreadCount });
  } catch {
    return safeError(res);
  }
});

router.get('/prefs', protect, async (req, res) => {
  try {
    const userId = userObjectId(req);
    if (!isMongoConnected() || !userId) {
      return res.json({
        success: true,
        prefs: {
          enabled: true,
          maxPerDay: 5,
          todayCount: 0,
          todayDate: '',
          lastSentAt: null,
          quietHoursStart: '23:00',
          quietHoursEnd: '06:30',
          categories: {
            study: true,
            motivation: true,
            revision: true,
            events: true,
            insights: true,
            onboarding: true,
          },
        },
      });
    }
    const prefs = await ensurePrefs(userId, getGateNexaNow());
    return res.json({ success: true, prefs: publicPrefs(prefs) });
  } catch {
    return safeError(res);
  }
});

router.put('/prefs', protect, async (req, res) => {
  try {
    const userId = userObjectId(req);
    if (!isMongoConnected() || !userId) return safeError(res, 503);

    const prefs = await ensurePrefs(userId, getGateNexaNow());
    const body = req.body || {};

    if (typeof body.enabled === 'boolean') prefs.enabled = body.enabled;
    if (Number.isFinite(Number(body.maxPerDay))) {
      prefs.maxPerDay = Math.min(20, Math.max(0, Number(body.maxPerDay)));
    }
    if (typeof body.quietHoursStart === 'string') prefs.quietHoursStart = body.quietHoursStart;
    if (typeof body.quietHoursEnd === 'string') prefs.quietHoursEnd = body.quietHoursEnd;
    if (body.categories && typeof body.categories === 'object') {
      for (const key of ['study', 'motivation', 'revision', 'events', 'insights', 'onboarding']) {
        if (typeof body.categories[key] === 'boolean') {
          prefs.categories[key] = body.categories[key];
        }
      }
    }
    await prefs.save();
    return res.json({ success: true, prefs: publicPrefs(prefs) });
  } catch {
    return safeError(res);
  }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    const userId = userObjectId(req);
    if (!isMongoConnected() || !userId) return safeError(res, 503);
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ success: true, updated: result.modifiedCount || 0 });
  } catch {
    return safeError(res);
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const userId = userObjectId(req);
    if (!isMongoConnected() || !userId) return safeError(res, 503);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Notification not found.' });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    return res.json({ success: true, notification: serialize(notification) });
  } catch {
    return safeError(res);
  }
});

router.put('/:id/bookmark', protect, async (req, res) => {
  try {
    const userId = userObjectId(req);
    if (!isMongoConnected() || !userId) return safeError(res, 503);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Notification not found.' });
    }
    const current = await Notification.findOne({ _id: req.params.id, user: userId });
    if (!current) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    const nextValue = typeof req.body?.isBookmarked === 'boolean'
      ? req.body.isBookmarked
      : !current.isBookmarked;
    current.isBookmarked = nextValue;
    await current.save();
    return res.json({ success: true, notification: serialize(current) });
  } catch {
    return safeError(res);
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = userObjectId(req);
    if (!isMongoConnected() || !userId) return safeError(res, 503);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Notification not found.' });
    }
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    return res.json({ success: true, deleted: true });
  } catch {
    return safeError(res);
  }
});

router.post('/generate', protect, async (req, res) => {
  try {
    const userId = userObjectId(req);
    if (!isMongoConnected() || !userId) return safeError(res, 503);
    const result = await generateAndDeliver(userId, {
      slot: typeof req.body?.slot === 'string' ? req.body.slot : undefined,
      schedulerRun: false,
    });
    return res.json({
      success: true,
      created: (result.daily?.created || 0) + (result.onboarding?.created || 0),
      dateKey: result.dateKey,
      slot: result.slot,
    });
  } catch {
    return safeError(res);
  }
});

module.exports = router;
