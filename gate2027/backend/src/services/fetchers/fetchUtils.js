// Shared utilities for live data fetchers
const { LiveUpdate, hashContent } = require('../../models/LiveData');
const { isMockAuthEnabled } = require('../../config/devMode');

const FETCH_TIMEOUT = 12000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'GATE2027-Tracker/1.0 (+https://gate2027.in)',
        Accept: 'application/rss+xml, application/xml, text/xml, text/html, */*',
        ...options.headers,
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function upsertLiveUpdate(item, autoPublish = false) {
  if (isMockAuthEnabled()) return { isNew: false, skipped: true };

  const contentHash = hashContent(item.type, item.title, item.url);
  const existing = await LiveUpdate.findOne({ contentHash });
  if (existing) return { isNew: false, doc: existing };

  const doc = await LiveUpdate.create({
    ...item,
    contentHash,
    fetchedAt: new Date(),
    publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
    status: autoPublish ? 'published' : (item.status || 'pending'),
  });
  return { isNew: true, doc };
}

async function upsertMany(items, autoPublish = false) {
  let fetched = 0;
  let newCount = 0;
  for (const item of items) {
    fetched++;
    const result = await upsertLiveUpdate(item, autoPublish);
    if (result.isNew) newCount++;
  }
  return { fetched, newCount };
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
}

module.exports = {
  fetchWithTimeout,
  upsertLiveUpdate,
  upsertMany,
  stripHtml,
};
