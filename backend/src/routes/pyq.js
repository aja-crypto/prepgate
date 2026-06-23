// src/routes/pyq.js – PYQ bank, practice, attempts, bookmarks
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { isMongoConnected, isMockAuthEnabled } = require('../config/db');
const { PYQ, UserPYQ } = require('../models');
const { checkAnswer } = require('../services/pyqImportService');

const emptyPyq = (res, extra = {}) => res.json({ success: true, count: 0, total: 0, data: [], ...extra });

function enrichUserFields(q, userMap) {
  const up = userMap[q._id.toString()];
  return {
    ...q,
    isSolved: up?.isSolved || false,
    isBookmarked: up?.isBookmarked || false,
    revisionNeeded: up?.revisionNeeded || false,
    markedDifficult: up?.markedDifficult || false,
    lastStatus: up?.lastStatus || null,
    userAttempts: up?.attempts || 0,
    timeTaken: up?.timeTaken || null,
  };
}

function stripSensitive(q, reveal = false) {
  const obj = q.toObject ? q.toObject() : { ...q };
  if (!reveal) {
    delete obj.correctAnswer;
  }
  return obj;
}

// GET browse summary — subject/topic/year counts
router.get('/browse', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const topics = require('../store/localDataStore').getTopics();
      const bySubject = {};
      topics.forEach((t) => {
        const sub = require('../store/localDataStore').getSubjectById(t.subject);
        const name = sub?.name || 'Unknown';
        bySubject[name] = (bySubject[name] || 0) + 1;
      });
      return res.json({ success: true, data: { total: 0, bySubject, byTopic: {}, byYear: {}, byDifficulty: {} } });
    }
    const pyqs = await PYQ.find({ isActive: { $ne: false } })
      .populate('subject', 'name code color icon')
      .populate('topic', 'name')
      .select('subject topic year difficulty');

    const bySubject = {};
    const byTopic = {};
    const byYear = {};
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };

    pyqs.forEach((q) => {
      const sub = q.subject?.name || 'Unknown';
      const top = q.topic?.name || q.title;
      bySubject[sub] = (bySubject[sub] || 0) + 1;
      byTopic[top] = (byTopic[top] || 0) + 1;
      byYear[q.year] = (byYear[q.year] || 0) + 1;
      if (byDifficulty[q.difficulty] !== undefined) byDifficulty[q.difficulty]++;
    });

    res.json({
      success: true,
      data: { total: pyqs.length, bySubject, byTopic, byYear, byDifficulty },
    });
  } catch (e) { next(e); }
});

// GET global question statistics (correct/incorrect/skip %)
router.get('/stats/overview', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, data: { totalQuestions: 0, totalAttempts: 0, correctPct: 0, incorrectPct: 0, skipPct: 0 } });
    }
    const agg = await PYQ.aggregate([
      { $match: { isActive: { $ne: false } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAttempts: { $sum: '$stats.totalAttempts' },
          correct: { $sum: '$stats.correctAttempts' },
          incorrect: { $sum: '$stats.incorrectAttempts' },
          skipped: { $sum: '$stats.skipAttempts' },
        },
      },
    ]);

    const s = agg[0] || { total: 0, totalAttempts: 0, correct: 0, incorrect: 0, skipped: 0 };
    const attempts = s.totalAttempts || 1;
    res.json({
      success: true,
      data: {
        totalQuestions: s.total,
        totalAttempts: s.totalAttempts,
        correctPct: +((s.correct / attempts) * 100).toFixed(1),
        incorrectPct: +((s.incorrect / attempts) * 100).toFixed(1),
        skipPct: +((s.skipped / attempts) * 100).toFixed(1),
      },
    });
  } catch (e) { next(e); }
});

// GET all PYQs with filters
router.get('/', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) return emptyPyq(res, { page: 1 });
    const filter = { isActive: { $ne: false } };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.topic) filter.topic = req.query.topic;
    if (req.query.year) filter.year = parseInt(req.query.year, 10);
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.bookmarked === 'true') {
      const bookmarked = await UserPYQ.find({ user: req.user._id, isBookmarked: true }).select('pyq');
      filter._id = { $in: bookmarked.map((b) => b.pyq) };
    }
    if (req.query.revision === 'true') {
      const flagged = await UserPYQ.find({ user: req.user._id, revisionNeeded: true }).select('pyq');
      filter._id = { $in: flagged.map((f) => f.pyq) };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const skip = (page - 1) * limit;

    const [pyqs, total] = await Promise.all([
      PYQ.find(filter)
        .populate('subject', 'name code color icon')
        .populate('topic', 'name')
        .sort('-year')
        .skip(skip)
        .limit(limit),
      PYQ.countDocuments(filter),
    ]);

    const userPYQs = await UserPYQ.find({ user: req.user._id }).select(
      'pyq isSolved isBookmarked revisionNeeded markedDifficult lastStatus attempts timeTaken'
    );
    const userMap = {};
    userPYQs.forEach((up) => { userMap[up.pyq.toString()] = up; });

    const enriched = pyqs.map((q) => stripSensitive(enrichUserFields(q.toObject(), userMap)));

    res.json({ success: true, count: enriched.length, total, page, data: enriched });
  } catch (e) { next(e); }
});

// GET single PYQ (hide answer unless reveal=true and user has attempted)
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.status(404).json({ success: false, message: 'PYQ not found (MongoDB required for question bank)' });
    }
    const pyq = await PYQ.findById(req.params.id)
      .populate('subject', 'name code color icon')
      .populate('topic', 'name');
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found' });

    const userPYQ = await UserPYQ.findOne({ user: req.user._id, pyq: pyq._id });
    const reveal = req.query.reveal === 'true' && (userPYQ?.attempts > 0 || userPYQ?.isSolved);

    const stats = pyq.stats || {};
    const totalAttempts = stats.totalAttempts || 0;

    res.json({
      success: true,
      data: {
        ...stripSensitive(pyq.toObject(), reveal),
        isSolved: userPYQ?.isSolved || false,
        isBookmarked: userPYQ?.isBookmarked || false,
        revisionNeeded: userPYQ?.revisionNeeded || false,
        markedDifficult: userPYQ?.markedDifficult || false,
        lastStatus: userPYQ?.lastStatus || null,
        questionStats: {
          correctPct: totalAttempts ? +((stats.correctAttempts / totalAttempts) * 100).toFixed(1) : 0,
          incorrectPct: totalAttempts ? +((stats.incorrectAttempts / totalAttempts) * 100).toFixed(1) : 0,
          skipPct: totalAttempts ? +((stats.skipAttempts / totalAttempts) * 100).toFixed(1) : 0,
          totalAttempts,
        },
      },
    });
  } catch (e) { next(e); }
});

// POST attempt answer — returns solution
router.post('/:id/attempt', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.status(503).json({ success: false, message: 'PYQ practice requires MongoDB' });
    }
    const pyq = await PYQ.findById(req.params.id);
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found' });

    const { selectedAnswer, timeTaken, skipped } = req.body;
    const status = skipped ? 'skipped' : checkAnswer(pyq, selectedAnswer);

    const userInc = { attempts: 1 };
    if (status === 'correct') userInc.correctCount = 1;
    else if (status === 'incorrect') userInc.incorrectCount = 1;
    else userInc.skipCount = 1;

    const userPYQ = await UserPYQ.findOneAndUpdate(
      { user: req.user._id, pyq: pyq._id },
      {
        $set: {
          isSolved: status === 'correct',
          solvedAt: status === 'correct' ? new Date() : null,
          lastStatus: status,
          timeTaken: timeTaken || null,
          revisionNeeded: status === 'incorrect',
        },
        $inc: userInc,
      },
      { upsert: true, new: true }
    );

    await PYQ.findByIdAndUpdate(pyq._id, {
      $inc: {
        'stats.totalAttempts': 1,
        ...(status === 'correct' ? { 'stats.correctAttempts': 1 } : {}),
        ...(status === 'incorrect' ? { 'stats.incorrectAttempts': 1 } : {}),
        ...(status === 'skipped' ? { 'stats.skipAttempts': 1 } : {}),
      },
    });

    const stats = await PYQ.findById(pyq._id).select('stats');
    const totalAttempts = stats?.stats?.totalAttempts || 1;

    res.json({
      success: true,
      data: {
        status,
        correctAnswer: pyq.correctAnswer,
        explanation: pyq.explanation,
        marks: status === 'correct' ? pyq.marks : 0,
        userPYQ,
        questionStats: {
          correctPct: +(((stats?.stats?.correctAttempts || 0) / totalAttempts) * 100).toFixed(1),
          incorrectPct: +(((stats?.stats?.incorrectAttempts || 0) / totalAttempts) * 100).toFixed(1),
          skipPct: +(((stats?.stats?.skipAttempts || 0) / totalAttempts) * 100).toFixed(1),
        },
      },
    });
  } catch (e) { next(e); }
});

router.patch('/:id/bookmark', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) return res.json({ success: true, data: { isBookmarked: req.body.isBookmarked } });
    const pyq = await PYQ.findById(req.params.id);
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found' });

    const userPYQ = await UserPYQ.findOneAndUpdate(
      { user: req.user._id, pyq: req.params.id },
      { $set: { isBookmarked: req.body.isBookmarked } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: userPYQ });
  } catch (e) { next(e); }
});

router.patch('/:id/flags', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) return res.json({ success: true, data: req.body });
    const pyq = await PYQ.findById(req.params.id);
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found' });

    const updates = {};
    if (req.body.revisionNeeded !== undefined) updates.revisionNeeded = req.body.revisionNeeded;
    if (req.body.markedDifficult !== undefined) updates.markedDifficult = req.body.markedDifficult;
    if (req.body.isBookmarked !== undefined) updates.isBookmarked = req.body.isBookmarked;

    const userPYQ = await UserPYQ.findOneAndUpdate(
      { user: req.user._id, pyq: req.params.id },
      { $set: updates },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: userPYQ });
  } catch (e) { next(e); }
});

router.patch('/:id/solved', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) return res.json({ success: true, data: { isSolved: req.body.isSolved } });
    const pyq = await PYQ.findById(req.params.id);
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found' });

    const userPYQ = await UserPYQ.findOneAndUpdate(
      { user: req.user._id, pyq: req.params.id },
      { $set: { isSolved: req.body.isSolved, solvedAt: req.body.isSolved ? new Date() : null } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: userPYQ });
  } catch (e) { next(e); }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'PYQ import requires MongoDB' });
    const pyq = await PYQ.create(req.body);
    res.status(201).json({ success: true, data: pyq });
  } catch (e) { next(e); }
});

module.exports = router;
