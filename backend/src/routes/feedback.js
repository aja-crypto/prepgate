// src/routes/feedback.js – Feedback & Suggestions API
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const Feedback = require('../models/Feedback');

function getStore() {
  return require('../store/localDataStore');
}

// GET /api/feedback – Get current user's feedback
router.get('/', protect, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const feedback = await Feedback.findOne({ user: req.user._id }).sort('-createdAt');
      return res.json({ success: true, data: feedback });
    }
    const store = getStore();
    const feedback = store.getLocalFeedback(req.user._id);
    res.json({ success: true, data: feedback });
  } catch (e) { next(e); }
});

// POST /api/feedback – Submit feedback
router.post('/', protect, async (req, res, next) => {
  try {
    const { anonymous, ratings, featureRequests, bugReports, preparation, recommendation, polls } = req.body;

    if (isMongoConnected()) {
      let feedback = await Feedback.findOne({ user: req.user._id });
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
      return res.json({ success: true, data: feedback, message: 'Feedback submitted successfully.' });
    }

    const store = getStore();
    const doc = store.saveLocalFeedback(req.user._id, {
      anonymous: anonymous ?? false,
      ratings: ratings ?? {},
      featureRequests: featureRequests ?? [],
      bugReports: bugReports ?? [],
      preparation: preparation ?? {},
      recommendation: recommendation ?? {},
      polls: polls ?? [],
    });
    res.json({ success: true, data: doc, message: 'Feedback submitted (local).' });
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
