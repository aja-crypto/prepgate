const router = require('express').Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { adminProtect, requirePermission } = require('../middleware/adminAuth');
const { extractTextFromPdf } = require('../services/ocrService');
const { parseQuestions } = require('../services/questionParser');
const { isCloudinaryConfigured, uploadPdf: cloudinaryUpload } = require('../config/cloudinary');

const pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function requireMongo(req, res, next) {
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, message: 'MongoDB required for PYQ management. Start the server with a MongoDB connection.' });
  }
  next();
}

// GET /api/admin/pyq
router.get('/pyq', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const PYQ = mongoose.model('PYQ');
    const { subject, topic, year, difficulty, questionType, isActive, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (year) filter.year = parseInt(year, 10);
    if (difficulty) filter.difficulty = difficulty;
    if (questionType) filter.questionType = questionType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [data, total] = await Promise.all([
      PYQ.find(filter).populate('subject', 'name code').populate('topic', 'name').sort({ year: -1, subject: 1 }).skip(skip).limit(parseInt(limit, 10)),
      PYQ.countDocuments(filter),
    ]);

    res.json({ success: true, count: data.length, total, page: parseInt(page, 10), pages: Math.ceil(total / parseInt(limit, 10)), data });
  } catch (e) {
    next(e);
  }
});

// GET /api/admin/pyq/stats
router.get('/pyq/stats', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const PYQ = mongoose.model('PYQ');
    const [
      totalCount, activeCount, bySubject, byYear, byDifficulty, byType,
    ] = await Promise.all([
      PYQ.countDocuments({}),
      PYQ.countDocuments({ isActive: true }),
      PYQ.aggregate([{ $group: { _id: '$subject', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      PYQ.aggregate([{ $group: { _id: '$year', count: { $sum: 1 } } }, { $sort: { _id: -1 } }]),
      PYQ.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
      PYQ.aggregate([{ $group: { _id: '$questionType', count: { $sum: 1 } } }]),
    ]);

    res.json({ success: true, data: { totalCount, activeCount, bySubject, byYear, byDifficulty, byType } });
  } catch (e) {
    next(e);
  }
});

// GET /api/admin/pyq/:id
router.get('/pyq/:id', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const PYQ = mongoose.model('PYQ');
    const pyq = await PYQ.findById(req.params.id).populate('subject', 'name code').populate('topic', 'name');
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found.' });
    res.json({ success: true, data: pyq });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/pyq
router.post('/pyq', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const PYQ = mongoose.model('PYQ');
    const { title, subject, topic, year, difficulty, marks, questionType, questionText, options, correctAnswer, explanation, tags, source, paperSet } = req.body;

    if (!title || !subject || !year || !questionText) {
      return res.status(400).json({ success: false, message: 'Title, subject, year, and questionText are required.' });
    }

    const pyq = await PYQ.create({
      title, subject, topic: topic || undefined, year, difficulty: difficulty || 'medium',
      marks: marks || 2, questionType: questionType || 'MCQ', questionText,
      options: options || [], correctAnswer, explanation: explanation || '',
      tags: tags || [], source: source || 'GATE Official', paperSet: paperSet || '',
    });

    res.status(201).json({ success: true, data: pyq });
  } catch (e) {
    next(e);
  }
});

// PUT /api/admin/pyq/:id
router.put('/pyq/:id', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const PYQ = mongoose.model('PYQ');
    const { title, subject, topic, year, difficulty, marks, questionType, questionText, options, correctAnswer, explanation, tags, source, paperSet } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (subject !== undefined) updates.subject = subject;
    if (topic !== undefined) updates.topic = topic || null;
    if (year !== undefined) updates.year = year;
    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (marks !== undefined) updates.marks = marks;
    if (questionType !== undefined) updates.questionType = questionType;
    if (questionText !== undefined) updates.questionText = questionText;
    if (options !== undefined) updates.options = options;
    if (correctAnswer !== undefined) updates.correctAnswer = correctAnswer;
    if (explanation !== undefined) updates.explanation = explanation;
    if (tags !== undefined) updates.tags = tags;
    if (source !== undefined) updates.source = source;
    if (paperSet !== undefined) updates.paperSet = paperSet;

    const pyq = await PYQ.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found.' });
    res.json({ success: true, data: pyq });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/admin/pyq/:id (soft delete)
router.delete('/pyq/:id', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const PYQ = mongoose.model('PYQ');
    const pyq = await PYQ.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found.' });
    res.json({ success: true, message: 'PYQ deactivated.' });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/admin/pyq/:id/toggle
router.patch('/pyq/:id/toggle', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const PYQ = mongoose.model('PYQ');
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: 'isActive is required.' });
    }
    const pyq = await PYQ.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found.' });
    res.json({ success: true, data: pyq });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/pyq/import
router.post('/pyq/import', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const PYQ = mongoose.model('PYQ');
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'questions array is required with at least 1 item.' });
    }

    if (questions.length > 500) {
      return res.status(400).json({ success: false, message: 'Maximum 500 questions per import.' });
    }

    // Prepare bulk insert operations
    const docs = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.title || !q.subject || !q.year || !q.questionText) {
        errors.push({ index: i, message: 'Missing required fields (title, subject, year, questionText)' });
        continue;
      }
      docs.push({
        title: q.title, subject: q.subject, topic: q.topic || undefined,
        year: q.year, difficulty: q.difficulty || 'medium', marks: q.marks || 2,
        questionType: q.questionType || 'MCQ', questionText: q.questionText,
        options: q.options || [], correctAnswer: q.correctAnswer,
        explanation: q.explanation || '', tags: q.tags || [],
        source: q.source || 'GATE Official', paperSet: q.paperSet || '',
      });
    }

    let created = 0;
    if (docs.length) {
      try {
        const result = await PYQ.insertMany(docs, { ordered: false });
        created = result.length;
      } catch (e) {
        // If some failed, try individual inserts to get more details
        for (let i = 0; i < docs.length; i++) {
          try {
            await PYQ.create(docs[i]);
            created++;
          } catch (e) {
            errors.push({ index: i, message: e.message });
          }
        }
      }
    }

    res.status(201).json({ success: true, created, total: questions.length, errors: errors.length ? errors : undefined });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/pyq/upload-pdf — OCR pipeline: upload PDF → extract questions
router.post('/pyq/upload-pdf', adminProtect, requirePermission('mocks.manage'), pdfUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
    }

    const { subjectCode, year } = req.body;
    if (!subjectCode) {
      return res.status(400).json({ success: false, message: 'subjectCode is required.' });
    }

    let pdfUrl = '';

    // Upload to Cloudinary for OCR access (if configured)
    if (isCloudinaryConfigured()) {
      const result = await cloudinaryUpload(req.file.buffer, req.file.originalname, 'GateApex/ocr_temp');
      pdfUrl = result.secure_url;
    }

    // Extract text via OCR
    const ocrPages = await extractTextFromPdf(pdfUrl || req.file.buffer.toString('base64'));

    if (!ocrPages || ocrPages.length === 0) {
      return res.status(500).json({ success: false, message: 'OCR returned no content.' });
    }

    // Parse into structured questions
    const questions = parseQuestions(ocrPages, {
      subjectCode,
      year: parseInt(year, 10) || new Date().getFullYear(),
    });

    res.json({
      success: true,
      data: {
        pages: ocrPages.length,
        questions,
        stats: {
          total: questions.length,
          mcq: questions.filter(q => q.questionType === 'MCQ').length,
          msq: questions.filter(q => q.questionType === 'MSQ').length,
          nat: questions.filter(q => q.questionType === 'NAT').length,
        },
      },
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/pyq/save-extracted — batch save verified questions
router.post('/pyq/save-extracted', adminProtect, requirePermission('mocks.manage'), requireMongo, async (req, res, next) => {
  try {
    const PYQ = mongoose.model('PYQ');
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'questions array is required.' });
    }

    if (questions.length > 200) {
      return res.status(400).json({ success: false, message: 'Maximum 200 questions per batch.' });
    }

    const docs = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText) {
        errors.push({ index: i, message: 'Missing questionText' });
        continue;
      }
      docs.push({
        title: q.title || `Q${i + 1}`,
        subject: q.subject,
        topic: q.topic || undefined,
        year: q.year || new Date().getFullYear(),
        difficulty: q.difficulty || 'medium',
        marks: q.marks || 2,
        questionType: q.questionType || 'MCQ',
        questionText: q.questionText,
        options: q.options || [],
        correctAnswer: q.correctAnswer || undefined,
        explanation: q.explanation || '',
        tags: q.tags || [],
        source: q.source || 'GATE Official',
        paperSet: q.paperSet || '',
      });
    }

    let created = 0;
    if (docs.length) {
      try {
        const result = await PYQ.insertMany(docs, { ordered: false });
        created = result.length;
      } catch (e) {
        for (let i = 0; i < docs.length; i++) {
          try {
            await PYQ.create(docs[i]);
            created++;
          } catch (e) {
            errors.push({ index: i, message: e.message });
          }
        }
      }
    }

    res.status(201).json({ success: true, created, total: questions.length, errors: errors.length ? errors : undefined });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

