const router = require('express').Router();
const { adminProtect, requirePermission } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');
const { MockTestQuestion } = require('../models/MockTest');

async function requireMongo(req, res, next) {
  if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'MongoDB required' });
  next();
}

// GET / — list questions with pagination, search, filter
router.get('/', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, subject, difficulty, topic } = req.query;
    const filter = { isActive: { $ne: false } };
    if (search) filter.questionText = { $regex: search, $options: 'i' };
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (topic) filter.topic = { $regex: topic, $options: 'i' };

    const total = await MockTestQuestion.countDocuments(filter);
    const questions = await MockTestQuestion.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, data: questions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { next(e); }
});

// GET /stats — question bank statistics
router.get('/stats', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const total = await MockTestQuestion.countDocuments({ isActive: { $ne: false } });
    const bySubject = await MockTestQuestion.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byDifficulty = await MockTestQuestion.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: { total, bySubject, byDifficulty } });
  } catch (e) { next(e); }
});

// POST / — create single question
router.post('/', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const { subject, topic, difficulty, questionText, options, correctAnswer, explanation, marks } = req.body;
    if (!subject || !topic || !questionText || !options || correctAnswer === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields: subject, topic, questionText, options, correctAnswer' });
    }
    const q = await MockTestQuestion.create({ subject, topic, difficulty, questionText, options, correctAnswer, explanation, marks });
    res.status(201).json({ success: true, data: q });
  } catch (e) { next(e); }
});

// PUT /:id — update question
router.put('/:id', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const q = await MockTestQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: q });
  } catch (e) { next(e); }
});

// DELETE /:id — soft delete question
router.delete('/:id', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const q = await MockTestQuestion.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question deleted' });
  } catch (e) { next(e); }
});

// POST /import/json — bulk import from JSON
router.post('/import/json', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'questions array required' });
    }
    const valid = questions.filter(q => q.subject && q.questionText && Array.isArray(q.options) && q.options.length >= 2);
    const result = await MockTestQuestion.insertMany(valid, { ordered: false });
    res.status(201).json({ success: true, data: { imported: result.length, failed: questions.length - result.length } });
  } catch (e) { next(e); }
});

// POST /import/csv — bulk import from CSV text
router.post('/import/csv', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ success: false, message: 'csv field required' });
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return res.status(400).json({ success: false, message: 'CSV must have header + 1 data row' });
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const questions = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const q = {};
      headers.forEach((h, i) => {
        if (h === 'options') q[h] = vals[i]?.split('|') || [];
        else if (h === 'marks' || h === 'correctanswer') q[h] = parseInt(vals[i]) || 0;
        else q[h] = vals[i] || '';
      });
      return q;
    }).filter(q => q.subject && q.questiontext && Array.isArray(q.options) && q.options.length >= 2);
    const mapped = questions.map(q => ({
      subject: q.subject, topic: q.topic || '', difficulty: q.difficulty || 'medium',
      questionText: q.questiontext, options: q.options, correctAnswer: parseInt(q.correctanswer) || 0,
      explanation: q.explanation || '', marks: parseInt(q.marks) || 1,
    }));
    const result = await MockTestQuestion.insertMany(mapped, { ordered: false });
    res.status(201).json({ success: true, data: { imported: result.length, failed: questions.length - result.length, errors: [] } });
  } catch (e) { next(e); }
});

module.exports = router;
