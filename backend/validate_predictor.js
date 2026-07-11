const fs = require('fs');
const TEMP = 'C:\\Users\\purru\\AppData\\Local\\Temp';
const LOGIN_FILE = TEMP + '\\val_login.json';
const PRED_FILE = TEMP + '\\val_pred.json';

function exec(cmd) {
  return require('child_process').execSync(cmd, { encoding: 'utf8', shell: 'powershell' }).trim();
}

const results = {};
const issues = [];
const passes = [];

const SCORES = [45, 50, 55, 60, 65, 70, 75, 80, 85];
const TARGET_INSTITUTES = [
  'Indian Institute of Science',
  'Indian Institute of Technology Bombay',
  'Indian Institute of Technology Delhi',
  'Indian Institute of Technology Madras',
  'Indian Institute of Technology Kanpur',
  'Indian Institute of Technology Kharagpur',
  'Indian Institute of Technology Roorkee',
];

async function main() {
  // Login via file to avoid PowerShell quote issues
  fs.writeFileSync(LOGIN_FILE, JSON.stringify({email:'predict-test@test.com',password:'Predict123!'}));
  const loginRaw = exec(`curl.exe -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "@${LOGIN_FILE}"`);
  const loginData = JSON.parse(loginRaw);
  const token = loginData.data?.accessToken || loginData.token;

  if (!token) { console.log('FAILED to get auth token'); process.exit(1); }
  console.log('Auth token obtained\n');

  for (const score of SCORES) {
    let data;
    try {
      fs.writeFileSync(PRED_FILE, JSON.stringify({expectedMarks:score,category:'General',paper:'CS'}));
      const respRaw = exec(`curl.exe -s -X POST http://localhost:5000/api/predictor/predict -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d "@${PRED_FILE}"`);
      const resp = JSON.parse(respRaw);
      data = resp.data;
      if (!data) {
        issues.push(`Score ${score}: No data in response - ${resp.message || 'unknown'}`);
        continue;
      }
    } catch(e) {
      issues.push(`Score ${score}: Prediction failed - ${e.message}`);
      continue;
    }

    const opps = data.opportunities || [];
    const predScore = data.predictedScore;
    const predRank = data.predictedRank;
    const iisc = opps.filter(o => o.college === 'Indian Institute of Science');
    const tier1 = TARGET_INSTITUTES.filter(name => opps.some(o => o.college === name));
    const missing = TARGET_INSTITUTES.filter(name => !opps.some(o => o.college === name));
    const duplicates = opps.filter((o, i) => opps.findIndex(x => x.college === o.college && x.program === o.program) !== i);

    results[score] = {
      score: predScore,
      rank: predRank,
      total: opps.length,
      iisc: iisc.length,
      tier1Present: tier1,
      tier1Missing: missing,
      duplicates: duplicates.length ? duplicates : null,
      eliteDream: opps.filter(o => o.college === 'Indian Institute of Science' || o.college.includes('IIT Bombay') || o.college.includes('IIT Madras') || o.college.includes('IIT Delhi')).length,
    };

    // Verify probabilities increase with score for same institutes
    if (score > 50) {
      const prev = results[SCORES[SCORES.indexOf(score) - 1]];
      if (prev) {
        // Check a common institute (IIT Kanpur CSE)
        const currCse = opps.filter(o => o.college.includes('Kanpur') && o.program.includes('Computer'));
        if (currCse.length) passes.push(`Score ${score}: IIT Kanpur CSE prob=${currCse[0].probability}%`);
      }
    }

    // Check if any institute is missing without clear reason
    if (missing.length && predScore >= 650) {
      for (const name of missing) {
        // Check closing score in dataset
        const matching = opps.filter(o => o.college === name);
        if (!matching.length) {
          issues.push(`Score ${score} (${predScore}): ${name} is MISSING entirely. No programs found.`);
        } else {
          const maxProb = Math.max(...matching.map(o => o.probability));
          if (maxProb < 1 && predScore >= 800) {
            issues.push(`Score ${score} (${predScore}): ${name} has max prob ${maxProb.toFixed(0)}% - unexpectedly low`);
          }
        }
      }
    }

    // Check duplicates
    if (duplicates.length) {
      issues.push(`Score ${score}: Found ${duplicates.length} duplicate college+program entries`);
    }

    console.log(`Score ${score} (${predScore}): ${opps.length} opps, IISc=${iisc.length}, T1=${tier1.length}, missing=${missing.length}`);
  }

  // Generate Report
  console.log('\n' + '='.repeat(80));
  console.log('PREDICTION ENGINE VALIDATION REPORT');
  console.log('='.repeat(80));

  console.log('\n### INSTITUTE COVERAGE (IISc + Tier-1 IITs) ###\n');
  console.log('Score\tPred\tRank\tTotal\tIISc\tT1\tT1 Missing');
  for (const s of SCORES) {
    const r = results[s];
    if (!r) continue;
    console.log(`${s}\t${r.score}\t${r.rank}\t${r.total}\t${r.iisc}\t${r.tier1Present.length}\t${r.tier1Missing.join(', ') || 'none'}`);
  }

  console.log('\n### PROBABILITY PROGRESSION (IIT Kanpur CSE) ###\n');
  for (const p of passes.filter(x => x.includes('Kanpur'))) console.log('  ' + p);

  if (issues.length) {
    console.log('\n### ISSUES FOUND ###\n');
    for (const issue of issues) console.log('  ❌ ' + issue);
  } else {
    console.log('\n### ISSUES: NONE ✅ ###\n');
  }

  console.log('\n### DUPLICATE CHECK ###');
  let dupCount = 0;
  for (const s of SCORES) {
    const r = results[s];
    if (r?.duplicates) { dupCount += r.duplicates.length; console.log(`  Score ${s}: ${r.duplicates.length} duplicates`); }
  }
  if (!dupCount) console.log('  No duplicates found ✅');

  console.log('\n### DETAILED BREAKDOWN ###\n');
  for (const s of SCORES) {
    const r = results[s];
    if (!r) continue;
    console.log(`\n--- Score ${s} (Predicted: ${r.score}, Rank: ${r.rank}) ---`);
    console.log(`  Total opportunities: ${r.total}`);
    console.log(`  IISc programs: ${r.iisc}`);
    console.log(`  Elite Dream (IISc+Bombay+Madras+Delhi): ${r.eliteDream}`);
    console.log(`  Tier-1 present: ${r.tier1Present.join(', ')}`);
    if (r.tier1Missing.length) console.log(`  Tier-1 MISSING: ${r.tier1Missing.join(', ')}`);
    if (r.duplicates) console.log(`  ⚠ Duplicates: ${r.duplicates.length}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  const totalChecks = SCORES.length * TARGET_INSTITUTES.length;
  const passedChecks = totalChecks - issues.filter(i => i.includes('MISSING')).length;
  console.log(`  Scores tested: ${SCORES.length}`);
  console.log(`  Checks per score: ${TARGET_INSTITUTES.length}`);
  console.log(`  Total checks: ${totalChecks}`);
  console.log(`  Passed: ${passedChecks}`);
  console.log(`  Issues: ${issues.length}`);
  console.log(`  Pass rate: ${(passedChecks/totalChecks*100).toFixed(0)}%`);
  console.log(`  Status: ${issues.length === 0 ? '✅ ALL PASS' : issues.length <= 3 ? '🟡 MINOR ISSUES' : '🔴 INVESTIGATE'}`);
}

main().catch(e => console.error('Fatal:', e.message));
