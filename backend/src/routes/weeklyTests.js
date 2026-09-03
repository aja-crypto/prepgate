const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { sanitizeFilename, createFileFilter } = require('../utils/uploadValidator');
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const MediaFile = require('../models/MediaFile');
const { WeeklyTest, UserTestProgress } = require('../models/WeeklyTest');
const {
  getLocalWeeklyTests,
  getLocalWeeklyTestById,
  saveLocalWeeklyTest,
  getLocalWeeklyTestProgress,
  saveLocalWeeklyTestProgress,
  getAllLocalWeeklyTestProgress,
  getLocalWeeklyTestSubjectCounts,
  seedLocalWeeklyTests,
  updateLocalWeeklyTestPdfUrl,
} = require('../store/localDataStore');

const WEEKLY_TESTS_SEED = require('../data/weeklyTestSeed');

const weeklyTestsDir = path.join(__dirname, '../../resources/weekly-tests');

// Short-lived token store for local file access
const localFileTokens = new Map();

const weeklyTestStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const test = getLocalWeeklyTestById(req.params.id);
    const subDir = test?.subject || 'misc';
    const dir = path.join(__dirname, '../../resources/weekly-tests', subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const test = getLocalWeeklyTestById(req.params.id);
    const ext = path.extname(file.originalname);
    cb(null, `Test-${test?.testNumber || Date.now()}${ext}`);
  },
});
const uploadPdf = multer({
  storage: weeklyTestStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: createFileFilter('pdf'),
});

// Seed weekly tests on first load
seedLocalWeeklyTests(WEEKLY_TESTS_SEED);

// Transform legacy /resources/weekly-tests/... URLs to /api/weekly-tests/download/...
function fixWeeklyTestPdfUrl(test) {
  if (!test || !test.pdfUrl) return test;
  const obj = test.toObject ? test.toObject() : { ...test };
  if (obj.pdfUrl && obj.pdfUrl.startsWith('/resources/weekly-tests/')) {
    obj.pdfUrl = obj.pdfUrl.replace('/resources/weekly-tests/', '/api/weekly-tests/download/');
  }
  return obj;
}

// GET /api/weekly-tests/download/:subject/:filename — serve PDF via Cloudinary or local fallback
// MUST be before /:id to avoid Express matching "download" as an :id
router.get('/download/:subject/:filename', protect, async (req, res) => {
  const { subject, filename } = req.params;
  const safeFilename = path.basename(filename);
  const weeklyTestsDir = path.join(__dirname, '../../resources/weekly-tests');

  // Try Cloudinary first via MediaFile lookup
  if (isMongoConnected()) {
    try {
      const doc = await MediaFile.findOne({ legacy_path: `/resources/weekly-tests/${subject}/${safeFilename}` });
      if (doc && doc.secure_url) {
        let url = doc.secure_url;
        if (req.query.force === '1') url += (url.includes('?') ? '&' : '?') + 'fl_attachment';
        return res.json({ success: true, url });
      }
    } catch (e) { /* fall through to local */ }
  }

  // Local filesystem fallback - generate short-lived signed URL token
  const filePath = path.join(weeklyTestsDir, subject, safeFilename);
  if (fs.existsSync(filePath)) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    localFileTokens.set(token, { filePath, expires });
    const tokenUrl = `/api/weekly-tests/local-file/${token}`;
    return res.json({ success: true, url: tokenUrl });
  }

  res.status(404).json({ success: false, message: 'File not found' });
});

// GET /api/weekly-tests/local-file/:token — serve local file with short-lived token
router.get('/local-file/:token', async (req, res) => {
  const tokenData = localFileTokens.get(req.params.token);
  if (!tokenData || tokenData.expires < Date.now()) {
    localFileTokens.delete(req.params.token);
    return res.status(404).json({ success: false, message: 'Token expired or invalid' });
  }
  localFileTokens.delete(req.params.token);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(tokenData.filePath)}"`);
  fs.createReadStream(tokenData.filePath).pipe(res);
});

// GET /api/weekly-tests — list all tests, optional subject filter
router.get('/', protect, async (req, res, next) => {
  try {
    const { subject } = req.query;

    if (!isMongoConnected()) {
      let tests = getLocalWeeklyTests();
      if (subject) tests = tests.filter(t => t.subject === subject);
      return res.json({ success: true, data: tests });
    }

    const filter = { isActive: true };
    if (subject) filter.subject = subject;
    const tests = await WeeklyTest.find(filter).sort({ subject: 1, testNumber: 1 });
    res.json({ success: true, data: tests.map(fixWeeklyTestPdfUrl) });
  } catch (err) {
    next(err);
  }
});

// GET /api/weekly-tests/subjects — test counts per subject
router.get('/subjects', protect, async (req, res, next) => {
  try {
    const counts = getLocalWeeklyTestSubjectCounts();
    res.json({ success: true, data: counts });
  } catch (err) {
    next(err);
  }
});

// GET /api/weekly-tests/progress — user's test progress
router.get('/progress', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!isMongoConnected()) {
      const progress = await getAllLocalWeeklyTestProgress(userId);
      return res.json({ success: true, data: progress });
    }

    const progress = await UserTestProgress.find({ user: userId }).populate('test');
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
});

// GET /api/weekly-tests/:id — single test
router.get('/:id', protect, async (req, res, next) => {
  try {
    const test = getLocalWeeklyTestById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, data: fixWeeklyTestPdfUrl(test) });
  } catch (err) {
    next(err);
  }
});

// POST /api/weekly-tests/:id/complete — mark test completed with score
router.post('/:id/complete', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { score, totalMarks, timeTaken } = req.body;

    if (!isMongoConnected()) {
      const doc = saveLocalWeeklyTestProgress(userId, req.params.id, {
        isCompleted: true,
        score: score || null,
        totalMarks: totalMarks || null,
        accuracy: score && totalMarks ? Math.round((score / totalMarks) * 100) : null,
        timeTaken: timeTaken || null,
        completedAt: new Date().toISOString(),
      });
      return res.json({ success: true, data: doc });
    }

    const test = await WeeklyTest.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const existing = await UserTestProgress.findOne({ user: userId, test: req.params.id });
    const accuracy = score && totalMarks ? Math.round((score / totalMarks) * 100) : null;

    if (existing) {
      existing.isCompleted = true;
      existing.score = score ?? existing.score;
      existing.totalMarks = totalMarks ?? existing.totalMarks;
      existing.accuracy = accuracy ?? existing.accuracy;
      existing.timeTaken = timeTaken ?? existing.timeTaken;
      existing.completedAt = new Date();
      await existing.save();
      return res.json({ success: true, data: existing });
    }

    const progress = await UserTestProgress.create({
      user: userId,
      test: req.params.id,
      isCompleted: true,
      score,
      totalMarks,
      accuracy,
      timeTaken,
      attemptedAt: new Date(),
      completedAt: new Date(),
    });
    res.json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
});

// POST /api/weekly-tests — admin create
router.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    if (!isMongoConnected()) {
      const doc = saveLocalWeeklyTest(req.body);
      return res.status(201).json({ success: true, data: doc });
    }

    const test = await WeeklyTest.create(req.body);
    res.status(201).json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
});

// POST /api/weekly-tests/upload/:id — upload PDF for a test (admin)
router.post('/upload/:id', protect, uploadPdf.single('pdf'), async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF uploaded' });

    const test = getLocalWeeklyTestById(req.params.id);
    const subDir = test?.subject || 'misc';
    const pdfUrl = `/api/weekly-tests/download/${subDir}/${req.file.filename}`;
    updateLocalWeeklyTestPdfUrl(req.params.id, pdfUrl);

    res.json({ success: true, data: { pdfUrl, filename: req.file.filename } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/weekly-tests/:id — admin delete
router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    if (!isMongoConnected()) return res.json({ success: true, message: 'Deleted (local)' });
    await WeeklyTest.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
