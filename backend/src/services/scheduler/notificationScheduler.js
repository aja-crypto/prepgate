const cron = require('node-cron');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const { isMongoConnected } = require('../../config/db');
const {
  SLOTS,
  generateDailyNotifications,
  generateOnboardingNotifications,
  getGateNexaNow,
} = require('../notificationEngine');

let started = false;
const registeredTasks = [];

const SLOT_CRON = {
  morning: '0 8 * * *',
  late_morning: '30 11 * * *',
  afternoon: '0 15 * * *',
  evening: '0 19 * * *',
  night: '0 21 * * *',
};

async function executeSlot(slot, options = {}) {
  const now = options.now ? new Date(options.now) : getGateNexaNow();
  let generated = 0;
  let skippedDuplicates = 0;
  let skipped = 0;
  let onboardingCreated = 0;
  let onboardingDuplicates = 0;
  const targetUserId = options.userId ? String(options.userId) : null;

  if (!SLOT_CRON[slot]) {
    return { generated, skippedDuplicates, skipped, slot, onboardingCreated, onboardingDuplicates };
  }

  const filter = { deletedAt: null };
  if (targetUserId && /^[0-9a-f]{24}$/i.test(targetUserId)) {
    filter._id = targetUserId;
  }
  const users = await User.find(filter).select('_id').lean();
  for (const user of users) {
    try {
      const result = await generateDailyNotifications(user._id, {
        slot,
        schedulerRun: true,
        now,
      });
      generated += result.created || 0;
      skippedDuplicates += result.skippedDuplicate || 0;
      skipped += result.skipped || 0;
    } catch (e) {
      console.error('[NotificationScheduler] daily user failed', user._id, e && e.message);
    }
    try {
      const ob = await generateOnboardingNotifications(user._id, { now });
      onboardingCreated += ob.created || 0;
      onboardingDuplicates += ob.skippedDuplicate || 0;
    } catch (e) {
      console.error('[NotificationScheduler] onboarding user failed', user._id, e && e.message);
    }
  }

  console.log('[NotificationScheduler] slot executed', slot);
  console.log(`[NotificationScheduler] generated ${generated} (daily), ${onboardingCreated} (onboarding)`);
  console.log(`[NotificationScheduler] skipped ${skippedDuplicates} duplicates, ${onboardingDuplicates} onboarding duplicates`);
  return { generated, skippedDuplicates, skipped, slot, onboardingCreated, onboardingDuplicates };
}

function startNotificationScheduler() {
  if (started) return { started: false, reason: 'already_started' };
  started = true;

  if (!isMongoConnected()) {
    console.warn('[NotificationScheduler] skipped (MongoDB not ready)');
    started = false;
    return { started: false, reason: 'no_mongo' };
  }

  Notification.syncIndexes().catch(() => {
    console.error('[NotificationScheduler] index sync failed');
  });

  for (const slot of SLOTS) {
    const expr = SLOT_CRON[slot.id];
    const task = cron.schedule(
      expr,
      () => {
        executeSlot(slot.id).catch(() => {
          console.error('[NotificationScheduler] slot failed');
        });
      },
      { timezone: 'Asia/Kolkata' }
    );
    registeredTasks.push(task);
  }

  console.log('[NotificationScheduler] started');
  return { started: true, tasks: registeredTasks.length };
}

function stopNotificationScheduler() {
  for (const task of registeredTasks) {
    try {
      task.stop();
    } catch {
      // ignore
    }
  }
  registeredTasks.length = 0;
  started = false;
}

function isNotificationSchedulerStarted() {
  return started;
}

module.exports = {
  startNotificationScheduler,
  stopNotificationScheduler,
  executeSlot,
  isNotificationSchedulerStarted,
};
