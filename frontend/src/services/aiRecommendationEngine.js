import { getAirKnowledge, getSmartSubjectOrder, getSubjectConceptualContinuity, getResourcesForSubject, getMockPhase, getExamWeightage, getPyqPatterns, getLearningResources, getPrerequisites, getMockReadiness, estimateTopicConfidence } from './aiKnowledgeBase';

function buildRec(type, data) {
  return {
    type,
    priority: data.priority || 'low',
    icon: data.icon || '💡',
    text: data.text || '',
    action: data.action || null,
    reason: data.reason || null,
    expectedBenefit: data.expectedBenefit || null,
    estimatedTime: data.estimatedTime || null,
    confidence: data.confidence || null,
    source: data.source || null,
  };
}

export function generateRecommendations(profile, engineState, topics, pyqs, studyStats, gateFeatures) {
  const recs = [];
  const weakSubject = profile.weakestSubject;
  const completedSubjects = profile.completedSubjects || [];

  if (weakSubject) {
    const weakSubjectTopics = (topics || []).filter(t => {
      const sub = t.subject?.name || t.subject || '';
      return sub === weakSubject && !t.progress?.lecture;
    });
    if (weakSubjectTopics.length > 0) {
      recs.push(buildRec('weak_subject', {
        priority: 'high',
        icon: '🎯',
        text: `Focus on ${weakSubject} — ${weakSubjectTopics.length} topics still unstarted. Start with "${weakSubjectTopics[0].name}".`,
        action: { label: `Open ${weakSubject}`, link: `/subjects/${weakSubject.toLowerCase().replace(/\s+/g, '-')}` },
        reason: `Addressing your weakest subject first yields the highest marks-per-hour improvement. ${weakSubject} has ${getExamWeightage(weakSubject)}% exam weightage.`,
        expectedBenefit: `Mastering ${weakSubject} can improve your overall score by ${getExamWeightage(weakSubject)}% and boost confidence for related subjects.`,
        estimatedTime: `${weakSubjectTopics.length} topics × ~4hr each = ~${weakSubjectTopics.length * 4} hours`,
        confidence: weakSubjectTopics.length <= 3 ? 90 : 75,
        source: 'AIR Knowledge Base: Target weak areas first for maximum score improvement.',
      }));
    } else {
      recs.push(buildRec('weak_subject_complete', {
        priority: 'medium',
        icon: '✅',
        text: `Great progress on ${weakSubject}! You've covered all topics. Time for PYQs.`,
        action: { label: `Practice ${weakSubject} PYQs`, link: `/pyq?subject=${encodeURIComponent(weakSubject)}` },
        reason: `Completing ${weakSubject} topics is a strong milestone. PYQs now will cement concepts and reveal question patterns.`,
        expectedBenefit: 'PYQ practice improves retention by 60% and familiarizes you with exam patterns.',
        estimatedTime: `~${weakSubjectTopics.length * 15} min per PYQ set`,
        confidence: 85,
        source: 'AIR Knowledge Base: Subject-wise PYQs immediately after each subject.',
      }));
    }
  }

  const lastAction = engineState.recentActivity?.[0];
  if (lastAction) {
    const minsAgo = Math.round((Date.now() - lastAction.timestamp) / 60000);
    if (lastAction.type === 'video_watched' && minsAgo < 30) {
      const topicName = lastAction.detail?.topic || '';
      if (topicName) {
        const relatedPyqs = (pyqs || []).filter(p => {
          const tags = p.tags || [];
          return tags.some(t => t.toLowerCase().includes(topicName.toLowerCase()));
        });
        if (relatedPyqs.length > 0) {
          recs.push(buildRec('post_video_pyq', {
            priority: 'high',
            icon: '📝',
            text: `You just watched "${topicName}". Solve ${relatedPyqs.length} related PYQs to reinforce learning.`,
            action: { label: `Solve ${topicName} PYQs`, link: `/pyq?topic=${encodeURIComponent(topicName)}` },
            reason: 'Active recall immediately after learning increases retention from 20% to 80% (Ebbinghaus curve).',
            expectedBenefit: 'Reinforces today\'s learning. Identifies gaps while the topic is fresh.',
            estimatedTime: `~${relatedPyqs.length * 2} minutes`,
            confidence: 92,
            source: 'Active recall principle: solve PYQs within 30 min of learning.',
          }));
        }
      }
    }
  }

  const pyqStats = studyStats?.pyqStats || {};
  const overallAccuracy = pyqStats.overallAccuracy;
  if (overallAccuracy !== undefined && overallAccuracy < 40) {
    recs.push(buildRec('low_accuracy', {
      priority: 'high',
      icon: '⚠️',
      text: `Your PYQ accuracy is ${Math.round(overallAccuracy)}% — revise concepts before solving more. Start with mistake notebook.`,
      action: { label: 'Review Mistakes', link: '/mistakes' },
      reason: 'Solving without revision solidifies wrong patterns. Accuracy < 40% indicates conceptual gaps, not lack of practice.',
      expectedBenefit: 'Targeted revision can improve accuracy by 20-30% within 2 weeks.',
      estimatedTime: '3-5 hours of concept revision + 2 hours of targeted PYQs',
      confidence: 88,
      source: 'AIR Knowledge Base: Low accuracy means revisit concepts. Do NOT brute-force practice.',
    }));
  }

  const todayHours = gateFeatures?.todayProgress?.hours || 0;
  const targetHours = gateFeatures?.dailyTarget?.hours || 8;
  if (todayHours < targetHours * 0.5 && new Date().getHours() > 14) {
    recs.push(buildRec('study_gap', {
      priority: 'medium',
      icon: '⏰',
      text: `You've studied ${todayHours}h today. Try to reach ${targetHours}h — consistency builds rank.`,
      action: { label: 'Start Focus Session', link: '/focus' },
      reason: `AIR toppers average ${targetHours}h daily. Consistent daily output builds compound knowledge.`,
      expectedBenefit: `${targetHours - todayHours}h more today = ~${Math.round((targetHours - todayHours) * 3)} PYQs or 1 topic revision.`,
      estimatedTime: `${targetHours - todayHours} hours`,
      confidence: 70,
      source: 'AIR Knowledge Base: Daily routine specifies 4.5+ hours of focused study.',
    }));
  }

  if (completedSubjects.length >= 3 && !gateFeatures?.mockTests?.length) {
    recs.push(buildRec('mock_test', {
      priority: 'medium',
      icon: '🧪',
      text: `You've completed ${completedSubjects.length} subjects. Consider a baseline mock test to assess your level.`,
      action: { label: 'Take Mock Test', link: '/mock-tests' },
      reason: 'Early mocks establish a baseline. Even with incomplete syllabus, they reveal question patterns and time management gaps.',
      expectedBenefit: 'Identifies strong/weak areas across tested subjects. Builds exam stamina gradually.',
      estimatedTime: '3 hours (mock) + 2 hours (analysis)',
      confidence: 80,
      source: `AIR Knowledge Base: Mock analysis recommends ${completedSubjects >= 8 ? 'Mock Intensive' : completedSubjects >= 5 ? 'Ready phase mocks' : 'Almost Ready phase mocks'}.`,
    }));
  }

  const revisionDue = (topics || []).filter(t => {
    if (!t.lastRevised) return false;
    const days = Math.floor((Date.now() - new Date(t.lastRevised).getTime()) / 86400000);
    return days >= 7;
  });
  if (revisionDue.length > 0) {
    const firstTopic = revisionDue[0];
    const daysSince = Math.floor((Date.now() - new Date(firstTopic.lastRevised).getTime()) / 86400000);
    const urgency = daysSince > 14 ? 'critical' : 'high';
    recs.push(buildRec('revision_due', {
      priority: urgency === 'critical' ? 'critical' : 'high',
      icon: urgency === 'critical' ? '🔴' : '🔄',
      text: urgency === 'critical'
        ? `${revisionDue.length} topic(s) overdue for revision! "${firstTopic.name}" hasn't been revised in ${daysSince} days.`
        : `${revisionDue.length} topic(s) due for revision. First: "${firstTopic.name}".`,
      action: { label: 'Open Revision', link: '/topics' },
      reason: `Spaced repetition: topics lose 50% of retention within 7 days without review. ${firstTopic.name} was last revised ${daysSince} days ago.`,
      expectedBenefit: '30-min revision restores 80% retention. Prevents forgotten topics during mocks.',
      estimatedTime: `~${revisionDue.length * 20} minutes`,
      confidence: 95,
      source: 'AIR Knowledge Base revision strategy: default intervals (1d → 7d → 14d → 30d → 60d).',
    }));
  }

  if (engineState.predictedAIR && profile.targetAIR && engineState.predictedAIR > profile.targetAIR) {
    const gap = engineState.predictedAIR - profile.targetAIR;
    recs.push(buildRec('air_gap', {
      priority: 'high',
      icon: '🏆',
      text: `Your predicted AIR (${engineState.predictedAIR}) is ${gap} ranks behind your target (${profile.targetAIR}).`,
      action: { label: 'View Predictor', link: '/air-predictor' },
      reason: `The gap of ${gap} ranks is bridgeable. Every 5% improvement in accuracy reduces predicted rank by ~${Math.round(gap * 0.15)}.`,
      expectedBenefit: 'Focused weak-area revision can close 30% of the gap within 3 weeks.',
      estimatedTime: 'Ongoing — integrate into daily study plan',
      confidence: 75,
      source: 'AIR Knowledge Base: Last Month Strategy — targeted revision of weak areas.',
    }));
  }

  const airKnowledge = getAirKnowledge('studyStrategy');
  if (profile.preparationStage === 'beginner' && completedSubjects.length <= 2) {
    recs.push(buildRec('strategy_guidance', {
      priority: 'low',
      icon: '📖',
      text: 'Start with a structured approach: complete one subject fully before moving to the next. Don\'t juggle multiple subjects.',
      action: null,
      reason: airKnowledge?.principle || 'Focused one-subject-at-a-time learning yields deeper understanding than scattered progress.',
      expectedBenefit: 'Builds strong foundations. Avoids the common mistake of shallow knowledge across all subjects.',
      estimatedTime: 'Apply throughout preparation',
      confidence: 95,
      source: 'AIR Knowledge Base: Study Strategy — conceptual clarity over rote memorization.',
    }));
  }

  return recs.slice(0, 6);
}

export function generateRecommendationsFromState(studentState) {
  const state = studentState || {};
  const profile = state.profile || {};
  const topics = state.topics || [];
  const pyqs = state.pyqs || [];
  const engineState = state.engineState || {};
  const studyStats = state.studyStats || {};
  const gateFeatures = state.gateFeatures || {};
  const knowledge = state.knowledge || {};
  const analytics = state.analytics || {};
  const memory = state.memory || {};

  const recs = generateRecommendations(profile, engineState, topics, pyqs, studyStats, gateFeatures);

  if (knowledge?.smartSubjectOrder?.length > 0) {
    const nextSubject = knowledge.smartSubjectOrder[0];
    if (nextSubject && !recs.some(r => r.type === 'next_subject')) {
      recs.push(buildRec('next_subject', {
        priority: 'high',
        icon: '📚',
        text: `Start ${nextSubject.subject}. ${nextSubject.reason}`,
        action: { label: `Open ${nextSubject.subject}`, link: `/subjects/${nextSubject.subject.toLowerCase().replace(/\s+/g, '-')}` },
        reason: nextSubject.pairedContinuity
          ? nextSubject.pairedContinuity.reason
          : nextSubject.conceptualContinuity
            ? `${nextSubject.subject} builds on concepts from ${nextSubject.conceptualContinuity.join(', ')}.`
            : nextSubject.reason,
        expectedBenefit: `Estimated ${nextSubject.estimatedWeeks} weeks to complete. ${nextSubject.subject} has ${getExamWeightage(nextSubject.subject)}% exam weightage.`,
        estimatedTime: `${nextSubject.estimatedWeeks} weeks at ${profile.dailyStudyHours || 4}h/day`,
        confidence: 85,
        source: 'AIR Knowledge Base: Subject Order — weightage-based priority with dependency resolution.',
      }));
    }
  }

  if (knowledge?.resources && !recs.some(r => r.type === 'resource_suggestion')) {
    const resource = knowledge.resources;
    recs.push(buildRec('resource_suggestion', {
      priority: 'low',
      icon: '📺',
      text: `${knowledge.currentSubjectTips?.[0]?.topic || 'Current topic'} resources: ${resource.video || ''} | ${resource.book || ''}`,
      action: { label: 'View Resources', link: `/learn/${encodeURIComponent(state.currentSubject || '')}` },
      reason: 'Using proven resources from AIR toppers saves time and ensures quality conceptual coverage.',
      expectedBenefit: 'Structured learning path with recommended depth for GATE preparation.',
      estimatedTime: 'Per topic: 2-3hr video + 1hr notes + 1hr PYQs',
      confidence: 90,
      source: 'AIR Knowledge Base: Recommended Resources — curated by GATE toppers.',
    }));
  }

  if (knowledge?.mockPhase) {
    const mockPhase = knowledge.mockPhase;
    if (!recs.some(r => r.type === 'mock_phase_advice')) {
      recs.push(buildRec('mock_phase_advice', {
        priority: mockPhase.stage === 'Not Ready' ? 'low' : mockPhase.stage === 'Mock Intensive' ? 'critical' : 'medium',
        icon: mockPhase.stage === 'Not Ready' ? '📘' : mockPhase.stage === 'Mock Intensive' ? '🔥' : '🧪',
        text: `Mock Status: ${mockPhase.stage}. ${mockPhase.advice}`,
        action: mockPhase.stage !== 'Not Ready' ? { label: 'Mock Dashboard', link: '/mock-tests' } : null,
        reason: mockPhase.condition ? `Your current stage: ${mockPhase.condition}` : 'Based on your overall progress and subject completion.',
        expectedBenefit: mockPhase.stage === 'Not Ready'
          ? 'Focus on completing subjects first — mocks are ineffective with incomplete preparation.'
          : mockPhase.stage === 'Mock Intensive'
            ? 'Peak exam readiness. Mocks at this stage build speed, accuracy, and exam temperament.'
            : 'Structured mock practice builds exam familiarity without overwhelming.',
        estimatedTime: mockPhase.stage === 'Not Ready' ? 'Not yet applicable' : '3hr mock + 2hr analysis per session',
        confidence: 88,
        source: `AIR Knowledge Base: Mock Strategy — ${mockPhase.stage} phase guidance.`,
      }));
    }
  }

  if (analytics?.coachingInsight?.length > 0) {
    analytics.coachingInsight.forEach((insight, i) => {
      if (i < 2) {
        recs.push(buildRec('coaching_insight', {
          priority: 'medium',
          icon: '🧠',
          text: insight,
          action: null,
          reason: 'Personalized observation based on your study patterns and progress trends.',
          expectedBenefit: 'Awareness of your own progress patterns helps maintain motivation and focus.',
          estimatedTime: null,
          confidence: 85,
          source: 'AI Mentor analysis of your study history and performance trends.',
        }));
      }
    });
  }

  if (analytics?.mistakesTrend && !recs.some(r => r.type === 'mistake_pattern')) {
    recs.push(buildRec('mistake_pattern', {
      priority: 'high',
      icon: '📋',
      text: analytics.mistakesTrend.message,
      action: { label: 'Review Mistakes', link: '/mistakes' },
      reason: `You've repeated errors in ${analytics.mistakesTrend.repeatedMistakes.length} topic(s). Repeated mistakes indicate conceptual gaps, not carelessness.`,
      expectedBenefit: 'Focused revision on error-prone topics can improve accuracy by 15-25%.',
      estimatedTime: `~${analytics.mistakesTrend.repeatedMistakes.length * 1.5} hours of targeted revision`,
      confidence: 90,
      source: 'AI Mentor: Pattern detection from your PYQ history.',
    }));
  }

  // === Phase 4 — AIR Intelligence Recommendations ===

  // 1. Subject Guidance with dependency reasoning
  if (knowledge?.airIntelligence?.mockReadiness?.stage === 'Not Ready' || profile.completedSubjects?.length < 8) {
    const smartOrder = knowledge?.smartSubjectOrder || [];
    const nextSubject = smartOrder[0];
    if (nextSubject && !recs.some(r => r.type.startsWith('subject_guidance'))) {
      const prereqs = nextSubject.remainingPrerequisites || [];
      const continuity = nextSubject.conceptualContinuity;
      const pairing = nextSubject.pairedContinuity;
      let whyReason = nextSubject.reason || '';

      if (pairing) {
        whyReason += ` ${pairing.subject} is already completed. AIR strategy recommends ${nextSubject.subject} now because ${pairing.reason}`;
      }
      if (continuity && continuity.length > 0) {
        whyReason += ` Concepts from ${continuity.join(', ')} transfer naturally to ${nextSubject.subject}.`;
      }
      if (prereqs.length > 0) {
        whyReason += ` Note: ${prereqs.join(', ')} ${prereqs.length > 1 ? 'are' : 'is'} prerequisite — complete ${prereqs.join(' and ')} first for best results.`;
      }

      recs.push(buildRec('subject_guidance', {
        priority: 'high',
        icon: '🎯',
        text: `Start ${nextSubject.subject} next.`,
        action: { label: `Open ${nextSubject.subject}`, link: `/subjects/${nextSubject.subject.toLowerCase().replace(/\s+/g, '-')}` },
        reason: whyReason,
        expectedBenefit: `${nextSubject.subject} carries ${getExamWeightage(nextSubject.subject)}% exam weightage. ${nextSubject.estimatedWeeks} weeks to complete at ${profile.dailyStudyHours || 4}h/day.`,
        estimatedTime: `${nextSubject.estimatedWeeks} weeks`,
        confidence: prereqs.length === 0 ? 90 : 75,
        source: 'AIR Strategy: Subject order based on dependency resolution, weightage priority, and conceptual continuity.',
      }));
    }
  }

  // 2. PYQ Strategy recommendation
  const airIntelligence = knowledge?.airIntelligence;
  if (airIntelligence?.pyqPatterns) {
    const completedSubjects = profile.completedSubjects || [];
    const current = studentState.currentSubject;
    const targetSubject = current || completedSubjects[completedSubjects.length - 1];
    if (targetSubject && airIntelligence.pyqPatterns[targetSubject]) {
      const pattern = airIntelligence.pyqPatterns[targetSubject];
      const analyticsData = analytics;
      const topicConfidences = analyticsData?.topicConfidence || [];
      const weakTopicsInSubject = topicConfidences.filter(tc =>
        (tc.subject === targetSubject) && (tc.confidence === 'Low' || tc.confidence === 'Very Low')
      );

      if (pattern && !recs.some(r => r.type === 'pyq_strategy')) {
        const difficultyAdvice = pattern.difficulty === 'Hard'
          ? 'Focus on conceptual clarity before timed practice. Start with topic-wise sorting.'
          : pattern.difficulty === 'Easy'
            ? 'Use these to build speed and confidence. Target 90%+ accuracy.'
            : 'Mix of concept and application questions. Medium difficulty rewards consistent practice.';

        recs.push(buildRec('pyq_strategy', {
          priority: 'medium',
          icon: '📝',
          text: `PYQ Strategy for ${targetSubject}: Solve PYQs from ${pattern.pyqYears.slice(-4).join(', ')}. Focus on ${pattern.topics.slice(0, 3).join(', ')}.`,
          action: { label: `Practice ${targetSubject} PYQs`, link: `/pyq?subject=${encodeURIComponent(targetSubject)}` },
          reason: `${targetSubject}: ${pattern.difficulty} difficulty, ${pattern.avgQuestions} avg questions, ${pattern.weightage}% weightage. ${difficultyAdvice}${weakTopicsInSubject.length > 0 ? ` Weak areas: ${weakTopicsInSubject.map(t => t.name).join(', ')}.` : ''}`,
          expectedBenefit: `${pattern.avgQuestions} questions mastered = ~${Math.round(pattern.avgQuestions * 1.5)} marks secured in this subject.`,
          estimatedTime: `${pattern.pyqYears.length} years × ${pattern.avgQuestions} Q = ~${pattern.pyqYears.length * pattern.avgQuestions * 2} min`,
          confidence: pattern.pyqYears.length > 5 ? 88 : 75,
          source: `AIR Knowledge: ${targetSubject} PYQ pattern analysis from last ${pattern.pyqYears.length} years.`,
        }));
      }
    }
  }

  // 3. Mock Readiness with specific stage advice
  const mockReadiness = airIntelligence?.mockReadiness || knowledge?.mockPhase;
  if (mockReadiness && !recs.some(r => r.type === 'mock_readiness')) {
    const stage = mockReadiness.stage || mockReadiness?.stage;
    const advice = mockReadiness.advice || '';
    let icon = '📘';
    let priority = 'low';
    if (stage === 'Ready' || stage === 'Almost Ready') { icon = '🧪'; priority = 'medium'; }
    if (stage === 'Mock Intensive Phase') { icon = '🔥'; priority = 'critical'; }
    if (stage === 'Final Revision Phase') { icon = '🏁'; priority = 'critical'; }

    recs.push(buildRec('mock_readiness', {
      priority,
      icon,
      text: `Mock Status: ${stage}. ${advice}`,
      action: stage !== 'Not Ready' ? { label: 'Mock Dashboard', link: '/mock-tests' } : { label: 'Continue Subject Study', link: '/subjects' },
      reason: `Based on ${profile.completedSubjects?.length || 0} subjects completed, ${Math.round(analytics?.coveragePct || 0)}% coverage, and ${Math.round(analytics?.accuracy || 0)}% PYQ accuracy. ${stage === 'Not Ready' ? 'Complete 5+ subjects with topic-wise PYQs before attempting mocks.' : ''}`,
      expectedBenefit: stage === 'Not Ready' ? 'Focus on completing subjects first — mocks with gaps are wasted.' :
        stage === 'Mock Intensive Phase' ? 'Peak readiness: each mock + deep analysis improves rank by ~5-10 positions.' :
        stage === 'Final Revision Phase' ? 'Light revision + calmness in last week is worth 10+ marks.' :
        'Structured mock practice builds exam temperament without overload.',
      estimatedTime: stage === 'Not Ready' ? 'Not yet applicable' : '3hr mock + 2hr analysis per session',
      confidence: analytics?.coveragePct ? 85 : 70,
      source: `AIR Mock Strategy: ${stage} phase guidance from GATE topper preparation framework.`,
    }));
  }

  // 4. Revision Intelligence — adaptive revision plan
  const topicConfidences = analytics?.topicConfidence || [];
  const criticalRevision = topicConfidences.filter(tc =>
    tc.needsRevision && (tc.confidence === 'Low' || tc.confidence === 'Very Low' || tc.daysSinceRevision > 21)
  );
  const pendingRevision = topicConfidences.filter(tc => tc.needsRevision);

  if (criticalRevision.length > 0 && !recs.some(r => r.type === 'revision_intelligence')) {
    const topic = criticalRevision[0];
    const urgency = topic.daysSinceRevision > 21 ? 'critical' : 'high';

    recs.push(buildRec('revision_intelligence', {
      priority: urgency === 'critical' ? 'critical' : 'high',
      icon: urgency === 'critical' ? '🔴' : '🔄',
      text: urgency === 'critical'
        ? `⚠️ "${topic.name}" hasn't been revised in ${topic.daysSinceRevision} days. Confidence: ${topic.confidence}. Immediate revision needed.`
        : `"${topic.name}" due for revision. Last revised ${topic.daysSinceRevision} days ago. Confidence: ${topic.confidence}.`,
      action: { label: `Revise ${topic.name}`, link: `/topics` },
      reason: topic.daysSinceRevision > 21
        ? `Retention drops below 30% after 21 days without revision (Ebbinghaus curve). ${topic.name} was at ${topic.accuracy}% accuracy — needs active recall.`
        : `${topic.name} accuracy is ${topic.accuracy}% with confidence ${topic.confidence}. AIR revision schedule recommends revision every 7-14 days.`,
      expectedBenefit: `30-min active recall session restores 80%+ retention for ${topic.name}. Prevents weak-topic cascade during mocks.`,
      estimatedTime: `~${Math.max(15, 30 - topic.daysSinceRevision)} min`,
      confidence: 92,
      source: `AIR Revision Strategy: Adaptive intervals based on topic confidence and time since revision. ${topic.daysSinceRevision > 14 ? 'Overdue topics lose 50% retention per 7 days.' : ''}`,
    }));
  }

  if (pendingRevision.length > 0 && !recs.some(r => r.type === 'revision_intelligence_summary')) {
    recs.push(buildRec('revision_intelligence_summary', {
      priority: 'medium',
      icon: '📋',
      text: `Revision Plan: ${pendingRevision.length} topic(s) need revision. ${criticalRevision.length} ${criticalRevision.length === 1 ? 'is' : 'are'} critical.`,
      action: { label: 'View Revision Plan', link: '/topics' },
      reason: `AIR strategy: ${criticalRevision.length > 0 ? `${criticalRevision.length} overdue topic(s) — priority revision needed. ` : ''}Topics that fade lose 50-80% retention. Weekly revision cycles prevent this.`,
      expectedBenefit: `Systematic revision of ${pendingRevision.length} topics improves mock accuracy by 10-15%.`,
      estimatedTime: `~${pendingRevision.length * 20} min for quick revision, ${pendingRevision.length * 45} min for deep revision`,
      confidence: 88,
      source: 'AIR Revision Schedule: Default intervals 1d → 7d → 14d → 30d → 60d with adaptive adjustments.',
    }));
  }

  // 5. Learning Hub — resource recommendations
  const learningResources = airIntelligence?.learningResources || {};
  const resourceKeys = Object.keys(learningResources);
  if (resourceKeys.length > 0 && !recs.some(r => r.type === 'learning_hub')) {
    const firstSubject = resourceKeys[0];
    const resources = learningResources[firstSubject];
    if (resources) {
      recs.push(buildRec('learning_hub', {
        priority: 'medium',
        icon: '📺',
        text: `Learning Resources for ${firstSubject}: ${resources.videos ? `Video: ${resources.videos.substring(0, 60)}...` : ''}`,
        action: { label: `Explore ${firstSubject} Resources`, link: `/learning-hub?subject=${encodeURIComponent(firstSubject)}` },
        reason: `TOP 20 AIR strategy: Use one main source per subject. ${firstSubject} resources curated from GATE topper recommendations. ${resources.practice ? `Practice via: ${resources.practice.substring(0, 60)}.` : ''}`,
        expectedBenefit: 'Structured learning path with proven resources reduces wasted time and ensures GATE-level depth.',
        estimatedTime: 'Per topic: 2-3hr video + 1hr notes + 1hr PYQs',
        confidence: 90,
        source: 'AIR Knowledge Base: Curated resources from GATE topper preparation guides.',
      }));
    }
  }

  // 6. Topic Weightage — prioritize high-weightage topics
  const airKnowledge = getAirKnowledge('topicPriority');
  const weakAreas = analytics?.weakAreas || [];
  if (weakAreas.length > 0 && !recs.some(r => r.type === 'topic_weightage')) {
    const topic = weakAreas[0];
    const subject = topic.subject || topic.topic || '';
    const weightage = getExamWeightage(subject);
    const topicResource = getLearningResources(subject);

    recs.push(buildRec('topic_weightage', {
      priority: 'high',
      icon: '⚡',
      text: `High-value target: ${topic.subject || topic.topic || subject} — ${weightage}% exam weightage and identified as weak.`,
      action: { label: `Study ${subject}`, link: `/subjects/${subject.toLowerCase().replace(/\s+/g, '-')}` },
      reason: `Weightage-based strategy: ${subject} contributes ${weightage}% to GATE score. AIR toppers prioritize high-weightage weak subjects first — marks-per-hour is highest here.${topicResource ? ` ${topicResource.videos ? `Recommended: ${topicResource.videos.substring(0, 80)}` : ''}` : ''}`,
      expectedBenefit: `Improving ${subject} from weak to strong typically adds ${Math.round(weightage * 0.3)}% to overall score.`,
      estimatedTime: weightage >= 10 ? '3-4 weeks for mastery' : '1-2 weeks for competency',
      confidence: 85,
      source: `AIR Knowledge: Topic Priority — "${airKnowledge?.principle || 'Weightage-based focus for maximum improvement.'}"`,
    }));
  }

  // 7. Exam Hall Strategy (when close to exam)
  if (profile.gateExamYear && Number(profile.gateExamYear) <= new Date().getFullYear() + 1) {
    const examStrategy = airIntelligence?.examHallStrategy || [];
    if (examStrategy.length > 0 && !recs.some(r => r.type === 'exam_hall_strategy')) {
      const tip = examStrategy[Math.floor(Math.random() * examStrategy.length)];
      recs.push(buildRec('exam_hall_strategy', {
        priority: 'low',
        icon: '🎯',
        text: `Exam Hall Tip: ${typeof tip === 'string' ? tip : (tip.advice || tip)}`,
        action: null,
        reason: 'AIR toppers emphasize that exam hall strategy is worth 10+ marks. Calmness and time management separate rank holders.',
        expectedBenefit: 'Better question selection, fewer silly mistakes, calmer exam experience.',
        estimatedTime: 'Apply on exam day',
        confidence: 95,
        source: 'AIR Strategy: Deepak Poonia — "Calmness has the weightage of 10 marks in GATE Exam."',
      }));
    }
  }

  return recs.slice(0, 12);
}
