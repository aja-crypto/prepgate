// src/routes/flashcards.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { isMockAuthEnabled } = require('../config/devMode');
const { Flashcard, UserFlashcard } = require('../models');
const { validateFields, VALID_SUBJECTS } = require('../middleware/validateInput');

// Utility function for transforming flashcard responses
function transformFlashcard(flashcard, req) {
  return flashcard.toObject ? flashcard.toObject() : flashcard;
}

// Get all user's flashcards with pagination and filtering
router.get('/', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = { user: userId, reviewStatus: 'due' };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.search) {
      filter.$or = [
        { question: { $regex: req.query.search, $options: 'i' } },
        { 'flashcard.question': { $regex: req.query.search, $options: 'i' } },
        { keywords: { $in: [req.query.search] } }
      ];
    }

    // Get user's flashcards from database or local storage
    let userFlashcards;
    if (!isMongoConnected() || isMockAuthEnabled()) {
      // For mock mode, we'll need to get local storage - using empty for now
      userFlashcards = [];
    } else {
      userFlashcards = await UserFlashcard.find(filter)
        .populate('flashcard', 'question questionType difficulty years options answer explanation')
        .populate('subject', 'name')
        .populate('topic', 'name')
        .sort({ 'nextReviewDate': 1 }) // Due dates first
        .skip(skip)
        .limit(limit);
    }

    // Get total count
    let totalCount;
    if (!isMongoConnected() || isMockAuthEnabled()) {
      totalCount = 0;
    } else {
      totalCount = await UserFlashcard.countDocuments(filter);
    }

    res.json({
      success: true,
      count: userFlashcards.length,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      data: userFlashcards.map(uf => transformFlashcard(uf, req)),
    });
  } catch (e) { next(e); }
});

// Get all available flashcards (questions) - for adding to user deck
router.get('/bank', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.year) filter.years = req.query.year;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    if (!isMongoConnected() || isMockAuthEnabled()) {
      // For mock mode, return empty array
      return res.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const flashcards = await Flashcard.find(filter)
      .populate('subject', 'name color')
      .populate('topic', 'name')
      .sort({ order: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Flashcard.countDocuments(filter);

    res.json({
      success: true,
      count: flashcards.length,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      data: flashcards,
    });
  } catch (e) { next(e); }
});

// Get user's review queue - flashcards due for review
router.get('/review/queue', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const dueFlashcards = await UserFlashcard.find({
      user: userId,
      reviewStatus: 'due',
    })
      .populate('flashcard', 'question questionType options answer explanation')
      .populate('topic', 'name')
      .populate('subject', 'name')
      .sort({ nextReviewDate: 1 }) // Earliest due first
      .limit(limit);

    res.json({
      success: true,
      count: dueFlashcards.length,
      data: dueFlashcards.map(uf => transformFlashcard(uf, req)),
    });
  } catch (e) { next(e); }
});

// Get user's flashcard stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({
        success: true,
        data: {
          total: 0,
          dueToday: 0,
          streak: 0,
          mastered: 0,
          weakTopics: [],
          subjects: [],
          reviewRate: 0,
        },
      });
    }

    const userFlashcards = await UserFlashcard.find({ user: userId });
    
    const stats = {
      total: userFlashcards.length,
      dueToday: userFlashcards.filter(f => f.reviewStatus === 'due').length,
      streak: Math.max(...userFlashcards.map(f => f.performance.correctStreak), 0),
      mastered: userFlashcards.filter(f => f.masteryLevel === 'mastered').length,
      weakTopics: [],
      subjects: [],
      reviewRate: 0,
    };

    // Calculate derived stats
    const totalReviews = userFlashcards.reduce((sum, f) => sum + f.performance.totalReviews, 0);
    const correctReviews = userFlashcards.reduce((sum, f) => sum + f.performance.correctReviews, 0);
    stats.reviewRate = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

    // Extract weak topics and subjects
    const topicMap = new Map();
    const subjectMap = new Map();
    
    userFlashcards.forEach(f => {
      if (f.performance.accuracy < 60) {
        const topicName = f.topic?.name || 'Unknown';
        topicMap.set(topicName, (topicMap.get(topicName) || 0) + 1);
      }
      
      const subjectName = f.subject?.name || 'Unknown';
      subjectMap.set(subjectName, (subjectMap.get(subjectName) || 0) + 1);
    });

    stats.weakTopics = Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    stats.subjects = Array.from(subjectMap.entries())
      .map(([name, count]) => ({ name, count }));

    res.json({ success: true, data: stats });
  } catch (e) { next(e); }
});

// Add flashcard to user's deck
router.post('/', protect, validateFields([
  { name: 'flashcardId', type: 'string', required: true },
  { name: 'source', type: 'string', in: ['weak_topic', 'manual', 'revision', 'mock_test', 'gate_paper', 'topic_revision'] },
  { name: 'tags', type: 'string', max: 200 },
  { name: 'personalNotes', type: 'string', max: 1000 },
]), async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { flashcardId, source = 'weak_topic', tags, personalNotes } = req.body;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      // For mock mode, return placeholder response
      return res.status(201).json({
        success: true,
        message: 'Flashcard added (mock mode)',
        data: { id: 'mock-flashcard-id' },
      });
    }

    // Check if flashcard already exists for user
    const existing = await UserFlashcard.findOne({ user: userId, flashcard: flashcardId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Flashcard already in user\'s deck',
      });
    }

    // Get flashcard data
    const flashcard = await Flashcard.findById(flashcardId);
    if (!flashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found',
      });
    }

    // Create new user flashcard with SRS defaults
    const userFlashcard = await UserFlashcard.create({
      user: userId,
      flashcard: flashcardId,
      topic: flashcard.topic,
      subject: flashcard.subject,
      source,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      personalNotes,
      // SRS initial values
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      reviewHistory: [],
      nextReviewDate: new Date(),
      performance: {
        correctStreak: 0,
        wrongStreak: 0,
        currentConfidence: 3,
        totalReviews: 0,
        correctReviews: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Flashcard added to deck',
      data: transformFlashcard(userFlashcard, req),
    });
  } catch (e) { next(e); }
});

// Submit review for flashcard
router.post('/:id/review', protect, validateFields([
  { name: 'qualityOfResponse', type: 'number', required: true, min: 0, max: 5 },
  { name: 'reviewTime', type: 'number', min: 0, max: 300 },
  { name: 'note', type: 'string', max: 200 },
]), async (req, res, next) => {
  try {
    const userId = req.user._id;
    const flashcardId = req.params.id;
    const { qualityOfResponse, reviewTime, note } = req.body;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({
        success: true,
        message: 'Review submitted (mock mode)',
        data: { id: flashcardId, reviewed: true },
      });
    }

    // Get user flashcard
    const userFlashcard = await UserFlashcard.findOne({ user: userId, flashcard: flashcardId });
    if (!userFlashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found in user\'s deck',
      });
    }

    // Update review history
    const reviewEntry = {
      date: new Date(),
      qualityOfResponse,
      reviewTime,
      note,
    };

    userFlashcard.reviewHistory.push(reviewEntry);
    userFlashcard.lastReviewedAt = new Date();

    // Update performance stats
    userFlashcard.performance.totalReviews += 1;
    if (qualityOfResponse >= 3) {
      userFlashcard.performance.correctReviews += 1;
      userFlashcard.performance.correctStreak += 1;
      userFlashcard.performance.wrongStreak = 0;
    } else {
      userFlashcard.performance.wrongStreak += 1;
      userFlashcard.performance.correctStreak = 0;
    }

    // Calculate new accuracy
    const total = userFlashcard.performance.totalReviews;
    const correct = userFlashcard.performance.correctReviews;
    userFlashcard.performance.accuracy = Math.round((correct / total) * 100);

    // Update confidence
    userFlashcard.performance.currentConfidence = Math.max(1, Math.min(5, 
      userFlashcard.performance.currentConfidence + (qualityOfResponse - 3)
    ));

    // Apply SM-2 algorithm
    if (qualityOfResponse >= 3) {
      // Successful repetition
      if (userFlashcard.repetitions === 0) {
        userFlashcard.intervalDays = 1;
      } else if (userFlashcard.repetitions === 1) {
        userFlashcard.intervalDays = 6;
      } else {
        userFlashcard.intervalDays = Math.round(
          userFlashcard.intervalDays * userFlashcard.easeFactor
        );
      }
      userFlashcard.repetitions += 1;
      
      // Increase ease factor for good responses
      userFlashcard.easeFactor = Math.max(1.3, userFlashcard.easeFactor + (0.1 - (5 - qualityOfResponse) * 0.08));
    } else {
      // Failed repetition - reset
      userFlashcard.repetitions = 0;
      userFlashcard.intervalDays = 1; // Re-learn after failure
      // Decrease ease factor for poor responses
      userFlashcard.easeFactor = Math.max(1.3, userFlashcard.easeFactor - 0.2);
    }

    // Update review status based on next interval
    if (userFlashcard.intervalDays === 0 || userFlashcard.easeFactor < 1.5) {
      userFlashcard.reviewStatus = 'due';
      userFlashcard.nextReviewDate = new Date();
    } else {
      userFlashcard.reviewStatus = 'due';
      userFlashcard.nextReviewDate = new Date(Date.now() + (userFlashcard.intervalDays * 24 * 60 * 60 * 1000));
    }

    await userFlashcard.save();

    res.json({
      success: true,
      message: 'Review recorded',
      data: transformFlashcard(userFlashcard, req),
    });
  } catch (e) { next(e); }
});

// Remove flashcard from user's deck
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const flashcardId = req.params.id;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, message: 'Flashcard removed (mock mode)' });
    }

    const userFlashcard = await UserFlashcard.findOneAndDelete({
      user: userId,
      flashcard: flashcardId,
    });

    if (!userFlashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found in user\'s deck',
      });
    }

    res.json({ success: true, message: 'Flashcard removed from deck' });
  } catch (e) { next(e); }
});

// Update user flashcard (notes, tags, etc.)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const flashcardId = req.params.id;
    const updateData = req.body;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({
        success: true,
        message: 'Flashcard updated (mock mode)',
        data: { id: flashcardId, updated: true },
      });
    }

    const userFlashcard = await UserFlashcard.findOneAndUpdate(
      { user: userId, flashcard: flashcardId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!userFlashcard) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard not found in user\'s deck',
      });
    }

    res.json({
      success: true,
      message: 'Flashcard updated',
      data: transformFlashcard(userFlashcard, req),
    });
  } catch (e) { next(e); }
});

module.exports = router;