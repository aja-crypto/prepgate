import { useEffect, useRef, useCallback } from 'react';
import { publish, EVENTS } from '../services/aiEventSystem';

export function usePageTracking(pageName) {
  const prevPath = useRef(null);

  useEffect(() => {
    publish('page:navigated', { page: pageName, timestamp: Date.now() });
  }, [pageName]);
}

export function useTrackLogin() {
  useEffect(() => {
    publish(EVENTS.LOGIN, { timestamp: Date.now() });
  }, []);
}

export function useTrackTopicAction() {
  const trackStarted = useCallback((topicName, subject) => {
    publish(EVENTS.TOPIC_STARTED, { topicName, subject, timestamp: Date.now() });
  }, []);

  const trackCompleted = useCallback((topicName) => {
    publish(EVENTS.TOPIC_COMPLETED, { topicName, timestamp: Date.now() });
  }, []);

  const trackRevision = useCallback((topicName, revisionNumber) => {
    publish(EVENTS.REVISION_COMPLETED, { topicName, revisionNumber, timestamp: Date.now() });
  }, []);

  return { trackStarted, trackCompleted, trackRevision };
}

export function useTrackLearningHub() {
  const trackVideoWatched = useCallback((video) => {
    publish(EVENTS.VIDEO_WATCHED, {
      title: video.title,
      videoId: video.youtubeId || video._id,
      channel: video.channel,
      subject: video.subject,
      timestamp: Date.now(),
    });
  }, []);

  const trackVideoCompleted = useCallback((video) => {
    publish(EVENTS.VIDEO_COMPLETED, {
      title: video.title,
      videoId: video.youtubeId || video._id,
      channel: video.channel,
      subject: video.subject,
      timestamp: Date.now(),
    });
  }, []);

  const trackVideoSkipped = useCallback((video) => {
    publish(EVENTS.VIDEO_SKIPPED, {
      title: video.title,
      videoId: video.youtubeId || video._id,
      timestamp: Date.now(),
    });
  }, []);

  const trackNotesOpened = useCallback((subject) => {
    publish(EVENTS.NOTES_OPENED, { subject, timestamp: Date.now() });
  }, []);

  const trackNotesCompleted = useCallback((subject) => {
    publish(EVENTS.NOTES_COMPLETED, { subject, timestamp: Date.now() });
  }, []);

  const trackPdfOpened = useCallback((subject) => {
    publish(EVENTS.PDF_OPENED, { subject, timestamp: Date.now() });
  }, []);

  const trackRevisionClicked = useCallback(() => {
    publish(EVENTS.REVISION_CLICKED, { timestamp: Date.now() });
  }, []);

  const trackTopicCompleted = useCallback((topicName) => {
    publish(EVENTS.TOPIC_COMPLETED_FROM_HUB, { topicName, timestamp: Date.now() });
  }, []);

  return { trackVideoWatched, trackVideoCompleted, trackVideoSkipped, trackNotesOpened, trackNotesCompleted, trackPdfOpened, trackRevisionClicked, trackTopicCompleted };
}

export function useTrackPyq() {
  const trackSolved = useCallback((data) => {
    publish(EVENTS.PYQ_SOLVED, { correct: data.correct, topic: data.topic, stats: data.stats, timestamp: Date.now() });
  }, []);

  const trackCorrect = useCallback((data) => {
    publish(EVENTS.PYQ_CORRECT, { topic: data.topic, questionId: data.questionId, timestamp: Date.now() });
  }, []);

  const trackWrong = useCallback((data) => {
    publish(EVENTS.PYQ_WRONG, { topic: data.topic, questionId: data.questionId, timestamp: Date.now() });
  }, []);

  const trackSkipped = useCallback((data) => {
    publish(EVENTS.PYQ_SKIPPED, { topic: data.topic, questionId: data.questionId, timestamp: Date.now() });
  }, []);

  return { trackSolved, trackCorrect, trackWrong, trackSkipped };
}

export function useTrackPredictor() {
  const trackAirUpdated = useCallback((air) => {
    publish(EVENTS.PREDICTED_AIR_UPDATED, { air, timestamp: Date.now() });
  }, []);

  const trackMarksUpdated = useCallback((marks) => {
    publish(EVENTS.PREDICTED_MARKS_UPDATED, { marks, timestamp: Date.now() });
  }, []);

  const trackAdmissionReport = useCallback(() => {
    publish(EVENTS.ADMISSION_REPORT_VIEWED, { timestamp: Date.now() });
  }, []);

  return { trackAirUpdated, trackMarksUpdated, trackAdmissionReport };
}
