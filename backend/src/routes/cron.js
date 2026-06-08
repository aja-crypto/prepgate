// Cron trigger endpoint – secured by CRON_SECRET header
const router = require('express').Router();
const { runAllJobs, runJob } = require('../services/fetchOrchestrator');

router.post('/fetch-live-data', async (req, res, next) => {
  try {
    const secret = req.headers['x-cron-secret'] || req.query.secret;
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { jobName } = req.body || {};
    if (jobName) {
      const result = await runJob(jobName);
      return res.json({ success: true, data: result });
    }

    const results = await runAllJobs();
    res.json({ success: true, data: results });
  } catch (e) { next(e); }
});

module.exports = router;
