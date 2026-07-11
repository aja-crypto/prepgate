const CcmtCutoff = require('../models/CcmtCutoff');
const CoapCutoff = require('../models/CoapCutoff');
const SeatMatrix = require('../models/SeatMatrix');
const BranchStatistics = require('../models/BranchStatistics');
const CollegeProgram = require('../models/CollegeProgram');
const GateMarksScore = require('../models/GateMarksScore');
const GateScoreRank = require('../models/GateScoreRank');
const GateRankData = require('../models/GateRankData');
const GateRankPercentile = require('../models/GateRankPercentile');
const GateStatistics = require('../models/GateStatistics');

const crypto = require('crypto');

/**
 * Normalize institute names to ensure consistency
 */
function normalizeInstituteName(rawName) {
  if (!rawName) return '';
  return rawName
    .replace(/^Indian Institute of Technology\s+/, '')
    .replace(/^IIIT\s+/, '')
    .replace(/^NIT\s+/i, '')
    .replace(/^GFTI\s+/i, '')
    .replace(/^Public Sector\s+/i, '')
    .replace(/^Institute of Technology\s+/i, '')
    .replace(/\s+(University|Puneet|College)$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize program names for matching
 */
function normalizeProgramName(programName) {
  if (!programName) return '';
  return programName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build unique institute program map
 * Cached in-memory for 5 minutes; data sources change rarely.
 */
let _instituteMapCache = null;
let _instituteMapCacheAt = 0;
const _instituteMapCacheTTL = 5 * 60 * 1000; // 5 minutes

/**
 * P0: cache `buildInstituteProgramMap` for 5 minutes
 * to avoid full scans of CcmtCutoff/CoapCutoff/SeatMatrix on every prediction.
 * Cache invalidates automatically when TTL expires.
 */
function invalidateInstituteMapCache() {
  _instituteMapCache = null;
  _instituteMapCacheAt = 0;
}

async function buildInstituteProgramMap() {
  const now = Date.now();
  if (_instituteMapCache && (now - _instituteMapCacheAt) < _instituteMapCacheTTL) {
    return _instituteMapCache;
  }

  const [ccmtCutoffs, coapCutoffs, seatData, collegePrograms] = await Promise.all([
    CcmtCutoff.find({}).lean(),
    CoapCutoff.find({}).lean(),
    SeatMatrix.find({}).lean(),
    CollegeProgram.find({ isActive: true }).lean(),
  ]);

  const instituteMap = new Map();
  const programMap = new Map();
  const programSet = new Set();

  for (const cc of ccmtCutoffs) {
    const instName = normalizeInstituteName(cc.institute);
    const progName = normalizeProgramName(cc.program);

    if (!instituteMap.has(instName)) instituteMap.set(instName, new Set());
    if (!programMap.has(progName)) programMap.set(progName, new Set());

    instituteMap.get(instName).add(progName);
    programMap.get(progName).add(instName);
    programSet.add(`${instName}|${progName}`);
  }

  for (const cp of collegePrograms) {
    const instName = normalizeInstituteName(cp.name || cp.shortName || '');
    if (!instName) continue;

    if (!instituteMap.has(instName)) instituteMap.set(instName, new Set());
    instituteMap.get(instName).add('(meta)');
  }

  _instituteMapCache = {
    instituteMap,
    programMap,
    programSet,
    collegePrograms,
    ccmtCutoffs,
    coapCutoffs,
    seatData,
  };
  _instituteMapCacheAt = now;

  return _instituteMapCache;
}

/**
 * Enhanced probability calculation using multi-factor confidence model
 * Returns { score: 0-98, confidence: 'Very High'|'High'|'Good'|'Competitive'|'Dream'|'Reach', reasons: [] }
 */
function calcEnhancedProbability(userScore, closingScore, openingScore, trend, competitionLevel, programPopularity, year, seats) {
  if (!closingScore) return { score: 0, confidence: 'Reach', reasons: ['Insufficient cutoff data'] };

  // Factor 1: Score Difference (70% weight) — wider range for more granularity
  const diff = userScore - closingScore;
  // Formula: base 50 at diff=0, ± ~0.5 per point of diff, capped at 0-100
  // This gives meaningful distinctions: +50 → 75, +100 → 100, -50 → 25, -100 → 0
  const scoreDiffScore = Math.min(100, Math.max(0, Math.round(diff * 0.5 + 50)));

  // Factor 2: Cutoff Stability (10% weight)
  let stabilityScore = 50;
  if (trend?.years?.length >= 3) {
    const scores = trend.years.map(y => y.closingScore).filter(s => s != null);
    if (scores.length >= 3) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avg;
      if (cv < 0.02) stabilityScore = 95;
      else if (cv < 0.05) stabilityScore = 80;
      else if (cv < 0.10) stabilityScore = 60;
      else if (cv < 0.20) stabilityScore = 35;
      else stabilityScore = 15;
    }
  }

  // Factor 3: Seat Availability (5% weight)
  let seatScore = 50;
  if (seats != null) {
    if (seats >= 60) seatScore = 90;
    else if (seats >= 30) seatScore = 75;
    else if (seats >= 15) seatScore = 60;
    else if (seats >= 5) seatScore = 40;
    else seatScore = 20;
  }

  // Factor 4: Counselling Round (5% weight)
  let roundScore = 70;
  const currentYear = new Date().getFullYear();
  if (year < currentYear) roundScore = 85;

  // Factor 5: Competition Level (5% weight)
  let demandScore = 50;
  if (competitionLevel === 'Very High') demandScore = 20;
  else if (competitionLevel === 'High') demandScore = 35;
  else if (competitionLevel === 'Medium') demandScore = 55;
  else if (competitionLevel === 'Low') demandScore = 75;

  // Factor 6: Trend Direction (5% weight)
  let trendScore = 50;
  if (trend?.trendDirection === 'Falling') trendScore = 80;
  else if (trend?.trendDirection === 'Stable') trendScore = 60;
  else if (trend?.trendDirection === 'Rising') trendScore = 30;

  // Weighted combination
  const finalScore = Math.round(
    0.70 * scoreDiffScore +
    0.10 * stabilityScore +
    0.05 * seatScore +
    0.05 * roundScore +
    0.05 * demandScore +
    0.05 * trendScore
  );

  // No artificial cap — let the score vary naturally between 0-100
  // High-scoring users will see 90-100 for colleges they exceed
  // Low-scoring users will see 0-40 for reach colleges
  const probabilityScore = Math.max(0, Math.min(100, finalScore));

  // Confidence label using the user's specified ranges
  let confidence;
  if (probabilityScore >= 90) confidence = 'Safe';
  else if (probabilityScore >= 70) confidence = 'High Chance';
  else if (probabilityScore >= 40) confidence = 'Moderate';
  else if (probabilityScore >= 15) confidence = 'Ambitious';
  else confidence = 'Dream';

  // Generate reasons
  const reasons = [];
  if (diff > 0) {
    reasons.push(`Your score (${Math.round(userScore)}) is ${Math.round(Math.abs(diff))} points above the ${year} closing score (${Math.round(closingScore)})`);
  } else if (diff === 0) {
    reasons.push(`Your score (${Math.round(userScore)}) matches the ${year} closing score (${Math.round(closingScore)})`);
  } else {
    reasons.push(`Your score (${Math.round(userScore)}) is ${Math.round(Math.abs(diff))} points below the ${year} closing score (${Math.round(closingScore)})`);
  }
  if (stabilityScore >= 80) reasons.push(`Cutoffs have been stable over recent years (${stabilityScore}% stability)`);
  else if (stabilityScore <= 35) reasons.push(`Cutoffs show high volatility — admission confidence reduced`);
  if (trend?.trendDirection === 'Falling') reasons.push(`Cutoff trend is falling, improving your chances`);
  else if (trend?.trendDirection === 'Rising') reasons.push(`Cutoff trend is rising, increasing competition`);
  if (seats != null && seats >= 30) reasons.push(`Large seat availability (${seats} seats)`);
  if (competitionLevel === 'Low') reasons.push(`Lower competition level`);

  return { score: probabilityScore, confidence, reasons };
}

/**
 * AI Trend Analysis using multi-year data
 */
async function analyzeInstituteProgramTrends(institute, program, category, maxYears = 6) {
  const cutoffs = await CcmtCutoff.find({ institute, program, category }).sort({ year: -1 }).limit(maxYears);
  if (!cutoffs || cutoffs.length < 2) return null;

  cutoffs.sort((a, b) => a.year - b.year);
  const scores = cutoffs.map(c => c.closingScore).filter(s => s != null);
  const openings = cutoffs.map(c => c.openingScore).filter(s => s != null);

  if (scores.length < 2) return null;

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const yearRange = cutoffs[cutoffs.length - 1].year - cutoffs[0].year;

  // Trend calculation
  const recent3 = scores.slice(-3);
  const older = scores.slice(0, scores.length - 3);
  const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const shortTrend = recentAvg - olderAvg;
  const longTrend = scores[scores.length - 1] - scores[0];

  // Competition analysis using seat matrix and trend volatility
  const seatData = await SeatMatrix.findOne({ institute, program });
  const competitionLevel = (seatData?.totalSeats || 100) <= 30 ? 'High' :
                            (seatData?.totalSeats || 100) >= 100 ? 'Low' : 'Medium';

  // Program popularity based on year-over-year occurrences
  const popularityScore = Math.min(100, scores.length * 15);
  const programPopularity = popularityScore >= 75 ? 'Very High' : popularityScore >= 45 ? 'High' : popularityScore >= 25 ? 'Medium' : 'Low';

  return {
    years: cutoffs.map(c => ({ year: c.year, closingScore: c.closingScore, openingScore: c.openingScore, round: c.round })),
    averageScore: Number(avgScore.toFixed(1)),
    minScore: Number(minScore.toFixed(1)),
    maxScore: Number(maxScore.toFixed(1)),
    shortTrend: Number(shortTrend.toFixed(1)),
    longTrend: Number(longTrend.toFixed(1)),
    volatility: Number((maxScore - minScore).toFixed(1)),
    competitionLevel,
    programPopularity,
    trendDirection: shortTrend > 0.3 ? 'Rising' : shortTrend < -0.3 ? 'Falling' : 'Stable',
    trendConfidence: yearRange >= 4 ? 'High' : yearRange >= 3 ? 'Medium' : 'Low',
  };
}

/**
 * Batch trend analysis — fetches all cutoff + seat data ONCE,
 * then computes trends for every (institute, program, category) combination in memory.
 * Replaces O(N) DB queries from `analyzeInstituteProgramTrends` in a hot loop with O(1) lookups.
 *
 * @param {Array} filteredCcmt - the cutoffs to derive trends for
 * @param {string} category - the user's category filter
 * @param {number} maxYears - max years of history to consider
 * @returns {Map<string, object>} - keyed by `${institute}|${program}|${category}` (normalized)
 */
async function batchAnalyseTrends(filteredCcmt, category, maxYears = 6) {
  const institutes = new Set();
  const programs = new Set();
  for (const cc of filteredCcmt) {
    institutes.add(cc.institute);
    programs.add(cc.program);
  }
  const instArr = Array.from(institutes);
  const progArr = Array.from(programs);

  // Single fetches for all data we need
  const [allCutoffs, allSeats] = await Promise.all([
    CcmtCutoff.find({
      category,
      institute: { $in: instArr },
      program: { $in: progArr },
    })
      .sort({ year: -1 })
      .limit(maxYears * 1000) // safety cap; real data is bounded
      .lean(),
    SeatMatrix.find({
      institute: { $in: instArr },
      program: { $in: progArr },
    })
      .lean(),
  ]);

  // Index seats by institute+program
  const seatsByInstProg = new Map();
  for (const s of allSeats) {
    seatsByInstProg.set(`${s.institute}|${s.program}`, s);
  }

  // Group cutoffs by (institute, program)
  const grouped = new Map();
  for (const c of allCutoffs) {
    const key = `${c.institute}|${c.program}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(c);
  }

  // Build trend map keyed by `${institute}|${program}|${category}`
  // Also index by normalized institute key as a fallback so lookup via
  // normalized forms still finds it.
  const trendMap = new Map();
  for (const [ipKey, cutoffs] of grouped) {
    if (cutoffs.length < 2) continue;
    const sorted = [...cutoffs].sort((a, b) => a.year - b.year);
    const recent = sorted.slice(-Math.min(3, sorted.length));
    const recentScores = recent.map(c => c.closingScore).filter(s => s != null);
    if (recentScores.length < 2) continue;

    const allScores = sorted.map(c => c.closingScore).filter(s => s != null);
    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const minScore = Math.min(...allScores);
    const maxScore = Math.max(...allScores);
    const yearRange = sorted[sorted.length - 1].year - sorted[0].year;

    const olderArr = sorted.slice(0, Math.max(0, sorted.length - 3));
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderArr.length
      ? olderArr.map(c => c.closingScore).filter(s => s != null).reduce((a, b) => a + b, 0) / Math.max(1, olderArr.length)
      : recentAvg;

    const shortTrend = recentAvg - olderAvg;
    const seatRecord = seatsByInstProg.get(ipKey);
    const totalSeats = seatRecord?.totalSeats || 100;
    const competitionLevel = totalSeats <= 30 ? 'High' : totalSeats >= 100 ? 'Low' : 'Medium';

    const popularityScore = Math.min(100, allScores.length * 15);
    const programPopularity = popularityScore >= 75 ? 'Very High' : popularityScore >= 45 ? 'High' : popularityScore >= 25 ? 'Medium' : 'Low';

    const trend = {
      years: sorted.map(c => ({ year: c.year, closingScore: c.closingScore, openingScore: c.openingScore, round: c.round })),
      averageScore: Number(avgScore.toFixed(1)),
      minScore: Number(minScore.toFixed(1)),
      maxScore: Number(maxScore.toFixed(1)),
      shortTrend: Number(shortTrend.toFixed(1)),
      longTrend: Number((sorted[sorted.length - 1].closingScore - sorted[0].closingScore).toFixed(1)),
      volatility: Number((maxScore - minScore).toFixed(1)),
      competitionLevel,
      programPopularity,
      trendDirection: shortTrend > 0.3 ? 'Rising' : shortTrend < -0.3 ? 'Falling' : 'Stable',
      trendConfidence: yearRange >= 4 ? 'High' : yearRange >= 3 ? 'Medium' : 'Low',
    };

    trendMap.set(`${ipKey}|${category}`, trend);
    const [firstInst] = ipKey.split('|');
    const normKey = `${normalizeInstituteName(firstInst)}|${category}`;
    trendMap.set(normKey, trend);
  }

  return trendMap;
}

/**
 * Comprehensive AIR Range calculation based on data quality and uncertainty
 */
function calculateAIRRange(baseRank, dataQuality, trend, competition) {
  if (!baseRank || baseRank <= 0) return null;

  // Data quality multipliers — narrower for cleaner data
  const dataQualityFactor = {
    Excellent: { best: 0.85, avg: 1.0, worst: 1.25 },
    Good: { best: 0.78, avg: 1.0, worst: 1.45 },
    Fair: { best: 0.65, avg: 1.0, worst: 1.85 },
    Poor: { best: 0.45, avg: 1.0, worst: 2.5 },
  }[dataQuality] || { best: 0.78, avg: 1.0, worst: 1.45 };

  // Trend stability adjustments
  const trendMultiplier = {
    Rising: { best: 0.92, avg: 1.0, worst: 1.15 },
    Falling: { best: 0.85, avg: 1.0, worst: 1.20 },
    Stable: { best: 0.92, avg: 1.0, worst: 1.20 },
  }[trend?.trendDirection] || { best: 0.92, avg: 1.0, worst: 1.15 };

  // Competition level adjustments
  const compMultiplier = {
    High: { best: 0.95, avg: 1.0, worst: 1.18 },
    Medium: { best: 0.92, avg: 1.0, worst: 1.15 },
    Low: { best: 0.90, avg: 1.0, worst: 1.10 },
  }[trend?.competitionLevel] || { best: 0.92, avg: 1.0, worst: 1.15 };

  // Combined factor = product of all three
  const combinedBest = dataQualityFactor.best * trendMultiplier.best * compMultiplier.best;
  const combinedWorst = dataQualityFactor.worst * trendMultiplier.worst * compMultiplier.worst;

  const bestRank = Math.max(1, Math.round(baseRank * combinedBest));
  const avgRank = Math.max(1, Math.round(baseRank));
  const worstRank = Math.max(avgRank, Math.round(baseRank * combinedWorst));

  // Uncertainty as a percentage (less volatile when data quality is better)
  const uncertainty = Math.max(0, worstRank - bestRank);
  const uncertaintyPct = Math.min(100, Math.round((uncertainty / Math.max(baseRank, 1)) * 100));

  return {
    best: bestRank,
    average: avgRank,
    worst: worstRank,
    uncertainty,
    uncertaintyPct,
    range: `${bestRank}–${worstRank}`,
    confidenceLevel: uncertaintyPct <= 15 ? 'High' : uncertaintyPct <= 35 ? 'Medium' : 'Low',
  };
}

/**
 * Enhanced confidence calculation with multiple data factors
 */
function computeConfidenceWithFactors(totalDataPoints, hasMultiYear, trend, competition, validationAccuracy, seatData, qualifyingScore, userScore) {
  let score = 0;

  // 1. Historical Data Quality (0-30 points)
  if (totalDataPoints >= 500) score += 30;
  else if (totalDataPoints >= 200) score += 24;
  else if (totalDataPoints >= 100) score += 18;
  else if (totalDataPoints >= 50) score += 12;
  else if (totalDataPoints >= 20) score += 6;

  // 2. Trend Stability (0-20 points)
  if (trend?.trendDirection === 'Stable' && trend?.volatility <= 10) score += 20;
  else if (trend?.trendDirection === 'Stable') score += 15;
  else if (trend?.trendConfidence === 'High') score += 12;
  else if (hasMultiYear) score += 8;

  // 3. Seat Availability (0-15 points) — more seats = more reliable prediction
  const totalSeats = seatData || 0;
  if (totalSeats >= 100) score += 15;
  else if (totalSeats >= 50) score += 12;
  else if (totalSeats >= 20) score += 8;
  else if (totalSeats >= 5) score += 4;

  // 4. Prediction Variance (0-20 points) — based on trend volatility
  const volatility = trend?.volatility || 30;
  if (volatility <= 5) score += 20;
  else if (volatility <= 15) score += 15;
  else if (volatility <= 30) score += 10;
  else if (volatility <= 50) score += 5;

  // 5. Distance from Qualification (0-15 points)
  // Near cutoff = higher uncertainty; far from cutoff = more confident
  if (qualifyingScore && userScore != null) {
    const distance = Math.abs(userScore - qualifyingScore);
    if (distance >= 200) score += 15;      // Well above or below cutoff
    else if (distance >= 100) score += 12;
    else if (distance >= 50) score += 8;
    else score += 3;                        // Near cutoff = less certain
  } else {
    score += 8; // Neutral if no cutoff data
  }

  const confidenceScore = Math.min(100, Math.round(score));
  const label = confidenceScore >= 70 ? 'High' : confidenceScore >= 40 ? 'Medium' : 'Low';

  const factors = [];
  if (totalDataPoints >= 100) factors.push(`Strong historical dataset (${totalDataPoints} data points)`);
  else if (totalDataPoints >= 20) factors.push(`Moderate dataset (${totalDataPoints} data points)`);
  else factors.push(`Limited dataset (${totalDataPoints} data points) — predictions less reliable`);

  if (trend?.trendDirection === 'Stable') factors.push('Cutoff trends are stable');
  else if (trend?.trendDirection === 'Falling') factors.push('Falling cutoffs improve your chances');
  else if (trend?.trendDirection === 'Rising') factors.push('Rising cutoffs increase competition');

  if (totalSeats >= 50) factors.push(`${totalSeats}+ seats available — more reliable prediction`);
  else if (totalSeats > 0) factors.push(`Only ${totalSeats} seats — limited availability`);

  if (volatility <= 15) factors.push('Low year-to-year variation in cutoffs');
  else if (volatility > 30) factors.push('High year-to-year variation — less predictable');

  if (qualifyingScore && userScore != null) {
    const distance = userScore - qualifyingScore;
    if (distance >= 200) factors.push('Well above qualifying cutoff');
    else if (distance >= 50) factors.push('Moderately above qualifying cutoff');
    else if (distance >= 0) factors.push('Near qualifying cutoff — margins are thin');
    else factors.push('Below qualifying cutoff — admission unlikely through this route');
  }

  if (validationAccuracy != null) factors.push(`Model accuracy ${Math.round(validationAccuracy * 100)}%`);

  return { label, score: confidenceScore, factors };
}

/**
 * Comprehensive analytics including rankings by various criteria
 */
async function computeAnalytics(colleges, instituteMap, programMap) {
  const analytics = {};

  // Best Placement (highest avgPlacement)
  analytics.bestPlacement = [...colleges].filter(c => c.avgPlacement > 0)
    .sort((a, b) => (b.avgPlacement || 0) - (a.avgPlacement || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.institute,
      program: c.program,
      placement: c.avgPlacement || 0,
      tier: c.tier || null,
      path: c.path,
      probability: c.probability,
    }));

  // Best ROI (highest roiScore)
  analytics.bestROI = [...colleges].filter(c => c.roiScore > 0)
    .sort((a, b) => (b.roiScore || 0) - (a.roiScore || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.institute,
      program: c.program,
      roiScore: c.roiScore || 0,
      avgPlacement: c.avgPlacement || 0,
      fees: c.fees || 0,
      path: c.path,
      probability: c.probability,
    }));

  // Lowest Fees (lowest totalCost)
  analytics.lowestFees = [...colleges].filter(c => c.totalCost > 0)
    .sort((a, b) => (a.totalCost || 0) - (b.totalCost || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.institute,
      program: c.program,
      totalCost: c.totalCost || 0,
      avgPlacement: c.avgPlacement || 0,
      placement: c.avgPlacement || 0,
      path: c.path,
      probability: c.probability,
    }));

  // Best Research (highest researchRating)
  analytics.bestResearch = [...colleges].filter(c => c.researchRating > 0)
    .sort((a, b) => (b.researchRating || 0) - (a.researchRating || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.institute,
      program: c.program,
      researchRating: c.researchRating || 0,
      academicsRating: c.academicsRating || 0,
      campusRating: c.campusRating || 0,
      path: c.path,
      probability: c.probability,
    }));

  // Best AI Programs (CSEE, Data Science, AI)
  analytics.bestAIPrograms = [...colleges].filter(c => ['CSEE', 'Computer Science and Engineering', 'Data Science and Artificial Intelligence', 'Artificial Intelligence', 'Information Technology'].includes(c.program))
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.institute,
      program: c.program,
      probability: c.probability,
      avgPlacement: c.avgPlacement || 0,
      tier: c.tier || null,
      path: c.path,
    }));

  // Fastest Growing Programs (positive trend)
  analytics.fastestGrowing = [...colleges].filter(c => c.trend?.trendDirection === 'Rising')
    .sort((a, b) => (b.trend?.trend || 0) - (a.trend?.trend || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.institute,
      program: c.program,
      trend: c.trend?.trend || 0,
      avgPlacement: c.avgPlacement || 0,
      path: c.path,
      probability: c.probability,
    }));

  // Best Location (top placements per region)
  analytics.bestLocation = {};
  const regions = ['Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata'];
  for (const region of regions) {
    const regionColleges = [...colleges].filter(c => c.state?.toLowerCase().includes(region.toLowerCase()));
    if (regionColleges.length > 0) {
      analytics.bestLocation[region] = {
        colleges: regionColleges.slice(0, 3).map(c => ({
          name: c.institute,
          program: c.program,
          placement: c.avgPlacement || 0,
          probability: c.probability,
        })),
        averagePlacement: Number((regionColleges.reduce((sum, c) => sum + (c.avgPlacement || 0), 0) / regionColleges.length).toFixed(1)),
      };
    }
  }

  // Highest Admission Chance (top probability)
  analytics.highestAdmissionChance = [...colleges]
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.institute,
      program: c.program,
      probability: c.probability,
      tier: c.tier || null,
      location: c.state || '',
      path: c.path,
    }));

  // Institute Categories Count
  analytics.instituteCounts = {
    iit: colleges.filter(c => c.instituteType === 'IIT').length,
    nit: colleges.filter(c => c.instituteType === 'NIT').length,
    iiit: colleges.filter(c => c.instituteType === 'IIIT').length,
    gfti: colleges.filter(c => c.instituteType === 'GFTI').length,
    total: colleges.length,
    programs: colleges.length, // Same count now (no duplicates)
  };

  return analytics;
}

function calcProbability(userScore, closingScore, openingScore, trend) {
  if (!closingScore) return 0;
  if (userScore >= closingScore) {
    const margin = userScore - closingScore;
    const range = openingScore && openingScore > closingScore ? openingScore - closingScore : 20;
    const base = 50 + (margin / range) * 50;
    if (trend && trend.trendDirection === 'Falling') {
      return Math.round(Math.max(0, Math.min(99, base * 1.1)));
    }
    return Math.round(Math.max(0, Math.min(99, base)));
  }
  const gap = closingScore - userScore;
  const range = openingScore && openingScore > closingScore ? openingScore - closingScore : 20;
  let base = Math.max(0, 50 - (gap / range) * 100);
  if (trend && trend.trendDirection === 'Rising') {
    base = Math.round(base * 0.7);
  }
  return Math.round(Math.max(0, Math.min(99, base)));
}

module.exports = {
  normalizeInstituteName,
  normalizeProgramName,
  buildInstituteProgramMap,
  invalidateInstituteMapCache,
  calcEnhancedProbability,
  analyzeInstituteProgramTrends,
  batchAnalyseTrends,
  calculateAIRRange,
  computeConfidenceWithFactors,
  computeAnalytics,
  calcProbability,
};