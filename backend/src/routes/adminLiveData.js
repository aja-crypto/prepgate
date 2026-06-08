// Admin routes for live data management and verification
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  LiveUpdate, ExamSchedule, FetchJobLog,
} = require('../models/LiveData');
const { runJob, runAllJobs, getJobList } = require('../services/fetchOrchestrator');

// GET pending updates for admin review
router.get('/live/pending', protect, adminOnly, async (req, res, next) => {
  try {
    const { type, limit = 50 } = req.query;
    const filter = { status: 'pending' };
    if (type) filter.type = type;

    const items = await LiveUpdate.find(filter).sort('-fetchedAt').limit(Number(limit)).lean();
    res.json({ success: true, count: items.length, data: items });
  } catch (e) { next(e); }
});

// GET all live updates (any status)
router.get('/live/updates', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, type, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      LiveUpdate.find(filter).sort('-fetchedAt').skip(skip).limit(Number(limit)).lean(),
      LiveUpdate.countDocuments(filter),
    ]);
    res.json({ success: true, count: items.length, total, data: items });
  } catch (e) { next(e); }
});

// PUT verify/publish/reject an update
router.put('/live/updates/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['verified', 'published', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const update = { status };
    if (status === 'verified' || status === 'published') {
      update.verifiedBy = req.user._id;
      update.verifiedAt = new Date();
    }

    const item = await LiveUpdate.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Update not found' });
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
});

// POST bulk publish verified items
router.post('/live/publish-verified', protect, adminOnly, async (req, res, next) => {
  try {
    const result = await LiveUpdate.updateMany(
      { status: 'verified' },
      { status: 'published' }
    );
    res.json({ success: true, data: { modified: result.modifiedCount } });
  } catch (e) { next(e); }
});

// POST create manual update
router.post('/live/updates', protect, adminOnly, async (req, res, next) => {
  try {
    const item = await LiveUpdate.create({
      ...req.body,
      status: req.body.status || 'published',
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      fetchedAt: new Date(),
      publishedAt: req.body.publishedAt || new Date(),
    });
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
});

// DELETE an update
router.delete('/live/updates/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await LiveUpdate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Update deleted' });
  } catch (e) { next(e); }
});

// PUT update exam schedule entry
router.put('/live/schedule/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const item = await ExamSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
});

// GET fetch job logs
router.get('/live/jobs', protect, adminOnly, async (req, res, next) => {
  try {
    const logs = await FetchJobLog.find().sort('-startedAt').limit(30).lean();
    res.json({ success: true, data: logs, jobs: getJobList() });
  } catch (e) { next(e); }
});

// POST trigger fetch job manually
router.post('/live/fetch', protect, adminOnly, async (req, res, next) => {
  try {
    const { jobName } = req.body;
    if (jobName) {
      const result = await runJob(jobName);
      return res.json({ success: true, data: result });
    }
    const results = await runAllJobs();
    res.json({ success: true, data: results });
  } catch (e) { next(e); }
});

module.exports = router;
