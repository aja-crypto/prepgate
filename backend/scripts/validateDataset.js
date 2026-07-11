// Dataset Validation Script
// Run: node scripts/validateDataset.js
// Validates CCMT cutoffs, seat matrix, and score mappings for quality

const mongoose = require('mongoose');
const CcmtCutoff = require('../src/models/CcmtCutoff');
const GateMarksScore = require('../src/models/GateMarksScore');
const GateScoreRank = require('../src/models/GateScoreRank');
const SeatMatrix = require('../src/models/SeatMatrix');
const CollegeProgram = require('../src/models/CollegeProgram');

async function validate() {
  const results = { passed: 0, failed: 0, warnings: 0, issues: [] };

  const check = (name, cond, severity) => {
    if (cond) { results.passed++; console.log(`  PASS  ${name}`); }
    else { results.failed++; results.issues.push({ name, severity }); console.log(`  ${severity === 'FAIL' ? 'FAIL' : 'WARN'} ${name}`); }
  };

  console.log('\n=== CCMT CUTOFFS ===');
  const ccmt = await CcmtCutoff.find().lean();
  check(`Total records: ${ccmt.length}`, ccmt.length > 0, 'FAIL');
  check('No duplicate rows', (ccmt.length === new Set(ccmt.map(r => `${r.year}|${r.institute}|${r.program}|${r.category}|${r.round}`)).size), 'FAIL');
  check('No null institutes', ccmt.every(r => r.institute), 'FAIL');
  check('No null programs', ccmt.every(r => r.program), 'FAIL');
  check('No null closing scores', ccmt.every(r => r.closingScore != null), 'FAIL');
  check('No null years', ccmt.every(r => r.year != null), 'FAIL');
  check('No invalid scores (≤0 or >1000)', ccmt.every(r => r.closingScore > 0 && r.closingScore <= 1000), 'FAIL');
  check('Valid categories', ccmt.every(r => ['General','EWS','OBC-NCL','SC','ST','PwD'].includes(r.category)), 'FAIL');
  check('Valid institute types', ccmt.every(r => ['IIT','NIT','IIIT','GFTI','Other','Private'].includes(r.instituteType)), 'FAIL');
  check('Years 2022-2026 covered', [2022,2023,2024,2025,2026].every(y => ccmt.some(r => r.year === y)), 'WARN');
  check('PwD data present', ccmt.some(r => r.category === 'PwD'), 'WARN');
  const cats = [...new Set(ccmt.map(r => r.category))];
  if (cats.length < 6) console.log(`  INFO  Missing categories: ${['General','EWS','OBC-NCL','SC','ST','PwD'].filter(c => !cats.includes(c)).join(', ')}`);

  console.log('\n=== MARKS→SCORE MAPPING ===');
  const marksScore = await GateMarksScore.find().lean();
  check(`Total records: ${marksScore.length}`, marksScore.length >= 2, 'FAIL');
  if (marksScore.length >= 2) {
    check('No null marks', marksScore.every(r => r.marks != null), 'FAIL');
    check('No null scores', marksScore.every(r => r.score != null), 'FAIL');
    check('Valid score range (0-1000)', marksScore.every(r => r.score >= 0 && r.score <= 1000), 'FAIL');
    check('Valid marks range (0-100)', marksScore.every(r => r.marks >= 0 && r.marks <= 100), 'FAIL');
    check('Marks are unique', marksScore.length === new Set(marksScore.map(r => r.marks)).size, 'WARN');
  }

  console.log('\n=== SCORE→RANK MAPPING ===');
  const scoreRank = await GateScoreRank.find().lean();
  check(`Total records: ${scoreRank.length}`, scoreRank.length >= 2, 'FAIL');
  if (scoreRank.length >= 2) {
    check('No null scores', scoreRank.every(r => r.score != null), 'FAIL');
    check('No null ranks', scoreRank.every(r => r.rank != null), 'FAIL');
    check('Ranks are positive', scoreRank.every(r => r.rank > 0), 'FAIL');
    check('Scores are unique', scoreRank.length === new Set(scoreRank.map(r => r.score)).size, 'WARN');
  }

  console.log('\n=== SEAT MATRIX ===');
  const seats = await SeatMatrix.find().lean();
  check(`Total records: ${seats.length}`, seats.length > 0, 'WARN');
  if (seats.length > 0) {
    check('No null institute', seats.every(r => r.institute), 'FAIL');
    check('No null program', seats.every(r => r.program), 'FAIL');
    check('No null totalSeats', seats.every(r => r.totalSeats != null), 'WARN');
  }

  console.log('\n=== COLLEGE PROGRAMS ===');
  const programs = await CollegeProgram.find().lean();
  check(`Total records: ${programs.length}`, programs.length > 0, 'WARN');
  if (programs.length > 0) {
    const noPlacement = programs.filter(r => !r.avgPlacement);
    const noFees = programs.filter(r => !r.fees);
    check(`Missing placement data: ${noPlacement.length}`, noPlacement.length <= programs.length * 0.2, 'WARN');
    check(`Missing fees data: ${noFees.length}`, noFees.length <= programs.length * 0.2, 'WARN');
  }

  console.log('\n========================================');
  console.log(`  PASSED: ${results.passed}`);
  console.log(`  FAILED: ${results.failed}`);
  console.log(`  WARNINGS: ${results.warnings}`);
  console.log('========================================');
  console.log(`  QUALITY SCORE: ${Math.round((results.passed / (results.passed + results.failed + results.warnings)) * 100)}%`);
  console.log('========================================\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gate2027')
  .then(() => { console.log('Connected to MongoDB'); return validate(); })
  .catch(e => { console.error('Connection failed:', e.message); process.exit(1); });
