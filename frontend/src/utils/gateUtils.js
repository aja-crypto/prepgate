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

/** A PYQ counts as "correct/solved" across the app's data variants */
export function isPyqCorrect(p) {
  return p?.isCorrect === true || p?.correct === true || p?.status === 'correct' || p?.solved === true;
}

const SUBJECT_ALIASES = {
  'toc': 'theory of computation',
  'coa': 'computer organization',
  'ds': 'programming & data structures',
  'os': 'operating systems',
  'cn': 'computer networks',
  'dbms': 'dbms',
  'em': 'engineering mathematics',
  'maths': 'engineering mathematics',
  'cd': 'compiler design',
  'dl': 'digital logic',
  'apt': 'general aptitude',
};
const normSub = (s) => (s || '').toString().toLowerCase().trim();

/** True when two subject references (e.g. "OS" vs "Operating Systems") refer to the same subject */
export function matchesSubject(a, b) {
  const x = normSub(a);
  const y = normSub(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (SUBJECT_ALIASES[x] === y || SUBJECT_ALIASES[y] === x) return true;
  if (x.includes(y) || y.includes(x)) return true;
  return false;
}

/** Compute subject completion % from topics + PYQs */
export function computeSubjectCompletion(subjects, topics, pyqs) {
  const safeSubjects = subjects || [];
  const safeTopics = topics || [];
  const safePyqs = pyqs || [];

  return safeSubjects.map((sub) => {
    const subTopics = safeTopics.filter((t) => matchesSubject(sub.name, t.subject));
    const subPyqs = safePyqs.filter((p) => matchesSubject(sub.name, p.subject));

    const topicPct = subTopics.length ? (subTopics.filter((t) => t.done).length / subTopics.length) * 100 : sub.progress || 0;
    const pyqPct = subPyqs.length ? (subPyqs.filter((p) => isPyqCorrect(p)).length / subPyqs.length) * 100 : sub.progress || 0;
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
/** Explain WHY a topic/subject is weak using real signals. */
function explainWeakness({ progress, accuracy, solvedPct, missedCount, incompleteCount, revisionDue, hasData }) {
  if (hasData === false) return 'Not started yet — no topics or PYQs recorded';
  if (accuracy != null && accuracy < 40) return `Only ${Math.round(accuracy)}% accuracy on PYQs — wrong answers show shaky concepts`;
  if (solvedPct != null && solvedPct < 40) return `Just ${Math.round(solvedPct)}% of its PYQs solved — needs more practice`;
  if (missedCount > 0) return `${missedCount} PYQ${missedCount > 1 ? 's' : ''} answered incorrectly — review the mistakes`;
  if (revisionDue) return 'Revision is due — recall has likely faded';
  if (incompleteCount > 0) return `${incompleteCount} topic${incompleteCount > 1 ? 's' : ''} incomplete`;
  if (progress != null && progress < 50) return `Only ${Math.round(progress)}% complete`;
  return 'Lowest-priority area based on your recent activity';
}

export function detectWeakTopics(topics, pyqs, mocks, subjects) {
  const weak = [];
  const safeTopics = topics || [];
  const safePyqs = pyqs || [];
  const subjectScores = computeSubjectCompletion(subjects, safeTopics, safePyqs);

  // Subject-level weakness driven by real completion + accuracy
  subjectScores
    .filter((s) => s.progress < 60)
    .forEach((s) => {
      const subPyqs = safePyqs.filter((p) => matchesSubject(s.name, p.subject));
      const solvedCount = subPyqs.filter(isPyqCorrect).length;
      const accuracy = subPyqs.length ? (solvedCount / subPyqs.length) * 100 : null;
      const solvedPct = subPyqs.length ? (subPyqs.filter((p) => p.solved === true || p.isCorrect === true).length / subPyqs.length) * 100 : null;
      const incorrect = subPyqs.filter((p) => !isPyqCorrect(p)).length;
      const hasTopics = safeTopics.some((t) => matchesSubject(s.name, t.subject));
      const hasData = hasTopics || subPyqs.length > 0;
      weak.push({
        type: 'subject',
        name: s.name,
        score: hasData ? Math.max(s.progress, accuracy != null ? 100 - accuracy : s.progress) : 100,
        completion: s.progress,
        topicPct: s.topicPct,
        pyqPct: s.pyqPct,
        accuracy,
        reason: explainWeakness({ progress: s.progress, accuracy, solvedPct, missedCount: incorrect, hasData }),
        recommendation: !hasData
          ? `Start ${s.name} — no topics or PYQs recorded yet`
          : accuracy != null
            ? `Re-answer the ${subPyqs.length} PYQs in ${s.name} and review wrong ones`
            : `Complete unfinished topics in ${s.name}`,
        icon: s.icon,
        color: s.color,
        pyqTotal: subPyqs.length,
        pyqSolved: solvedCount,
      });
    });

  // Topic-level weakness: incomplete topics + low topic accuracy
  const topicStats = {};
  safePyqs.forEach((p) => {
    const key = p.topic || p.subject;
    if (!topicStats[key]) topicStats[key] = { total: 0, correct: 0, subject: p.subject };
    topicStats[key].total++;
    if (isPyqCorrect(p)) topicStats[key].correct++;
  });

  safeTopics.filter((t) => !t.done).slice(0, 5).forEach((t) => {
    if (!weak.some((w) => w.name === t.name)) {
      const st = topicStats[t.name] || topicStats[t.subject];
      const accuracy = st?.total ? Math.round((st.correct / st.total) * 100) : null;
      const revisionDue = t.revisionNeeded === true;
      weak.push({
        type: 'topic',
        name: t.name,
        score: Math.max(0, 100 - (accuracy ?? 50)),
        completion: 0,
        accuracy,
        reason: explainWeakness({ missedCount: st && st.total - st.correct, incompleteCount: 1, revisionDue }),
        recommendation: revisionDue ? `Revise ${t.name} — it's due for spaced repetition` : `Complete "${t.name}" in ${t.subject}`,
        icon: 'topic',
        color: '#ff6b6b',
        pyqTotal: st?.total || 0,
        pyqSolved: st?.correct || 0,
      });
    }
  });

  // Missed/incorrect PYQs are a concrete weakness signal
  safePyqs.filter((p) => !isPyqCorrect(p)).slice(0, 3).forEach((p) => {
    if (!weak.some((w) => w.name === (p.title || p.topic))) {
      const label = p.title || p.topic || `${p.subject} PYQ`;
      weak.push({
        type: 'pyq',
        name: label,
        score: 60,
        accuracy: 0,
        reason: 'Answered incorrectly — this is a live gap',
        recommendation: `Retry this PYQ and note why the previous attempt was wrong (${p.subject})`,
        icon: 'pyq',
        color: '#ff9f43',
        pyqTotal: 1,
        pyqSolved: 0,
      });
    }
  });

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

/**
 * Map days remaining to a study phase with strategy recommendations.
 * Returns { phase, label, focus, revisionFreq, mockFreq, conceptWeight, practiceWeight, revisionWeight }
 */
export function getExamPhase(examDateStr) {
  const { days } = getCountdown(examDateStr);
  if (days > 180) return { phase: 'foundation', label: 'Foundation', focus: 'Build strong concepts across all subjects', revisionFreq: 'weekly', mockFreq: 'monthly', conceptWeight: 0.6, practiceWeight: 0.3, revisionWeight: 0.1 };
  if (days > 120) return { phase: 'deepening', label: 'Deepening', focus: 'Complete syllabus + begin PYQ practice', revisionFreq: 'weekly', mockFreq: 'bi-weekly', conceptWeight: 0.4, practiceWeight: 0.4, revisionWeight: 0.2 };
  if (days > 60)  return { phase: 'practice',  label: 'Practice',  focus: 'PYQs + mock tests + weak area targeting', revisionFreq: 'twice-weekly', mockFreq: 'weekly', conceptWeight: 0.2, practiceWeight: 0.5, revisionWeight: 0.3 };
  if (days > 14)  return { phase: 'revision',  label: 'Revision',  focus: 'Full revision + mock analysis + formula review', revisionFreq: 'daily', mockFreq: 'twice-weekly', conceptWeight: 0.1, practiceWeight: 0.3, revisionWeight: 0.6 };
  return { phase: 'final', label: 'Final Sprint', focus: 'Light revision + confidence building + rest', revisionFreq: 'daily', mockFreq: 'daily (light)', conceptWeight: 0.0, practiceWeight: 0.2, revisionWeight: 0.8 };
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
export function generateRecommendations(topics, pyqs, mocks, subjects, revisionSchedule, studyStats = {}) {
  const recs = [];
  const safeTopics = topics || [];
  const safePyqs = pyqs || [];
  const safeMocks = mocks || [];
  const safeSubs = subjects || [];
  const today = todayKey();

  // 1. Weak areas (with the real reason)
  const weak = detectWeakTopics(safeTopics, safePyqs, safeMocks, safeSubs);
  weak.slice(0, 3).forEach((w) => {
    recs.push({
      type: 'weak',
      kind: 'priority',
      icon: w.type === 'pyq' ? 'pyq' : w.type === 'topic' ? 'topic' : 'weak',
      title: w.name,
      action: w.recommendation,
      detail: w.reason,
      priority: 'high',
      progress: w.score,
      completion: w.completion != null ? w.completion : (typeof w.score === 'number' ? 100 - w.score : null),
      accuracy: w.accuracy,
      pyqTotal: w.pyqTotal,
      pyqSolved: w.pyqSolved,
    });
  });

  // 2. Revision due (from schedule, or topics flagged for revision)
  const dueRevisions = (revisionSchedule || []).filter((r) => {
    if (r.status === 'done') return false;
    return r.status === 'missed' || getRevisionStatus(r.dueDate) === 'missed' || getRevisionStatus(r.dueDate) === 'today';
  });
  dueRevisions.slice(0, 2).forEach((r) => {
    const daysLate = r.dueDate < today ? Math.round((new Date(today) - new Date(r.dueDate)) / 86400000) : 0;
    recs.push({
      type: 'revision',
      kind: 'revision-due',
      icon: 'revision',
      title: r.topicName || r.topic,
      action: `Review ${r.subject || 'this topic'} now`,
      detail: daysLate > 0 ? `Overdue by ${daysLate} day${daysLate > 1 ? 's' : ''}` : 'Due today',
      priority: 'high',
      progress: 100,
    });
  });

  // 3. Incorrect PYQs are the sharpest signal — recommended next
  const incorrectPyqs = safePyqs.filter((p) => !isPyqCorrect(p));
  incorrectPyqs.slice(0, 2).forEach((p) => {
    recs.push({
      type: 'pyq',
      kind: 'next-action',
      icon: 'pyq',
      title: p.topic || p.title || `${p.subject} PYQ`,
      action: `Retry this PYQ in ${p.subject}`,
      detail: 'Incorrect previously — fix the gap now',
      priority: 'high',
      progress: 0,
      accuracy: 0,
    });
  });

  // 4. Mock recommendation when stale
  const lastMock = safeMocks[safeMocks.length - 1];
  const mockStale = !lastMock || (lastMock.date && Date.now() - new Date(lastMock.date).getTime() > 14 * 86400000);
  if (mockStale) {
    recs.push({
      type: 'mock',
      kind: 'next-action',
      icon: 'mock',
      title: 'Take a Mock Test',
      action: lastMock ? `Last mock was ${Math.round((Date.now() - new Date(lastMock.date).getTime()) / 86400000)} days ago` : 'No mock taken yet',
      detail: 'A fresh mock resets your practice loop',
      priority: 'medium',
      progress: 0,
    });
  }

  // 5. Recently completed → review schedule keeps retention
  const recentDone = safeTopics.filter((t) => t.done && (t.lastReviewed || t.lastRevisionDate)).slice(0, 2);
  recentDone.forEach((t) => {
    recs.push({
      type: 'review',
      kind: 'completed',
      icon: 'done',
      title: t.name,
      action: `Reviewed in ${t.subject}`,
      detail: `Last reviewed ${t.lastReviewed || t.lastRevisionDate || 'recently'}`,
      priority: 'low',
      progress: 100,
    });
  });

  // 6. Next best action derived from study stats when list is thin
  if (recs.length < 3) {
    const weekHours = studyStats?.weekHours || 0;
    const next = getNextTopicRecommendation(safeTopics, safePyqs, safeSubs, studyStats);
    recs.push({
      type: 'next',
      kind: 'next-action',
      icon: 'next',
      title: next.topicName,
      action: `Study in ${next.subject}`,
      detail: `${next.reason}${weekHours ? ` · ${weekHours}h studied this week` : ''}`,
      priority: 'medium',
      progress: 0,
    });
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
