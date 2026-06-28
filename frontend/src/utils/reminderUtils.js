// Browser notification reminders for study, revision, and mock tests

export function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission();
}

export function sendNotification(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag, icon: '/favicon.ico' });
  } catch { /* ignore */ }
}

function timeMatches(now, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return now.getHours() === h && now.getMinutes() === m;
}

export function checkReminders(notifications, data) {
  if (!notifications?.pushEnabled) return;
  const now = new Date();
  const key = now.toISOString().slice(0, 16);

  if (notifications.dailyStudy?.enabled && timeMatches(now, notifications.dailyStudy.time)) {
    const hours = data.gateFeatures?.todayProgress?.hours ?? 0;
    const target = data.gateFeatures?.dailyTarget?.hours ?? 8;
    if (hours < target) {
      sendNotification('📚 Daily Study Reminder', `You've studied ${hours}h today. Target: ${target}h. Keep going!`, `daily-${key}`);
    }
  }

  if (notifications.revision?.enabled && timeMatches(now, notifications.revision.time)) {
    const due = (data.revisionSchedule || []).filter((r) => r.status === 'missed' || r.status === 'today');
    if (due.length) {
      sendNotification('🔄 Revision Reminder', `${due.length} topic(s) need revision today.`, `revision-${key}`);
    }
  }

  if (notifications.mockTest?.enabled && timeMatches(now, notifications.mockTest.time)) {
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!notifications.mockTest.day || day === notifications.mockTest.day) {
      sendNotification('🎯 Mock Test Reminder', 'Time for a mock test! Track your progress.', `mock-${key}`);
    }
  }

  if (notifications.goalCompletion?.enabled) {
    const daily = data.gateFeatures?.todayProgress;
    const target = data.gateFeatures?.dailyTarget;
    if (daily && target && daily.hours >= target.hours && daily.topicsCompleted >= target.topicsToComplete) {
      sendNotification('🎉 Goal Completed!', 'You hit your daily study target. Great work!', `goal-${key}`);
    }
  }
}

export function useReminderScheduler(notifications, data) {
  if (typeof window === 'undefined') return;
  const interval = setInterval(() => checkReminders(notifications, data), 60000);
  return () => clearInterval(interval);
}
