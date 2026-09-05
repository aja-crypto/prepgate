// Automated cron scheduler for live data fetching
const cron = require('node-cron');
const { isMockAuthEnabled } = require('../../config/devMode');
const { runJob, runAllJobs, getJobList } = require('../fetchOrchestrator');

let started = false;

const SCHEDULES = [
  { cron: '*/15 * * * *', jobs: ['rss_feeds', 'gate_notifications'] }, // Every 15 mins
  { cron: '*/30 * * * *', jobs: ['psu_recruitments', 'mtech_admissions', 'trending_data'] }, // Every 30 mins
  { cron: '0 */6 * * *', jobs: ['internships', 'placement_resources', 'study_materials'] },
  { cron: '0 0 * * *', jobs: ['daily_content', 'topic_analysis'] },
  { cron: '0 6 * * *', jobs: ['exam_schedule'] },
];

function startScheduler() {
  if (started) return;
  started = true;

  if (isMockAuthEnabled()) {
    console.warn('⚠️  Live data scheduler disabled (mock auth / no MongoDB)');
    return;
  }

  console.log('⏰ Live data scheduler started');

  // Initial fetch 30s after server boot
  setTimeout(() => {
    runAllJobs().catch((err) => console.error('Initial fetch failed:', err.message));
  }, 30000);

  for (const schedule of SCHEDULES) {
    cron.schedule(schedule.cron, async () => {
      for (const jobName of schedule.jobs) {
        try {
          await runJob(jobName);
        } catch {
          // logged in runJob
        }
      }
    });
  }

  // Log schedule summary
  getJobList().forEach(({ name, interval }) => {
    console.log(`   · ${name} (every ${interval})`);
  });
}

module.exports = { startScheduler, runAllJobs, runJob, getJobList };
