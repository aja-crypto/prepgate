const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const year = req.body.year || 'unknown';
    const set = req.body.set || 'unknown';
    const dir = path.join(__dirname, '../../uploads/gate-papers', String(year), String(set));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const year = req.body.year || 'unknown';
    const set = req.body.set || 'unknown';
    cb(null, `${year}_set${set}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const PyqPaper = require('../models/PyqPaper');
const localStore = require('../store/localDataStore');

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    let papers = [];
    if (isMongoConnected()) {
      papers = await PyqPaper.find().sort({ year: -1, set: 1 });
    }
    if (papers.length === 0) {
      papers = localStore.getLocalPyqPapers ? localStore.getLocalPyqPapers() : [];
    }
    res.json({ success: true, data: papers });
  } catch (e) { next(e); }
});

router.post('/', protect, adminOnly, upload.single('pdf'), async (req, res, next) => {
  try {
    const { year, set, title, subject } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'PDF file required' });
    if (!year) return res.status(400).json({ success: false, message: 'Year required' });

    const pdfUrl = `/uploads/gate-papers/${year}/${set}/${req.file.filename}`;
    const setNum = parseInt(set) || 1;
    const displayTitle = title || `GATE CSE ${year} Set ${setNum}`;

    let paper;
    if (isMongoConnected()) {
      paper = await PyqPaper.create({ year: parseInt(year), set: setNum, title: displayTitle, subject: subject || 'CSE', pdfUrl, fileName: req.file.filename });
    } else {
      paper = localStore.saveLocalPyqPaper ? localStore.saveLocalPyqPaper({ year: parseInt(year), set: setNum, title: displayTitle, subject: subject || 'CSE', pdfUrl, fileName: req.file.filename }) : { year, set: setNum, title: displayTitle, subject: subject || 'CSE', pdfUrl, fileName: req.file.filename };
    }
    res.json({ success: true, data: paper });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const paper = await PyqPaper.findById(req.params.id);
      if (paper && paper.pdfUrl) {
        const filePath = path.join(__dirname, '../..', paper.pdfUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await PyqPaper.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true, message: 'Paper deleted' });
  } catch (e) { next(e); }
});

module.exports = router;