import { useEffect, useRef } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { useAiMentor } from '../../context/AiMentorContext';
import { publish, EVENTS } from '../../services/aiEventSystem';
import { initOrchestrator, destroyOrchestrator, onStateChange } from '../../services/aiOrchestrator';

export default function AiMentorTracker() {
  const {
    profile,
    updateProfile,
    setUnifiedAiState,
  } = useAiMentor();
  const { topics, studyStats, gateFeatures, pyqs, mocks } = useProgress();
  const prevRef = useRef({});
  const unsubRef = useRef(null);

  useEffect(() => {
    initOrchestrator({
      getProfile: () => profile,
      getTopics: () => topics || [],
      getStudyStats: () => studyStats || {},
      getGateFeatures: () => gateFeatures || {},
      getPyqs: () => pyqs || [],
      getMocks: () => mocks || [],
    });

    unsubRef.current = onStateChange((aiState) => {
      setUnifiedAiState(aiState);
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
      destroyOrchestrator();
    };
  }, []);

  useEffect(() => {
    const hours = gateFeatures?.todayProgress?.hours || 0;
    if (hours !== prevRef.current.studyHours) {
      prevRef.current.studyHours = hours;
      publish(EVENTS.STUDY_HOURS_UPDATED, { hours });
    }
  }, [gateFeatures?.todayProgress?.hours]);

  useEffect(() => {
    const streak = gateFeatures?.streak?.current || 0;
    if (streak !== prevRef.current.streak) {
      prevRef.current.streak = streak;
      publish(EVENTS.STREAK_UPDATED, { streak });
    }
  }, [gateFeatures?.streak?.current]);

  useEffect(() => {
    const progress = studyStats?.overallProgress || 0;
    if (Math.abs(progress - (prevRef.current.overallProgress || 0)) > 1) {
      prevRef.current.overallProgress = progress;
      publish(EVENTS.OVERALL_PROGRESS_UPDATED, { progress });
    }
  }, [studyStats?.overallProgress]);

  useEffect(() => {
    const safe = topics || [];
    const done = safe.filter(t => {
      const p = t.progress || {};
      return ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].every(k => p[k]);
    }).length;
    const total = safe.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    if (done !== prevRef.current.topicsDone) {
      prevRef.current.topicsDone = done;
      if (done > 0) publish(EVENTS.TOPIC_COMPLETED, { done, total });
    }
    if (pct !== prevRef.current.completionPct) {
      prevRef.current.completionPct = pct;
      publish(EVENTS.COMPLETION_PERCENTAGE_CHANGED, { pct, done, total });
    }
  }, [topics]);

  useEffect(() => {
    const stats = studyStats?.pyqStats || {};
    const accuracy = stats.overallAccuracy;
    if (accuracy !== undefined && accuracy !== prevRef.current.pyqAccuracy) {
      prevRef.current.pyqAccuracy = accuracy;
      publish(EVENTS.ACCURACY_CHANGED, { accuracy });
    }
  }, [studyStats?.pyqStats?.overallAccuracy]);

  useEffect(() => {
    const updates = {};
    const safeTopics = topics || [];
    const inProgressTopic = safeTopics.find(t => {
      const p = t.progress || {};
      const done = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].filter(k => p[k]).length;
      return done > 0 && done < 8;
    });
    if (inProgressTopic) {
      updates.currentSubject = inProgressTopic.subject?.name || inProgressTopic.subject;
      updates.currentTopic = inProgressTopic.name;
    }
    if (Object.keys(updates).length > 0) updateProfile(updates);
  }, [topics]);

  return null;
}
