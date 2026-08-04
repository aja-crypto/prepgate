export function buildCoachContext(coachState) {
  if (!coachState) return {};

  const { profile, analytics, roadmap, journey, recommendations, session, streak } = coachState;

  const context = {
    profile: {
      name: profile?.name || 'Student',
      examYear: profile?.examYear || 2027,
      branch: profile?.branch || 'Computer Science',
      targetAIR: profile?.targetAIR || 'Not set',
      dreamInstitute: profile?.dreamCollege || 'Not set',
      studyHours: profile?.dailyStudyHours || 4,
      preparationStage: profile?.preparationStage || 'beginner',
      firstAttempt: profile?.firstAttempt,
    },
    progress: {
      streak: analytics?.streak || 0,
      weeklyStudyHours: analytics?.weeklyHours || 0,
      pyqsSolved: analytics?.pyqCount || 0,
      accuracy: analytics?.accuracy || 0,
      strongestSubject: analytics?.strongestSubject?.name || 'Unknown',
      weakestSubject: analytics?.weakestSubject?.name || 'Unknown',
      strongestProgress: analytics?.strongestSubject?.progress || 0,
      weakestProgress: analytics?.weakestSubject?.progress || 0,
      mocksTaken: analytics?.totalMocks || 0,
    },
    roadmap: {
      currentStage: roadmap?.currentStage?.label || roadmap?.currentPhase || 'Foundation',
      stages: Array.isArray(roadmap?.stages) ? roadmap.stages.map(s => s.name || s.label) : [],
      estimatedDays: roadmap?.estimatedDays || 'Unknown',
      remainingSubjects: roadmap?.remainingSubjects ?? 0,
      readinessScore: roadmap?.readinessScore || 0,
    },
    session: {
      currentSubject: session?.currentSubject || 'Not started',
      dailyGoal: session?.dailyGoal || '4h',
      weeklyProgress: `${session?.currentWeekly || 0}h / ${session?.weeklyTarget || 18}h`,
    },
    recommendations: Array.isArray(recommendations) ? recommendations.slice(0, 3).map(r => ({
      title: r.title || r.name || 'Study focus',
      reason: r.reason || r.description || '',
      confidence: r.confidence || null,
    })) : [],
  };

  return context;
}

export function buildSystemPrompt(coachContext) {
  const { profile, progress, roadmap, session } = coachContext;

  return `You are GateNexa AI Coach — a personal GATE 2027 mentor. You know the student's complete preparation context.

Student Profile:
- Name: ${profile.name}
- Target: GATE ${profile.examYear}, AIR #${profile.targetAIR}
- Branch: ${profile.branch}
- Study hours: ${profile.studyHours}h/day
- Stage: ${profile.preparationStage}

Current Progress:
- Streak: ${progress.streak} days
- Weekly study: ${progress.weeklyStudyHours}h
- PYQs solved: ${progress.pyqsSolved}
- Accuracy: ${progress.accuracy}%
- Strongest: ${progress.strongestSubject} (${progress.strongestProgress}%)
- Weakest: ${progress.weakestSubject} (${progress.weakestProgress}%)

Roadmap:
- Current stage: ${roadmap.currentStage}
- Estimated days remaining: ${roadmap.estimatedDays}
- Readiness: ${roadmap.readinessScore}%

Session:
- Studying: ${session.currentSubject}
- Today's goal: ${session.dailyGoal}

Respond conversationally and encouragingly. Reference specific data from the student's progress. Never invent information. If unsure, say so. Keep responses to 2-3 paragraphs maximum.`;
}
