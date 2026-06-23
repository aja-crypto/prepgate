const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected, isMockAuthEnabled } = require('../config/db');
const { Flashcard, MonthlySet, UserFlashcardProgress } = require('../models/GateVault');
const localStore = require('../store/localDataStore');

// GET current month's published set with questions
router.get('/monthly-set', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: false, message: 'MongoDB required for GateVault' });
    }
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const monthStr = `${year}-${month}`;

    let set = await MonthlySet.findOne({ month: monthStr, isPublished: true })
      .populate('flashcardIds');

    if (!set) {
      return res.json({ success: true, data: null, message: 'No published set for this month' });
    }

    const questions = set.flashcardIds.map((fc, idx) => ({
      index: idx,
      _id: fc._id,
      question: fc.question,
      options: fc.options,
      subject: fc.subject,
      topic: fc.topic,
      difficulty: fc.difficulty,
      importanceScore: fc.importanceScore,
    }));

    res.json({ success: true, data: { ...set.toObject(), questions } });
  } catch (e) { next(e); }
});

// GET user's progress for current month
router.get('/progress', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: false, message: 'MongoDB required' });
    }
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const monthStr = `${year}-${month}`;

    const set = await MonthlySet.findOne({ month: monthStr, isPublished: true });
    if (!set) {
      return res.json({ success: true, data: null });
    }

    const progress = await UserFlashcardProgress.findOne({
      user: req.user._id,
      monthlySet: set._id,
    });

    res.json({ success: true, data: progress });
  } catch (e) { next(e); }
});

// POST start/continue session
router.post('/start', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.status(503).json({ success: false, message: 'MongoDB required' });
    }
    const { selectedSubjects } = req.body; // ['APT', 'DS', 'DBMS', ...]

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const monthStr = `${year}-${month}`;

    let monthlySet = await MonthlySet.findOne({ month: monthStr, isPublished: true })
      .populate('flashcardIds');

    if (!monthlySet) {
      return res.status(404).json({ success: false, message: 'No published set for this month' });
    }

    // Filter by selected subjects (always include APT)
    const filteredSubjects = selectedSubjects || ['APT'];
    const filteredCards = monthlySet.flashcardIds.filter(fc =>
      filteredSubjects.includes(fc.subject)
    );

    if (filteredCards.length < 10) {
      return res.status(400).json({ success: false, message: 'Not enough questions for selected subjects' });
    }

    // Find or create progress
    let progress = await UserFlashcardProgress.findOne({
      user: req.user._id,
      monthlySet: monthlySet._id,
    });

    if (!progress) {
      progress = await UserFlashcardProgress.create({
        user: req.user._id,
        monthlySet: monthlySet._id,
        currentIndex: 0,
        streak: 0,
      });
    }

    res.json({ success: true, data: { progress, totalQuestions: filteredCards.length } });
  } catch (e) { next(e); }
});

// POST submit answer
router.post('/answer', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.status(503).json({ success: false, message: 'MongoDB required' });
    }
    const { monthlySetId, questionIndex, selectedAnswer, timeTaken } = req.body;

    const set = await MonthlySet.findById(monthlySetId).populate('flashcardIds');
    if (!set) {
      return res.status(404).json({ success: false, message: 'Set not found' });
    }

    const question = set.flashcardIds[questionIndex];
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const isCorrect = selectedAnswer === question.correctAnswer;

    let progress = await UserFlashcardProgress.findOne({
      user: req.user._id,
      monthlySet: monthlySetId,
    });

    if (!progress) {
      progress = await UserFlashcardProgress.create({
        user: req.user._id,
        monthlySet: monthlySetId,
        currentIndex: questionIndex,
        streak: 0,
      });
    }

    // Update or add answer
    const existingAnswerIdx = progress.answers.findIndex(
      a => a.questionIndex === questionIndex
    );

    if (existingAnswerIdx >= 0) {
      progress.answers[existingAnswerIdx] = { questionIndex, selectedAnswer, isCorrect, timeTaken };
    } else {
      progress.answers.push({ questionIndex, selectedAnswer, isCorrect, timeTaken });
    }

    // Recalculate score
    const correctAnswers = progress.answers.filter(a => a.isCorrect);
    progress.correctCount = correctAnswers.length;
    progress.score = Math.round((correctAnswers.length / set.flashcardIds.length) * 100);
    progress.accuracy = set.flashcardIds.length > 0
      ? Math.round((correctAnswers.length / progress.answers.length) * 100)
      : 0;

    // Move to next unanswered question
    const answeredIndices = new Set(progress.answers.map(a => a.questionIndex));
    let nextIndex = -1;
    for (let i = 0; i < set.flashcardIds.length; i++) {
      if (!answeredIndices.has(i)) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex === -1) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
      progress.currentIndex = set.flashcardIds.length;
    } else {
      progress.currentIndex = nextIndex;
    }

    progress.lastStudiedAt = new Date();
    progress.streak = (progress.streak || 0) + 1;
    await progress.save();

    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        nextIndex,
        progress: {
          currentIndex: progress.currentIndex,
          correctCount: progress.correctCount,
          score: progress.score,
          accuracy: progress.accuracy,
          streak: progress.streak,
          isCompleted: progress.isCompleted,
          totalQuestions: set.flashcardIds.length,
          answeredCount: progress.answers.length,
        },
      },
    });
  } catch (e) { next(e); }
});

// GET stats/analytics
router.get('/stats', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, data: { totalAttempted: 0, bestScore: 0, avgAccuracy: 0 } });
    }
    const stats = await UserFlashcardProgress.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: null,
        totalAttempted: { $sum: { $size: { $ifNull: ['$answers', []] } } },
        bestScore: { $max: '$score' },
        avgAccuracy: { $avg: '$accuracy' },
        completedSets: { $sum: { $cond: ['$isCompleted', 1, 0] } },
      }},
    ]);

    res.json({
      success: true,
      data: stats[0] || { totalAttempted: 0, bestScore: 0, avgAccuracy: 0 },
    });
  } catch (e) { next(e); }
});

module.exports = router;