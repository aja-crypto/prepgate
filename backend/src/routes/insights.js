const router = require('express').Router();
const fs = require('fs');
const path = require('path');

const INSIGHTS_FILE = path.join(__dirname, '..', '..', '..', 'resources', 'learning hud insight.txt');

const EMOJI_HEADINGS = ['📈', '🎯', '🏆', '💰', '📊', '🤖', '📚', '📅'];
const EMOJI_MAP = { '📈': 'Highest Closing Scores', '🎯': 'Safest IIT Programmes', '🏆': 'Top NIT Placements', '💰': 'Best ROI Colleges', '📊': 'Category Trends', '🤖': 'AI & Data Science Demand', '📚': 'Most Competitive Specializations', '📅': 'Counselling Timeline' };

function parseInsights() {
  try {
    if (!fs.existsSync(INSIGHTS_FILE)) return [];
    const text = fs.readFileSync(INSIGHTS_FILE, 'utf-8');
    const lines = text.split('\n');
    const topics = [];
    let current = null;
    let content = [];

    for (const line of lines) {
      const trimmed = line.trim();
      const emoji = EMOJI_HEADINGS.find(e => trimmed.startsWith(e));
      if (emoji) {
        if (current) {
          current.content = content.join('\n').trim().replace(/\n{3,}/g, '\n\n');
          topics.push(current);
        }
        const title = trimmed.substring(emoji.length).trim();
        current = { icon: emoji, title: title || EMOJI_MAP[emoji] || 'Untitled', content: '' };
        content = [];
      } else if (current && trimmed && !trimmed.startsWith('|') && !trimmed.startsWith('**') && !trimmed.match(/^[A-Z][a-z]+ [A-Z]/) && !trimmed.includes('→ ') && trimmed.length > 5) {
        content.push(trimmed);
      }
    }
    if (current) {
      current.content = content.join('\n').trim().replace(/\n{3,}/g, '\n\n');
      topics.push(current);
    }

    return topics.filter(t => t.content.length > 20).map(t => ({
      ...t,
      summary: t.content.split('\n')[0]?.substring(0, 200) || '',
    }));
  } catch { return []; }
}

router.get('/topics', (req, res) => {
  const topics = parseInsights();
  res.json({ success: true, count: topics.length, data: topics });
});

router.get('/topics/:slug', (req, res) => {
  const topics = parseInsights();
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const topic = topics.find(t => slugify(t.title) === req.params.slug);
  if (!topic) return res.status(404).json({ success: false, message: 'Insight topic not found' });
  res.json({ success: true, data: topic });
});

module.exports = router;
