const router = require('express').Router();
const { adminProtect, requirePermission } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');
const { Flashcard, MonthlySet } = require('../models/GateVault');

// GET all flashcards
router.get('/flashcards', adminProtect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, count: 0, data: [] });
    }
    const { subject, difficulty, search } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.question = { $regex: search, $options: 'i' };

    const cards = await Flashcard.find(filter).sort('-importanceScore -createdAt');
    res.json({ success: true, count: cards.length, data: cards });
  } catch (e) { next(e); }
});

// POST create flashcard
router.post('/flashcards', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB required' });
    }
    const { question, options, correctAnswer, explanation, subject, topic, importanceScore, difficulty } = req.body;

    if (!question || !options || correctAnswer === undefined || !subject) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const card = await Flashcard.create({
      question, options, correctAnswer, explanation, subject, topic,
      importanceScore: importanceScore || 5,
      difficulty: difficulty || 'medium',
    });

    res.status(201).json({ success: true, data: card });
  } catch (e) { next(e); }
});

// PUT update flashcard
router.put('/flashcards/:id', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB required' });
    }
    const card = await Flashcard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, data: card });
  } catch (e) { next(e); }
});

// DELETE flashcard
router.delete('/flashcards/:id', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB required' });
    }
    await Flashcard.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Card deleted' });
  } catch (e) { next(e); }
});

// POST bulk import flashcards
router.post('/flashcards/bulk', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB required' });
    }
    const { cards } = req.body;
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ success: false, message: 'No cards provided' });
    }

    const created = await Flashcard.insertMany(cards.map(c => ({
      question: c.question,
      options: c.options,
      correctAnswer: c.correctAnswer,
      explanation: c.explanation || '',
      subject: c.subject,
      topic: c.topic || '',
      importanceScore: c.importanceScore || 5,
      difficulty: c.difficulty || 'medium',
    })));

    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (e) { next(e); }
});

// GET all monthly sets
router.get('/monthly-sets', adminProtect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, count: 0, data: [] });
    }
    const sets = await MonthlySet.find().sort('-year -month').populate('publishedBy', 'name email');
    res.json({ success: true, count: sets.length, data: sets });
  } catch (e) { next(e); }
});

// POST create monthly set
router.post('/monthly-sets', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB required' });
    }
    const { name, month, year, monthName, totalQuestions, subjectDistribution } = req.body;

    // Get top N questions per subject based on distribution
    const flashcardIds = [];
    const dist = subjectDistribution || {
      'APT': 10, 'DS': 6, 'DBMS': 6, 'OS': 6, 'CN': 5, 'CO': 5, 'TOC': 4, 'CD': 4, 'AL': 4
    };

    for (const [subject, count] of Object.entries(dist)) {
      const cards = await Flashcard.find({ subject }).sort('-importanceScore').limit(count);
      flashcardIds.push(...cards.map(c => c._id));
    }

    const set = await MonthlySet.create({
      name,
      month,
      year,
      monthName,
      totalQuestions: flashcardIds.length,
      flashcardIds,
      subjectDistribution: dist,
    });

    res.status(201).json({ success: true, data: set });
  } catch (e) { next(e); }
});

// POST publish monthly set
router.post('/monthly-sets/:id/publish', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB required' });
    }
    const set = await MonthlySet.findByIdAndUpdate(
      req.params.id,
      { isPublished: true, publishedAt: new Date(), publishedBy: req.admin._id },
      { new: true }
    );
    if (!set) return res.status(404).json({ success: false, message: 'Set not found' });
    res.json({ success: true, data: set });
  } catch (e) { next(e); }
});

// DELETE monthly set
router.delete('/monthly-sets/:id', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB required' });
    }
    await MonthlySet.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Set deleted' });
  } catch (e) { next(e); }
});

module.exports = router;