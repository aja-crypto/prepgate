// Fetch M.Tech admission notifications
const { upsertMany } = require('./fetchUtils');
const { MTECH_ADMISSIONS } = require('../../data/liveDataSeed');

const MTECH_SOURCES = [
  { category: 'IIT', url: 'https://www.iitb.ac.in/new/en/admissions/m-tech-admissions', source: 'IIT Bombay' },
  { category: 'IIT', url: 'https://home.iitd.ac.in/admissions.php', source: 'IIT Delhi' },
  { category: 'IIT', url: 'https://www.iitm.ac.in/admissions', source: 'IIT Madras' },
  { category: 'NIT', url: 'https://ccmt.admissions.nic.in/', source: 'CCMT' },
  { category: 'IIIT', url: 'https://www.iiit.ac.in/admissions/', source: 'IIIT Hyderabad' },
  { category: 'DAU/DAIICT', url: 'https://www.daiict.ac.in/admissions', source: 'DA-IICT' },
];

async function fetchMtechAdmissions() {
  let fetched = 0;
  let newCount = 0;

  for (const inst of MTECH_SOURCES) {
    try {
      const res = await fetch(inst.url, {
        headers: { 'User-Agent': 'GATE2027-Tracker/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const html = await res.text();
        const items = parseAdmissionPage(html, inst);
        if (items.length) {
          const result = await upsertMany(items);
          fetched += result.fetched;
          newCount += result.newCount;
          continue;
        }
      }
    } catch {
      // seed fallback
    }

    const seed = MTECH_ADMISSIONS.find((m) => m.source === inst.source);
    if (seed) {
      const result = await upsertMany([{ ...seed, status: 'published', sourceUrl: seed.url }], true);
      fetched += result.fetched;
      newCount += result.newCount;
    }
  }

  return { fetched, newCount, source: 'live+seed' };
}

function parseAdmissionPage(html, inst) {
  const items = [];
  const regex = /<a[^>]+href="([^"]*)"[^>]*>([^<]{10,120})<\/a>/gi;
  let match;
  const seen = new Set();

  while ((match = regex.exec(html)) !== null && items.length < 2) {
    const [, href, title] = match;
    const clean = title.replace(/\s+/g, ' ').trim();
    if (seen.has(clean)) continue;
    if (!/m\.?tech|admission|gate|counsel|apply|pg|ms|phd|coap|ccmt/i.test(clean)) continue;

    seen.add(clean);
    items.push({
      type: 'mtech_admission',
      category: inst.category,
      title: clean,
      summary: `${inst.source}: ${clean}`,
      url: href.startsWith('http') ? href : new URL(href, inst.url).href,
      source: inst.source,
      sourceUrl: inst.url,
      publishedAt: new Date(),
    });
  }
  return items;
}

module.exports = { fetchMtechAdmissions };
