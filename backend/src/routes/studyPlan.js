const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const {
  getAllLocalMockAttempts,
  getLocalMockTests,
  getLocalMockTestById,
  getLocalMistakeEntries,
  getLocalMistakeAggregates,
  getLocalWeeklyTests,
  getLocalWeeklyTestProgress,
} = require('../store/localDataStore');

router.get('/', protect, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const mockAttempts = getAllLocalMockAttempts(userId);
    const mistakes = getLocalMistakeEntries(userId);
    const mistakeAggs = getLocalMistakeAggregates(userId);
    const allTests = getLocalMockTests();
    const weeklyTests = getLocalWeeklyTests();

    const weakTopics = {};
    const strongTopics = {};
    const attemptedTestIds = new Set();

    mockAttempts.forEach(a => {
      attemptedTestIds.add(a.test);
      (a.weakAreas || []).forEach(t => {
        weakTopics[t] = (weakTopics[t] || 0) + 1;
      });
      (a.strongAreas || []).forEach(t => {
        strongTopics[t] = (strongTopics[t] || 0) + 1;
      });
    });

    mistakes.forEach(m => {
      if (m.subject && m.topic) {
        const key = `${m.subject}:${m.topic}`;
        weakTopics[key] = (weakTopics[key] || 0) + 2;
      } else if (m.subject) {
        weakTopics[m.subject] = (weakTopics[m.subject] || 0) + 1;
      }
    });

    const sortedWeak = Object.entries(weakTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => {
        const sep = topic.includes(':');
        return sep
          ? { subject: topic.split(':')[0], topic: topic.split(':')[1], weight: count }
          : { subject: topic, topic: '', weight: count };
      });

    const uncompletedTests = allTests.filter(t => !attemptedTestIds.has(t._id));
    const recommendedTest = uncompletedTests.length > 0
      ? uncompletedTests[Math.floor(Math.random() * uncompletedTests.length)]
      : null;

    const weeklyTestAttempts = [];
    weeklyTests.forEach(wt => {
      const p = getLocalWeeklyTestProgress(userId, wt._id);
      if (p && p.completed) {
        weeklyTestAttempts.push(p);
      }
    });

    const weeklyWeakTopics = {};
    weeklyTestAttempts.forEach(a => {
      if (a.accuracy < 60) {
        weeklyWeakTopics[a.subject || 'General'] = (weeklyWeakTopics[a.subject || 'General'] || 0) + 1;
      }
    });
    Object.entries(weeklyWeakTopics).forEach(([sub, count]) => {
      const existing = sortedWeak.find(w => w.subject === sub);
      if (existing) {
        existing.weight += count;
      } else if (sortedWeak.length < 5) {
        sortedWeak.push({ subject: sub, topic: '', weight: count });
      }
    });

    const planItems = [];
    let totalMinutes = 0;

    sortedWeak.forEach(w => {
      const label = w.topic ? `${w.subject} - ${w.topic}` : w.subject;
      if (w.weight >= 2) {
        planItems.push({
          type: 'revise',
          label: `Revise ${label}`,
          minutes: 20,
          icon: '\uD83D\uDCD6',
        });
        totalMinutes += 20;
      }
      planItems.push({
        type: 'practice',
        label: `Solve PYQs on ${label}`,
        minutes: 15,
        icon: '\u270F\uFE0F',
      });
      totalMinutes += 15;
    });

    if (recommendedTest) {
      const test = getLocalMockTestById(recommendedTest._id) || recommendedTest;
      planItems.push({
        type: 'test',
        label: `Take ${test.title || 'Mock Test'}`,
        minutes: test.duration || 30,
        icon: '\uD83E\uDDEA',
        testId: test._id,
        subject: test.subject,
      });
      totalMinutes += (test.duration || 30);
    }

    const weakSubjectCounts = {};
    sortedWeak.forEach(w => {
      weakSubjectCounts[w.subject] = (weakSubjectCounts[w.subject] || 0) + w.weight;
    });
    const topWeakSubject = Object.entries(weakSubjectCounts).sort((a, b) => b[1] - a[1])[0];

    const lastAttempt = mockAttempts.length > 0
      ? mockAttempts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
      : null;

    const mockCount = mockAttempts.length;
    const avgScore = mockCount
      ? (mockAttempts.reduce((s, a) => s + (a.score || 0), 0) / mockCount)
      : 0;
    const avgAccuracy = mockCount
      ? (mockAttempts.reduce((s, a) => s + (a.accuracy || 0), 0) / mockCount)
      : 0;
    const bestScore = mockCount
      ? Math.max(...mockAttempts.map(a => a.score || 0))
      : 0;

    res.json({
      success: true,
      data: {
        weakTopics: sortedWeak,
        strongTopics: Object.entries(strongTopics).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, c]) => ({ topic: t, count: c })),
        planItems: planItems.slice(0, 8),
        totalMinutes,
        recommendedTest: recommendedTest ? {
          _id: recommendedTest._id,
          title: recommendedTest.title,
          subject: recommendedTest.subject,
          duration: recommendedTest.duration,
          difficulty: recommendedTest.difficulty,
          testType: recommendedTest.testType,
        } : null,
        topWeakSubject: topWeakSubject ? { subject: topWeakSubject[0], weight: topWeakSubject[1] } : null,
        mockStats: {
          count: mockCount,
          avgScore: Math.round(avgScore * 10) / 10,
          avgAccuracy: Math.round(avgAccuracy * 10) / 10,
          bestScore,
          lastScore: lastAttempt?.score || 0,
          lastAccuracy: lastAttempt?.accuracy || 0,
        },
        mistakeStats: {
          total: mistakeAggs.total,
          topCategory: mistakeAggs.topCategory,
          topSubject: mistakeAggs.topSubject,
        },
        readiness: mockCount
          ? Math.round(avgAccuracy * 0.5 + Math.min(100, (mockCount / 10) * 100) * 0.2 + Math.min(100, bestScore) * 0.3)
          : 0,
        predictedRank: predictRank(avgScore),
      },
    });
  } catch (err) {
    next(err);
  }
});

function predictRank(avgScore) {
  const base = 5000;
  const reduction = Math.round(avgScore * 40);
  const air = Math.max(1, base - reduction);
  const low = Math.max(1, Math.round(air * 0.8 / 50) * 50);
  const high = Math.max(low + 50, Math.round(air * 1.2 / 50) * 50);
  return { low, high, label: `${low.toLocaleString()}-${high.toLocaleString()}` };
}

module.exports = router;
