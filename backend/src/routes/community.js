// src/routes/community.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { isMockAuthEnabled } = require('../config/devMode');
const { Question, Answer, Comment } = require('../models/Community');

// ─────────────────────────────────────────────────────────────
// QUESTIONS
// ─────────────────────────────────────────────────────────────

// Get all questions with filters
router.get('/questions', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = { isFlagged: false, isLocked: false };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.topic) filter.topic = req.query.topic;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.tags) filter.tags = { $in: req.query.tags.split(',') };
    
    let sort = '-createdAt';
    if (req.query.sort === 'votes') sort = '-upvotes -answerCount';
    if (req.query.sort === 'unanswered') filter.answerCount = 0;

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, count: 0, data: [], pagination: { page, limit, total: 0, pages: 0 } });
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('user', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Question.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: questions.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: questions,
    });
  } catch (e) { next(e); }
});

// Get single question with answers
router.get('/questions/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, data: { _id: req.params.id, title: 'Sample Question', body: 'This is a sample question in mock mode.', answers: [], user: { name: 'Demo User' } } });
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('user', 'name email avatar');

    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const answers = await Answer.find({ question: question._id, isFlagged: false })
      .populate('user', 'name email avatar')
      .sort('-isAccepted upvotes -createdAt');

    res.json({ success: true, data: { ...question.toObject(), answers } });
  } catch (e) { next(e); }
});

// Create question
router.post('/questions', protect, async (req, res, next) => {
  try {
    const { title, body, subject, topic, type, tags, gateYear, gatePaper } = req.body;
    
    if (!title || !body || !subject) {
      return res.status(400).json({ success: false, message: 'Title, body, and subject are required' });
    }

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.status(201).json({ success: true, message: 'Question created (mock mode)', data: { _id: 'mock-q-id', title, body, subject } });
    }

    const question = await Question.create({
      user: req.user._id,
      title, body, subject, topic, type, tags,
      gateYear, gatePaper,
    });

    res.status(201).json({ success: true, message: 'Question posted!', data: question });
  } catch (e) { next(e); }
});

// Vote on question
router.post('/questions/:id/vote', protect, async (req, res, next) => {
  try {
    const { vote } = req.body; // 1 for upvote, -1 for downvote
    if (![1, -1].includes(vote)) return res.status(400).json({ success: false, message: 'Invalid vote' });

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, message: 'Vote recorded (mock mode)' });
    }

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const existingVote = question.voters.find(v => v.user.toString() === req.user._id.toString());
    
    if (existingVote) {
      // Remove old vote
      if (existingVote.vote === 1) question.upvotes = Math.max(0, question.upvotes - 1);
      else question.downvotes = Math.max(0, question.downvotes - 1);
      
      if (existingVote.vote === vote) {
        // Same vote = remove vote
        question.voters = question.voters.filter(v => v.user.toString() !== req.user._id.toString());
      } else {
        // Different vote = change
        existingVote.vote = vote;
        if (vote === 1) question.upvotes += 1;
        else question.downvotes += 1;
      }
    } else {
      // New vote
      question.voters.push({ user: req.user._id, vote });
      if (vote === 1) question.upvotes += 1;
      else question.downvotes += 1;
    }

    await question.save();
    res.json({ success: true, data: { upvotes: question.upvotes, downvotes: question.downvotes, score: question.score } });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// ANSWERS
// ─────────────────────────────────────────────────────────────

// Create answer
router.post('/questions/:id/answers', protect, async (req, res, next) => {
  try {
    const { body, resources, codeBlocks } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'Answer body is required' });

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.status(201).json({ success: true, message: 'Answer posted (mock mode)', data: { _id: 'mock-a-id', body } });
    }

    const answer = await Answer.create({
      question: req.params.id,
      user: req.user._id,
      body,
      resources,
      codeBlocks,
    });

    // Update question answer count
    await Question.findByIdAndUpdate(req.params.id, { $inc: { answerCount: 1 } });

    const populated = await Answer.findById(answer._id).populate('user', 'name email avatar');
    res.status(201).json({ success: true, message: 'Answer posted!', data: populated });
  } catch (e) { next(e); }
});

// Vote on answer
router.post('/answers/:id/vote', protect, async (req, res, next) => {
  try {
    const { vote } = req.body;
    if (![1, -1].includes(vote)) return res.status(400).json({ success: false, message: 'Invalid vote' });

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, message: 'Vote recorded (mock mode)' });
    }

    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });

    const existingVote = answer.voters.find(v => v.user.toString() === req.user._id.toString());
    
    if (existingVote) {
      if (existingVote.vote === 1) answer.upvotes = Math.max(0, answer.upvotes - 1);
      else answer.downvotes = Math.max(0, answer.downvotes - 1);
      
      if (existingVote.vote === vote) {
        answer.voters = answer.voters.filter(v => v.user.toString() !== req.user._id.toString());
      } else {
        existingVote.vote = vote;
        if (vote === 1) answer.upvotes += 1;
        else answer.downvotes += 1;
      }
    } else {
      answer.voters.push({ user: req.user._id, vote });
      if (vote === 1) answer.upvotes += 1;
      else answer.downvotes += 1;
    }

    await answer.save();
    res.json({ success: true, data: { upvotes: answer.upvotes, downvotes: answer.downvotes, score: answer.score } });
  } catch (e) { next(e); }
});

// Accept answer (question author only)
router.post('/answers/:id/accept', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, message: 'Answer accepted (mock mode)' });
    }

    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });

    const question = await Question.findById(answer.question);
    if (question.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only question author can accept answers' });
    }

    // Unaccept previous accepted answer
    if (question.acceptedAnswer) {
      await Answer.findByIdAndUpdate(question.acceptedAnswer, { isAccepted: false, acceptedAt: null });
    }

    answer.isAccepted = true;
    answer.acceptedAt = new Date();
    await answer.save();

    question.acceptedAnswer = answer._id;
    question.status = 'answered';
    await question.save();

    res.json({ success: true, message: 'Answer accepted!', data: answer });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────────────────────

// Add comment to question or answer
router.post('/comments', protect, async (req, res, next) => {
  try {
    const { body, referenceType, referenceId } = req.body;
    if (!body || !referenceType || !referenceId) {
      return res.status(400).json({ success: false, message: 'Body, referenceType, and referenceId are required' });
    }

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.status(201).json({ success: true, message: 'Comment added (mock mode)', data: { _id: 'mock-c-id', body } });
    }

    const comment = await Comment.create({
      user: req.user._id,
      body,
      referenceType,
      referenceId,
      refModel: referenceType === 'question' ? 'Question' : 'Answer',
    });

    const populated = await Comment.findById(comment._id).populate('user', 'name email avatar');
    res.status(201).json({ success: true, message: 'Comment added!', data: populated });
  } catch (e) { next(e); }
});

// Get comments for question or answer
router.get('/comments', protect, async (req, res, next) => {
  try {
    const { referenceType, referenceId } = req.query;
    if (!referenceType || !referenceId) {
      return res.status(400).json({ success: false, message: 'referenceType and referenceId are required' });
    }

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const comments = await Comment.find({
      referenceType,
      referenceId,
    })
      .populate('user', 'name email avatar')
      .sort('createdAt');

    res.json({ success: true, count: comments.length, data: comments });
  } catch (e) { next(e); }
});

module.exports = router;