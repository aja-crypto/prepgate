const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { MockTest, MockTestQuestion, UserMockAttempt } = require('../models/MockTest');
const {
  seedLocalMockData,
  getLocalMockTests,
  getLocalMockTestById,
  getLocalMockQuestionsByIds,
  getLocalMockTestSubjectCounts,
  saveLocalMockAttempt,
  getLocalMockAttempt,
  getAllLocalMockAttempts,
  getLocalMockAnalytics,
} = require('../store/localDataStore');
const MOCK_SEED = require('../data/mockTestSeed');

seedLocalMockData(MOCK_SEED);

const computeWeakStrongAreas = (answers, questions) => {
  const topicScores = {};
  answers.forEach((a, i) => {
    const q = questions.find(qq => qq._id === (a.questionId?._id || a.questionId));
    if (!q) return;
    if (!topicScores[q.topic]) topicScores[q.topic] = { correct: 0, total: 0 };
    topicScores[q.topic].total++;
    if (a.isCorrect) topicScores[q.topic].correct++;
  });
  const weak = [];
  const strong = [];
  Object.entries(topicScores).forEach(([topic, scores]) => {
    const pct = (scores.correct / scores.total) * 100;
    if (pct < 40) weak.push(topic);
    else if (pct >= 75) strong.push(topic);
  });
  return { weakAreas: weak, strongAreas: strong };
};

router.get('/', protect, async (req, res, next) => {
  try {
    const { subject, testType, difficulty } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (testType) filter.testType = testType;
    if (difficulty) filter.difficulty = difficulty;

    if (!isMongoConnected()) {
      return res.json({ success: true, data: getLocalMockTests(filter) });
    }
    const tests = await MockTest.find({ isActive: true, ...filter }).sort({ subject: 1, testNumber: 1 });
    res.json({ success: true, data: tests });
  } catch (err) {
    next(err);
  }
});

router.get('/subjects', protect, async (req, res, next) => {
  try {
    const counts = getLocalMockTestSubjectCounts();
    res.json({ success: true, data: counts });
  } catch (err) {
    next(err);
  }
});

router.get('/analytics', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!isMongoConnected()) {
      return res.json({ success: true, data: getLocalMockAnalytics(userId) });
    }
    const attempts = await UserMockAttempt.find({ user: userId }).sort('createdAt');
    if (!attempts.length) {
      return res.json({ success: true, data: { count: 0, avgScore: 0, avgAccuracy: 0, bestScore: 0, improvement: 0, trend: [] } });
    }
    const scores = attempts.map(a => a.score);
    res.json({
      success: true,
      data: {
        count: attempts.length,
        avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        avgAccuracy: (attempts.reduce((a, b) => a + b.accuracy, 0) / attempts.length).toFixed(1),
        bestScore: Math.max(...scores, 0),
        improvement: scores.length >= 2 ? (scores[scores.length - 1] - scores[0]).toFixed(1) : 0,
        trend: attempts.map(a => ({ score: a.score, accuracy: a.accuracy, date: a.createdAt })),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/progress', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!isMongoConnected()) {
      const attempts = getAllLocalMockAttempts(userId);
      return res.json({ success: true, data: attempts });
    }
    const attempts = await UserMockAttempt.find({ user: userId }).populate('test');
    res.json({ success: true, data: attempts });
  } catch (err) {
    next(err);
  }
});

router.get('/recommended', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tests = getLocalMockTests();

    const attemptedIds = new Set();
    if (!isMongoConnected()) {
      getAllLocalMockAttempts(userId).forEach(a => attemptedIds.add(a.test));
    }

    const uncompleted = tests.filter(t => !attemptedIds.has(t._id));
    if (!uncompleted.length) return res.json({ success: true, data: null });

    const today = new Date().getDay();
    const idx = today % uncompleted.length;
    const recommended = uncompleted[idx];
    res.json({ success: true, data: recommended });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const test = getLocalMockTestById(req.params.id);
      if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
      return res.json({ success: true, data: test });
    }
    const test = await MockTest.findById(req.params.id).populate('questionIds');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/questions', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const test = getLocalMockTestById(req.params.id);
      if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
      const questions = getLocalMockQuestionsByIds(test.questionIds);
      const sanitized = questions.map(q => ({
        _id: q._id, subject: q.subject, topic: q.topic, difficulty: q.difficulty,
        questionText: q.questionText, options: q.options, marks: q.marks,
      }));
      return res.json({ success: true, data: { test, questions: sanitized } });
    }
    const test = await MockTest.findById(req.params.id).populate('questionIds');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    const sanitized = test.questionIds.map(q => ({
      _id: q._id, subject: q.subject, topic: q.topic, difficulty: q.difficulty,
      questionText: q.questionText, options: q.options, marks: q.marks,
    }));
    res.json({ success: true, data: { test: { ...test.toObject(), questionIds: undefined }, questions: sanitized } });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/submit', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { answers, timeTaken } = req.body;

    if (!isMongoConnected()) {
      const test = getLocalMockTestById(req.params.id);
      if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
      const questions = getLocalMockQuestionsByIds(test.questionIds);

      let score = 0;
      const processedAnswers = (answers || []).map(a => {
        const q = questions.find(qq => qq._id === a.questionId);
        const isCorrect = q ? a.selectedAnswer === q.correctAnswer : false;
        if (isCorrect) score += q ? q.marks : 1;
        return {
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer,
          isCorrect,
          timeSpent: a.timeSpent || 0,
          mistakeCategory: a.mistakeCategory || '',
        };
      });

      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      const accuracy = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
      const { weakAreas, strongAreas } = computeWeakStrongAreas(processedAnswers, questions);

      const attempt = saveLocalMockAttempt(userId, {
        test: req.params.id,
        answers: processedAnswers,
        score,
        totalMarks,
        accuracy,
        timeTaken: timeTaken || 0,
        weakAreas,
        strongAreas,
        startedAt: new Date(Date.now() - (timeTaken || 0) * 1000).toISOString(),
        completedAt: new Date().toISOString(),
      });

      return res.json({ success: true, data: attempt });
    }

    const test = await MockTest.findById(req.params.id).populate('questionIds');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    let score = 0;
    const processedAnswers = (answers || []).map(a => {
      const q = test.questionIds.find(qq => String(qq._id) === a.questionId);
      const isCorrect = q ? a.selectedAnswer === q.correctAnswer : false;
      if (isCorrect) score += q ? q.marks : 1;
      return {
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect,
        timeSpent: a.timeSpent || 0,
        mistakeCategory: a.mistakeCategory || '',
      };
    });

    const totalMarks = test.questionIds.reduce((sum, q) => sum + q.marks, 0);
    const accuracy = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
    const { weakAreas, strongAreas } = computeWeakStrongAreas(processedAnswers, test.questionIds);

    const lastAttempt = await UserMockAttempt.findOne({ user: userId, test: req.params.id })
      .sort('-attemptNumber')
      .limit(1);
    const nextAttemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1;

    const attempt = await UserMockAttempt.create({
      user: userId,
      test: req.params.id,
      attemptNumber: nextAttemptNumber,
      answers: processedAnswers,
      score,
      totalMarks,
      accuracy,
      timeTaken,
      weakAreas,
      strongAreas,
      startedAt: new Date(Date.now() - (timeTaken || 0) * 1000),
      completedAt: new Date(),
    });
    res.json({ success: true, data: attempt });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/result', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!isMongoConnected()) {
      const attempt = getLocalMockAttempt(userId, req.params.id);
      if (!attempt) return res.status(404).json({ success: false, message: 'No attempt found' });
      const test = getLocalMockTestById(req.params.id);
      const questions = test ? getLocalMockQuestionsByIds(test.questionIds) : [];
      const enriched = questions.map(q => {
        const ans = (attempt.answers || []).find(a => String(a.questionId) === String(q._id));
        return { ...q, selectedAnswer: ans?.selectedAnswer ?? null, isCorrect: ans?.isCorrect ?? false, mistakeCategory: ans?.mistakeCategory || '' };
      });
      return res.json({ success: true, data: { attempt, test, questions: enriched } });
    }
    const attempt = await UserMockAttempt.findOne({ user: userId, test: req.params.id })
      .sort('-attemptNumber')
      .populate('test');
    if (!attempt) return res.status(404).json({ success: false, message: 'No attempt found' });
    const test = await MockTest.findById(req.params.id).populate('questionIds');
    const enriched = test.questionIds.map(q => {
      const ans = (attempt.answers || []).find(a => String(a.questionId) === String(q._id));
      return { ...q.toObject(), selectedAnswer: ans?.selectedAnswer ?? null, isCorrect: ans?.isCorrect ?? false };
    });
    res.json({ success: true, data: { attempt, test, questions: enriched } });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Creating tests requires MongoDB' });
    const test = await MockTest.create(req.body);
    res.status(201).json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    if (!isMongoConnected()) return res.json({ success: true, message: 'Deleted (local)' });
    await MockTest.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
