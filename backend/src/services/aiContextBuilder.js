// src/services/aiContextBuilder.js
// Builds a complete AI context from the user's REAL backend data.
// This is the server-side source of truth for the AI Mentor — it reads
// progress, profile, roadmap, analytics and enriches every AI request
// so personalization never depends on what the frontend happens to send.

const { isMockAuthEnabled } = require('../config/devMode');

function computeWeakSubjects(pyqs = []) {
  if (!pyqs.length) return [];
  const acc = {};
  pyqs.forEach(p => {
    if (!acc[p.subject]) acc[p.subject] = { correct: 0, total: 0 };
    acc[p.subject].total++;
    if (p.isCorrect) acc[p.subject].correct++;
  });
  return Object.entries(acc)
    .filter(([, d]) => d.total >= 3 && d.correct / d.total < 0.6)
    .map(([s]) => s);
}

function computeStrongSubjects(pyqs = []) {
  if (!pyqs.length) return [];
  const acc = {};
  pyqs.forEach(p => {
    if (!acc[p.subject]) acc[p.subject] = { correct: 0, total: 0 };
    acc[p.subject].total++;
    if (p.isCorrect) acc[p.subject].correct++;
  });
  return Object.entries(acc)
    .filter(([, d]) => d.total >= 3 && d.correct / d.total >= 0.75)
    .map(([s]) => s);
}

function computeWeakTopics(topics = [], pyqs = []) {
  const topicNames = new Set((topics || []).map(t => t.name));
  const acc = {};
  pyqs.forEach(p => {
    const key = p.topic || p.name;
    if (!key) return;
    acc[key] = acc[key] || { correct: 0, total: 0, subject: p.subject };
    acc[key].total++;
    if (p.isCorrect) acc[key].correct++;
  });
  const byAccuracy = Object.entries(acc)
    .filter(([, d]) => d.total >= 2 && d.correct / d.total < 0.6)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .map(([name, d]) => ({ name, subject: d.subject, accuracy: Math.round((d.correct / d.total) * 100) }));

  // Fall back to topics marked difficult or flagged revision-needed
  if (!byAccuracy.length) {
    const flagged = (topics || [])
      .filter(t => t.markedDifficult || t.revisionNeeded)
      .slice(0, 5)
      .map(t => ({ name: t.name, subject: t.subject, accuracy: null }));
    if (flagged.length) return flagged;
    return (topics || []).slice(0, 5).map(t => ({ name: t.name, subject: t.subject, accuracy: null }));
  }
  return byAccuracy.slice(0, 5);
}

function computeOverallProgress(topics = []) {
  if (!topics.length) return 0;
  return Math.round(topics.reduce((s, t) => s + (t.completed ? 100 : 0), 0) / topics.length);
}

function computeSubjectProgress(subjects = []) {
  return (subjects || []).map(s => ({
    name: s.name,
    progress: s.progress || s.completionPercentage || 0,
    confidence: s.confidence || null,
  }));
}

const GATE_SUBJECTS = [
  'Engineering Mathematics', 'Digital Logic', 'Computer Organization', 'Programming & DS', 'Algorithms',
  'Operating Systems', 'DBMS', 'Computer Networks', 'Theory of Computation', 'Compiler Design',
];

// Normalize subject names from various data sources to the canonical GATE set.
function normalizeSubject(name) {
  const n = (name || '').trim().toLowerCase();
  if (n.includes('computer organization') || n.includes('computer architecture') || n.includes('coa') || n.includes('computer org')) return 'Computer Organization & Architecture';
  if (n.includes('programming') || n.includes('data structure') || n.includes('dsa')) return 'Programming & DS';
  if (n.includes('theory of computation') || n.includes('toc') || n.includes('automata')) return 'Theory of Computation';
  if (n.includes('operating system') || n === 'os') return 'Operating Systems';
  if (n.includes('database') || n === 'dbms') return 'DBMS';
  if (n.includes('computer network') || n.includes('cn')) return 'Computer Networks';
  if (n.includes('engineering math') || n.includes('engineering mathematics')) return 'Engineering Mathematics';
  if (n.includes('digital logic') || n.includes('digital') || n.includes('dl')) return 'Digital Logic';
  if (n.includes('algorithm')) return 'Algorithms';
  if (n.includes('compiler')) return 'Compiler Design';
  if (n.includes('aptitude') || n.includes('general')) return 'General Aptitude';
  return name || 'General';
}

// Data-driven roadmap: subject progression + month timeline to exam + milestones
// + on-track intelligence + AI narrative. Two students almost never see the same
// roadmap because it is computed entirely from their own data.
function computeRoadmap(context) {
  const topics = context.topics || [];
  const pyqs = context.pyqs || [];
  const mocks = context.mocks || [];
  const studyStats = context.studyStats || {};
  const revisionSchedule = context.revisionSchedule || [];
  const gateFeatures = context.gateFeatures || {};
  const examDate = gateFeatures.examDate || '2027-02-07T09:00:00';
  const dailyTarget = context.dailyTargetHours || gateFeatures.dailyTarget?.hours || 8;

  const topicTotal = topics.length;
  const topicDone = topics.filter(t => t.completed || t.done).length;
  const topicCompletion = topicTotal ? Math.round((topicDone / topicTotal) * 100) : 0;

  const pyqCorrect = pyqs.filter(p => p.isCorrect).length;
  const accuracy = pyqs.length ? Math.round((pyqCorrect / pyqs.length) * 100) : 0;

  const mockAvg = mocks.length ? Math.round(mocks.reduce((s, m) => s + (m.score || 0), 0) / mocks.length) : 0;

  const weeklyHours = Array.isArray(studyStats.weeklyHours) ? studyStats.weeklyHours : [];
  const recentWeeks = weeklyHours.slice(-4);
  const avgWeeklyHours = recentWeeks.length
    ? recentWeeks.reduce((a, b) => a + b, 0) / recentWeeks.length
    : (studyStats.weekHours || 0);

  // ── 1. Subject-level progression (the real roadmap) ──
  const subjects = [];
  const subjectTopicCount = {};
  const subjectTopicDone = {};
  const subjectPyq = {};
  (topics || []).forEach(t => {
    const s = normalizeSubject(t.subject) || 'General';
    subjectTopicCount[s] = (subjectTopicCount[s] || 0) + 1;
    if (t.completed || t.done) subjectTopicDone[s] = (subjectTopicDone[s] || 0) + 1;
  });
  (pyqs || []).forEach(p => {
    const s = normalizeSubject(p.subject) || 'General';
    subjectPyq[s] = subjectPyq[s] || { total: 0, correct: 0 };
    subjectPyq[s].total++;
    if (p.isCorrect) subjectPyq[s].correct++;
  });

  const allSubjectKeys = new Set([
    ...Object.keys(subjectTopicCount), ...Object.keys(subjectPyq),
    ...(Array.isArray(studyStats.subjects) ? studyStats.subjects.map(s => normalizeSubject(s.name)) : []),
  ]);

  for (const sName of allSubjectKeys) {
    const topicN = subjectTopicCount[sName] || 0;
    const topicD = subjectTopicDone[sName] || 0;
    const topicPct = topicN ? Math.round((topicD / topicN) * 100) : 0;
    const pq = subjectPyq[sName] || { total: 0, correct: 0 };
    const pqAcc = pq.total ? Math.round((pq.correct / pq.total) * 100) : null;
    const base = topicPct;
    const accAdjust = pqAcc != null ? Math.round((pqAcc - 50) * 0.3) : 0;
    const progress = Math.max(0, Math.min(100, base + accAdjust));
    const status = progress >= 80 ? 'mastered' : progress >= 40 ? 'in-progress' : 'not-started';
    subjects.push({
      name: sName,
      progress,
      topicsDone: topicD,
      topicsTotal: topicN,
      pyqAccuracy: pqAcc,
      pyqsAttempted: pq.total,
      status,
    });
  }
  subjects.sort((a, b) => a.progress - b.progress);

  const mastered = subjects.filter(s => s.status === 'mastered').length;
  const weakestSubject = subjects[0] || null;
  const overall = subjects.length ? Math.round(subjects.reduce((s, x) => s + x.progress, 0) / subjects.length) : topicCompletion;

  // ── 2. Month timeline to exam ──
  const timeline = [];
  const examD = new Date(examDate);
  const now = new Date();
  // Build from the current month up to (and including) the exam month.
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(examD.getFullYear(), examD.getMonth(), 1);
  let cursor = startMonth;
  let safety = 0;
  while (cursor <= endMonth && safety < 12) {
    const isCurrent = cursor.getMonth() === now.getMonth() && cursor.getFullYear() === now.getFullYear();
    const isPast = !isCurrent && (cursor < new Date(now.getFullYear(), now.getMonth(), 1));
    const isExam = cursor.getMonth() === examD.getMonth() && cursor.getFullYear() === examD.getFullYear();
    const monthsBeforeExam = (endMonth.getFullYear() - cursor.getFullYear()) * 12 + (endMonth.getMonth() - cursor.getMonth());
    const phase =
      monthsBeforeExam >= 5 ? 'Core Subjects'
      : monthsBeforeExam === 4 ? 'Advanced Topics'
      : monthsBeforeExam === 3 ? 'PYQs + Revision'
      : monthsBeforeExam === 2 ? 'Subject Tests / Mocks'
      : monthsBeforeExam === 1 ? 'Final Revision'
      : 'GATE Exam';
    timeline.push({
      month: cursor.toLocaleString('en-US', { month: 'short' }),
      phase,
      status: isCurrent ? 'current' : isPast ? 'completed' : 'upcoming',
      isExam,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    safety++;
  }
  const currentTimelineMonth = timeline.find(t => t.status === 'current');

  // ── 3. On-track intelligence ──
  // Expected progress if pacing perfectly toward exam
  const daysTotal = Math.max(1, Math.round((examD - new Date(examD.getFullYear() - 1, examD.getMonth(), 1)) / 86400000));
  const daysElapsed = Math.max(0, Math.round((now - new Date(examD.getFullYear() - 1, examD.getMonth(), 1)) / 86400000));
  const expectedPct = Math.min(100, Math.round((daysElapsed / daysTotal) * 100));
  const onTrack = overall >= expectedPct - 8;
  const behindBy = Math.max(0, expectedPct - overall);

  // Study hours needed to catch up: roughly 1.2 subjects per month, ~2h/day/subject
  const subjectsLeft = subjects.filter(s => s.progress < 80).length;
  const daysToExam = Math.max(0, Math.round((examD - now) / 86400000));
  const totalHoursNeeded = Math.max(0, Math.round(subjectsLeft * 35));
  const dailyHoursNeeded = daysToExam > 0 ? totalHoursNeeded / daysToExam : 0;
  const feasible = dailyHoursNeeded <= Math.max(dailyTarget, 1);
  const probability = Math.max(40, Math.min(97, Math.round(100 - behindBy * 1.2 - (dailyHoursNeeded > dailyTarget ? 15 : 0))));

  // ── 4. Milestones ──
  const milestones = [
    { title: `Complete ${weakestSubject?.name || 'first core subject'}`, unlocked: false, xp: 120, reward: 'Unlock subject mock test' },
    { title: 'Finish first core subject', unlocked: mastered >= 1, xp: 120, reward: 'Badge: First Blood' },
    { title: 'Master 3 core subjects', unlocked: mastered >= 3, xp: 200, reward: 'Badge: Core Crusher' },
    { title: 'Attempt 3 mock tests', unlocked: (mocks || []).length >= 3, xp: 150, reward: 'Badge: Exam Ready' },
    { title: 'Complete 100 PYQs', unlocked: (pyqs || []).length >= 100, xp: 180, reward: 'Badge: PYQ Pro' },
  ];
  const nextMilestone = milestones.find(m => !m.unlocked);

  // ── 5. AI narrative ──
  const currentPhaseLabel = currentTimelineMonth?.phase || 'Core Subjects';
  let narrative;
  if (subjectsLeft === 0) {
    narrative = `Excellent — all subjects above 80%! You're exam-ready. Focus on full-length mocks and revision.`;
  } else if (onTrack) {
    narrative = `You're right on schedule for ${examD.toLocaleString('en-US', { month: 'long' })} ${examD.getFullYear()}. At ${Math.round(avgWeeklyHours)}h/week you're tracking well. Priority: ${weakestSubject?.name || 'your weakest subject'}.`;
  } else {
    const nextMonthLabel = currentTimelineMonth
      ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleString('en-US', { month: 'short' })
      : 'next month';
    narrative = `You're slightly behind your ${currentTimelineMonth?.month || 'this month'} schedule. If you study ${dailyHoursNeeded.toFixed(1)}h daily for the next ${Math.min(30, daysToExam)} days, you'll catch up on ${weakestSubject?.name || 'core subjects'} before ${nextMonthLabel}.`;
  }

  return {
    currentStage: weakestSubject?.name || 'Core Subjects',
    currentStageLabel: `Focus: ${weakestSubject?.name || 'Core Subjects'}`,
    completion: overall,
    overall,
    topicCompletion,
    accuracy,
    mockAvg,
    nextMilestone: nextMilestone ? nextMilestone.title : 'All milestones unlocked',
    nextMilestoneReward: nextMilestone ? nextMilestone.reward : null,
    subjects,
    masteredSubjects: mastered,
    totalSubjects: subjects.length,
    timeline,
    currentMonth: currentTimelineMonth?.month || null,
    currentPhase: currentTimelineMonth?.phase || null,
    daysToExam,
    examDate: examD.toISOString().slice(0, 10),
    onTrack,
    behindBy,
    avgWeeklyHours: Math.round(avgWeeklyHours),
    dailyHoursNeeded: Math.round(dailyHoursNeeded * 10) / 10,
    probability,
    milestones,
    weakestSubject: weakestSubject?.name || null,
    weakestTopic: (context.weakTopics || [])[0]?.name || null,
    narrative,
    factors: { topicCompletion, accuracy, mockAvg, avgWeeklyHours: Math.round(avgWeeklyHours), subjectsLeft },
  };
}

function computeJourney(context) {
  const weak = context.weakTopics || [];
  const weakSubjects = context.weakSubjects || [];
  const overdue = context.overdueTopics || 0;
  const mockAvg = context.mockAvg || 0;
  const mocks = context.mocks || [];
  const roadmap = context.roadmap || {};
  const accuracy = context.recentAccuracy || 0;

  const sessions = [];

  if (weak.length) {
    sessions.push({
      type: 'revision',
      title: `Revise ${weak[0].name}`,
      detail: `${weak[0].subject || 'Syllabus'} — accuracy ${weak[0].accuracy != null ? weak[0].accuracy + '%' : 'needs work'}. Focus on the missed concepts first.`,
      duration: 20,
    });
  }
  if (weak.length) {
    sessions.push({
      type: 'pyq',
      title: `Solve ${weak.length >= 2 ? 10 : 8} PYQs: ${weak[0].name}`,
      detail: `Target accuracy above 60% in ${weak[0].name}. Review each wrong answer.`,
      duration: 35,
    });
  }
  if (weakSubjects.length) {
    sessions.push({
      type: 'mistake',
      title: 'Mistake Review',
      detail: `Analyze wrong answers in ${weakSubjects[0]} — find the pattern (concept gap vs careless).`,
      duration: 15,
    });
  }
  if (overdue > 0) {
    sessions.push({
      type: 'revision',
      title: `Revise ${overdue} overdue topic(s)`,
      detail: 'Spaced repetition — recall today to lock it in.',
      duration: 30,
    });
  } else {
    sessions.push({
      type: 'quiz',
      title: 'Quick Quiz',
      detail: `${weak[0]?.name || 'Today\'s topic'} — 5 rapid questions to confirm retention.`,
      duration: 10,
    });
  }
  if (mocks.length === 0) {
    sessions.push({
      type: 'mock',
      title: 'Take your first mock',
      detail: 'Establish a baseline before deep revision.',
      duration: 180,
    });
  }

  const totalMinutes = sessions.reduce((s, x) => s + x.duration, 0);
  const targetTopic = weak[0]?.name || 'core topics';
  const expectedImprovement = weak[0]?.accuracy != null && weak[0].accuracy < 60
    ? `+${Math.min(15, Math.round((60 - weak[0].accuracy) * 0.25))}% accuracy in ${targetTopic}`
    : `Solidify ${targetTopic} retention`;

  return {
    steps: sessions,
    total: sessions.length,
    completed: 0,
    totalMinutes,
    goal: `Reach 70% accuracy in ${targetTopic}`,
    expectedImprovement,
    roadmapImpact: roadmap.nextMilestone ? `Advances: ${roadmap.nextMilestone}` : 'Advances your roadmap',
  };
}

function computeAnalytics(context) {
  const studyStats = context.studyStats || {};
  const pyqs = context.pyqs || [];
  const mocks = context.mocks || [];
  const total = pyqs.length;
  const correct = pyqs.filter(p => p.isCorrect).length;
  return {
    studyHours: {
      today: studyStats.todayHours || 0,
      week: studyStats.weekHours || 0,
      weeklyHours: studyStats.weeklyHours || [],
    },
    accuracy: total ? Math.round((correct / total) * 100) : context.recentAccuracy || 0,
    pyqsAttempted: total,
    pyqsCorrect: correct,
    revisionCount: (context.revisionSchedule || []).reduce((s, r) => s + (r.revisionCount || 0), 0),
    overdueRevisions: context.overdueTopics || 0,
    mocksAttempted: (mocks || []).length,
    mockAvg: context.mockAvg || 0,
  };
}

function computeRecommendations(context) {
  const weakTopics = context.weakTopics || [];
  const weakSubjects = context.weakSubjects || [];
  const overdue = context.overdueTopics || 0;
  const mockAvg = context.mockAvg || 0;
  const accuracy = context.recentAccuracy || 0;
  const roadmap = context.roadmap || {};
  const analytics = context.analytics || {};
  const pyqs = context.pyqs || [];
  const recs = [];

  if (weakTopics.length) {
    const t = weakTopics[0];
    const tPyqs = pyqs.filter(p => (p.topic || p.name) === t.name);
    const tCorrect = tPyqs.filter(p => p.isCorrect).length;
    const tAccuracy = tPyqs.length ? Math.round((tCorrect / tPyqs.length) * 100) : t.accuracy;
    const impact = tAccuracy < 40 ? 4 : tAccuracy < 60 ? 3 : 2;
    recs.push({
      type: 'study',
      title: `Focus on ${t.name}`,
      content: `${t.name}${t.subject ? ` (${t.subject})` : ''} is your weakest topic. Relearn the concept, then solve targeted PYQs.`,
      priority: 'high',
      why: [
        `Accuracy in ${t.name}: ${tAccuracy}%${t.accuracy != null && tAccuracy !== t.accuracy ? ` (recent ${t.accuracy}%)` : ''}`,
        `${tPyqs.length} attempted, ${tCorrect} correct — gaps in ${t.name}`,
        `${t.subject || 'This'} appears in GATE every year (high weightage)`,
      ],
      expectedImpact: `+${impact} marks`,
      time: `${Math.max(25, Math.round(impact * 10))} min`,
      confidence: Math.min(92, Math.round(60 + (accuracy > 0 ? 15 : 0) + tPyqs.length * 2)),
    });
  }
  if (overdue > 0) {
    recs.push({
      type: 'revision',
      title: `Revise ${overdue} overdue topic(s)`,
      content: 'Spaced repetition beats cramming — recall today to lock it in.',
      priority: 'high',
      why: [
        `${overdue} topic(s) flagged for revision`,
        'Reviewing now improves long-term retention ~2x',
      ],
      expectedImpact: `+${Math.min(3, overdue)} marks`,
      time: '30 min',
      confidence: Math.min(90, 75 + overdue * 2),
    });
  }
  if (weakSubjects.length) {
    const s = weakSubjects[0];
    const sPyqs = pyqs.filter(p => p.subject === s);
    const sCorrect = sPyqs.filter(p => p.isCorrect).length;
    const sAcc = sPyqs.length ? Math.round((sCorrect / sPyqs.length) * 100) : 0;
    recs.push({
      type: 'practice',
      title: `Improve ${s} accuracy`,
      content: `Your accuracy in ${s} is below 60%. Solve mixed PYQs and analyze mistakes by pattern.`,
      priority: 'medium',
      why: [
        `${s} accuracy: ${sAcc}% (${sPyqs.length} PYQs)`,
        'Below the 60% target',
        'GATE allocates significant marks here',
      ],
      expectedImpact: '+2 to +4 marks',
      time: '45 min',
      confidence: Math.min(85, 60 + (sPyqs.length || 0) * 2),
    });
  }
  if (mockAvg > 0 && mockAvg < 75) {
    recs.push({
      type: 'mock',
      title: 'Mock performance needs work',
      content: 'Review wrong answers and focus on time management.',
      priority: 'medium',
      why: [
        `Current mock average: ${mockAvg}%`,
        'Target: 80%+ for safe GATE scores',
        'Analyze time spent vs marks lost',
      ],
      expectedImpact: '+4 to +6 marks',
      time: '45 min',
      confidence: 80,
    });
  }
  if (!recs.length) {
    recs.push({
      type: 'next',
      title: 'Start with core subjects',
      content: 'Begin with Operating Systems and DBMS — high weightage, high reward for GATE CSE.',
      priority: 'low',
      why: ['New preparation — build fundamentals first', 'OS + DBMS together carry ~30% of GATE CSE marks'],
      expectedImpact: '+5 marks',
      time: '60 min',
      confidence: 70,
    });
  }
  return recs;
}

function computePrediction(context) {
  const mockAvg = context.mockAvg || 0;
  const overall = context.overallProgress || 0;
  const accuracy = context.recentAccuracy || 0;
  const roadmap = context.roadmap || {};
  const completion = roadmap.completion != null ? roadmap.completion : overall;
  const base = Math.round(20 + mockAvg * 0.45 + accuracy * 0.2 + completion * 0.35);
  const expectedScore = Math.min(100, Math.max(0, base));
  const air = expectedScore > 0 ? Math.max(50, Math.round(100000 * Math.pow(0.5, expectedScore / 25))) : 0;
  const improvement = Math.min(25, Math.round((100 - expectedScore) * 0.18));
  return {
    expectedScore,
    air,
    confidence: Math.min(85, Math.round(35 + Math.min(mockAvg, 100) * 0.4)),
    improvementEstimate: expectedScore > 0 ? `+${improvement} marks with consistent revision` : 'Complete more topics to get a prediction',
    improvementAir: improvement > 0 ? Math.max(0, Math.round(air * (1 - Math.min(0.35, improvement / 100)))) : air,
    drivers: {
      scoreFromMock: Math.round(mockAvg * 0.45),
      scoreFromAccuracy: Math.round(accuracy * 0.2),
      scoreFromCompletion: Math.round(completion * 0.35),
    },
  };
}

function buildDailyBrief(context) {
  const analytics = context.analytics || {};
  const weakTopics = context.weakTopics || [];
  const roadmap = context.roadmap || {};
  const prediction = context.prediction || {};
  const journey = context.journey || {};
  const accuracy = analytics.accuracy || 0;
  const today = context.studyHoursToday || 0;
  const week = context.studyHoursWeek || 0;
  const target = context.dailyTargetHours || 8;

  const parts = [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  parts.push(`${greeting}, ${context.name || 'aspirant'}.`);

  if (weakTopics.length) {
    parts.push(`Yesterday's weak spot: ${weakTopics[0].name} (accuracy ${weakTopics[0].accuracy != null ? weakTopics[0].accuracy + '%' : 'needs attention'}).`);
  }
  if (accuracy > 0) {
    parts.push(`Your PYQ accuracy is ${accuracy}%.`);
  }
  if (today > 0) {
    parts.push(`You've logged ${today}h today; ${Math.max(0, target - today).toFixed(1)}h to reach your ${target}h target.`);
  } else {
    parts.push(`You haven't logged study time yet today — ${target}h target is open.`);
  }

  let recommendation;
  if (journey.steps && journey.steps.length) {
    const first = journey.steps[0]?.title || '';
    const second = journey.steps[1]?.title || 'solve PYQs';
    recommendation = `I recommend: ${first.toLowerCase().startsWith('revise') ? first : 'revise ' + first}, then ${second}.`;
  } else {
    recommendation = 'Start with your weakest subject and build momentum.';
  }
  parts.push(recommendation);

  if (prediction.improvementEstimate) {
    parts.push(`Estimated impact: ${prediction.improvementEstimate} if you stay consistent.`);
  }
  if (roadmap.nextMilestone) {
    parts.push(`Roadmap next: ${roadmap.nextMilestone}.`);
  }

  return {
    greeting,
    summary: parts.join(' '),
    focusAreas: weakTopics.slice(0, 3).map(t => ({
      topic: t.name,
      subject: t.subject,
      accuracy: t.accuracy,
    })),
    estimatedTime: journey.totalMinutes ? `${Math.round(journey.totalMinutes / 60)}h ${journey.totalMinutes % 60}m` : null,
    predictedImprovement: prediction.improvementEstimate || null,
    linkedStats: {
      studyHoursToTarget: today > 0 ? Math.max(0, target - today) : target,
      weeklyHours: week,
      roadmapCompletion: roadmap.completion != null ? roadmap.completion : null,
      predictionAir: prediction.air || null,
    },
  };
}

/**
 * Build the complete AI context from the user's real data.
 * In mock mode reads req.user.progressBackup.data (synced from frontend).
 * In Mongo mode reads the Progress/StudyLog/MockTest models.
 */
async function buildContextForUser(user) {
  if (!user) return null;

  // Load raw progress data (server-side source of truth)
  let data = null;
  if (user.progressBackup?.data) {
    data = user.progressBackup.data;
  } else if (isMockAuthEnabled()) {
    const mockStore = require('../store/mockStore');
    const fresh = mockStore.findById(user._id);
    data = fresh?.progressBackup?.data || null;
  }

  if (!data) {
    // Mongo mode: load from models
    try {
      const { isMongoConnected } = require('../config/db');
      if (isMongoConnected()) {
        const Progress = require('../models/Progress').default || require('../models/Progress');
        const p = await Progress.findOne({ user: user._id }).lean();
        if (p) data = p;
      }
    } catch (e) {
      console.error('[aiContextBuilder] Mongo progress load failed:', e.message);
    }
  }

  const topics = data?.topics || [];
  const pyqs = data?.pyqs || [];
  const mocks = data?.mocks || [];
  const studyStats = data?.studyStats || {};
  const gateFeatures = data?.gateFeatures || {};
  const revisionSchedule = data?.revisionSchedule || [];
  const subjects = studyStats.subjects || [];

  const weakSubjects = computeWeakSubjects(pyqs);
  const strongSubjects = computeStrongSubjects(pyqs);
  const weakTopics = computeWeakTopics(topics, pyqs);
  const overallProgress = computeOverallProgress(topics);
  const avgMock = mocks.length ? Math.round(mocks.reduce((s, m) => s + (m.score || 0), 0) / mocks.length) : 0;
  const overdueTopics = (topics || []).filter(t => t.revisionNeeded).length || revisionSchedule.filter(r => r.revisionNeeded).length;

  const base = {
    // Student Profile
    name: user.name || user.email?.split('@')[0] || 'Student',
    email: user.email || null,
    targetYear: user.targetYear || 2027,
    dailyTargetHours: gateFeatures.dailyTarget?.hours || user.studyGoalHours || 8,
    weeklyGoalHours: gateFeatures.weeklyGoal?.hours || 50,
    studyHoursToday: studyStats.todayHours || 0,
    studyHoursWeek: studyStats.weekHours || 0,
    streak: gateFeatures.streak?.current || studyStats.streak?.current || 0,
    longestStreak: gateFeatures.streak?.longest || studyStats.streak?.longest || 0,
    preferences: user.preferences || {},
    isPremium: !!user.isPremium,
    role: user.role || 'user',

    // Student Progress
    overallProgress,
    subjectProgress: computeSubjectProgress(subjects),
    topicCompletion: {
      total: topics.length,
      completed: topics.filter(t => t.completed).length,
    },
    weakTopics,
    weakSubjects,
    strongSubjects,
    recentAccuracy: computeAnalytics({ studyStats, pyqs, mocks, recentAccuracy: 0 }).accuracy,

    // Data arrays (for analytics/roadmap computation)
    topics,
    pyqs,
    mocks,
    studyStats,
    gateFeatures,
    revisionSchedule,
    subjects,
    overdueTopics,

    // Derived metrics
    mockAvg: avgMock,
    daysToExam: gateFeatures.daysToExam || null,
  };

  // Roadmap (derived from progress)
  const roadmap = computeRoadmap(base);
  // Daily Journey (dynamic, based on roadmap + progress + pending tasks)
  const journey = computeJourney({ ...base, roadmap });
  // Analytics
  const analytics = computeAnalytics(base);
  // Recommendations (derived from analytics + weak topics + roadmap)
  const recommendations = computeRecommendations({ ...base, roadmap, analytics });
  // Prediction
  const prediction = computePrediction({ ...base, roadmap });

  const contextBase = {
    ...base,
    roadmap,
    journey,
    recommendations,
    analytics,
    prediction,
    contextBuilt: true,
    source: 'backend',
  };

  // Daily Brief — the AI coach's live narrative connecting all stats
  contextBase.dailyBrief = buildDailyBrief(contextBase);

  return contextBase;
}

module.exports = { buildContextForUser };
