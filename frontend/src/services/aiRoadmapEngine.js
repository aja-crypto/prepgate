import { getSmartSubjectOrder, getExamWeightage, getPrerequisites, getSubjectConceptualContinuity, getTopicWeightage } from './aiKnowledgeBase';

const ROADMAP_STAGES = [
  { id: 'foundation', label: 'Foundation', icon: '📖', minSubjects: 0, desc: 'Building basic concepts' },
  { id: 'core', label: 'Core Building', icon: '🔧', minSubjects: 3, desc: 'Strengthening core subjects' },
  { id: 'advanced', label: 'Advanced', icon: '🚀', minSubjects: 6, desc: 'Deep mastery & revision' },
  { id: 'revision', label: 'Revision', icon: '🔄', minSubjects: 9, desc: 'Consolidation & mock tests' },
  { id: 'final', label: 'Final Sprint', icon: '🏆', minSubjects: 11, desc: 'Final preparation phase' },
];

export function computeRoadmap(profile, studyStats, topics) {
  const completedSubjects = profile.completedSubjects || [];
  const subjectsDone = completedSubjects.length;
  const pct = studyStats?.overallProgress || 0;

  let currentStageIdx = 0;
  for (let i = ROADMAP_STAGES.length - 1; i >= 0; i--) {
    if (subjectsDone >= ROADMAP_STAGES[i].minSubjects) {
      currentStageIdx = i;
      break;
    }
  }

  const stages = ROADMAP_STAGES.map((stage, i) => ({
    ...stage,
    status: i < currentStageIdx ? 'completed' : i === currentStageIdx ? 'current' : 'upcoming',
    progress: i === currentStageIdx
      ? Math.min(100, Math.round((subjectsDone / (ROADMAP_STAGES[i + 1]?.minSubjects || 11)) * 100))
      : i < currentStageIdx ? 100 : 0,
  }));

  const remainingSubjects = 11 - subjectsDone;
  const dailyHours = profile.dailyStudyHours || 4;
  const hoursPerSubject = 40;
  const estimatedDays = dailyHours > 0 ? Math.ceil((remainingSubjects * hoursPerSubject) / dailyHours) : 999;

  // Pace calculation: expected vs actual progress
  const totalSubjects = 11;
  const targetDate = profile.gateExamYear ? new Date(`${profile.gateExamYear}-02-01T09:00:00`) : new Date('2027-02-07T09:00:00');
  const startDate = profile.createdAt ? new Date(profile.createdAt) : new Date();
  const totalDays = Math.max(1, Math.round((targetDate - startDate) / 86400000));
  const elapsedDays = Math.max(0, Math.round((Date.now() - startDate.getTime()) / 86400000));
  const expectedCompletion = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  const actualCompletion = Math.min(100, Math.round((subjectsDone / totalSubjects) * 100));
  const paceDelta = actualCompletion - expectedCompletion;

  const paceStatus = paceDelta > 5 ? 'ahead' : paceDelta < -5 ? 'behind' : 'on_track';
  const paceLabel = paceStatus === 'ahead'
    ? `Ahead of Schedule (+${Math.round(paceDelta / 5)} days)`
    : paceStatus === 'behind'
      ? `Behind Schedule (est. ${Math.round(Math.abs(paceDelta) / 5)} day delay)`
      : 'On Track';
  const estimatedDelayDays = paceStatus === 'behind' ? Math.round(Math.abs(paceDelta) / 5 * (totalDays / 100)) : 0;

  const readinessScore = pct;
  const mockReadiness = (() => {
    if (pct >= 80) return { level: 'high', label: 'Ready for Mocks', color: 'text-green-400' };
    if (pct >= 50) return { level: 'medium', label: 'Almost Ready', color: 'text-yellow-400' };
    return { level: 'low', label: 'Build Foundation First', color: 'text-red-400' };
  })();

  const nextRevision = (topics || []).filter(t => {
    if (!t.lastRevised) return false;
    const days = Math.floor((Date.now() - new Date(t.lastRevised).getTime()) / 86400000);
    return days >= 7;
  }).length;

  return {
    currentStage: stages[currentStageIdx],
    stages,
    remainingSubjects: Math.max(0, remainingSubjects),
    estimatedDays,
    estimatedDate: estimatedDays < 999
      ? new Date(Date.now() + estimatedDays * 86400000).toISOString().slice(0, 10)
      : null,
    paceStatus,
    paceLabel,
    estimatedDelayDays,
    readinessScore,
    mockReadiness,
    nextRevisionCount: nextRevision,
    currentPhase: stages[currentStageIdx]?.label || 'Foundation',
    nextPhase: stages[currentStageIdx + 1]?.label || null,
  };
}

export function computeRoadmapFromState(studentState) {
  const profile = studentState.profile || {};
  const studyStats = studentState.studyStats || {};
  const studentTopics = studentState.topics || [];
  const knowledge = studentState.knowledge || {};

  const baseRoadmap = computeRoadmap(profile, studyStats, studentTopics);

  const smartOrder = knowledge.smartSubjectOrder || [];
  const nextSubject = smartOrder[0] || null;

  // Adaptive revision plan
  const analytics = studentState.analytics || {};
  const topicConfidences = analytics.topicConfidence || [];
  const effectiveRevision = analytics.revisionEffectiveness || {};
  const mockReadiness = studentState.knowledge?.airIntelligence?.mockReadiness || knowledge?.mockPhase || {};

  const criticalRevision = topicConfidences.filter(tc => tc.needsRevision && (tc.daysSinceRevision > 21 || tc.confidence === 'Low'));
  const pendingRevision = topicConfidences.filter(tc => tc.needsRevision);

  const revisionPlan = {
    criticalCount: criticalRevision.length,
    pendingCount: pendingRevision.length,
    revisionRate: effectiveRevision.revisionRate || 0,
    effectiveness: effectiveRevision.needsMoreRevision ? 'needs_improvement' : 'adequate',
    nextRevisionTarget: criticalRevision[0] || pendingRevision[0] || null,
    weeklyGoal: pendingRevision.length > 0
      ? `Revise ${Math.min(3, pendingRevision.length)} topics this week to stay on track`
      : effectiveRevision.revisionRate < 40
        ? 'Start revising completed topics — even 15 min/day prevents forgetting'
        : 'Good revision rate. Maintain your weekly revision cycle.',
  };

  // Topic weightage contribution
  const subjectWeightageMap = {};
  (profile.completedSubjects || []).forEach(s => {
    subjectWeightageMap[s] = getExamWeightage(s) || 0;
  });
  const totalCoveredWeightage = Object.values(subjectWeightageMap).reduce((s, v) => s + v, 0);

  return {
    ...baseRoadmap,
    smartSubjectOrder: smartOrder,
    nextRecommendedSubject: nextSubject,
    suggestedPath: smartOrder.slice(0, 5).map(s => ({
      subject: s.subject,
      reason: s.reason,
      estimatedWeeks: s.estimatedWeeks,
      priority: s.priorityScore,
      pairedContinuity: s.pairedContinuity,
      conceptualContinuity: s.conceptualContinuity,
    })),
    revisionPlan,
    weightageCovered: totalCoveredWeightage,
    mockPhase: mockReadiness.stage || '',
    mockAdvice: mockReadiness.advice || '',
    airStage: baseRoadmap.currentPhase,
  };
}
