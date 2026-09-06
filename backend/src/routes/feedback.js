// src/routes/feedback.js – Feedback & Suggestions API
const router = require('express').Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/auth');
const { isMongoConnected, isMockAuthEnabled } = require('../config/db');
const Feedback = require('../models/Feedback');
const { createFeedbackNotification } = require('../services/notificationEngine');
const { createFileFilter, sanitizeFilename } = require('../utils/uploadValidator');
const { isCloudinaryConfigured, uploadImage } = require('../config/cloudinary');

// Feedback screenshots: memory-only buffer → Cloudinary (never local disk,
// which is ephemeral on Render). 10 MB max, images only.
const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: createFileFilter('image'),
});

function getStore() {
  return require('../store/localDataStore');
}

// Map the FeedbackPage category ids to the FeedbackTicket enum
const TICKET_CATEGORY_MAP = {
  bug: 'bug_report',
  feature: 'feature_request',
  uiux: 'suggestion',
  performance: 'complaint',
  ai: 'suggestion',
  content: 'suggestion',
  mobile: 'suggestion',
  general: 'suggestion',
};

// GET /api/feedback – Get current user's feedback
router.get('/', protect, async (req, res, next) => {
  try {
    if (isMongoConnected() && !isMockAuthEnabled()) {
      const feedback = await Feedback.findOne({ user: req.user._id }).sort('-createdAt');
      return res.json({ success: true, data: feedback });
    }
    const store = getStore();
    const feedback = store.getLocalFeedback(req.user._id);
    res.json({ success: true, data: feedback });
  } catch (e) { next(e); }
});

// POST /api/feedback/upload – Upload a feedback screenshot to Cloudinary.
// Returns { screenshotUrl } which the client includes in the submit payload.
router.post('/upload', protect, screenshotUpload.single('screenshot'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ success: false, message: 'Image upload is not configured. Please try again later.' });
    }
    const safeName = sanitizeFilename(req.file.originalname);
    const result = await uploadImage(req.file.buffer, safeName, 'GateNexa/feedback');
    if (!result?.secure_url) {
      return res.status(502).json({ success: false, message: 'Image upload failed. Please try again.' });
    }
    return res.json({ success: true, data: { screenshotUrl: result.secure_url } });
  } catch (e) { next(e); }
});

// POST /api/feedback – Submit feedback
router.post('/', protect, async (req, res, next) => {
  try {
    const { anonymous, ratings, featureRequests, bugReports, preparation, recommendation, polls } = req.body;

    let feedback = null;
    if (isMongoConnected() && !isMockAuthEnabled()) {
      feedback = await Feedback.findOne({ user: req.user._id });
      if (feedback) {
        Object.assign(feedback, {
          anonymous: anonymous ?? feedback.anonymous,
          ratings: ratings ?? feedback.ratings,
          featureRequests: featureRequests ?? feedback.featureRequests,
          bugReports: bugReports ?? feedback.bugReports,
          preparation: preparation ?? feedback.preparation,
          recommendation: recommendation ?? feedback.recommendation,
          polls: polls ?? feedback.polls,
        });
      } else {
        feedback = new Feedback({
          user: req.user._id,
          anonymous: anonymous ?? false,
          ratings: ratings ?? {},
          featureRequests: featureRequests ?? [],
          bugReports: bugReports ?? [],
          preparation: preparation ?? {},
          recommendation: recommendation ?? {},
          polls: polls ?? [],
        });
      }
      await feedback.save();
    } else {
      const store = getStore();
      feedback = store.saveLocalFeedback(req.user._id, {
        anonymous: anonymous ?? false,
        ratings: ratings ?? {},
        featureRequests: featureRequests ?? [],
        bugReports: bugReports ?? [],
        preparation: preparation ?? {},
        recommendation: recommendation ?? {},
        polls: polls ?? [],
      });
    }

    // Surface the submission in the admin Feedback Center whenever Mongo is
    // connected. The admin panel reads the FeedbackTicket collection, so create
    // one ticket per user submission (single authoritative record for admins).
    if (isMongoConnected()) {
      const mongoose = require('mongoose');
      const description = (req.body.description || req.body.message || '').trim();
      const category = TICKET_CATEGORY_MAP[req.body.category] || 'suggestion';
      const rawUserId = req.user?._id || req.user?.id;
      const userId = rawUserId && mongoose.isValidObjectId(rawUserId) ? rawUserId : null;
      const FeedbackTicket = require('../models/FeedbackTicket');
      const screenshotUrl = typeof req.body.screenshotUrl === 'string' && req.body.screenshotUrl.startsWith('https://') ? req.body.screenshotUrl.slice(0, 2000) : null;
      const ticket = await FeedbackTicket.create({
        user: userId,
        userName: req.user?.name || 'Anonymous',
        userEmail: req.user?.email || '',
        category,
        subject: req.body.category || category,
        title: (req.body.title || description || 'New feedback').slice(0, 200),
        message: description || (ratings?.overall ? `Rating: ${ratings.overall}/5` : 'No message provided.'),
        screenshotUrl,
        priority: 'medium',
        deviceInfo: req.body.deviceInfo || {},
      });
      await createFeedbackNotification({
        userId: userId || req.user._id,
        type: 'feedback_received',
        title: 'Thank you for your feedback',
        message: `Your ${req.body.category || 'general'} feedback was submitted successfully and is ready for review.`,
        ticketId: ticket._id,
      });
      // Confirmation email — one per created ticket, never blocking submit.
      {
        const to = req.user?.email || '';
        if (to) {
          const emailTemplates = require('../utils/emailTemplates');
          const t = emailTemplates.feedbackReceived({
            title: ticket.title,
            category,
            rating: ratings?.overall,
            message: ticket.message,
            ticketId: ticket._id,
          });
          const { sendTransactionalEmail } = require('../services/emailDeliveryService');
          sendTransactionalEmail({
            type: 'feedback-received',
            eventId: String(ticket._id),
            to,
            subject: t.subject,
            html: t.html,
            text: t.text,
          });
        }
      }
      const Admin = require('../models/Admin');
      const admins = await Admin.find({ isActive: true }).select('_id').lean();
      await Promise.all(admins.map(admin => createFeedbackNotification({
        userId: admin._id,
        type: 'feedback_received',
        title: `${req.body.category || 'General'} feedback — ${ratings?.overall || 0}/5`,
        message: `A user reported: "${description || 'No written message provided.'}"`,
        ticketId: ticket._id,
        actionPath: '/admin/feedback',
      })));
    }

    res.json({ success: true, data: feedback, message: 'Feedback submitted successfully.' });
  } catch (e) { next(e); }
});

// GET /api/feedback/admin/stats – Admin analytics
router.get('/admin/stats', protect, adminOnly, async (req, res, next) => {
  try {
    let all;
    if (isMongoConnected()) {
      all = await Feedback.find({});
    } else {
      all = getStore().getAllLocalFeedback();
    }

    const totalFeedback = all.length;
    const rated = all.filter((f) => f.ratings?.overall);
    const avgRating = rated.length
      ? (rated.reduce((s, f) => s + (f.ratings.overall || 0), 0) / rated.length).toFixed(1)
      : 'N/A';

    const featureMap = {};
    all.forEach((f) => (f.featureRequests || []).forEach((fr) => {
      const t = fr.title || 'Other';
      featureMap[t] = (featureMap[t] || 0) + 1;
    }));
    const mostRequestedFeatures = Object.entries(featureMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const bugSeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    all.forEach((f) => (f.bugReports || []).forEach((b) => {
      if (bugSeverity[b.severity] != null) bugSeverity[b.severity]++;
    }));

    const bugMap = {};
    all.forEach((f) => (f.bugReports || []).forEach((b) => {
      const t = b.title || 'Untitled';
      bugMap[t] = (bugMap[t] || 0) + 1;
    }));
    const mostReportedBugs = Object.entries(bugMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const recommendCounts = { yes: 0, no: 0, maybe: 0 };
    all.forEach((f) => {
      if (f.recommendation?.wouldRecommend) recommendCounts[f.recommendation.wouldRecommend]++;
    });

    const uiuxRated = all.filter((f) => f.ratings?.uiux);
    const avgUiux = uiuxRated.length
      ? (uiuxRated.reduce((s, f) => s + (f.ratings.uiux || 0), 0) / uiuxRated.length).toFixed(1)
      : 'N/A';

    const satisfactionScore = rated.length
      ? Math.round((rated.reduce((s, f) => s + (f.ratings.overall || 0), 0) / rated.length) * 10)
      : 0;

    res.json({
      success: true,
      data: {
        totalFeedback,
        avgRating,
        avgUiux,
        totalFeatureRequests: Object.values(featureMap).reduce((s, c) => s + c, 0),
        totalBugReports: Object.values(bugSeverity).reduce((s, c) => s + c, 0),
        mostRequestedFeatures,
        mostReportedBugs,
        bugSeverity,
        recommendCounts,
        satisfactionScore,
      },
    });
  } catch (e) { next(e); }
});

// GET /api/feedback/admin/all – List all feedback (admin)
router.get('/admin/all', protect, adminOnly, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const feedbacks = await Feedback.find({})
        .populate('user', 'name email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await Feedback.countDocuments();
      return res.json({ success: true, count: feedbacks.length, total, page, data: feedbacks });
    }
    const all = getStore().getAllLocalFeedback();
    res.json({ success: true, count: all.length, total: all.length, data: all });
  } catch (e) { next(e); }
});

// GET /api/feedback/polls – Get poll aggregate data
router.get('/polls', protect, async (req, res, next) => {
  try {
    let all;
    if (isMongoConnected()) {
      all = await Feedback.find({});
    } else {
      all = getStore().getAllLocalFeedback();
    }
    const pollAgg = {};
    all.forEach((f) => (f.polls || []).forEach((p) => {
      if (!pollAgg[p.questionId]) pollAgg[p.questionId] = {};
      pollAgg[p.questionId][p.answer] = (pollAgg[p.questionId][p.answer] || 0) + 1;
    }));
    res.json({ success: true, data: pollAgg });
  } catch (e) { next(e); }
});

module.exports = router;
