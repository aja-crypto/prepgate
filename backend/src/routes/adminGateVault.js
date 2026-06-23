const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { adminProtect, requirePermission } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');
const { Flashcard, MonthlySet } = require('../models/GateVault');
const { getLocalFlashcards, saveLocalFlashcard, updateLocalFlashcard, deleteLocalFlashcard, bulkSaveLocalFlashcards } = require('../store/localDataStore');

// GET all flashcards with pagination, search, filter
router.get('/flashcards', adminProtect, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const { page = 1, limit = 50, subject, difficulty, search } = req.query;
      const filter = {};
      if (subject) filter.subject = subject;
      if (difficulty) filter.difficulty = difficulty;
      if (search) filter.question = { $regex: search, $options: 'i' };

      const total = await Flashcard.countDocuments(filter);
      const cards = await Flashcard.find(filter)
        .sort('-importanceScore -createdAt')
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
      return res.json({ success: true, count: cards.length, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), data: cards });
    }
    const cards = getLocalFlashcards(req.query);
    res.json({ success: true, count: cards.length, total: cards.length, page: 1, totalPages: 1, data: cards });
  } catch (e) { next(e); }
});

// POST create flashcard
router.post('/flashcards', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    const { question, options, correctAnswer, explanation, subject, topic, importanceScore, difficulty } = req.body;

    if (!question || !options || correctAnswer === undefined || !subject) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (isMongoConnected()) {
      const card = await Flashcard.create({
        question, options, correctAnswer, explanation, subject, topic,
        importanceScore: importanceScore || 5,
        difficulty: difficulty || 'medium',
      });
      return res.status(201).json({ success: true, data: card });
    }

    let cardCorrectAnswer = correctAnswer;
    if (typeof cardCorrectAnswer === 'string' && /^[A-D]$/i.test(cardCorrectAnswer.trim())) {
      cardCorrectAnswer = cardCorrectAnswer.toUpperCase().charCodeAt(0) - 65;
    }
    const card = saveLocalFlashcard({ question, options, correctAnswer: cardCorrectAnswer, explanation, subject, topic, importanceScore: importanceScore || 5, difficulty: difficulty || 'medium' });
    res.status(201).json({ success: true, data: card });
  } catch (e) { next(e); }
});

// PUT update flashcard
router.put('/flashcards/:id', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const card = await Flashcard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
      return res.json({ success: true, data: card });
    }
    const card = updateLocalFlashcard(req.params.id, req.body);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, data: card });
  } catch (e) { next(e); }
});

// DELETE flashcard
router.delete('/flashcards/:id', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      await Flashcard.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Card deleted' });
    }
    deleteLocalFlashcard(req.params.id);
    res.json({ success: true, message: 'Card deleted' });
  } catch (e) { next(e); }
});

// POST /upload — smart upload with file + auto-detected metadata
const multer = require('multer');
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'gatevault');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', adminProtect, requirePermission('content.manage'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { subject, topic, category, fileName } = req.body;
    const cardData = {
      question: fileName || req.file.originalname,
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      subject: subject || 'APT',
      topic: topic || '',
      importanceScore: 5,
      difficulty: 'medium',
      category: category || '',
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
      fileUrl: `/uploads/gatevault/${req.file.filename}`,
      fileSize: req.file.size,
    };

    if (isMongoConnected()) {
      const card = await Flashcard.create(cardData);
      return res.status(201).json({ success: true, data: card });
    }

    const card = saveLocalFlashcard(cardData);
    res.status(201).json({ success: true, data: card });
  } catch (e) { next(e); }
});

// POST bulk import flashcards
router.post('/flashcards/bulk', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    const { cards, questions } = req.body;
    const items = Array.isArray(cards) ? cards : Array.isArray(questions) ? questions : [];
    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'No cards provided' });
    }

    if (isMongoConnected()) {
      const created = await Flashcard.insertMany(items.map(c => {
        let correctAnswer = c.correctAnswer;
        if (typeof correctAnswer === 'string' && /^[A-D]$/i.test(correctAnswer.trim())) {
          correctAnswer = correctAnswer.toUpperCase().charCodeAt(0) - 65;
        }
        if (typeof correctAnswer === 'string') correctAnswer = Number(correctAnswer);
        return {
          question: c.question,
          options: c.options,
          correctAnswer,
          explanation: c.explanation || '',
          subject: c.subject,
          topic: c.topic || '',
          importanceScore: c.importanceScore || 5,
          difficulty: c.difficulty || 'medium',
        };
      }));
      return res.status(201).json({ success: true, count: created.length, data: created });
    }

    const created = bulkSaveLocalFlashcards(items.map(c => {
      let correctAnswer = c.correctAnswer;
      if (typeof correctAnswer === 'string' && /^[A-D]$/i.test(correctAnswer.trim())) {
        correctAnswer = correctAnswer.toUpperCase().charCodeAt(0) - 65;
      }
      return { ...c, correctAnswer };
    }));
    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (e) { next(e); }
});

// GET all monthly sets
router.get('/monthly-sets', adminProtect, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const sets = await MonthlySet.find().sort('-year -month').populate('publishedBy', 'name email');
      return res.json({ success: true, count: sets.length, data: sets });
    }
    res.json({ success: true, count: 0, data: [] });
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