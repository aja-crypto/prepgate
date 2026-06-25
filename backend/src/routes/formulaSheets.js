// src/routes/formulaSheets.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { isMockAuthEnabled } = require('../config/devMode');
const FormulaSheet = require('../models/FormulaSheet');

// Get all formula sheets with filters
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = { isPublished: true };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.topic) filter.topic = req.query.topic;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.gateImportance) filter['formulas.gateImportance'] = req.query.gateImportance;
    if (req.query.search) {
      filter.$or = [
        { subject: { $regex: req.query.search, $options: 'i' } },
        { topic: { $regex: req.query.search, $options: 'i' } },
        { 'formulas.name': { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } },
      ];
    }

    if (!isMongoConnected() || isMockAuthEnabled()) {
      // Return mock data for local mode
      return res.json({
        success: true,
        count: 3,
        data: [
          {
            _id: 'mock-1',
            subject: 'Engineering Mathematics',
            topic: 'Linear Algebra',
            totalFormulas: 15,
            gateNotes: 'High weightage in GATE - focus on eigenvalues and matrices',
          },
          {
            _id: 'mock-2',
            subject: 'Algorithms',
            topic: 'Sorting & Searching',
            totalFormulas: 8,
            gateNotes: 'Time complexity formulas are frequently asked',
          },
          {
            _id: 'mock-3',
            subject: 'DBMS',
            topic: 'Normalization',
            totalFormulas: 12,
            gateNotes: 'Know all normal forms and their conditions',
          },
        ],
        pagination: { page: 1, limit: 20, total: 3, pages: 1 },
      });
    }

    const [sheets, total] = await Promise.all([
      FormulaSheet.find(filter)
        .select('subject topic totalFormulas totalMarksWeight difficulty gateNotes tags createdAt')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      FormulaSheet.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: sheets.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: sheets,
    });
  } catch (e) { next(e); }
});

// Get single formula sheet with all formulas
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({
        success: true,
        data: {
          _id: req.params.id,
          subject: 'Engineering Mathematics',
          topic: 'Linear Algebra',
          formulas: [
            {
              name: 'Eigenvalue Equation',
              latex: 'Ax = \\lambda x',
              text: 'Ax = λx',
              description: 'Fundamental eigenvalue definition',
              gateImportance: 'HIGH',
              marksWeight: 2,
            },
            {
              name: 'Characteristic Equation',
              latex: '|A - \\lambda I| = 0',
              text: 'det(A - λI) = 0',
              description: 'Used to find eigenvalues',
              conditions: ['Square matrix only'],
              gateImportance: 'HIGH',
              marksWeight: 1,
            },
          ],
          constants: [
            { name: 'Pi', symbol: 'π', value: '3.14159', unit: '' },
            { name: 'Euler\'s constant', symbol: 'e', value: '2.71828', unit: '' },
          ],
          gateNotes: 'Eigenvalues and eigenvectors are high-weightage topics in GATE',
        },
      });
    }

    const sheet = await FormulaSheet.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!sheet) return res.status(404).json({ success: false, message: 'Formula sheet not found' });

    res.json({ success: true, data: sheet });
  } catch (e) { next(e); }
});

// Get formula sheets by subject
router.get('/subject/:subject', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({
        success: true,
        count: 2,
        data: [
          { _id: 'mock-s1', subject: req.params.subject, topic: 'Linear Algebra', totalFormulas: 15 },
          { _id: 'mock-s2', subject: req.params.subject, topic: 'Calculus', totalFormulas: 20 },
        ],
      });
    }

    const sheets = await FormulaSheet.find({ 
      subject: req.params.subject, 
      isPublished: true 
    }).select('subject topic totalFormulas difficulty');

    res.json({ success: true, count: sheets.length, data: sheets });
  } catch (e) { next(e); }
});

// Create formula sheet (admin only)
router.post('/', protect, async (req, res, next) => {
  try {
    const { subject, topic, formulas, sections, constants, keyConcepts, gateNotes, tags, difficulty } = req.body;

    if (!subject || !topic || !formulas?.length) {
      return res.status(400).json({ success: false, message: 'Subject, topic, and at least one formula are required' });
    }

    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.status(201).json({
        success: true,
        message: 'Formula sheet created (mock mode)',
        data: { _id: 'mock-fs-id', subject, topic, totalFormulas: formulas.length },
      });
    }

    const sheet = await FormulaSheet.create({
      subject,
      topic,
      formulas,
      sections,
      constants,
      keyConcepts,
      gateNotes,
      tags,
      difficulty,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Formula sheet created!', data: sheet });
  } catch (e) { next(e); }
});

// Update formula sheet
router.put('/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, message: 'Updated (mock mode)' });
    }

    const sheet = await FormulaSheet.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!sheet) return res.status(404).json({ success: false, message: 'Formula sheet not found or not authorized' });

    res.json({ success: true, message: 'Formula sheet updated!', data: sheet });
  } catch (e) { next(e); }
});

// Save/bookmark formula sheet
router.post('/:id/save', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected() || isMockAuthEnabled()) {
      return res.json({ success: true, message: 'Saved (mock mode)' });
    }

    const sheet = await FormulaSheet.findByIdAndUpdate(
      req.params.id,
      { $inc: { saveCount: 1 } },
      { new: true }
    );

    if (!sheet) return res.status(404).json({ success: false, message: 'Formula sheet not found' });

    res.json({ success: true, message: 'Saved!', data: { saveCount: sheet.saveCount } });
  } catch (e) { next(e); }
});

module.exports = router;