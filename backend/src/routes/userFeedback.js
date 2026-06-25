const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');

function getStore() { return require('../store/localDataStore'); }

// ─── User: Submit Feedback ───────────────────────────────────
router.post('/ticket', protect, async (req, res, next) => {
  try {
    const { category, subject, title, message, screenshotUrl, priority, deviceInfo } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message required' });

    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const doc = await FeedbackTicket.create({
        user: req.user._id,
        userName: req.user.name || 'User',
        userEmail: req.user.email || '',
        category, subject, title, message, screenshotUrl,
        priority: priority || 'medium',
        deviceInfo: deviceInfo || {},
      });
      return res.status(201).json({ success: true, data: doc });
    }
    res.status(201).json({ success: true, data: { _id: Date.now().toString(), title, message, status: 'unread' } });
  } catch (e) { next(e); }
});

// ─── User: Get My Tickets ────────────────────────────────────
router.get('/my-tickets', protect, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const FeedbackReply = require('../models/FeedbackReply');
      const tickets = await FeedbackTicket.find({ user: req.user._id }).sort('-createdAt').lean();

      // Attach latest reply for each ticket
      const ticketsWithReplies = await Promise.all(tickets.map(async (t) => {
        const lastReply = await FeedbackReply.findOne({ ticket: t._id }).sort('-createdAt').lean();
        return { ...t, lastReply };
      }));

      return res.json({ success: true, data: ticketsWithReplies });
    }
    res.json({ success: true, data: [] });
  } catch (e) { next(e); }
});

// ─── User: Reply to own ticket ───────────────────────────────
router.post('/ticket/:id/reply', protect, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    if (isMongoConnected()) {
      const FeedbackTicket = require('../models/FeedbackTicket');
      const FeedbackReply = require('../models/FeedbackReply');
      const ticket = await FeedbackTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Not found' });
      if (ticket.user?.toString() !== req.user._id?.toString()) {
        return res.status(403).json({ success: false, message: 'Not your ticket' });
      }

      const reply = await FeedbackReply.create({
        ticket: ticket._id,
        author: req.user.name || 'User',
        authorRole: 'user',
        message,
        isAdminReply: false,
      });

      ticket.replyCount = (ticket.replyCount || 0) + 1;
      ticket.lastReplyAt = new Date();
      ticket.lastReplyBy = req.user.name || 'User';
      await ticket.save();

      return res.status(201).json({ success: true, data: reply });
    }
    res.status(201).json({ success: true, data: { message } });
  } catch (e) { next(e); }
});

// ─── User: Vote on Feature Request ───────────────────────────
router.post('/request/:id/vote', protect, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const UserRequest = require('../models/UserRequest');
      const doc = await UserRequest.findById(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

      const userId = req.user._id.toString();
      if (doc.voters?.some(v => v.toString() === userId)) {
        // Remove vote
        doc.voters = doc.voters.filter(v => v.toString() !== userId);
        doc.votes = Math.max(0, doc.votes - 1);
      } else {
        doc.voters = doc.voters || [];
        doc.voters.push(req.user._id);
        doc.votes = (doc.votes || 0) + 1;
      }
      await doc.save();
      return res.json({ success: true, data: doc });
    }
    res.json({ success: true, message: 'Vote recorded (mock)' });
  } catch (e) { next(e); }
});

module.exports = router;
