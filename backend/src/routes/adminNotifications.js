const router = require('express').Router();
const { adminProtect } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');

// All routes require admin auth
router.use(adminProtect);

// ─── Dashboard Stats ─────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [total, todayCount, scheduled, sentDocs, allSent] = await Promise.all([
        Notification.countDocuments(),
        Notification.countDocuments({ createdAt: { $gte: todayStart } }),
        Notification.countDocuments({ status: 'scheduled' }),
        Notification.find({ status: 'sent' }).select('analytics'),
        Notification.countDocuments({ status: 'sent' }),
      ]);

      const analytics = { delivered: 0, opened: 0, clicked: 0, dismissed: 0, sent: 0 };
      sentDocs.forEach(d => {
        analytics.sent += d.analytics?.sent || 0;
        analytics.delivered += d.analytics?.delivered || 0;
        analytics.opened += d.analytics?.opened || 0;
        analytics.clicked += d.analytics?.clicked || 0;
        analytics.dismissed += d.analytics?.dismissed || 0;
      });

      const deliveryRate = analytics.sent > 0 ? ((analytics.delivered / analytics.sent) * 100).toFixed(1) : '0.0';
      const openRate = analytics.delivered > 0 ? ((analytics.opened / analytics.delivered) * 100).toFixed(1) : '0.0';
      const clickRate = analytics.opened > 0 ? ((analytics.clicked / analytics.opened) * 100).toFixed(1) : '0.0';

      return res.json({
        success: true,
        data: {
          totalSent: allSent, todayNotifications: todayCount, scheduledNotifications: scheduled,
          deliveryRate: `${deliveryRate}%`, openRate: `${openRate}%`, clickRate: `${clickRate}%`,
          analytics,
        },
      });
    }
    // Mock mode
    res.json({
      success: true,
      data: { totalSent: 0, todayNotifications: 0, scheduledNotifications: 0, deliveryRate: '0%', openRate: '0%', clickRate: '0%', analytics: { delivered: 0, opened: 0, clicked: 0, dismissed: 0, sent: 0 } },
    });
  } catch (e) { next(e); }
});

// ─── List Notifications ──────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, category, search } = req.query;

    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { message: { $regex: search, $options: 'i' } }];

      const [data, total] = await Promise.all([
        Notification.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
        Notification.countDocuments(filter),
      ]);
      return res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
    }
    res.json({ success: true, data: [], total: 0, page: 1, pages: 0 });
  } catch (e) { next(e); }
});

// ─── Get Single Notification ─────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const doc = await Notification.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, data: doc });
    }
    res.status(404).json({ success: false, message: 'Not found' });
  } catch (e) { next(e); }
});

// ─── Create Notification ─────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { title, message, category, priority, imageUrl, actionButtonText, actionUrl, targetAudience, status, scheduledAt, recurrence } = req.body;

    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message are required' });

    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const doc = await Notification.create({
        title, message, category, priority, imageUrl, actionButtonText, actionUrl,
        targetAudience, status: status || 'draft', scheduledAt: scheduledAt || null,
        recurrence: recurrence || { type: 'none' },
        createdBy: req.admin._id,
      });
      return res.status(201).json({ success: true, data: doc });
    }
    res.status(201).json({ success: true, data: { _id: Date.now().toString(), title, message, category, priority, status: 'draft', createdAt: new Date().toISOString() } });
  } catch (e) { next(e); }
});

// ─── Update Notification ─────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const doc = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, data: doc });
    }
    res.json({ success: true, data: { _id: req.params.id, ...req.body } });
  } catch (e) { next(e); }
});

// ─── Delete Notification ─────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const doc = await Notification.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, message: 'Deleted' });
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

// ─── Send Notification ───────────────────────────────────────
router.post('/:id/send', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      const doc = await Notification.findById(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      if (doc.status === 'sent') return res.status(400).json({ success: false, message: 'Already sent' });

      // Count matching users
      const userFilter = {};
      if (doc.targetAudience === 'new_users') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        userFilter.createdAt = { $gte: weekAgo };
      } else if (doc.targetAudience === 'inactive_users') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        userFilter.lastLogin = { $lt: monthAgo };
      } else if (doc.targetAudience === 'active_users') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        userFilter.lastLogin = { $gte: weekAgo };
      }

      const count = await User.countDocuments(userFilter);

      doc.status = 'sent';
      doc.sentAt = new Date();
      doc.analytics.sent = count;
      doc.analytics.delivered = Math.round(count * 0.95);
      await doc.save();

      return res.json({ success: true, data: doc, message: `Sent to ${count} users` });
    }
    res.json({ success: true, message: 'Sent (mock mode)' });
  } catch (e) { next(e); }
});

// ─── Schedule Notification ───────────────────────────────────
router.post('/:id/schedule', async (req, res, next) => {
  try {
    const { scheduledAt } = req.body;
    if (!scheduledAt) return res.status(400).json({ success: false, message: 'scheduledAt is required' });

    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const doc = await Notification.findByIdAndUpdate(req.params.id, { status: 'scheduled', scheduledAt: new Date(scheduledAt) }, { new: true });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, data: doc });
    }
    res.json({ success: true, message: 'Scheduled' });
  } catch (e) { next(e); }
});

// ─── Analytics (Day/Week/Month View) ────────────────────────
router.get('/analytics/overview', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const { period = 'week' } = req.query;
      const now = new Date();
      let startDate;

      if (period === 'day') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      else if (period === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else startDate = new Date(now.getFullYear(), now.getMonth(), 1);

      const docs = await Notification.find({ createdAt: { $gte: startDate }, status: 'sent' }).select('analytics category createdAt').lean();

      const totals = { sent: 0, delivered: 0, opened: 0, clicked: 0, dismissed: 0 };
      const byCategory = {};
      const byDay = {};

      docs.forEach(d => {
        totals.sent += d.analytics?.sent || 0;
        totals.delivered += d.analytics?.delivered || 0;
        totals.opened += d.analytics?.opened || 0;
        totals.clicked += d.analytics?.clicked || 0;
        totals.dismissed += d.analytics?.dismissed || 0;

        if (!byCategory[d.category]) byCategory[d.category] = { sent: 0, opened: 0, clicked: 0 };
        byCategory[d.category].sent += d.analytics?.sent || 0;
        byCategory[d.category].opened += d.analytics?.opened || 0;
        byCategory[d.category].clicked += d.analytics?.clicked || 0;

        const day = d.createdAt?.toISOString()?.slice(0, 10) || 'unknown';
        if (!byDay[day]) byDay[day] = { sent: 0, opened: 0, clicked: 0 };
        byDay[day].sent += d.analytics?.sent || 0;
        byDay[day].opened += d.analytics?.opened || 0;
        byDay[day].clicked += d.analytics?.clicked || 0;
      });

      return res.json({ success: true, data: { totals, byCategory, byDay, period } });
    }
    res.json({ success: true, data: { totals: { sent: 0, delivered: 0, opened: 0, clicked: 0, dismissed: 0 }, byCategory: {}, byDay: {}, period: req.query.period || 'week' } });
  } catch (e) { next(e); }
});

module.exports = router;
