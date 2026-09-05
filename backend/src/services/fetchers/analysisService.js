// Exam schedule + daily content + topic analysis generators
const {
  ExamSchedule, DailyContent, TopicAnalysis, TrendingSnapshot,
} = require('../../models/LiveData');
const { isMockAuthEnabled } = require('../../config/devMode');
const {
  EXAM_SCHEDULE, TOPIC_WEIGHTAGE, MARKS_DISTRIBUTION,
  FREQUENT_TOPICS, REPEATED_QUESTIONS, IMPORTANT_TOPICS,
  DAILY_THEORIES, DAILY_QUESTIONS, DAILY_FORMULAS, DAILY_PYQS,
} = require('../../data/liveDataSeed');
const { StudyLog } = require('../../models');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayIndex(date = new Date()) {
  return Math.floor(startOfDay(date).getTime() / 86400000);
}

function pickRotating(arr, date = new Date()) {
  return arr[dayIndex(date) % arr.length];
}

async function seedExamSchedule() {
  if (isMockAuthEnabled()) return { fetched: 0, newCount: 0 };

  let newCount = 0;
  for (const ev of EXAM_SCHEDULE) {
    const result = await ExamSchedule.findOneAndUpdate(
      { year: 2027, eventType: ev.eventType },
      {
        ...ev,
        date: new Date(ev.date),
        endDate: ev.endDate ? new Date(ev.endDate) : undefined,
        year: 2027,
        status: 'published',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (result) newCount++;
  }
  return { fetched: EXAM_SCHEDULE.length, newCount };
}

async function generateDailyContent() {
  if (isMockAuthEnabled()) return { fetched: 4, newCount: 0 };

  const today = startOfDay();
  const entries = [
    { type: 'theory', ...pickRotating(DAILY_THEORIES, today) },
    { type: 'question', ...pickRotating(DAILY_QUESTIONS, today) },
    { type: 'formula', ...pickRotating(DAILY_FORMULAS, today) },
    { type: 'pyq', ...pickRotating(DAILY_PYQS, today) },
  ];

  let newCount = 0;
  for (const entry of entries) {
    const existing = await DailyContent.findOne({ date: today, type: entry.type });
    if (!existing) {
      await DailyContent.create({ date: today, ...entry });
      newCount++;
    }
  }
  return { fetched: entries.length, newCount };
}

async function updateTopicAnalysis() {
  if (isMockAuthEnabled()) return { fetched: 0, newCount: 0 };

  const analyses = [
    { analysisType: 'weightage', subject: null, data: TOPIC_WEIGHTAGE, yearsCovered: [2010, 2024] },
    { analysisType: 'marks_distribution', subject: 'All Subjects', data: MARKS_DISTRIBUTION, yearsCovered: [2010, 2024] },
    { analysisType: 'frequent_topics', subject: null, data: FREQUENT_TOPICS, yearsCovered: [2010, 2024] },
    { analysisType: 'repeated_questions', subject: null, data: REPEATED_QUESTIONS, yearsCovered: [2010, 2024] },
    { analysisType: 'important_topics', subject: null, data: IMPORTANT_TOPICS, yearsCovered: [2010, 2024] },
  ];

  let newCount = 0;
  for (const a of analyses) {
    await TopicAnalysis.findOneAndUpdate(
      { analysisType: a.analysisType, subject: a.subject },
      { ...a, lastUpdated: new Date() },
      { upsert: true }
    );
    newCount++;
  }
  return { fetched: analyses.length, newCount };
}

async function updateTrendingData() {
  if (isMockAuthEnabled()) return { fetched: 2, newCount: 0 };

  const today = startOfDay();

  // Aggregate study hours by subject from StudyLog
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  let subjectLeaderboard = [];

  try {
    const logs = await StudyLog.find({ date: { $gte: weekAgo } }).populate('subjects.subject', 'name icon');
    const hoursMap = {};
    for (const log of logs) {
      for (const s of log.subjects || []) {
        const name = s.subject?.name || 'Unknown';
        hoursMap[name] = (hoursMap[name] || 0) + (s.hours || 0);
      }
    }
    subjectLeaderboard = Object.entries(hoursMap)
      .map(([subject, hours]) => ({ subject, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);
  } catch {
    // fallback simulated data
  }

  if (!subjectLeaderboard.length) {
    subjectLeaderboard = [
      { subject: 'Algorithms', hours: 42.5 },
      { subject: 'Operating Systems', hours: 38.2 },
      { subject: 'DBMS', hours: 35.8 },
      { subject: 'Computer Networks', hours: 31.4 },
      { subject: 'Computer Organization', hours: 28.9 },
      { subject: 'Engineering Mathematics', hours: 26.1 },
      { subject: 'Theory of Computation', hours: 22.7 },
      { subject: 'Compiler Design', hours: 19.3 },
    ];
  }

  const trendingTopics = IMPORTANT_TOPICS.slice(0, 8).map((t) => ({
    topic: t.topic,
    subject: t.subject,
    trend: t.trend,
    score: t.priority === 'high' ? 95 : 75,
  }));

  await TrendingSnapshot.findOneAndUpdate(
    { date: today, type: 'subject_leaderboard' },
    { data: subjectLeaderboard },
    { upsert: true }
  );
  await TrendingSnapshot.findOneAndUpdate(
    { date: today, type: 'trending_topics' },
    { data: trendingTopics },
    { upsert: true }
  );

  return { fetched: 2, newCount: 2 };
}

module.exports = {
  seedExamSchedule,
  generateDailyContent,
  updateTopicAnalysis,
  updateTrendingData,
  pickRotating,
  startOfDay,
};
