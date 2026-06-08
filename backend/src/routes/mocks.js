// src/routes/mocks.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { MockTest } = require('../models');

const emptyAnalytics = {
  tests: [],
  best: 0,
  avg: 0,
  count: 0,
  improvement: 0,
};

router.get('/', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, count: 0, data: [] });
    }
    const tests = await MockTest.find({ user: req.user._id }).sort('-testDate');
    res.json({ success: true, count: tests.length, data: tests });
  } catch (e) { next(e); }
});

router.get('/analytics', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, data: emptyAnalytics });
    }
    const tests = await MockTest.find({ user: req.user._id }).sort('testDate');
    const scores = tests.map(t => t.score);
    res.json({
      success: true,
      data: {
        tests: tests.map(t => ({ name: t.name, score: t.score, date: t.testDate })),
        best: scores.length ? Math.max(...scores) : 0,
        avg: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
        count: tests.length,
        improvement: scores.length >= 2 ? (scores[scores.length - 1] - scores[0]).toFixed(1) : 0,
      }
    });
  } catch (e) { next(e); }
});

router.post('/', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Mock tests require MongoDB' });
    }
    const test = await MockTest.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: test });
  } catch (e) { next(e); }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Mock tests require MongoDB' });
    }
    const test = await MockTest.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, data: test });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Mock tests require MongoDB' });
    }
    await MockTest.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Test deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
