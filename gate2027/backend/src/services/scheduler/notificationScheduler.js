// src/services/scheduler/notificationScheduler.js
// Asia/Kolkata-aware scheduler for daily notification slots.
// Uses node-cron (already in package.json) — one slot per job.

const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('../../models/User');
const engine = require('../notificationEngine');

let started = false;
const tasks = [];

// cron expressions (IST). node-cron accepts `timezone` option.
const SLOT_SCHEDULES = [
  { slot: 'morning', expr: '0 8 * * *' },
  { slot: 'late_morning', expr: '30 11 * * *' },
  { slot: 'afternoon', expr: '0 15 * * *' },
  { slot: 'evening', expr: '0 19 * * *' },
  { slot: 'night', expr: '0 21 * * *' },
];

async function listEligibleUsers() {
  // Notifications respect User.preferences.notifications as the master
  // toggle (when present). We include any non-deleted user.
  return User.find({ deletedAt: null }).select('_id preferences').lean();
}

async function executeSlot(slot, opts = {}) {
  const tag = opts.tag || 'manual';
  console.log(`[NotificationScheduler] slot ${slot} started (${tag})`);
  const users = await listEligibleUsers();
  let generated = 0;
  let duplicates = 0;
  let errors = 0;

  for (const u of users) {
    try {
      const result = await engine.generateDailyNotifications(u._id, {
        slot,
        schedulerRun: true,
      });
      generated += result.created || 0;
      duplicates += result.skipped || 0;
    } catch (err) {
      errors += 1;
      console.error(`[NotificationScheduler] user ${u._id} failed:`, err.message);
      // Never re-throw — one user's failure must not stop the rest.
    }
  }

  console.log(
    `[NotificationScheduler] slot ${slot} done (${tag}) — ` +
    `generated ${generated}, skipped ${duplicates} duplicates, errors ${errors}`
  );
  return { generated, duplicates, errors };
}

function startNotificationScheduler() {
  if (started) {
    console.log('[NotificationScheduler] already started — skipping re-registration');
    return;
  }
  if (!mongoose || !mongoose.connection) {
    console.warn('[NotificationScheduler] mongoose not ready — scheduler not started');
    return;
  }
  started = true;

  console.log('[NotificationScheduler] started');
  for (const s of SLOT_SCHEDULES) {
    const task = cron.schedule(
      s.expr,
      () => {
        executeSlot(s.slot, { tag: 'cron' }).catch((err) =>
          console.error(`[NotificationScheduler] slot ${s.slot} crashed:`, err.message)
        );
      },
      { timezone: 'Asia/Kolkata' }
    );
    tasks.push(task);
  }
}

function stopNotificationScheduler() {
  for (const t of tasks) {
    try { t.stop(); } catch { /* ignore */ }
  }
  tasks.length = 0;
  started = false;
  console.log('[NotificationScheduler] stopped');
}

function isStarted() { return started; }

module.exports = {
  startNotificationScheduler,
  stopNotificationScheduler,
  executeSlot,
  isStarted,
  SLOT_SCHEDULES,
};
