// src/routes/progress.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { Progress, StudyLog, MockTest, Note } = require('../models');
const ProgressSnapshot = require('../models/ProgressSnapshot');
const { getEmptyProgressData } = require('../utils/emptyProgress');
const { isMockAuthEnabled } = require('../config/devMode');
const { isMongoConnected } = require('../config/db');
const localStore = require('../store/localDataStore');

function parseMockDate(dateStr) {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function mockToDb(m) {
  return {
    name: m.name,
    testDate: parseMockDate(m.date),
    score: m.score,
    rank: m.rank || undefined,
    notes: m.notes || '',
    provider: m.provider || 'Self',
    maxScore: 100,
  };
}

function mockFromDb(m) {
  return {
    id: m._id.toString(),
    mongoId: m._id.toString(),
    name: m.name,
    date: new Date(m.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    score: m.score,
    rank: m.rank ?? null,
    notes: m.notes || '',
  };
}

function noteFromDb(n) {
  return {
    id: n._id.toString(),
    mongoId: n._id.toString(),
    title: n.title,
    subject: n.subject?.name || 'General',
    content: n.content,
    date: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    color: n.color || '#4f8dff',
  };
}

// GET overall progress stats
router.get('/', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (!isMongoConnected()) {
      const progressMap = localStore.getAllProgress(userId);
      const hierarchy = localStore.getHierarchy(progressMap);
      const bySubject = hierarchy.map((sub) => ({
        subjectName: sub.name,
        subjectCode: sub.code,
        total: sub.topicCount,
        completed: sub.completedTopics,
        percentage: sub.completionPct,
        totalStudyMinutes: Object.entries(progressMap)
          .filter(([tid]) => localStore.getTopics({ subject: sub._id }).some((t) => t._id === tid))
          .reduce((s, [, p]) => s + (p.studyTimeMinutes || 0), 0),
      }));
      const totalTopics = hierarchy.reduce((s, sub) => s + sub.topicCount, 0);
      const completedTopics = hierarchy.reduce((s, sub) => s + sub.completedTopics, 0);
      return res.json({
        success: true,
        data: {
          overall: {
            totalTopics,
            completedTopics,
            percentage: totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0,
          },
          bySubject,
          weeklyHours: 0,
          streak: req.user.streak,
        },
      });
    }

    // Aggregate progress per subject
    const subjectProgress = await Progress.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          totalStudyMinutes: { $sum: '$studyTimeMinutes' },
        }
      },
      { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
      { $unwind: '$subject' },
      { $project: { subjectName: '$subject.name', subjectCode: '$subject.code', total: 1, completed: 1, percentage: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, totalStudyMinutes: 1 } }
    ]);

    // Overall percentage
    const totalTopics = subjectProgress.reduce((s, x) => s + x.total, 0);
    const completedTopics = subjectProgress.reduce((s, x) => s + x.completed, 0);
    const overallPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Study hours this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekLogs = await StudyLog.aggregate([
      { $match: { user: userId, date: { $gte: weekStart } } },
      { $group: { _id: null, totalHours: { $sum: '$hours' } } }
    ]);

    res.json({
      success: true,
      data: {
        overall: { totalTopics, completedTopics, percentage: overallPercentage },
        bySubject: subjectProgress,
        weeklyHours: weekLogs[0]?.totalHours || 0,
        streak: req.user.streak,
      }
    });
  } catch (e) { next(e); }
});

// PUT log study hours
router.put('/study-hours', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      req.user.updateStreak();
      await req.user.save({ validateBeforeSave: false });
      return res.json({ success: true, data: { hours: req.body.hours, date: req.body.date || new Date() } });
    }

    const { hours, date, subjects } = req.body;
    const logDate = new Date(date || Date.now());
    logDate.setHours(0, 0, 0, 0);

    const log = await StudyLog.findOneAndUpdate(
      { user: req.user._id, date: logDate },
      { hours, subjects, user: req.user._id, date: logDate },
      { upsert: true, new: true }
    );

    // Update streak
    req.user.updateStreak();
    await req.user.save({ validateBeforeSave: false });

    res.json({ success: true, data: log });
  } catch (e) { next(e); }
});

// DELETE reset all user progress (requires MongoDB) — saves 30-day snapshot
router.delete('/reset', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (!isMockAuthEnabled()) {
      const currentData = req.user.progressBackup?.data || getEmptyProgressData();
      await ProgressSnapshot.create({
        user: userId,
        data: currentData,
        reason: 'reset',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await Progress.deleteMany({ user: userId });
      await StudyLog.deleteMany({ user: userId });
      await MockTest.deleteMany({ user: userId });
      await Note.deleteMany({ user: userId });
      req.user.progressBackup = { data: getEmptyProgressData(), updatedAt: new Date() };
    }

    req.user.streak = { current: 0, longest: 0, lastStudyDate: null };
    await req.user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'All progress reset. Snapshot saved for 30 days.' });
  } catch (e) { next(e); }
});

// GET recoverable snapshots
router.get('/snapshots', protect, async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return res.json({ success: true, data: [] });
    }
    const snapshots = await ProgressSnapshot.find({
      user: req.user._id,
      expiresAt: { $gt: new Date() },
    }).sort('-deletedAt').select('-data').lean();
    res.json({ success: true, data: snapshots });
  } catch (e) { next(e); }
});

// POST restore from snapshot
router.post('/restore/:snapshotId', protect, async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return res.status(503).json({ success: false, message: 'Restore unavailable in mock mode.' });
    }

    const snapshot = await ProgressSnapshot.findOne({
      _id: req.params.snapshotId,
      user: req.user._id,
      expiresAt: { $gt: new Date() },
    });

    if (!snapshot) {
      return res.status(404).json({ success: false, message: 'Snapshot not found or expired.' });
    }

    req.user.progressBackup = { data: snapshot.data, updatedAt: new Date() };
    if (typeof req.user.save === 'function') {
      await req.user.save({ validateBeforeSave: false });
    }

    res.json({
      success: true,
      message: 'Progress restored from snapshot.',
      data: { restoredAt: req.user.progressBackup.updatedAt },
    });
  } catch (e) { next(e); }
});

// GET full sync payload — backup blob + entity collections
router.get('/sync', protect, async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return res.json({
        success: true,
        data: {
          backup: req.user.progressBackup || null,
          mocks: [],
          notes: [],
          mongoAvailable: false,
        },
      });
    }

    const userId = req.user._id;
    const [mocks, notes] = await Promise.all([
      MockTest.find({ user: userId }).sort('-testDate'),
      Note.find({ user: userId }).populate('subject', 'name').sort('-createdAt'),
    ]);

    res.json({
      success: true,
      data: {
        backup: req.user.progressBackup || null,
        mocks: mocks.map(mockFromDb),
        notes: notes.map(noteFromDb),
        mongoAvailable: true,
      },
    });
  } catch (e) { next(e); }
});

// PUT full sync — backup blob + upsert mocks & notes, return mongoIds
router.put('/sync', protect, async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ success: false, message: 'Sync data required' });

    req.user.progressBackup = { data, updatedAt: new Date() };

    if (isMockAuthEnabled()) {
      if (typeof req.user.save === 'function') {
        await req.user.save({ validateBeforeSave: false });
      }
      return res.json({
        success: true,
        data: { updatedAt: req.user.progressBackup.updatedAt, mocks: data.mocks, notes: data.notes, mongoAvailable: false },
      });
    }

    const userId = req.user._id;
    const syncedMocks = [];
    const syncedNotes = [];

    // Batch mock operations
    const mockOps = [];
    for (const m of data.mocks || []) {
      if (m.mongoId) {
        mockOps.push({
          updateOne: {
            filter: { _id: m.mongoId, user: userId },
            update: mockToDb(m),
            upsert: true,
          },
        });
      } else {
        mockOps.push({
          insertOne: {
            document: { ...mockToDb(m), user: userId },
          },
        });
      }
    }

    // Batch note operations
    const noteOps = [];
    for (const n of data.notes || []) {
      const payload = { title: n.title, content: n.content, color: n.color || '#4f8dff' };
      if (n.mongoId) {
        noteOps.push({
          updateOne: {
            filter: { _id: n.mongoId, user: userId },
            update: payload,
            upsert: true,
          },
        });
      } else {
        noteOps.push({
          insertOne: {
            document: { ...payload, user: userId },
          },
        });
      }
    }

    // Execute bulk writes in parallel
    const [mockResults, noteResults] = await Promise.all([
      mockOps.length ? MockTest.bulkWrite(mockOps, { ordered: false }) : Promise.resolve({}),
      noteOps.length ? Note.bulkWrite(noteOps, { ordered: false }) : Promise.resolve({}),
    ]);

    // Collect synced mocks
    if (mockOps.length) {
      const mockIds = data.mocks
        .filter(m => m.mongoId)
        .map(m => m.mongoId);
      const createdIds = mockResults.upsertedIds || {};
      const allMockIds = [...mockIds, ...Object.values(createdIds).map(v => v._id)];
      const syncedMocksDb = await MockTest.find({ _id: { $in: allMockIds }, user: userId });
      syncedMocks.push(...syncedMocksDb.map(mockFromDb));
    }

    // Collect synced notes
    if (noteOps.length) {
      const noteIds = data.notes
        .filter(n => n.mongoId)
        .map(n => n.mongoId);
      const createdIds = noteResults.upsertedIds || {};
      const allNoteIds = [...noteIds, ...Object.values(createdIds).map(v => v._id)];
      const syncedNotesDb = await Note.find({ _id: { $in: allNoteIds }, user: userId })
        .populate('subject', 'name');
      syncedNotes.push(...syncedNotesDb.map(noteFromDb));
    }

    if (data.studyStats?.todayHours != null) {
      const logDate = new Date();
      logDate.setHours(0, 0, 0, 0);
      await StudyLog.findOneAndUpdate(
        { user: userId, date: logDate },
        { hours: data.studyStats.todayHours, user: userId, date: logDate },
        { upsert: true, new: true }
      );
      if (typeof req.user.updateStreak === 'function') {
        req.user.updateStreak();
      }
    }

    if (typeof req.user.save === 'function') {
      await req.user.save({ validateBeforeSave: false });
    }

    res.json({
      success: true,
      data: {
        updatedAt: req.user.progressBackup.updatedAt,
        mocks: syncedMocks,
        notes: syncedNotes,
        mongoAvailable: true,
      },
    });
  } catch (e) { next(e); }
});

// PUT cloud backup (full progress JSON)
router.put('/backup', protect, async (req, res, next) => {
  try {
    req.user.progressBackup = { data: req.body.data, updatedAt: new Date() };
    if (typeof req.user.save === 'function') {
      await req.user.save({ validateBeforeSave: false });
    }
    res.json({ success: true, data: { updatedAt: req.user.progressBackup.updatedAt } });
  } catch (e) { next(e); }
});

// GET cloud backup
router.get('/backup', protect, async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user.progressBackup || null });
  } catch (e) { next(e); }
});

// GET streak data
router.get('/streak', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, data: { streak: req.user.streak, logs: [] } });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await StudyLog.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).select('date hours').sort('date');

    res.json({ success: true, data: { streak: req.user.streak, logs } });
  } catch (e) { next(e); }
});

module.exports = router;
