// Orchestrates all live data fetch jobs
const { FetchJobLog } = require('../models/LiveData');
const { isMockAuthEnabled } = require('../config/devMode');
const { fetchGateNotifications } = require('./fetchers/gateFetcher');
const { fetchPsuRecruitments } = require('./fetchers/psuFetcher');
const { fetchMtechAdmissions } = require('./fetchers/mtechFetcher');
const { fetchInternships, fetchPlacementResources, fetchStudyMaterials } = require('./fetchers/resourcesFetcher');
const { fetchRssFeeds } = require('./fetchers/rssFetcher');
const {
  seedExamSchedule, generateDailyContent, updateTopicAnalysis, updateTrendingData,
} = require('./fetchers/analysisService');

const JOBS = [
  { name: 'gate_notifications', fn: fetchGateNotifications, interval: '4h' },
  { name: 'psu_recruitments', fn: fetchPsuRecruitments, interval: '4h' },
  { name: 'mtech_admissions', fn: fetchMtechAdmissions, interval: '4h' },
  { name: 'internships', fn: fetchInternships, interval: '6h' },
  { name: 'placement_resources', fn: fetchPlacementResources, interval: '6h' },
  { name: 'study_materials', fn: fetchStudyMaterials, interval: '6h' },
  { name: 'rss_feeds', fn: fetchRssFeeds, interval: '2h' },
  { name: 'exam_schedule', fn: seedExamSchedule, interval: '12h' },
  { name: 'daily_content', fn: generateDailyContent, interval: '24h' },
  { name: 'topic_analysis', fn: updateTopicAnalysis, interval: '24h' },
  { name: 'trending_data', fn: updateTrendingData, interval: '4h' },
];

async function runJob(jobName) {
  const job = JOBS.find((j) => j.name === jobName);
  if (!job) throw new Error(`Unknown job: ${jobName}`);

  const log = isMockAuthEnabled()
    ? null
    : await FetchJobLog.create({ jobName, startedAt: new Date(), status: 'running' });

  try {
    const result = await job.fn();
    if (log) {
      log.completedAt = new Date();
      log.status = 'success';
      log.itemsFetched = result.fetched || 0;
      log.itemsNew = result.newCount || 0;
      log.details = { source: result.source };
      await log.save();
    }
    console.log(`✅ [${jobName}] fetched=${result.fetched} new=${result.newCount}`);
    return result;
  } catch (err) {
    if (log) {
      log.completedAt = new Date();
      log.status = 'failed';
      log.error = err.message;
      await log.save();
    }
    console.error(`❌ [${jobName}] ${err.message}`);
    throw err;
  }
}

async function runAllJobs() {
  console.log('\n🔄 Starting live data fetch cycle...');
  const results = {};
  for (const job of JOBS) {
    try {
      results[job.name] = await runJob(job.name);
    } catch (err) {
      results[job.name] = { error: err.message };
    }
  }
  console.log('✅ Live data fetch cycle complete\n');
  return results;
}

function getJobList() {
  return JOBS.map(({ name, interval }) => ({ name, interval }));
}

module.exports = { runJob, runAllJobs, getJobList, JOBS };
