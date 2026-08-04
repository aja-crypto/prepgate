const fs = require('fs');
const path = require('path');

console.log('=== 1. ALL JSON DATA FILES ===');
const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir);
files.forEach(f => {
  if (f.endsWith('.json')) {
    const s = fs.statSync(path.join(dataDir, f));
    try {
      const c = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
      const desc = Array.isArray(c) ? 'Array[' + c.length + ']' : 'Object{' + Object.keys(c).slice(0, 6).join(',') + '}';
      console.log('  ' + f + ' (' + (s.size / 1024).toFixed(1) + 'KB) ' + desc);
    } catch (e) { console.log('  ' + f + ' (' + (s.size / 1024).toFixed(1) + 'KB)'); }
  }
  if (f.endsWith('.zip')) {
    const s = fs.statSync(path.join(dataDir, f));
    console.log('  ' + f + ' (' + (s.size / 1024).toFixed(1) + 'KB) ZIP');
  }
});

console.log('\n=== 2. RUNTIME STATE ===');
const { isMongoConnected, isMockAuthEnabled } = require('../src/config/db');
console.log('MongoDB connected: ' + isMongoConnected());
console.log('Mock auth enabled: ' + isMockAuthEnabled());

console.log('\n=== 3. ENV CONFIG ===');
['.env', '.env.development'].forEach(f => {
  const fp = path.join(__dirname, '..', f);
  if (fs.existsSync(fp)) {
    const content = fs.readFileSync(fp, 'utf-8');
    const relevant = content.split('\n').filter(l =>
      l.includes('MONGO') || l.includes('MOCK') || l.includes('USE_')
    );
    console.log(f + ':');
    relevant.forEach(l => console.log('  ' + l.trim()));
  }
});

console.log('\n=== 4. PREDICTOR DATA FLOW ===');
const routeFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'predictor.js'), 'utf-8');
const keyLines = routeFile.split('\n').filter(l =>
  l.includes('localPredict') || l.includes('predictionEngine') ||
  l.includes('isMockAuthEnabled') || l.includes('isMongoConnected')
);
keyLines.forEach(l => console.log('  line ' + l.trim()));

console.log('\n=== 5. CSE CUTOFFS STATS ===');
const cutoffFile = path.join(__dirname, '..', 'data', 'cse-cutoffs.json');
if (fs.existsSync(cutoffFile)) {
  const cutoffs = JSON.parse(fs.readFileSync(cutoffFile, 'utf-8'));
  const types = {};
  cutoffs.forEach(c => types[c.college_type] = (types[c.college_type] || 0) + 1);
  let totalProgs = 0, totalCuts = 0;
  cutoffs.forEach(c => {
    totalProgs += (c.programs || []).length;
    (c.programs || []).forEach(p => totalCuts += (p.cutoffs || []).length);
  });
  console.log('Institutes: ' + cutoffs.length);
  console.log('Programmes: ' + totalProgs);
  console.log('Cutoff entries: ' + totalCuts);
  console.log('Types: ' + JSON.stringify(types));
}

console.log('\n=== 6. MONGO MODELS (what would be queried if connected) ===');
const modelsDir = path.join(__dirname, '..', 'src', 'models');
fs.readdirSync(modelsDir).filter(f => f.endsWith('.js')).forEach(f => {
  const content = fs.readFileSync(path.join(modelsDir, f), 'utf-8');
  const fields = content.match(/^\s+\w+:\s*\{/gm);
  console.log('  ' + f + ': ' + (fields ? fields.length + ' fields' : ''));
});

console.log('\n=== 7. SUMMARY ===');
console.log('Current data source: cse-cutoffs.json (local JSON file)');
console.log('Because: isMockAuthEnabled()=true, isMongoConnected()=false');
console.log('Full CCMT/COAP data: In MongoDB (DISCONNECTED — not accessible)');
console.log('Fix needed: Either reconnect MongoDB OR export MongoDB data to JSON');
