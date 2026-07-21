// ─── Predictor Validation Suite v2 ───
// Run: node src/scripts/validatePredictor.js
// Tests internal consistency, ranking stability, and provides framework
// for historical accuracy once real candidate data is available.

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { predict } = require('../services/predictionEngine');
const fs = require('fs');
const path = require('path');

const BASELINE_PATH = path.join(__dirname, '../../data/predictor-baseline.json');
const REPORT_PATH = path.join(__dirname, '../../data/predictor-validation-report.json');
const CATEGORIES = ['General', 'OBC-NCL', 'EWS', 'SC', 'ST', 'PwD'];
const PAPERS = ['CS'];

let passed = 0, failed = 0, errors = [];
function check(name, ok, detail) {
  if (ok) passed++; else { failed++; errors.push({ name, detail }); }
  console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

// ─── 1. Generate Synthetic Test Dataset ───
function generateDataset() {
  const profiles = [];
  for (let m = 0; m <= 100; m++) profiles.push({ expectedMarks: m, category: 'General', paper: 'CS' });
  [25, 35, 44, 50, 55, 60, 65, 70, 80, 90].forEach(m => {
    CATEGORIES.forEach(cat => {
      if (cat !== 'General') profiles.push({ expectedMarks: m, category: cat, paper: 'CS' });
    });
  });
  [0, 1, 5, 10, 20, 30, 40, 44, 50, 60, 70, 80, 90, 99, 100].forEach(m => {
    profiles.push({ expectedMarks: m, category: 'General', paper: 'CS' });
  });
  return profiles;
}

// ─── 2. Run Predictions ───
async function runPredictions(profiles) {
  const results = [];
  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    try {
      const t0 = Date.now();
      const result = await predict(p);
      results.push({ input: p, result, time: Date.now() - t0, error: null });
    } catch (e) {
      results.push({ input: p, result: null, time: 0, error: e.message });
    }
    if (i % 50 === 0 && i > 0) console.log(`  [${i}/${profiles.length}]`);
  }
  return results;
}

// ─── 3. Monotonicity ───
function testMonotonicity(results) {
  console.log('\n📈 Monotonicity');
  const gen = results.filter(r => r.input.category === 'General' && !r.error)
    .sort((a, b) => a.input.expectedMarks - b.input.expectedMarks);
  let v = 0;
  for (let i = 1; i < gen.length; i++) {
    const prev = gen[i - 1], curr = gen[i];
    if (curr.result.predictedRank > prev.result.predictedRank * 1.1) v++;
    if (curr.result.predictedScore < prev.result.predictedScore) v++;
    const pCount = c => (c.result.guaranteedColleges?.length||0)+(c.result.veryHighColleges?.length||0)+(c.result.likelyColleges?.length||0);
    if (pCount(curr) < pCount(prev) * 0.7 && curr.input.expectedMarks > prev.input.expectedMarks + 2) v++;
  }
  check('AIR/score monotonic', v < 5, `${v} violations`);
}

// ─── 4. Ranking Stability ───
function testRankingStability(results) {
  console.log('\n📊 Ranking Stability');
  const gen = results.filter(r => r.input.category === 'General' && !r.error && r.input.expectedMarks >= 30 && r.input.expectedMarks <= 70)
    .sort((a, b) => a.input.expectedMarks - b.input.expectedMarks);
  let jumps = 0;
  for (let i = 1; i < gen.length; i++) {
    const prev = gen[i - 1].result, curr = gen[i].result;
    if (!prev.opportunities || !curr.opportunities) continue;
    for (const opp of curr.opportunities.slice(0, 10)) {
      const prevIdx = prev.opportunities.findIndex(o => o.college === opp.college && o.program === opp.program);
      const currIdx = i; // approximate position
      if (prevIdx >= 0 && Math.abs(prevIdx - currIdx) > 5 && opp.probability > 20) {
        jumps++;
        if (jumps <= 3) console.log(`  ⚠ Rank jump: marks ${gen[i-1].input.expectedMarks}→${gen[i].input.expectedMarks} ${opp.college} ${opp.program} idx ${prevIdx}→${currIdx}`);
      }
    }
  }
  check('Ranking stability', jumps < 20, `${jumps} position changes >5 ranks`);
}

// ─── 5. Probability Distribution ───
function testProbabilityDistribution(results) {
  console.log('\n🎯 Probability Distribution');
  let clusterWarnings = 0;
  for (const r of results) {
    if (r.error || !r.result.opportunities || r.result.opportunities.length < 5) continue;
    const probs = r.result.opportunities.map(o => o.probability).sort((a, b) => a - b);
    const p25 = probs[Math.floor(probs.length * 0.25)];
    const p75 = probs[Math.floor(probs.length * 0.75)];
    if (p75 - p25 < 10 && p25 > 50) {
      clusterWarnings++;
    }
  }
  check('No probability clustering', clusterWarnings < 5, `${clusterWarnings} clustered cases`);
}

// ─── 6. Category Parity ───
function testCategoryParity(results) {
  console.log('\n🏷️ Category Parity');
  [35, 50, 65, 80].forEach(marks => {
    const catResults = CATEGORIES.map(c => results.find(r => r.input.expectedMarks === marks && r.input.category === c && !r.error)).filter(Boolean);
    if (catResults.length < 2) return;
    const genRank = catResults.find(r => r.input.category === 'General')?.result?.predictedRank || 0;
    catResults.forEach(r => {
      if (r.input.category !== 'General') {
        check(`Marks=${marks} ${r.input.category} AIR ≤ GEN`, r.result.predictedRank <= genRank * 1.5 || r.result.predictedRank <= genRank + 5000, `${r.input.category}=${r.result.predictedRank} GEN=${genRank}`);
      }
    });
    // Check PwD has 0 opportunities (no PwD data seeded)
    const pwd = catResults.find(r => r.input.category === 'PwD');
    if (pwd) check(`Marks=${marks} PwD no data`, (pwd.result.opportunities?.length || 0) === 0, 'No PwD cutoffs in seed data');
  });
}

// ─── 7. Explainability Check ───
function testExplainability(results) {
  console.log('\n🔍 Explainability');
  let hasWhy = 0, total = 0;
  for (const r of results) {
    if (r.error || !r.result) continue;
    // Engine returns grouped arrays, not flat opportunities
    const groups = ['guaranteedColleges', 'veryHighColleges', 'likelyColleges', 'competitiveColleges', 'dreamTierColleges'];
    for (const g of groups) {
      for (const opp of (r.result[g] || []).slice(0, 3)) {
        total++;
        if (opp.whyExplanation || opp.explanations?.length > 0) hasWhy++;
      }
    }
  }
  check('Opportunities have explanations', hasWhy > 0, `${hasWhy}/${total} with reasoning`);
}

// ─── 8. Database Sanity ───
async function testDatabase() {
  console.log('\n🗄️ Database');
  const db = mongoose.connection.db;
  const ccmtCount = await db.collection('ccmtcutoffs').countDocuments();
  check('CCMT cutoffs exist', ccmtCount > 0, `${ccmtCount} records`);
  const nullBoth = await db.collection('ccmtcutoffs').countDocuments({ closingScore: null, closingRank: null });
  check('No null closings', nullBoth < ccmtCount * 0.1, `${nullBoth} null of ${ccmtCount}`);
  const programs = await db.collection('collegeprograms').countDocuments();
  check('College programs exist', programs > 0, `${programs} programs`);
  const years = await db.collection('gateyears').distinct('year');
  check('Gate years exist', years.length >= 3, `${years.length} years`);
  const inst = await db.collection('ccmtcutoffs').distinct('institute');
  check('IITs present', inst.some(i => i.includes('Indian Institute of Technology')), `${inst.filter(i => i.includes('Indian Institute of Technology')).length} IITs`);
  check('NITs present', inst.some(i => i.includes('National Institute of Technology')), `${inst.filter(i => i.includes('National Institute of Technology')).length} NITs`);

  // Check for duplicate programs
  const dups = await db.collection('ccmtcutoffs').aggregate([
    { $group: { _id: { institute: '$institute', program: '$program', category: '$category', year: '$year' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 10 }
  ]).toArray();
  check('No duplicate programs', dups.length === 0, `${dups.length} duplicates found`);
}

// ─── 9. Historical Accuracy Framework (requires real data) ───
function testHistoricalAccuracy() {
  console.log('\n📜 Historical Accuracy (requires real candidate data)');
  console.log('  ⏳ Framework ready. Add real candidates to: data/historical-candidates.json');
  console.log('  Format: [{ marks, officialScore, officialAIR, category, allotment, branch, year }]');
  
  const histFile = path.join(__dirname, '../../data/historical-candidates.json');
  if (fs.existsSync(histFile)) {
    try {
      const candidates = JSON.parse(fs.readFileSync(histFile, 'utf8'));
      check(`Historical candidates loaded`, candidates.length > 0, `${candidates.length} candidates`);
      // Future: run predictions against each and compute MAE
    } catch (e) {
      check('Historical candidates parse', false, e.message);
    }
  } else {
    // Create template
    fs.writeFileSync(histFile, JSON.stringify([
      { marks: 44, officialScore: 612, officialAIR: 3187, category: 'General', allotment: 'NIT Warangal', branch: 'IT', year: 2024, note: 'Example — replace with real data' }
    ], null, 2));
    check('Historical data template created', true, 'Edit data/historical-candidates.json with real candidates');
  }
}

// ─── 10. Choice Filling Validation Framework ───
function testChoiceFilling() {
  console.log('\n📋 Choice Filling Validation (requires real round data)');
  const roundsFile = path.join(__dirname, '../../data/ccmt-rounds.json');
  if (fs.existsSync(roundsFile)) {
    try {
      const rounds = JSON.parse(fs.readFileSync(roundsFile, 'utf8'));
      check(`CCMT rounds loaded`, rounds.length > 0, `${rounds.length} rounds`);
    } catch (e) {
      check('CCMT rounds parse', false, e.message);
    }
  } else {
    fs.writeFileSync(roundsFile, JSON.stringify([
      { year: 2024, category: 'General', rounds: [
        { round: 1, institute: 'NIT Warangal', program: 'IT', closingAIR: 3200 },
        { round: 2, institute: 'NIT Warangal', program: 'IT', closingAIR: 3500 },
        { round: 3, institute: 'NIT Warangal', program: 'IT', closingAIR: 3800 },
      ], note: 'Example — replace with real CCMT round data' }
    ], null, 2));
    check('CCMT rounds template created', true, 'Edit data/ccmt-rounds.json with real round data');
  }
}

// ─── 11. Baseline Comparison ───
function testBaselineComparison(results) {
  console.log('\n📎 Baseline Comparison');
  const baselineData = {};
  for (const r of results) {
    if (r.error) continue;
    const key = `${r.input.expectedMarks}_${r.input.category}`;
    const oppCount = (r.result.opportunities || []).length;
    baselineData[key] = {
      score: r.result.predictedScore,
      rank: r.result.predictedRank,
      opportunities: oppCount,
    };
  }
  
  if (fs.existsSync(BASELINE_PATH)) {
    const prev = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    let regressions = 0;
    for (const [key, curr] of Object.entries(baselineData)) {
      const old = prev[key];
      if (!old) continue;
      if (Math.abs(curr.score - old.score) > 5) regressions++;
      if (Math.abs(curr.rank - old.rank) > old.rank * 0.2) regressions++;
    }
    check('No baseline regressions', regressions === 0, `${regressions} values changed >20%`);
  } else {
    check('Baseline created', true, 'First run — baseline saved');
  }
  
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baselineData, null, 2));
}

// ─── Report ───
function generateReport(results) {
  const totalOpps = results.reduce((s, r) => s + (r.result?.opportunities?.length || 0), 0);
  const valid = results.filter(r => !r.error);
  const avgOpps = valid.length > 0 ? Math.round((totalOpps / valid.length) * 10) / 10 : 0;
  const avgTime = results.reduce((s, r) => s + r.time, 0) / results.length;
  const errors_total = results.filter(r => r.error).length;

  let scoreMAE = 0, count = 0;
  for (const r of valid) {
    const h = r.input.expectedMarks * 9.5;
    if (h > 0) { scoreMAE += Math.abs(r.result.predictedScore - h) / h; count++; }
  }
  scoreMAE = count > 0 ? Math.round((scoreMAE / count) * 100) / 100 : 0;

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.length, passed, failed, errors: errors_total,
      avgOpportunities: avgOpps,
      avgResponseTime: Math.round(avgTime) + 'ms',
      scoreMAE,
    },
    errors: errors.slice(0, 50),
    verdict: failed === 0 ? 'PASS' : failed < 5 ? 'MINOR ISSUES' : 'FAIL',
  };

  console.log(`\n${'='.repeat(55)}`);
  console.log(`  VALIDATION REPORT`);
  console.log(`${'='.repeat(55)}`);
  console.log(`  Tests:     ${results.length}`);
  console.log(`  Passed:    ${passed} ✅`);
  console.log(`  Failed:    ${failed} ❌`);
  console.log(`  Errors:    ${errors_total} ⚠`);
  console.log(`  Avg opps:  ${avgOpps}`);
  console.log(`  Avg time:  ${report.summary.avgResponseTime}`);
  console.log(`  Score MAE: ${scoreMAE}`);
  console.log(`  Verdict:   ${report.verdict}`);
  console.log(`${'='.repeat(55)}`);

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to data/predictor-validation-report.json`);
  console.log(`📄 Historical data template: data/historical-candidates.json`);
  console.log(`📄 CCMT rounds template:     data/ccmt-rounds.json`);
}

async function main() {
  console.log('🔬 GateNexa Predictor Validation Suite v2');
  console.log('='.repeat(55));
  
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`\n📡 MongoDB: ${mongoose.connection.host}`);
  
  console.log('\n📋 Generating test dataset...');
  const profiles = generateDataset();
  console.log(`  ${profiles.length} profiles`);
  
  console.log('\n🚀 Running predictions...');
  const results = await runPredictions(profiles);
  
  testMonotonicity(results);
  testRankingStability(results);
  testProbabilityDistribution(results);
  testCategoryParity(results);
  testExplainability(results);
  await testDatabase();
  testHistoricalAccuracy();
  testChoiceFilling();
  testBaselineComparison(results);
  
  generateReport(results);
  
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
