const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const _cache = {};

function loadJSON(fp) {
  if (_cache[fp]) return _cache[fp];
  if (!fs.existsSync(fp)) return null;
  try {
    return _cache[fp] = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch { return null; }
}

function yearFilePath(year, filename) {
  return path.join(DATA_DIR, String(year), filename);
}

/**
 * Official GATE Score formula:
 * S = Sq + ((St - Sq) / (Mt - Mq)) x (M - Mq)
 *
 * Single-session papers (CS, DA) skip normalization.
 * Multi-session papers apply the official normalization formula.
 */
function calculateGateScore(marks, paper, category, year) {
  const constants = loadJSON(path.join(DATA_DIR, 'score_constants.json'));
  if (!constants) return { error: 'Required dataset missing: score_constants.json' };

  const qualifying = loadJSON(yearFilePath(year, 'qualifying.json'));
  if (!qualifying) return { error: `Qualifying marks data not found for ${year}.` };

  const mtFile = loadJSON(yearFilePath(year, 'mt.json'));
  if (!mtFile) return { error: `Mt estimates not found for ${year}.` };

  const Sq = constants.Sq;
  const St = constants.St;
  const paperData = qualifying.papers?.[paper];
  const mtPaperData = mtFile.papers?.[paper];

  if (!paperData) return { error: `Paper "${paper}" not found in ${year} database.` };
  if (!mtPaperData) return { error: `Mt estimate not found for ${paper} in ${year}.` };

  const CATEGORY_MAP = { 'General': 'GEN', 'GEN': 'GEN', 'OBC': 'OBC-NCL', 'OBC-NCL': 'OBC-NCL', 'SC': 'SC', 'ST': 'ST', 'EWS': 'EWS', 'PwD': 'PwD', 'PWD': 'PwD' };
  const dbCat = CATEGORY_MAP[category] || category;
  const Mq = paperData.qualifying_marks?.[dbCat];
  if (Mq === undefined) return { error: `Category "${category}" not found for ${paper} ${year}. Available: ${Object.keys(paperData.qualifying_marks || {}).join(', ')}` };

  const Mt = mtPaperData.Mt;
  if (!Mt) return { error: `Mt value missing for ${paper} ${year}.` };

  const M = Math.max(0, Math.min(100, marks));
  const needsNormalization = paperData.multi_session === true;

  let S;
  if (M <= Mq) {
    S = Sq;
  } else {
    S = Sq + ((St - Sq) / (Mt - Mq)) * (M - Mq);
  }
  S = Math.round(Math.min(1000, Math.max(0, S)));

  return {
    value: S,
    type: 'Estimated',
    rawMarks: M,
    paper,
    category,
    year: Number(year),
    formula: {
      Sq, St, Mq, Mt,
      normalized: needsNormalization,
      expression: 'S = Sq + ((St - Sq) / (Mt - Mq)) x (M - Mq)',
    },
    mtConfidence: mtPaperData.confidence || 'Low',
    mtSource: mtPaperData.source || 'Estimated from historical data',
    officialData: ['Qualifying Marks', 'Formula', 'Score Constants'],
    estimatedData: ['Mt (not published by IITs)'],
  };
}

/**
 * Estimate AIR from GATE Score using historical mapping.
 * Uses the year-specific air_mapping.json for the given paper.
 */
function estimateAIR(gateScore, paper, year) {
  // Load candidate statistics for AIR ceiling
  const stats = loadJSON(yearFilePath(year, 'statistics.json'));
  const maxCandidates = stats?.papers?.[paper]?.appeared || null;
  const registered = stats?.papers?.[paper]?.registered || null;

  const mapping = loadJSON(yearFilePath(year, 'air_mapping.json'));
  if (!mapping) {
    // Fallback: try other years
    const years = fs.readdirSync(DATA_DIR).filter(d => /^\d{4}$/.test(d)).sort().reverse();
    for (const y of years) {
      const alt = loadJSON(yearFilePath(y, 'air_mapping.json'));
      if (alt?.papers?.[paper]) {
        const fallbackStats = loadJSON(yearFilePath(y, 'statistics.json'));
        const fbCap = fallbackStats?.papers?.[paper]?.appeared || maxCandidates;
        const fallback = interpolateAIR(gateScore, alt.papers[paper], fbCap);
        if (fallback) return { ...fallback, note: `Using ${y} data — ${year} not available.` };
      }
    }
    return { error: `AIR mapping not available for ${paper}.` };
  }

  const paperMapping = mapping.papers?.[paper];
  if (!paperMapping) return { error: `AIR mapping not found for ${paper} in ${year}.` };

  const result = interpolateAIR(gateScore, paperMapping, maxCandidates);
  if (result && stats?.papers?.[paper]) {
    result.candidateStats = { registered, appeared: maxCandidates, year };
  }
  return result;
}

function interpolateAIR(score, points, maxCandidates = null) {
  if (!points || points.length === 0) return null;
  const sorted = [...points].sort((a, b) => b.score - a.score);
  const cap = maxCandidates || Infinity;

  if (score >= sorted[0].score) return {
    range: { low: 1, high: sorted[0].air },
    interpolatedAIR: Math.round(sorted[0].air / 2),
    confidence: 'Medium',
    historicalBasis: `Score ${score} is at or above the highest mapped point (${sorted[0].score}→AIR ${sorted[0].air}).`,
  };

  if (score < sorted[sorted.length - 1].score) {
    const last = sorted[sorted.length - 1];
    const extrapolated = Math.round(last.air * (1 + (last.score - score) / last.score));
    const boundedLow = cap ? Math.min(extrapolated, cap) : extrapolated;
    const rangeLow = Math.min(last.air, boundedLow);
    const rangeHigh = Math.max(last.air, boundedLow);
    return {
      range: { low: rangeLow, high: rangeHigh },
      interpolatedAIR: Math.round((rangeLow + rangeHigh) / 2),
      confidence: 'Low',
      historicalBasis: `Score ${score} is below the lowest mapped point (${last.score}→AIR ${last.air}). Extrapolated${cap ? ' (capped at ' + cap.toLocaleString() + ' total candidates)' : ''}.`,
    };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    if (score <= sorted[i].score && score >= sorted[i + 1].score) {
      const upper = sorted[i];
      const lower = sorted[i + 1];
      const ratio = (score - lower.score) / (upper.score - lower.score);
      const interpolated = Math.round(lower.air + (upper.air - lower.air) * ratio);
      const spread = 0.25; // ±25% range
      return {
        range: { low: Math.max(1, Math.round(interpolated * (1 - spread))), high: Math.round(interpolated * (1 + spread)) },
        interpolatedAIR: interpolated,
        confidence: 'Medium',
        historicalBasis: `Interpolated from ${upper.score}→AIR ${upper.air} and ${lower.score}→AIR ${lower.air}.`,
      };
    }
  }
  return null;
}

/**
 * Full prediction pipeline: marks → GATE Score → AIR Range
 */
function predict(marks, paper, category, year) {
  const scoreResult = calculateGateScore(marks, paper, category, year);
  if (scoreResult.error) return { error: scoreResult.error };

  const airResult = estimateAIR(scoreResult.value, paper, year);

  // Cap AIR high to total appeared candidates (data-driven ceiling)
  if (airResult && airResult.range && airResult.candidateStats) {
    const appeared = airResult.candidateStats.appeared;
    airResult.range.high = Math.min(airResult.range.high, appeared);
    airResult.range.low = Math.min(airResult.range.low, appeared);
  }

  // Confidence calculation with breakdown
  let score = 50;
  const factors = { officialFormula: true, officialQualifyingMarks: true, estimatedMt: true, historicalAIR: false };

  if (scoreResult.mtConfidence === 'High') score += 20;
  else if (scoreResult.mtConfidence === 'Medium') score += 10;

  if (marks > 20 && marks < 90) score += 10;
  else score += 5;

  if (airResult && !airResult.error) {
    factors.historicalAIR = true;
    if (airResult.confidence === 'Medium') score += 15;
    else if (airResult.confidence === 'High') score += 20;
    else score += 5;
  }

  if (scoreResult.formula.Mq > 0) score += 10;

  const finalScore = Math.min(95, Math.max(10, score));
  const label = finalScore >= 70 ? 'High' : finalScore >= 45 ? 'Medium' : 'Low';

  return {
    marks,
    paper,
    category,
    year: Number(year),
    gateScore: { value: scoreResult.value, type: scoreResult.type },
    air: airResult?.error ? { error: airResult.error } : {
      range: airResult.range,
      interpolatedAIR: airResult.interpolatedAIR,
      historicalBasis: airResult.historicalBasis,
    },
    formula: scoreResult.formula,
    confidence: { score: finalScore, label, factors },
    officialData: scoreResult.officialData,
    estimatedData: scoreResult.estimatedData,
    mtSource: scoreResult.mtSource,
    disclaimer: 'GATE Score and AIR are estimated using official GATE formulas, published qualifying marks, and historical counselling data. Mt (average marks of top 0.1% candidates) is not officially published by IITs and is estimated from historical score distributions. Results should be treated as guidance only.',
  };
}

module.exports = { calculateGateScore, estimateAIR, predict };
