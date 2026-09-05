// src/routes/notifications.js – User notification API
const router = require('express').Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const NotificationPrefs = require('../models/NotificationPrefs');
const { protect } = require('../middleware/auth');
const engine = require('../services/notificationEngine');
const { isMockAuthEnabled } = require('../config/devMode');
const User = require('../models/User');

function userIdOrDemo(req) {
  if (req.user && req.user._id) return req.user._id.toString();
  // Demo/guest path (mock auth) — use a stable synthetic ObjectId.
  if (req.user && req.user.isGuest) return '000000000000000000000001';
  return null;
}

// Helper — when running in mock mode, the User model isn't backed by
// Mongo, so the Notification/NotificationPrefs collections may also be
// missing. We keep the API shape consistent in either case.
async function ensureMongoAvailable(res) {
  if (isMockAuthEnabled()) {
    return res.status(503).json({
      success: false,
      message: 'Notifications require a MongoDB connection. Set MONGO_URI in backend/.env.',
    });
  }
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Notifications require a MongoDB connection.',
    });
  }
  return null;
}

// ─── GET /api/notifications ────────────────────────────────
// List current user's notifications (paginated).
router.get('/', protect, async (req, res, next) => {
  try {
    const guard = await ensureMongoAvailable(res);
    if (guard) return;

    const userId = userIdOrDemo(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = (req.query.type || '').trim();

    const filter = { user: userId };
    if (unreadOnly) filter.isRead = false;
    if (type) filter.type = type;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ scheduledAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    const pages = Math.max(Math.ceil(total / limit), 1);
    res.json({
      success: true,
      data: {
        notifications: items,
        total,
        unreadCount,
        page,
        pages,
      },
    });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/notifications/unread-count ────────────────────
router.get('/unread-count', protect, async (req, res, next) => {
  try {
    const guard = await ensureMongoAvailable(res);
    if (guard) return;

    const userId = userIdOrDemo(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    res.json({ success: true, data: { unreadCount } });
  } catch (e) {
    next(e);
  }
});

// ─── GET /api/notifications/prefs ──────────────────────────
router.get('/prefs', protect, async (req, res, next) => {
  try {
    const guard = await ensureMongoAvailable(res);
    if (guard) return;

    const userId = userIdOrDemo(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const prefs = await engine.ensurePrefs(userId);
    res.json({ success: true, data: prefs });
  } catch (e) {
    next(e);
  }
});

// ─── PUT /api/notifications/prefs ──────────────────────────
router.put('/prefs', protect, async (req, res, next) => {
  try {
    const guard = await ensureMongoAvailable(res);
    if (guard) return;

    const userId = userIdOrDemo(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }

    const allowed = ['enabled', 'maxPerDay', 'quietHoursStart', 'quietHoursEnd', 'categories'];
    const update = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    }
    if (update.maxPerDay !== undefined) {
      update.maxPerDay = Math.max(0, Math.min(20, Number(update.maxPerDay) || 0));
    }
    const prefs = await NotificationPrefs.findOneAndUpdate(
      { user: userId },
      { $set: update, $setOnInsert: { user: userId, todayCount: 0, todayDate: engine.getGateNexaDateKey() } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: prefs });
  } catch (e) {
    next(e);
  }
});

// ─── PUT /api/notifications/:id/read ───────────────────────
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const guard = await ensureMongoAvailable(res);
    if (guard) return;

    const userId = userIdOrDemo(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: n });
  } catch (e) {
    next(e);
  }
});

// ─── PUT /api/notifications/read-all ───────────────────────
router.put('/read-all', protect, async (req, res, next) => {
  try {
    const guard = await ensureMongoAvailable(res);
    if (guard) return;

    const userId = userIdOrDemo(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const res2 = await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, data: { modified: res2.modifiedCount || 0 } });
  } catch (e) {
    next(e);
  }
});

// ─── PUT /api/notifications/:id/bookmark ───────────────────
router.put('/:id/bookmark', protect, async (req, res, next) => {
  try {
    const guard = await ensureMongoAvailable(res);
    if (guard) return;

    const userId = userIdOrDemo(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const value = req.body && req.body.isBookmarked === false ? false : true;
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: { isBookmarked: value } },
      { new: true }
    );
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: n });
  } catch (e) {
    next(e);
  }
});

// ─── DELETE /api/notifications/:id ─────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const guard = await ensureMongoAvailable(res);
    if (guard) return;

    const userId = userIdOrDemo(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const n = await Notification.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { _id: n._id } });
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/notifications/generate ──────────────────────
// Manual generation endpoint (used by tests and lazy fallback).
// Body: { type: 'daily'|'onboarding'|'event', slot?, eventType?, context? }
router.post('/generate', protect, async (req, res, next) => {
  try {
    const guard = await ensureMongoAvailable(res);
    if (guard) return;

    const userId = userIdOrDemo(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }

    const { type = 'daily', slot, eventType, context } = req.body || {};
    let result;
    if (type === 'onboarding') {
      result = await engine.generateOnboardingNotifications(userId);
    } else if (type === 'event') {
      if (!eventType) {
        return res.status(400).json({ success: false, message: 'eventType required' });
      }
      result = await engine.generateEventNotification(userId, eventType, context || {});
    } else {
      result = await engine.generateDailyNotifications(userId, { slot });
    }
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
