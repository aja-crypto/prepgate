const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected, isMockAuthEnabled } = require('../config/db');
const MistakeEntry = require('../models/MistakeEntry');
const {
  saveLocalMistakeEntry,
  getLocalMistakeEntries,
  deleteLocalMistakeEntry,
  getLocalMistakeAggregates,
} = require('../store/localDataStore');

router.get('/', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject, mistakeType, difficulty, status } = req.query;
    const filter = { user: userId };
    if (subject && subject !== 'All') filter.subject = subject;
    if (mistakeType && mistakeType !== 'All') filter.mistakeType = mistakeType;
    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    if (status === 'resolved') filter.resolved = true;
    else if (status === 'pending') filter.resolved = false;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      const entries = getLocalMistakeEntries(userId, filter);
      return res.json({ success: true, data: entries });
    }
    const entries = await MistakeEntry.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});

router.get('/aggregates', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, data: getLocalMistakeAggregates(userId) });
    }
    const entries = await MistakeEntry.find({ user: userId });
    const byMistakeType = {};
    const bySubject = {};
    const byDifficulty = {};
    const byStatus = { pending: 0, resolved: 0 };
    entries.forEach(e => {
      byMistakeType[e.mistakeType] = (byMistakeType[e.mistakeType] || 0) + 1;
      bySubject[e.subject] = (bySubject[e.subject] || 0) + 1;
      byDifficulty[e.difficulty] = (byDifficulty[e.difficulty] || 0) + 1;
      byStatus[e.resolved ? 'resolved' : 'pending']++;
    });
    res.json({
      success: true,
      data: {
        total: entries.length,
        byMistakeType,
        bySubject,
        byDifficulty,
        byStatus,
        totalResolved: byStatus.resolved,
        totalPending: byStatus.pending,
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { questionText, subject, topic, difficulty, mistakeType, correctAnswer, userAnswer, reason, learning, source, sourceTest, priority, tags, attachments } = req.body;

    if (!questionText || !subject) {
      return res.status(400).json({ success: false, message: 'questionText and subject are required' });
    }

    const data = {
      user: userId,
      questionText: questionText || '',
      subject: subject || '',
      topic: topic || '',
      difficulty: difficulty || 'Medium',
      mistakeType: mistakeType || 'concept_error',
      correctAnswer: correctAnswer || '',
      userAnswer: userAnswer || '',
      reason: reason || '',
      learning: learning || '',
      source: source || 'Practice',
      sourceTest: sourceTest || '',
      priority: priority || 'Medium',
      tags: tags || [],
      attachments: attachments || [],
      resolved: false,
    };

    if (!isMongoConnected() || isMockAuthEnabled()) {
      const entry = saveLocalMistakeEntry(userId, data);
      return res.status(201).json({ success: true, data: entry });
    }

    const entry = await MistakeEntry.create(data);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    delete updates.user;
    delete updates._id;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, message: 'Update not supported in local mode' });
    }
    const entry = await MistakeEntry.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: updates },
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!isMongoConnected() || isMockAuthEnabled()) {
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
