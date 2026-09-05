// Comprehensive GATENEXA Audit Test Script
// Run with: node audit-test.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots', 'audit');
const BASE_URL = 'https://gatenexa.vercel.app';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 30000 }).trim();
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

function screenshot(name) {
  const file = path.join(SCREENSHOT_DIR, `${name}.png`);
  run(`agent-browser screenshot "${file}"`);
  return file;
}

function snapshot() {
  return run('agent-browser snapshot -i');
}

function consoleErrors() {
  return run('agent-browser console --errors');
}

function checkPage(name, url) {
  console.log(`\n=== Testing: ${name} ===`);
  const result = run(`agent-browser open ${url}`);
  console.log(`URL: ${result}`);
  
  run('agent-browser wait 2000');
  
  const currentUrl = run('agent-browser get url');
  console.log(`Current URL: ${currentUrl}`);
  
  const errors = consoleErrors();
  if (errors && errors !== '[]') {
    console.log(`Console Errors: ${errors}`);
  }
  
  const snap = snapshot();
  console.log(`Snapshot length: ${snap.length} chars`);
  
  screenshot(name.toLowerCase().replace(/\s+/g, '-'));
  
  return { name, url: currentUrl, errors, snapshot: snap };
}

// Pages to test
const pages = [
  { name: 'Homepage', url: BASE_URL },
  { name: 'Login', url: `${BASE_URL}/login` },
  { name: 'Register', url: `${BASE_URL}/register` },
  { name: 'Dashboard', url: `${BASE_URL}/dashboard` },
  { name: 'Focus Mode', url: `${BASE_URL}/focus` },
  { name: 'Insights', url: `${BASE_URL}/insights` },
  { name: 'GATE Q&A', url: `${BASE_URL}/gate-qa` },
  { name: 'AI Mentor', url: `${BASE_URL}/ai-mentor` },
  { name: 'Subject Tracker', url: `${BASE_URL}/subjects` },
  { name: 'Notes', url: `${BASE_URL}/notes` },
  { name: 'Resources', url: `${BASE_URL}/resources` },
  { name: 'AI Predictor', url: `${BASE_URL}/predictor` },
  { name: 'Progress Analytics', url: `${BASE_URL}/analytics` },
  { name: 'Roadmaps', url: `${BASE_URL}/roadmaps` },
  { name: 'Settings', url: `${BASE_URL}/settings` },
  { name: 'Feedback', url: `${BASE_URL}/feedback` },
  { name: 'PYQs', url: `${BASE_URL}/pyqs` },
  { name: 'Mock Tests', url: `${BASE_URL}/mock-tests` },
  { name: 'Short Notes', url: `${BASE_URL}/short-notes` },
  { name: 'Weekly Tests', url: `${BASE_URL}/weekly-tests` },
  { name: 'Gate Papers', url: `${BASE_URL}/gate-papers` },
  { name: 'Flashcards', url: `${BASE_URL}/flashcards` },
  { name: 'Success Hub', url: `${BASE_URL}/success-hub` },
];

console.log('Starting comprehensive audit...');
console.log(`Testing ${pages.length} pages\n`);

const results = [];
for (const page of pages) {
  results.push(checkPage(page.name, page.url));
}

// Write results
const report = results.map(r => `## ${r.name}\n- URL: ${r.url}\n- Errors: ${r.errors || 'None'}\n- Snapshot: ${r.snapshot.length} chars\n`).join('\n');
fs.writeFileSync(path.join(SCREENSHOT_DIR, 'audit-results.md'), report);
console.log('\nAudit complete. Results saved to audit-results.md');
