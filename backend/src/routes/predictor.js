const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');
const { requirePremium } = require('../middleware/requirePremium');
const { validateFields } = require('../middleware/validateInput');
const { isMongoConnected, isMockAuthEnabled } = require('../config/db');
const { predict, whatIf, generateAiReport } = require('../services/predictionEngine');
const PredictionHistory = require('../models/PredictionHistory');
const PredictionFeedback = require('../models/PredictionFeedback');
const PredictionAccuracy = require('../models/PredictionAccuracy');
const PredictionCache = require('../models/PredictionCache');
const GateYear = require('../models/GateYear');
const GateCutoff = require('../models/GateCutoff');
const CollegeProgram = require('../models/CollegeProgram');
const PsuRequirement = require('../models/PsuRequirement');
const CcmtCutoff = require('../models/CcmtCutoff');
const CoapCutoff = require('../models/CoapCutoff');
const SeatMatrix = require('../models/SeatMatrix');
const BranchStatistics = require('../models/BranchStatistics');
const GateStatistics = require('../models/GateStatistics');
const User = require('../models/User');

// dataset_catalogue.json is static — read & parse it at most once per process
let _datasetCatalogueCache = null;
function readDatasetCatalogue() {
  if (_datasetCatalogueCache !== null) return _datasetCatalogueCache;
  try {
    const catPath = path.join(__dirname, '..', '..', 'data', 'dataset_catalogue.json');
    _datasetCatalogueCache = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
  } catch {
    _datasetCatalogueCache = null;
  }
  return _datasetCatalogueCache;
}

const predictLimiter = new Map();
const PREDICT_LIMIT = 10;
const PREDICT_LIMIT_DEMO = 50;
const PREDICT_WINDOW = 60000;

const TESTING_PREDICT_LIMIT = 10;

function predictRateLimit(req, res, next) {
  const isDemo = req.headers['x-demo-user'] || req.headers['x-testing'] || (isMockAuthEnabled() && req.query.demo === 'true');
  const limit = isDemo ? PREDICT_LIMIT_DEMO : PREDICT_LIMIT;
  const userId = req.user?._id?.toString() || req.ip || 'anonymous';
  const now = Date.now();
  const record = predictLimiter.get(userId) || { count: 0, resetAt: now + PREDICT_WINDOW };
  if (now > record.resetAt) { record.count = 0; record.resetAt = now + PREDICT_WINDOW; }
  record.count++;
  predictLimiter.set(userId, record);
  if (record.count > limit) {
    return res.status(429).json({ success: false, message: 'Too many predictions. Try again later.', retryAfter: Math.ceil((record.resetAt - now) / 1000) });
  }
  next();
}

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of predictLimiter) {
    if (now > record.resetAt) predictLimiter.delete(key);
  }
}, 300000).unref();

function requireMongo(req, res, next) {
  if (!isMongoConnected()) {
    if (req.path === '/predict' && req.method === 'POST') {
      // Allow prediction to proceed without MongoDB — fallback to user-data-only prediction
      req.localMode = true;
      return next();
    }
    return res.status(503).json({ success: false, message: 'Predictor requires MongoDB for this feature. Connect to database.' });
  }
  next();
}

function initTestingAccess(req) {
  req.testingAccess = {
    enabled: false,
    limit: TESTING_PREDICT_LIMIT,
    used: 0,
    remaining: TESTING_PREDICT_LIMIT,
  };
}

function testingLimitReachedResponse(used) {
  return {
    success: false,
    code: 'PREDICTOR_TEST_LIMIT_REACHED',
    message: "You've used all 10 free testing predictions.",
    testingLimit: TESTING_PREDICT_LIMIT,
    testingUsed: used,
    testingRemaining: Math.max(0, TESTING_PREDICT_LIMIT - used),
  };
}

async function loadPredictorAccess(req, res) {
  initTestingAccess(req);
  const { canAccessPremium, isDemoUser } = require('../utils/permissions');

  // Demo / guest access is never allowed — must be a real registered user.
  if (isDemoUser(req.user)) {
    res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
    return false;
  }

  if (canAccessPremium(req.user)) {
    return true;
  }

  const userId = req.user?._id?.toString() || '';
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
  let used = 0;

  if (isMockAuthEnabled()) {
    const mockStore = require('../store/mockStore');
    const u = mockStore.findById(userId);
    if (!u) {
      res.status(401).json({ success: false, message: 'Not authorized. Please login.' });
      return false;
    }
    used = u.nexaPredictorTestUses || 0;
  } else if (!isValidObjectId) {
    res.status(403).json({
      success: false,
      message: 'Premium feature. Upgrade your account to access this.',
      code: 'PREMIUM_REQUIRED',
    });
    return false;
  } else if (!isMongoConnected()) {
    res.status(503).json({ success: false, message: 'Database connection required for predictor access.' });
    return false;
  } else {
    const userNow = await User.findById(userId).select('nexaPredictorTestUses').lean();
    used = userNow?.nexaPredictorTestUses || 0;
  }

  if (used >= TESTING_PREDICT_LIMIT) {
    res.status(403).json(testingLimitReachedResponse(used));
    return false;
  }

  req.testingAccess = {
    enabled: true,
    limit: TESTING_PREDICT_LIMIT,
    used,
    remaining: TESTING_PREDICT_LIMIT - used,
    userId,
  };
  return true;
}

async function consumeTestingUse(req) {
  if (!req.testingAccess?.enabled) return true;

  const userId = req.testingAccess.userId;

  if (isMockAuthEnabled()) {
    const mockStore = require('../store/mockStore');
    const u = mockStore.findById(userId);
    if (!u || (u.nexaPredictorTestUses || 0) >= TESTING_PREDICT_LIMIT) {
      return false;
    }
    u.nexaPredictorTestUses = (u.nexaPredictorTestUses || 0) + 1;
    await u.save();
    req.testingAccess.used = u.nexaPredictorTestUses;
    req.testingAccess.remaining = Math.max(0, TESTING_PREDICT_LIMIT - u.nexaPredictorTestUses);
    req.testingAccess.rollbackUserMockId = userId;
    return true;
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, nexaPredictorTestUses: { $lt: TESTING_PREDICT_LIMIT } },
    { $inc: { nexaPredictorTestUses: 1 } },
    { new: true, select: 'nexaPredictorTestUses' }
  ).lean();

  if (!updatedUser) return false;

  req.testingAccess.used = updatedUser.nexaPredictorTestUses || 0;
  req.testingAccess.remaining = Math.max(0, TESTING_PREDICT_LIMIT - req.testingAccess.used);
  req.testingAccess.rollbackUserId = userId;
  return true;
}

async function requirePredictorTestingAccess(req, res, next) {
  try {
    const ok = await loadPredictorAccess(req, res);
    if (!ok) return;
    next();
  } catch (e) {
    next(e);
  }
}

async function rollbackTestingUse(req) {
  if (!req.testingAccess?.enabled) return;
  try {
    if (req.testingAccess.rollbackUserId && isMongoConnected()) {
      await User.findByIdAndUpdate(
        req.testingAccess.rollbackUserId,
        { $inc: { nexaPredictorTestUses: -1 } }
      );
    } else if (req.testingAccess.rollbackUserMockId && isMockAuthEnabled()) {
      const mockStore = require('../store/mockStore');
      const u = mockStore.findById(req.testingAccess.rollbackUserMockId);
      if (u && (u.nexaPredictorTestUses || 0) > 0) {
        u.nexaPredictorTestUses -= 1;
        await u.save();
      }
    }
  } catch (e) {
    console.error('[Predictor] Failed to rollback testing use:', e.message);
  }
}

// ─── Main Prediction ──────────────────────────────────────────────
router.post('/predict', protect, predictRateLimit, requireMongo, validateFields([
  { name: 'expectedMarks', type: 'number', required: true, min: 0, max: 100 },
  { name: 'category', type: 'string', required: true },
]), requirePredictorTestingAccess, async (req, res, next) => {
  const routeStart = Date.now();
  const timingMarks = [];
  try {
    const {
      expectedMarks, category, paper = 'CS', admissionType = 'M.Tech',
      preferredState = '', collegeType = 'Any', preferredProgram = '',
      name = '', attemptNumber = 1, targetYear = null,
      mockAverage = null, preparationLevel = null,
    } = req.body;

    // Check cache (scoped to user — different users never share cache).
    // Reads are enabled whenever MongoDB is connected (including mock-auth dev
    // mode): the cache key covers every prediction input, so identical repeat
    // predictions short-circuit the ~1-2s engine run.
    const userId = req.user?._id?.toString() || 'anon';
    const cacheKey = `predict:${userId}:${expectedMarks}:${category}:${paper}:${admissionType}:${collegeType}:${preferredState}`;
    const CACHE_TTL_MINUTES = 360;
    if (isMongoConnected()) {
      const cached = await PredictionCache.findOne({ cacheKey, expiresAt: { $gt: new Date() } }).lean();
      if (cached) {
        await PredictionCache.updateOne({ _id: cached._id }, { $inc: { hitCount: 1 } });
        return res.json({
          success: true,
          data: {
            ...cached.output,
            cached: true,
            ...(req.testingAccess?.enabled ? {
              testingAccess: true,
              testingLimit: req.testingAccess.limit,
              testingUsed: req.testingAccess.used,
              testingRemaining: req.testingAccess.remaining,
            } : {}),
          },
        });
      }
    }

    if (req.testingAccess?.enabled) {
      const consumed = await consumeTestingUse(req);
      if (!consumed) {
        const used = req.testingAccess.used ?? TESTING_PREDICT_LIMIT;
        return res.status(403).json(testingLimitReachedResponse(used));
      }
    }

    timingMarks.push('pre-predict');
    const predictStart = Date.now();
    let result;
    try {
      // Use MongoDB prediction engine when available, fall back to local static data
      if (isMongoConnected()) {
        result = await predict({
          expectedMarks, category, paper, admissionType,
          preferredState, collegeType, preferredProgram,
          attemptNumber, targetYear, mockAverage, preparationLevel,
        });
      } else {
        const { localPredict } = require('../services/localPredictor');
        result = localPredict({ expectedMarks, category, paper, admissionType, preferredState, collegeType, preferredProgram });
      }
    } catch (err) {
      console.error('[Predictor] prediction engine error, using fallback:', err.message);
      // Fallback heuristic when MongoDB unavailable
      // NOTE: predictedScore must use the canonical 0-1000 scale (same as the prediction engine)
      const score = Math.min(100, Math.max(0, expectedMarks));
      const gateScore = Math.round(score * 10);
      const rank = Math.round(Math.pow(10, (100 - score) / 25) * 100);
      const percentile = Math.max(0.1, 100 - (rank / 200000) * 100);
      result = {
        predictedScore: gateScore, predictedRank: rank, predictedPercentile: +percentile.toFixed(2),
        confidence: 'Medium', confidenceScore: 50, isQualified: gateScore >= 250, qualifyingCutoff: 25,
        dreamColleges: [], targetColleges: [], safeColleges: [], backupColleges: [],
        guaranteedColleges: [], veryHighColleges: [], likelyColleges: [], competitiveColleges: [],
        dreamTierColleges: [], eligibleIITs: 0, eligibleNITs: 0, eligibleIIITs: 0, eligibleGFTIs: 0,
        eligiblePSUs: 0, branchRecommendations: [], admissionProbability: 0, whyThisPrediction: '',
        baseYear: 2025, datasetsUsed: ['heuristic-fallback'],
      };
    }
    const predictTime = Date.now() - predictStart;
    timingMarks.push('post-predict');

    if (result.error) {
      const statusCode = result.availableCategories ? 404 : 400;
      await rollbackTestingUse(req);
      return res.status(statusCode).json({
        success: false,
        message: result.error,
        ...(result.availableCategories ? { availableCategories: result.availableCategories } : {}),
        ...(req.testingAccess?.enabled ? {
          testingAccess: true,
          testingLimit: req.testingAccess.limit,
          testingUsed: req.testingAccess.used - 1,
          testingRemaining: req.testingAccess.remaining + 1,
        } : {}),
      });
    }

    // Build datasets used array
    const datasetsUsed = result.datasetsUsed || [];

    // Generate AI report
    const userData = req.user ? {
      completedSubjects: req.user.progressBackup?.completedSubjects?.length || 0,
      weakSubjects: req.user.progressBackup?.weakSubjects || [],
    } : {};
    const aiReport = generateAiReport(result, userData);

    // Save to history (skip for non-ObjectId users like demo)
    let historyEntry = null;
    try {
      const userId = req.user?._id?.toString() || req.user?.id?.toString() || '';
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
      if (userId && isValidObjectId) {
        historyEntry = await PredictionHistory.create({
          user: userId,
          input: { name, paper, expectedMarks, category, admissionType, preferredState, collegeType, preferredProgram, attemptNumber, targetYear, mockAverage, preparationLevel },
          output: {
            predictedScore: result.predictedScore,
            predictedRank: result.predictedRank,
            predictedPercentile: result.predictedPercentile,
            confidence: result.confidence,
            confidenceScore: result.confidenceScore,
            isQualified: result.isQualified,
            qualifyingCutoff: result.qualifyingCutoff,
            dreamColleges: result.dreamColleges.slice(0, 30).map(c => ({ institute: c.institute, program: c.program, probability: c.probability })),
            targetColleges: result.targetColleges.slice(0, 30).map(c => ({ institute: c.institute, program: c.program, probability: c.probability })),
            safeColleges: result.safeColleges.slice(0, 30).map(c => ({ institute: c.institute, program: c.program, probability: c.probability })),
            backupColleges: result.backupColleges.slice(0, 15).map(c => ({ institute: c.institute, program: c.program, probability: c.probability })),
            eligibleIITs: result.eligibleIITs,
            eligibleNITs: result.eligibleNITs,
            eligibleIIITs: result.eligibleIIITs,
            eligibleGFTIs: result.eligibleGFTIs,
            eligiblePSUs: result.eligiblePSUs,
            branchRecommendations: result.branchRecommendations,
            admissionProbability: result.admissionProbability,
            last5YearTrend: result.last5YearTrend,
            whyThisPrediction: result.whyThisPrediction,
          },
          aiReport,
          datasetsUsed,
          whatIfScenarios: result.whatIfBaseline || [],
          year: result.baseYear,
        });
      }
    } catch (e) {
      console.error('Failed to save prediction history:', e.message);
    }

    // Map 5-tier college lists → flat opportunities array with collegeBlock tier
    // Use centralized institute classification instead of hardcoded list
    const { getCollegeBlock: getCollegeBlockFromConfig } = require('../config/instituteClassification');

    const opportunityFromCollege = (c, path, baseYear) => ({
      college: c.institute, program: c.program, specialization: c.specialization || '',
      path, collegeType: c.instituteType, tier: c.tier || null, collegeBlock: getCollegeBlockFromConfig(c), location: c.state || '',
      closingScore: c.closingScore, openingScore: c.openingScore, year: c.year || baseYear, round: c.round,
      probability: c.probability, admissionConfidence: c.admissionConfidence || null, matchScore: c.matchScore || null, seats: c.seats || null,
      avgPlacement: c.avgPlacement || null, highestPlacement: c.highestPlacement || null,
      medianPlacement: c.medianPlacement || null, fees: c.fees || null, website: c.website || '',
      placementPercentage: c.placementPercentage || null, topRecruiters: c.topRecruiters || null,
      hostelFee: c.hostelFee || null, totalCost: c.totalCost || null, roiScore: c.roiScore || null,
      duration: c.duration || null, intake: c.intake || null,
      acceptedPapers: c.acceptedPapers || null, curriculum: c.curriculum || null,
      researchAreas: c.researchAreas || null,
      academicsRating: c.academicsRating || null, placementsRating: c.placementsRating || null,
      researchRating: c.researchRating || null, campusRating: c.campusRating || null, roiRating: c.roiRating || null,
      explanations: c.explanations || [], previousClosingScores: c.previousClosingScores || [],
      tags: c.tags || [], admissionRoute: c.admissionRoute || 'CCMT', quotaType: c.quotaType || 'AI',
      availableCategories: c.availableCategories || [],
      trend: c.trend ? { direction: c.trend.trendDirection || 'Stable', avgClosing: c.trend.averageScore || c.closingScore, range: c.trend.maxScore && c.trend.minScore ? `${c.trend.minScore}–${c.trend.maxScore}` : null, years: c.trend.years || [] } : null,
    });
    const pathMap = { guaranteedColleges: 'Very High Chance', veryHighColleges: 'High Chance', likelyColleges: 'Good Chance', competitiveColleges: 'Competitive', dreamTierColleges: 'Dream' };
    const opportunities = [];
    for (const [key, path] of Object.entries(pathMap)) {
      for (const c of (result[key] || [])) opportunities.push(opportunityFromCollege(c, path, result.baseYear));
    }

    // Sort opportunities by college block priority (elite first), then by probability desc
    const BLOCK_PRIORITY = { dream_elite: 0, high_chance_iit: 1, safe_nit: 2, backup: 3 };
    opportunities.sort((a, b) => {
      const pa = BLOCK_PRIORITY[a.collegeBlock] !== undefined ? BLOCK_PRIORITY[a.collegeBlock] : 99;
      const pb = BLOCK_PRIORITY[b.collegeBlock] !== undefined ? BLOCK_PRIORITY[b.collegeBlock] : 99;
      if (pa !== pb) return pa - pb;
      return (b.probability || 0) - (a.probability || 0);
    });

    // Build grouped college blocks
    const collegeBlocks = {
      dreamElite: opportunities.filter(o => o.collegeBlock === 'dream_elite'),
      highChanceIits: opportunities.filter(o => o.collegeBlock === 'high_chance_iit'),
      safeNits: opportunities.filter(o => o.collegeBlock === 'safe_nit'),
      backup: opportunities.filter(o => o.collegeBlock === 'backup'),
    };

    const totalTime = Date.now() - routeStart;
    const responseData = { 
      baseYear: result.baseYear, 
      predictedScore: result.predictedScore, 
      predictedRank: result.predictedRank, 
      predictedPercentile: result.predictedPercentile, 
      airRange: result.airRange, 
      isQualified: result.isQualified,
      qualifyingCutoff: result.qualifyingCutoff,
      gateScore: { value: result.predictedScore, type: 'Estimated' },
      air: { range: result.airRange, interpolatedAIR: result.predictedRank },
      formula: result.gateFormula,
      confidence: result.confidence,
      confidenceScore: result.confidenceScore,
      gateFormula: result.gateFormula,
      disclaimer: 'GATE Score and AIR are estimated using official GATE formulas, published qualifying marks, and historical counselling data. Mt (average marks of top 0.1% candidates) is not officially published by IITs and is estimated from historical score distributions. Results should be treated as guidance only.',
      totalDataPoints: result.totalDataPoints,
      totalOpportunities: result.totalOpportunities,
      totalColleges: result.totalColleges,
      totalProgrammes: result.totalProgrammes,
      officialData: result.officialData,
      estimatedData: result.estimatedData,
      datasetsUsed: result.datasetsUsed || [],
      confidenceFactors: result.confidenceFactors || [],
      totalIITs: result.totalIITs,
      totalNITs: result.totalNITs,
      totalIIITs: result.totalIIITs,
      totalGFTIs: result.totalGFTIs,
      totalPrivate: result.totalPrivate,
      totalIISc: result.totalIISc,
      totalIIEST: result.totalIIEST,
      totalOther: result.totalOther,
      databaseCoverage: result.databaseCoverage,
      databaseStats: result.databaseStats,
      datasetInfo: readDatasetCatalogue(),
      eligibleIITs: result.eligibleIITs,
      eligibleNITs: result.eligibleNITs,
      eligibleIIITs: result.eligibleIIITs,
      eligibleGFTIs: result.eligibleGFTIs,
      eligibleIISc: result.eligibleIISc,
      eligibleIIEST: result.eligibleIIEST,
      opportunities, collegeBlocks, 
      aiReport,
      recommendations: result.recommendations || [],
      historyId: historyEntry?._id || null,
      profile: { predictMs: predictTime, totalMs: totalTime, phases: result._debug?.timings || null },
      ...(req.user?.role === 'owner' ? {
        debug: {
          dbRecordsByType: result._debug?.dbRecordsByType || null,
          filteredCcmtCount: result._debug?.filteredCcmtCount || 0,
          allCcmtCutoffs: result._debug?.allCcmtCutoffs || 0,
          marksScoreData: result._debug?.marksScoreData || 0,
          scoreRankData: result._debug?.scoreRankData || 0,
          databaseCoverage: result.databaseCoverage || 0,
          recommendedCount: result._debug?.recommendedCount || 0,
          recommendedSkipped: result.recommendedSkipped || 0,
        }
      } : {}),
      ...(req.testingAccess?.enabled ? {
        testingAccess: true,
        testingLimit: req.testingAccess.limit,
        testingUsed: req.testingAccess.used,
        testingRemaining: req.testingAccess.remaining,
      } : {}),
    };

    // Store in cache (non-blocking)
    if (isMongoConnected()) {
      PredictionCache.findOneAndUpdate(
        { cacheKey },
        { $set: { cacheKey, input: req.body, output: responseData, expiresAt: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000) } },
        { upsert: true, new: false }
      ).catch(() => {});
    }

    res.json({ success: true, data: responseData });
  } catch (e) { await rollbackTestingUse(req); next(e); }
});

// ─── What-If Analysis ─────────────────────────────────────────────
router.post('/what-if', protect, requirePremium, requireMongo, validateFields([
  { name: 'historyId', type: 'string', required: true },
  { name: 'marksDelta', type: 'number', required: true },
]), async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || '';
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (!isValidObjectId) return res.status(400).json({ success: false, message: 'User not found.' });
    const history = await PredictionHistory.findOne({ _id: req.body.historyId, user: userId }).lean();
    if (!history) return res.status(404).json({ success: false, message: 'Prediction not found.' });

    const scenario = whatIf(history.output, req.body.marksDelta);
    if (!scenario) return res.status(400).json({ success: false, message: 'Cannot compute what-if.' });

    const ccmtCutoffs = await CcmtCutoff.find({ year: history.year, category: history.input.category || 'General', dataStatus: { $ne: 'placeholder' } });
    const opportunities = ccmtCutoffs.filter(c => (scenario.adjustedScore || 0) >= (c.closingScore || 0));

    res.json({
      success: true,
      data: { ...scenario, opportunities: opportunities.length },
    });
  } catch (e) { next(e); }
});

// ─── Cutoff Trends ────────────────────────────────────────────────
router.get('/trends/:institute/:program', protect, requirePremium, requireMongo, async (req, res, next) => {
  try {
    const { institute, program } = req.params;
    const { category = 'General' } = req.query;
    const cutoffs = await CcmtCutoff.find({ institute, program, category, dataStatus: { $ne: 'placeholder' } }).sort({ year: 1 }).lean();
    if (!cutoffs || cutoffs.length === 0) {
      return res.status(404).json({ success: false, message: 'No trend data found.' });
    }
    res.json({
      success: true,
      data: {
        institute, program, category,
        years: cutoffs.map(c => ({ year: c.year, closingScore: c.closingScore, openingScore: c.openingScore, round: c.round })),
      },
    });
  } catch (e) { next(e); }
});

// ─── CCMT Data Query ──────────────────────────────────────────────
router.get('/ccmt', protect, requirePremium, requireMongo, async (req, res, next) => {
  try {
    const { year, category, instituteType, state, program, round } = req.query;
    const filter = { dataStatus: { $ne: 'placeholder' } };
    if (year) filter.year = parseInt(year);
    if (category) filter.category = category;
    if (instituteType) filter.instituteType = instituteType;
    if (state) filter.state = state;
    if (program) filter.program = { $regex: program, $options: 'i' };
    if (round) filter.round = parseInt(round);
    const data = await CcmtCutoff.find(filter).sort({ closingScore: -1 }).limit(500).lean();
    res.json({ success: true, count: data.length, data });
  } catch (e) { next(e); }
});

// ─── Insights: Highest Closing Scores (verified source) ───────────
// Serves the same CcmtCutoff collection the prediction engine reads (non-placeholder
// rows only) so the insights "Highest Closing Scores" section has ONE source of truth.
router.get('/insights/top-closing-scores', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.json({ success: true, count: 0, data: [] });
    const { category = 'General', year, limit = 20, instituteType = 'IIT' } = req.query;
    const filter = {
      dataStatus: { $ne: 'placeholder' },
      closingScore: { $gt: 0, $lte: 1000 },
      category,
    };
    if (year) filter.year = parseInt(year);
    if (instituteType && instituteType !== 'Any') filter.instituteType = instituteType;
    const data = await CcmtCutoff.find(filter).sort({ closingScore: -1 }).limit(Math.min(parseInt(limit) || 20, 100)).lean();
    res.json({
      success: true,
      count: data.length,
      year: data[0]?.year ?? null,
      data: data.map(c => ({
        institute: c.institute,
        instituteType: c.instituteType,
        program: c.program,
        specialization: c.specialization || '',
        category: c.category,
        round: c.round,
        openingScore: c.openingScore,
        closingScore: c.closingScore,
        dataStatus: c.dataStatus,
        source: c.source,
        year: c.year,
      })),
    });
  } catch (e) { next(e); }
});

// ─── COAP Data Query ──────────────────────────────────────────────
router.get('/coap', protect, requirePremium, requireMongo, async (req, res, next) => {
  try {
    const { year, category, institute } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (category) filter.category = category;
    if (institute) filter.institute = { $regex: institute, $options: 'i' };
    const data = await CoapCutoff.find(filter).sort({ offerRound: 1 }).lean();
    res.json({ success: true, count: data.length, data });
  } catch (e) { next(e); }
});

// ─── Seat Matrix Query ────────────────────────────────────────────
router.get('/seats', protect, requirePremium, requireMongo, async (req, res, next) => {
  try {
    const { year, institute, program } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (institute) filter.institute = { $regex: institute, $options: 'i' };
    if (program) filter.program = { $regex: program, $options: 'i' };
    const data = await SeatMatrix.find(filter).sort({ year: -1 }).lean();
    res.json({ success: true, count: data.length, data });
  } catch (e) { next(e); }
});

// ─── Prediction Validation ────────────────────────────────────────
router.post('/validate', protect, requirePremium, requireMongo, validateFields([
  { name: 'predictionId', type: 'string', required: true },
  { name: 'isCorrect', type: 'boolean', required: true },
]), async (req, res, next) => {
  try {
    const { predictionId, isCorrect, actualRank, actualScore, actualCollege, actualProgram, feedbackText } = req.body;

    const prediction = await PredictionHistory.findOne({ _id: predictionId, user: req.user._id }).lean();
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found.' });

    prediction.validation = {
      isCorrect,
      validatedAt: new Date(),
      userFeedback: feedbackText || '',
    };
    await prediction.save();

    await PredictionFeedback.create({
      user: req.user._id,
      prediction: predictionId,
      isCorrect,
      actualRank: actualRank || null,
      actualScore: actualScore || null,
      actualCollege: actualCollege || '',
      actualProgram: actualProgram || '',
      feedbackText: feedbackText || '',
    });

    // Recalculate accuracy
    const total = await PredictionFeedback.countDocuments();
    const correct = await PredictionFeedback.countDocuments({ isCorrect: true });
    const incorrect = await PredictionFeedback.countDocuments({ isCorrect: false });
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    await PredictionAccuracy.findOneAndUpdate({}, {
      $set: {
        overallAccuracy: accuracy,
        totalPredictions: total,
        correctPredictions: correct,
        incorrectPredictions: incorrect,
        lastCalculated: new Date(),
      },
    }, { upsert: true });

    res.json({ success: true, accuracy, total, correct, incorrect });
  } catch (e) { next(e); }
});

// ─── Prediction Accuracy Stats ────────────────────────────────────
router.get('/accuracy', protect, requireMongo, async (req, res, next) => {
  try {
    const accData = await PredictionAccuracy.findOne().sort({ lastCalculated: -1 }).lean();
    if (!accData) {
      return res.json({ success: true, data: { overallAccuracy: 0, totalPredictions: 0, correctPredictions: 0, incorrectPredictions: 0 } });
    }
    res.json({ success: true, data: accData });
  } catch (e) { next(e); }
});

// ─── History ──────────────────────────────────────────────────────
router.get('/history', protect, requirePremium, async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, count: 0, total: 0, page: 1, pages: 0, data: [] });
    }
    const userId = req.user?._id?.toString() || req.user?.id?.toString() || '';
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    // Non-ObjectId users (demo / mock UUID) can't be queried in MongoDB — return empty gracefully
    if (!userId || !isValidObjectId) {
      return res.json({ success: true, count: 0, total: 0, page: 1, pages: 0, data: [] });
    }
    const rawPage = parseInt(req.query.page, 10);
    const rawLimit = parseInt(req.query.limit, 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
    const skip = (page - 1) * limit;
    const predictions = await PredictionHistory.find({ user: userId })
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await PredictionHistory.countDocuments({ user: userId });
    res.json({ success: true, count: predictions.length, total, page, pages: Math.ceil(total / limit), data: predictions });
  } catch (e) { next(e); }
});

router.get('/history/:id', protect, requirePremium, requireMongo, async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id?.toString() || '';
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (!userId || !isValidObjectId) {
      return res.status(404).json({ success: false, message: 'Prediction not found.' });
    }
    const prediction = await PredictionHistory.findOne({ _id: req.params.id, user: userId }).lean();
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found.' });
    res.json({ success: true, data: prediction });
  } catch (e) { next(e); }
});

router.delete('/history/:id', protect, requirePremium, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'MongoDB required.' });
    const userId = req.user?._id?.toString() || req.user?.id?.toString() || '';
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (!userId || !isValidObjectId) {
      return res.status(404).json({ success: false, message: 'Prediction not found.' });
    }
    const result = await PredictionHistory.deleteOne({ _id: req.params.id, user: userId });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Prediction not found.' });
    res.json({ success: true, message: 'Prediction deleted.' });
  } catch (e) { next(e); }
});

// ─── Reference Data ───────────────────────────────────────────────
router.get('/years', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.json({ success: true, data: [] });
    const years = await GateYear.find({ isPublished: true }).sort({ year: -1 }).lean();
    res.json({ success: true, data: years });
  } catch (e) { next(e); }
});

router.get('/colleges', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.json({ success: true, data: [] });
    const { type, state, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (state) filter.state = state;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const colleges = await CollegeProgram.find(filter).sort({ nirfRanking: 1 }).lean();
    res.json({ success: true, count: colleges.length, data: colleges });
  } catch (e) { next(e); }
});

router.get('/psus', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.json({ success: true, data: [] });
    const { year, category, paper } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (category) filter.category = category;
    if (paper) filter.paper = paper;
    const psus = await PsuRequirement.find(filter).sort({ cutoffScore: -1 }).lean();
    res.json({ success: true, count: psus.length, data: psus });
  } catch (e) { next(e); }
});

router.get('/stats', protect, requireMongo, async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id?.toString() || '';
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    const [gateYears, gateCutoffs, ccmtEntries, coapEntries, seatEntries, branchEntries, historyCount] = await Promise.all([
      GateYear.countDocuments(), GateCutoff.countDocuments(), CcmtCutoff.countDocuments(),
      CoapCutoff.countDocuments(), SeatMatrix.countDocuments(), BranchStatistics.countDocuments(),
      isValidObjectId ? PredictionHistory.countDocuments({ user: userId }) : Promise.resolve(0),
    ]);
    const accData = await PredictionAccuracy.findOne().sort({ lastCalculated: -1 }).lean();
    const latestYear = await GateYear.findOne().sort({ year: -1 }).lean();
    res.json({
      success: true,
      data: {
        gateYears, gateCutoffs, ccmtEntries, coapEntries, seatEntries, branchEntries,
        myPredictions: historyCount,
        predictionAccuracy: accData?.overallAccuracy || 0,
        latestYear: latestYear?.year || null,
        totalDataPoints: gateCutoffs + ccmtEntries + coapEntries + seatEntries + branchEntries,
      },
    });
  } catch (e) { next(e); }
});

// ─── Choice Filling Order ──────────────────────────────────────────
router.post('/choice-order', protect, requirePremium, async (req, res, next) => {
  try {
    const { opportunities, preferredState, collegeType } = req.body;
    if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) {
      return res.status(400).json({ success: false, message: 'opportunities array required' });
    }

    let list = [...opportunities];
    if (preferredState) list = list.filter(o => o.state === preferredState || o.state === '');
    if (collegeType && collegeType !== 'Any') list = list.filter(o => o.collegeType === collegeType);

    // Score-based ranking: probability DESC, then tier ASC, then placement DESC, then fee ASC
    const scoreMap = { IIT: 100, NIT: 70, IIIT: 50, GFTI: 30 };
    list.sort((a, b) => {
      const probDiff = (b.probability || 0) - (a.probability || 0);
      if (Math.abs(probDiff) > 10) return probDiff;
      const tierA = a.tier || 3;
      const tierB = b.tier || 3;
      if (tierA !== tierB) return tierA - tierB;
      const typeA = scoreMap[a.collegeType] || 0;
      const typeB = scoreMap[b.collegeType] || 0;
      if (typeA !== typeB) return typeB - typeA;
      return (b.avgPlacement || 0) - (a.avgPlacement || 0);
    });

    const ranked = list.map((o, i) => ({
      rank: i + 1,
      college: o.college,
      program: o.program,
      collegeType: o.collegeType,
      tier: o.tier,
      probability: o.probability,
      closingScore: o.closingScore,
      avgPlacement: o.avgPlacement,
      fees: o.fees,
      state: o.location,
    }));

    res.json({ success: true, data: { ranked, total: ranked.length } });
  } catch (e) { next(e); }
});

// ─── College Comparison ────────────────────────────────────────────
router.post('/compare', protect, requirePremium, async (req, res, next) => {
  try {
    const { colleges } = req.body;
    if (!colleges || !Array.isArray(colleges) || colleges.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 college names required' });
    }
    const programs = await CollegeProgram.find({ name: { $in: colleges }, isActive: true }).lean();
    const map = {};
    for (const p of programs) map[p.name] = p;
    const result = colleges.filter(n => map[n]).map(n => ({
      name: map[n].name,
      shortName: map[n].shortName,
      type: map[n].type,
      tier: map[n].tier,
      location: map[n].location,
      state: map[n].state,
      website: map[n].website,
      nirfRanking: map[n].nirfRanking,
      avgPlacement: map[n].avgPlacement,
      highestPlacement: map[n].highestPlacement,
      medianPlacement: map[n].medianPlacement,
      placementPercentage: map[n].placementPercentage,
      topRecruiters: (map[n].topRecruiters || []).slice(0, 5),
      fees: map[n].fees,
      hostelFee: map[n].hostelFee,
      totalCost: map[n].totalCost,
      roiScore: map[n].roiScore,
      duration: map[n].duration,
      intake: map[n].intake,
      acceptedPapers: map[n].acceptedPapers,
      researchAreas: (map[n].researchAreas || []).slice(0, 5),
      academicsRating: map[n].academicsRating,
      placementsRating: map[n].placementsRating,
      researchRating: map[n].researchRating,
      campusRating: map[n].campusRating,
      roiRating: map[n].roiRating,
    }));
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// ─── Predictor Unlock Status ────────────────────────────────────────
router.get('/unlock-status', protect, async (req, res, next) => {
  try {
    const { bypassPredictorLimits } = require('../utils/permissions');
    if (bypassPredictorLimits(req.user)) {
      return res.json({ success: true, data: { isUnlocked: true, referralCount: 0, targetReferrals: 2 } });
    }
    const userId = req.user?._id?.toString() || '';
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    // When mock auth is enabled (MongoDB disconnected for mock users), check the user's in-memory premium status
    if (isMockAuthEnabled()) {
      const mockStore = require('../store/mockStore');
      const u = mockStore.findById(userId);
      const isPremium = req.user?.isPremium === true || req.user?.premiumUnlockedViaReferral === true;
      const testUses = u?.nexaPredictorTestUses || 0;
      const testingUnlocked = testUses < TESTING_PREDICT_LIMIT;
      return res.json({
        success: true,
        data: {
          isUnlocked: isPremium || testingUnlocked,
          referralCount: 0,
          targetReferrals: 2,
          testingAccess: true,
          testingLimit: TESTING_PREDICT_LIMIT,
          testingUsed: testUses,
          testingRemaining: Math.max(0, TESTING_PREDICT_LIMIT - testUses),
          isPremium,
        },
      });
    }
    let isUnlocked = false;
    let referralCount = 0;
    let isPremium = false;
    let testUses = 0;
    if (isMongoConnected() && isValidObjectId) {
      try {
        const user = await User.findById(userId).select('isPremium premiumUnlockedViaReferral referralCount nexaPredictorTestUses').lean();
        if (user) {
          if (user.isPremium || user.premiumUnlockedViaReferral) {
            isUnlocked = true;
            isPremium = true;
          }
          referralCount = user.referralCount || 0;
          testUses = user.nexaPredictorTestUses || 0;
          const testingUnlocked = testUses < TESTING_PREDICT_LIMIT;
          if (testingUnlocked) isUnlocked = true;
        }
      } catch (dbErr) {}
    }
    res.json({
      success: true,
      data: {
        isUnlocked,
        referralCount,
        targetReferrals: 2,
        testingAccess: true,
        testingLimit: TESTING_PREDICT_LIMIT,
        testingUsed: testUses,
        testingRemaining: Math.max(0, TESTING_PREDICT_LIMIT - testUses),
        isPremium,
      },
    });
  } catch (e) { next(e); }
});

// ─── College Details ───────────────────────────────────────────────
router.get('/college/:id', protect, requirePremium, async (req, res, next) => {
  try {
    const program = await CollegeProgram.findById(req.params.id).lean();
    if (!program) return res.status(404).json({ success: false, message: 'College not found' });
    res.json({ success: true, data: program });
  } catch (e) { next(e); }
});

module.exports = router;
