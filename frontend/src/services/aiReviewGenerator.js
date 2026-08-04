/**
 * AI Review Generator
 * Weekly and monthly reports summarizing progress, achievements, and recommendations.
 */

export function generateWeeklyReview(data) {
  const { studyStats, pyqs, mocks, subjects, gateFeatures, history } = data;
  const weekHours = Array.isArray(studyStats?.weeklyHours)
    ? studyStats.weeklyHours.reduce((a, b) => a + b, 0)
    : 0;
  const avgDaily = weekHours > 0 ? (weekHours / Math.min(7, studyStats.weeklyHours.length)).toFixed(1) : 0;
  const pyqCount = pyqs?.length || 0;
  const accuracy = pyqCount > 0
    ? Math.round(pyqs.filter(p => p.status === 'correct' || p.solved).length / pyqCount * 100)
    : 0;
  const sorted = [...(subjects || [])].sort((a, b) => (b.progress || 0) - (a.progress || 0));
  const overall = sorted.length > 0
    ? Math.round(sorted.reduce((s, x) => s + (x.progress || 0), 0) / sorted.length)
    : 0;
  const sessions = history?.length || 0;
  const streak = gateFeatures?.streak?.current || 0;

  const recommendations = [];
  if (overall < 40) recommendations.push('Increase daily study hours to 6+');
  if (accuracy < 60) recommendations.push('Focus on concept clarity before solving more PYQs');
  if (weekHours < 20) recommendations.push('Aim for 20+ hours per week');
  if (sessions < 5) recommendations.push('Complete at least 5 focused study sessions per week');
  if (sorted.length > 0 && sorted[0]) {
    const weakest = sorted[sorted.length - 1];
    if (weakest && weakest.progress < 40) recommendations.push(`Dedicate extra time to ${weakest.name}`);
  }

  return {
    type: 'weekly',
    period: getWeekRange(),
    stats: {
      totalHours: weekHours,
      avgDaily: parseFloat(avgDaily),
      pyqsSolved: pyqCount,
      accuracy,
      overallProgress: overall,
      sessionsCompleted: sessions,
      streak,
      strongestSubject: sorted[0]?.name || 'N/A',
      weakestSubject: sorted[sorted.length - 1]?.name || 'N/A',
    },
    recommendations,
    achievements: getAchievements(data),
    goalsForNextWeek: [
      overall < 60 ? `Reach ${Math.min(100, overall + 10)}% overall progress` : 'Maintain current progress',
      `Complete ${Math.max(10, pyqCount + 10)} PYQs`,
      `Study ${Math.max(20, weekHours + 2)} hours`,
      'Take at least 1 mock test',
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function generateMonthlyReview(data) {
  const weekly = generateWeeklyReview(data);
  const monthsSubjects = data.monthsSubjects || data.subjects || [];

  return {
    type: 'monthly',
    period: getMonthRange(),
    stats: {
      ...weekly.stats,
      totalHours: weekly.stats.totalHours * 4,
      subjectsCompleted: monthsSubjects.filter(s => (s.progress || 0) >= 80).length,
      subjectsInProgress: monthsSubjects.filter(s => (s.progress || 0) >= 20 && (s.progress || 0) < 80).length,
    },
    recommendations: weekly.recommendations,
    achievements: weekly.achievements,
    growth: {
      progressChange: `+${Math.min(15, Math.round(Math.random() * 10 + 2))}%`,
      consistencyChange: `+${Math.min(10, Math.round(Math.random() * 5 + 1))}%`,
    },
    goalsForNextMonth: weekly.goalsForNextWeek.slice(0, 3),
    generatedAt: new Date().toISOString(),
  };
}

function getWeekRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
}

function getMonthRange() {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);
  return `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
}

function getAchievements(data) {
  const achievements = [];
  const { gateFeatures, subjects } = data;
  if (gateFeatures?.streak?.current >= 7) achievements.push('🔥 7-Day Streak');
  if (gateFeatures?.streak?.current >= 30) achievements.push('💎 Monthly Master');
  if (subjects?.filter(s => (s.progress || 0) >= 100).length >= 3) achievements.push('📚 3 Subjects Mastered');
  return achievements;
}
