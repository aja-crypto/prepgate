const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');

function ensureVapidConfigured() {
  const key = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || process.env.VAPID_EMAIL || 'mailto:noreply@gatenexa.in';

  if (!key || !privateKey) {
    return false;
  }

  webPush.setVapidDetails(subject, key, privateKey);
  return true;
}

function getAudienceFilter(targetAudience) {
  const filter = {};
  const now = new Date();

  switch (targetAudience) {
    case 'new_users': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: weekAgo };
      break;
    }
    case 'inactive_users': {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filter.lastLogin = { $lt: monthAgo };
      break;
    }
    case 'active_users': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filter.lastLogin = { $gte: weekAgo };
      break;
    }
    case 'premium_users':
      filter.isPremium = true;
      break;
    case 'free_users':
      filter.isPremium = false;
      break;
    default:
      break;
  }

  return filter;
}

async function getEligibleUsers(targetAudience) {
  const filter = getAudienceFilter(targetAudience);
  return User.find(filter).select('_id name email').lean();
}

async function saveUserSubscription(userId, subscription) {
  if (!userId || !subscription?.endpoint) return null;

  const record = await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      user: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: subscription.userAgent || '',
      isActive: true,
      lastSeen: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return record;
}

async function sendToUsers({ userIds = [], title, body, url = '/dashboard', data = {} }) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(String))].map((id) => id);
  if (!uniqueUserIds.length) {
    return { sent: 0, total: 0, invalid: 0, reason: 'No eligible users' };
  }

  if (!ensureVapidConfigured()) {
    return { sent: 0, total: 0, invalid: 0, reason: 'VAPID not configured' };
  }

  const subscriptions = await PushSubscription.find({ user: { $in: uniqueUserIds }, isActive: true }).lean();
  if (!subscriptions.length) {
    return { sent: 0, total: 0, invalid: 0, reason: 'No subscribers' };
  }

  const payload = JSON.stringify({
    title,
    body,
    url,
    data,
    timestamp: new Date().toISOString(),
  });

  let sent = 0;
  let invalid = 0;

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys?.p256dh,
            auth: sub.keys?.auth,
          },
        },
        payload
      );
      sent += 1;
    } catch (error) {
      invalid += 1;
      if (error && (error.statusCode === 404 || error.statusCode === 410)) {
        await PushSubscription.updateOne({ _id: sub._id }, { $set: { isActive: false, lastSeen: new Date() } });
      }
    }
  }

  return { sent, total: subscriptions.length, invalid, reason: sent > 0 ? 'Delivered' : 'Failed' };
}

async function sendToAudience({ targetAudience = 'all', title, body, url = '/dashboard', data = {} }) {
  const userIds = (await getEligibleUsers(targetAudience)).map((user) => user._id.toString());
  return sendToUsers({ userIds, title, body, url, data });
}

module.exports = {
  ensureVapidConfigured,
  getAudienceFilter,
  getEligibleUsers,
  saveUserSubscription,
  sendToUsers,
  sendToAudience,
};
