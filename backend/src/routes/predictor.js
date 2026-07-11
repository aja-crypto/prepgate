const router = require('express').Router();
const { protect } = require('../middleware/auth');
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

const predictLimiter = new Map();
const PREDICT_LIMIT = 10; // max requests per window
const PREDICT_WINDOW = 60000; // 1 minute

function predictRateLimit(req, res, next) {
  const userId = req.user?._id?.toString() || req.ip || 'anonymous';
  const now = Date.now();
  const record = predictLimiter.get(userId) || { count: 0, resetAt: now + PREDICT_WINDOW };
  if (now > record.resetAt) { record.count = 0; record.resetAt = now + PREDICT_WINDOW; }
  record.count++;
  predictLimiter.set(userId, record);
  if (record.count > PREDICT_LIMIT) {
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
    return res.status(503).json({ success: false, message: 'Predictor requires MongoDB. Connect to database.' });
  }
  next();
}

// ─── Main Prediction ──────────────────────────────────────────────
router.post('/predict', protect, predictRateLimit, requireMongo, validateFields([
  { name: 'expectedMarks', type: 'number', required: true, min: 0, max: 100 },
  { name: 'category', type: 'string', required: true },
]), async (req, res, next) => {
  const routeStart = Date.now();
  const timingMarks = [];
  try {
    const {
      expectedMarks, category, paper = 'CS', admissionType = 'M.Tech',
      preferredState = '', collegeType = 'Any', preferredProgram = '',
      name = '', attemptNumber = 1, targetYear = null,
      mockAverage = null, preparationLevel = null,
    } = req.body;

    // Check cache (same input params = same prediction)
    const cacheKey = `predict:${expectedMarks}:${category}:${paper}:${admissionType}:${collegeType}:${preferredState}`;
    const CACHE_TTL_MINUTES = 360;
    console.log('[Predictor] mongoConnected:', isMongoConnected(), 'mockAuth:', isMockAuthEnabled());
    if (isMongoConnected() && !isMockAuthEnabled()) {
      const cached = await PredictionCache.findOne({ cacheKey, expiresAt: { $gt: new Date() } }).lean();
      if (cached) {
        console.log('[Predictor] Cache HIT');
        await PredictionCache.updateOne({ _id: cached._id }, { $inc: { hitCount: 1 } });
        return res.json({ success: true, data: { ...cached.output, cached: true } });
      }
      console.log('[Predictor] Cache MISS');
    }

    timingMarks.push('pre-predict');
    const predictStart = Date.now();
    const result = await predict({
      expectedMarks, category, paper, admissionType,
      preferredState, collegeType, preferredProgram,
      attemptNumber, targetYear, mockAverage, preparationLevel,
    });
    const predictTime = Date.now() - predictStart;
    timingMarks.push('post-predict');

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
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
      const userId = req.user?._id?.toString() || '';
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
      if (isValidObjectId) {
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
      console.warn('Failed to save prediction history:', e.message);
    }

    // Map 5-tier college lists → flat opportunities array
    const opportunityFromCollege = (c, path, baseYear) => ({
      college: c.institute, program: c.program, specialization: c.specialization || '',
      path, collegeType: c.instituteType, tier: c.tier || null, location: c.state || '',
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

    const totalTime = Date.now() - routeStart;
    console.log(`[Predictor] marks=${expectedMarks} cat=${category} predict=${predictTime}ms total=${totalTime}ms opps=${opportunities.length} cached=${!!result.cached}`);
    console.log('[Predictor] instituteType breakdown:', JSON.stringify(
      [...new Set(opportunities.map(o => o.collegeType))].map(t => ({
        type: t,
        count: opportunities.filter(o => o.collegeType === t).length,
      }))
    ));
    const responseData = { 
      baseYear: result.baseYear, 
      predictedScore: result.predictedScore, 
      predictedRank: result.predictedRank, 
      predictedPercentile: result.predictedPercentile, 
      airRange: result.airRange, 
      isQualified: result.isQualified,
      qualifyingCutoff: result.qualifyingCutoff,
      confidence: result.confidence,
      confidenceScore: result.confidenceScore,
      totalDataPoints: result.totalDataPoints,
      totalOpportunities: result.totalOpportunities,
      totalIITs: result.totalIITs,
      totalNITs: result.totalNITs,
      totalIIITs: result.totalIIITs,
      totalGFTIs: result.totalGFTIs,
      totalPrivate: result.totalPrivate,
      totalIISc: result.totalIISc,
      totalIIEST: result.totalIIEST,
      totalOther: result.totalOther,
      databaseCoverage: result.databaseCoverage,
      eligibleIITs: result.eligibleIITs,
      eligibleNITs: result.eligibleNITs,
      eligibleIIITs: result.eligibleIIITs,
      eligibleGFTIs: result.eligibleGFTIs,
      eligibleIISc: result.eligibleIISc,
      eligibleIIEST: result.eligibleIIEST,
      opportunities, 
      aiReport,
      recommendations: result.recommendations || [],
      historyId: historyEntry?._id || null,
      profile: { predictMs: predictTime, totalMs: totalTime },
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
      } : {})
    };

    // Store in cache (non-blocking)
    if (isMongoConnected()) {
      PredictionCache.findOneAndUpdate(
        { cacheKey },
        { cacheKey, input: req.body, output: responseData, expiresAt: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000) },
        { upsert: true, new: false }
      ).catch(() => {});
    }

    res.json({ success: true, data: responseData });
  } catch (e) { next(e); }
});

// ─── What-If Analysis ─────────────────────────────────────────────
router.post('/what-if', protect, requireMongo, validateFields([
  { name: 'historyId', type: 'string', required: true },
  { name: 'marksDelta', type: 'number', required: true },
]), async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || '';
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (!isValidObjectId) return res.status(400).json({ success: false, message: 'User not found.' });
    const history = await PredictionHistory.findOne({ _id: req.body.historyId, user: userId });
    if (!history) return res.status(404).json({ success: false, message: 'Prediction not found.' });

    const scenario = whatIf(history.output, req.body.marksDelta);
    if (!scenario) return res.status(400).json({ success: false, message: 'Cannot compute what-if.' });

    const ccmtCutoffs = await CcmtCutoff.find({ year: history.year, category: history.input.category || 'General' });
    const opportunities = ccmtCutoffs.filter(c => (scenario.adjustedScore || 0) >= (c.closingScore || 0));

    res.json({
      success: true,
      data: { ...scenario, opportunities: opportunities.length },
    });
  } catch (e) { next(e); }
});

// ─── Cutoff Trends ────────────────────────────────────────────────
router.get('/trends/:institute/:program', protect, requireMongo, async (req, res, next) => {
  try {
    const { institute, program } = req.params;
    const { category = 'General' } = req.query;
    const cutoffs = await CcmtCutoff.find({ institute, program, category }).sort({ year: 1 });
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
router.get('/ccmt', protect, requireMongo, async (req, res, next) => {
  try {
    const { year, category, instituteType, state, program, round } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (category) filter.category = category;
    if (instituteType) filter.instituteType = instituteType;
    if (state) filter.state = state;
    if (program) filter.program = { $regex: program, $options: 'i' };
    if (round) filter.round = parseInt(round);
    const data = await CcmtCutoff.find(filter).sort({ closingScore: -1 }).limit(500);
    res.json({ success: true, count: data.length, data });
  } catch (e) { next(e); }
});

// ─── COAP Data Query ──────────────────────────────────────────────
router.get('/coap', protect, requireMongo, async (req, res, next) => {
  try {
    const { year, category, institute } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (category) filter.category = category;
    if (institute) filter.institute = { $regex: institute, $options: 'i' };
    const data = await CoapCutoff.find(filter).sort({ offerRound: 1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) { next(e); }
});

// ─── Seat Matrix Query ────────────────────────────────────────────
router.get('/seats', protect, requireMongo, async (req, res, next) => {
  try {
    const { year, institute, program } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (institute) filter.institute = { $regex: institute, $options: 'i' };
    if (program) filter.program = { $regex: program, $options: 'i' };
    const data = await SeatMatrix.find(filter).sort({ year: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) { next(e); }
});

// ─── Prediction Validation ────────────────────────────────────────
router.post('/validate', protect, requireMongo, validateFields([
  { name: 'predictionId', type: 'string', required: true },
  { name: 'isCorrect', type: 'boolean', required: true },
]), async (req, res, next) => {
  try {
    const { predictionId, isCorrect, actualRank, actualScore, actualCollege, actualProgram, feedbackText } = req.body;

    const prediction = await PredictionHistory.findOne({ _id: predictionId, user: req.user._id });
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
      overallAccuracy: accuracy,
      totalPredictions: total,
      correctPredictions: correct,
      incorrectPredictions: incorrect,
      lastCalculated: new Date(),
    }, { upsert: true });

    res.json({ success: true, accuracy, total, correct, incorrect });
  } catch (e) { next(e); }
});

// ─── Prediction Accuracy Stats ────────────────────────────────────
router.get('/accuracy', protect, requireMongo, async (req, res, next) => {
  try {
    const accData = await PredictionAccuracy.findOne().sort({ lastCalculated: -1 });
    if (!accData) {
      return res.json({ success: true, data: { overallAccuracy: 0, totalPredictions: 0, correctPredictions: 0, incorrectPredictions: 0 } });
    }
    res.json({ success: true, data: accData });
  } catch (e) { next(e); }
});

// ─── History ──────────────────────────────────────────────────────
router.get('/history', protect, requireMongo, async (req, res, next) => {
  try {
    // Skip MongoDB query for mock (UUID-based) users that can't cast to ObjectId
    if (typeof req.user._id === 'string' && req.user._id.includes('-')) {
      return res.json({ success: true, count: 0, total: 0, page: 1, pages: 0, data: [] });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const predictions = await PredictionHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await PredictionHistory.countDocuments({ user: req.user._id });
    res.json({ success: true, count: predictions.length, total, page, pages: Math.ceil(total / limit), data: predictions });
  } catch (e) { next(e); }
});

router.get('/history/:id', protect, requireMongo, async (req, res, next) => {
  try {
    if (typeof req.user._id === 'string' && req.user._id.includes('-')) {
      return res.status(404).json({ success: false, message: 'Prediction not found.' });
    }
    const prediction = await PredictionHistory.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found.' });
    res.json({ success: true, data: prediction });
  } catch (e) { next(e); }
});

router.delete('/history/:id', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ success: false, message: 'MongoDB required.' });
    if (typeof req.user._id === 'string' && req.user._id.includes('-')) {
      return res.status(404).json({ success: false, message: 'Prediction not found.' });
    }
    const result = await PredictionHistory.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Prediction not found.' });
    res.json({ success: true, message: 'Prediction deleted.' });
  } catch (e) { next(e); }
});

// ─── Reference Data ───────────────────────────────────────────────
router.get('/years', protect, async (req, res, next) => {
  try {
    if (!isMongoConnected()) return res.json({ success: true, data: [] });
    const years = await GateYear.find({ isPublished: true }).sort({ year: -1 });
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
    const colleges = await CollegeProgram.find(filter).sort({ nirfRanking: 1 });
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
    const psus = await PsuRequirement.find(filter).sort({ cutoffScore: -1 });
    res.json({ success: true, count: psus.length, data: psus });
  } catch (e) { next(e); }
});

router.get('/stats', protect, requireMongo, async (req, res, next) => {
  try {
    const [gateYears, gateCutoffs, ccmtEntries, coapEntries, seatEntries, branchEntries, historyCount] = await Promise.all([
      GateYear.countDocuments(), GateCutoff.countDocuments(), CcmtCutoff.countDocuments(),
      CoapCutoff.countDocuments(), SeatMatrix.countDocuments(), BranchStatistics.countDocuments(),
      PredictionHistory.countDocuments({ user: req.user._id }),
    ]);
    const accData = await PredictionAccuracy.findOne().sort({ lastCalculated: -1 });
    const latestYear = await GateYear.findOne().sort({ year: -1 });
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
router.post('/choice-order', protect, async (req, res, next) => {
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
router.post('/compare', protect, async (req, res, next) => {
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
    let isUnlocked = true;
    let referralCount = 0;
    const userId = req.user?._id?.toString() || '';
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (isMongoConnected() && isValidObjectId) {
      try {
        const user = await User.findById(userId).select('isPremium premiumUnlockedViaReferral referralCount').lean();
        if (user) {
          if (user.isPremium || user.premiumUnlockedViaReferral) isUnlocked = true;
          referralCount = user.referralCount || 0;
        }
      } catch (dbErr) {}
    }
    res.json({ success: true, data: { isUnlocked, referralCount, targetReferrals: 2 } });
  } catch (e) { next(e); }
});

// ─── College Details ───────────────────────────────────────────────
router.get('/college/:id', protect, async (req, res, next) => {
  try {
    const program = await CollegeProgram.findById(req.params.id).lean();
    if (!program) return res.status(404).json({ success: false, message: 'College not found' });
    res.json({ success: true, data: program });
  } catch (e) { next(e); }
});

module.exports = router;
