const router = require('express').Router();
const { adminProtect } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');
const { sendToAudience, sendToUsers, getEligibleUsers } = require('../services/webPushService');

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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
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

    const audience = targetAudience || 'all';
    const safeActionUrl = actionUrl || '/dashboard';

    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const User = require('../models/User');

      const userFilter = {};
      if (audience === 'new_users') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        userFilter.createdAt = { $gte: weekAgo };
      } else if (audience === 'inactive_users') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        userFilter.lastLogin = { $lt: monthAgo };
      } else if (audience === 'active_users') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        userFilter.lastLogin = { $gte: weekAgo };
      } else if (audience === 'premium_users') {
        userFilter.isPremium = true;
      } else if (audience === 'free_users') {
        userFilter.isPremium = false;
      }

      const eligibleUsers = await User.find(userFilter).select('_id').lean();
      const doc = await Notification.create({
        title,
        message,
        body: message,
        category: category || 'announcement',
        priority: priority || 'normal',
        imageUrl: imageUrl || '',
        actionButtonText: actionButtonText || 'View',
        actionUrl: safeActionUrl,
        action: { label: actionButtonText || 'View', href: safeActionUrl },
        targetAudience: audience,
        status: status || 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        recurrence: recurrence || { type: 'none' },
        createdBy: req.admin._id,
        analytics: { sent: eligibleUsers.length, delivered: 0, opened: 0, clicked: 0, dismissed: 0 },
      });

      return res.status(201).json({ success: true, data: doc, targetUsers: eligibleUsers.length });
    }

    res.status(201).json({ success: true, data: { _id: Date.now().toString(), title, message, category: category || 'announcement', priority: priority || 'normal', status: 'draft', createdAt: new Date().toISOString() } });
  } catch (e) { next(e); }
});

// ─── Update Notification ─────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const Notification = require('../models/Notification');
      const editableFields = ['title', 'message', 'category', 'priority', 'imageUrl', 'actionButtonText', 'actionUrl', 'targetAudience', 'status', 'scheduledAt', 'recurrence'];
      const update = Object.fromEntries(editableFields
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]]));
      if (!Object.keys(update).length) {
        return res.status(400).json({ success: false, message: 'No editable notification fields supplied.' });
      }
      const doc = await Notification.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
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
      const doc = await Notification.findById(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      if (doc.status === 'sent') return res.status(400).json({ success: false, message: 'Already sent' });

      const targetAudience = doc.targetAudience || 'all';
      const eligibleUsers = await getEligibleUsers(targetAudience);
      const userIds = eligibleUsers.map((user) => user._id.toString());

      const pushResult = await sendToAudience({
        targetAudience,
        title: doc.title,
        body: doc.body || doc.message,
        url: doc.actionUrl || doc.action?.href || '/dashboard',
        data: {
          notificationId: String(doc._id),
          category: doc.category,
          actionButtonText: doc.actionButtonText,
        },
      });

      const notificationStatus = pushResult.sent > 0 ? 'sent' : pushResult.reason === 'No subscribers' ? 'failed' : 'failed';

      doc.status = notificationStatus;
      doc.sentAt = new Date();
      doc.analytics = doc.analytics || { sent: 0, delivered: 0, opened: 0, clicked: 0, dismissed: 0 };
      doc.analytics.sent = userIds.length;
      doc.analytics.delivered = pushResult.sent || 0;
      await doc.save();

      return res.json({
        success: true,
        data: doc,
        result: pushResult,
        message: pushResult.sent > 0 ? `Sent to ${pushResult.sent} subscribers` : pushResult.reason || 'No subscribers',
      });
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
