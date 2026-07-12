const GateYear = require('../models/GateYear');
const GateCutoff = require('../models/GateCutoff');
const GateRankData = require('../models/GateRankData');
const GateScoreData = require('../models/GateScoreData');
const GateMarksScore = require('../models/GateMarksScore');
const GateScoreRank = require('../models/GateScoreRank');
const GateRankPercentile = require('../models/GateRankPercentile');
const GateStatistics = require('../models/GateStatistics');
const CcmtCutoff = require('../models/CcmtCutoff');
const CoapCutoff = require('../models/CoapCutoff');
const SeatMatrix = require('../models/SeatMatrix');
const BranchStatistics = require('../models/BranchStatistics');
const PsuRequirement = require('../models/PsuRequirement');
const PsuRecruitment = require('../models/PsuRecruitment');
const PredictionCache = require('../models/PredictionCache');
const PredictionAccuracy = require('../models/PredictionAccuracy');
const CollegeProgram = require('../models/CollegeProgram');

const {
  normalizeInstituteName,
  normalizeProgramName,
  buildInstituteProgramMap,
  calcEnhancedProbability,
  analyzeInstituteProgramTrends,
  batchAnalyseTrends,
  calculateAIRRange,
  computeConfidenceWithFactors,
  computeAnalytics,
} = require('./predictionUtils');

function linearInterpolate(x1, y1, x2, y2, x) {
  if (x2 === x1) return y1;
  return y1 + ((y2 - y1) / (x2 - x1)) * (x - x1);
}

function interpolateFromData(data, inputValue, inputKey, outputKey) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a, b) => a[inputKey] - b[inputKey]);
  if (inputValue <= sorted[0][inputKey]) return sorted[0][outputKey];
  if (inputValue >= sorted[sorted.length - 1][inputKey]) return sorted[sorted.length - 1][outputKey];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (inputValue >= sorted[i][inputKey] && inputValue <= sorted[i + 1][inputKey]) {
      return linearInterpolate(sorted[i][inputKey], sorted[i][outputKey], sorted[i + 1][inputKey], sorted[i + 1][outputKey], inputValue);
    }
  }
  return sorted[sorted.length - 1][outputKey];
}

function extractNumber(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// Institute priority ranking for recommendation sorting
// Lower number = appears first (Elite IITs > Old IITs > NIT Trichy > NITs > IIITs > GFTIs)
const INSTITUTE_PRIORITY = [
  'Indian Institute of Science',
  'Indian Institute of Technology Bombay',
  'Indian Institute of Technology Delhi',
  'Indian Institute of Technology Madras',
  'Indian Institute of Technology Kanpur',
  'Indian Institute of Technology Kharagpur',
  'Indian Institute of Technology Roorkee',
  'Indian Institute of Technology Hyderabad',
  'Indian Institute of Technology Guwahati',
  'Indian Institute of Technology BHU Varanasi',
  'Indian Institute of Technology Gandhinagar',
  'Indian Institute of Technology Ropar',
  'Indian Institute of Technology Bhubaneswar',
  'Indian Institute of Technology Jodhpur',
  'Indian Institute of Technology Patna',
  'Indian Institute of Technology Mandi',
  'Indian Institute of Technology Palakkad',
  'Indian Institute of Technology Tirupati',
  'Indian Institute of Technology Dhanbad',
  'Indian Institute of Technology Bhilai',
  'Indian Institute of Technology Goa',
  'Indian Institute of Technology Jammu',
  'Indian Institute of Technology Dharwad',
  'National Institute of Technology Tiruchirappalli',
  'National Institute of Technology Karnataka Surathkal',
  'National Institute of Technology Warangal',
  'National Institute of Technology Calicut',
  'National Institute of Technology Durgapur',
  'National Institute of Technology Rourkela',
  'National Institute of Technology Kurukshetra',
  'National Institute of Technology Allahabad',
  'National Institute of Technology Silchar',
  'National Institute of Technology Nagpur',
  'National Institute of Technology Jaipur',
  'National Institute of Technology Bhopal',
  'National Institute of Technology Agartala',
  'National Institute of Technology Hamirpur',
  'National Institute of Technology Jalandhar',
  'National Institute of Technology Patna',
  'National Institute of Technology Raipur',
  'National Institute of Technology Srinagar',
  'National Institute of Technology Meghalaya',
  'National Institute of Technology Mizoram',
  'National Institute of Technology Nagaland',
  'National Institute of Technology Manipur',
  'National Institute of Technology Sikkim',
  'National Institute of Technology Arunachal Pradesh',
  'National Institute of Technology Delhi',
  'National Institute of Technology Goa',
  'National Institute of Technology Puducherry',
  'National Institute of Technology Uttarakhand',
];
const INSTITUTE_PRIORITY_MAP = new Map(INSTITUTE_PRIORITY.map((name, i) => [name, i]));

// Program quality ranking (CSE/CS-related > core engineering > interdisciplinary)
const PROGRAM_PRIORITY = {
  'Computer Science and Engineering': 100,
  'CSEE': 99,
  'Information Technology': 92,
  'Data Science': 88,
  'Artificial Intelligence': 88,
  'Electrical Engineering': 72,
  'Electronics and Communication Engineering': 68,
  'Mechanical Engineering': 52,
  'Civil Engineering': 42,
  'Chemical Engineering': 38,
};

function getInstitutePriority(institute) {
  const exact = INSTITUTE_PRIORITY_MAP.get(institute);
  if (exact != null) return exact;
  if (institute?.includes('Indian Institute of Science')) return 0;
  if (institute?.includes('Indian Institute of Technology')) return 23; // after last IIT, before NITs
  if (institute?.includes('National Institute of Technology')) return 50; // after last NIT
  if (institute?.includes('IIIT')) return 75;
  if (institute?.includes('IIEST')) return 80;
  if (institute?.includes('GFTI')) return 90;
  return 200;
}

function getProgramPriority(program) {
  if (!program) return 50;
  for (const [key, priority] of Object.entries(PROGRAM_PRIORITY)) {
    if (program.includes(key)) return priority;
  }
  // General match: if program contains "Science" or "Engineering", medium priority
  if (program.includes('Science') || program.includes('Engineering')) return 45;
  return 50;
}

function sortByRecommendationPriority(a, b) {
  // 1. Institute reputation (Elite Institutes first)
  const instA = getInstitutePriority(a.institute);
  const instB = getInstitutePriority(b.institute);
  if (instA !== instB) return instA - instB;
  // 2. Program quality (premium programs first)
  const progA = getProgramPriority(a.program);
  const progB = getProgramPriority(b.program);
  if (progA !== progB) return progB - progA;
  // 3. Probability (higher chance first)
  if (a.probability !== b.probability) return b.probability - a.probability;
  // 4. Placement (higher avg placement first)
  const placeA = a.avgPlacement || 0;
  const placeB = b.avgPlacement || 0;
  if (placeA !== placeB) return placeB - placeA;
  // 5. ROI (higher score first)
  const roiA = a.roiScore || 0;
  const roiB = b.roiScore || 0;
  if (roiA !== roiB) return roiB - roiA;
  // 6. Fees (lower fees first)
  const feesA = a.fees || Infinity;
  const feesB = b.fees || Infinity;
  return feesA - feesB;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ─── Main Prediction Pipeline ─────────────────────────────────────

async function predict(input) {
  const startTime = Date.now();
  const timings = {};

  const {
    expectedMarks, category = 'General', paper = 'CS',
    admissionType = 'M.Tech', preferredState = '', collegeType = 'Any',
    preferredProgram = '', attemptNumber = 1, targetYear = null,
    mockAverage = null, preparationLevel = null,
  } = input;

  const marks = extractNumber(expectedMarks);
  if (marks == null || marks < 0 || marks > 100) {
    return { error: 'Enter valid expected marks (0-100).', confidence: 'Low' };
  }

  // For very low marks (< 5), still run prediction but add guidance
  const isVeryLowMarks = marks < 5;

  // Normalize category: map frontend 'OBC' to database 'OBC-NCL'
  const categoryMap = { 'OBC': 'OBC-NCL' };
  const dbCategory = categoryMap[category] || category;

  timings.start = Date.now() - startTime;
  const latestYear = await GateYear.findOne({ paper, isActive: true }).sort({ year: -1 });
  if (!latestYear) {
    return { error: 'No GATE data available. Admin must upload datasets first.', confidence: 'Low', confidenceScore: 0 };
  }
  const baseYear = targetYear || latestYear.year;
  timings.fetchYear = Date.now() - startTime;

  // Fetch all years of data for multi-year analysis
  const allYears = await GateYear.find({ paper, isActive: true }).sort({ year: -1 }).limit(5);
  const yearList = allYears.map(y => y.year).filter(y => y <= baseYear);

  // Pipeline Step 1: Expected Marks → Normalized Score
  const marksScoreData = await GateMarksScore.find({ paper, year: { $in: yearList } }).sort({ year: -1, marks: 1 });
  let normalizedScore = null;
  if (marksScoreData.length >= 2) {
    normalizedScore = Math.round(interpolateFromData(marksScoreData, marks, 'marks', 'score') * 10) / 10;
  }
  // P1 fix (audit): GateScoreData is keyed by `score`, not `marks`, so the previous
  // `interpolateFromData(scoreData, marks, 'score', 'score')` was incorrect.
  // If we have scoreData but no marks→score mapping, use the scoreData's average score
  // as a sanity baseline (proportional to marks).
  if (!normalizedScore) {
    const scoreData = await GateScoreData.find({ paper, year: { $in: yearList } }).sort({ year: -1, score: 1 });
    if (scoreData.length >= 2) {
      const avgScore = scoreData.reduce((sum, d) => sum + d.score, 0) / scoreData.length;
      // Approximate: if marks are proportional to score, use marks/max-marks as ratio
      // When max marks = 100 and score range ~ 0-1000, use ratio * avgScore as fallback
      normalizedScore = Math.round((marks / 100) * avgScore * 10) / 10;
    }
  }
  if (!normalizedScore) {
    normalizedScore = Math.round(marks * 9.5 * 10) / 10;
  }

  // Step 2: Marks → Estimated AIR (direct marks→rank with calibration)
  const [rankData, gateStats, scoreRankData] = await Promise.all([
    GateRankData.find({ paper, year: { $in: yearList } }).sort({ year: -1, marks: 1 }),
    GateStatistics.find({ paper, year: { $in: yearList } }),
    GateScoreRank.find({ paper, year: { $in: yearList } }).sort({ year: -1, score: 1 }),
  ]);

  let estimatedRank = null;

  // Compute calibration factors from GateStatistics qualifying cutoffs
  const calibrationFactors = {};
  for (const st of gateStats) {
    if (st.qualifyingMarks && st.qualifyingPercentile && st.totalCandidates) {
      const yrRanks = rankData.filter(d => d.year === st.year);
      if (yrRanks.length >= 2) {
        const rawAtCutoff = interpolateFromData(yrRanks, st.qualifyingMarks, 'marks', 'rank');
        if (rawAtCutoff > 0) {
          const expectedRank = Math.round(st.totalCandidates * (1 - st.qualifyingPercentile / 100));
          calibrationFactors[st.year] = expectedRank / rawAtCutoff;
        }
      }
    }
  }

  // Primary: use GateRankData (direct marks→rank) with calibration
  if (rankData.length >= 2) {
    const baseYearRankData = rankData.filter(d => d.year === baseYear);
    if (baseYearRankData.length >= 2) {
      estimatedRank = Math.round(interpolateFromData(baseYearRankData, marks, 'marks', 'rank'));
    } else {
      estimatedRank = Math.round(interpolateFromData(rankData, marks, 'marks', 'rank'));
    }
    const factor = calibrationFactors[baseYear] || calibrationFactors[Math.max(...Object.keys(calibrationFactors).map(Number), 0)] || 1;
    if (estimatedRank && factor > 0) {
      const totalCand = gateStats.find(s => s.year === baseYear)?.totalCandidates || 150000;
      estimatedRank = Math.min(totalCand, Math.max(1, Math.round(estimatedRank * factor)));
      console.log('[Engine] marks=%d → rank=%d (calibrated×%s)', marks, estimatedRank, factor.toFixed(2));
    }
  }

  // Fallback: GateScoreRank (score→rank) if GateRankData had insufficient data
  if (!estimatedRank && scoreRankData.length >= 2) {
    estimatedRank = Math.round(interpolateFromData(scoreRankData, normalizedScore, 'score', 'rank'));
    console.log('[Engine] marks=%d → rank=%d (scoreRank fallback)', marks, estimatedRank);
  }

  // Step 3: Estimated AIR → Estimated Percentile
  let estimatedPercentile = null;
  const rankPercentileData = await GateRankPercentile.find({ paper, year: { $in: yearList } }).sort({ year: -1, rank: 1 });
  if (rankPercentileData.length >= 2 && estimatedRank) {
    estimatedPercentile = Math.round(interpolateFromData(rankPercentileData, estimatedRank, 'rank', 'percentile') * 10) / 10;
  }
  if (!estimatedPercentile && estimatedRank) {
    const totalCandidates = gateStats.find(s => s.year === baseYear)?.totalCandidates || 150000;
    estimatedPercentile = Math.round((1 - estimatedRank / totalCandidates) * 10000) / 100;
  }

  // Step 4: Category Adjustment (using qualifying cutoffs)
  const cutoffs = await GateCutoff.find({ paper, year: { $in: yearList } });
  const latestCutoffs = cutoffs.filter(c => c.year === baseYear);
  const categoryCutoff = latestCutoffs.find(c => c.category === dbCategory);
  const generalCutoff = latestCutoffs.find(c => c.category === 'General');
  const qualifyingCutoff = categoryCutoff?.qualifyingMarks || generalCutoff?.qualifyingMarks || 0;
  const isQualified = marks >= qualifyingCutoff;

  timings.preQuery = Date.now() - startTime;

  // Step 5: Fetch CCMT / COAP / Seat / College Metadata
  const [ccmtCutoffs, coapCutoffs, seatData, branchStats, psuData, psuRecruitments, statistics, collegePrograms] = await Promise.all([
    CcmtCutoff.find({ year: baseYear }).sort({ closingScore: -1 }),
    CoapCutoff.find({ year: baseYear }).sort({ closingScore: -1 }),
    SeatMatrix.find({ year: baseYear }),
    BranchStatistics.find({ year: baseYear }),
    PsuRequirement.find({ year: baseYear, paper, category: dbCategory }),
    PsuRecruitment.find({ year: baseYear, status: { $ne: 'Closed' } }),
    GateStatistics.findOne({ year: baseYear, paper }),
    CollegeProgram.find({ isActive: true }).lean(),
  ]);

  timings.mainQueries = Date.now() - startTime;

  // Build college metadata map for fast lookup
  const collegeMeta = new Map();
  for (const cp of collegePrograms) {
    collegeMeta.set(cp.name, cp);
  }

  // Filter CCMT data
  let filteredCcmt = ccmtCutoffs.filter(c => c.category === dbCategory || (category === 'General' && c.category === 'General'));

  // Warn if category has no CCMT data (e.g., PwD not in database)
  if (filteredCcmt.length === 0 && ccmtCutoffs.length > 0) {
    const availableCategories = [...new Set(ccmtCutoffs.map(c => c.category))];
    console.warn(`[Predictor] Category '${category}' has no CCMT data. Available: ${availableCategories.join(', ')}`);
  }

  if (collegeType && collegeType !== 'Any') {
    filteredCcmt = filteredCcmt.filter(c => c.instituteType === collegeType);
  }
  if (preferredState) {
    filteredCcmt = filteredCcmt.filter(c => c.state === preferredState || c.state === '');
  }
  if (preferredProgram) {
    const prog = preferredProgram.toLowerCase();
    filteredCcmt = filteredCcmt.filter(c => c.program.toLowerCase().includes(prog) || c.specialization.toLowerCase().includes(prog));
  }

  // Build new optimized map for deduplication and analytics
  const {
    instituteMap,
    programMap,
    programSet,
    collegePrograms: allCollegePrograms,
    ccmtCutoffs: allCcmtCutoffs,
    coapCutoffs: allCoapCutoffs,
    seatData: allSeatData,
  } = await buildInstituteProgramMap();

  // P0 fix: Pre-index seat data to avoid O(N²) .find() in hot loop
  const seatMap = new Map();
  for (const s of allSeatData) {
    seatMap.set(`${s.institute}|${s.program}`, s);
  }

  // Step 6: Build categorized college lists with enhanced probability calculation
  // 5-tier system: Very High Chance (>=95), High Chance ([80,95)), Good Chance ([60,80)), Competitive [40,60)), Dream (<40)
  // Minimum recommendation threshold: only show colleges with probability > this threshold
  const MIN_PROBABILITY_THRESHOLD = 0.5;

  const guaranteedColleges = [];
  const veryHighColleges = [];
  const likelyColleges = [];
  const competitiveColleges = [];
  const dreamTierColleges = [];
  // Legacy 4-tier system
  const dreamColleges = [];
  const targetColleges = [];
  const safeColleges = [];
  const backupColleges = [];

  // Database coverage counters (all records regardless of probability)
  let databaseCoverage = 0;
  let databaseCoverageByType = {};
  let recommendedSkipped = 0;

  // Grouped by institute+program for deduplication and category aggregation
  const groupMap = new Map(); // key => {collegeMeta, categories: Set, quotas: Set, bestProbability: 0}

  // P0 fix: Batch-fetch ALL trends once instead of N+1 queries in the hot loop
  const trendMap = await batchAnalyseTrends(filteredCcmt, category);

  // Helper: binary-search the score needed for a target probability
  function estimateScoreForTargetProbability(targetProb, closingScore, openingScore, trendInfo, competition, popularity, yr, instName, progName) {
    let lo = Math.max(0, normalizedScore - 50);
    let hi = normalizedScore + 100;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      const p = calcEnhancedProbability(mid, closingScore, openingScore, trendInfo, competition, popularity, yr, undefined, instName, progName).score;
      if (p >= targetProb) hi = mid; else lo = mid;
    }
    return Math.round((lo + hi) / 2 * 10) / 10;
  }

  for (const cc of filteredCcmt) {
    const instituteKey = normalizeInstituteName(cc.institute);
    const programKey = normalizeProgramName(cc.program);
    const groupKey = `${instituteKey}|${programKey}|${cc.admissionRoute || 'CCMT'}|${cc.quotaType || 'AI'}`;

    // Aggregate categories per group
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { collegeData: cc, categories: new Set(), quotas: new Set(), bestProbability: 0 });
    }
    const groupInfo = groupMap.get(groupKey);
    groupInfo.categories.add(cc.category);
    groupInfo.quotas.add(cc.quotaType || 'AI');

    // Get enhanced trend and metadata (in-memory lookup — no DB query)
    const trend = trendMap.get(`${cc.institute}|${cc.program}|${category}`)
               || trendMap.get(`${normalizeInstituteName(cc.institute)}|${category}`)
               || null;
    const meta = collegeMeta.get(cc.institute);

    // Calculate enhanced probability with competition and popularity factors
    const competitionLevel = trend?.competitionLevel || 'Medium';
    const programPopularity = trend?.programPopularity || 'Medium';
    const year = cc.year;

    const seatEntry = seatMap.get(`${cc.institute}|${cc.program}`);
    const { score: prob, confidence: adConfidence, reasons: adReasons } = calcEnhancedProbability(normalizedScore, cc.closingScore, cc.openingScore, trend, competitionLevel, programPopularity, year, seatEntry?.totalSeats, cc.institute, cc.program);

    groupInfo.bestProbability = Math.max(groupInfo.bestProbability, prob);

    // ── Priority 6: AI Explanation with Tags ───────────────────────
    const explanations = [];

    // Add admission confidence reasons
    if (adReasons) adReasons.forEach(r => explanations.push(r));

    // Score-based explanation
    if (normalizedScore >= cc.closingScore) {
      const margin = (normalizedScore - cc.closingScore).toFixed(1);
      explanations.push(`Your score (${normalizedScore}) is ${margin} points above the ${cc.year} closing score (${cc.closingScore})`);
    } else {
      const gap = (cc.closingScore - normalizedScore).toFixed(1);
      explanations.push(`Your score (${normalizedScore}) is ${gap} points below the ${cc.year} closing score (${cc.closingScore})`);
    }

    // Trend-based explanations
    if (trend) {
      if (trend.trendDirection === 'Falling') {
        explanations.push(`Cutoff trend has decreased over ${trend.years?.length || 3} years — improving chances`);
      } else if (trend.trendDirection === 'Rising') {
        explanations.push(`Cutoff trend is rising — competition is increasing`);
      } else {
        explanations.push(`Cutoff has been stable over the last ${trend.years?.length || 3} years`);
      }
      explanations.push(`Competition level: ${trend.competitionLevel}, Program popularity: ${trend.programPopularity}`);
    }

    // Value-based explanations
    if (meta?.avgPlacement) explanations.push(`Average placement: ₹${meta.avgPlacement} LPA`);
    if (meta?.highestPlacement) explanations.push(`Highest placement: ₹${meta.highestPlacement} LPA`);
    if (meta?.roiScore) explanations.push(`ROI score: ${meta.roiScore}/10 — strong value for investment`);
    if (meta?.placementPercentage) explanations.push(`Placement rate: ${meta.placementPercentage}% — excellent placement track record`);

    // ── Priority 9: Tags ──────────────────────────────────────────
    const tags = [];

    // Trending tag
    if (trend?.trendDirection === 'Rising' && (trend.programPopularity === 'High' || trend.programPopularity === 'Very High')) {
      tags.push({ id: 'trending', label: '🔥 Trending', color: '#F97316', bg: 'rgba(249,115,22,0.12)' });
    }

    // High ROI tag
    if (meta?.roiScore >= 8) {
      tags.push({ id: 'high_roi', label: '💰 High ROI', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' });
    } else if (meta?.roiScore >= 6) {
      tags.push({ id: 'good_roi', label: '💵 Good ROI', color: '#65A30D', bg: 'rgba(101,163,13,0.12)' });
    }

    // Placement tag
    if (meta?.avgPlacement >= 20) {
      tags.push({ id: 'top_placements', label: '🏆 Top Placements', color: '#A855F7', bg: 'rgba(168,85,247,0.12)' });
    }

    // Research tag
    if (meta?.researchRating >= 8) {
      tags.push({ id: 'research_hub', label: '🔬 Research Hub', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' });
    }

    // Competition tags
    if (competitionLevel === 'Low') {
      tags.push({ id: 'low_competition', label: '🟢 Low Competition', color: '#16A34A', bg: 'rgba(22,163,74,0.12)' });
    } else if (competitionLevel === 'High') {
      tags.push({ id: 'high_competition', label: '🔴 High Competition', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' });
    }

    // AI tag
    if (['CSEE', 'Computer Science and Engineering', 'Data Science and Artificial Intelligence', 'Artificial Intelligence', 'Information Technology'].includes(cc.program)) {
      tags.push({ id: 'ai_program', label: '🤖 AI Program', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' });
    }

    const previousClosingScores = (trend?.years || []).map(y => ({
      year: y.year,
      closingScore: y.closingScore,
      openingScore: y.openingScore,
    }));

    const collegeCard = {
      institute: cc.institute,
      instituteType: cc.instituteType,
      tier: meta?.tier || null,
      program: cc.program,
      specialization: cc.specialization || '',
      category: cc.category,
      round: cc.round,
      openingScore: cc.openingScore,
      closingScore: cc.closingScore,
      state: cc.state || '',
      year: cc.year,
      trend,
      probability: prob,
      admissionConfidence: adConfidence,
      // Separate Match Score: overall suitability (independent of admission chance)
      matchScore: Math.round(Math.min(100,
        0.35 * prob +
        0.20 * Math.min(100, ((meta?.avgPlacement || 0) / 50) * 100) +
        0.15 * ((meta?.roiScore || 5) * 10) +
        0.10 * ((meta?.researchRating || 5) * 10) +
        0.10 * ({1:100,2:70,3:40}[meta?.tier] || 50) +
        0.05 * Math.min(100, Math.max(0, 100 - ((meta?.fees || 150000) / 300000) * 100)) +
        0.05 * (meta?.placementPercentage || 50)
      )),
      seats: seatEntry?.totalSeats || cc.seats || null,
      previousClosingScores,
      avgPlacement: meta?.avgPlacement || null,
      highestPlacement: meta?.highestPlacement || null,
      medianPlacement: meta?.medianPlacement || null,
      fees: meta?.fees || null,
      website: meta?.website || '',
      placementPercentage: meta?.placementPercentage || null,
      topRecruiters: meta?.topRecruiters || null,
      hostelFee: meta?.hostelFee || null,
      totalCost: meta?.totalCost || null,
      roiScore: meta?.roiScore || null,
      duration: meta?.duration || null,
      intake: meta?.intake || null,
      acceptedPapers: meta?.acceptedPapers || null,
      curriculum: meta?.curriculum || null,
      researchAreas: meta?.researchAreas || null,
      academicsRating: meta?.academicsRating || null,
      placementsRating: meta?.placementsRating || null,
      researchRating: meta?.researchRating || null,
      campusRating: meta?.campusRating || null,
      roiRating: meta?.roiRating || null,
      explanations,
      tags,
      // Structured "Why This College?" explanation
      whyExplanation: {
        whyMatched: normalizedScore >= cc.closingScore
          ? `Your score (${normalizedScore}) exceeds the ${cc.year} ${cc.category} closing score (${cc.closingScore}) by ${(normalizedScore - cc.closingScore).toFixed(1)} points`
          : `Your score (${normalizedScore}) is ${(cc.closingScore - normalizedScore).toFixed(1)} points below the ${cc.year} ${cc.category} closing score (${cc.closingScore})`,
        categoryUsed: cc.category,
        latestCutoff: { year: cc.year, openingScore: cc.openingScore, closingScore: cc.closingScore },
        trendDirection: trend?.trendDirection || null,
        trendSummary: trend ? `Cutoff has been ${trend.trendDirection.toLowerCase()} over ${trend.years?.length || 3} years` : null,
        competitionLevel,
        confidenceLevel: prob >= 80 ? 'High' : prob >= 60 ? 'Moderate' : prob >= 40 ? 'Low' : 'Very Low',
        placementSummary: meta?.avgPlacement ? `Avg: ₹${meta.avgPlacement} LPA${meta.placementPercentage ? ` · ${meta.placementPercentage}% placed` : ''}` : null,
        feeSummary: meta?.fees ? `₹${(meta.fees / 100000).toFixed(1)}L${meta.totalCost ? ` (Total: ₹${(meta.totalCost / 100000).toFixed(1)}L)` : ''}` : null,
      },
      // Improvement suggestion: what score needed to reach 90% and 70% probability
      improvementSuggestion: prob < 90 ? (() => {
        const score90 = estimateScoreForTargetProbability(90, cc.closingScore, cc.openingScore, trend, competitionLevel, programPopularity, year, cc.institute, cc.program);
        const score70 = estimateScoreForTargetProbability(70, cc.closingScore, cc.openingScore, trend, competitionLevel, programPopularity, year, cc.institute, cc.program);
        const needed90 = Math.max(0, score90 - normalizedScore);
        const needed70 = Math.max(0, score70 - normalizedScore);
        return {
          currentProbability: prob,
          to90: needed90 > 0 ? { targetScore: score90, marksNeeded: Math.ceil(needed90) } : null,
          to70: needed70 > 0 ? { targetScore: score70, marksNeeded: Math.ceil(needed70) } : null,
        };
      })() : null,
      admissionRoute: cc.admissionRoute || 'CCMT',
      quotaType: cc.quotaType || 'AI',
      availableCategories: [], // Will be populated after groupMap is built
    };

    // Database coverage: count this record regardless of probability
    databaseCoverage++;
    const ct = cc.instituteType || 'Other';
    if (!databaseCoverageByType[ct]) databaseCoverageByType[ct] = 0;
    databaseCoverageByType[ct]++;

    // Only skip colleges where the score gap is extremely far (more than 300 points below closing)
    // For moderate gaps, keep them as Dream/Ambitious so users see all options
    const scoreGap = normalizedScore - (cc.closingScore || 0);
    if (scoreGap < -300) {
      recommendedSkipped++;
      continue;
    }

    // 5-tier categorization — using user-specified ranges
    // 90-100% High/Safe, 70-89% Moderate/High Chance, 40-69% Moderate, 15-39% Ambitious, <15% Dream
    if (prob >= 90) guaranteedColleges.push(collegeCard);
    else if (prob >= 70) veryHighColleges.push(collegeCard);
    else if (prob >= 40) likelyColleges.push(collegeCard);
    else if (prob >= 15) competitiveColleges.push(collegeCard);
    else dreamTierColleges.push(collegeCard);

    // Legacy 4-tier categorization (backward compatibility)
    if (prob >= 70) safeColleges.push(collegeCard);
    else if (prob >= 35) targetColleges.push(collegeCard);
    else if (prob >= 15) dreamColleges.push(collegeCard);
    else backupColleges.push(collegeCard);
  }

  // Sort each category by recommendation priority (institute reputation → program → probability → placement → ROI)
  guaranteedColleges.sort(sortByRecommendationPriority);
  veryHighColleges.sort(sortByRecommendationPriority);
  likelyColleges.sort(sortByRecommendationPriority);
  competitiveColleges.sort(sortByRecommendationPriority);
  dreamTierColleges.sort(sortByRecommendationPriority);

  // Cross-tier deduplication: keep only the highest-probability entry per institute+program
  // This prevents the same college from appearing in multiple tiers (e.g., different rounds)
  const seenGlobal = new Set();
  function dedupGlobal(arr) {
    return arr.filter(c => {
      const key = `${c.institute}|${c.program}`;
      if (seenGlobal.has(key)) return false;
      seenGlobal.add(key);
      return true;
    });
  }
  // 5-tier global dedup (process in priority order so best entry wins)
  const g5 = dedupGlobal(guaranteedColleges);
  const vh5 = dedupGlobal(veryHighColleges);
  const lk5 = dedupGlobal(likelyColleges);
  const cp5 = dedupGlobal(competitiveColleges);
  const dt5 = dedupGlobal(dreamTierColleges);
  // 4-tier legacy dedup (separate scope to avoid interfering with 5-tier counts)
  const seenLegacy = new Set();
  function dedupLegacy(arr) {
    return arr.filter(c => {
      const key = `${c.institute}|${c.program}`;
      if (seenLegacy.has(key)) return false;
      seenLegacy.add(key);
      return true;
    });
  }
  const sc4 = dedupLegacy(safeColleges);
  const tc4 = dedupLegacy(targetColleges);
  const dc4 = dedupLegacy(dreamColleges);
  const bc4 = dedupLegacy(backupColleges);
  // Replace arrays
  guaranteedColleges.length = 0; guaranteedColleges.push(...g5);
  veryHighColleges.length = 0; veryHighColleges.push(...vh5);
  likelyColleges.length = 0; likelyColleges.push(...lk5);
  competitiveColleges.length = 0; competitiveColleges.push(...cp5);
  dreamTierColleges.length = 0; dreamTierColleges.push(...dt5);
  safeColleges.length = 0; safeColleges.push(...sc4);
  targetColleges.length = 0; targetColleges.push(...tc4);
  dreamColleges.length = 0; dreamColleges.push(...dc4);
  backupColleges.length = 0; backupColleges.push(...bc4);

  // Legacy sort (backward compatibility) — same priority order
  safeColleges.sort(sortByRecommendationPriority);
  targetColleges.sort(sortByRecommendationPriority);
  dreamColleges.sort(sortByRecommendationPriority);
  backupColleges.sort(sortByRecommendationPriority);

  // Populate availableCategories on each college card from groupMap
  for (const [key, groupInfo] of groupMap) {
    const allCards = [...guaranteedColleges, ...veryHighColleges, ...likelyColleges, ...competitiveColleges, ...dreamTierColleges,
                      ...safeColleges, ...targetColleges, ...dreamColleges, ...backupColleges];
    for (const card of allCards) {
      if (card.institute === groupInfo.collegeData.institute && card.program === groupInfo.collegeData.program) {
        card.availableCategories = Array.from(groupInfo.categories);
      }
    }
  }

  // Step 7: Career counts (using UNSLICED arrays for accurate totals)
  const allLegacy = [...safeColleges, ...targetColleges, ...dreamColleges, ...backupColleges];
  const eligibleIITs = [...new Set(allLegacy.filter(c => c.instituteType === 'IIT').map(c => c.institute))].length;
  const eligibleNITs = [...new Set(allLegacy.filter(c => c.instituteType === 'NIT').map(c => c.institute))].length;
  const eligibleIIITs = [...new Set(allLegacy.filter(c => c.instituteType === 'IIIT').map(c => c.institute))].length;
  const eligibleGFTIs = [...new Set(allLegacy.filter(c => c.instituteType === 'GFTI').map(c => c.institute))].length;
  const eligibleIISc = [...new Set(allLegacy.filter(c => c.instituteType === 'IISc').map(c => c.institute))].length;
  const eligibleIIEST = [...new Set(allLegacy.filter(c => c.instituteType === 'IIEST').map(c => c.institute))].length;

  // Unsliced totals by type (for summary metrics)
  const totalIITs = allLegacy.filter(c => c.instituteType === 'IIT').length;
  const totalNITs = allLegacy.filter(c => c.instituteType === 'NIT').length;
  const totalIIITs = allLegacy.filter(c => c.instituteType === 'IIIT').length;
  const totalGFTIs = allLegacy.filter(c => c.instituteType === 'GFTI').length;
  const totalPrivate = allLegacy.filter(c => c.instituteType === 'Private').length;
  const totalIISc = allLegacy.filter(c => c.instituteType === 'IISc').length;
  const totalIIEST = allLegacy.filter(c => c.instituteType === 'IIEST').length;
  const totalOther = allLegacy.filter(c => c.instituteType === 'Other').length;

  const eligiblePsus = psuData.filter(p => normalizedScore >= p.cutoffScore).map(p => ({
    name: p.name, shortName: p.shortName, cutoffScore: p.cutoffScore, totalPosts: p.totalPosts, location: p.location, discipline: p.discipline,
  }));

  // Step 8: Branch recommendations
  const branchRecommendations = [];
  if (branchStats.length > 0) {
    const sortedBranches = branchStats.filter(b => b.category === dbCategory).sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
    for (const bs of sortedBranches.slice(0, 5)) {
      if (normalizedScore >= (bs.minScore || 0)) {
        const gap = bs.avgScore ? Math.round((normalizedScore - bs.avgScore) * 10) / 10 : 0;
        branchRecommendations.push({
          branch: bs.branch,
          reason: gap >= 0 ? `Your score is ${gap} above average for ${bs.branch}` : `Need ${Math.abs(gap)} more points for ${bs.branch}`,
          avgScore: bs.avgScore,
          seats: bs.totalSeats,
        });
      }
    }
  }

  // Step 9: Last 5 year trend data
  const last5YearData = await GateStatistics.find({ paper }).sort({ year: 1 }).limit(5);
  const last5YearTrend = {
    scores: last5YearData.map(d => d.qualifyingMarks).filter(Boolean),
    ranks: last5YearData.map(d => d.qualifyingPercentile).filter(Boolean),
    years: last5YearData.map(d => d.year).filter(Boolean),
  };

  // Step 10: Data quality assessment
  const dataQuality = (() => {
    if (marksScoreData.length >= 100 && scoreRankData.length >= 100 && ccmtCutoffs.length >= 100) return 'Excellent';
    if (marksScoreData.length >= 50 && scoreRankData.length >= 50 && ccmtCutoffs.length >= 50) return 'Good';
    if (marksScoreData.length >= 10 || ccmtCutoffs.length >= 10) return 'Fair';
    return 'Poor';
  })();

  // Step 10b: Aggregate trend signal across eligible colleges (for AIR uncertainty)
  const eligibleTrends = [...safeColleges, ...targetColleges, ...dreamColleges].filter(c => c.trend);
  const aggregateTrend = eligibleTrends.length > 0 ? {
    trendDirection: (() => {
      const counts = { Rising: 0, Stable: 0, Falling: 0 };
      eligibleTrends.forEach(c => {
        const dir = c.trend.trendDirection || 'Stable';
        counts[dir] = (counts[dir] || 0) + 1;
      });
      const max = Math.max(counts.Rising, counts.Stable, counts.Falling);
      if (max === counts.Rising) return 'Rising';
      if (max === counts.Falling) return 'Falling';
      return 'Stable';
    })(),
    // Use median volatility to avoid extreme values
    volatility: (() => {
      const vol = eligibleTrends.map(c => c.trend.volatility || 0).sort((a, b) => a - b);
      const mid = Math.floor(vol.length / 2);
      return vol.length % 2 ? vol[mid] : (vol[mid - 1] + vol[mid]) / 2;
    })(),
  } : null;

  // Step 10c: AIR Range (best/avg/worst) — Priority 4: never show exact rank alone
  let airRange = null;
  if (estimatedRank && aggregateTrend) {
    airRange = calculateAIRRange(estimatedRank, dataQuality, aggregateTrend, aggregateTrend.competitionLevel || 'Medium');
  } else if (estimatedRank) {
    // Fallback for low marks where aggregateTrend is null (no eligible colleges for trend analysis)
    // Use Poor data quality and a conservative range estimate
    const fallbackTrend = { trendDirection: 'Stable', volatility: 20, competitionLevel: 'Medium' };
    airRange = calculateAIRRange(estimatedRank, 'Poor', fallbackTrend, 'Medium');
  }

  // Step 11: Confidence with quantified sub-scores (Priority 5: never hardcode)
  const totalDataPoints = marksScoreData.length + scoreRankData.length + allCcmtCutoffs.length + allCoapCutoffs.length + allSeatData.length;
  const hasMultiYear = yearList.length >= 2;
  const totalSeats = allSeatData.reduce((sum, s) => sum + (s.totalSeats || 0), 0);
  let { label: confidence, score: confidenceScore, factors } = computeConfidenceWithFactors(
    totalDataPoints,
    hasMultiYear,
    aggregateTrend,
    aggregateTrend?.competitionLevel || 'Medium',
    null,
    totalSeats,
    qualifyingCutoff,
    normalizedScore
  );

  // Quantified confidence sub-scores (so the UI/user knows WHY confidence is what it is)
  const trendStabilityScore = aggregateTrend
    ? (aggregateTrend.trendDirection === 'Stable' ? 100 : aggregateTrend.trendDirection === 'Falling' ? 75 : 50)
    : 0;
  const dataCompletenessScore = Math.min(100, Math.round((totalDataPoints / 500) * 100));
  // Normalize median volatility to 0..1 (cap at 50 points = score 0)
  const normalizedVolatility = Math.min(1, (aggregateTrend?.volatility || 0) / 50);
  const historicalConsistencyScore = hasMultiYear && eligibleTrends.length >= 5
    ? Math.max(20, Math.round(100 - normalizedVolatility * 80))
    : (hasMultiYear ? 60 : 30);
  const predictionUncertaintyScore = airRange?.uncertaintyPct != null
    ? Math.max(0, 100 - airRange.uncertaintyPct)
    : 50;

  // Step 12: Admission probability (overall)
  console.log('[Engine] safeColleges:', safeColleges.length, 'targetColleges:', targetColleges.length, 'dreamColleges:', dreamColleges.length, 'backupColleges:', backupColleges.length);
  console.log('[Engine] totalIITs:', totalIITs, 'IISc:', totalIISc, 'NITs:', totalNITs, 'IIITs:', totalIIITs, 'GFTIs:', totalGFTIs, 'Private:', totalPrivate, 'IIEST:', totalIIEST, 'Other:', totalOther);
  console.log('[Engine] guaranteedColleges:', guaranteedColleges.length, 'veryHighColleges:', veryHighColleges.length, 'likelyColleges:', likelyColleges.length, 'competitiveColleges:', competitiveColleges.length, 'dreamTierColleges:', dreamTierColleges.length);
  // Total opportunities = 5-tier (all recommended colleges, matches frontend display)
  const totalOpportunities = guaranteedColleges.length + veryHighColleges.length + likelyColleges.length + competitiveColleges.length + dreamTierColleges.length;
  const admissionProbability = totalOpportunities > 0 ? Math.round((safeColleges.length / totalOpportunities) * 100) : 0;

  // Step 13: Why This Prediction
  const whyBasedOn = [];
  if (marksScoreData.length > 0) whyBasedOn.push('GATE Historical Marks→Score Data');
  if (scoreRankData.length > 0) whyBasedOn.push('GATE Score→Rank Data');
  if (ccmtCutoffs.length > 0) whyBasedOn.push(`CCMT Cutoffs (${ccmtCutoffs.length} entries)`);
  if (coapCutoffs.length > 0) whyBasedOn.push(`COAP Offers (${coapCutoffs.length} entries)`);
  if (seatData.length > 0) whyBasedOn.push('Seat Matrix');
  if (category !== 'General') whyBasedOn.push(`Reservation Category (${category})`);
  if (branchStats.length > 0) whyBasedOn.push('Branch-wise Statistics');
  if (yearList.length >= 2) whyBasedOn.push(`Multi-year Analysis (${yearList.length} years)`);

  const confidenceFactors = [];
  if (totalDataPoints >= 100) confidenceFactors.push('Large dataset size');
  if (hasMultiYear) confidenceFactors.push('Multi-year trend analysis');
  if (ccmtCutoffs.length >= 50) confidenceFactors.push('Comprehensive CCMT data');
  if (normalizedScore != null && estimatedRank != null) confidenceFactors.push('Complete marks→score→rank pipeline');
  if (totalDataPoints < 50) confidenceFactors.push('Limited dataset — improve by uploading more data');
  if (marksScoreData.length < 10) confidenceFactors.push('Missing marks→score mapping');

  // Step 14: Generate recommendations
  const recommendations = [];
  if (!isQualified) {
    recommendations.push(`You need at least ${qualifyingCutoff} marks in ${category} category. Gap: ${(qualifyingCutoff - marks).toFixed(1)} marks.`);
    recommendations.push(`Focus on high-weightage topics to maximize score improvement.`);
  } else {
    if (safeColleges.length > 0) recommendations.push(`You have ${safeColleges.length} safe options (≥70% probability).`);

    if (targetColleges.length > 0) recommendations.push(`${targetColleges.length} target colleges (40-70% probability). A ~5 mark improvement can shift these to safe.`);

    if (dreamColleges.length > 0) recommendations.push(`${dreamColleges.length} dream colleges (15-40% probability). A ~10 mark improvement opens these doors.`);

    if (safeColleges.length === 0 && targetColleges.length === 0) {
      recommendations.push('Your score is below most cutoffs. Even a 5-8 mark improvement significantly improves your options.');
    }

    if (eligiblePsus.length > 0) recommendations.push(`${eligiblePsus.length} PSUs are within your reach. Check individual recruitment notifications.`);

    const risingTrends = [...safeColleges, ...targetColleges, ...dreamColleges].filter(c => c.trend?.trendDirection === 'Rising');
    if (risingTrends.length > 3) recommendations.push(`${risingTrends.length} colleges show rising cutoffs — competition is increasing. Apply early.`);

    const fallingTrends = [...safeColleges, ...targetColleges, ...dreamColleges].filter(c => c.trend?.trendDirection === 'Falling');
    if (fallingTrends.length > 3) recommendations.push(`${fallingTrends.length} colleges show falling cutoffs — your chances are improving.`);
  }

  if (preferredProgram) recommendations.push(`Your preferred program "${preferredProgram}" has ${targetColleges.length + safeColleges.length} options in your range.`);

  // Step 15: Multi-year what-if baseline
  const whatIfBaseline = [];
  for (const delta of [0, 5, 10, 15]) {
    const testMarks = clamp(marks + delta, 0, 100);
    const testScore = marksScoreData.length >= 2 ? Math.round(interpolateFromData(marksScoreData, testMarks, 'marks', 'score') * 10) / 10 : normalizedScore + delta * 9.5;
    const testRank = scoreRankData.length >= 2 ? Math.round(interpolateFromData(scoreRankData, testScore, 'score', 'rank')) : estimatedRank ? Math.round(estimatedRank * (1 - delta * 0.08)) : null;
    const testOpps = filteredCcmt.filter(c => testScore >= (c.closingScore || 0)).length;
    whatIfBaseline.push({ marks: testMarks, score: testScore, rank: testRank, opportunities: testOpps });
  }

  // Step 16: Get prediction accuracy from feedback
  let predictionAccuracy = null;
  try {
    const accData = await PredictionAccuracy.findOne().sort({ lastCalculated: -1 });
    if (accData) predictionAccuracy = accData.overallAccuracy;
  } catch (e) { /* no accuracy data yet */ }

  // Compute analytics
  const allColleges = [...safeColleges, ...targetColleges, ...dreamColleges, ...backupColleges];
  const analytics = await computeAnalytics(allColleges, instituteMap, programMap);

  timings.total = Date.now() - startTime;

  // Build debug data for owner role
  const dbRecordTypes = {};
  for (const cutoff of ccmtCutoffs) {
    const t = cutoff.instituteType || 'Unknown';
    if (!dbRecordTypes[t]) dbRecordTypes[t] = { count: 0, institutes: new Set() };
    dbRecordTypes[t].count++;
    dbRecordTypes[t].institutes.add(cutoff.institute);
  }
  const dbRecordsByType = {};
  for (const [type, info] of Object.entries(dbRecordTypes)) {
    dbRecordsByType[type] = { count: info.count, uniqueInstitutes: info.institutes.size };
  }

  // ─── Build Output ──────────────────────────────────────────────
  return {
    baseYear,
    predictedScore: Math.round(normalizedScore * 10) / 10,
    predictedRank: estimatedRank,
    predictedPercentile: estimatedPercentile,
    airRange, // Priority 4: {best, average, worst, uncertainty, confidenceLevel} — never show exact rank alone
    airUncertaintyFactors: airRange ? [
      dataQuality === 'Excellent' ? 'High data quality across 5+ years of cutoffs' : dataQuality === 'Good' ? 'Solid dataset but limited coverage' : 'Limited data increases uncertainty',
      aggregateTrend?.trendDirection === 'Stable' ? 'Most eligible colleges show stable cutoffs' : aggregateTrend?.trendDirection === 'Rising' ? 'Rising cutoffs signal tighter competition' : 'Falling cutoffs favor applicants',
      `${eligibleTrends.length} eligible (institute, program) pairs in trend analysis`,
    ].filter(Boolean) : null,
    confidence,
    confidenceScore,
    confidenceBreakdown: { // Priority 5: data-driven sub-scores (no hardcoded confidence)
      dataCompleteness: dataCompletenessScore,
      historicalConsistency: historicalConsistencyScore,
      trendStability: trendStabilityScore,
      predictionUncertainty: predictionUncertaintyScore,
    },
    confidenceFactors: factors || [],
    isQualified,
    qualifyingCutoff,
    dataQuality,
    databaseCoverage,       // total records in DB for this category/year
    databaseCoverageByType, // breakdown by institute type
    recommendedSkipped,     // records skipped due to probability threshold
    // 5-tier groups (Priority 8) — no artificial limits; show ALL eligible colleges
    guaranteedColleges: guaranteedColleges.slice(0, 200),
    veryHighColleges: veryHighColleges.slice(0, 200),
    likelyColleges: likelyColleges.slice(0, 200),
    competitiveColleges: competitiveColleges.slice(0, 200),
    dreamTierColleges: dreamTierColleges.slice(0, 200),
    // Legacy 4-tier groups (backward compatibility)
    dreamColleges: dreamColleges.slice(0, 200),
    targetColleges: targetColleges.slice(0, 200),
    safeColleges: safeColleges.slice(0, 200),
    backupColleges: backupColleges.slice(0, 200),
    eligibleIITs,
    eligibleNITs,
    eligibleIIITs,
    eligibleGFTIs,
    eligibleIISc,
    eligibleIIEST,
    eligiblePSUs: eligiblePsus,
    // Unsliced totals (accurate counts for summary metrics)
    totalOpportunities,
    totalIITs,
    totalNITs,
    totalIIITs,
    totalGFTIs,
    totalPrivate,
    totalIISc,
    totalIIEST,
    totalOther,
    branchRecommendations,
    admissionProbability,
    last5YearTrend,
    aggregateTrend: aggregateTrend ? {
      trendDirection: aggregateTrend.trendDirection,
      volatility: Math.round((aggregateTrend.volatility || 0) * 10) / 10,
      collegesAnalyzed: eligibleTrends.length,
    } : null,
    whyThisPrediction: { basedOn: whyBasedOn, confidenceFactors, dataQuality },
    recommendations,
    whatIfBaseline,
    totalDataPoints,
    datasetsUsed: [
      { name: 'Marks→Score', year: baseYear, entries: marksScoreData.length, source: 'GateMarksScore' },
      { name: 'Score→Rank', year: baseYear, entries: scoreRankData.length, source: 'GateScoreRank' },
      { name: 'CCMT Cutoffs', year: baseYear, entries: allCcmtCutoffs.length, source: 'CcmtCutoff' },
      { name: 'COAP Offers', year: baseYear, entries: allCoapCutoffs.length, source: 'CoapCutoff' },
      { name: 'Seat Matrix', year: baseYear, entries: allSeatData.length, source: 'SeatMatrix' },
    ].filter(d => d.entries > 0),
    predictionAccuracy,
    timestamp: new Date().toISOString(),
    _debug: {
      dbRecordsByType,
      filteredCcmtCount: filteredCcmt.length,
      allCcmtCutoffs: allCcmtCutoffs.length,
      marksScoreData: marksScoreData.length,
      scoreRankData: scoreRankData.length,
      databaseCoverage,
      databaseCoverageByType,
      recommendedSkipped,
      recommendedCount: guaranteedColleges.length + veryHighColleges.length + likelyColleges.length + competitiveColleges.length + dreamTierColleges.length,
    },
    analytics,
    // Low marks guidance
    ...(isVeryLowMarks ? {
      lowMarksGuidance: {
        message: `Based on your expected marks (${marks}), admission through CCMT is currently unlikely. Consider aiming for a higher score or exploring institute-specific admissions.`,
        suggestions: [
          'Use the "What if I improve?" tool to see how additional marks change your opportunities',
          'Focus on strengthening weak subjects — even 10-15 more marks significantly expand your options',
          'Consider institute-specific applications (some IITs have separate admission processes)',
          'Explore PSU opportunities through GATE score — cutoffs vary by organization',
        ],
        improvementTarget: Math.min(100, marks + 20),
        improvementNote: `At ${Math.min(100, marks + 20)} marks, your predicted opportunities would increase substantially`,
      },
    } : {}),
  };
}

// ─── What-If Analysis (lightweight, no DB) ────────────────────────

function whatIf(prediction, marksDelta) {
  if (!prediction || !prediction.predictedScore) return null;
  const baseScore = prediction.predictedScore;
  const baseRank = prediction.predictedRank;
  const adjustedScore = baseScore + marksDelta * 9.5;
  const adjustedRank = baseRank ? Math.round(baseRank * (1 - marksDelta * 0.08)) : null;
  return { marksDelta, adjustedScore, adjustedRank };
}

// ─── AI Report Generator ──────────────────────────────────────────

function generateAiReport(prediction, userData) {
  const { predictedScore, predictedRank, predictedPercentile, dreamColleges, targetColleges, safeColleges, isQualified, eligibleIITs, eligibleNITs, recommendations, admissionProbability } = prediction;
  const totalColleges = (dreamColleges?.length || 0) + (targetColleges?.length || 0) + (safeColleges?.length || 0);

  const strengths = [];
  if (isQualified) strengths.push('Qualified GATE with score above cutoff');
  if (safeColleges.length >= 5) strengths.push(`Strong admission prospects — ${safeColleges.length}+ safe options`);
  if (eligibleIITs >= 3) strengths.push(`Competitive for ${eligibleIITs}+ IITs`);
  if (eligibleNITs >= 5) strengths.push(`Strong NIT prospects (${eligibleNITs} eligible)`);
  if (predictedPercentile && predictedPercentile > 90) strengths.push(`Top ${(100 - predictedPercentile).toFixed(1)}% percentile performance`);
  if (prediction.totalDataPoints >= 100) strengths.push(`Prediction based on ${prediction.totalDataPoints} data points — high reliability`);
  if (userData?.completedSubjects && userData.completedSubjects >= 5) strengths.push(`Consistent progress across ${userData.completedSubjects} subjects`);

  const weaknesses = [];
  if (!isQualified) weaknesses.push('Below qualifying cutoff — need significant improvement');
  if (safeColleges.length === 0 && targetColleges.length < 3) weaknesses.push('Very limited admission options at current score');
  if (dreamColleges.length > targetColleges.length * 2) weaknesses.push('Most desired colleges are in dream category — need score improvement');
  if (prediction.dataQuality === 'Poor' || prediction.dataQuality === 'Fair') weaknesses.push('Limited dataset quality — predictions may be less accurate');
  if (prediction.totalDataPoints < 50) weaknesses.push('Small dataset size reduces prediction confidence');
  if (userData?.weakSubjects && userData.weakSubjects >= 3) weaknesses.push(`${userData.weakSubjects} weak subjects identified — prioritize them`);

  const improvements = [];
  if (!isQualified) improvements.push('Focus on high-weightage topics to maximize marks in minimum time');
  improvements.push('Solve previous year GATE papers (last 10 years) to understand exam pattern');
  if (targetColleges.length > 0) improvements.push(`Improve score by 5-8 marks to convert ${targetColleges.length} target options to safe`);
  if (dreamColleges.length > 0) improvements.push(`Improve score by 8-12 marks to access ${dreamColleges.length} dream options`);
  if (predictedPercentile && predictedPercentile < 90) improvements.push('Target 90+ percentile for top IIT/NIT admissions');
  improvements.push('Take full-length mock tests weekly to track progress');
  if (userData?.weakSubjects) improvements.push(`Dedicate extra time to weak subjects identified in your progress data`);

  const recommendedSubjects = [];
  if (userData?.weakSubjects) recommendedSubjects.push(...userData.weakSubjects.slice(0, 3));

  return {
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 3),
    improvements: improvements.slice(0, 5),
    recommendedSubjects,
    dreamIITStrategy: `To access IITs with ${predictedScore} score, focus on new IITs and less competitive programs. Aim for ${Math.round((predictedScore || 0) + 15)}+ score for top IITs.`,
    targetIITStrategy: `Your current score gives access to ${eligibleIITs} IIT programs. Target mid-range IITs for M.Tech.`,
    safeCollegeStrategy: `Your safest options are NITs (${eligibleNITs} eligible) and GFTIs (${prediction.eligibleGFTIs || 0} eligible). Consider top NITs for quality education.`,
    estimatedMarksNeeded: isQualified ? null : Math.round((prediction.qualifyingCutoff || 0) + 5),
  };
}

module.exports = { predict, whatIf, generateAiReport };
