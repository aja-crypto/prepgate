const router = require('express').Router();
const { adminProtect } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');

// All routes require admin auth
router.use(adminProtect);

// ─── Dashboard Stats ─────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [total, unread, resolved, archived, critical, todayCount] = await Promise.all([
        FeedbackTicket.countDocuments(),
        FeedbackTicket.countDocuments({ status: 'unread' }),
        FeedbackTicket.countDocuments({ status: 'resolved' }),
        FeedbackTicket.countDocuments({ status: 'archived' }),
        FeedbackTicket.countDocuments({ priority: 'critical', status: { $ne: 'archived' } }),
        FeedbackTicket.countDocuments({ createdAt: { $gte: todayStart } }),
      ]);

      const pending = total - resolved - archived;
      return res.json({ success: true, data: { total, unread, resolved, pending, archived, critical, todayCount } });
    }
    res.json({ success: true, data: { total: 0, unread: 0, resolved: 0, pending: 0, archived: 0, critical: 0, todayCount: 0 } });
  } catch (e) { next(e); }
});

// ─── List Tickets ────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, category, priority, search } = req.query;

    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { message: { $regex: search, $options: 'i' } }, { userName: { $regex: search, $options: 'i' } }];

      const [data, total] = await Promise.all([
        FeedbackTicket.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
        FeedbackTicket.countDocuments(filter),
      ]);
      return res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
    }
    res.json({ success: true, data: [], total: 0, page: 1, pages: 0 });
  } catch (e) { next(e); }
});

// ─── Get Single Ticket ───────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const FeedbackReply = require('../models/FeedbackReply');
      const doc = await FeedbackTicket.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      const replies = await FeedbackReply.find({ ticket: doc._id }).sort('createdAt').lean();
      return res.json({ success: true, data: { ...doc, replies } });
    }
    res.status(404).json({ success: false, message: 'Not found' });
  } catch (e) { next(e); }
});

// ─── Update Ticket Status/Priority ───────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const update = {};
      if (req.body.status) {
        update.status = req.body.status;
        if (req.body.status === 'resolved') update.resolvedAt = new Date();
        if (req.body.status === 'archived') update.archivedAt = new Date();
      }
      if (req.body.priority) update.priority = req.body.priority;

      const doc = await FeedbackTicket.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, data: doc });
    }
    res.json({ success: true, data: { _id: req.params.id, ...req.body } });
  } catch (e) { next(e); }
});

// ─── Delete Ticket ───────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const FeedbackReply = require('../models/FeedbackReply');
      await FeedbackReply.deleteMany({ ticket: req.params.id });
      const doc = await FeedbackTicket.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, message: 'Deleted' });
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

// ─── Reply to Ticket ─────────────────────────────────────────
router.post('/:id/reply', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const FeedbackReply = require('../models/FeedbackReply');
      const ticket = await FeedbackTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Not found' });

      const reply = await FeedbackReply.create({
        ticket: ticket._id,
        author: req.admin.name || 'Admin',
        authorRole: 'admin',
        message,
        isAdminReply: true,
      });

      ticket.replyCount = (ticket.replyCount || 0) + 1;
      ticket.lastReplyAt = new Date();
      ticket.lastReplyBy = req.admin.name || 'Admin';
      if (ticket.status === 'unread') ticket.status = 'in_progress';
      await ticket.save();

      return res.status(201).json({ success: true, data: reply });
    }
    res.status(201).json({ success: true, data: { message, author: req.admin.name } });
  } catch (e) { next(e); }
});

// ─── Analytics ───────────────────────────────────────────────
router.get('/analytics/overview', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [allTickets, monthTickets, byCategory, byStatus, byPriority] = await Promise.all([
        FeedbackTicket.find().select('category status priority createdAt').lean(),
        FeedbackTicket.find({ createdAt: { $gte: monthStart } }).select('category status').lean(),
        FeedbackTicket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        FeedbackTicket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        FeedbackTicket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      ]);

      const totalThisMonth = monthTickets.length;
      const resolvedThisMonth = monthTickets.filter(t => t.status === 'resolved').length;
      const resolutionRate = totalThisMonth > 0 ? ((resolvedThisMonth / totalThisMonth) * 100).toFixed(1) : '0.0';

      const dailyTrend = {};
      monthTickets.forEach(t => {
        const day = t.createdAt?.toISOString()?.slice(0, 10) || 'unknown';
        dailyTrend[day] = (dailyTrend[day] || 0) + 1;
      });

      return res.json({
        success: true,
        data: {
          totalAllTime: allTickets.length,
          totalThisMonth,
          resolutionRate: `${resolutionRate}%`,
          byCategory: byCategory.map(c => ({ name: c._id, count: c.count })),
          byStatus: byStatus.map(s => ({ name: s._id, count: s.count })),
          byPriority: byPriority.map(p => ({ name: p._id, count: p.count })),
          dailyTrend,
        },
      });
    }
    res.json({ success: true, data: { totalAllTime: 0, totalThisMonth: 0, resolutionRate: '0%', byCategory: [], byStatus: [], byPriority: [], dailyTrend: {} } });
  } catch (e) { next(e); }
});

// ─── User Requests (Feature Requests as Tasks) ───────────────
router.get('/requests/all', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const UserRequest = require('../models/UserRequest');
      const data = await UserRequest.find().sort('-votes').lean();
      return res.json({ success: true, data, total: data.length });
    }
    res.json({ success: true, data: [], total: 0 });
  } catch (e) { next(e); }
});

router.post('/requests', async (req, res, next) => {
  try {
    const { title, description, requestedByName, status, priority } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });

    if (isMongoConnected()) {
      const UserRequest = require('../models/UserRequest');
      const doc = await UserRequest.create({ title, description, requestedByName, status, priority });
      return res.status(201).json({ success: true, data: doc });
    }
    res.status(201).json({ success: true, data: { _id: Date.now().toString(), title, votes: 1, status: 'planned' } });
  } catch (e) { next(e); }
});

router.put('/requests/:id', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const UserRequest = require('../models/UserRequest');
      const doc = await UserRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      return res.json({ success: true, data: doc });
    }
    res.json({ success: true, data: { _id: req.params.id, ...req.body } });
  } catch (e) { next(e); }
});

router.delete('/requests/:id', async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const UserRequest = require('../models/UserRequest');
      await UserRequest.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
