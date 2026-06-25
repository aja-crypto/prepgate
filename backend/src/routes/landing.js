const router = require('express').Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { LandingContent, QuestionOfMonth, MotivationQuote, FeaturedResource } = require('../models/LandingContent');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Fallback data for when MongoDB is not connected
const FALLBACK_STATS = {
  resources: 500,
  pyqs: 3500,
  mocks: 55,
  learners: 2500
};

// ============================================
// GET MONTHLY INSIGHT
// ============================================
router.get('/monthly-insight', asyncHandler(async (req, res) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  if (!isMongoConnected()) {
    return res.json({
      success: true,
      data: {
        title: 'GATE 2027 Monthly Insights',
        description: 'Stay updated with the latest GATE exam patterns, important topics, and strategic recommendations for effective preparation.',
        priority: 1,
        featuredSubjects: ['Mathematics', 'Aptitude', 'Data Structures', 'Algorithms'],
        topics: [
          { name: 'Linear Algebra', weightage: 8.5, pyqFrequency: 12, trend: 'increasing' },
          { name: 'Graph Theory', weightage: 7.2, pyqFrequency: 9, trend: 'stable' },
          { name: 'Calculus', weightage: 7.0, pyqFrequency: 10, trend: 'increasing' },
          { name: 'Digital Logic', weightage: 6.8, pyqFrequency: 8, trend: 'stable' },
        ],
        pyqPatterns: ['Matrix operations', 'Eigenvalues', 'Complex integrals', 'Graph connectivity'],
        recommendations: [
          'Focus on numerical methods for quick answers',
          'Practice previous year questions from Linear Algebra',
          'Revise calculus concepts daily',
        ],
      },
    });
  }

  const insight = await LandingContent.findOne({ month, year, isActive: true })
    .sort({ priority: 1 })
    .lean();

  if (!insight) {
    return res.json({
      success: true,
      data: {
        title: 'GATE 2027 Monthly Insights',
        description: 'Stay updated with the latest GATE exam patterns and strategic preparation tips.',
        priority: 1,
        featuredSubjects: ['Mathematics', 'Aptitude', 'Data Structures'],
        topics: [
          { name: 'Linear Algebra', weightage: 8.5, pyqFrequency: 12, trend: 'increasing' },
          { name: 'Graph Theory', weightage: 7.2, pyqFrequency: 9, trend: 'stable' },
        ],
        pyqPatterns: ['Matrix operations', 'Eigenvalues'],
        recommendations: ['Focus on numerical problems', 'Practice daily revision'],
      },
    });
  }

  res.json({ success: true, data: insight });
}));

// ============================================
// GET QUESTION OF THE MONTH
// ============================================
router.get('/question-of-month', asyncHandler(async (req, res) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  if (!isMongoConnected()) {
    return res.json({
      success: true,
      data: {
        question: 'The number of spanning trees in a complete graph K₄ is:',
        options: ['8', '12', '16', '24'],
        correctAnswer: 2,
        hint: 'Think about Cayley\'s formula for spanning trees.',
        subject: 'DS',
        topic: 'Graph Theory',
        difficulty: 'medium',
        tags: ['spanning trees', 'graph theory', 'combinatorics'],
      },
    });
  }

  const question = await QuestionOfMonth.findOne({ month, year, isActive: true }).lean();

  if (!question) {
    return res.json({
      success: true,
      data: {
        question: 'The number of spanning trees in a complete graph K₄ is:',
        options: ['8', '12', '16', '24'],
        correctAnswer: 2,
        hint: 'Think about Cayley\'s formula for spanning trees.',
        explanation: 'For a complete graph Kₙ, the number of spanning trees is n^(n-2). For K₄: 4^(4-2) = 4² = 16',
        subject: 'DS',
        topic: 'Graph Theory',
        difficulty: 'medium',
        tags: ['spanning trees', 'graph theory'],
      },
    });
  }

  res.json({ success: true, data: question });
}));

// ============================================
// GET DAILY MOTIVATION
// ============================================
router.get('/motivation', asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    const quotes = [
      { quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'daily' },
      { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'daily' },
      { quote: 'GATE is not just an exam, it\'s a stepping stone to your dreams.', author: 'GateApex Team', category: 'gate_success' },
    ];
    const dailyQuote = quotes[Math.floor(Math.random() * quotes.length)];
    return res.json({ success: true, data: dailyQuote });
  }

  const quotes = await MotivationQuote.find({ isActive: true }).lean();
  if (quotes.length === 0) {
    return res.json({
      success: true,
      data: {
        quote: 'Every day is a new opportunity to learn something new. Make it count!',
        author: 'GateApex Team',
        category: 'daily',
      },
    });
  }

  const today = new Date().getDate();
  const dailyQuote = quotes[today % quotes.length];
  res.json({ success: true, data: dailyQuote });
}));

// ============================================
// GET FEATURED RESOURCES
// ============================================
router.get('/featured', asyncHandler(async (req, res) => {
  const { type, limit = 5 } = req.query;

  if (!isMongoConnected()) {
    const notes = [
      { title: 'Complete Engineering Mathematics Notes', description: 'Comprehensive notes covering all topics', category: 'notes', thumbnail: '', url: '/study-hub' },
      { title: 'PYQ Solutions 2020-2024', description: 'Previous year question solutions with explanations', category: 'pyq', thumbnail: '', url: '/pyq' },
    ];
    return res.json({ success: true, data: notes.slice(0, parseInt(limit)) });
  }

  const filter = { isActive: true };
  if (type) filter.category = type;

  const resources = await FeaturedResource.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  res.json({ success: true, data: resources });
}));

// ============================================
// GET PLATFORM STATISTICS
// ============================================
router.get('/stats', asyncHandler(async (req, res) => {
  if (!isMongoConnected()) {
    return res.json({
      success: true,
      data: FALLBACK_STATS,
    });
  }

  // In a real implementation, aggregate from actual collections
  const [notesCount, pyqsCount, mocksCount, usersCount] = await Promise.all([
    mongoose.model('Note').countDocuments(),
    mongoose.model('PYQ').countDocuments(),
    mongoose.model('MockTest').countDocuments(),
    mongoose.model('User').countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      resources: notesCount || 500,
      pyqs: pyqsCount || 3500,
      mocks: mocksCount || 55,
      learners: usersCount || 2500,
    },
  });
}));

// ============================================
// GET AIR PREDICTION
// ============================================
router.get('/air-prediction', protect, asyncHandler(async (req, res) => {
  const user = req.user;

  if (!isMongoConnected()) {
    const progress = user.progress || {};
    const completedTopics = Object.values(progress).filter(p => p.completed).length;
    const totalTopics = 150;
    const readiness = Math.min(100, Math.round((completedTopics / totalTopics) * 100));

    return res.json({
      success: true,
      data: {
        readiness,
        estimatedAIR: `${Math.max(100, 5000 - readiness * 45)} - ${Math.max(500, 10000 - readiness * 80)}`,
        confidence: Math.min(95, 40 + readiness * 0.5),
        basedOn: {
          pyqsSolved: 150,
          mockScore: 65,
          topicCompletion: readiness,
        },
      },
    });
  }

  // Real implementation would query user's progress
  const progress = user.progress || {};
  const completedTopics = Object.values(progress).filter(p => p.completed).length;
  const totalTopics = 150;
  const readiness = Math.min(100, Math.round((completedTopics / totalTopics) * 100));

  res.json({
    success: true,
    data: {
      readiness,
      estimatedAIR: `${Math.max(100, 5000 - readiness * 45)} - ${Math.max(500, 10000 - readiness * 80)}`,
      confidence: Math.min(95, 40 + readiness * 0.5),
      basedOn: {
        pyqsSolved: 150,
        mockScore: 65,
        topicCompletion: readiness,
      },
    },
  });
}));

module.exports = router;
