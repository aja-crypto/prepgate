const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const PyqPaper = require('../models/PyqPaper');
const localStore = require('../store/localDataStore');

router.get('/', protect, async (req, res, next) => {
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

router.get('/years', protect, async (req, res, next) => {
  try {
    let papers = [];
    if (isMongoConnected()) {
      papers = await PyqPaper.find().sort({ year: -1 });
    } else {
      papers = localStore.getLocalPyqPapers ? localStore.getLocalPyqPapers() : [];
    }
    const years = [...new Set(papers.map(p => p.year))].sort((a, b) => b - a);
    res.json({ success: true, data: years });
  } catch (e) { next(e); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    let paper;
    if (isMongoConnected()) {
      paper = await PyqPaper.findById(req.params.id);
    }
    if (!paper) {
      const papers = localStore.getLocalPyqPapers ? localStore.getLocalPyqPapers() : [];
      paper = papers.find(p => p._id == req.params.id || p.id == req.params.id);
    }
    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });
    res.json({ success: true, data: paper });
  } catch (e) { next(e); }
});

module.exports = router;