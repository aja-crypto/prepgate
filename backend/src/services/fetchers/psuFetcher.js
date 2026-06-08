// Fetch PSU recruitment notifications
const { upsertMany } = require('./fetchUtils');
const { PSU_RECRUITMENTS } = require('../../data/liveDataSeed');

const PSU_SOURCES = [
  { category: 'Coal India', url: 'https://www.coalindia.in/careers/', source: 'Coal India' },
  { category: 'ONGC', url: 'https://ongcindia.com/wps/wcm/connect/en/career/', source: 'ONGC' },
  { category: 'IOCL', url: 'https://iocl.com/latest-job-openings', source: 'IOCL' },
  { category: 'HPCL', url: 'https://www.hindustanpetroleum.com/careers', source: 'HPCL' },
  { category: 'BPCL', url: 'https://www.bharatpetroleum.in/Career-Opportunities.aspx', source: 'BPCL' },
  { category: 'BARC', url: 'https://www.barc.gov.in/careers/', source: 'BARC' },
  { category: 'DRDO', url: 'https://www.drdo.gov.in/careers', source: 'DRDO' },
  { category: 'ISRO', url: 'https://www.isro.gov.in/Careers', source: 'ISRO' },
  { category: 'NIELIT', url: 'https://www.nielit.gov.in/content/recruitment', source: 'NIELIT' },
];

async function fetchPsuRecruitments() {
  let fetched = 0;
  let newCount = 0;
  let liveCount = 0;

  for (const psu of PSU_SOURCES) {
    try {
      const res = await fetch(psu.url, {
        headers: { 'User-Agent': 'GATE2027-Tracker/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const html = await res.text();
        const items = parseCareerPage(html, psu);
        if (items.length) {
          const result = await upsertMany(items);
          fetched += result.fetched;
          newCount += result.newCount;
          liveCount += items.length;
          continue;
        }
      }
    } catch {
      // fall through to seed for this PSU
    }

    const seed = PSU_RECRUITMENTS.find((p) => p.category === psu.category);
    if (seed) {
      const result = await upsertMany([{ ...seed, status: 'published', sourceUrl: seed.url }], true);
      fetched += result.fetched;
      newCount += result.newCount;
    }
  }

  return { fetched, newCount, source: liveCount > 0 ? 'live+seed' : 'seed' };
}

function parseCareerPage(html, psu) {
  const items = [];
  const regex = /<a[^>]+href="([^"]*)"[^>]*>([^<]{8,100})<\/a>/gi;
  let match;
  const seen = new Set();

  while ((match = regex.exec(html)) !== null && items.length < 3) {
    const [, href, title] = match;
    const clean = title.replace(/\s+/g, ' ').trim();
    if (seen.has(clean)) continue;
    if (!/gate|recruit|engineer|trainee|officer|vacancy|job|apply|scientist/i.test(clean)) continue;

    seen.add(clean);
    items.push({
      type: 'psu_recruitment',
      category: psu.category,
      title: clean,
      summary: `${psu.source} career notification: ${clean}`,
      url: href.startsWith('http') ? href : new URL(href, psu.url).href,
      source: psu.source,
      sourceUrl: psu.url,
      publishedAt: new Date(),
    });
  }
  return items;
}

module.exports = { fetchPsuRecruitments };
