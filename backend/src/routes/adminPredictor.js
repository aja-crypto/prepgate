const router = require('express').Router();
const { adminProtect, requirePermission } = require('../middleware/adminAuth');
const { validateFields } = require('../middleware/validateInput');
const { isMongoConnected } = require('../config/db');
const { logAction } = require('../services/auditLog');
const { detectDatasetType, validateDataset, importDataset, previewDataset } = require('../services/dataImportService');

const GateYear = require('../models/GateYear');
const GateCutoff = require('../models/GateCutoff');
const GateRankData = require('../models/GateRankData');
const GateScoreData = require('../models/GateScoreData');
const GateMarksScore = require('../models/GateMarksScore');
const GateScoreRank = require('../models/GateScoreRank');
const GateRankPercentile = require('../models/GateRankPercentile');
const GateStatistics = require('../models/GateStatistics');
const CollegeProgram = require('../models/CollegeProgram');
const CollegeCutoff = require('../models/CollegeCutoff');
const CcmtCutoff = require('../models/CcmtCutoff');
const CoapCutoff = require('../models/CoapCutoff');
const SeatMatrix = require('../models/SeatMatrix');
const BranchStatistics = require('../models/BranchStatistics');
const PsuRequirement = require('../models/PsuRequirement');
const PsuRecruitment = require('../models/PsuRecruitment');
const PredictionHistory = require('../models/PredictionHistory');
const PredictionFeedback = require('../models/PredictionFeedback');
const PredictionAccuracy = require('../models/PredictionAccuracy');

function requireMongo(req, res, next) {
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, message: 'MongoDB required.' });
  }
  next();
}

function buildListRoutes(basePath, Model, label, searchFields = [], sortDefault = { year: -1 }) {
  const routes = [];

  routes.push({
    method: 'get', path: `/${basePath}`,
    handler: async (req, res, next) => {
      try {
        const { page = 1, limit = 100, year, ...filters } = req.query;
        const filter = {};
        if (year) filter.year = parseInt(year);
        if (searchFields.length > 0 && req.query.search) {
          filter.$or = searchFields.map(f => ({ [f]: { $regex: req.query.search, $options: 'i' } }));
        }
        Object.entries(filters).forEach(([k, v]) => {
          if (v && !['page', 'limit', 'search'].includes(k)) {
            filter[k] = isNaN(v) ? { $regex: v, $options: 'i' } : parseInt(v) || v;
          }
        });
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const data = await Model.find(filter).sort(sortDefault).skip(skip).limit(parseInt(limit));
        const total = await Model.countDocuments(filter);
        res.json({ success: true, count: data.length, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), data });
      } catch (e) { next(e); }
    },
  });

  routes.push({
    method: 'post', path: `/${basePath}`,
    handler: async (req, res, next) => {
      try {
        const doc = await Model.create(req.body);
        logAction({ admin: req.admin, action: 'create', resource: basePath, resourceId: doc._id, details: `Created ${label}`, ip: req.ip });
        res.status(201).json({ success: true, data: doc });
      } catch (e) { next(e); }
    },
  });

  routes.push({
    method: 'put', path: `/${basePath}/:id`,
    handler: async (req, res, next) => {
      try {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!doc) return res.status(404).json({ success: false, message: `${label} not found.` });
        logAction({ admin: req.admin, action: 'update', resource: basePath, resourceId: doc._id, details: `Updated ${label}`, ip: req.ip });
        res.json({ success: true, data: doc });
      } catch (e) { next(e); }
    },
  });

  routes.push({
    method: 'delete', path: `/${basePath}/:id`,
    handler: async (req, res, next) => {
      try {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: `${label} not found.` });
        logAction({ admin: req.admin, action: 'delete', resource: basePath, resourceId: req.params.id, details: `Deleted ${label}`, ip: req.ip });
        res.json({ success: true, message: `${label} deleted.` });
      } catch (e) { next(e); }
    },
  });

  return routes;
}

function mountRoutes(routes) {
  routes.forEach(({ method, path, handler }) => {
    const wrapped = [adminProtect, requirePermission('content.manage'), requireMongo];
    if (handler.length > 3) {
      router[method](path, ...wrapped, handler);
    } else {
      router[method](path, ...wrapped, handler);
    }
  });
}

// ─── Existing: GATE Years, Cutoffs, Rank Data, Score Data, Colleges, College Cutoffs, PSUs ───

// GATE Years
mountRoutes(buildListRoutes('years', GateYear, 'GATE Year', ['paper', 'paperName'], { year: -1 }));

// GATE Cutoffs
mountRoutes(buildListRoutes('cutoffs', GateCutoff, 'GATE Cutoff', [], { year: -1, category: 1 }));
router.post('/cutoffs/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { cutoffs } = req.body;
    if (!Array.isArray(cutoffs) || cutoffs.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await GateCutoff.insertMany(cutoffs, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'gate_cutoff', details: `Imported ${cutoffs.length} cutoffs`, ip: req.ip });
    res.json({ success: true, count: cutoffs.length });
  } catch (e) { next(e); }
});

// GATE Rank Data
mountRoutes(buildListRoutes('rank-data', GateRankData, 'Rank Data', [], { year: -1, marks: -1 }));
router.post('/rank-data/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await GateRankData.insertMany(data, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'gate_rank_data', details: `Imported ${data.length} entries`, ip: req.ip });
    res.json({ success: true, count: data.length });
  } catch (e) { next(e); }
});

// GATE Score Data
mountRoutes(buildListRoutes('score-data', GateScoreData, 'Score Data', [], { year: -1, score: -1 }));
router.post('/score-data/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await GateScoreData.insertMany(data, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'gate_score_data', details: `Imported ${data.length} entries`, ip: req.ip });
    res.json({ success: true, count: data.length });
  } catch (e) { next(e); }
});

// ─── NEW: Marks→Score Data ────────────────────────────────────────
mountRoutes(buildListRoutes('marks-score', GateMarksScore, 'Marks→Score', [], { year: -1, marks: -1 }));
router.post('/marks-score/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await GateMarksScore.insertMany(data, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'gate_marks_score', details: `Imported ${data.length} entries`, ip: req.ip });
    res.json({ success: true, count: data.length });
  } catch (e) { next(e); }
});

// ─── NEW: Score→Rank Data ────────────────────────────────────────
mountRoutes(buildListRoutes('score-rank', GateScoreRank, 'Score→Rank', [], { year: -1, score: -1 }));
router.post('/score-rank/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await GateScoreRank.insertMany(data, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'gate_score_rank', details: `Imported ${data.length} entries`, ip: req.ip });
    res.json({ success: true, count: data.length });
  } catch (e) { next(e); }
});

// ─── NEW: Rank→Percentile Data ───────────────────────────────────
mountRoutes(buildListRoutes('rank-percentile', GateRankPercentile, 'Rank→Percentile', [], { year: -1, rank: 1 }));
router.post('/rank-percentile/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await GateRankPercentile.insertMany(data, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'gate_rank_percentile', details: `Imported ${data.length} entries`, ip: req.ip });
    res.json({ success: true, count: data.length });
  } catch (e) { next(e); }
});

// ─── NEW: GATE Statistics ──────────────────────────────────────
mountRoutes(buildListRoutes('gate-statistics', GateStatistics, 'GATE Statistics', [], { year: -1 }));

// ─── NEW: CCMT Cutoffs ─────────────────────────────────────────────
mountRoutes(buildListRoutes('ccmt', CcmtCutoff, 'CCMT Cutoff', ['institute', 'program'], { year: -1, closingScore: -1 }));
router.post('/ccmt/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await CcmtCutoff.insertMany(data, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'ccmt_cutoff', details: `Imported ${data.length} CCMT entries`, ip: req.ip });
    res.json({ success: true, count: data.length });
  } catch (e) { next(e); }
});

// ─── NEW: COAP Cutoffs ─────────────────────────────────────────────
mountRoutes(buildListRoutes('coap', CoapCutoff, 'COAP Cutoff', ['institute', 'program'], { year: -1, closingScore: -1 }));
router.post('/coap/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await CoapCutoff.insertMany(data, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'coap_cutoff', details: `Imported ${data.length} COAP entries`, ip: req.ip });
    res.json({ success: true, count: data.length });
  } catch (e) { next(e); }
});

// ─── NEW: Seat Matrix ──────────────────────────────────────────────
mountRoutes(buildListRoutes('seat-matrix', SeatMatrix, 'Seat Matrix', ['institute', 'program'], { year: -1 }));
router.post('/seat-matrix/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await SeatMatrix.insertMany(data, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'seat_matrix', details: `Imported ${data.length} seat entries`, ip: req.ip });
    res.json({ success: true, count: data.length });
  } catch (e) { next(e); }
});

// ─── NEW: Branch Statistics ────────────────────────────────────────
mountRoutes(buildListRoutes('branch-stats', BranchStatistics, 'Branch Stats', ['branch'], { year: -1 }));

// ─── NEW: PSU Recruitment ──────────────────────────────────────────
mountRoutes(buildListRoutes('psu-recruitment', PsuRecruitment, 'PSU Recruitment', ['name'], { year: -1 }));

// ─── Colleges (existing) ───────────────────────────────────────────
mountRoutes(buildListRoutes('colleges', CollegeProgram, 'College Program', ['name', 'shortName'], { nirfRanking: 1 }));
router.post('/colleges/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { colleges } = req.body;
    if (!Array.isArray(colleges) || colleges.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await CollegeProgram.insertMany(colleges, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'college_program', details: `Imported ${colleges.length} colleges`, ip: req.ip });
    res.json({ success: true, count: colleges.length });
  } catch (e) { next(e); }
});

// ─── College Cutoffs (existing) ────────────────────────────────────
router.get('/college-cutoffs', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { year, category, collegeType, admissionType, college } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (category) filter.category = category;
    if (collegeType) filter.collegeType = collegeType;
    if (admissionType) filter.admissionType = admissionType;
    if (college) filter.collegeName = { $regex: college, $options: 'i' };
    const cutoffs = await CollegeCutoff.find(filter).sort({ year: -1, closingScore: -1 });
    res.json({ success: true, count: cutoffs.length, data: cutoffs });
  } catch (e) { next(e); }
});

router.post('/college-cutoffs', adminProtect, requirePermission('content.manage'), requireMongo, validateFields([
  { name: 'year', type: 'number', required: true },
  { name: 'collegeName', type: 'string', required: true },
  { name: 'program', type: 'string', required: true },
  { name: 'category', type: 'string', required: true },
  { name: 'closingScore', type: 'number', required: true },
]), async (req, res, next) => {
  try {
    const cutoff = await CollegeCutoff.create(req.body);
    logAction({ admin: req.admin, action: 'create', resource: 'college_cutoff', resourceId: cutoff._id, details: `Created cutoff: ${req.body.collegeName} ${req.body.program}`, ip: req.ip });
    res.status(201).json({ success: true, data: cutoff });
  } catch (e) { next(e); }
});

router.put('/college-cutoffs/:id', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const cutoff = await CollegeCutoff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cutoff) return res.status(404).json({ success: false, message: 'Cutoff not found.' });
    logAction({ admin: req.admin, action: 'update', resource: 'college_cutoff', resourceId: cutoff._id, details: `Updated cutoff`, ip: req.ip });
    res.json({ success: true, data: cutoff });
  } catch (e) { next(e); }
});

router.delete('/college-cutoffs/:id', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const cutoff = await CollegeCutoff.findByIdAndDelete(req.params.id);
    if (!cutoff) return res.status(404).json({ success: false, message: 'Cutoff not found.' });
    logAction({ admin: req.admin, action: 'delete', resource: 'college_cutoff', resourceId: req.params.id, details: `Deleted cutoff`, ip: req.ip });
    res.json({ success: true, message: 'Cutoff deleted.' });
  } catch (e) { next(e); }
});

router.post('/college-cutoffs/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { cutoffs } = req.body;
    if (!Array.isArray(cutoffs) || cutoffs.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await CollegeCutoff.insertMany(cutoffs, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'college_cutoff', details: `Imported ${cutoffs.length} cutoffs`, ip: req.ip });
    res.json({ success: true, count: cutoffs.length });
  } catch (e) { next(e); }
});

// ─── PSU Requirements (existing) ─────────────────────────────────
mountRoutes(buildListRoutes('psus', PsuRequirement, 'PSU Requirement', ['name'], { year: -1, cutoffScore: -1 }));
router.post('/psus/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { psus } = req.body;
    if (!Array.isArray(psus) || psus.length === 0) return res.status(400).json({ success: false, message: 'Provide an array.' });
    const result = await PsuRequirement.insertMany(psus, { ordered: false }).catch(e => e.result);
    logAction({ admin: req.admin, action: 'bulk_create', resource: 'psu_requirement', details: `Imported ${psus.length} PSU entries`, ip: req.ip });
    res.json({ success: true, count: psus.length });
  } catch (e) { next(e); }
});

// ─── Smart Import ──────────────────────────────────────────────────
router.post('/import', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data, type, year, paper, force } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide a non-empty array.' });
    }

    const detectedType = type || detectDatasetType(data);
    if (detectedType === 'unknown') {
      return res.status(400).json({ success: false, message: 'Could not detect dataset type. Specify type or check column names.' });
    }

    const validation = validateDataset(detectedType, data);
    if (!validation.valid && !force) {
      return res.status(400).json({ success: false, message: 'Validation failed', validation });
    }

    const result = await importDataset(detectedType, data, { year, paper, force });
    logAction({ admin: req.admin, action: 'dataset_import', details: `Imported ${detectedType}: ${result.inserted || 0} rows`, ip: req.ip });
    res.json({ success: true, type: detectedType, ...result });
  } catch (e) { next(e); }
});

// ─── Preview Import ────────────────────────────────────────────────
router.post('/import/preview', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const { data, type } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide a non-empty array.' });
    }
    const detectedType = type || detectDatasetType(data);
    const preview = previewDataset(detectedType, data);
    res.json({ success: true, ...preview });
  } catch (e) { next(e); }
});

// ─── Dataset Counts ────────────────────────────────────────────────
router.get('/dataset-counts', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const [
      years, cutoffs, rankData, scoreData, marksScore, scoreRank, rankPercentile,
      statistics, ccmt, coap, seatMatrix, branchStats, colleges, collegeCutoffs,
      psus, psuRecruit, predictions, feedback,
    ] = await Promise.all([
      GateYear.countDocuments(), GateCutoff.countDocuments(), GateRankData.countDocuments(),
      GateScoreData.countDocuments(), GateMarksScore.countDocuments(), GateScoreRank.countDocuments(),
      GateRankPercentile.countDocuments(), GateStatistics.countDocuments(), CcmtCutoff.countDocuments(),
      CoapCutoff.countDocuments(), SeatMatrix.countDocuments(), BranchStatistics.countDocuments(),
      CollegeProgram.countDocuments(), CollegeCutoff.countDocuments(), PsuRequirement.countDocuments(),
      PsuRecruitment.countDocuments(), PredictionHistory.countDocuments(), PredictionFeedback.countDocuments(),
    ]);
    const accuracy = await PredictionAccuracy.findOne().sort({ lastCalculated: -1 });
    res.json({
      success: true,
      data: {
        gateYears: years, gateCutoffs: cutoffs, rankData, scoreData,
        marksScore, scoreRank, rankPercentile, statistics,
        ccmtCutoffs: ccmt, coapCutoffs: coap, seatMatrix, branchStats,
        colleges, collegeCutoffs, psus, psuRecruitments: psuRecruit,
        predictions, feedback,
        predictionAccuracy: accuracy?.overallAccuracy || null,
        totalDataPoints: cutoffs + rankData + scoreData + marksScore + scoreRank + rankPercentile + ccmt + coap + seatMatrix + collegeCutoffs,
      },
    });
  } catch (e) { next(e); }
});

// ─── Prediction Feedback & Validation Data ───────────────────────
router.get('/feedback', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const data = await PredictionFeedback.find().populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await PredictionFeedback.countDocuments();
    res.json({ success: true, count: data.length, total, page, pages: Math.ceil(total / limit), data });
  } catch (e) { next(e); }
});

router.get('/accuracy', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const data = await PredictionAccuracy.findOne().sort({ lastCalculated: -1 });
    res.json({ success: true, data: data || { overallAccuracy: 0, totalPredictions: 0 } });
  } catch (e) { next(e); }
});

// ─── Delete ALL data for a dataset type (danger zone) ─────────────
router.delete('/clear/:type', adminProtect, requirePermission('settings.manage'), requireMongo, async (req, res, next) => {
  try {
    const modelMap = {
      'years': GateYear, 'cutoffs': GateCutoff, 'rank-data': GateRankData, 'score-data': GateScoreData,
      'marks-score': GateMarksScore, 'score-rank': GateScoreRank, 'rank-percentile': GateRankPercentile,
      'gate-statistics': GateStatistics, 'ccmt': CcmtCutoff, 'coap': CoapCutoff,
      'seat-matrix': SeatMatrix, 'branch-stats': BranchStatistics,
      'colleges': CollegeProgram, 'college-cutoffs': CollegeCutoff,
      'psus': PsuRequirement, 'psu-recruitment': PsuRecruitment,
      'predictions': PredictionHistory, 'feedback': PredictionFeedback,
    };
    const Model = modelMap[req.params.type];
    if (!Model) return res.status(400).json({ success: false, message: `Unknown dataset type: ${req.params.type}` });
    const result = await Model.deleteMany({});
    logAction({ admin: req.admin, action: 'clear_dataset', details: `Cleared ${req.params.type}: ${result.deletedCount} rows`, ip: req.ip });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (e) { next(e); }
});

// ─── Stats Summary ────────────────────────────────────────────────
router.get('/stats', adminProtect, requirePermission('content.manage'), requireMongo, async (req, res, next) => {
  try {
    const [years, cutoffs, rankEntries, scoreEntries, marksScore, scoreRank, rankPercentile, statistics,
      ccmt, coap, seatMatrix, branchStats, colleges, collegeCutoffs, psus, psuRecruit,
      predictions, feedback] = await Promise.all([
      GateYear.countDocuments(), GateCutoff.countDocuments(), GateRankData.countDocuments(),
      GateScoreData.countDocuments(), GateMarksScore.countDocuments(), GateScoreRank.countDocuments(),
      GateRankPercentile.countDocuments(), GateStatistics.countDocuments(), CcmtCutoff.countDocuments(),
      CoapCutoff.countDocuments(), SeatMatrix.countDocuments(), BranchStatistics.countDocuments(),
      CollegeProgram.countDocuments(), CollegeCutoff.countDocuments(), PsuRequirement.countDocuments(),
      PsuRecruitment.countDocuments(), PredictionHistory.countDocuments(), PredictionFeedback.countDocuments(),
    ]);
    const latestYear = await GateYear.findOne().sort({ year: -1 });
    const accuracy = await PredictionAccuracy.findOne().sort({ lastCalculated: -1 });
    res.json({
      success: true,
      data: {
        years, cutoffs, rankEntries, scoreEntries, marksScore, scoreRank, rankPercentile,
        statistics, ccmt, coap, seatMatrix, branchStats, colleges, collegeCutoffs, psus, psuRecruit,
        predictions, feedback,
        latestYear: latestYear?.year || null,
        totalDataPoints: cutoffs + rankEntries + scoreEntries + marksScore + scoreRank + rankPercentile + ccmt + coap + seatMatrix + collegeCutoffs + psus,
        predictionAccuracy: accuracy?.overallAccuracy || null,
      },
    });
  } catch (e) { next(e); }
});

module.exports = router;
