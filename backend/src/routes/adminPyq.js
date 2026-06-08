// Admin PYQ management — bulk import (CSV/JSON), CRUD
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { PYQ } = require('../models');
const {
  parseCsv, validateRows, importRows, getImportTemplate,
} = require('../services/pyqImportService');

router.use(protect, adminOnly);

router.get('/import-template', (req, res) => {
  res.json({ success: true, data: getImportTemplate() });
});

router.post('/validate', async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'PYQ import requires MongoDB' });
    const rows = Array.isArray(req.body) ? req.body : req.body.questions || [];
    const result = await validateRows(rows);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

router.post('/import/json', async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'PYQ import requires MongoDB' });
    const rows = Array.isArray(req.body) ? req.body : req.body.questions || [];
    const upsert = req.query.upsert === 'true';
    const result = await importRows(rows, { upsert });
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
});

router.post('/import/csv', async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'PYQ import requires MongoDB' });
    const csvText = req.body.csv || req.body.content || '';
    if (!csvText) return res.status(400).json({ success: false, message: 'CSV content required in body.csv' });
    const rows = parseCsv(csvText);
    const upsert = req.query.upsert === 'true';
    const result = await importRows(rows, { upsert });
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, count: 0, total: 0, page: 1, data: [] });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.year) filter.year = parseInt(req.query.year, 10);

    const [data, total] = await Promise.all([
      PYQ.find(filter)
        .populate('subject', 'name code')
        .populate('topic', 'name')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      PYQ.countDocuments(filter),
    ]);

    res.json({ success: true, count: data.length, total, page, data });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'PYQ admin requires MongoDB' });
    const pyq = await PYQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found' });
    res.json({ success: true, data: pyq });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'PYQ admin requires MongoDB' });
    const pyq = await PYQ.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found' });
    res.json({ success: true, data: pyq });
  } catch (e) { next(e); }
});

module.exports = router;
