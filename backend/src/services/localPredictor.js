const path = require('path');
const fs = require('fs');
const { predict: gateScorePredict } = require('./gateScoreCalculator');

let staticCutoffs = null;

function loadStaticCutoffs() {
  if (staticCutoffs) return staticCutoffs;
  const filePath = path.join(__dirname, '../../data/cse-cutoffs.json');
  if (fs.existsSync(filePath)) {
    staticCutoffs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const totalProgrammes = staticCutoffs.reduce((s, c) => s + (c.programs?.length || 0), 0);
    console.log(`[LocalPredictor] Loaded ${staticCutoffs.length} colleges, ${totalProgrammes} programmes from static data`);
  } else {
    staticCutoffs = [];
    console.warn('[LocalPredictor] cse-cutoffs.json not found at', filePath);
  }
  return staticCutoffs;
}

const CATEGORY_MAP = { 'General': 'GEN', 'OBC': 'OBC', 'OBC-NCL': 'OBC', 'SC': 'SC', 'ST': 'ST', 'EWS': 'EWS', 'PwD': 'PWD', 'PWD': 'PWD' };
const ROUND_PRIORITY = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };

/** Format raw rupees to LPA: 2800000 → 28.0 */
function toLPA(val) {
  if (val == null || isNaN(val)) return null;
  const num = Number(val);
  if (num >= 100000) return +(num / 100000).toFixed(1);
  if (num >= 100) return +(num / 100).toFixed(1);
  return num;
}

/** Probability based on candidate's GATE score vs cutoff scores (same unit: 0-1000) */
function calcProbabilityByScore(candidateScore, openingScore, closingScore) {
  if (!closingScore || closingScore <= 0) return 0;
  // If score >= closing, high probability (met or exceeded cutoff)
  if (candidateScore >= closingScore) {
    const margin = (candidateScore - closingScore) / closingScore;
    return Math.min(100, Math.round(70 + margin * 30));
  }
  // If score between opening and closing
  if (candidateScore >= openingScore) {
    const ratio = (candidateScore - openingScore) / (closingScore - openingScore);
    return Math.round(Math.max(15, ratio * 55));
  }
  // Below opening, still possible but low
  const deficit = (openingScore - candidateScore) / openingScore;
  return Math.round(Math.max(0, 15 - deficit * 30));
}

function getCollegeBlock(collegeName, probability, collegeType) {
  const ELITE = [
    'Indian Institute of Technology Bombay',
    'Indian Institute of Technology Delhi',
    'Indian Institute of Technology Madras',
    'Indian Institute of Technology Kanpur',
    'Indian Institute of Technology Kharagpur',
    'Indian Institute of Technology Roorkee',
    'Indian Institute of Science Bangalore'
  ];
  if (ELITE.includes(collegeName) && probability >= 40) return 'dream_elite';
  if (collegeType === 'IIT' && probability >= 40) return 'high_chance_iit';
  if (collegeType === 'NIT' && probability >= 70) return 'safe_nit';
  return 'backup';
}

/** Maps probability to the 5-tier path used by the frontend (Very High/High/Good/Competitive/Dream) */
function getChanceCategory(probability) {
  if (probability >= 80) return 'Very High Chance';
  if (probability >= 60) return 'High Chance';
  if (probability >= 40) return 'Good Chance';
  if (probability >= 20) return 'Competitive';
  return 'Dream';
}

function localPredict(input) {
  const {
    expectedMarks, category = 'General', paper = 'CS',
    admissionType = 'M.Tech', preferredState = '', collegeType = 'Any',
  } = input;

  const marks = Math.min(100, Math.max(0, expectedMarks));
  const colleges = loadStaticCutoffs();
  const baseYear = 2024;

  // Use the official GATE Score calculator
  const gateResult = gateScorePredict(marks, paper, category, baseYear);
  if (gateResult.error) {
    console.warn('[LocalPredictor] GateScore calculator error:', gateResult.error);
    return { error: gateResult.error };
  }

  const gateScore = gateResult.gateScore.value;
  const estimatedRank = gateResult.air?.interpolatedAIR || gateResult.air?.range?.low || 99999;
  const airRange = gateResult.air?.range || { low: estimatedRank, high: Math.round(estimatedRank * 1.5) };
  const isQualified = marks > gateResult.formula.Mq;
  const dbCategory = CATEGORY_MAP[category] || 'GEN';

  const opportunities = [];
  const seen = new Set();
  const instituteMap = {}; // for grouping programmes under institute

  for (const college of colleges) {
    if (collegeType !== 'Any' && college.college_type !== collegeType) continue;
    if (preferredState && college.state !== preferredState) continue;

    for (const prog of college.programs || []) {
      if (prog.gate_paper !== paper && !prog.gate_paper?.includes(',')) continue;

      const cutoffEntry = (prog.cutoffs || [])
        .filter(c => c[dbCategory])
        .sort((a, b) => ROUND_PRIORITY[a.round] - ROUND_PRIORITY[b.round])[0];

      if (!cutoffEntry) continue;

      const catData = cutoffEntry[dbCategory];
      if (!catData) continue;

      const closingScore = catData.closing;
      const openingScore = catData.opening || 1;

      const probability = calcProbabilityByScore(gateScore, openingScore, closingScore);
      if (probability <= 0) continue;

      const key = `${college.college_name}|${prog.program_name}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const pathLabel = getChanceCategory(probability);
      const block = getCollegeBlock(college.college_name, probability, college.college_type);

      // Format placement values to LPA (raw rupees → LPA)
      const avgLPA = toLPA(prog.placement?.average);
      const highestLPA = toLPA(prog.placement?.highest);
      const placementPct = prog.placement?.placement_percentage ?? null;

      opportunities.push({
        college: college.college_name,
        institute: college.college_name,
        instituteType: college.college_type,
        program: prog.program_name,
        specialization: prog.specialization || '',
        path: pathLabel,
        collegeType: college.college_type,
        tier: college.nirf_rank <= 10 ? 1 : college.nirf_rank <= 50 ? 2 : 3,
        collegeBlock: block,
        location: college.state,
        state: college.state,
        closingScore,
        openingScore,
        year: cutoffEntry.year,
        round: cutoffEntry.round,
        probability,
        avgPlacement: avgLPA,
        highestPlacement: highestLPA,
        medianPlacement: null,
        placementPercentage: placementPct,
        fees: prog.fees || null,
        duration: prog.duration || null,
        seats: prog.seat_intake || null,
      });

      // Track institute → programmes for dedup display
      const inst = college.college_name;
      if (!instituteMap[inst]) instituteMap[inst] = { type: college.college_type, programmes: new Set() };
      instituteMap[inst].programmes.add(prog.program_name);
    }
  }

  opportunities.sort((a, b) => {
    const p = b.probability - a.probability;
    if (Math.abs(p) > 5) return p;
    return (a.tier || 99) - (b.tier || 99);
  });

  // 5-tier grouping matching frontend expectations: Very High/High/Good/Competitive/Dream
  const grouped = { guaranteedColleges: [], veryHighColleges: [], likelyColleges: [], competitiveColleges: [], dreamTierColleges: [] };
  for (const o of opportunities) {
    if (o.probability >= 80) grouped.guaranteedColleges.push(o);
    else if (o.probability >= 60) grouped.veryHighColleges.push(o);
    else if (o.probability >= 40) grouped.likelyColleges.push(o);
    else if (o.probability >= 20) grouped.competitiveColleges.push(o);
    else grouped.dreamTierColleges.push(o);
  }

  const eligibleIITs = new Set(opportunities.filter(o => o.collegeType === 'IIT').map(o => o.college)).size;
  const eligibleNITs = new Set(opportunities.filter(o => o.collegeType === 'NIT').map(o => o.college)).size;
  const eligibleIIITs = new Set(opportunities.filter(o => o.collegeType === 'IIIT').map(o => o.college)).size;
  const eligibleGFTIs = new Set(opportunities.filter(o => o.collegeType === 'GFTI').map(o => o.college)).size;
  const eligibleIISc = new Set(opportunities.filter(o => o.collegeType === 'IISc').map(o => o.college)).size;

  const collegeBlocks = {
    dreamElite: opportunities.filter(o => o.collegeBlock === 'dream_elite'),
    highChanceIits: opportunities.filter(o => o.collegeBlock === 'high_chance_iit'),
    safeNits: opportunities.filter(o => o.collegeBlock === 'safe_nit'),
    backup: opportunities.filter(o => o.collegeBlock === 'backup'),
  };

  // Legacy 4-tier fields for compatibility
  const legacyDream = opportunities.filter(o => o.path === 'Dream');
  const legacyTarget = opportunities.filter(o => o.path === 'Competitive');
  const legacySafe = opportunities.filter(o => o.path === 'High Chance' || o.path === 'Very High Chance');

  // Use gate calculator confidence + adjust for opportunities found
  const dataPoints = opportunities.length;
  const dataReliability = Math.min(1, dataPoints / 30);
  const calcConfidence = gateResult.confidence?.score || 50;
  const confidenceScore = Math.round(Math.min(95, calcConfidence * 0.7 + dataReliability * 30));
  const confidence = confidenceScore >= 70 ? 'High' : confidenceScore >= 45 ? 'Medium' : 'Low';

  // College counts
  const totalColleges = colleges.length;
  const totalProgrammes = colleges.reduce((s, c) => s + (c.programs?.length || 0), 0);

  const totalIITs = colleges.filter(c => c.college_type === 'IIT').length;
  const totalNITs = colleges.filter(c => c.college_type === 'NIT').length;
  const totalIIITs = colleges.filter(c => c.college_type === 'IIIT').length;
  const totalGFTIs = colleges.filter(c => c.college_type === 'GFTI').length;
  const totalIISc = colleges.filter(c => c.college_type === 'IISc').length;
  const totalPrivate = colleges.filter(c => c.college_type === 'Private').length;

  console.log(`[LocalPredictor] Result: score=${gateScore} rank=${estimatedRank} opportunities=${opportunities.length} colleges=${totalColleges} programmes=${totalProgrammes}`);

  return {
    dreamColleges: legacyDream,
    targetColleges: legacyTarget,
    safeColleges: legacySafe,
    predictedScore: gateScore,
    predictedRank: estimatedRank,
    predictedPercentile: Math.min(99.99, Math.max(0.01, Math.round((1 - estimatedRank / 200000) * 10000) / 100)),
    airRange,
    confidence,
    confidenceScore,
    isQualified,
    qualifyingCutoff: gateResult.formula.Mq,
    gateFormula: gateResult.formula,
    confidenceFactors: gateResult.confidence?.factors || {},
    officialData: gateResult.officialData || ['Qualifying Marks', 'Formula', 'Score Constants'],
    estimatedData: gateResult.estimatedData || ['Mt (not published by IITs)', 'AIR Range'],
    gateScoreDetails: gateResult,
    totalOpportunities: opportunities.length,
    totalDataPoints: opportunities.length,
    totalColleges,
    totalProgrammes,
    totalIITs, totalNITs, totalIIITs, totalGFTIs, totalIISc, totalPrivate,
    totalOther: 0,
    databaseCoverage: opportunities.length,
    databaseStats: {
      totalInstitutes: colleges.length,
      totalProgrammes,
      sources: ['CCMT 2024', 'GATE Score Calculator v2.0'],
      yearsAvailable: [2024],
      instituteBreakdown: { IIT: totalIITs, NIT: totalNITs, IIIT: totalIIITs, GFTI: totalGFTIs, IISc: totalIISc, Private: totalPrivate },
      matchedProgrammes: opportunities.length,
      dataFreshness: 'Updated for GATE 2024 counselling data',
    },
    eligibleIITs, eligibleNITs, eligibleIIITs, eligibleGFTIs, eligibleIISc, eligibleIIEST: 0,
    opportunities,
    collegeBlocks,
    ...grouped,
    branchRecommendations: [],
    admissionProbability: opportunities.length > 0 ? Math.round(opportunities.filter(o => o.probability > 50).length / opportunities.length * 100) : 0,
    whyThisPrediction: `Based on your estimated GATE Score of ${gateScore} (AIR ${airRange.low}-${airRange.high}) in ${paper} (${category}), you have ${opportunities.length} potential opportunities across ${eligibleIITs} IITs, ${eligibleNITs} NITs, ${eligibleIIITs} IIITs. Score calculated using official GATE formula: S = 350 + 550 x (M - ${gateResult.formula.Mq}) / (${gateResult.formula.Mt} - ${gateResult.formula.Mq}).`,
    dataQuality: dataPoints > 15 ? 'Good' : dataPoints > 5 ? 'Limited' : 'Poor',
    baseYear,
    datasetsUsed: ['cse-cutoffs-static', 'gate-score-calculator'],
    recommendations: [],
    _debug: {
      dbRecordsByType: 'static-fallback',
      filteredCcmtCount: opportunities.length,
      allCcmtCutoffs: colleges.length,
      marksScoreData: gateScore,
      scoreRankData: estimatedRank,
      databaseCoverage: opportunities.length,
      recommendedCount: opportunities.length,
      recommendedSkipped: 0,
    },
  };
}

module.exports = { localPredict };
