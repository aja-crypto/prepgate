import { useMemo, useEffect, useState } from 'react';
import { useAiMentor } from '../../context/AiMentorContext';
import { useProgress } from '../../context/ProgressContext';
import { aiService } from '../../services/api';

// Derive real coach state from progress data + the server-side AI context
// builder (/api/ai/context). The server context is the source of truth for
// roadmap/journey/recommendations/analytics/prediction/dailyBrief; local
// derivation is the fallback when the endpoint is unavailable.
export default function useCoachState() {
  const {
    profile,
    roadmap: aiRoadmap,
    recommendations: aiRecommendations,
    unifiedState,
  } = useAiMentor();

  const {
    topics,
    pyqs,
    mocks,
    studyStats,
    gateFeatures,
  } = useProgress();

  // Fetch the server-built AI context (enriched with real backend data)
  const [serverCtx, setServerCtx] = useState(null);
  const [serverCtxStatus, setServerCtxStatus] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setServerCtxStatus('loading');
    aiService.getContext()
      .then(res => {
        if (cancelled) return;
        setServerCtx(res.data?.data || null);
        setServerCtxStatus('ok');
      })
      .catch(() => {
        if (cancelled) return;
        setServerCtx(null);
        setServerCtxStatus('fallback');
      });
    return () => { cancelled = true; };
  }, [studyStats, pyqs, mocks, topics, gateFeatures]);

  return useMemo(() => {
    const weeklyHours = Array.isArray(studyStats?.weeklyHours)
      ? studyStats.weeklyHours.reduce((a, b) => a + b, 0)
      : studyStats?.totalHours || 0;

    const pyqCount = Array.isArray(pyqs) ? pyqs.length : 0;
    const correct = Array.isArray(pyqs)
      ? pyqs.filter(p => p.status === 'correct' || p.isCorrect || p.solved).length
      : 0;
    const accuracy = pyqCount > 0 ? Math.round((correct / pyqCount) * 100) : 0;
    const streak = gateFeatures?.streak?.current || studyStats?.streak?.current || 0;

    const subjects = Array.isArray(studyStats?.subjects) ? studyStats.subjects : [];
    const sorted = [...subjects].sort((a, b) => (b.progress || 0) - (a.progress || 0));
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    // Weak topics from PYQ accuracy
    const weakTopics = useMemoHelper(topics, pyqs);

    const overallProgress = Array.isArray(topics) && topics.length
      ? Math.round(topics.reduce((s, t) => s + (t.completed || t.done ? 100 : 0), 0) / topics.length)
      : 0;

    const session = {
      currentSubject: profile?.currentSubject || weakest?.name || 'Not started',
      currentChapter: profile?.currentTopic || (weakTopics[0]?.name || ''),
      dailyGoal: `${profile?.dailyStudyHours || gateFeatures?.dailyTarget?.hours || 4}h`,
      weeklyTarget: gateFeatures?.weeklyGoal?.hours || 18,
      currentWeekly: weeklyHours,
      isActive: false,
    };

    const analytics = {
      streak,
      weeklyHours,
      pyqCount,
      accuracy,
      strongestSubject: strongest ? { name: strongest.name, progress: strongest.progress || 0 } : null,
      weakestSubject: weakest ? { name: weakest.name, progress: weakest.progress || 0 } : null,
      totalMocks: Array.isArray(mocks) ? mocks.length : 0,
    };

    // Journey: prefer server-built (dynamic, per-topic) when available
    const journey = serverCtx?.journey && serverCtx.journey.steps?.length
      ? serverCtx.journey
      : buildLocalJourney(weakTopics, weakest, accuracy, topics, mocks);

    // Recommendations: prefer server-built (self-explaining) when available
    let recs = serverCtx?.recommendations?.length
      ? serverCtx.recommendations
      : buildLocalRecs(weakTopics, weakest, accuracy, topics, mocks);

    // Roadmap: prefer server-built (data-driven subjects/timeline) when available
    const roadmap = serverCtx?.roadmap?.subjects?.length
      ? serverCtx.roadmap
      : buildLocalRoadmap(overallProgress, weakTopics, topics, mocks);

    const memory = profile ? [
      { icon: '📅', label: 'Exam Year', value: profile.gateExamYear || 2027 },
      { icon: '🎯', label: 'Target AIR', value: profile.targetAIR ? `#${profile.targetAIR}` : 'Not set' },
      { icon: '💪', label: 'Strong', value: strongest?.name || serverCtx?.strongSubjects?.[0] || 'Unknown' },
      { icon: '⚠️', label: 'Weak', value: weakest?.name || serverCtx?.weakSubjects?.[0] || 'Unknown' },
    ] : [];

    const status = {
      loading: serverCtxStatus === 'loading',
      ready: true,
      error: null,
    };

    // Profile summary
    const profileSummary = {
      name: profile?.name || profile?.studentName || 'there',
      examYear: profile?.gateExamYear || 2027,
      branch: profile?.branch || profile?.stream || 'Computer Science',
      targetAIR: profile?.targetAIR || null,
      dreamCollege: profile?.dreamCollege || '',
      dailyStudyHours: profile?.dailyStudyHours || gateFeatures?.dailyTarget?.hours || 4,
      preparationStage: profile?.preparationStage || 'beginner',
      firstAttempt: profile?.firstAttempt,
      completedSubjects: Array.isArray(profile?.completedSubjects) ? profile.completedSubjects : [],
    };

    return {
      profile: profileSummary,
      analytics,
      journey,
      roadmap,
      recommendations: recs,
      dailyBrief: serverCtx?.dailyBrief || null,
      prediction: serverCtx?.prediction || null,
      session,
      streak,
      memory,
      status,
      raw: { profile, studyStats, pyqs, mocks, gateFeatures, topics, overallProgress, weakTopics, serverCtx },
    };
  }, [profile, aiRoadmap, aiRecommendations, unifiedState, topics, pyqs, mocks, studyStats, gateFeatures, serverCtx, serverCtxStatus]);
}

// Local journey fallback (mirrors server logic when endpoint unavailable)
function buildLocalJourney(weakTopics, weakest, accuracy, topics, mocks) {
  const steps = [];
  if (weakTopics.length) {
    steps.push({ type: 'revision', title: `Revise ${weakTopics[0].name}`, detail: `${weakTopics[0].subject || 'Syllabus'} — weakest topic by accuracy`, duration: 20 });
    steps.push({ type: 'pyq', title: `Solve 10 PYQs: ${weakTopics[0].name}`, detail: 'Target accuracy above 60%', duration: 35 });
  }
  if (weakest?.name && accuracy < 75) {
    steps.push({ type: 'mistake', title: 'Mistake Review', detail: `Analyze wrong answers in ${weakest.name}`, duration: 15 });
  } else {
    steps.push({ type: 'quiz', title: 'Quick Quiz', detail: '5 rapid questions', duration: 10 });
  }
  if (!Array.isArray(mocks) || mocks.length === 0) {
    steps.push({ type: 'mock', title: 'Take your first mock', detail: 'Establish a baseline', duration: 180 });
  }
  return { steps, total: steps.length, completed: 0, totalMinutes: steps.reduce((s, x) => s + x.duration, 0), goal: 'Reach 70% accuracy in your weak topic', expectedImprovement: 'Solidify your weak topic' };
}

// Local recommendations fallback
function buildLocalRecs(weakTopics, weakest, accuracy, topics, mocks) {
  const recs = [];
  if (weakTopics.length) {
    recs.push({ type: 'study', title: `Focus on ${weakTopics[0].name}`, content: `Weakest topic by accuracy${weakTopics[0].subject ? ` in ${weakTopics[0].subject}` : ''}. Relearn then solve 10 PYQs.`, priority: 'high', why: [`Accuracy needs improvement in ${weakTopics[0].name}`, 'High GATE weightage'], expectedImpact: '+2 to +4 marks', time: '35 min', confidence: 80 });
  }
  if (weakest?.name && accuracy < 75) {
    recs.push({ type: 'practice', title: `Improve ${weakest.name} accuracy`, content: `Current accuracy ${accuracy}%. Target 75%+.`, priority: 'medium', why: [`${weakest.name} accuracy: ${accuracy}%`, 'Below target'], expectedImpact: '+2 to +4 marks', time: '45 min', confidence: 75 });
  }
  return recs;
}

// Local roadmap fallback (data-driven shape, used only if server unavailable)
function buildLocalRoadmap(overallProgress, weakTopics, topics, mocks) {
  const subjects = (Array.isArray(topics) ? topics : []).reduce((acc, t) => {
    const key = t.subject || 'General';
    acc[key] = acc[key] || { total: 0, done: 0 };
    acc[key].total++;
    if (t.completed || t.done) acc[key].done++;
    return acc;
  }, {});
  const subjectList = Object.entries(subjects).map(([name, d]) => ({
    name,
    progress: d.total ? Math.round((d.done / d.total) * 100) : 0,
    status: d.total && d.done / d.total >= 0.8 ? 'mastered' : 'in-progress',
    topicsDone: d.done,
    topicsTotal: d.total,
  }));
  return {
    subjects: subjectList,
    completion: overallProgress,
    currentStageLabel: weakTopics?.[0]?.name || 'Core Subjects',
    narrative: `Overall progress ${overallProgress}%. Keep moving through your subjects.`,
    daysToExam: 190,
    examDate: '2027-02-07',
    onTrack: true,
    milestones: [],
    timeline: [],
    probability: null,
    dailyHoursNeeded: null,
  };
}

// Helper that can be used inside the memo (arrays are stable in this scope)
function useMemoHelper(topics, pyqs) {
  if (!Array.isArray(pyqs) || !pyqs.length) {
    return (Array.isArray(topics) ? topics.filter(t => t.markedDifficult || t.revisionNeeded) : [])
      .slice(0, 5)
      .map(t => ({ name: t.name, subject: t.subject, accuracy: null }));
  }
  const acc = {};
  pyqs.forEach(p => {
    const key = p.topic || p.name;
    if (!key) return;
    acc[key] = acc[key] || { correct: 0, total: 0, subject: p.subject };
    acc[key].total++;
    if (p.isCorrect || p.status === 'correct') acc[key].correct++;
  });
  return Object.entries(acc)
    .filter(([, d]) => d.total >= 2 && d.correct / d.total < 0.6)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 5)
    .map(([name, d]) => ({ name, subject: d.subject, accuracy: Math.round((d.correct / d.total) * 100) }));
}
