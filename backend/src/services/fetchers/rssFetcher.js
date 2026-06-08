// Fetch RSS feeds for GATE-related updates
const Parser = require('rss-parser');
const { upsertMany, stripHtml } = require('./fetchUtils');
const { RSS_FEEDS } = require('../../data/liveDataSeed');

const parser = new Parser({ timeout: 10000 });

async function fetchRssFeeds() {
  let fetched = 0;
  let newCount = 0;

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items || [])
        .slice(0, 8)
        .filter((item) => isGateRelated(item.title, item.contentSnippet))
        .map((item) => ({
          type: 'rss',
          category: feed.source,
          title: item.title?.trim() || 'Untitled',
          summary: stripHtml(item.contentSnippet || item.summary || ''),
          url: item.link,
          source: feed.source,
          sourceUrl: feed.url,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        }));

      const result = await upsertMany(items);
      fetched += result.fetched;
      newCount += result.newCount;
    } catch {
      // RSS feed unavailable – skip silently
    }
  }

  return { fetched, newCount, source: 'rss' };
}

function isGateRelated(title = '', snippet = '') {
  const text = `${title} ${snippet}`.toLowerCase();
  return /gate|iit|nit|psu|m\.?tech|algorithm|operating system|dbms|computer network|compiler|toc|digital logic|computer organization|engineering math/i.test(text);
}

module.exports = { fetchRssFeeds };
