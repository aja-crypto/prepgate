import { publish, EVENTS } from './aiEventSystem';

let notificationId = 0;
const activeNotifications = [];

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function createNotification(type, data) {
  const notification = {
    id: ++notificationId,
    type,
    data,
    priority: data.priority || 'low',
    timestamp: Date.now(),
    read: false,
  };
  activeNotifications.unshift(notification);
  if (activeNotifications.length > 50) activeNotifications.pop();
  publish('notification:created', notification);
  return notification;
}

export function getActiveNotifications(limit = 10) {
  return activeNotifications.slice(0, limit).sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export function markNotificationRead(id) {
  const n = activeNotifications.find(n => n.id === id);
  if (n) n.read = true;
}

export function markAllRead() {
  activeNotifications.forEach(n => n.read = true);
}

export function generateNotificationsFromState(studentState, roadmap, recommendations) {
  const newNotes = [];
  const analytics = studentState?.analytics || {};
  const memory = studentState?.memory || {};
  const knowledge = studentState?.knowledge || {};
  const profile = studentState?.profile || {};

  // Standard notifications
  if (roadmap?.nextRevisionCount > 0) {
    newNotes.push(createNotification('revision_due', {
      priority: 'high',
      icon: '🔄',
      title: 'Revision Due',
      message: `${roadmap.nextRevisionCount} topic(s) need revision. First due for revision.`,
      action: { label: 'Review Now', link: '/topics' },
    }));
  }

  if (analytics?.momentum === 'decreasing') {
    newNotes.push(createNotification('momentum_drop', {
      priority: 'medium',
      icon: '📉',
      title: 'Study Momentum Dropping',
      message: 'Your study hours have declined compared to last period. Even 30 min maintains the habit.',
      action: { label: 'Focus Session', link: '/focus' },
    }));
  }

  if (analytics?.accuracy < 40 && analytics?.totalSolved > 5) {
    newNotes.push(createNotification('low_accuracy', {
      priority: 'high',
      icon: '⚠️',
      title: 'PYQ Accuracy Low',
      message: `Your accuracy is ${Math.round(analytics.accuracy)}%. Review concepts before solving more.`,
      action: { label: 'Review Mistakes', link: '/mistakes' },
    }));
  }

  if (analytics?.coveragePct >= 40 && analytics?.revisionHealth < 30) {
    newNotes.push(createNotification('low_revision', {
      priority: 'medium',
      icon: '↻',
      title: 'Revision Needed',
      message: `Only ${analytics.revisionHealth}% of completed topics have been revised. Retention drops 50% in 7 days.`,
      action: { label: 'Start Revision', link: '/topics' },
    }));
  }

  // Mistake pattern detection
  if (analytics?.mistakesTrend) {
    newNotes.push(createNotification('mistake_pattern_detected', {
      priority: 'critical',
      icon: '📋',
      title: 'Repeated Mistakes Detected',
      message: analytics.mistakesTrend.message,
      action: { label: 'Analyze Patterns', link: '/mistakes' },
    }));
  }

  if (analytics?.skippedSubjectPattern) {
    const skipped = analytics.skippedSubjectPattern;
    newNotes.push(createNotification('subject_avoidance', {
      priority: 'high',
      icon: '⏭️',
      title: 'Subjects Being Delayed',
      message: skipped.message,
      action: { label: `Start ${skipped.subjects[0] || 'Planning'}`, link: `/subjects/${(skipped.subjects[0] || '').toLowerCase().replace(/\s+/g, '-')}` },
    }));
  }

  // Personalized motivation based on actual data
  if (analytics?.accuracyTrend?.trend === 'improving') {
    newNotes.push(createNotification('accuracy_milestone', {
      priority: 'low',
      icon: '📈',
      title: 'Accuracy Improving',
      message: `Your accuracy improved by ${analytics.accuracyTrend.change}%. Your focused practice is working — keep it up!`,
      action: null,
    }));
  }

  if (analytics?.hoursTrend?.trend === 'increasing') {
    newNotes.push(createNotification('hours_milestone', {
      priority: 'low',
      icon: '⚡',
      title: 'Study Output Increasing',
      message: `You're studying ${Math.abs(analytics.hoursTrend.change)}% more than last week. This momentum compounds into exam day confidence.`,
      action: null,
    }));
  }

  if (analytics?.consistency >= 70 && analytics?.mentorScore > 60) {
    newNotes.push(createNotification('strong_momentum', {
      priority: 'low',
      icon: '🔥',
      title: 'Strong Momentum',
      message: `Mentor Score: ${analytics.mentorScore}. You're on track. Maintain this rhythm and your target AIR is within reach.`,
      action: null,
    }));
  }

  if (profile?.firstAttempt && profile?.onboardingCompleted && analytics?.coveragePct > 30) {
    newNotes.push(createNotification('first_attempt_milestone', {
      priority: 'low',
      icon: '🌟',
      title: 'First Attempt Progress',
      message: `You've already covered ${analytics.coveragePct}% of topics in your first attempt. Many aspirants don't reach this stage.`,
      action: null,
    }));
  }

  // Knowledge-based notifications
  if (knowledge?.mockPhase?.stage === 'Not Ready' && analytics?.coveragePct > 30) {
    const nextTarget = knowledge.smartSubjectOrder?.[0]?.subject || 'next subject';
    newNotes.push(createNotification('mock_readiness', {
      priority: 'medium',
      icon: '📘',
      title: 'Preparing for Mocks',
      message: `Not yet in mock phase. Complete 5+ subjects first. Next: ${nextTarget}.`,
      action: { label: 'View Roadmap', link: '/mentor' },
    }));
  }

  if (knowledge?.mockPhase?.stage === 'Mock Intensive') {
    newNotes.push(createNotification('mock_intensive_phase', {
      priority: 'critical',
      icon: '🔥',
      title: 'Peak Mock Phase',
      message: 'You are in the mock-intensive phase. Alternate mocks with analysis. 3-4 mocks per week in the final month.',
      action: { label: 'Take Mock', link: '/mock-tests' },
    }));
  }

  // Long-term coaching: weekly/monthly reflections
  const trends = memory?.coachingTrends;
  if (trends?.snapshots?.length >= 7) {
    const weeklyHours = trends.weeklyTrend?.avgHoursPerDay;
    const dailyTarget = profile?.dailyStudyHours || 4;
    if (weeklyHours && weeklyHours >= dailyTarget) {
      newNotes.push(createNotification('weekly_target_met', {
        priority: 'low',
        icon: '✅',
        title: 'Weekly Target Achieved',
        message: `Averaged ${weeklyHours}h/day this week meeting your ${dailyTarget}h target. Consistency is your superpower.`,
        action: null,
      }));
    }
  }

  return newNotes;
}
