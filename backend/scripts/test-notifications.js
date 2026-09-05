/**
 * Isolated notification-system tests.
 * Uses an in-memory MongoDB and a dedicated test user.
 * Does not change the host clock or existing user data.
 */
process.env.NODE_ENV = 'test';
process.env.GATENEXA_TEST_TIME = '1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_notifications_min_32';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_notifications';

const path = require('path');
require(path.join(__dirname, '../src/config/loadEnv'));
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const NotificationPrefs = require('../src/models/NotificationPrefs');
const {
  generateDailyNotifications,
  generateOnboardingNotifications,
  generateEventNotification,
  getNotificationKey,
  getGateNexaDateKey,
  setTestNow,
  SLOTS,
} = require('../src/services/notificationEngine');
const { executeSlot, startNotificationScheduler, stopNotificationScheduler } = require('../src/services/scheduler/notificationScheduler');

const report = {
  day1: 0,
  day1Keys: [],
  day1Duplicate: 0,
  day2: 0,
  day3: 0,
  day4: 0,
  day5: 0,
  duplicatesPrevented: 0,
  midnight: 'FAIL',
  maxPerDay: 'FAIL',
  disabled: 'FAIL',
  eventDedupe: 'FAIL',
  api: 'FAIL',
  scheduler: 'FAIL',
  timezone: 'FAIL',
  database: 'FAIL',
  syntax: 'FAIL',
  failures: [],
};

function ist(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}+05:30`);
}

function assert(cond, name) {
  if (!cond) {
    report.failures.push(name);
    console.error('FAIL', name);
  } else {
    console.log('PASS', name);
  }
}

async function countDaily(userId, dateKey) {
  return Notification.countDocuments({
    user: userId,
    'metadata.dateKey': dateKey,
    'metadata.slot': { $in: SLOTS.map((s) => s.id) },
  });
}

async function listDaily(userId, dateKey) {
  return Notification.find({
    user: userId,
    'metadata.dateKey': dateKey,
    'metadata.slot': { $in: SLOTS.map((s) => s.id) },
  }).sort({ scheduledAt: 1 }).lean();
}

async function runSlots(userId, dateKey) {
  let created = 0;
  let dupes = 0;
  for (const slot of SLOTS) {
    const now = ist(dateKey, `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}:00`);
    setTestNow(now);
    const result = await generateDailyNotifications(userId, {
      slot: slot.id,
      schedulerRun: true,
      now,
    });
    created += result.created || 0;
    dupes += result.skippedDuplicate || 0;
  }
  return { created, dupes };
}

async function main() {
  let mem;
  try {
    mem = await MongoMemoryServer.create();
    await mongoose.connect(mem.getUri());
    await Notification.syncIndexes();
    await NotificationPrefs.syncIndexes();
    report.database = 'PASS';

    const user = await User.create({
      name: 'Notif Test User',
      email: `__gatenexa_notif_test__${Date.now()}@example.invalid`,
      password: 'TestPass1234',
    });

    await generateOnboardingNotifications(user._id, { now: ist('2026-08-31', '07:00:00') });
    const onboard1 = await generateOnboardingNotifications(user._id, { now: ist('2026-08-31', '07:05:00') });
    assert(onboard1.created === 0 && onboard1.skippedDuplicate >= 1, 'onboarding idempotent');

    setTestNow(ist('2026-08-31', '08:00:00'));
    const d1 = await runSlots(user._id, '2026-08-31');
    report.day1 = d1.created;
    report.day1Keys = (await listDaily(user._id, '2026-08-31')).map((n) => ({
      notificationKey: n.notificationKey,
      type: n.type,
      slot: n.metadata.slot,
      date: n.metadata.dateKey,
    }));
    assert(d1.created === 5, `day1 count === 5 (got ${d1.created})`);
    console.log('DAY 1 KEYS', JSON.stringify(report.day1Keys, null, 2));

    const d1again = await runSlots(user._id, '2026-08-31');
    report.day1Duplicate = d1again.created;
    report.duplicatesPrevented += d1again.dupes;
    assert(d1again.created === 0, `day1 duplicate created === 0 (got ${d1again.created})`);
    assert(d1again.dupes === 5, `day1 duplicate skips === 5 (got ${d1again.dupes})`);

    const d2 = await runSlots(user._id, '2026-09-01');
    report.day2 = d2.created;
    assert(d2.created === 5, `day2 count === 5 (got ${d2.created})`);
    const stillDay1 = await countDaily(user._id, '2026-08-31');
    assert(stillDay1 === 5, 'day1 remains after day2');

    const d3 = await runSlots(user._id, '2026-09-02');
    report.day3 = d3.created;
    assert(d3.created === 5, `day3 count === 5 (got ${d3.created})`);

    const d4 = await runSlots(user._id, '2026-09-03');
    report.day4 = d4.created;
    assert(d4.created === 5, `day4 count === 5 (got ${d4.created})`);

    const d5 = await runSlots(user._id, '2026-09-04');
    report.day5 = d5.created;
    assert(d5.created === 5, `day5 count === 5 (got ${d5.created})`);

    setTestNow(ist('2026-08-31', '23:59:00'));
    const keyA = getGateNexaDateKey();
    setTestNow(ist('2026-09-01', '00:01:00'));
    const keyB = getGateNexaDateKey();
    assert(keyA === '2026-08-31', `midnight before key ${keyA}`);
    assert(keyB === '2026-09-01', `midnight after key ${keyB}`);
    report.midnight = keyA === '2026-08-31' && keyB === '2026-09-01' ? 'PASS' : 'FAIL';
    report.timezone = !String(getGateNexaDateKey.toString()).includes('toISOString().slice(0, 10)')
      && report.midnight === 'PASS'
      ? 'PASS'
      : 'FAIL';

    const capUser = await User.create({
      name: 'Cap User',
      email: `__gatenexa_notif_cap__${Date.now()}@example.invalid`,
      password: 'TestPass1234',
    });
    await NotificationPrefs.create({
      user: capUser._id,
      enabled: true,
      maxPerDay: 3,
      todayCount: 0,
      todayDate: '2026-09-05',
    });
    const capped = await runSlots(capUser._id, '2026-09-05');
    assert(capped.created === 3, `maxPerDay 3 created === 3 (got ${capped.created})`);
    await NotificationPrefs.updateOne({ user: capUser._id }, { $set: { maxPerDay: 5 } });
    report.maxPerDay = capped.created === 3 ? 'PASS' : 'FAIL';

    const offUser = await User.create({
      name: 'Off User',
      email: `__gatenexa_notif_off__${Date.now()}@example.invalid`,
      password: 'TestPass1234',
    });
    await NotificationPrefs.create({
      user: offUser._id,
      enabled: false,
      maxPerDay: 5,
      todayCount: 0,
      todayDate: '2026-09-06',
    });
    const off = await runSlots(offUser._id, '2026-09-06');
    assert(off.created === 0, `disabled created === 0 (got ${off.created})`);
    await NotificationPrefs.updateOne({ user: offUser._id }, { $set: { enabled: true } });
    report.disabled = off.created === 0 ? 'PASS' : 'FAIL';

    const ev1 = await generateEventNotification(user._id, 'streak_7');
    const ev2 = await generateEventNotification(user._id, 'streak_7');
    assert(ev1.created === 1, 'event first create');
    assert(ev2.created === 0 && ev2.skippedDuplicate === 1, 'event duplicate skipped');
    report.eventDedupe = ev1.created === 1 && ev2.created === 0 ? 'PASS' : 'FAIL';

    const oldDoc = await mongoose.connection.collection('notifications').insertOne({
      user: user._id,
      type: 'legacy',
      title: 'Legacy notice',
      message: 'Old document without notificationKey',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const stillThere = await mongoose.connection.collection('notifications').findOne({ _id: oldDoc.insertedId });
    assert(Boolean(stillThere) && stillThere.notificationKey == null, 'old documents remain valid');

    const startA = startNotificationScheduler();
    const startB = startNotificationScheduler();
    assert(startA.started === true, 'scheduler starts');
    assert(startB.started === false, 'scheduler does not register twice');
    const schedNow = ist('2026-09-07', '08:00:00');
    setTestNow(schedNow);
    const slotResult = await executeSlot('morning', { now: schedNow });
    assert(slotResult.generated >= 1, 'scheduler executeSlot generates');
    report.scheduler = startA.started && !startB.started && slotResult.generated >= 1 ? 'PASS' : 'FAIL';

    const app = express();
    app.use(express.json());
    app.use('/api/notifications', require('../src/routes/notifications'));
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const listRes = await request(app)
      .get('/api/notifications?limit=100')
      .set('Authorization', `Bearer ${token}`);
    assert(listRes.status === 200, `GET /notifications status ${listRes.status}`);
    assert(Array.isArray(listRes.body.notifications), 'GET returns notifications array');
    assert(listRes.body.total >= 5, `GET total historical >= 5 (got ${listRes.body.total})`);
    assert(typeof listRes.body.unreadCount === 'number', 'GET unreadCount');
    assert(typeof listRes.body.page === 'number', 'GET page');
    assert(typeof listRes.body.pages === 'number', 'GET pages');

    const unreadRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);
    assert(unreadRes.status === 200, 'GET unread-count');

    const prefsRes = await request(app)
      .get('/api/notifications/prefs')
      .set('Authorization', `Bearer ${token}`);
    assert(prefsRes.status === 200 && prefsRes.body.prefs.enabled === true, 'GET prefs');

    const putPrefs = await request(app)
      .put('/api/notifications/prefs')
      .set('Authorization', `Bearer ${token}`)
      .send({ maxPerDay: 5, enabled: true });
    assert(putPrefs.status === 200 && putPrefs.body.prefs.maxPerDay === 5, 'PUT prefs restore maxPerDay=5');

    const firstId = listRes.body.notifications[0]?._id;
    if (firstId) {
      const readRes = await request(app)
        .put(`/api/notifications/${firstId}/read`)
        .set('Authorization', `Bearer ${token}`);
      assert(readRes.status === 200 && readRes.body.notification.isRead === true, 'PUT read');
      const bmRes = await request(app)
        .put(`/api/notifications/${firstId}/bookmark`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isBookmarked: true });
      assert(bmRes.status === 200 && bmRes.body.notification.isBookmarked === true, 'PUT bookmark');
    }
    report.api = listRes.status === 200 && listRes.body.total >= 5 ? 'PASS' : 'FAIL';

    const utcTrap = require('fs').readFileSync(
      path.join(__dirname, '../src/services/notificationEngine.js'),
      'utf8'
    ).includes("toISOString().slice(0, 10)");
    assert(!utcTrap, 'no UTC ISO date-key logic');

    report.syntax = 'PASS';
  } catch (err) {
    console.error('TEST RUNNER ERROR', err && err.message);
    report.failures.push(`runner: ${err && err.message}`);
  } finally {
    setTestNow(null);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    stopNotificationScheduler();
    if (mem) await mem.stop();
  }

  console.log('\n===== NOTIFICATION TEST REPORT =====');
  console.log(JSON.stringify({
    DAY_1: report.day1,
    DAY_2: report.day2,
    DAY_3: report.day3,
    DAY_4: report.day4,
    DAY_5: report.day5,
    DUPLICATES_PREVENTED: report.duplicatesPrevented,
    MIDNIGHT: report.midnight,
    MAX_PER_DAY: report.maxPerDay,
    DISABLED: report.disabled,
    EVENT_DEDUPE: report.eventDedupe,
    API: report.api,
    SCHEDULER: report.scheduler,
    TIMEZONE: report.timezone,
    DATABASE: report.database,
    FAILURES: report.failures,
  }, null, 2));

  if (report.failures.length) process.exit(1);
}

main();
