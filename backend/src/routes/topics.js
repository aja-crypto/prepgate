// src/routes/topics.js — syllabus topics + learning module + progress
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const Topic = require('../models/Topic');
const localStore = require('../store/localDataStore');
const { validateFields, VALID_SUBJECTS, VALID_DIFFICULTIES } = require('../middleware/validateInput');

async function enrichProgressMongo(topics, userId) {
  const progressList = await Progress.find({ user: userId, topic: { $in: topics.map((t) => t._id) } });
  const pmap = {};
  progressList.forEach((p) => { pmap[p.topic.toString()] = p; });
  return topics.map((t) => {
    const p = pmap[t._id.toString()];
    return {
      ...t.toObject(),
      progress: p ? {
        isCompleted: p.isCompleted, completedAt: p.completedAt, confidence: p.confidence,
        studyTimeMinutes: p.studyTimeMinutes, revisionCount: p.revisionCount,
        nextRevisionDate: p.nextRevisionDate, isBookmarked: p.isBookmarked,
        revisionNeeded: p.revisionNeeded, markedDifficult: p.markedDifficult,
        accuracy: p.accuracy, lastStudiedAt: p.lastStudiedAt,
        completionTasks: p.completionTasks || { lecture: false, notes: false, pyqs: false, revision: false, test: false },
        completionPercentage: p.completionPercentage || 0,
      } : {
        isCompleted: false, isBookmarked: false, revisionNeeded: false,
        markedDifficult: false, studyTimeMinutes: 0, revisionCount: 0, accuracy: 0,
        completionTasks: { lecture: false, notes: false, pyqs: false, revision: false, test: false },
        completionPercentage: 0,
      },
    };
  });
}

router.get('/', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const filter = { isDefault: true };
      if (req.query.subject) filter.subject = req.query.subject;
      let topics = localStore.getTopics(filter);
      const progressMap = localStore.getAllProgress(req.user._id);
      if (req.query.withProgress === 'true') {
        topics = localStore.enrichWithProgress(topics, progressMap);
      } else {
        topics = topics.map((t) => ({ ...t, subject: localStore.getSubjectById(t.subject) }));
      }
      return res.json({ success: true, count: topics.length, data: topics });
    }

    const filter = { isDefault: true };
    if (req.query.subject) filter.subject = req.query.subject;
    let topics = await Topic.find(filter).populate('subject', 'name code icon color weightage').sort('order name');
    if (req.query.withProgress === 'true') topics = await enrichProgressMongo(topics, req.user._id);
    res.json({ success: true, count: topics.length, data: topics });
  } catch (e) { next(e); }
});

router.get('/:id/learn', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const topic = localStore.getTopicById(req.params.id);
      if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
      const progress = localStore.getProgress(req.user._id, req.params.id) || {
        isCompleted: false, isBookmarked: false, revisionNeeded: false,
        markedDifficult: false, studyTimeMinutes: 0, revisionCount: 0, accuracy: 0, confidence: 3,
      };
      const pyqList = [];
      const solved = 0;
      const accuracy = progress.accuracy || 0;
      return res.json({
        success: true,
        data: {
          topic,
          progress,
          relatedPyqs: pyqList,
          analytics: {
            pyqCount: 0, pyqSolved: solved, accuracy,
            strength: accuracy >= 80 ? 'strong' : accuracy >= 50 ? 'moderate' : 'weak',
            weightage: topic.weightage, difficulty: topic.difficulty,
          },
        },
      });
    }

    const topic = await Topic.findById(req.params.id).populate('subject', 'name code icon color weightage syllabus');
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    const [progress, pyqs, userPyqs] = await Promise.all([
      Progress.findOne({ user: req.user._id, topic: topic._id }),
      PYQ.find({ topic: topic._id, isActive: { $ne: false } }).select('title year difficulty marks').sort('-year').limit(20),
      UserPYQ.find({ user: req.user._id }).select('pyq isSolved isBookmarked'),
    ]);

    const userMap = {};
    userPyqs.forEach((u) => { userMap[u.pyq.toString()] = u; });
    let pyqList = pyqs.map((q) => ({
      _id: q._id, title: q.title, year: q.year, difficulty: q.difficulty, marks: q.marks,
      isSolved: userMap[q._id.toString()]?.isSolved || false,
      isBookmarked: userMap[q._id.toString()]?.isBookmarked || false,
    }));

    if (!pyqList.length) {
      const byName = await PYQ.find({
        isActive: { $ne: false },
        $or: [{ tags: topic.name }, { title: new RegExp(topic.name.split(' ')[0], 'i') }],
        subject: topic.subject._id,
      }).limit(10);
      pyqList = byName.map((q) => ({
        _id: q._id, title: q.title, year: q.year, difficulty: q.difficulty, marks: q.marks,
        isSolved: userMap[q._id.toString()]?.isSolved || false,
      }));
    }

    const solved = pyqList.filter((p) => p.isSolved).length;
    const accuracy = pyqList.length ? Math.round((solved / pyqList.length) * 100) : (progress?.accuracy || 0);

    res.json({
      success: true,
      data: {
        topic,
        progress: progress || {
          isCompleted: false, isBookmarked: false, revisionNeeded: false,
          markedDifficult: false, studyTimeMinutes: 0, revisionCount: 0, accuracy: 0,
        },
        relatedPyqs: pyqList,
        analytics: {
          pyqCount: pyqList.length, pyqSolved: solved, accuracy,
          strength: accuracy >= 80 ? 'strong' : accuracy >= 50 ? 'moderate' : 'weak',
          weightage: topic.weightage, difficulty: topic.difficulty,
        },
      },
    });
  } catch (e) { next(e); }
});

router.patch('/:id/progress', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const topic = localStore.getTopicById(req.params.id);
      if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
      const updates = { ...req.body };
      if (updates.isCompleted) updates.completedAt = new Date();
      const progress = localStore.updateProgress(req.user._id, req.params.id, updates);
      return res.json({ success: true, data: progress });
    }

    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    const updates = { lastStudiedAt: new Date() };
    if (req.body.isCompleted !== undefined) {
      updates.isCompleted = req.body.isCompleted;
      updates.completedAt = req.body.isCompleted ? new Date() : null;
    }
    if (req.body.isBookmarked !== undefined) updates.isBookmarked = req.body.isBookmarked;
    if (req.body.revisionNeeded !== undefined) updates.revisionNeeded = req.body.revisionNeeded;
    if (req.body.markedDifficult !== undefined) updates.markedDifficult = req.body.markedDifficult;
    if (req.body.confidence !== undefined) updates.confidence = req.body.confidence;
    if (req.body.accuracy !== undefined) updates.accuracy = req.body.accuracy;
    if (req.body.revisionCount !== undefined) updates.revisionCount = req.body.revisionCount;
    if (req.body.completionTasks !== undefined) {
      updates.completionTasks = req.body.completionTasks;
      // Auto-calculate percentage
      const tasks = req.body.completionTasks;
      const doneCount = ['lecture', 'notes', 'pyqs', 'revision', 'test'].filter((key) => tasks[key]).length;
      updates.completionPercentage = Math.round((doneCount / 5) * 100);
      // Auto-mark completed if 100%
      if (updates.completionPercentage === 100 && !updates.isCompleted) {
        updates.isCompleted = true;
        updates.completedAt = new Date();
      }
    }

    const inc = req.body.studyTimeMinutes ? { studyTimeMinutes: req.body.studyTimeMinutes } : null;
    const progress = await Progress.findOneAndUpdate(
      { user: req.user._id, topic: req.params.id },
      { $set: updates, ...(inc ? { $inc: inc } : {}) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (!progress.subject) { progress.subject = topic.subject; await progress.save(); }
    res.json({ success: true, data: progress });
  } catch (e) { next(e); }
});

router.patch('/:id/toggle', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      const topic = localStore.getTopicById(req.params.id);
      if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
      const prev = localStore.getProgress(req.user._id, req.params.id);
      const progress = localStore.updateProgress(req.user._id, req.params.id, {
        isCompleted: !(prev?.isCompleted),
        completedAt: !(prev?.isCompleted) ? new Date() : null,
      });
      return res.json({ success: true, data: progress });
    }

    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
    let progress = await Progress.findOne({ user: req.user._id, topic: req.params.id });
    if (!progress) {
      progress = await Progress.create({
        user: req.user._id, topic: req.params.id, subject: topic.subject,
        isCompleted: true, completedAt: new Date(), lastStudiedAt: new Date(),
      });
    } else {
      progress.isCompleted = !progress.isCompleted;
      progress.completedAt = progress.isCompleted ? new Date() : null;
      progress.lastStudiedAt = new Date();
      await progress.save();
    }
    res.json({ success: true, data: progress });
  } catch (e) { next(e); }
});

router.post('/', protect, adminOnly, validateFields([
  { name: 'name', type: 'string', required: true, min: 2, max: 100 },
  { name: 'code', type: 'string', min: 2, max: 50 },
  { name: 'subject', type: 'string', in: VALID_SUBJECTS },
  { name: 'difficulty', type: 'string', in: VALID_DIFFICULTIES },
  { name: 'order', type: 'number', min: 0 },
  { name: 'timeEstimate', type: 'number', min: 1, max: 600 },
  { name: 'questions', type: 'number', min: 0, max: 1000 },
  { name: 'passed', type: 'number', min: 0, max: 1000 },
  { name: 'isDefault', type: 'boolean' },
  { name: 'isActive', type: 'boolean' },
  { name: 'description', type: 'string', max: 1000 },
  { name: 'prerequisite', type: 'string', max: 100 },
]), async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    const topic = await Topic.create({ ...req.body, isDefault: false });
    res.status(201).json({ success: true, data: topic });
  } catch (e) { next(e); }
});
 
router.put('/:id', protect, adminOnly, validateFields([
  { name: 'name', type: 'string', min: 2, max: 100 },
  { name: 'code', type: 'string', min: 2, max: 50 },
  { name: 'subject', type: 'string', in: VALID_SUBJECTS },
  { name: 'difficulty', type: 'string', in: VALID_DIFFICULTIES },
  { name: 'order', type: 'number', min: 0 },
  { name: 'timeEstimate', type: 'number', min: 1, max: 600 },
  { name: 'questions', type: 'number', min: 0, max: 1000 },
  { name: 'passed', type: 'number', min: 0, max: 1000 },
  { name: 'isDefault', type: 'boolean' },
  { name: 'isActive', type: 'boolean' },
  { name: 'description', type: 'string', max: 1000 },
  { name: 'prerequisite', type: 'string', max: 100 },
]), async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: topic });
  } catch (e) { next(e); }
});
 
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'Requires MongoDB' });
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Topic deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
