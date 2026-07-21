const path = require('path');
const fs = require('fs');

let staticCutoffs = null;
function loadStaticCutoffs() {
  if (staticCutoffs) return staticCutoffs;
  const filePath = path.join(__dirname, '../../data/cse-cutoffs.json');
  if (fs.existsSync(filePath)) {
    staticCutoffs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`[LocalPredictor] Loaded ${staticCutoffs.length} colleges from static data`);
  } else {
    staticCutoffs = [];
    console.warn('[LocalPredictor] cse-cutoffs.json not found');
  }
  return staticCutoffs;
}

const CATEGORY_MAP = { 'General': 'GEN', 'OBC': 'OBC', 'OBC-NCL': 'OBC', 'SC': 'SC', 'ST': 'ST', 'EWS': 'EWS', 'PwD': 'PWD', 'PWD': 'PWD' };
const ROUND_PRIORITY = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };

function marksToRank(marks) {
  return Math.round(Math.pow(2, (65 - marks) / 4) * 150);
}

function marksToPercentile(marks, rank) {
  return Math.max(0.1, Math.round((1 - rank / 150000) * 10000) / 100);
}

function calcProbability(estimatedRank, opening, closing) {
  if (!closing || closing <= 0) return 0;
  if (estimatedRank <= opening) return Math.min(100, Math.round((1 - (estimatedRank - 1) / closing) * 100));
  if (estimatedRank <= closing) {
    const ratio = (closing - estimatedRank) / (closing - opening);
    return Math.round(Math.max(10, ratio * 60));
  }
  const deficit = (estimatedRank - closing) / closing;
  return Math.round(Math.max(0, 10 - deficit * 20));
}

function getCollegeBlock(collegeName, probability, collegeType) {
  const ELITE = ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IISc Bangalore'];
  if (ELITE.some(n => collegeName.includes(n)) && probability >= 40) return 'dream_elite';
  if (collegeType === 'IIT' && probability >= 40) return 'high_chance_iit';
  if (collegeType === 'NIT' && probability >= 70) return 'safe_nit';
  return 'backup';
}

function getChanceCategory(probability) {
  if (probability >= 90) return 'Very High Chance';
  if (probability >= 70) return 'High Chance';
  if (probability >= 50) return 'Good Chance';
  if (probability >= 25) return 'Competitive';
  return 'Dream';
}

function localPredict(input) {
  const {
    expectedMarks, category = 'General', paper = 'CS',
    admissionType = 'M.Tech', preferredState = '', collegeType = 'Any',
  } = input;

  const marks = Math.min(100, Math.max(0, expectedMarks));
  const estimatedRank = marksToRank(marks);
  const estimatedPercentile = marksToPercentile(marks, estimatedRank);
  const isQualified = marks >= 25;
  const dbCategory = CATEGORY_MAP[category] || 'GEN';

  const colleges = loadStaticCutoffs();
  const opportunities = [];
  const seen = new Set();

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
      const closingRank = catData.closing;
      const openingRank = catData.opening || 1;

      const probability = calcProbability(estimatedRank, openingRank, closingRank);
      if (probability <= 0) continue;

      const key = `${college.college_name}|${prog.program_name}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const path = getChanceCategory(probability);
      const block = getCollegeBlock(college.college_name, probability, college.college_type);

      opportunities.push({
        college: college.college_name,
        institute: college.college_name,
        instituteType: college.college_type,
        program: prog.program_name,
        specialization: prog.specialization || '',
        path,
        collegeType: college.college_type,
        tier: college.nirf_rank <= 10 ? 1 : college.nirf_rank <= 50 ? 2 : 3,
        collegeBlock: block,
        location: college.state,
        state: college.state,
        closingScore: closingRank,
        openingScore: openingRank,
        year: cutoffEntry.year,
        round: cutoffEntry.round,
        probability,
        avgPlacement: prog.placement?.average || null,
        highestPlacement: prog.placement?.highest || null,
        fees: prog.fees || null,
        duration: prog.duration || null,
        seats: prog.seat_intake || null,
      });
    }
  }

  opportunities.sort((a, b) => {
    const p = b.probability - a.probability;
    if (Math.abs(p) > 5) return p;
    return (a.tier || 99) - (b.tier || 99);
  });

  const grouped = { guaranteedColleges: [], veryHighColleges: [], likelyColleges: [], competitiveColleges: [], dreamTierColleges: [] };
  for (const o of opportunities) {
    if (o.probability >= 90) grouped.guaranteedColleges.push(o);
    else if (o.probability >= 70) grouped.veryHighColleges.push(o);
    else if (o.probability >= 50) grouped.likelyColleges.push(o);
    else if (o.probability >= 25) grouped.competitiveColleges.push(o);
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

  // Legacy 4-tier fields for generateAiReport compatibility
  const legacyDream = opportunities.filter(o => o.path === 'Dream');
  const legacyTarget = opportunities.filter(o => o.path === 'Competitive');
  const legacySafe = opportunities.filter(o => o.path === 'High Chance' || o.path === 'Very High Chance');

  return {
    dreamColleges: legacyDream,
    targetColleges: legacyTarget,
    safeColleges: legacySafe,
    predictedScore: marks,
    predictedRank: estimatedRank,
    predictedPercentile: +estimatedPercentile.toFixed(2),
    airRange: { low: Math.max(1, Math.round(estimatedRank * 0.8)), high: Math.round(estimatedRank * 1.3) },
    confidence: estimatedRank < 500 ? 'High' : estimatedRank < 10000 ? 'Medium' : 'Low',
    confidenceScore: estimatedRank < 500 ? 85 : estimatedRank < 10000 ? 60 : 35,
    isQualified,
    qualifyingCutoff: 25,
    totalOpportunities: opportunities.length,
    totalDataPoints: opportunities.length,
    totalIITs: colleges.filter(c => c.college_type === 'IIT').length,
    totalNITs: colleges.filter(c => c.college_type === 'NIT').length,
    totalIIITs: colleges.filter(c => c.college_type === 'IIIT').length,
    totalGFTIs: colleges.filter(c => c.college_type === 'GFTI').length,
    totalPrivate: 0,
    totalIISc: colleges.filter(c => c.college_type === 'IISc').length,
    totalOther: 0,
    databaseCoverage: opportunities.length,
    eligibleIITs, eligibleNITs, eligibleIIITs, eligibleGFTIs, eligibleIISc, eligibleIIEST: 0,
    opportunities,
    collegeBlocks,
    ...grouped,
    branchRecommendations: [],
    admissionProbability: opportunities.length > 0 ? Math.round(opportunities.filter(o => o.probability > 50).length / opportunities.length * 100) : 0,
    whyThisPrediction: `Based on your estimated rank of ~${estimatedRank.toLocaleString()} in GATE ${paper} (${category}), you have ${opportunities.length} potential opportunities.`,
    dataQuality: opportunities.length > 10 ? 'Good' : 'Limited',
    baseYear: 2024,
    datasetsUsed: ['cse-cutoffs-static'],
    recommendations: [],
    _debug: {
      dbRecordsByType: 'static-fallback',
      filteredCcmtCount: opportunities.length,
      allCcmtCutoffs: colleges.length,
      marksScoreData: 0,
      scoreRankData: 0,
      databaseCoverage: opportunities.length,
      recommendedCount: opportunities.length,
      recommendedSkipped: 0,
    },
  };
}

module.exports = { localPredict };
