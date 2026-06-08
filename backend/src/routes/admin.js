// src/routes/admin.js
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { Topic, Note, MockTest, PYQ } = require('../models');

// GET admin dashboard stats
router.get('/stats', protect, adminOnly, async (req, res, next) => {
  try {
    const [userCount, subjectCount, topicCount, noteCount, testCount, pyqCount] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments({ isActive: true }),
      Topic.countDocuments(),
      Note.countDocuments(),
      MockTest.countDocuments(),
      PYQ.countDocuments(),
    ]);

    res.json({
      success: true,
      data: { users: userCount, subjects: subjectCount, topics: topicCount, notes: noteCount, tests: testCount, pyqs: pyqCount }
    });
  } catch (e) { next(e); }
});

// GET all users (admin)
router.get('/users', protect, adminOnly, async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json({ success: true, count: users.length, data: users });
  } catch (e) { next(e); }
});

// PUT update user role
router.put('/users/:id/role', protect, adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

module.exports = router;
