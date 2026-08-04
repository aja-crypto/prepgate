/**
 * Intelligent Revision Engine
 * Spaced repetition scheduling based on accuracy, forget rate, and time since revision.
 */

const REVISION_INTERVALS = [1, 3, 7, 15, 30];

export function calculateRevisionSchedule(topic, accuracy, lastRevised) {
  if (!lastRevised) {
    return { interval: 1, nextRevision: 'Tomorrow', priority: 'high' };
  }

  const daysSince = Math.floor((Date.now() - new Date(lastRevised).getTime()) / 86400000);

  // Determine interval based on accuracy
  let baseInterval;
  if (accuracy >= 90) baseInterval = 3;
  else if (accuracy >= 75) baseInterval = 2;
  else if (accuracy >= 60) baseInterval = 1;
  else baseInterval = 0;

  const intervalIndex = Math.min(REVISION_INTERVALS.length - 1, baseInterval);
  const interval = REVISION_INTERVALS[intervalIndex];

  // Overdue?
  const overdue = daysSince >= interval;
  const urgency = overdue ? 'overdue' : daysSince >= interval * 0.7 ? 'due-soon' : 'on-track';

  return {
    interval,
    daysSince,
    nextRevision: overdue ? 'Today' : `In ${interval - daysSince} days`,
    priority: overdue ? 'high' : urgency === 'due-soon' ? 'medium' : 'low',
    overdue,
    status: urgency,
    accuracy,
  };
}

export function getRevisionQueue(topics = [], pyqs = []) {
  const queue = [];
  const topicMap = {};

  // Build topic accuracy from PYQs
  (pyqs || []).forEach(p => {
    const key = p.topic || p.topicName || 'Unknown';
    if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0 };
    topicMap[key].total++;
    if (p.status === 'correct' || p.solved) topicMap[key].correct++;
  });

  // Calculate revision schedule for each topic
  (topics || []).forEach(t => {
    const name = t.name || t.topicName || 'Unknown';
    const stats = topicMap[name] || { correct: 0, total: 0 };
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const schedule = calculateRevisionSchedule(t, accuracy, t.lastRevised);

    queue.push({
      topic: name,
      subject: t.subject || 'General',
      accuracy,
      ...schedule,
    });
  });

  // Sort by urgency: overdue first, then due-soon, then on-track
  const order = { overdue: 0, 'due-soon': 1, 'on-track': 2 };
  queue.sort((a, b) => (order[a.status] || 3) - (order[b.status] || 3));

  return {
    queue,
    overdue: queue.filter(t => t.overdue).length,
    dueSoon: queue.filter(t => t.status === 'due-soon').length,
    onTrack: queue.filter(t => t.status === 'on-track').length,
    updatedAt: new Date().toISOString(),
  };
}
