const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 5000, path, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 300000,
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch(e) { resolve({ raw: buf }); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 5000, path, method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 300000,
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch(e) { resolve({ raw: buf }); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('=== Predictor Validation Audit ===\n');

  // Login
  const login = await post('/api/auth/login', { email: 'test@example.com', password: 'password123' });
  const token = login.data.accessToken;
  console.log('Login: OK\n');

  const scenarios = [
    // General
    { marks: 20, cat: 'General' }, { marks: 30, cat: 'General' }, { marks: 40, cat: 'General' },
    { marks: 50, cat: 'General' }, { marks: 60, cat: 'General' }, { marks: 70, cat: 'General' },
    { marks: 80, cat: 'General' },
    // OBC
    { marks: 20, cat: 'OBC' }, { marks: 30, cat: 'OBC' }, { marks: 40, cat: 'OBC' },
    { marks: 50, cat: 'OBC' }, { marks: 60, cat: 'OBC' }, { marks: 70, cat: 'OBC' },
    // EWS
    { marks: 20, cat: 'EWS' }, { marks: 30, cat: 'EWS' }, { marks: 40, cat: 'EWS' },
    { marks: 50, cat: 'EWS' }, { marks: 60, cat: 'EWS' },
    // SC
    { marks: 15, cat: 'SC' }, { marks: 20, cat: 'SC' }, { marks: 30, cat: 'SC' },
    { marks: 40, cat: 'SC' }, { marks: 50, cat: 'SC' },
    // ST
    { marks: 10, cat: 'ST' }, { marks: 20, cat: 'ST' }, { marks: 30, cat: 'ST' }, { marks: 40, cat: 'ST' },
  ];

  const results = [];
  let totalDupeCount = 0;
  let totalTime = 0;

  for (const s of scenarios) {
    const start = Date.now();
    try {
      const r = await post('/api/predictor/predict', { expectedMarks: s.marks, category: s.cat, paper: 'CS' }, token);
      const elapsed = Date.now() - start;
      const d = r.data;
      if (!d || d.error) {
        console.log(`${s.cat} ${s.marks}: ERROR - ${d?.error || 'no data'}`);
        results.push({ ...s, error: d?.error || 'no data' });
        continue;
      }

      const opps = d.opportunities || [];
      const pairs = opps.map(o => `${o.college}|${o.program}`);
      const uniquePairs = [...new Set(pairs)];
      const dupeCount = pairs.length - uniquePairs.length;
      totalDupeCount += dupeCount;

      const iits = opps.filter(o => o.collegeType === 'IIT').length;
      const nits = opps.filter(o => o.collegeType === 'NIT').length;
      const iiits = opps.filter(o => o.collegeType === 'IIIT').length;
      const gftis = opps.filter(o => o.collegeType === 'GFTI').length;

      const hasExplanations = opps.filter(o => o.explanations && o.explanations.length > 0).length;
      const hasTrend = opps.filter(o => o.trend).length;
      const hasAIRRange = d.airRange ? true : false;

      totalTime += elapsed;

      console.log(`${s.cat.padEnd(7)} ${String(s.marks).padStart(2)}: score=${String(d.predictedScore).padStart(4)} rank=${String(d.predictedRank).padStart(6)} | IIT=${String(iits).padStart(2)} NIT=${String(nits).padStart(2)} IIIT=${String(iiits).padStart(2)} GFTI=${String(gftis).padStart(2)} | total=${String(opps.length).padStart(3)} dupes=${String(dupeCount).padStart(2)} | exps=${hasExplanations}/${opps.length} trend=${hasTrend}/${opps.length} airRange=${hasAIRRange} | ${elapsed}ms`);

      results.push({
        ...s, score: d.predictedScore, rank: d.predictedRank, percentile: d.predictedPercentile,
        confidence: d.confidence, iits, nits, iiits, gftis, total: opps.length, dupes: dupeCount,
        hasExplanations: hasExplanations === opps.length, hasTrend, hasAIRRange,
        elapsed, opps,
      });
    } catch (e) {
      console.log(`${s.cat} ${s.marks}: EXCEPTION - ${e.message}`);
      results.push({ ...s, error: e.message });
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total scenarios: ${scenarios.length}`);
  console.log(`Average latency: ${Math.round(totalTime / scenarios.length)}ms`);
  console.log(`Total duplicates: ${totalDupeCount}`);
  console.log(`Duplicate rate: ${(totalDupeCount / results.reduce((a, r) => a + (r.total || 0), 0) * 100).toFixed(1)}%`);

  // Edge cases
  console.log('\n=== EDGE CASES ===');
  for (const tc of [
    { body: { expectedMarks: 0, category: 'General', paper: 'CS' }, name: '0 marks' },
    { body: { expectedMarks: 100, category: 'General', paper: 'CS' }, name: '100 marks' },
    { body: { expectedMarks: -5, category: 'General', paper: 'CS' }, name: 'Negative marks' },
    { body: { expectedMarks: 105, category: 'General', paper: 'CS' }, name: '105 marks' },
    { body: { category: 'General', paper: 'CS' }, name: 'Missing marks' },
    { body: { expectedMarks: 50, category: 'XYZ', paper: 'CS' }, name: 'Invalid category' },
    { body: { expectedMarks: 30, category: 'PwD', paper: 'CS' }, name: 'PwD category' },
  ]) {
    try {
      const r = await post('/api/predictor/predict', tc.body, token);
      if (r.data && r.data.opportunities) {
        console.log(`${tc.name}: total=${r.data.opportunities.Count || r.data.opportunities.length} (should be 0 or error for invalid)`);
      } else if (r.message) {
        console.log(`${tc.name}: rejected - "${r.message}"`);
      } else {
        console.log(`${tc.name}: ${r.raw ? r.raw.substring(0, 100) : 'unknown response'}`);
      }
    } catch (e) {
      console.log(`${tc.name}: ${e.message}`);
    }
  }

  // Dedup detailed check (General 50)
  console.log('\n=== DEDUP DETAIL (General 50) ===');
  const r50 = results.find(r => r.cat === 'General' && r.marks === 50);
  if (r50 && r50.opps) {
    const pairCounts = {};
    r50.opps.forEach(o => { const k = `${o.college}|${o.program}`; pairCounts[k] = (pairCounts[k] || 0) + 1; });
    const dupes = Object.entries(pairCounts).filter(([k, v]) => v > 1);
    if (dupes.length > 0) {
      console.log(`Found ${dupes.length} duplicate pairs:`);
      dupes.slice(0, 5).forEach(([k, v]) => console.log(`  ${k} x${v}`));
    } else {
      console.log('No duplicates found - FIX VERIFIED');
    }
  }

  // Explanation quality
  console.log('\n=== EXPLANATION QUALITY (General 50) ===');
  if (r50 && r50.opps) {
    const samples = r50.opps.slice(0, 5);
    samples.forEach(o => {
      const exps = o.explanations || [];
      const avgLen = exps.length > 0 ? Math.round(exps.reduce((a, e) => a + e.length, 0) / exps.length) : 0;
      console.log(`  ${o.college.substring(0, 40).padEnd(40)} exps=${exps.length} avgLen=${avgLen} trend=${o.trend?.direction || 'none'} prob=${o.probability}`);
      if (exps.length > 0) console.log(`    -> ${exps[0].substring(0, 80)}`);
    });
  }

  // Write JSON results
  const fs = require('fs');
  fs.writeFileSync('C:\\Users\\purru\\AppData\\Local\\Temp\\predictor-results.json', JSON.stringify(results.map(r => ({
    cat: r.cat, marks: r.marks, score: r.score, rank: r.rank, confidence: r.confidence,
    iits: r.iits, nits: r.nits, iiits: r.iiits, gftis: r.gftis, total: r.total, dupes: r.dupes,
    hasExplanations: r.hasExplanations, hasTrend: r.hasTrend, hasAIRRange: r.hasAIRRange, elapsed: r.elapsed,
  })), null, 2));
  console.log('\nResults saved to predictor-results.json');
}

main().catch(e => console.error('Fatal:', e.message));
