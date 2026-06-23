const router = require('express').Router();
const { adminProtect, requirePermission } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');
const { MockTestQuestion } = require('../models/MockTest');
const { getLocalMockQuestionsAll, saveLocalMockQuestion, updateLocalMockQuestion, deleteLocalMockQuestion } = require('../store/localDataStore');

async function requireMongo(req, res, next) {
  if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'MongoDB required' });
  next();
}

// Local fallback for GET / — list questions
function localGetQuestions(params = {}) {
  let list = getLocalMockQuestionsAll({ subject: params.subject, difficulty: params.difficulty, topic: params.topic });
  if (params.search) {
    const s = params.search.toLowerCase();
    list = list.filter(q =>
      q.questionText?.toLowerCase().includes(s) ||
      q.topic?.toLowerCase().includes(s) ||
      q.subject?.toLowerCase().includes(s)
    );
  }
  const total = list.length;
  const sort = params.sort || '-createdAt';
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 50;
  list = list.slice((page - 1) * limit, page * limit);
  return { data: list, total, page, totalPages: Math.ceil(total / limit) };
}

function localGetStats() {
  const list = getLocalMockQuestionsAll();
  const byDifficulty = [{ _id: 'easy', count: list.filter(q => q.difficulty === 'easy').length }, { _id: 'medium', count: list.filter(q => q.difficulty === 'medium').length }, { _id: 'hard', count: list.filter(q => q.difficulty === 'hard').length }];
  const byQuestionType = [{ _id: 'MCQ', count: list.filter(q => q.questionType === 'MCQ').length }, { _id: 'MSQ', count: list.filter(q => q.questionType === 'MSQ').length }, { _id: 'NAT', count: list.filter(q => q.questionType === 'NAT').length }];
  const subjectMap = {};
  list.forEach(q => {
    if (!subjectMap[q.subject]) subjectMap[q.subject] = { _id: q.subject, count: 0, easy: 0, medium: 0, hard: 0 };
    subjectMap[q.subject].count++;
    if (q.difficulty === 'easy') subjectMap[q.subject].easy++;
    else if (q.difficulty === 'medium') subjectMap[q.subject].medium++;
    else if (q.difficulty === 'hard') subjectMap[q.subject].hard++;
  });
  const topicMap = {};
  list.forEach(q => { if (q.topic) topicMap[q.topic] = (topicMap[q.topic] || 0) + 1; });
  const topics = Object.entries(topicMap).map(([k, v]) => ({ _id: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 50);
  return { total: list.length, bySubject: Object.values(subjectMap).sort((a, b) => b.count - a.count), byDifficulty, byQuestionType, topics };
}

function localGetGrouped(params = {}) {
  const list = getLocalMockQuestionsAll({ subject: params.subject, difficulty: params.difficulty, topic: params.topic });
  const subjectMap = {};
  list.forEach(q => {
    if (!subjectMap[q.subject]) subjectMap[q.subject] = { _id: q.subject, count: 0, easy: 0, medium: 0, hard: 0, mcq: 0, msq: 0, nat: 0 };
    subjectMap[q.subject].count++;
    if (q.difficulty === 'easy') subjectMap[q.subject].easy++;
    else if (q.difficulty === 'medium') subjectMap[q.subject].medium++;
    else if (q.difficulty === 'hard') subjectMap[q.subject].hard++;
    if (q.questionType === 'MCQ') subjectMap[q.subject].mcq++;
    else if (q.questionType === 'MSQ') subjectMap[q.subject].msq++;
    else if (q.questionType === 'NAT') subjectMap[q.subject].nat++;
  });
  const groups = Object.values(subjectMap).sort((a, b) => b.count - a.count);
  return { data: groups, total: groups.reduce((s, g) => s + g.count, 0) };
}

// GET / — list questions with pagination, search, advanced filter, sort
router.get('/', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const { page = 1, limit = 50, search, subject, difficulty, topic, questionType, marks, sort = '-createdAt' } = req.query;
      const filter = { isActive: { $ne: false } };
      if (search) filter.$or = [{ questionText: { $regex: search, $options: 'i' } }, { topic: { $regex: search, $options: 'i' } }, { subject: { $regex: search, $options: 'i' } }];
      if (subject) filter.subject = subject;
      if (difficulty) filter.difficulty = difficulty;
      if (topic) filter.topic = { $regex: topic, $options: 'i' };
      if (questionType) filter.questionType = questionType;
      if (marks) filter.marks = parseInt(marks);
      const total = await MockTestQuestion.countDocuments(filter);
      const questions = await MockTestQuestion.find(filter).sort(sort).skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)).lean();
      return res.json({ success: true, data: questions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    }
    const result = localGetQuestions(req.query);
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
});

// GET /stats — question bank statistics
router.get('/stats', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const active = { isActive: { $ne: false } };
      const total = await MockTestQuestion.countDocuments(active);
      const byDifficulty = await MockTestQuestion.aggregate([{ $match: active }, { $group: { _id: '$difficulty', count: { $sum: 1 } } }]);
      const byQuestionType = await MockTestQuestion.aggregate([{ $match: active }, { $group: { _id: '$questionType', count: { $sum: 1 } } }]);
      const bySubject = await MockTestQuestion.aggregate([{ $match: active }, { $group: { _id: '$subject', count: { $sum: 1 }, easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } }, medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } }, hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } } } }, { $sort: { count: -1 } }]);
      const topics = await MockTestQuestion.aggregate([{ $match: active }, { $group: { _id: '$topic', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
      return res.json({ success: true, data: { total, bySubject, byDifficulty, byQuestionType, topics } });
    }
    res.json({ success: true, data: localGetStats() });
  } catch (e) { next(e); }
});

// GET /grouped — questions grouped by subject
router.get('/grouped', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const { subject, difficulty, topic, questionType, marks, search, sort = '-createdAt' } = req.query;
      const filter = { isActive: { $ne: false } };
      if (subject) filter.subject = subject;
      if (difficulty) filter.difficulty = difficulty;
      if (topic) filter.topic = { $regex: topic, $options: 'i' };
      if (questionType) filter.questionType = questionType;
      if (marks) filter.marks = parseInt(marks);
      if (search) filter.$or = [{ questionText: { $regex: search, $options: 'i' } }, { topic: { $regex: search, $options: 'i' } }, { subject: { $regex: search, $options: 'i' } }];
      const groups = await MockTestQuestion.aggregate([{ $match: filter }, { $group: { _id: '$subject', count: { $sum: 1 }, easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } }, medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } }, hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } }, mcq: { $sum: { $cond: [{ $eq: ['$questionType', 'MCQ'] }, 1, 0] } }, msq: { $sum: { $cond: [{ $eq: ['$questionType', 'MSQ'] }, 1, 0] } }, nat: { $sum: { $cond: [{ $eq: ['$questionType', 'NAT'] }, 1, 0] } } } }, { $sort: { count: -1 } }]);
      return res.json({ success: true, data: groups, total: groups.reduce((s, g) => s + g.count, 0) });
    }
    res.json({ success: true, ...localGetGrouped(req.query) });
  } catch (e) { next(e); }
});

// GET /duplicates — detect duplicate questions by text
router.get('/duplicates', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const duplicates = await MockTestQuestion.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $group: { _id: { $toLower: '$questionText' }, ids: { $push: '$_id' }, count: { $sum: 1 }, subjects: { $addToSet: '$subject' } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);
    res.json({ success: true, data: duplicates });
  } catch (e) { next(e); }
});

// POST / — create single question
router.post('/', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    const { subject, topic, difficulty, questionType, questionText, options, correctAnswer, explanation, marks } = req.body;
    if (!subject || !topic || !questionText || !options || correctAnswer === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields: subject, topic, questionText, options, correctAnswer' });
    }
    if (isMongoConnected()) {
      const q = await MockTestQuestion.create({ subject, topic, difficulty, questionType: questionType || 'MCQ', questionText, options, correctAnswer, explanation, marks });
      return res.status(201).json({ success: true, data: q });
    }
    const q = saveLocalMockQuestion({ subject, topic, difficulty, questionType: questionType || 'MCQ', questionText, options, correctAnswer, explanation, marks });
    res.status(201).json({ success: true, data: q });
  } catch (e) { next(e); }
});

// PUT /:id — update question
router.put('/:id', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const q = await MockTestQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
      return res.json({ success: true, data: q });
    }
    const q = updateLocalMockQuestion(req.params.id, req.body);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: q });
  } catch (e) { next(e); }
});

// DELETE /:id — soft delete question
router.delete('/:id', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const q = await MockTestQuestion.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
      return res.json({ success: true, message: 'Question deleted' });
    }
    const q = deleteLocalMockQuestion(req.params.id);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question deleted' });
  } catch (e) { next(e); }
});

// POST /bulk/delete — bulk soft delete
router.post('/bulk/delete', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'ids array required' });
    const result = await MockTestQuestion.updateMany({ _id: { $in: ids } }, { isActive: false });
    res.json({ success: true, deleted: result.modifiedCount });
  } catch (e) { next(e); }
});

// POST /bulk/subject — bulk change subject
router.post('/bulk/subject', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const { ids, subject } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !subject) return res.status(400).json({ success: false, message: 'ids array and subject required' });
    const result = await MockTestQuestion.updateMany({ _id: { $in: ids } }, { subject });
    res.json({ success: true, updated: result.modifiedCount });
  } catch (e) { next(e); }
});

// POST /bulk/difficulty — bulk change difficulty
router.post('/bulk/difficulty', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const { ids, difficulty } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !difficulty) return res.status(400).json({ success: false, message: 'ids array and difficulty required' });
    const result = await MockTestQuestion.updateMany({ _id: { $in: ids } }, { difficulty });
    res.json({ success: true, updated: result.modifiedCount });
  } catch (e) { next(e); }
});

// POST /import/json — bulk import from JSON
router.post('/import/json', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) return res.status(400).json({ success: false, message: 'questions array required' });
    if (isMongoConnected()) {
      const valid = questions.filter(q => q.subject && q.questionText && Array.isArray(q.options) && q.options.length >= 2);
      const result = await MockTestQuestion.insertMany(valid.map(q => ({ ...q, questionType: q.questionType || 'MCQ' })), { ordered: false });
      return res.status(201).json({ success: true, data: { imported: result.length, failed: questions.length - result.length } });
    }
    const valid = questions.filter(q => q.subject && q.questionText && Array.isArray(q.options) && q.options.length >= 2);
    valid.forEach(q => saveLocalMockQuestion({ ...q, questionType: q.questionType || 'MCQ' }));
    res.status(201).json({ success: true, data: { imported: valid.length, failed: questions.length - valid.length } });
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
      questionType: q.questiontype || 'MCQ',
      questionText: q.questiontext, options: q.options, correctAnswer: parseInt(q.correctanswer) || 0,
      explanation: q.explanation || '', marks: parseInt(q.marks) || 1,
    }));
    const result = await MockTestQuestion.insertMany(mapped, { ordered: false });
    res.status(201).json({ success: true, data: { imported: result.length, failed: questions.length - result.length, errors: [] } });
  } catch (e) { next(e); }
});

module.exports = router;
