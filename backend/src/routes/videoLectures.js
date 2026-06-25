// src/routes/videoLectures.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { isMockAuthEnabled } = require('../config/devMode');
const VideoLecture = require('../models/VideoLecture');

// Get video lectures with filters
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = { isActive: true };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.topic) filter.topic = req.query.topic;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.gateRelevance) filter.gateRelevance = req.query.gateRelevance;
    if (req.query.language) filter.language = req.query.language;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({
        success: true,
        count: 5,
        data: [
          {
            _id: 'mock-v1',
            title: 'Introduction to Sorting Algorithms',
            subject: 'Algorithms',
            topic: 'Sorting',
            source: 'NPTEL',
            duration: { minutes: 45, seconds: 30 },
            gateRelevance: 'HIGH',
            youtubeThumbnail: 'https://img.youtube.com/vi/kWiCukW_DyY/hqdefault.jpg',
          },
          {
            _id: 'mock-v2',
            title: 'Database Normalization Fundamentals',
            subject: 'DBMS',
            topic: 'Normalization',
            source: 'YouTube',
            duration: { minutes: 32, seconds: 15 },
            gateRelevance: 'HIGH',
            youtubeThumbnail: 'https://img.youtube.com/vi/4Z9lFNN6Q_w/hqdefault.jpg',
          },
          {
            _id: 'mock-v3',
            title: 'TCP/IP Protocol Suite',
            subject: 'Computer Networks',
            topic: 'TCP/IP',
            source: 'NPTEL',
            duration: { minutes: 58, seconds: 0 },
            gateRelevance: 'MEDIUM',
          },
          {
            _id: 'mock-v4',
            title: 'Process Management in OS',
            subject: 'Operating Systems',
            topic: 'Process Management',
            source: 'YouTube',
            duration: { minutes: 41, seconds: 20 },
            gateRelevance: 'HIGH',
            youtubeThumbnail: 'https://img.youtube.com/vi/OrM4rPx6V1A/hqdefault.jpg',
          },
          {
            _id: 'mock-v5',
            title: 'Graph Theory Complete Course',
            subject: 'Engineering Mathematics',
            topic: 'Graph Theory',
            source: 'Gate Wallah',
            duration: { minutes: 120, seconds: 0 },
            gateRelevance: 'HIGH',
          },
        ],
        pagination: { page: 1, limit: 20, total: 5, pages: 1 },
      });
    }

    const [lectures, total] = await Promise.all([
      VideoLecture.find(filter)
        .select('title subject topic source duration formattedDuration youtubeThumbnail instructor gateRelevance difficulty qualityRating helpfulCount viewCount')
        .sort('-helpfulCount -viewCount')
        .skip(skip)
        .limit(limit),
      VideoLecture.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: lectures.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: lectures,
    });
  } catch (e) { next(e); }
});

// Get single video lecture details
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({
        success: true,
        data: {
          _id: req.params.id,
          title: 'Introduction to Sorting Algorithms',
          description: 'Complete lecture on sorting algorithms including Bubble Sort, Insertion Sort, Merge Sort, Quick Sort, and Heap Sort with time complexity analysis.',
          subject: 'Algorithms',
          topic: 'Sorting',
          source: 'NPTEL',
          sourceUrl: 'https://www.youtube.com/watch?v=kWiCukW_DyY',
          duration: { minutes: 45, seconds: 30 },
          instructor: { name: 'Prof. Naveen Garg', institution: 'IIT Delhi' },
          difficulty: 'intermediate',
          gateRelevance: 'HIGH',
          chapters: [
            { timestamp: '0:00', title: 'Introduction to Sorting' },
            { timestamp: '5:30', title: 'Bubble Sort' },
            { timestamp: '15:00', title: 'Insertion Sort' },
            { timestamp: '25:00', title: 'Merge Sort' },
            { timestamp: '35:00', title: 'Quick Sort' },
          ],
          topicsCovered: ['Bubble Sort', 'Insertion Sort', 'Selection Sort', 'Merge Sort', 'Quick Sort', 'Heap Sort', 'Time Complexity Analysis'],
          hasCaptions: true,
          captionLanguages: ['English', 'Hindi'],
        },
      });
    }

    const lecture = await VideoLecture.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!lecture) return res.status(404).json({ success: false, message: 'Video lecture not found' });

    res.json({ success: true, data: lecture });
  } catch (e) { next(e); }
});

// Get lectures by subject
router.get('/subject/:subject', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({
        success: true,
        count: 3,
        data: [
          { _id: 'mock-vs1', title: 'Topic 1', topic: 'Introduction', duration: { minutes: 30 }, gateRelevance: 'HIGH' },
          { _id: 'mock-vs2', title: 'Topic 2', topic: 'Fundamentals', duration: { minutes: 45 }, gateRelevance: 'MEDIUM' },
        ],
      });
    }

    const lectures = await VideoLecture.find({ 
      subject: req.params.subject, 
      isActive: true 
    })
      .select('title topic duration formattedDuration source gateRelevance youtubeThumbnail')
      .sort('topic');

    res.json({ success: true, count: lectures.length, data: lectures });
  } catch (e) { next(e); }
});

// Mark video as helpful
router.post('/:id/helpful', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, message: 'Marked helpful (mock mode)' });
    }

    const lecture = await VideoLecture.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!lecture) return res.status(404).json({ success: false, message: 'Video lecture not found' });

    res.json({ success: true, message: 'Marked as helpful!', data: { helpfulCount: lecture.helpfulCount } });
  } catch (e) { next(e); }
});

// Create video lecture (admin only)
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description, subject, topic, source, sourceUrl, sourceId, duration, instructor, difficulty, gateRelevance, topicsCovered, tags } = req.body;

    if (!title || !subject || !topic || !source || !sourceUrl) {
      return res.status(400).json({ success: false, message: 'Title, subject, topic, source, and sourceUrl are required' });
    }

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.status(201).json({
        success: true,
        message: 'Video lecture added (mock mode)',
        data: { _id: 'mock-vl-id', title, subject, topic },
      });
    }

    const lecture = await VideoLecture.create({
      title, description, subject, topic, source, sourceUrl, sourceId, duration, instructor, difficulty, gateRelevance, topicsCovered, tags,
    });

    res.status(201).json({ success: true, message: 'Video lecture added!', data: lecture });
  } catch (e) { next(e); }
});

module.exports = router;