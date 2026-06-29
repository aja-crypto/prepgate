const { MockTestQuestion, MockTest } = require('../models/MockTest');
const { WeeklyTest } = require('../models/WeeklyTest');
const MOCK_SEED = require('../data/mockTestSeed');
const WEEKLY_TESTS_SEED = require('../data/weeklyTestSeed');

async function seedMongoMockData() {
  try {
    const existing = await MockTest.countDocuments();
    if (existing > 0) {
      console.log(`📝 Mock tests already seeded (${existing} tests in MongoDB), skipping`);
    } else {
      await seedMockTests();
    }

    const existingWeekly = await WeeklyTest.countDocuments();
    if (existingWeekly > 0) {
      console.log(`📝 Weekly tests already seeded (${existingWeekly} tests in MongoDB), skipping`);
    } else {
      await seedWeeklyTests();
    }
  } catch (error) {
    console.error('❌ Failed to seed MongoDB data:', error.message);
  }
}

async function seedMockTests() {
  const questions = await MockTestQuestion.insertMany(
    MOCK_SEED.questions.map(q => ({ ...q, isActive: true }))
  );
  console.log(`📝 Seeded ${questions.length} mock questions to MongoDB`);

  const questionMap = {};
  questions.forEach(q => { questionMap[q.subject] = questionMap[q.subject] || []; questionMap[q.subject].push(q); });

  const testsToInsert = MOCK_SEED.tests.map(t => {
    let pool = questionMap[t.subject] || [];

    if (t.testType === 'topic') {
      let topicPool = pool.filter(q => q.topic === t.topic);
      if (topicPool.length < 2) {
        topicPool = pool.filter(q =>
          (t.topic || '').split('&').some(kw => (q.topic || '').toLowerCase().includes(kw.trim().toLowerCase()))
        );
      }
      const byDiff = topicPool.filter(q => q.difficulty === t.difficulty);
      pool = byDiff.length >= 3 ? byDiff : topicPool;
    } else {
      const byDiff = pool.filter(q => q.difficulty === t.difficulty);
      pool = byDiff.length >= 3 ? byDiff : pool;
    }

    const qIds = pool.slice(0, t.questionCount).map(q => q._id);
    const marks = qIds.reduce((sum, id) => {
      const q = questions.find(qq => qq._id.toString() === id.toString());
      return sum + (q ? q.marks : 1);
    }, 0);

    return {
      subject: t.subject,
      subjectName: t.subjectName,
      testType: t.testType,
      topic: t.topic || '',
      testNumber: t.testNumber,
      title: t.title,
      description: t.description,
      duration: t.duration,
      totalMarks: marks || t.totalMarks,
      questionCount: t.questionCount,
      difficulty: t.difficulty,
      topics: t.topics || [],
      questionIds: qIds,
      isActive: true,
    };
  });

  await MockTest.insertMany(testsToInsert);
  console.log(`📝 Seeded ${testsToInsert.length} mock tests to MongoDB`);
}

async function seedWeeklyTests() {
  const now = new Date();
  const testsToInsert = WEEKLY_TESTS_SEED.map(t => ({
    ...t,
    pdfUrl: `/resources/weekly-tests/${t.subject}/Test-${String(t.testNumber).padStart(2, '0')}.pdf`,
    isActive: true,
  }));

  await WeeklyTest.insertMany(testsToInsert);
  console.log(`📝 Seeded ${testsToInsert.length} weekly tests to MongoDB`);
}

module.exports = { seedMongoMockData };