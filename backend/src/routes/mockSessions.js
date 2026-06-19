// Interactive mock tests generated from PYQ bank
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { MockSession, PYQ } = require('../models');
const { generateMock } = require('../services/mockGeneratorService');
const { checkAnswer } = require('../services/pyqImportService');

function stripAnswer(q) {
  const obj = q.toObject ? q.toObject() : { ...q };
  delete obj.correctAnswer;
  return obj;
}

// POST generate new mock session
router.post('/generate', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Interactive mocks require MongoDB and imported PYQs' });
    }
    const generated = await generateMock(req.body);
    if (!generated.questions.length) {
      return res.status(400).json({
        success: false,
        message: 'No questions found for the selected filters. Import PYQs via admin panel first.',
      });
    }

    const session = await MockSession.create({
      user: req.user._id,
      name: generated.name,
      type: generated.type,
      config: generated.config,
      questions: generated.questions,
      maxScore: generated.maxScore,
      status: 'in_progress',
    });

    res.status(201).json({ success: true, data: session });
  } catch (e) { next(e); }
});

// GET user's mock sessions
router.get('/', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, count: 0, data: [] });
    }
    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const sessions = await MockSession.find(filter).sort('-createdAt').limit(50);
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (e) { next(e); }
});

// GET session with questions (no answers)
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(404).json({ success: false, message: 'Session not found (MongoDB required)' });
    }
    const session = await MockSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const pyqIds = session.questions.map((q) => q.pyq);
    const pyqs = await PYQ.find({ _id: { $in: pyqIds } })
      .populate('subject', 'name code color')
      .populate('topic', 'name');

    const pyqMap = {};
    pyqs.forEach((p) => { pyqMap[p._id.toString()] = stripAnswer(p); });

    const questions = session.questions
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        order: q.order,
        marks: q.marks,
        pyq: pyqMap[q.pyq.toString()],
      }))
      .filter((q) => q.pyq);

    res.json({
      success: true,
      data: {
        ...session.toObject(),
        questions,
      },
    });
  } catch (e) { next(e); }
});

// POST submit mock — grade all answers, return solutions
router.post('/:id/submit', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Mock submission requires MongoDB' });
    }
    const session = await MockSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Session already submitted' });
    }

    const answers = req.body.answers || [];
    const pyqIds = session.questions.map((q) => q.pyq);
    const pyqs = await PYQ.find({ _id: { $in: pyqIds } });
    const pyqMap = {};
    pyqs.forEach((p) => { pyqMap[p._id.toString()] = p; });

    const marksMap = {};
    session.questions.forEach((q) => { marksMap[q.pyq.toString()] = q.marks || 2; });

    let score = 0;
    let totalTime = 0;
    const resultStats = { correct: 0, incorrect: 0, skipped: 0 };
    const gradedAnswers = [];
    const solutions = [];

    // Collect bulk operations
    const userPyqOps = [];
    const pyqStatsOps = [];

    for (const ans of answers) {
      const pyq = pyqMap[ans.pyqId || ans.pyq];
      if (!pyq) continue;

      const status = ans.skipped ? 'skipped' : checkAnswer(pyq, ans.selectedAnswer);
      const marks = status === 'correct' ? (marksMap[pyq._id.toString()] || pyq.marks || 2) : 0;
      score += marks;
      totalTime += ans.timeTaken || 0;
      resultStats[status === 'skipped' ? 'skipped' : status]++;

      gradedAnswers.push({
        pyq: pyq._id,
        selectedAnswer: ans.selectedAnswer,
        status,
        timeTaken: ans.timeTaken || 0,
        marksAwarded: marks,
      });

      solutions.push({
        pyqId: pyq._id,
        title: pyq.title,
        status,
        selectedAnswer: ans.selectedAnswer,
        correctAnswer: pyq.correctAnswer,
        explanation: pyq.explanation,
        marksAwarded: marks,
        questionStats: pyq.stats,
      });

      // Update global + user stats (collect for bulk)
      const inc = { attempts: 1 };
      if (status === 'correct') inc.correctCount = 1;
      else if (status === 'incorrect') inc.incorrectCount = 1;
      else inc.skipCount = 1;

      userPyqOps.push({
        updateOne: {
          filter: { user: req.user._id, pyq: pyq._id },
          update: {
            $set: { lastStatus: status, isSolved: status === 'correct', revisionNeeded: status === 'incorrect' },
            $inc: inc,
          },
          upsert: true,
        },
      });

      const pyqStatsInc = {
        'stats.totalAttempts': 1,
        ...(status === 'correct' ? { 'stats.correctAttempts': 1 } : {}),
        ...(status === 'incorrect' ? { 'stats.incorrectAttempts': 1 } : {}),
        ...(status === 'skipped' ? { 'stats.skipAttempts': 1 } : {}),
      };
      pyqStatsOps.push({
        updateOne: {
          filter: { _id: pyq._id },
          update: { $inc: pyqStatsInc },
        },
      });
    }

    // Execute bulk operations in parallel
    if (userPyqOps.length) {
      const { UserPYQ } = require('../models');
      await UserPYQ.bulkWrite(userPyqOps, { ordered: false });
    }
    if (pyqStatsOps.length) {
      await PYQ.bulkWrite(pyqStatsOps, { ordered: false });
    }

    const totalAnswered = resultStats.correct + resultStats.incorrect;
    const accuracy = totalAnswered ? +((resultStats.correct / totalAnswered) * 100).toFixed(1) : 0;

    session.answers = gradedAnswers;
    session.score = score;
    session.accuracy = accuracy;
    session.totalTime = totalTime;
    session.resultStats = resultStats;
    session.status = 'completed';
    session.submittedAt = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        session,
        solutions,
        resultStats,
        score,
        maxScore: session.maxScore,
        accuracy,
        totalTime,
      },
    });
  } catch (e) { next(e); }
});

// GET results with full solutions (completed sessions only)
router.get('/:id/results', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(404).json({ success: false, message: 'Session not found (MongoDB required)' });
    }
    const session = await MockSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Session not yet submitted' });
    }

    const pyqIds = session.questions.map((q) => q.pyq);
    const pyqs = await PYQ.find({ _id: { $in: pyqIds } })
      .populate('subject', 'name code')
      .populate('topic', 'name');
    const pyqMap = {};
    pyqs.forEach((p) => { pyqMap[p._id.toString()] = p; });

    const solutions = (session.answers || []).map((ans) => {
      const pyq = pyqMap[ans.pyq.toString()];
      const stats = pyq?.stats || {};
      const total = stats.totalAttempts || 1;
      return {
        pyqId: ans.pyq,
        title: pyq?.title,
        subject: pyq?.subject?.name,
        topic: pyq?.topic?.name,
        status: ans.status,
        selectedAnswer: ans.selectedAnswer,
        correctAnswer: pyq?.correctAnswer,
        explanation: pyq?.explanation,
        marksAwarded: ans.marksAwarded,
        timeTaken: ans.timeTaken,
        questionStats: {
          correctPct: +(((stats.correctAttempts || 0) / total) * 100).toFixed(1),
          incorrectPct: +(((stats.incorrectAttempts || 0) / total) * 100).toFixed(1),
          skipPct: +(((stats.skipAttempts || 0) / total) * 100).toFixed(1),
        },
      };
    });

    res.json({
      success: true,
      data: {
        session,
        solutions,
        resultStats: session.resultStats,
        score: session.score,
        maxScore: session.maxScore,
        accuracy: session.accuracy,
        totalTime: session.totalTime,
      },
    });
  } catch (e) { next(e); }
});

module.exports = router;
