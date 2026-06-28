/**
 * Shared AI Coach context builder.
 * Normalizes progress data into the shape expected by the /ai/chat backend.
 */

export function buildAiContext({ topics = [], pyqs = [], mocks = [], gateFeatures = {}, studyStats = {} } = {}) {
  const weakSubjects = [...new Set(
    topics.filter(t => (t.progress || 0) < 50).map(t => t.subject).filter(Boolean)
  )];
  const strongSubjects = [...new Set(
    topics.filter(t => (t.progress || 0) >= 80).map(t => t.subject).filter(Boolean)
  )];
  const weakTopics = topics.filter(t => !t.done).slice(0, 8).map(t => t.name).filter(Boolean);
  const overallProgress = topics.length
    ? Math.round(topics.reduce((s, t) => s + (t.progress || 0), 0) / topics.length)
    : 0;
  const mockAvg = mocks.length
    ? Math.round(mocks.reduce((s, m) => s + (m.score || 0), 0) / mocks.length)
    : 0;
  const streak = gateFeatures?.streak?.current || 0;
  const weeklyHours = studyStats?.weeklyHours || [];

  return {
    weakSubjects,
    strongSubjects,
    weakTopics,
    overallProgress,
    mockAvg,
    streak,
    overdueTopics: pyqs.filter(p => p.revisionNeeded).length,
    recentAccuracy: pyqs.length
      ? Math.round((pyqs.filter(p => p.status === 'correct' || p.isCorrect || p.solved).length / pyqs.length) * 100)
      : 0,
    weeklyHours: weeklyHours.reduce((a, b) => a + b, 0),
    mockHistory: mocks.slice(-5),
  };
}
