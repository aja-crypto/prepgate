/**
 * AI Confidence Engine
 * Scores every recommendation with confidence %, evidence, and data sources.
 * Never fabricates — if data is insufficient, confidence reflects that.
 */

export function calculateConfidence(rec, data) {
  const { pyqs = [], mocks = [], studyStats = {}, topics = [] } = data;
  let sources = 0;
  let signals = 0;

  // PYQ data available
  if (pyqs.length >= 5) { sources += 2; signals += 1; }
  else if (pyqs.length > 0) { sources += 1; }

  // Mock data available
  if (mocks.length >= 2) { sources += 2; signals += 1; }
  else if (mocks.length > 0) { sources += 1; }

  // Subject progress data
  const subjects = studyStats?.subjects || [];
  if (subjects.length >= 5) { sources += 2; }
  else if (subjects.length > 0) { sources += 1; }

  // Study hours data
  if (Array.isArray(studyStats?.weeklyHours) && studyStats.weeklyHours.some(h => h > 0)) {
    sources += 2; signals += 1;
  }

  // Topic-level data
  if (topics.length >= 10) { sources += 2; signals += 1; }
  else if (topics.length > 0) { sources += 1; }

  // Base confidence from data volume
  const maxSources = 10;
  const baseConfidence = Math.min(98, Math.round((sources / maxSources) * 100));

  // Adjust based on how many data dimensions are active
  const dimensionBonus = Math.min(15, signals * 5);
  const confidence = Math.min(99, baseConfidence + dimensionBonus);

  return {
    confidence,
    evidence: sources > 0 ? `${sources}/10 data sources` : 'Insufficient data',
    sources: {
      pyqs: pyqs.length,
      mocks: mocks.length,
      subjects: (studyStats?.subjects || []).length,
      studyHours: Array.isArray(studyStats?.weeklyHours) ? studyStats.weeklyHours.filter(h => h > 0).length : 0,
      topics: topics.length,
    },
    quality: sources >= 6 ? 'high' : sources >= 3 ? 'medium' : 'low',
    generatedAt: new Date().toISOString(),
  };
}
