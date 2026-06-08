// Fetch GATE notifications and syllabus updates
const { upsertMany } = require('./fetchUtils');
const { GATE_NOTIFICATIONS } = require('../../data/liveDataSeed');

const GATE_SOURCES = [
  { url: 'https://gate2027.iitd.ac.in/', source: 'GATE Official' },
  { url: 'https://gate.iitd.ac.in/', source: 'GATE IITD' },
];

async function fetchGateNotifications() {
  let items = [];
  let sourceUsed = 'seed';

  for (const src of GATE_SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: { 'User-Agent': 'GATE2027-Tracker/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const html = await res.text();
        const announcements = parseGateHtml(html, src);
        if (announcements.length) {
          items = announcements;
          sourceUsed = src.source;
          break;
        }
      }
    } catch {
      // try next source
    }
  }

  if (!items.length) {
    items = GATE_NOTIFICATIONS.map((n) => ({
      ...n,
      status: 'published',
      sourceUrl: n.url,
    }));
    sourceUsed = 'seed';
  }

  const { fetched, newCount } = await upsertMany(items, sourceUsed === 'seed');
  return { fetched, newCount, source: sourceUsed };
}

function parseGateHtml(html, src) {
  const items = [];
  const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>([^<]{10,120})<\/a>/gi;
  let match;
  const seen = new Set();

  while ((match = linkRegex.exec(html)) !== null && items.length < 10) {
    const [, href, title] = match;
    const cleanTitle = title.replace(/\s+/g, ' ').trim();
    if (seen.has(cleanTitle)) continue;
    if (!/gate|exam|syllabus|notification|admit|result|registration/i.test(cleanTitle)) continue;

    seen.add(cleanTitle);
    const url = href.startsWith('http') ? href : new URL(href, src.url).href;
    items.push({
      type: /syllabus/i.test(cleanTitle) ? 'syllabus_update' : 'gate_notification',
      category: src.source,
      title: cleanTitle,
      summary: cleanTitle,
      url,
      source: src.source,
      sourceUrl: src.url,
      publishedAt: new Date(),
    });
  }
  return items;
}

module.exports = { fetchGateNotifications };
