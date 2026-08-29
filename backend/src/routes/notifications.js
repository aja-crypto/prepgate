const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const NotificationPrefs = require('../models/NotificationPrefs');
const User = require('../models/User');
const { generateAndDeliver, ensurePrefs, generateDailyNotifications, generateOnboardingNotifications } = require('../services/notificationEngine');
const { isMongoConnected } = require('../config/db');

function requireMongo(res) {
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, message: 'MongoDB required for notifications.' });
  }
  return null;
}

// Resolve a user _id to a valid MongoDB ObjectId.
// Mock users have UUID IDs — find or create a MongoDB User by email.
async function resolveMongoUserId(user) {
  if (!user) return null;
  // Already a valid ObjectId
  if (/^[0-9a-f]{24}$/i.test(String(user._id))) return user._id;
  // UUID or other non-ObjectId — find or create by email
  if (user.email) {
    let mongoUser = await User.findOne({ email: user.email }).select('_id').lean();
    if (!mongoUser) {
      try {
        mongoUser = await User.create({
          name: user.name || 'GateNexa User',
          email: user.email,
          password: '!placeholder_' + Date.now(),
          role: user.role || 'user',
          isVerified: true,
          authProvider: 'local',
          referralCode: 'NX-' + Date.now().toString(36).toUpperCase(),
        });
      } catch (e) {
        // Race condition — try finding again
        mongoUser = await User.findOne({ email: user.email }).select('_id').lean();
      }
    }
    return mongoUser?._id;
  }
  return null;
}

router.get('/', protect, async (req, res, next) => {
  try {
    if (requireMongo(res)) return;
    const mongoUserId = await resolveMongoUserId(req.user);
    if (!mongoUserId) return res.json({ success: true, data: { notifications: [], total: 0, unreadCount: 0, page: 1, pages: 0, prefs: null } });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { unreadOnly, type, includePrefs } = req.query;
    const filter = { user: mongoUserId };
    if (unreadOnly === 'true') filter.isRead = false;
    if (type) filter.type = type;

    // Single query with proper index usage - fetch notifications with pagination
    const notifications = await Notification.find(filter)
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Parallel counts using the compound index
    const [total, unreadCount] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: mongoUserId, isRead: false }),
    ]);

    // Optionally include prefs to avoid separate API call
    let prefs = null;
    if (includePrefs === 'true') {
      prefs = await ensurePrefs(mongoUserId);
    }

    // If a user has no notifications at all AND has never been seeded, create default onboarding notifications
    if (total === 0) {
      const prefs = await ensurePrefs(mongoUserId);
      if (!prefs.onboardingSeeded) {
        try {
          await generateOnboardingNotifications(mongoUserId);
          const [fresh, freshTotal, freshUnread] = await Promise.all([
            Notification.find(filter).sort({ scheduledAt: -1 }).skip(skip).limit(limit).lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ user: mongoUserId, isRead: false }),
          ]);
          return res.json({ success: true, data: { notifications: fresh, total: freshTotal, unreadCount: freshUnread, page, pages: Math.ceil(freshTotal / limit), prefs } });
        } catch (e) {
          // If seeding fails, fall back to the empty result
        }
      }
    }

    // Daily generation: if it's a new day and user has no notifications for today, generate them idempotently
    try {
      const prefs = await ensurePrefs(mongoUserId);
      const today = new Date().toISOString().slice(0, 10);
      const todayStart = new Date(today + 'T00:00:00.000Z');
      const todayCount = await Notification.countDocuments({ user: mongoUserId, createdAt: { $gte: todayStart } });
      if (todayCount === 0 && prefs.todayCount === 0 && prefs.todayDate === today) {
        // Already checked today and found nothing to generate — skip to avoid spam
      } else if (todayCount === 0) {
        const context = {};
        try {
          const User = require('../models/User');
          const u = await User.findById(mongoUserId).select('createdAt').lean();
          if (u?.createdAt) {
            const diffDays = Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1;
            context.loginDay = diffDays;
          }
        } catch (_) {}
        const daily = await generateDailyNotifications(mongoUserId, context);
        if (daily && daily.length > 0) {
          const [fresh, freshTotal, freshUnread] = await Promise.all([
            Notification.find(filter).sort({ scheduledAt: -1 }).skip(skip).limit(limit).lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ user: mongoUserId, isRead: false }),
          ]);
          return res.json({ success: true, data: { notifications: fresh, total: freshTotal, unreadCount: freshUnread, page, pages: Math.ceil(freshTotal / limit), prefs: await ensurePrefs(mongoUserId) } });
        }
      }
    } catch (e) {
      // Daily generation failure should not block fetching
    }

    res.json({ success: true, data: { notifications, total, unreadCount, page, pages: Math.ceil(total / limit), prefs } });
  } catch (e) { next(e); }
});

router.post('/generate', protect, async (req, res, next) => {
  try {
    if (requireMongo(res)) return;
    const mongoUserId = await resolveMongoUserId(req.user);
    if (!mongoUserId) return res.status(400).json({ success: false, message: 'Cannot resolve user.' });
    const { type, context } = req.body;
    let notifications = [];
    if (type === 'daily') {
      notifications = await generateDailyNotifications(mongoUserId, context || {});
    } else if (type && type !== 'all') {
      const n = await generateAndDeliver(mongoUserId, type, context || {});
      if (n) notifications.push(n);
    }
    const prefs = await ensurePrefs(mongoUserId);
    res.json({ success: true, data: { notifications, todayCount: prefs.todayCount, maxPerDay: prefs.maxPerDay } });
  } catch (e) { next(e); }
});

router.put('/read-all', protect, async (req, res, next) => {
  try {
    if (requireMongo(res)) return;
    const mongoUserId = await resolveMongoUserId(req.user);
    if (!mongoUserId) return res.json({ success: true, message: 'All marked as read.' });
    await Notification.updateMany({ user: mongoUserId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All marked as read.' });
  } catch (e) { next(e); }
});

router.put('/:id/read', protect, async (req, res, next) => {
  try {
    if (requireMongo(res)) return;
    const mongoUserId = await resolveMongoUserId(req.user);
    if (!mongoUserId) return res.status(404).json({ success: false, message: 'Not found.' });
    const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: mongoUserId }, { isRead: true }, { new: true });
    if (!n) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: n });
  } catch (e) { next(e); }
});

router.put('/:id/bookmark', protect, async (req, res, next) => {
  try {
    if (requireMongo(res)) return;
    const mongoUserId = await resolveMongoUserId(req.user);
    if (!mongoUserId) return res.status(404).json({ success: false, message: 'Not found.' });
    const n = await Notification.findOne({ _id: req.params.id, user: mongoUserId });
    if (!n) return res.status(404).json({ success: false, message: 'Not found.' });
    n.isBookmarked = !n.isBookmarked;
    await n.save();
    res.json({ success: true, data: n });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (requireMongo(res)) return;
    const mongoUserId = await resolveMongoUserId(req.user);
    if (!mongoUserId) return res.status(404).json({ success: false, message: 'Not found.' });
    const r = await Notification.deleteOne({ _id: req.params.id, user: mongoUserId });
    if (r.deletedCount === 0) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, message: 'Deleted.' });
  } catch (e) { next(e); }
});

router.get('/unread-count', protect, async (req, res, next) => {
  try {
    if (requireMongo(res)) return;
    const mongoUserId = await resolveMongoUserId(req.user);
    if (!mongoUserId) return res.json({ success: true, count: 0 });
    const count = await Notification.countDocuments({ user: mongoUserId, isRead: false });
    res.json({ success: true, count });
  } catch (e) { next(e); }
});

router.get('/prefs', protect, async (req, res, next) => {
  try {
    if (requireMongo(res)) return;
    const mongoUserId = await resolveMongoUserId(req.user);
    if (!mongoUserId) return res.json({ success: true, data: { enabled: true, maxPerDay: 5, categories: {}, todayCount: 0, todayDate: '' } });
    const prefs = await ensurePrefs(mongoUserId);
    res.json({ success: true, data: prefs });
  } catch (e) { next(e); }
});

router.put('/prefs', protect, async (req, res, next) => {
  try {
    if (requireMongo(res)) return;
    const mongoUserId = await resolveMongoUserId(req.user);
    if (!mongoUserId) return res.json({ success: true, data: { enabled: true, maxPerDay: 5 } });
    const prefs = await ensurePrefs(mongoUserId);
    for (const key of ['enabled', 'maxPerDay', 'quietHoursStart', 'quietHoursEnd', 'categories']) {
      if (req.body[key] !== undefined) prefs[key] = req.body[key];
    }
    await prefs.save();
    res.json({ success: true, data: prefs });
  } catch (e) { next(e); }
});

module.exports = router;
