const router = require('express').Router();
const mongoose = require('mongoose');
const { adminProtect, requirePermission } = require('../middleware/adminAuth');
const {
  getLocalMockTests, getLocalMockTestById, getLocalMockQuestionsByIds,
  saveLocalMockTest, updateLocalMockTest, deleteLocalMockTest,
  saveLocalMockQuestion, updateLocalMockQuestion, deleteLocalMockQuestion,
  getLocalMockQuestionsAll,
} = require('../store/localDataStore');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function getModels() {
  const MockTest = mongoose.model('MockTest');
  const MockTestQuestion = mongoose.model('MockTestQuestion');
  return { MockTest, MockTestQuestion };
}

// GET /api/admin/mock-tests
router.get('/mock-tests', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    const { subject, testType, difficulty, isActive } = req.query;

    if (isMongoConnected()) {
      const { MockTest } = await getModels();
      const filter = {};
      if (subject) filter.subject = subject;
      if (testType) filter.testType = testType;
      if (difficulty) filter.difficulty = difficulty;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      const tests = await MockTest.find(filter).populate('questionIds').sort({ subject: 1, testNumber: 1 });
      return res.json({ success: true, count: tests.length, data: tests });
    }

    let list = getLocalMockTests({ subject, testType, difficulty });
    if (isActive !== undefined) list = list.filter(t => t.isActive === (isActive === 'true'));
    return res.json({ success: true, count: list.length, data: list });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/mock-tests
router.post('/mock-tests', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    const { subject, subjectName, testType, topic, title, description, duration, totalMarks, questionCount, difficulty, topics } = req.body;
    if (!subject || !title) {
      return res.status(400).json({ success: false, message: 'Subject and title are required.' });
    }

    if (isMongoConnected()) {
      const { MockTest } = await getModels();
      const last = await MockTest.findOne({ subject }).sort('-testNumber');
      const test = await MockTest.create({
        subject, subjectName: subjectName || '', testType: testType || 'subject',
        topic: topic || '', title, description: description || '',
        duration: duration || 30, totalMarks: totalMarks || 25,
        questionCount: questionCount || 10, difficulty: difficulty || 'medium',
        topics: topics || [], testNumber: (last?.testNumber || 0) + 1,
      });
      return res.status(201).json({ success: true, data: test });
    }

    const test = saveLocalMockTest({
      subject, subjectName: subjectName || '', testType: testType || 'subject',
      topic: topic || '', title, description: description || '',
      duration: duration || 30, totalMarks: totalMarks || 25,
      questionCount: questionCount || 10, difficulty: difficulty || 'medium',
      topics: topics || [],
    });
    res.status(201).json({ success: true, data: test });
  } catch (e) {
    next(e);
  }
});

// PUT /api/admin/mock-tests/:id
router.put('/mock-tests/:id', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    const { title, description, duration, totalMarks, questionCount, difficulty, topics, subject, subjectName, testType, topic: testTopic } = req.body;

    if (isMongoConnected()) {
      const { MockTest } = await getModels();
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (duration !== undefined) updates.duration = duration;
      if (totalMarks !== undefined) updates.totalMarks = totalMarks;
      if (questionCount !== undefined) updates.questionCount = questionCount;
      if (difficulty !== undefined) updates.difficulty = difficulty;
      if (topics !== undefined) updates.topics = topics;
      if (subject !== undefined) updates.subject = subject;
      if (subjectName !== undefined) updates.subjectName = subjectName;
      if (testType !== undefined) updates.testType = testType;
      if (testTopic !== undefined) updates.topic = testTopic;
      const test = await MockTest.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      if (!test) return res.status(404).json({ success: false, message: 'Mock test not found.' });
      return res.json({ success: true, data: test });
    }

    const test = updateLocalMockTest(req.params.id, {
      title, description, duration, totalMarks, questionCount, difficulty,
      topics, subject, subjectName, testType, topic: testTopic,
    });
    if (!test) return res.status(404).json({ success: false, message: 'Mock test not found.' });
    res.json({ success: true, data: test });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/admin/mock-tests/:id
router.delete('/mock-tests/:id', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const { MockTest } = await getModels();
      const test = await MockTest.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      if (!test) return res.status(404).json({ success: false, message: 'Mock test not found.' });
      return res.json({ success: true, message: 'Mock test deactivated.' });
    }

    const ok = deleteLocalMockTest(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Mock test not found.' });
    res.json({ success: true, message: 'Mock test deactivated.' });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/admin/mock-tests/:id/toggle
router.patch('/mock-tests/:id/toggle', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: 'isActive is required.' });
    }

    if (isMongoConnected()) {
      const { MockTest } = await getModels();
      const test = await MockTest.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
      if (!test) return res.status(404).json({ success: false, message: 'Mock test not found.' });
      return res.json({ success: true, data: test });
    }

    const test = updateLocalMockTest(req.params.id, { isActive });
    if (!test) return res.status(404).json({ success: false, message: 'Mock test not found.' });
    res.json({ success: true, data: test });
  } catch (e) {
    next(e);
  }
});

// ─── Mock Questions ─────────────────────────────────────────

// GET /api/admin/mock-questions
router.get('/mock-questions', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    const { subject, topic, difficulty, testId } = req.query;

    if (isMongoConnected()) {
      const { MockTestQuestion } = await getModels();
      const filter = {};
      if (subject) filter.subject = subject;
      if (topic) filter.topic = topic;
      if (difficulty) filter.difficulty = difficulty;
      let questions = await MockTestQuestion.find(filter).sort({ subject: 1, topic: 1 });
      if (testId) {
        const { MockTest } = await getModels();
        const test = await MockTest.findById(testId);
        if (test && test.questionIds?.length) {
          const qIdSet = new Set(test.questionIds.map(id => id.toString()));
          questions = questions.filter(q => qIdSet.has(q._id.toString()));
        }
      }
      return res.json({ success: true, count: questions.length, data: questions });
    }

    let questions = getLocalMockQuestionsAll({ subject, topic, difficulty });
    if (testId) {
      const test = getLocalMockTestById(testId);
      if (test && test.questionIds?.length) {
        const qIdSet = new Set(test.questionIds);
        questions = questions.filter(q => qIdSet.has(q._id));
      }
    }
    res.json({ success: true, count: questions.length, data: questions });
  } catch (e) {
    next(e);
  }
});

// GET /api/admin/mock-tests/:id/questions
router.get('/mock-tests/:id/questions', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const { MockTest, MockTestQuestion } = await getModels();
      const test = await MockTest.findById(req.params.id).populate('questionIds');
      if (!test) return res.status(404).json({ success: false, message: 'Mock test not found.' });
      return res.json({ success: true, data: { test: { _id: test._id, title: test.title, subject: test.subject, subjectName: test.subjectName, testType: test.testType, difficulty: test.difficulty }, questions: test.questionIds || [] } });
    }

    const test = getLocalMockTestById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Mock test not found.' });
    const questions = getLocalMockQuestionsByIds(test.questionIds || []);
    res.json({ success: true, data: { test: { _id: test._id, title: test.title, subject: test.subject, subjectName: test.subjectName, testType: test.testType, difficulty: test.difficulty }, questions } });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/mock-questions
router.post('/mock-questions', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    const { subject, topic, difficulty, questionText, options, correctAnswer, explanation, marks } = req.body;
    if (!subject || !questionText || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Subject, questionText, and at least 2 options are required.' });
    }

    if (isMongoConnected()) {
      const { MockTestQuestion } = await getModels();
      const q = await MockTestQuestion.create({
        subject, topic: topic || '', difficulty: difficulty || 'medium',
        questionText, options, correctAnswer: correctAnswer ?? 0,
        explanation: explanation || '', marks: marks || 1,
      });
      return res.status(201).json({ success: true, data: q });
    }

    const q = saveLocalMockQuestion({
      subject, topic: topic || '', difficulty: difficulty || 'medium',
      questionText, options, correctAnswer: correctAnswer ?? 0,
      explanation: explanation || '', marks: marks || 1,
    });
    res.status(201).json({ success: true, data: q });
  } catch (e) {
    next(e);
  }
});

// PUT /api/admin/mock-questions/:id
router.put('/mock-questions/:id', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    const { subject, topic, difficulty, questionText, options, correctAnswer, explanation, marks } = req.body;

    if (isMongoConnected()) {
      const { MockTestQuestion } = await getModels();
      const updates = {};
      if (subject !== undefined) updates.subject = subject;
      if (topic !== undefined) updates.topic = topic;
      if (difficulty !== undefined) updates.difficulty = difficulty;
      if (questionText !== undefined) updates.questionText = questionText;
      if (options !== undefined) updates.options = options;
      if (correctAnswer !== undefined) updates.correctAnswer = correctAnswer;
      if (explanation !== undefined) updates.explanation = explanation;
      if (marks !== undefined) updates.marks = marks;
      const q = await MockTestQuestion.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      if (!q) return res.status(404).json({ success: false, message: 'Question not found.' });
      return res.json({ success: true, data: q });
    }

    const q = updateLocalMockQuestion(req.params.id, { subject, topic, difficulty, questionText, options, correctAnswer, explanation, marks });
    if (!q) return res.status(404).json({ success: false, message: 'Question not found.' });
    res.json({ success: true, data: q });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/admin/mock-questions/:id
router.delete('/mock-questions/:id', adminProtect, requirePermission('mocks.manage'), async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const { MockTestQuestion } = await getModels();
      const q = await MockTestQuestion.findByIdAndDelete(req.params.id);
      if (!q) return res.status(404).json({ success: false, message: 'Question not found.' });
      return res.json({ success: true, message: 'Question deleted.' });
    }

    const ok = deleteLocalMockQuestion(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Question not found.' });
    res.json({ success: true, message: 'Question deleted.' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
