const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { MistakeEntry } = require('../models/MockTest');
const {
  saveLocalMistakeEntry,
  getLocalMistakeEntries,
  deleteLocalMistakeEntry,
  getLocalMistakeAggregates,
} = require('../store/localDataStore');

router.get('/', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject, category } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (category) filter.category = category;

    if (!isMongoConnected()) {
      return res.json({ success: true, data: getLocalMistakeEntries(userId, filter) });
    }
    const entries = await MistakeEntry.find({ user: userId, ...filter }).sort({ createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

router.get('/aggregates', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!isMongoConnected()) {
      return res.json({ success: true, data: getLocalMistakeAggregates(userId) });
    }
    const entries = await MistakeEntry.find({ user: userId });
    const byCategory = {};
    const bySubject = {};
    entries.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      bySubject[e.subject] = (bySubject[e.subject] || 0) + 1;
    });
    const total = entries.length;
    const topCategory = total ? Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0][0] : null;
    const topSubject = total ? Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0][0] : null;
    res.json({ success: true, data: { total, byCategory, bySubject, topCategory, topSubject } });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { questionText, subject, topic, correctAnswer, yourAnswer, category, notes, sourceTest } = req.body;

    if (!questionText || !subject || !category) {
      return res.status(400).json({ success: false, message: 'questionText, subject, and category are required' });
    }

    if (!isMongoConnected()) {
      const entry = saveLocalMistakeEntry(userId, {
        questionText, subject, topic: topic || '', correctAnswer: correctAnswer || '',
        yourAnswer: yourAnswer || '', category, notes: notes || '', sourceTest: sourceTest || '',
      });
      return res.status(201).json({ success: true, data: entry });
    }

    const entry = await MistakeEntry.create({
      user: userId, questionText, subject, topic, correctAnswer, yourAnswer,
      category, notes, sourceTest,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!isMongoConnected()) {
      const deleted = deleteLocalMistakeEntry(req.params.id, userId);
      if (!deleted) return res.status(404).json({ success: false, message: 'Entry not found' });
      return res.json({ success: true, message: 'Deleted' });
    }
    const entry = await MistakeEntry.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
