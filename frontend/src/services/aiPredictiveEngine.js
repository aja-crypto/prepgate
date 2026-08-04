/**
 * AI Predictive Engine
 * Predicts expected AIR, score, readiness trends based on actual progress.
 * Always labels predictions as estimates — never promises results.
 */

export function predictScore(data) {
  const { pyqs = [], mocks = [], studyStats = {}, subjects = [] } = data;
  const overall = subjects.length > 0
    ? Math.round(subjects.reduce((s, x) => s + (x.progress || 0), 0) / subjects.length)
    : 0;
  const avgMock = mocks.length > 0
    ? Math.round(mocks.reduce((a, m) => a + (m.score || 0), 0) / mocks.length)
    : 0;
  const accuracy = pyqs.length > 0
    ? Math.round(pyqs.filter(p => p.status === 'correct' || p.solved).length / pyqs.length * 100)
    : 0;

  // Weighted prediction: progress + mock + accuracy
  const raw = (overall * 0.3) + (avgMock * 0.4) + (accuracy * 0.3);
  const predicted = Math.min(100, Math.max(0, Math.round(raw)));
  const range = Math.max(5, Math.round((100 - predicted) * 0.15));

  return {
    predictedScore: predicted,
    scoreRange: `${Math.max(0, predicted - range)}-${Math.min(100, predicted + range)}`,
    predictedAIR: predicted > 0 ? estimateAIR(predicted) : null,
    readiness: calculateReadiness(data),
    confidence: data.mocks?.length >= 3 ? 'medium' : 'low',
    disclaimer: 'This is an estimate based on available data. Actual results may vary.',
    generatedAt: new Date().toISOString(),
  };
}

function estimateAIR(score) {
  if (score >= 85) return { min: 50, max: 200, label: 'Top Rank' };
  if (score >= 75) return { min: 200, max: 1000, label: 'Excellent' };
  if (score >= 65) return { min: 1000, max: 3000, label: 'Very Good' };
  if (score >= 55) return { min: 3000, max: 8000, label: 'Good' };
  if (score >= 45) return { min: 8000, max: 15000, label: 'Fair' };
  return { min: 15000, max: 50000, label: 'Needs Improvement' };
}

function calculateReadiness(data) {
  const { mocks = [], pyqs = [], subjects = [], studyStats = {} } = data;
  const overall = subjects.length > 0
    ? Math.round(subjects.reduce((s, x) => s + (x.progress || 0), 0) / subjects.length)
    : 0;
  const mockFreq = mocks.length >= 4 ? 20 : mocks.length >= 2 ? 10 : 0;
  const pyqScore = pyqs.length >= 50 ? 20 : pyqs.length >= 20 ? 15 : pyqs.length >= 10 ? 10 : 0;
  const weekHours = Array.isArray(studyStats?.weeklyHours)
    ? studyStats.weeklyHours.reduce((a, b) => a + b, 0)
    : 0;
  const consistency = weekHours >= 20 ? 15 : weekHours >= 10 ? 10 : 5;

  return Math.min(100, Math.round(overall * 0.35 + mockFreq + pyqScore + consistency));
}

export function predictCompletion(subjects = [], dailyHours = 4) {
  const remaining = subjects.filter(s => (s.progress || 0) < 100);
  if (remaining.length === 0) return { days: 0, date: 'Complete' };

  const avgRemaining = remaining.reduce((s, x) => s + (100 - (x.progress || 0)), 0) / remaining.length;
  const daysPerSubject = Math.ceil(avgRemaining / dailyHours);
  const totalDays = remaining.length * Math.max(1, daysPerSubject);
  const date = new Date();
  date.setDate(date.getDate() + totalDays);

  return {
    days: totalDays,
    date: date.toISOString().split('T')[0],
    subjectsRemaining: remaining.length,
    disclaimer: 'Estimated based on current pace. Adjust as progress changes.',
  };
}
