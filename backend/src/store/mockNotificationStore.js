// In-memory notification store for dev/mock mode (mirrors UserNotification model)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_FILE = path.join(__dirname, '../../data/mock_notifications.json');
const notifications = new Map(); // id -> doc
const dedupeIndex = new Map(); // `${userId}:${dedupeKey}` -> id

function ensureDir() {
  const dir = path.dirname(STORE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function persist() {
  try {
    ensureDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(Array.from(notifications.values()), null, 2));
  } catch (err) {
    console.error('Failed to persist mock notifications:', err.message);
  }
}

function load() {
  try {
    if (!fs.existsSync(STORE_FILE)) return;
    const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    data.forEach((n) => {
      notifications.set(n._id, n);
      dedupeIndex.set(`${n.user}:${n.dedupeKey}`, n._id);
    });
  } catch (err) {
    console.error('Failed to load mock notifications:', err.message);
  }
}

load();

function formatDoc(doc) {
  return {
    _id: doc._id,
    id: doc._id,
    user: doc.user,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    refId: doc.refId || null,
    entityId: doc.entityId || null,
    dateKey: doc.dateKey,
    dedupeKey: doc.dedupeKey,
    actionUrl: doc.actionUrl || null,
    read: doc.read ?? false,
    scheduledFor: doc.scheduledFor || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const mockNotificationStore = {
  async countToday(userId, dateKey) {
    let count = 0;
    for (const n of notifications.values()) {
      if (n.user === userId && n.dateKey === dateKey) count += 1;
    }
    return count;
  },

  async getExistingDedupeKeys(userId, dateKey) {
    const keys = new Set();
    for (const n of notifications.values()) {
      if (n.user === userId && n.dateKey === dateKey) keys.add(n.dedupeKey);
    }
    return keys;
  },

  async findByUser(userId, { limit = 50, unreadOnly = false } = {}) {
    const list = Array.from(notifications.values())
      .filter((n) => n.user === userId && (!unreadOnly || !n.read))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
      .map(formatDoc);
    return list;
  },

  async countUnread(userId) {
    let count = 0;
    for (const n of notifications.values()) {
      if (n.user === userId && !n.read) count += 1;
    }
    return count;
  },

  async create(doc) {
    const dedupeIdxKey = `${doc.user}:${doc.dedupeKey}`;
    if (dedupeIndex.has(dedupeIdxKey)) return null;

    const now = new Date().toISOString();
    const full = {
      _id: crypto.randomUUID(),
      ...doc,
      read: false,
      createdAt: now,
      updatedAt: now,
    };
    notifications.set(full._id, full);
    dedupeIndex.set(dedupeIdxKey, full._id);
    persist();
    return formatDoc(full);
  },

  async markRead(userId, ids) {
    const idSet = new Set(ids);
    let updated = 0;
    for (const n of notifications.values()) {
      if (n.user === userId && idSet.has(n._id) && !n.read) {
        n.read = true;
        n.updatedAt = new Date().toISOString();
        updated += 1;
      }
    }
    if (updated) persist();
    return updated;
  },

  async markAllRead(userId) {
    let updated = 0;
    for (const n of notifications.values()) {
      if (n.user === userId && !n.read) {
        n.read = true;
        n.updatedAt = new Date().toISOString();
        updated += 1;
      }
    }
    if (updated) persist();
    return updated;
  },
};

module.exports = mockNotificationStore;
