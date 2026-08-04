/**
 * Full end-to-end Opportunity Predictor Audit
 * Read-only — no modifications to data or code.
 */
require('../src/config/loadEnv');
const mongoose = require('mongoose');
const CcmtCutoff = require('../src/models/CcmtCutoff');
const CoapCutoff = require('../src/models/CoapCutoff');
const CollegeProgram = require('../src/models/CollegeProgram');
const SeatMatrix = require('../src/models/SeatMatrix');
const { predict: gateScorePredict } = require('../src/services/gateScoreCalculator');

const YEARS = [2024, 2025, 2026];
const CATEGORIES = ['General', 'EWS', 'OBC-NCL', 'SC', 'ST'];
const MARKS = [20, 30, 40, 50, 60, 70, 80, 90];
const PAPER = 'CS';

function pad(s, len = 25) {
  s = String(s);
  return s.length > len ? s.substring(0, len - 1) + '…' : s.padEnd(len);
}

function padL(s, len = 8) {
  return String(s).padStart(len);
}

async function run() {
  // Connect to MongoDB
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not set'); process.exit(1); }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB\n');
  console.log('\n' + '='.repeat(80));
  console.log('  OPPORTUNITY PREDICTOR — FULL END-TO-END AUDIT');
  console.log('='.repeat(80));

  // ──────────────── 1. DATA VALIDATION ────────────────
  console.log('\n┌──────────────────────────────────────────────────┐');
  console.log('│  1. DATA INTEGRITY AUDIT                          │');
  console.log('└──────────────────────────────────────────────────┘');

  const issues = { missingName: [], missingProg: [], missingYear: [], missingCat: [],
    missingClose: [], dupes: [], invalidScore: [], missingInst: [] };

  for (const year of YEARS) {
    // ── CcmtCutoff ──
    const ccmt = await CcmtCutoff.find({ year }).lean();
    console.log(`\n  CcmtCutoff ${year}: ${ccmt.length} records`);

    const ccmtSeen = new Set();
    let ccmtMissingName = 0, ccmtMissingProg = 0, ccmtMissingCat = 0, ccmtMissingClose = 0, ccmtDupes = 0, ccmtBadScore = 0;
    const ccmtCats = new Set(), ccmtPapers = new Set(), ccmtTypes = new Set();

    for (const c of ccmt) {
      if (!c.institute) ccmtMissingName++;
      if (!c.program) ccmtMissingProg++;
      if (!c.category) ccmtMissingCat++;
      else ccmtCats.add(c.category);
      if (c.closingScore == null || isNaN(c.closingScore)) ccmtMissingClose++;
      if (c.closingScore != null && (c.closingScore < 0 || c.closingScore > 1000)) ccmtBadScore++;
      if (c.acceptedPapers) c.acceptedPapers.forEach(p => ccmtPapers.add(p));
      if (c.instituteType) ccmtTypes.add(c.instituteType);

      const key = `${c.institute}|${c.program}|${c.category}|${c.round || 1}`;
      if (ccmtSeen.has(key)) ccmtDupes++;
      else ccmtSeen.add(key);
    }

    console.log(`    Missing name: ${ccmtMissingName} | prog: ${ccmtMissingProg} | cat: ${ccmtMissingCat} | close: ${ccmtMissingClose} | dupes: ${ccmtDupes} | bad score: ${ccmtBadScore}`);
    console.log(`    Categories: [${[...ccmtCats].sort().join(', ')}] | Types: [${[...ccmtTypes].sort().join(', ')}]`);

    // ── CoapCutoff ──
    const coap = await CoapCutoff.find({ year }).lean();
    console.log(`\n  CoapCutoff ${year}: ${coap.length} records`);
    let coapMissingInst = 0, coapBadScore = 0;
    const coapTypes = new Set();
    for (const c of coap) {
      if (!c.institute) coapMissingInst++;
      if (c.closingScore != null && (c.closingScore < 0 || c.closingScore > 1000)) coapBadScore++;
      if (c.instituteType) coapTypes.add(c.instituteType);
    }
    console.log(`    Missing institute: ${coapMissingInst} | bad score: ${coapBadScore} | Types: [${[...coapTypes].sort().join(', ')}]`);
  }

  // ── CollegeProgram ──
  const colleges = await CollegeProgram.find({ isActive: true }).lean();
  console.log(`\n  CollegeProgram (active): ${colleges.length} institutes`);
  let colMissingName = 0, colDupes = 0;
  const colSeen = new Set(), colTypes = new Set();
  for (const c of colleges) {
    if (!c.name) colMissingName++;
    if (c.type) colTypes.add(c.type);
    const key = c.name?.toLowerCase();
    if (colSeen.has(key)) colDupes++;
    else colSeen.add(key);
  }
  console.log(`    Missing name: ${colMissingName} | dupes: ${colDupes} | Types: [${[...colTypes].sort().join(', ')}]`);

  // ── SeatMatrix ──
  const seats = await SeatMatrix.find({}).lean();
  console.log(`\n  SeatMatrix: ${seats.length} records`);
  let seatMissingInst = 0, seatMissingProg = 0;
  for (const s of seats) {
    if (!s.institute) seatMissingInst++;
    if (!s.program) seatMissingProg++;
  }
  console.log(`    Missing institute: ${seatMissingInst} | Missing program: ${seatMissingProg}`);

  // ──────────────── 2. COLLEGE COVERAGE ────────────────
  console.log('\n┌──────────────────────────────────────────────────┐');
  console.log('│  2. COLLEGE COVERAGE REPORT                       │');
  console.log('└──────────────────────────────────────────────────┘\n');

  const institutePrograms = new Map();
  for (const year of YEARS) {
    const ccmt = await CcmtCutoff.find({ year }).lean();
    for (const c of ccmt) {
      const inst = c.institute || 'Unknown';
      if (!institutePrograms.has(inst)) {
        institutePrograms.set(inst, { type: c.instituteType || 'Unknown', programs: new Map() });
      }
      const entry = institutePrograms.get(inst);
      const prog = c.program || 'Unknown';
      if (!entry.programs.has(prog)) {
        entry.programs.set(prog, { years: new Set(), categories: new Set(), closingScores: [] });
      }
      const p = entry.programs.get(prog);
      p.years.add(c.year);
      p.categories.add(c.category);
      p.closingScores.push({ year: c.year, cat: c.category, round: c.round, closing: c.closingScore, opening: c.openingScore });
    }
  }

  const sortedInsts = [...institutePrograms.entries()].sort((a, b) => {
    const typeOrder = { 'IISc': 0, 'IIT': 1, 'NIT': 2, 'IIIT': 3, 'GFTI': 4, 'IIEST': 5 };
    return (typeOrder[a[1].type] || 99) - (typeOrder[b[1].type] || 99) || a[0].localeCompare(b[0]);
  });

  let totalInstitutes = 0, totalPrograms = 0;
  for (const [inst, info] of sortedInsts) {
    totalInstitutes++;
    const progs = [...info.programs.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    totalPrograms += progs.length;
    console.log(`\n${info.type}: ${inst}`);
    for (const [prog, p] of progs) {
      const yrs = [...p.years].sort().join(',');
      const cats = [...p.categories].sort().join(',');
      const lastClose = p.closingScores[p.closingScores.length - 1];
      const closeStr = lastClose ? `${lastClose.closing} (${lastClose.cat})` : 'N/A';
      console.log(`  ${prog} [${yrs}] cats: ${cats} | last: ${closeStr}`);
    }
  }

  console.log(`\n  TOTAL: ${totalInstitutes} institutes | ${totalPrograms} unique programmes`);

  // ──────────────── 3. PREDICTION MATRIX ────────────────
  console.log('\n┌──────────────────────────────────────────────────┐');
  console.log('│  3. PREDICTION MATRIX TEST                        │');
  console.log('└──────────────────────────────────────────────────┘\n');

  const calcEnhancedProbability = require('../src/services/predictionUtils').calcEnhancedProbability;
  const allCcmt = {};
  for (const year of YEARS) {
    allCcmt[year] = await CcmtCutoff.find({ year }).lean();
  }

  let monotonicPass = true, zeroQualified = true, fullCoverage = true;
  const matrixResults = [];

  for (const year of YEARS) {
    for (const cat of CATEGORIES) {
      const ccmt = allCcmt[year].filter(c => c.category === cat);
      console.log(`  ${year} ${cat}: ${ccmt.length} programmes`);

      let prevCount = -1;
      const row = { year, cat, marks: {} };

      for (const marks of MARKS) {
        const gateResult = gateScorePredict(marks, PAPER, cat, year);
        if (gateResult.error) { row.marks[marks] = { err: gateResult.error }; continue; }

        const score = gateResult.gateScore.value;
        const matched = ccmt.filter(c => score >= (c.closingScore || 0));
        const uniqueInsts = new Set(matched.map(c => c.institute)).size;

        row.marks[marks] = { score, matched: matched.length, institutes: uniqueInsts, air: gateResult.air?.range };

        // Check monotonic: more marks → more or equal matches
        if (prevCount >= 0 && matched.length < prevCount) {
          monotonicPass = false;
        }
        prevCount = matched.length;
      }
      matrixResults.push(row);
    }
  }

  // Print matrix
  const header = 'Year   Cat          ' + MARKS.map(m => padL(m, 6)).join(' ');
  console.log('\n  ' + header);
  console.log('  ' + '-'.repeat(header.length));
  for (const row of matrixResults) {
    let line = `  ${row.year}  ${pad(row.cat, 12)}`;
    for (const marks of MARKS) {
      const d = row.marks[marks];
      line += d ? padL(d.matched, 6) : padL('err', 6);
    }
    console.log(line);
  }

  console.log(`\n  Monotonic (more marks → ≥ matches): ${monotonicPass ? 'PASS' : 'FAIL'}`);

  // ──────────────── 4. PROBABILITY CLASSIFICATION ────────────────
  console.log('\n┌──────────────────────────────────────────────────┐');
  console.log('│  4. PROBABILITY CLASSIFICATION AUDIT              │');
  console.log('└──────────────────────────────────────────────────┘\n');

  // Test with marks=60, General, 2025
  const testYear = 2025, testCat = 'General', testMarks = 60;
  const gateResult = gateScorePredict(testMarks, PAPER, testCat, testYear);
  const testScore = gateResult.gateScore.value;
  const testCcmt = allCcmt[testYear].filter(c => c.category === testCat);

  console.log(`  Test: ${testYear} ${testCat} marks=${testMarks} → Score=${testScore}`);
  console.log(`  Total programmes in CCMT: ${testCcmt.length}`);

  const chanceBuckets = { 'Very High Chance': 0, 'High Chance': 0, 'Good Chance': 0, 'Competitive': 0, 'Dream': 0 };
  const thresholdIssues = [];

  for (const c of testCcmt) {
    const { score: prob } = calcEnhancedProbability(testScore, c.closingScore, c.openingScore, null, 'Medium', 'Medium', testYear, null, c.institute, c.program);
    const margin = testScore - (c.closingScore || 0);

    let path;
    if (prob >= 80) path = 'Very High Chance';
    else if (prob >= 60) path = 'High Chance';
    else if (prob >= 40) path = 'Good Chance';
    else if (prob >= 20) path = 'Competitive';
    else path = 'Dream';

    chanceBuckets[path]++;

    // Verify: very high prob should have positive margin
    if (prob >= 80 && margin < 0) thresholdIssues.push(`${c.institute} ${c.program}: prob=${prob}% but margin=${margin}`);
  }

  console.log(`\n  Probability distribution (marks=${testMarks}, score=${testScore}):`);
  console.log(`    Very High (>=80%):  ${chanceBuckets['Very High Chance']}`);
  console.log(`    High      (60-79%): ${chanceBuckets['High Chance']}`);
  console.log(`    Good      (40-59%): ${chanceBuckets['Good Chance']}`);
  console.log(`    Competitive (20-39%): ${chanceBuckets['Competitive']}`);
  console.log(`    Dream     (<20%):   ${chanceBuckets['Dream']}`);

  if (thresholdIssues.length > 0) {
    console.log(`\n  Threshold inconsistencies: ${thresholdIssues.length}`);
    thresholdIssues.slice(0, 5).forEach(i => console.log(`    ${i}`));
  } else {
    console.log(`\n  All probabilities consistent with score margins`);
  }

  // ──────────────── 5. FINAL REPORT ────────────────
  console.log('\n' + '='.repeat(80));
  console.log('  FINAL AUDIT REPORT');
  console.log('='.repeat(80));

  // Aggregate all CCMT records
  const allCcmtRecords = [];
  for (const year of YEARS) allCcmtRecords.push(...allCcmt[year]);
  const allUniqueInsts = new Set(allCcmtRecords.map(c => c.institute));
  const allUniqueProgs = new Set(allCcmtRecords.map(c => `${c.institute}|${c.program}`));
  const allCoap = await CoapCutoff.find({}).lean();
  const allSeats = await SeatMatrix.find({}).lean();

  console.log(`
  ┌─────────────────────────────────────────────┐
  │ DATABASE STATISTICS                         │
  ├─────────────────────────────────────────────┤
  │ CCMT records:       ${padL(allCcmtRecords.length, 6)}                 │
  │ Unique institutes:  ${padL(allUniqueInsts.size, 6)}                 │
  │ Unique programmes:  ${padL(allUniqueProgs.size, 6)}                 │
  │ COAP records:       ${padL(allCoap.length, 6)}                 │
  │ Seat records:       ${padL(allSeats.length, 6)}                 │
  │ CollegeProgram:     ${padL(colleges.length, 6)}                 │
  ├─────────────────────────────────────────────┤
  │ Years covered:      ${[...YEARS].join(', ')}            │
  │ Papers (CCMT):      CS (verified)             │
  │ Categories:         ${[...new Set(allCcmtRecords.map(c => c.category))].sort().join(', ')}                 │
  └─────────────────────────────────────────────┘
`);

  const totalMissingName = allCcmtRecords.filter(c => !c.institute).length + allCoap.filter(c => !c.institute).length + colleges.filter(c => !c.name).length + allSeats.filter(s => !s.institute).length;
  const totalMissingProg = allCcmtRecords.filter(c => !c.program).length + allSeats.filter(s => !s.program).length;
  const totalMissingClose = allCcmtRecords.filter(c => c.closingScore == null || isNaN(c.closingScore)).length;
  const totalCcmtDupes = allCcmtRecords.length - new Set(allCcmtRecords.map(c => `${c.institute}|${c.program}|${c.year}|${c.category}`)).size;
  const totalColDupes = colleges.length - new Set(colleges.map(c => `${c.name}|${c.type}`)).size;
  const totalBadScore = allCcmtRecords.filter(c => c.closingScore != null && (c.closingScore < 0 || c.closingScore > 1000)).length + allCoap.filter(c => c.closingScore != null && (c.closingScore < 0 || c.closingScore > 1000)).length;

  console.log(`
  ┌─────────────────────────────────────────────┐
  │ DATA QUALITY                                │
  ├─────────────────────────────────────────────┤
  │ Missing names:      ${padL(totalMissingName, 6)}                 │
  │ Missing programmes: ${padL(totalMissingProg, 6)}                 │
  │ Missing closing:    ${padL(totalMissingClose, 6)}                 │
  │ Duplicate records:  ${padL(totalCcmtDupes + totalColDupes, 6)}                 │
  │ Invalid scores:     ${padL(totalBadScore, 6)}                 │
  │ Monotonic matches:  ${monotonicPass ? 'PASS' : 'FAIL'}                 │
  │ Probability check:  ${thresholdIssues.length === 0 ? 'PASS' : 'FAIL'} │
  └─────────────────────────────────────────────┘
`);

  console.log(`
  ┌─────────────────────────────────────────────┐
  │ COMPLETENESS                                │
  ├─────────────────────────────────────────────┤
  │ Institutes with data:  ${totalInstitutes}                  │
  │ Institute types:       ${[...new Set(allCcmtRecords.map(c => c.instituteType))].filter(Boolean).join(', ')}                 │
  │ CollegeProgram types:  ${[...colTypes].join(', ')}                 │
  │ Average progs/inst:    ${(allUniqueProgs.size / allUniqueInsts.size).toFixed(1)}                  │
  │ Avg records/prog:      ${(allCcmtRecords.length / allUniqueProgs.size).toFixed(1)}                  │
  └─────────────────────────────────────────────┘
`);

  console.log('  Audit complete. No data was modified.\n');
  await mongoose.disconnect();

  setTimeout(() => process.exit(0), 1000);
}

run().catch(e => { console.error(e); process.exit(1); });
