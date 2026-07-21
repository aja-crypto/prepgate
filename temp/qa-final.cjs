const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TARGET = 'http://localhost:5173';
const API = 'http://localhost:5000';
const SS_DIR = 'C:\\Users\\purru\\OneDrive\\gate2027\\screenshots\\qa2';
fs.mkdirSync(SS_DIR, { recursive: true });

const RESULTS = [];

async function registerUser() {
  const http = require('http');
  const email = `qa2_${Date.now()}@test.com`;
  return new Promise((resolve, reject) => {
    const d = JSON.stringify({ name: 'QA User', email, password: 'Test1234!' });
    const req = http.request(`${API}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ email, ...JSON.parse(body) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(d);
    req.end();
  });
}

async function auditPage(browser, pagePath, name, viewport, token) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const logs = [];
  const network = [];

  page.on('console', msg => {
    if (msg.type() === 'error') logs.push('[ERR] ' + msg.text().slice(0, 150));
    if (msg.text().includes('Warning') && !msg.text().includes('GSI')) logs.push('[WARN] ' + msg.text().slice(0, 150));
  });
  page.on('response', resp => {
    const url = resp.url().replace(/http:\/\/localhost[^\/]+/, '');
    if (resp.status() >= 400 && !url.includes('google') && !url.includes('fonts.gstatic')) {
      network.push(`${resp.status()} ${url}`);
    }
  });
  page.on('pageerror', err => logs.push('[CRASH] ' + err.message.slice(0, 150)));

  try {
    // Set token in localStorage (simulate logged-in state)
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' });
    await page.evaluate(t => {
      localStorage.clear();
      localStorage.setItem('accessToken', t);
    }, token);
    // Set auth header for all API calls
    await page.route('**/api/**', (route) => {
      const headers = route.request().headers();
      headers['Authorization'] = `Bearer ${token}`;
      route.continue({ headers });
    });

    await page.goto(`${TARGET}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body?.innerText?.length || 0);
    const filename = `qa2-${name.replace(/[^a-z0-9]/gi, '-')}-${viewport[0]}x${viewport[1]}.png`;
    await page.screenshot({ path: path.join(SS_DIR, filename), fullPage: true });

    const hasBlockingError = logs.some(l => l.includes('[ERR]') && !l.includes('fonts.gstatic') && !l.includes('GSI'));
    const has4xx = network.some(n => n.startsWith('4') || n.startsWith('5'));
    const isBlank = bodyText < 100;

    const result = {
      page: name,
      path: pagePath,
      viewport: `${viewport[0]}x${viewport[1]}`,
      bodyChars: bodyText,
      consoleErrors: logs.filter(l => l.startsWith('[ERR]') && !l.includes('GSI')).length,
      networkErrors: network.length,
      networkList: network.slice(0, 5),
      consoleList: logs.filter(l => !l.includes('GSI')).slice(0, 3),
      status: isBlank ? 'BLANK' : hasBlockingError ? 'CONSOLE_ERR' : has4xx ? 'NET_ERR' : 'PASS'
    };
    RESULTS.push(result);
    console.log(`[${result.status}] ${name} @ ${result.viewport} — ${bodyText}c ${result.consoleErrors}ce ${result.networkErrors}ne`);
    if (network.length) network.slice(0, 2).forEach(n => console.log(`  NET: ${n}`));
    if (logs.filter(l => !l.includes('GSI')).length) console.log(`  LOG: ${logs.filter(l => !l.includes('GSI'))[0].slice(0, 100)}`);
  } catch (e) {
    RESULTS.push({ page: name, path: pagePath, viewport: `${viewport[0]}x${viewport[1]}`, error: e.message.slice(0, 150), status: 'FAIL' });
    console.log(`[FAIL] ${name} @ ${viewport[0]}x${viewport[1]} — ${e.message.slice(0, 100)}`);
  }
  await ctx.close();
}

(async () => {
  console.log('=== GATENEXA REAL BROWSER QA ===\n');

  // Register user via API
  console.log('Registering test user...');
  const reg = await registerUser();
  const token = reg.data?.accessToken;
  if (!token) {
    console.error('FAILED TO REGISTER USER. Backend may be down.');
    process.exit(1);
  }
  console.log(`User: ${reg.email}, Token: ${token.slice(0, 20)}...\n`);

  const browser = await chromium.launch({ headless: true });

  const pages = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/subjects', name: 'Subjects' },
    { path: '/topics', name: 'Topics' },
    { path: '/pyq', name: 'PYQs' },
    { path: '/notes', name: 'Notes' },
    { path: '/analytics', name: 'Analytics' },
    { path: '/insights', name: 'Insights' },
    { path: '/mentor', name: 'AIMentor' },
    { path: '/planner', name: 'Planner' },
    { path: '/settings', name: 'Settings' },
    { path: '/learning-hub', name: 'LearningHub' },
    { path: '/study-hub', name: 'StudyHub' },
    { path: '/gate-vault', name: 'GateVault' },
    { path: '/mistakes', name: 'Mistakes' },
    { path: '/productivity', name: 'Productivity' },
    { path: '/air-predictor', name: 'AirPredictor' },
    { path: '/referral', name: 'Referral' },
    { path: '/community', name: 'Community' },
    { path: '/flashcards', name: 'Flashcards' },
    { path: '/final-revision', name: 'FinalRevision' },
    { path: '/study-schedule', name: 'StudySchedule' },
    { path: '/success-hub', name: 'SuccessHub' },
    { path: '/doubt-solver', name: 'DoubtSolver' },
    { path: '/short-notes', name: 'ShortNotes' },
    { path: '/gate-papers', name: 'GatePapers' },
    { path: '/formula-sheets', name: 'FormulaSheets' },
    { path: '/study-hub', name: 'StudyHub' },
    { path: '/GateNexa-ai', name: 'GateNexaAI' },
  ];

  // Desktop
  console.log('--- DESKTOP 1440×900 ---');
  for (const p of pages) {
    await auditPage(browser, p.path, p.name, { width: 1440, height: 900 }, token);
  }

  // Mobile
  console.log('\n--- MOBILE 375×812 ---');
  for (const p of pages) {
    await auditPage(browser, p.path, p.name, { width: 375, height: 812 }, token);
  }

  await browser.close();

  // SUMMARY
  console.log('\n========== FINAL QA RESULTS ==========');
  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const blank = RESULTS.filter(r => r.status === 'BLANK').length;
  const consoleErr = RESULTS.filter(r => r.status === 'CONSOLE_ERR').length;
  const netErr = RESULTS.filter(r => r.status === 'NET_ERR').length;
  const failed = RESULTS.filter(r => r.status === 'FAIL').length;
  const total = RESULTS.length;
  console.log(`Total: ${total} | PASS: ${pass} | BLANK: ${blank} | CONSOLE_ERR: ${consoleErr} | NET_ERR: ${netErr} | FAIL: ${failed}`);

  // FAILURES
  const bad = RESULTS.filter(r => r.status !== 'PASS');
  if (bad.length) {
    console.log('\n--- PAGES WITH ISSUES ---');
    bad.forEach(r => {
      console.log(`\n[${r.status}] ${r.page} @ ${r.viewport}`);
      if (r.error) console.log(`  Error: ${r.error}`);
      if (r.consoleList?.length) r.consoleList.forEach(l => console.log(`  Console: ${l.slice(0, 120)}`));
      if (r.networkList?.length) r.networkList.forEach(n => console.log(`  Network: ${n}`));
    });
  }

  if (pass === total) {
    console.log('\n✅ ALL PAGES PASS');
  }
})();
