const router = require('express').Router();
const { adminProtect, requirePermission } = require('../middleware/adminAuth');
const { isMongoConnected } = require('../config/db');
const { LandingContent, QuestionOfMonth, MotivationQuote, FeaturedResource } = require('../models/LandingContent');

// Helper function for error handling
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Check MongoDB connection
const checkMongo = (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ success: false, message: 'MongoDB required' });
    return false;
  }
  return true;
};

// ============================================
// MONTHLY INSIGHTS
// ============================================

// GET all monthly insights
router.get('/monthly-insights', adminProtect, asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const insights = await LandingContent.find().sort({ year: -1, month: -1, priority: 1 });
  res.json({ success: true, data: insights });
}));

// POST monthly insight
router.post('/monthly-insights', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const insight = await LandingContent.create(req.body);
  res.status(201).json({ success: true, data: insight });
}));

// PUT monthly insight
router.put('/monthly-insights/:id', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const insight = await LandingContent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!insight) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: insight });
}));

// DELETE monthly insight
router.delete('/monthly-insights/:id', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const insight = await LandingContent.findByIdAndDelete(req.params.id);
  if (!insight) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true });
}));

// ============================================
// QUESTION OF THE MONTH
// ============================================

// GET all questions of month
router.get('/question-of-month', adminProtect, asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const questions = await QuestionOfMonth.find().sort({ year: -1, month: -1 });
  res.json({ success: true, data: questions });
}));

// POST question of month
router.post('/question-of-month', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const question = await QuestionOfMonth.create(req.body);
  res.status(201).json({ success: true, data: question });
}));

// PUT question of month
router.put('/question-of-month/:id', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const question = await QuestionOfMonth.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!question) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: question });
}));

// DELETE question of month
router.delete('/question-of-month/:id', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const question = await QuestionOfMonth.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true });
}));

// ============================================
// MOTIVATION QUOTES
// ============================================

// GET all quotes
router.get('/motivation-quotes', adminProtect, asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const quotes = await MotivationQuote.find().sort({ createdAt: -1 });
  res.json({ success: true, data: quotes });
}));

// POST quote
router.post('/motivation-quotes', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const quote = await MotivationQuote.create(req.body);
  res.status(201).json({ success: true, data: quote });
}));

// PUT quote
router.put('/motivation-quotes/:id', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const quote = await MotivationQuote.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!quote) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: quote });
}));

// DELETE quote
router.delete('/motivation-quotes/:id', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const quote = await MotivationQuote.findByIdAndDelete(req.params.id);
  if (!quote) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true });
}));

// ============================================
// FEATURED RESOURCES
// ============================================

// GET all featured resources
router.get('/featured-resources', adminProtect, asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const { category } = req.query;
  const filter = category ? { category, isActive: true } : { isActive: true };
  const resources = await FeaturedResource.find(filter).sort({ priority: -1, createdAt: -1 });
  res.json({ success: true, data: resources });
}));

// POST featured resource
router.post('/featured-resources', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const resource = await FeaturedResource.create(req.body);
  res.status(201).json({ success: true, data: resource });
}));

// PUT featured resource
router.put('/featured-resources/:id', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const resource = await FeaturedResource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!resource) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: resource });
}));

// DELETE featured resource
router.delete('/featured-resources/:id', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const resource = await FeaturedResource.findByIdAndDelete(req.params.id);
  if (!resource) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true });
}));

// ============================================
// BULK IMPORT QUOTES
// ============================================

router.post('/motivation-quotes/bulk', adminProtect, requirePermission('content.manage'), asyncHandler(async (req, res) => {
  if (!checkMongo(req, res)) return;
  const { quotes } = req.body;
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return res.status(400).json({ success: false, message: 'No quotes provided' });
  }
  const created = await MotivationQuote.insertMany(quotes);
  res.status(201).json({ success: true, count: created.length, data: created });
}));

module.exports = router;