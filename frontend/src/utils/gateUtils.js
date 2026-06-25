// GATE-specific feature utilities – AIR predictor, weak topics, streak, completion

export const DEFAULT_EXAM_DATE = '2027-02-07T09:00:00';

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Score (0–100) → estimated percentile → AIR for ~1.5L CSE candidates */
export function predictAIR(score) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  let percentile;
  if (s >= 75) percentile = 99 + (s - 75) * 0.04;
  else if (s >= 65) percentile = 95 + (s - 65) * 0.4;
  else if (s >= 55) percentile = 85 + (s - 55) * 1.0;
  else if (s >= 45) percentile = 70 + (s - 45) * 1.5;
  else if (s >= 35) percentile = 50 + (s - 35) * 2.0;
  else percentile = Math.max(5, s * 1.4);

  percentile = Math.min(99.9, Math.max(1, percentile));
  const totalCandidates = 150000;
  const air = Math.max(1, Math.round(totalCandidates * (1 - percentile / 100)));

  return {
    score: s,
    percentile: Math.round(percentile * 10) / 10,
    air,
    label: air <= 100 ? 'Excellent' : air <= 500 ? 'Very Good' : air <= 2000 ? 'Good' : air <= 10000 ? 'Average' : 'Needs Improvement',
  };
}

/** Compute subject completion % from topics + PYQs */
export function computeSubjectCompletion(subjects, topics, pyqs) {
  const safeSubjects = subjects || [];
  const safeTopics = topics || [];
  const safePyqs = pyqs || [];
  return safeSubjects.map((sub) => {
    const subTopics = safeTopics.filter((t) => t.subject === sub.name || sub.name.includes(t.subject) || t.subject.includes(sub.name.split(' ')[0]));
    const subPyqs = safePyqs.filter((p) => p.subject === sub.name || sub.name.includes(p.subject) || p.subject.includes(sub.name.split(' ')[0]));

    const topicPct = subTopics.length ? (subTopics.filter((t) => t.done).length / subTopics.length) * 100 : sub.progress || 0;
    const pyqPct = subPyqs.length ? (subPyqs.filter((p) => p.solved).length / subPyqs.length) * 100 : sub.progress || 0;
    const progress = Math.round((topicPct * 0.6 + pyqPct * 0.4));
    const color = progress >= 70 ? '#06d6a0' : progress >= 30 ? '#ff9f43' : '#ff6b6b';

    return { ...sub, progress, topicPct: Math.round(topicPct), pyqPct: Math.round(pyqPct), color };
  });
}

export const REVISION_STEPS = [
  { stage: 1, label: 'Revision 1', intervalDays: 3 },
  { stage: 2, label: 'Revision 2', intervalDays: 7 },
  { stage: 3, label: 'Revision 3', intervalDays: 15 },
  { stage: 4, label: 'Revision 4', intervalDays: 30 },
];

export function getRevisionStageMeta(stage = 1) {
  return REVISION_STEPS.find((s) => s.stage === stage) || REVISION_STEPS[0];
}

export function getNextRevisionStage(stage = 1) {
  return REVISION_STEPS.find((s) => s.stage === stage + 1) || null;
}

export function computeRevisionHealth(revisionSchedule = []) {
  if (!revisionSchedule.length) return { label: 'Poor', score: 0, missed: 0, today: 0, upcoming: 0 };
  const counts = revisionSchedule.reduce((acc, item) => {
    const status = item.status === 'done' ? 'done' : getRevisionStatus(item.dueDate);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const missed = counts.missed || 0;
  const today = counts.today || 0;
  const done = counts.done || 0;
  const score = Math.max(0, Math.min(100, Math.round(((done + today * 0.5) / revisionSchedule.length) * 100) - missed * 10));
  return {
    label: score >= 75 ? 'Good' : score >= 45 ? 'Average' : 'Poor',
    score,
    missed,
    today,
    upcoming: counts.upcoming || 0,
  };
}

export function computeConsistencyScore(studyStats = {}, gateFeatures = {}) {
  const weeklyHours = Array.isArray(studyStats.weeklyHours) ? studyStats.weeklyHours : [];
  const activeDays = weeklyHours.filter((h) => h > 0).length;
  const weeklyTarget = gateFeatures.weeklyGoal?.hours || 50;
  const totalHours = weeklyHours.reduce((s, h) => s + h, 0);
  const hourScore = Math.min(60, Math.round((totalHours / weeklyTarget) * 60));
  const dayScore = Math.min(40, Math.round((activeDays / 7) * 40));
  return Math.min(100, hourScore + dayScore);
}

export function predictRankRange(score) {
  const { air } = predictAIR(score);
  const low = Math.max(1, Math.round(air * 0.8 / 50) * 50);
  const high = Math.max(low + 50, Math.round(air * 1.2 / 50) * 50);
  return { low, high, label: `${low.toLocaleString()}-${high.toLocaleString()}` };
}

export function computeStudyPace(studyStats = {}, topics = [], gateFeatures = {}) {
  const weeklyHours = Array.isArray(studyStats.weeklyHours) ? studyStats.weeklyHours : [];
  const activeDays = Math.max(1, weeklyHours.filter((h) => h > 0).length || Object.keys(gateFeatures.streak?.activityLog || {}).length || 1);
  const totalHours = weeklyHours.reduce((s, h) => s + h, 0) || studyStats.weekHours || 0;
  const hoursPerDay = Math.round((totalHours / activeDays) * 10) / 10;
  const completed = topics.filter((t) => t.done).length;
  const remaining = topics.length - completed;
  const topicRate = Math.max(0.2, completed / activeDays);
  const daysNeeded = Math.ceil(remaining / topicRate);
  const completionDate = remaining > 0 ? new Date(Date.now() + daysNeeded * 86400000) : new Date();
  return {
    hoursPerDay,
    completionDate: completionDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    daysNeeded,
  };
}

export function getMistakePatternSummary(pyqs = []) {
  const mistakes = pyqs.filter((p) => p.mistakeType || p.status === 'incorrect' || p.markedDifficult);
  const counts = mistakes.reduce((acc, p) => {
    const key = p.mistakeType || 'Unclassified';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return {
    total: mistakes.length,
    counts,
    dominant: top ? top[0] : 'None',
  };
}

export function buildWeakRecoveryPlans(subjects = [], topics = [], pyqs = []) {
  const bySubjectAccuracy = subjects.map((subject) => {
    const subjectPyqs = pyqs.filter((p) => p.subject === subject.name || subject.name.includes(p.subject));
    const solved = subjectPyqs.filter((p) => p.solved).length;
    const accuracy = subjectPyqs.length ? Math.round((solved / subjectPyqs.length) * 100) : subject.progress || 0;
    const incomplete = topics.find((t) => t.subject === subject.name && !t.done);
    return {
      topic: incomplete?.name || subject.name,
      subject: subject.name,
      accuracy,
      plan: ['20 PYQs', '2 Revisions', '1 Mock'],
    };
  });
  return bySubjectAccuracy.sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
}

export function buildDailyActions({ topics = [], pyqs = [], mocks = [], revisionSchedule = [], studyStats = {} }) {
  const today = todayKey();
  const dueRevision = revisionSchedule.find((r) => r.status !== 'done' && r.dueDate <= today);
  const weakSubject = [...(studyStats.subjects || [])].sort((a, b) => (a.progress || 0) - (b.progress || 0))[0];
  const weakTopic = topics.find((t) => !t.done && (!weakSubject || t.subject === weakSubject.name)) || topics.find((t) => !t.done);
  const revisionPyq = pyqs.find((p) => p.revisionNeeded) || pyqs.find((p) => !p.solved);
  const lastMock = mocks[mocks.length - 1];
  return {
    task: weakTopic ? `Complete ${weakTopic.name}` : 'Revise one completed topic',
    revision: dueRevision ? `Revise ${dueRevision.topicName}` : 'Do one 15-minute formula revision',
    pyq: revisionPyq ? `Solve PYQs from ${revisionPyq.subject}` : 'Solve 10 mixed PYQs',
    mock: !lastMock ? 'Take a 30-minute diagnostic quiz' : 'Analyze last mock mistakes',
  };
}

export function buildFinalModePlans() {
  return [
    { label: '100 Day Plan', focus: 'Finish syllabus + weekly mocks', split: '60% learning, 25% PYQs, 15% revision' },
    { label: '60 Day Plan', focus: 'PYQ-heavy consolidation', split: '35% learning, 40% PYQs, 25% revision' },
    { label: '30 Day Plan', focus: 'Mocks + weak topic recovery', split: '20% learning, 45% mocks/PYQs, 35% revision' },
    { label: '7 Day Revision', focus: 'Formula book + mistakes only', split: '10% new, 50% revision, 40% mock analysis' },
  ];
}

/** Detect weak topics from mock notes, incomplete topics, unsolved PYQs */
export function detectWeakTopics(topics, pyqs, mocks, subjects) {
  const weak = [];
  const subjectScores = computeSubjectCompletion(subjects, topics, pyqs);

  subjectScores.filter((s) => s.progress < 50).forEach((s) => {
    weak.push({
      type: 'subject',
      name: s.name,
      score: s.progress,
      reason: 'Subject completion below 50%',
      recommendation: `Focus on core topics in ${s.name.split(' ')[0]}`,
      icon: s.icon,
      color: s.color,
    });
  });

  topics.filter((t) => !t.done).slice(0, 5).forEach((t) => {
    if (!weak.some((w) => w.name === t.name)) {
      weak.push({
        type: 'topic',
        name: t.name,
        score: 0,
        reason: 'Incomplete topic',
        recommendation: `Complete "${t.name}" in ${t.subject}`,
        icon: '📌',
        color: '#ff6b6b',
      });
    }
  });

  pyqs.filter((p) => !p.solved && p.difficulty === 'hard').slice(0, 3).forEach((p) => {
    weak.push({
      type: 'pyq',
      name: p.title,
      score: 0,
      reason: `Unsolved hard PYQ (GATE ${p.year})`,
      recommendation: `Practice ${p.title} from ${p.subject}`,
      icon: '🗂',
      color: '#ff9f43',
    });
  });

  const latestMock = mocks[mocks.length - 1];
  if (latestMock?.notes) {
    const note = latestMock.notes.toLowerCase();
    if (note.includes('weak')) {
      weak.push({
        type: 'mock',
        name: latestMock.name,
        score: latestMock.score,
        reason: `Mock feedback: "${latestMock.notes}"`,
        recommendation: 'Revise weak areas noted in your latest mock',
        icon: '🎯',
        color: '#a855f7',
      });
    }
  }

  return weak.slice(0, 8);
}

/** Update streak based on study activity */
export function updateStreak(streak, hoursStudied, minHours = 2) {
  const key = todayKey();
  const log = { ...streak.activityLog };
  const level = hoursStudied >= minHours ? 'full' : hoursStudied >= minHours / 2 ? 'partial' : null;
  if (level) log[key] = { hours: hoursStudied, level };

  let current = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const k = todayKey(new Date(d.getTime() - i * 86400000));
    if (log[k]?.level === 'full' || log[k]?.level === 'partial') current++;
    else if (i > 0) break;
  }

  const longest = Math.max(streak.longest || 0, current);
  return { current, longest, activityLog: log };
}

/** Get heatmap data for last N days */
export function getStreakHeatmap(activityLog, days = 28) {
  const result = [];
  const d = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(d.getTime() - i * 86400000);
    const key = todayKey(date);
    const entry = activityLog[key];
    result.push({ date: key, level: entry?.level || '', hours: entry?.hours || 0 });
  }
  return result;
}

/** Daily target progress */
export function getDailyTargetProgress(dailyTarget, todayProgress) {
  const key = todayKey();
  const dt = dailyTarget || { hours: 8, topicsToComplete: 3 };
  const tp = todayProgress || { hours: 0, topicsCompleted: 0, date: key };
  const progress = tp.date === key ? tp : { hours: 0, topicsCompleted: 0, date: key };
  const hoursPct = dt.hours ? Math.min(100, Math.round((progress.hours / dt.hours) * 100)) : 0;
  const topicsPct = dt.topicsToComplete ? Math.min(100, Math.round((progress.topicsCompleted / dt.topicsToComplete) * 100)) : 0;
  const overall = Math.round((hoursPct + topicsPct) / 2);
  return { ...progress, hoursPct, topicsPct, overall };
}

export function getCountdown(examDateStr) {
  const target = new Date(examDateStr || DEFAULT_EXAM_DATE);
  const diff = Math.max(0, target - new Date());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    total: diff,
  };
}

/** PYQ statistics grouped by subject, topic, year, difficulty */
export function computePyqStats(pyqs) {
  const bySubject = {};
  const byTopic = {};
  const byYear = {};
  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  let solved = 0, revisionNeeded = 0, difficult = 0;

  pyqs.forEach((p) => {
    if (p.solved) solved++;
    if (p.revisionNeeded) revisionNeeded++;
    if (p.markedDifficult) difficult++;
    byDifficulty[p.difficulty] = (byDifficulty[p.difficulty] || 0) + 1;
    if (!bySubject[p.subject]) bySubject[p.subject] = { total: 0, solved: 0 };
    bySubject[p.subject].total++;
    if (p.solved) bySubject[p.subject].solved++;
    const topicKey = p.topic || p.title;
    if (!byTopic[topicKey]) byTopic[topicKey] = { total: 0, solved: 0, subject: p.subject };
    byTopic[topicKey].total++;
    if (p.solved) byTopic[topicKey].solved++;
    if (!byYear[p.year]) byYear[p.year] = { total: 0, solved: 0 };
    byYear[p.year].total++;
    if (p.solved) byYear[p.year].solved++;
  });

  return { total: pyqs.length, solved, revisionNeeded, difficult, bySubject, byTopic, byYear, byDifficulty };
}

/** Subject-wise accuracy for charts */
export function getSubjectAccuracy(subjects, pyqs) {
  return subjects.map(sub => {
    const subPyqs = pyqs.filter(p => p.subject === sub.name || sub.name.includes(p.subject));
    if (!subPyqs.length) return 0;
    const correct = subPyqs.filter(p => p.status === 'correct').length;
    return Math.round((correct / subPyqs.length) * 100);
  });
}

/** Predict GATE score from readiness + mock trend */
export function predictScore(topics, pyqs, mocks) {
  const topicPct = topics.length ? (topics.filter((t) => t.done).length / topics.length) * 100 : 0;
  const pyqPct = pyqs.length ? (pyqs.filter((p) => p.solved).length / pyqs.length) * 100 : 0;
  const mockScores = mocks.map((m) => m.score);
  const mockAvg = mockScores.length ? mockScores.reduce((a, b) => a + b, 0) / mockScores.length : 0;
  const trend = mockScores.length >= 2 ? mockScores[mockScores.length - 1] - mockScores[0] : 0;
  const base = topicPct * 0.25 + pyqPct * 0.2 + mockAvg * 0.55;
  const projected = Math.min(100, Math.max(0, base + trend * 0.1));
  return { current: Math.round(base * 10) / 10, projected: Math.round(projected * 10) / 10, trend: Math.round(trend * 10) / 10 };
}

/** Generate smart study recommendations */
export function generateRecommendations(topics, pyqs, mocks, subjects, revisionSchedule) {
  const recs = [];
  const weak = detectWeakTopics(topics, pyqs, mocks, subjects);
  weak.slice(0, 3).forEach((w) => recs.push({ type: 'weak', icon: w.icon, title: w.name, action: w.recommendation, priority: 'high' }));

  const unsolvedHard = pyqs.filter((p) => !p.solved && p.difficulty === 'hard').slice(0, 2);
  unsolvedHard.forEach((p) => recs.push({ type: 'pyq', icon: '🗂', title: p.title, action: `Solve hard PYQ from ${p.subject}`, priority: 'medium' }));

  const missed = (revisionSchedule || []).filter((r) => r.status === 'missed' || getRevisionStatus(r.dueDate) === 'missed');
  missed.slice(0, 2).forEach((r) => recs.push({ type: 'revision', icon: '🔄', title: r.topicName, action: `Missed revision — review ${r.subject}`, priority: 'high' }));

  if (!mocks.length || (mocks[mocks.length - 1] && Date.now() - new Date(mocks[mocks.length - 1].date).getTime() > 14 * 86400000)) {
    recs.push({ type: 'mock', icon: '🎯', title: 'Take a Mock Test', action: 'No recent mock — schedule one this week', priority: 'medium' });
  }

  return recs.slice(0, 6);
}

/** AI-style weekly study plan from weak areas */
export function generateWeeklyPlan(topics, pyqs, subjects, dailyHours = 8) {
  const priorities = getSubjectPriorities(subjects, topics, pyqs);
  const incomplete = topics.filter((t) => !t.done);
  const plan = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  days.forEach((day, i) => {
    const subject = priorities[i % priorities.length];
    const topic = incomplete.find((t) => t.subject === subject?.name) || incomplete[i % Math.max(incomplete.length, 1)];
    const pyq = pyqs.find((p) => p.subject === subject?.name && !p.solved);
    plan.push({
      day,
      subject: subject?.name || 'Mixed Review',
      topic: topic?.name || 'Revision',
      hours: dailyHours,
      tasks: [
        topic ? `Study: ${topic.name}` : 'Review notes',
        pyq ? `PYQ: ${pyq.title}` : 'Practice problems',
        i % 3 === 0 ? 'Formula revision (30 min)' : 'Quick recap (15 min)',
      ],
    });
  });
  return plan;
}

/** Compute weak areas — topics with low PYQ completion */
export function computeWeakAreas(topics, pyqs) {
  const safeTopics = topics || [];
  const safePyqs = pyqs || [];
  const subjectMap = {};
  safeTopics.forEach(t => {
    if (!subjectMap[t.subject]) subjectMap[t.subject] = { name: t.name, subject: t.subject, pyqCount: 0, solvedCount: 0 };
  });
  safePyqs.forEach(p => {
    if (subjectMap[p.subject]) {
      subjectMap[p.subject].pyqCount++;
      if (p.solved) subjectMap[p.subject].solvedCount++;
    }
  });
  return Object.values(subjectMap)
    .map(s => ({ ...s, weakScore: s.pyqCount > 0 ? (1 - s.solvedCount / s.pyqCount) * 100 : 50 }))
    .sort((a, b) => b.weakScore - a.weakScore)
    .slice(0, 10);
}

/** Readiness score (0–100) from topics, PYQs, mocks, streak */
export function computeReadinessScore(topics, pyqs, mocks, streak) {
  const topicPct = (topics?.length || 0) ? ((topics.filter((t) => t.done).length / topics.length) * 100) : 0;
  const pyqPct = (pyqs?.length || 0) ? ((pyqs.filter((p) => p.solved).length / pyqs.length) * 100) : 0;
  const mockScores = (mocks || []).map((m) => m.score);
  const mockPct = mockScores.length ? (mockScores.reduce((a, b) => a + b, 0) / mockScores.length) : 0;
  const streakBonus = Math.min(10, (streak?.current || 0) * 0.5);
  return Math.round(topicPct * 0.3 + pyqPct * 0.25 + mockPct * 0.35 + streakBonus);
}

/** Forecast days to complete all topics at current pace */
export function computeCompletionForecast(topics, gateFeatures) {
  const safeTopics = topics || [];
  const remaining = safeTopics.filter((t) => !t.done).length;
  const completed = safeTopics.filter((t) => t.done).length;
  const daysActive = Object.keys(gateFeatures?.streak?.activityLog || {}).length || 1;
  const rate = completed / Math.max(daysActive, 1);
  const daysNeeded = rate > 0 ? Math.ceil(remaining / rate) : null;
  const forecastDate = daysNeeded ? new Date(Date.now() + daysNeeded * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  return { remaining, rate: Math.round(rate * 100) / 100, daysNeeded, forecastDate };
}

/** Subject priority suggestions — lowest completion first */
export function getSubjectPriorities(subjects, topics, pyqs) {
  const completion = computeSubjectCompletion(subjects, topics, pyqs);
  return (completion || [])
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 5)
    .map((s, i) => ({
      ...s,
      priority: i + 1,
      urgency: s.progress < 40 ? 'high' : s.progress < 60 ? 'medium' : 'low',
    }));
}

/** Gamification: XP thresholds and badge checks */
const XP_PER_LEVEL = 300;

export function getLevelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getXpProgress(xp) {
  const level = getLevelFromXp(xp);
  const current = xp % XP_PER_LEVEL;
  return { level, current, max: XP_PER_LEVEL, pct: Math.round((current / XP_PER_LEVEL) * 100) };
}

export function checkNewBadges(gamification, data) {
  const earned = new Set(gamification?.badges || []);
  const newBadges = [];
  const { streak } = data.gateFeatures || {};
  const pyqSolved = data.pyqs.filter((p) => p.solved).length;

  if (streak?.current >= 7 && !earned.has('7-day-streak')) newBadges.push('7-day-streak');
  if (streak?.current >= 30 && !earned.has('30-day-streak')) newBadges.push('30-day-streak');
  if (pyqSolved >= 100 && !earned.has('100-pyq')) newBadges.push('100-pyq');
  if (data.mocks.length >= 1 && !earned.has('first-mock')) newBadges.push('first-mock');
  if (data.studyStats?.weekHours >= (data.gateFeatures?.weeklyGoal?.hours || 50) && !earned.has('week-warrior')) newBadges.push('week-warrior');

  const osTopics = data.topics.filter((t) => t.subject === 'Operating Systems');
  if (osTopics.length && osTopics.every((t) => t.done) && !earned.has('subject-master-os')) newBadges.push('subject-master-os');

  return newBadges;
}

/** Spaced repetition: next review date */
export function getNextRevisionDate(lastReviewed, intervalDays) {
  const d = new Date(lastReviewed);
  d.setDate(d.getDate() + intervalDays);
  return d.toISOString().slice(0, 10);
}

export function getRevisionStatus(dueDate) {
  const today = todayKey();
  if (dueDate < today) return 'missed';
  if (dueDate === today) return 'today';
  return 'upcoming';
}

/** GATE CSE subject weightage (approx marks out of 100) — canonical source */
export const SUBJECT_WEIGHTAGE = {
  'Operating Systems': 9,
  'Computer Networks': 8.5,
  'DBMS': 8,
  'Computer Organization': 8.5,
  'Theory of Computation': 8,
  'Algorithms': 7.5,
  'Programming & Data Structures': 11.5,
  'Engineering Mathematics': 12.5,
  'Digital Logic': 5,
  'Compiler Design': 5,
  'General Aptitude': 15,
};

/** Compute next best topic recommendation with confidence & expected gain */
export function getNextTopicRecommendation(topics, pyqs, subjects, studyStats = {}) {
  if (!topics?.length) {
    return { topicName: 'Start with Engineering Mathematics', confidence: 75, expectedGain: '+12 marks', subject: 'Engineering Mathematics', reason: 'Highest weightage subject' };
  }

  const subjectProgress = computeSubjectCompletion(subjects || [], topics, pyqs || []);
  const incompleteTopics = topics.filter(t => !t.done);
  
  if (!incompleteTopics.length) {
    return { topicName: 'All topics complete — Begin Revision', confidence: 90, expectedGain: '+8 marks', subject: 'Revision', reason: 'Syllabus completed' };
  }

  // Score each incomplete topic: weightage * (1 - progress) * PYQ frequency
  const topicScores = incompleteTopics.map(topic => {
    const sub = subjectProgress.find(s => s.name === topic.subject);
    const progress = sub?.progress || 0;
    const weightage = SUBJECT_WEIGHTAGE[topic.subject] || 5;
    const subjectPyqs = (pyqs || []).filter(p => p.subject === topic.subject);
    const pyqCount = subjectPyqs.length;
    const pyqSolved = subjectPyqs.filter(p => p.solved).length;
    const pyqAccuracy = pyqCount > 0 ? pyqSolved / pyqCount : 0;
    const gap = 1 - progress / 100;
    const pyqGap = 1 - pyqAccuracy;
    // Score combines: subject weightage, progress gap, PYQ gap
    const score = weightage * gap * (1 + pyqGap);
    
    // Expected marks gain based on weightage and gap
    const expectedGain = Math.round(weightage * gap * 1.5);
    
    return {
      topic,
      subject: topic.subject,
      score,
      expectedGain,
      weightage,
      progress,
      pyqAccuracy,
    };
  });

  // Sort by score descending
  topicScores.sort((a, b) => b.score - a.score);
  
  const best = topicScores[0];
  if (!best) {
    return { topicName: 'Complete Remaining Topics', confidence: 70, expectedGain: '+10 marks', subject: 'Mixed', reason: 'Multiple topics remaining' };
  }

  // Confidence based on how clear the winner is
  const secondBest = topicScores[1];
  const confidence = secondBest ? Math.min(95, Math.round(70 + (best.score - secondBest.score) / Math.max(best.score, 1) * 25)) : 90;
  
  return {
    topicName: best.topic.name,
    subject: best.subject,
    confidence,
    expectedGain: `+${best.expectedGain} marks`,
    reason: `${best.subject} has ${best.weightage} marks weightage, ${Math.round(best.progress)}% done`,
  };
}

/** Auto-schedule a revision entry for a topic after a wrong answer */
export function createRevisionEntry({ topicName, subject, source = 'pyq' }) {
  const today = new Date().toISOString().slice(0, 10);
  const firstStep = REVISION_STEPS[0];
  return {
    id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    topicName,
    subject,
    dueDate: getNextRevisionDate(today, firstStep.intervalDays),
    status: 'upcoming',
    stage: firstStep.stage,
    interval: firstStep.intervalDays,
    lastReviewed: today,
    source,
    incorrectCount: 1,
  };
}

/** Check if a revision entry already exists for a topic */
export function hasRevisionForTopic(schedule, topicName) {
  return schedule.some(
    (r) => r.topicName === topicName && r.status !== 'done'
  );
}

/** Compute revision priority score: weightage + incorrect attempts + delay */
export function computeRevisionPriority(item, today) {
  const weight = SUBJECT_WEIGHT_MAP[item.subject] || 5;
  const incorrect = item.incorrectCount || 1;
  const dueDate = item.dueDate || today;
  const daysOverdue = dueDate < today ? Math.min(30, (new Date(today) - new Date(dueDate)) / 86400000) : 0;
  return Math.round(weight * 2 + incorrect * 5 + daysOverdue * 3);
}

const SUBJECT_WEIGHT_MAP = SUBJECT_WEIGHTAGE;
