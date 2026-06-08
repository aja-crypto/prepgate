// src/routes/subjects.js
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const Subject = require('../models/Subject');
const localStore = require('../store/localDataStore');

function buildAnalyticsFromLocal(userId) {
  const progressMap = localStore.getAllProgress(userId);
  const hierarchy = localStore.getHierarchy(progressMap);
  const overview = hierarchy.map((sub) => {
    const subProgress = Object.entries(progressMap).filter(([tid]) =>
      localStore.getTopics({ subject: sub._id }).some((t) => t._id === tid)
    ).map(([, p]) => p);
    const completed = sub.completedTopics;
    const total = sub.topicCount;
    const avgAccuracy = subProgress.length
      ? Math.round(subProgress.reduce((s, p) => s + (p.accuracy || 0), 0) / subProgress.length)
      : 0;
    return {
      _id: sub._id, name: sub.name, code: sub.code, icon: sub.icon, color: sub.color,
      weightage: sub.weightage, topicCount: total, completedTopics: completed,
      completionPct: sub.completionPct, avgAccuracy,
      bookmarked: subProgress.filter((p) => p.isBookmarked).length,
      revisionNeeded: subProgress.filter((p) => p.revisionNeeded).length,
      studyTimeMinutes: subProgress.reduce((s, p) => s + (p.studyTimeMinutes || 0), 0),
    };
  });
  const totalTopics = hierarchy.reduce((s, sub) => s + sub.topicCount, 0);
  const totalCompleted = hierarchy.reduce((s, sub) => s + sub.completedTopics, 0);
  return {
    subjects: overview,
    overall: {
      topicCompletionPct: totalTopics ? Math.round((totalCompleted / totalTopics) * 100) : 0,
      totalTopics,
      completedTopics: totalCompleted,
    },
  };
}

router.get('/analytics/overview', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, data: buildAnalyticsFromLocal(req.user._id) });
    }
    const { Topic, Progress } = require('../models');
    const subjects = await Subject.find({ isActive: true }).sort('order');
    const topics = await Topic.find({ isDefault: true });
    const progressList = await Progress.find({ user: req.user._id });
    const overview = subjects.map((sub) => {
      const subTopics = topics.filter((t) => t.subject.toString() === sub._id.toString());
      const subProgress = progressList.filter((p) => p.subject?.toString() === sub._id.toString());
      const completed = subProgress.filter((p) => p.isCompleted).length;
      const total = subTopics.length;
      const avgAccuracy = subProgress.length
        ? Math.round(subProgress.reduce((s, p) => s + (p.accuracy || 0), 0) / subProgress.length)
        : 0;
      return {
        _id: sub._id, name: sub.name, code: sub.code, icon: sub.icon, color: sub.color,
        weightage: sub.weightage, topicCount: total, completedTopics: completed,
        completionPct: total ? Math.round((completed / total) * 100) : 0, avgAccuracy,
        bookmarked: subProgress.filter((p) => p.isBookmarked).length,
        revisionNeeded: subProgress.filter((p) => p.revisionNeeded).length,
        studyTimeMinutes: subProgress.reduce((s, p) => s + (p.studyTimeMinutes || 0), 0),
      };
    });
    const totalTopics = topics.length;
    const totalCompleted = progressList.filter((p) => p.isCompleted).length;
    res.json({
      success: true,
      data: {
        subjects: overview,
        overall: {
          topicCompletionPct: totalTopics ? Math.round((totalCompleted / totalTopics) * 100) : 0,
          totalTopics,
          completedTopics: totalCompleted,
        },
      },
    });
  } catch (e) { next(e); }
});

router.get('/', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      if (req.query.hierarchy !== 'true') {
        const data = localStore.getSubjects();
        return res.json({ success: true, count: data.length, data });
      }
      const progressMap = localStore.getAllProgress(req.user._id);
      const data = localStore.getHierarchy(progressMap);
      return res.json({ success: true, count: data.length, data });
    }

    const { Topic, Progress } = require('../models');
    const subjects = await Subject.find({ isActive: true }).sort('order');
    if (req.query.hierarchy !== 'true') {
      return res.json({ success: true, count: subjects.length, data: subjects });
    }
    const topics = await Topic.find({ isDefault: true }).sort('order');
    const progressList = await Progress.find({ user: req.user._id });
    const pmap = {};
    progressList.forEach((p) => { pmap[p.topic.toString()] = p; });
    const data = subjects.map((sub) => {
      const subTopics = topics.filter((t) => t.subject.toString() === sub._id.toString()).map((t) => {
        const p = pmap[t._id.toString()];
        return {
          _id: t._id, name: t.name, difficulty: t.difficulty, weightage: t.weightage, order: t.order,
          isCompleted: p?.isCompleted || false, isBookmarked: p?.isBookmarked || false,
          revisionNeeded: p?.revisionNeeded || false, markedDifficult: p?.markedDifficult || false,
          accuracy: p?.accuracy || 0,
        };
      });
      const completed = subTopics.filter((t) => t.isCompleted).length;
      return {
        ...sub.toObject(), topics: subTopics, topicCount: subTopics.length,
        completedTopics: completed,
        completionPct: subTopics.length ? Math.round((completed / subTopics.length) * 100) : 0,
      };
    });
    res.json({ success: true, count: data.length, data });
  } catch (e) { next(e); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const subject = localStore.getSubjectById(req.params.id);
      if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
      const topics = localStore.getTopics({ subject: req.params.id });
      return res.json({ success: true, data: { subject, topics } });
    }
    const { Topic } = require('../models');
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const topics = await Topic.find({ subject: req.params.id }).sort('order');
    res.json({ success: true, data: { subject, topics } });
  } catch (e) { next(e); }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB — set MONGO_URI in .env' });
    }
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (e) { next(e); }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    }
    await Subject.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Subject deactivated' });
  } catch (e) { next(e); }
});

module.exports = router;
