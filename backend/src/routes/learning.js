const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const LearningContent = require('../models/LearningContent');

// In-memory fallback store
const localStore = [];
let localIdCounter = 1;

// ─── Curated seed data ───────────────────────────────────────
function seedContent() {
  const items = [];
  const add = (item) => { item._id = String(localIdCounter++); item.isActive = true; items.push(item); };

  // ── Roadmaps ──
  add({ type: 'roadmap', title: 'Complete Roadmap to follow my channel for GATE CSE', description: 'A complete beginner-to-advanced roadmap covering the entire GATE CSE syllabus with curated video playlists and resources.', youtubeUrl: 'https://www.youtube.com/watch?v=YJ9xBFAenVw', youtubeId: 'YJ9xBFAenVw', category: 'beginner', difficulty: 'beginner', tags: ['beginner', 'roadmap', 'complete'], order: 1, isFeatured: true });
  add({ type: 'roadmap', title: 'GO Classes — Long-Term Preparation Plan', description: 'Excellent long-term preparation plans and topper strategies from GO Classes.', category: 'beginner', difficulty: 'beginner', tags: ['beginner', 'long-term', 'goclasses'], order: 2 });
  add({ type: 'roadmap', title: 'GO Classes 6-Month Action Plan', description: 'A structured month-by-month preparation guide for GATE.', category: '6-month', difficulty: 'intermediate', tags: ['6-month', 'action-plan', 'goclasses'], order: 3 });
  add({ type: 'roadmap', title: 'Gate Smashers — Last 60 Days Revision Strategy', description: 'Final revision strategy covering PYQs, mock tests, and targeted revision for the last 60 days.', category: 'last-60-days', difficulty: 'advanced', tags: ['last-60-days', 'revision', 'strategy'], order: 4 });
  add({ type: 'roadmap', title: 'GO Classes — Working Professional Strategy', description: 'How working professionals can balance job and GATE preparation effectively.', category: 'working-professional', difficulty: 'intermediate', tags: ['working-professional', 'job', 'goclasses'], order: 5 });
  add({ type: 'roadmap', title: 'Amit Khurana — Strategy for Working Professionals', description: 'Practical tips and time management strategies for those preparing alongside a job.', category: 'working-professional', difficulty: 'intermediate', tags: ['working-professional', 'amit-khurana'], order: 6 });
  add({ type: 'roadmap', title: 'KnowledgeGate — GATE Preparation Tips', description: 'Comprehensive preparation guidance covering subject prioritization and study planning.', category: 'working-professional', difficulty: 'beginner', tags: ['working-professional', 'knowledgegate'], order: 7 });

  // ── Success Stories ──
  add({ type: 'success_story', title: 'IIT Bombay Journey — AIR under 100', description: 'How a determined student cracked IIT Bombay with an AIR under 100 through consistent practice and smart strategy.', category: 'air-top-10', tags: ['air-top-10', 'iit-bombay', 'success'], order: 1, isFeatured: true });
  add({ type: 'success_story', title: 'IIT Madras Journey — From Rank 2000 to Top 50', description: 'Incredible journey of improvement from AIR 2000 to Top 50 in IIT Madras.', category: 'air-top-10', tags: ['air-top-10', 'iit-madras', 'improvement'], order: 2 });
  add({ type: 'success_story', title: 'IISc Journey — Direct PhD through GATE', description: 'Story of a student who secured admission to IISc Bangalore through GATE score.', category: 'air-top-10', tags: ['air-top-10', 'iisc', 'phd'], order: 3 });
  add({ type: 'success_story', title: 'Self Study Success — YouTube + PYQs Only', description: 'Cracked GATE using only free YouTube resources, PYQs, and self-made notes — no coaching.', category: 'self-study', tags: ['self-study', 'youtube', 'pyqs'], order: 4, isFeatured: true });
  add({ type: 'success_story', title: 'Self Study: NPTEL + Standard Books Approach', description: 'How following NPTEL courses alongside standard textbooks led to a top rank.', category: 'self-study', tags: ['self-study', 'nptel', 'books'], order: 5 });
  add({ type: 'success_story', title: 'Working Professional: Cracked GATE While Working Full-Time', description: 'A software engineer who prepared for GATE during nights and weekends while working at a product company.', category: 'working-professional', tags: ['working-professional', 'job', 'full-time'], order: 6 });
  add({ type: 'success_story', title: 'Second Attempt Success: AIR 5000 → AIR 300', description: 'How analyzing first attempt failures led to a massive improvement of 4700 ranks.', category: 'second-attempt', tags: ['second-attempt', 'improvement', 'comeback'], order: 7, isFeatured: true });
  add({ type: 'success_story', title: 'Second Attempt: Lessons from Failure', description: 'Honest reflection on mistakes made in the first attempt and how they were corrected.', category: 'second-attempt', tags: ['second-attempt', 'mistakes', 'lessons'], order: 8 });
  add({ type: 'success_story', title: 'Average CGPA to IIT: 6.5 CGPA → IIT Kanpur', description: 'Proved that college CGPA does not define your GATE potential — went from 6.5 CGPA to IIT Kanpur.', category: 'average-cgpa', tags: ['average-cgpa', 'iit-kanpur', 'inspiration'], order: 9, isFeatured: true });

  // ── Motivation (stored as academy type) ──
  add({ type: 'academy', title: 'How I Stayed Consistent for One Year', description: 'Practical tips on maintaining daily study consistency for an entire year without burning out.', category: 'preparation', tags: ['consistency', 'daily-routine', 'motivation'], order: 1, isFeatured: true });
  add({ type: 'academy', title: 'Mistakes I Made in My First Attempt', description: 'Common pitfalls and mistakes that cost a rank — and how to avoid them.', category: 'preparation', tags: ['mistakes', 'first-attempt', 'lessons'], order: 2 });
  add({ type: 'academy', title: 'How I Recovered After Failing GATE', description: 'Mental health, strategy reset, and the comeback story after a disappointing first result.', category: 'preparation', tags: ['failure', 'recovery', 'comeback'], order: 3 });
  add({ type: 'academy', title: 'Daily Routine of AIR Holders', description: 'A peek into the daily schedules of top rankers — how they managed time, breaks, and revision.', category: 'preparation', tags: ['daily-routine', 'air-holders', 'time-management'], order: 4, isFeatured: true });
  add({ type: 'academy', title: 'Mock Test Analysis Strategy', description: 'How to effectively analyze mock tests to identify weak areas and improve scores incrementally.', category: 'preparation', tags: ['mock-test', 'analysis', 'strategy'], order: 5 });

  // ── Resources ──
  add({ type: 'resource', title: 'CCMT Counselling 2025', description: 'Official Centralized Counselling for M.Tech/M.Arch admissions through GATE.', category: 'official', resourceType: 'link', tags: ['ccmt', 'counselling', 'official'], order: 1, isFeatured: true });
  add({ type: 'resource', title: 'COAP 2025', description: 'Common Offer Acceptance Portal for PSU recruitment through GATE scores.', category: 'official', resourceType: 'link', tags: ['coap', 'psu', 'official'], order: 2 });
  add({ type: 'resource', title: 'GATE 2025 Brochure', description: 'Official GATE brochure with exam pattern, eligibility, and important dates.', category: 'official', resourceType: 'pdf', tags: ['gate', 'brochure', 'official'], order: 3 });
  add({ type: 'resource', title: 'GATE Syllabus 2025', description: 'Complete syllabus for all GATE papers with subject-wise weightage.', category: 'official', resourceType: 'link', tags: ['syllabus', 'official', 'subjects'], order: 4 });
  add({ type: 'resource', title: 'GATE Scorecard Information', description: 'Understanding your GATE scorecard — score, rank, and qualifying marks explained.', category: 'official', resourceType: 'link', tags: ['scorecard', 'results', 'official'], order: 5 });
  add({ type: 'resource', title: 'GateOverflow', description: 'Community-driven platform with previous year questions, solutions, and discussions.', category: 'practice', resourceType: 'link', tags: ['gateoverflow', 'pyq', 'community'], order: 6, isFeatured: true });
  add({ type: 'resource', title: 'GATE PYQs Year-wise', description: 'Previous year question papers organized by year for targeted practice.', category: 'practice', resourceType: 'link', tags: ['pyq', 'year-wise', 'practice'], order: 7 });
  add({ type: 'resource', title: 'NPTEL Courses', description: 'Free online courses from IITs covering core GATE subjects in depth.', category: 'practice', resourceType: 'link', tags: ['nptel', 'courses', 'free'], order: 8 });
  add({ type: 'resource', title: 'Standard Books for GATE CSE', description: 'Curated list of recommended textbooks for each GATE CSE subject.', category: 'notes', resourceType: 'link', tags: ['books', 'textbooks', 'reference'], order: 9 });
  add({ type: 'resource', title: 'Subject-wise Formula Sheets', description: 'Quick revision formula sheets for all GATE subjects.', category: 'notes', resourceType: 'link', tags: ['formula', 'revision', 'sheets'], order: 10 });
  add({ type: 'resource', title: 'GATE Cheat Sheets', description: 'Compact cheat sheets covering key concepts and shortcuts for last-minute revision.', category: 'notes', resourceType: 'link', tags: ['cheat-sheet', 'revision', 'quick'], order: 11 });
  add({ type: 'resource', title: 'Revision PDFs', description: 'Downloadable PDF compilations of important topics and formulae.', category: 'notes', resourceType: 'pdf', tags: ['pdf', 'revision', 'download'], order: 12 });

  localStore.push(...items);
}
seedContent();

// Specific routes MUST come before parameterized routes.

// GET /api/learning/stats/overview — learning stats
router.get('/stats/overview', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.json({
        success: true,
        data: {
          totalVideos: localStore.filter(i => ['academy', 'success_story'].includes(i.type) && i.isActive).length,
          totalRoadmaps: localStore.filter(i => i.type === 'roadmap' && i.isActive).length,
          totalResources: localStore.filter(i => i.type === 'resource' && i.isActive).length,
          totalUpdates: localStore.filter(i => i.type === 'update' && i.isActive).length,
        }
      });
    }

    const stats = await LearningContent.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const result = { totalVideos: 0, totalRoadmaps: 0, totalResources: 0, totalUpdates: 0 };
    stats.forEach(s => {
      if (s._id === 'academy' || s._id === 'success_story') result.totalVideos += s.count;
      if (s._id === 'roadmap') result.totalRoadmaps = s.count;
      if (s._id === 'resource') result.totalResources = s.count;
      if (s._id === 'update') result.totalUpdates = s.count;
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Learning] Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// GET /api/learning/search/query — full-text search across content
router.get('/search/query', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const query = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (!isMongoConnected()) {
      const results = localStore.filter(i =>
        i.isActive && (
          (i.title || '').toLowerCase().includes(query.toLowerCase()) ||
          (i.description || '').toLowerCase().includes(query.toLowerCase()) ||
          (i.tags || []).some(t => t.toLowerCase().includes(query.toLowerCase()))
        )
      ).slice(0, 20);
      return res.json({ success: true, data: results });
    }

    const items = await LearningContent.find({
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ]
    }).limit(20).sort({ order: 1 });

    res.json({ success: true, data: items });
  } catch (err) {
    console.error('[Learning] Search error:', err);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// GET /api/learning/featured — editor's picks
router.get('/featured', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const items = localStore.filter(i => i.isActive && i.isFeatured).sort((a, b) => a.order - b.order);
      return res.json({ success: true, data: items });
    }
    const items = await LearningContent.find({ isActive: true, isFeatured: true }).sort({ order: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('[Learning] Featured error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch featured content' });
  }
});

// GET /api/learning/:type — list content by type (optional ?category= filter)
router.get('/:type', protect, async (req, res) => {
  try {
    const { type } = req.params;
    const { category } = req.query;
    const validTypes = ['roadmap', 'academy', 'success_story', 'resource', 'update'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    if (!isMongoConnected()) {
      let items = localStore
        .filter(i => i.type === type && i.isActive);
      if (category) items = items.filter(i => i.category === category);
      items.sort((a, b) => a.order - b.order);
      return res.json({ success: true, data: items });
    }

    const filter = { type, isActive: true };
    if (category) filter.category = category;
    const items = await LearningContent.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('[Learning] Error fetching:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch learning content' });
  }
});

// GET /api/learning/:type/:id — single item
router.get('/:type/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoConnected()) {
      const item = localStore.find(i => i._id === id || i.id === id);
      if (!item) return res.status(404).json({ success: false, message: 'Content not found' });
      return res.json({ success: true, data: item });
    }

    const item = await LearningContent.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Content not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    console.error('[Learning] Error fetching item:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch content' });
  }
});

module.exports = router;
