function computePyqPatternAnalysis(studentState) {
  const memory = studentState.memory || {};
  const pyqHistory = memory.pyqHistoryCount ? null : null; // marker for available data
  const pyqAccuracyByYear = memory.pyqAccuracyByYear || [];
  const recentPyqAccuracy = memory.recentPyqAccuracy;
  const memoryRecentWrong = memory.recentWrongTopics || [];

  const topicBreakdown = {};
  if (memoryRecentWrong.length > 0) {
    memoryRecentWrong.forEach(([name, count]) => {
      topicBreakdown[name] = { errors: count, errorRate: 'repeating' };
    });
  }

  return {
    accuracyByYear: pyqAccuracyByYear,
    recentAccuracy: recentPyqAccuracy,
    topicBreakdown,
    hasPyqData: (studentState.studyStats?.pyqStats?.totalSolved || 0) > 0,
    questionsSolved: studentState.studyStats?.pyqStats?.totalSolved || 0,
    overallAccuracy: studentState.studyStats?.pyqStats?.overallAccuracy || 0,
  };
}

function computeTopicConfidenceAnalytics(studentState) {
  const topics = studentState.topics || [];
  return topics.map(t => {
    const p = t.progress || {};
    const progressItems = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
    const done = progressItems.filter(k => p[k]).length;
    const accuracy = p.pyqAccuracy || p.accuracy || 50;
    const lastRevised = t.lastRevised ? Math.floor((Date.now() - new Date(t.lastRevised).getTime()) / 86400000) : 999;

    let confidence = done >= 8 ? 'Strong' : done >= 6 ? 'Good' : done >= 4 ? 'Moderate' : done >= 2 ? 'Low' : 'Very Low';
    if (accuracy < 40) confidence = 'Low';
    if (accuracy < 25) confidence = 'Very Low';

    return {
      name: t.name,
      subject: t.subject?.name || t.subject || '',
      progress: done,
      totalSteps: progressItems.length,
      accuracy,
      daysSinceRevision: lastRevised,
      confidence,
      needsRevision: lastRevised > 14 || (lastRevised > 7 && accuracy < 60),
      isComplete: done >= 8,
    };
  });
}

function computeMockReadinessScore(studentState) {
  const profile = studentState.profile || {};
  const completedSubjects = profile.completedSubjects?.length || 0;
  const coveragePct = studentState.studyStats?.overallProgress || 0;
  const accuracy = studentState.studyStats?.pyqStats?.overallAccuracy || 0;
  const memory = studentState.memory || {};

  let readinessScore = 0;
  readinessScore += Math.min(40, (completedSubjects / 11) * 40);
  readinessScore += Math.min(30, (coveragePct / 100) * 30);
  readinessScore += Math.min(20, (accuracy / 100) * 20);
  if (memory.pyqHistoryCount && memory.pyqHistoryCount > 50) readinessScore += 5;
  if (memory.revisionCount && memory.revisionCount > 10) readinessScore += 5;

  return Math.min(100, Math.round(readinessScore));
}

function computeRevisionEffectiveness(studentState) {
  const topics = studentState.topics || [];
  const memory = studentState.memory || {};

  const completedTopics = topics.filter(t => {
    const p = t.progress || {};
    return ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].some(k => p[k]);
  });

  const revisedTopics = completedTopics.filter(t => t.lastRevised);
  const topicsWithMultipleRevisions = topics.filter(t => {
    const p = t.progress || {};
    return ['revision2', 'revision3', 'revision4'].filter(k => p[k]).length >= 2;
  }).length;

  const revisionRate = completedTopics.length > 0 ? Math.round((revisedTopics.length / completedTopics.length) * 100) : 0;
  const deepRevisionCount = topicsWithMultipleRevisions;

  return {
    revisionRate,
    deepRevisionCount,
    totalRevisions: memory.revisionCount || 0,
    totalCompletedTopics: completedTopics.length,
    revisedTopicsCount: revisedTopics.length,
    needsMoreRevision: revisionRate < 60 && completedTopics.length > 3,
  };
}

export function enrichWithAnalytics(studentState) {
  const topics = studentState.topics || [];
  const studyStats = studentState.studyStats || {};
  const gateFeatures = studentState.gateFeatures || {};
  const memory = studentState.memory || {};
  const profile = studentState.profile || {};

  const topicsCovered = topics.filter(t => {
    const p = t.progress || {};
    return ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].some(k => p[k]);
  }).length;

  const totalTopics = topics.length;
  const coveragePct = totalTopics > 0 ? Math.round((topicsCovered / totalTopics) * 100) : 0;

  const consistency = (() => {
    if (!memory.activeDays || memory.activeDays < 2) return 0;
    const expected = Math.min(30, memory.activeDays);
    return Math.round((memory.activeDays / expected) * 100);
  })();

  const momentum = (() => {
    const hoursArray = memory.dailyHoursArray || [];
    if (hoursArray.length < 4) return 'stable';
    const mid = Math.floor(hoursArray.length / 2);
    const recentAvg = hoursArray.slice(mid).reduce((s, h) => s + h, 0) / hoursArray.slice(mid).length;
    const olderAvg = hoursArray.slice(0, mid).reduce((s, h) => s + h, 0) / hoursArray.slice(0, mid).length;
    if (recentAvg > olderAvg * 1.2) return 'increasing';
    if (recentAvg < olderAvg * 0.8) return 'decreasing';
    return 'stable';
  })();

  const revisionRate = (() => {
    const completed = topics.filter(t => {
      const p = t.progress || {};
      return ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].every(k => p[k]);
    });
    const revised = completed.filter(t => t.lastRevised);
    return completed.length > 0 ? Math.round((revised.length / completed.length) * 100) : 0;
  })();

  const accuracy = studyStats?.pyqStats?.overallAccuracy || 0;
  const totalSolved = studyStats?.pyqStats?.totalSolved || 0;
  const todayHours = gateFeatures?.todayProgress?.hours || 0;
  const targetHours = gateFeatures?.dailyTarget?.hours || profile.dailyStudyHours || 8;

  const burnoutRisk = (() => {
    let risk = 0;
    if (memory.averageStudyHours > 8) risk += 30;
    if (momentum === 'decreasing') risk += 20;
    if (!memory.activeDays || memory.activeDays > 25) risk += 20;
    if (consistency > 90 && memory.averageStudyHours > 7) risk += 15;
    return Math.min(100, risk);
  })();

  const mentorScore = (() => {
    const progressWeight = coveragePct * 0.4;
    const consistencyWeight = consistency * 0.2;
    const accuracyWeight = (accuracy || 0) * 0.2;
    const revisionWeight = revisionRate * 0.1;
    const hoursFactor = Math.min(100, (todayHours / Math.max(1, targetHours)) * 100) * 0.1;
    return Math.round(progressWeight + consistencyWeight + accuracyWeight + revisionWeight + hoursFactor);
  })();

  const studyEfficiency = (() => {
    if (!memory.averageStudyHours || memory.averageStudyHours < 0.5) return 0;
    const topicsPerHour = topicsCovered / (memory.averageStudyHours * Math.max(1, memory.activeDays));
    return Math.min(100, Math.round(topicsPerHour * 50));
  })();

  const weakAreas = topics.filter(t => {
    const p = t.progress || {};
    return !p.lecture;
  }).slice(0, 5).map(t => ({ topic: t.name, subject: t.subject?.name || t.subject }));

  const subjectImprovement = (() => {
    const memoryWrong = memory.recentWrongTopics || [];
    if (memoryWrong.length === 0) return {};
    const improvements = {};
    memoryWrong.forEach(([name, count]) => {
      improvements[name] = { recentErrors: count, trend: count > 3 ? 'worsening' : 'stable' };
    });
    return improvements;
  })();

  const accuracyTrend = (() => {
    const current = memory.lastWeekAccuracy;
    const change = memory.accuracyChange;
    if (current === null) return null;
    return {
      current,
      change,
      trend: change === null ? 'stable' : change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
      message: change === null
        ? `Current accuracy: ${current}%`
        : change > 0
          ? `Accuracy improved by ${change}% — keep it up!`
          : `Accuracy dropped by ${Math.abs(change)}% — review weak topics.`,
    };
  })();

  const hoursTrend = (() => {
    const change = memory.hoursChange;
    if (change === null) return null;
    return {
      change,
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
      message: change > 0
        ? `Study hours increased by ${change}% compared to last week.`
        : change < 0
          ? `Study hours dropped by ${Math.abs(change)}%. Try to maintain consistency.`
          : 'Study hours consistent with last week.',
    };
  })();

  const consistencyMessage = (() => {
    if (momentum === 'increasing') return 'Your study momentum is building — excellent consistency.';
    if (momentum === 'decreasing') return 'Your study hours are declining. Even 30 minutes helps maintain the habit.';
    if (consistency >= 70) return 'Good consistency — you are building strong study discipline.';
    return 'Build a daily study habit — consistency beats intensity.';
  })();

  const mistakesTrend = (() => {
    const wrongTopics = memory.recentWrongTopics || [];
    if (wrongTopics.length === 0) return null;
    const repeated = wrongTopics.filter(([, count]) => count >= 2);
    if (repeated.length === 0) return null;
    return {
      repeatedMistakes: repeated.map(([topic]) => topic),
      message: `You have repeated errors in: ${repeated.map(([t]) => t).join(', ')}. Consider focused revision on these topics.`,
    };
  })();

  const skippedSubjectPattern = (() => {
    const skipped = memory.skippedSubjects || [];
    if (skipped.length === 0) return null;
    return {
      subjects: skipped,
      message: skipped.length === 1
        ? `You've consistently delayed ${skipped[0]}. It's time to start — even 2 topics a week builds momentum.`
        : `You've postponed ${skipped.join(', ')}. Consider tackling the shortest subject first.`,
    };
  })();

  const coachingInsight = (() => {
    const insights = [];
    if (accuracyTrend && accuracyTrend.trend === 'improving') {
      insights.push(`You've improved your accuracy by ${accuracyTrend.change}% recently. Your focused practice is working.`);
    }
    if (hoursTrend && hoursTrend.trend === 'increasing') {
      insights.push(`You are now studying ${Math.abs(hoursTrend.change)}% more than last week. This momentum will pay off.`);
    }
    if (skippedSubjectPattern) {
      insights.push(skippedSubjectPattern.message);
    }
    if (consistency < 40 && memory.activeDays > 0) {
      insights.push(`You've studied on ${memory.activeDays} of the last 30 days. Aim for 25+ days for consistent progress.`);
    }
    if (coveragePct > 30 && revisionRate < 30) {
      insights.push(`You've covered ${coveragePct}% of topics but only revised ${revisionRate}%. Start revising — it doubles retention.`);
    }
    return insights;
  })();

  return {
    mentorScore,
    consistency,
    momentum,
    burnoutRisk,
    revisionHealth: revisionRate,
    studyEfficiency,
    predictionConfidence: accuracy > 0 ? Math.round(Math.min(95, 40 + accuracy * 0.5 + consistency * 0.3)) : 0,
    topicsCovered,
    totalTopics,
    coveragePct,
    accuracy,
    totalSolved,
    todayHours,
    targetHours,
    weakAreas,
    subjectImprovement,
    accuracyTrend,
    hoursTrend,
    consistencyMessage,
    mistakesTrend,
    skippedSubjectPattern,
    coachingInsight,

    pyqPatternAnalysis: computePyqPatternAnalysis(studentState),
    topicConfidence: computeTopicConfidenceAnalytics(studentState),
    mockReadinessScore: computeMockReadinessScore(studentState),
    revisionEffectiveness: computeRevisionEffectiveness(studentState),
  };
}
