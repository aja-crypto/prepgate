// src/routes/liveData.js – Public live data API
const router = require('express').Router();
const {
  LiveUpdate, ExamSchedule, DailyContent, TopicAnalysis, TrendingSnapshot,
} = require('../models/LiveData');
const { isMockAuthEnabled } = require('../config/devMode');
const seed = require('../data/liveDataSeed');
const { startOfDay } = require('../services/fetchers/analysisService');

function mockResponse(res, data) {
  return res.json({ success: true, data, mock: true });
}

// GET dashboard summary – all live data in one call
router.get('/dashboard', async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return mockResponse(res, buildMockDashboard());
    }

    const today = startOfDay();
    const [
      announcements, schedule, dailyContent, analyses, trending, psu, mtech, internships, rss,
    ] = await Promise.all([
      LiveUpdate.find({ type: { $in: ['gate_notification', 'syllabus_update'] }, status: 'published' })
        .sort('-publishedAt').limit(8).lean(),
      ExamSchedule.find({ year: 2027, status: 'published' }).sort('date').lean(),
      DailyContent.find({ date: today }).lean(),
      TopicAnalysis.find().lean(),
      TrendingSnapshot.find({ date: today }).lean(),
      LiveUpdate.find({ type: 'psu_recruitment', status: 'published' }).sort('-publishedAt').limit(9).lean(),
      LiveUpdate.find({ type: 'mtech_admission', status: 'published' }).sort('-publishedAt').limit(6).lean(),
      LiveUpdate.find({ type: 'internship', status: 'published' }).sort('-publishedAt').limit(4).lean(),
      LiveUpdate.find({ type: 'rss', status: 'published' }).sort('-publishedAt').limit(6).lean(),
    ]);

    const examDate = schedule.find((s) => s.eventType === 'exam');

    res.json({
      success: true,
      data: {
        announcements,
        schedule,
        examDate: examDate?.date || '2027-02-07',
        dailyContent,
        analyses: groupAnalyses(analyses),
        trending: groupTrending(trending),
        psuRecruitments: psu,
        mtechAdmissions: mtech,
        internships,
        rssFeed: rss,
        placementResources: await LiveUpdate.find({ type: 'placement_resource', status: 'published' }).sort('-publishedAt').limit(5).lean(),
        studyMaterials: await LiveUpdate.find({ type: 'study_material', status: 'published' }).sort('-publishedAt').limit(5).lean(),
        lastUpdated: new Date(),
      },
    });
  } catch (e) { next(e); }
});

// GET announcements by type
router.get('/updates', async (req, res, next) => {
  try {
    const { type, category, limit = 20 } = req.query;
    if (isMockAuthEnabled()) {
      const items = filterMockUpdates(type, category, Number(limit));
      return mockResponse(res, items);
    }

    const filter = { status: 'published' };
    if (type) filter.type = type;
    if (category) filter.category = new RegExp(category, 'i');

    const items = await LiveUpdate.find(filter).sort('-publishedAt').limit(Number(limit)).lean();
    res.json({ success: true, count: items.length, data: items });
  } catch (e) { next(e); }
});

// GET exam schedule
router.get('/schedule', async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return mockResponse(res, seed.EXAM_SCHEDULE.map((s) => ({ ...s, date: s.date, status: 'published' })));
    }
    const schedule = await ExamSchedule.find({ year: 2027, status: 'published' }).sort('date').lean();
    res.json({ success: true, data: schedule });
  } catch (e) { next(e); }
});

// GET daily content
router.get('/daily', async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return mockResponse(res, buildMockDaily());
    }
    const today = startOfDay();
    const content = await DailyContent.find({ date: today }).lean();
    res.json({ success: true, data: content });
  } catch (e) { next(e); }
});

// GET topic analysis
router.get('/analysis', async (req, res, next) => {
  try {
    const { type } = req.query;
    if (isMockAuthEnabled()) {
      return mockResponse(res, buildMockAnalysis(type));
    }
    const filter = type ? { analysisType: type } : {};
    const analyses = await TopicAnalysis.find(filter).lean();
    res.json({ success: true, data: groupAnalyses(analyses) });
  } catch (e) { next(e); }
});

// GET trending data
router.get('/trending', async (req, res, next) => {
  try {
    if (isMockAuthEnabled()) {
      return mockResponse(res, buildMockTrending());
    }
    const today = startOfDay();
    const snapshots = await TrendingSnapshot.find({ date: today }).lean();
    res.json({ success: true, data: groupTrending(snapshots) });
  } catch (e) { next(e); }
});

function groupAnalyses(analyses) {
  const grouped = {};
  for (const a of analyses) grouped[a.analysisType] = a;
  return grouped;
}

function groupTrending(snapshots) {
  const grouped = {};
  for (const s of snapshots) grouped[s.type] = s.data;
  return grouped;
}

function buildMockDashboard() {
  const today = startOfDay();
  const dayIdx = Math.floor(today.getTime() / 86400000);
  return {
    announcements: seed.GATE_NOTIFICATIONS,
    schedule: seed.EXAM_SCHEDULE,
    examDate: '2027-02-07',
    dailyContent: [
      { type: 'theory', ...seed.DAILY_THEORIES[dayIdx % seed.DAILY_THEORIES.length] },
      { type: 'question', ...seed.DAILY_QUESTIONS[dayIdx % seed.DAILY_QUESTIONS.length] },
      { type: 'formula', ...seed.DAILY_FORMULAS[dayIdx % seed.DAILY_FORMULAS.length] },
      { type: 'pyq', ...seed.DAILY_PYQS[dayIdx % seed.DAILY_PYQS.length] },
    ],
    analyses: buildMockAnalysis(),
    trending: buildMockTrending(),
    psuRecruitments: seed.PSU_RECRUITMENTS,
    mtechAdmissions: seed.MTECH_ADMISSIONS,
    internships: seed.INTERNSHIPS,
    rssFeed: [],
    placementResources: seed.PLACEMENT_RESOURCES,
    studyMaterials: seed.STUDY_MATERIALS,
    lastUpdated: new Date(),
    mock: true,
  };
}

function buildMockDaily() {
  const dayIdx = Math.floor(startOfDay().getTime() / 86400000);
  return [
    { type: 'theory', ...seed.DAILY_THEORIES[dayIdx % seed.DAILY_THEORIES.length] },
    { type: 'question', ...seed.DAILY_QUESTIONS[dayIdx % seed.DAILY_QUESTIONS.length] },
    { type: 'formula', ...seed.DAILY_FORMULAS[dayIdx % seed.DAILY_FORMULAS.length] },
    { type: 'pyq', ...seed.DAILY_PYQS[dayIdx % seed.DAILY_PYQS.length] },
  ];
}

function buildMockAnalysis(type) {
  const all = {
    weightage: { analysisType: 'weightage', data: seed.TOPIC_WEIGHTAGE, yearsCovered: [2010, 2024] },
    marks_distribution: { analysisType: 'marks_distribution', data: seed.MARKS_DISTRIBUTION, yearsCovered: [2010, 2024] },
    frequent_topics: { analysisType: 'frequent_topics', data: seed.FREQUENT_TOPICS, yearsCovered: [2010, 2024] },
    repeated_questions: { analysisType: 'repeated_questions', data: seed.REPEATED_QUESTIONS, yearsCovered: [2010, 2024] },
    important_topics: { analysisType: 'important_topics', data: seed.IMPORTANT_TOPICS, yearsCovered: [2010, 2024] },
  };
  return type ? all[type] : all;
}

function buildMockTrending() {
  return {
    subject_leaderboard: [
      { subject: 'Algorithms', hours: 42.5 },
      { subject: 'Operating Systems', hours: 38.2 },
      { subject: 'DBMS', hours: 35.8 },
      { subject: 'Computer Networks', hours: 31.4 },
    ],
    trending_topics: seed.IMPORTANT_TOPICS.slice(0, 6).map((t) => ({
      topic: t.topic, subject: t.subject, trend: t.trend, score: t.priority === 'high' ? 95 : 75,
    })),
  };
}

function filterMockUpdates(type, category, limit) {
  const all = [
    ...seed.GATE_NOTIFICATIONS,
    ...seed.PSU_RECRUITMENTS,
    ...seed.MTECH_ADMISSIONS,
    ...seed.INTERNSHIPS,
    ...seed.PLACEMENT_RESOURCES,
    ...seed.STUDY_MATERIALS,
  ];
  return all
    .filter((i) => (!type || i.type === type) && (!category || new RegExp(category, 'i').test(i.category)))
    .slice(0, limit);
}

module.exports = router;
