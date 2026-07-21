const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET = 'http://localhost:5173';
const SS_DIR = 'C:\\Users\\purru\\OneDrive\\gate2027\\screenshots\\qa3';
fs.mkdirSync(SS_DIR, { recursive: true });

const RESULTS = [];

async function auditPage(browser, pagePath, name, viewport) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    extraHTTPHeaders: { 'X-Demo-User': 'true' },
  });
  const page = await ctx.newPage();
  const logs = [];
  const network = [];

  page.on('console', msg => {
    const t = msg.text();
    if (msg.type() === 'error') logs.push(`[ERR] ${t.slice(0, 150)}`);
    else if (t.includes('Warning') && !t.includes('GSI') && !t.includes('fonts.googleapis')) 
      logs.push(`[WARN] ${t.slice(0, 150)}`);
  });
  page.on('response', resp => {
    const url = resp.url().replace(/http:\/\/localhost[^\/]+/, '');
    const s = resp.status();
    if (s >= 400 && !url.includes('google') && !url.includes('fonts.') && !url.includes('favicon')) {
      network.push(`${s} ${url}`);
    }
  });
  page.on('pageerror', err => logs.push(`[CRASH] ${err.message.slice(0, 150)}`));

  try {
    // Clear state, then navigate with demo header
    await page.goto(TARGET, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${TARGET}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body?.innerText?.length || 0);
    const filename = `qa3-${name.replace(/[^a-z0-9]/gi, '-')}-${viewport[0]}x${viewport[1]}.png`;
    await page.screenshot({ path: path.join(SS_DIR, filename), fullPage: true });

    // Filter out font/GSI noise
    const realErrors = logs.filter(l => !l.includes('fonts.g') && !l.includes('GSI') && !l.includes('google'));
    const realNetErrors = network.filter(n => !n.includes('404 /'));

    const isBlank = bodyText < 50;
    let status = 'PASS';
    if (isBlank) status = 'BLANK';
    else if (realErrors.length > 0) status = 'CONSOLE_ERR';
    else if (realNetErrors.length > 0) status = 'NET_ERR';

    const result = {
      page: name, path: pagePath, viewport: `${viewport[0]}x${viewport[1]}`,
      title: title.slice(0, 60), bodyChars: bodyText,
      consoleErrors: realErrors.length,
      networkErrors: realNetErrors.length,
      consoleList: realErrors.slice(0, 3),
      networkList: realNetErrors.slice(0, 3),
      status
    };
    RESULTS.push(result);
    const icon = status === 'PASS' ? '✅' : status === 'BLANK' ? '⬜' : '⚠️';
    console.log(`${icon} ${name.padEnd(16)} ${result.viewport.padEnd(14)} ${bodyText.toString().padStart(5)}c ${realErrors.length}ce ${realNetErrors.length}ne${status !== 'PASS' ? ' [' + status + ']' : ''}`);
    if (realNetErrors.length) realNetErrors.slice(0, 2).forEach(n => console.log(`        NET: ${n}`));
  } catch (e) {
    RESULTS.push({ page: name, status: 'FAIL', error: e.message.slice(0, 150) });
    console.log(`❌ ${name.padEnd(16)} ${`${viewport[0]}x${viewport[1]}`.padEnd(14)} FAIL: ${e.message.slice(0, 100)}`);
  }
  await ctx.close();
}

(async () => {
  console.log('=== GATENEXA BROWSER QA v3 (Real Browser, Real Pages) ===\n');

  const browser = await chromium.launch({ headless: true });

  const pages = [
    '/dashboard', '/subjects', '/topics', '/pyq', '/notes',
    '/analytics', '/insights', '/mentor', '/ai-coach', '/planner',
    '/settings', '/learning-hub', '/study-hub', '/gate-vault',
    '/mistakes', '/productivity', '/air-predictor',
    '/referral', '/community', '/flashcards', '/final-revision',
    '/study-schedule', '/success-hub', '/doubt-solver',
    '/short-notes', '/gate-papers', '/formula-sheets',
    '/GateNexa-ai', '/study-hub', '/weak-topics',
    '/study-schedule', '/weekly-tests',
  ];

  console.log('--- DESKTOP 1440×900 ---');
  for (const p of pages) {
    await auditPage(browser, p, p.replace('/', '') || 'home', { width: 1440, height: 900 });
  }

  console.log('\n--- MOBILE 375×812 ---');
  for (const p of pages) {
    await auditPage(browser, p, p.replace('/', '') || 'home', { width: 375, height: 812 });
  }

  await browser.close();

  // SUMMARY
  console.log('\n========== FINAL RESULTS ==========');
  const summary = {};
  RESULTS.forEach(r => { summary[r.status] = (summary[r.status] || 0) + 1; });
  Object.entries(summary).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log(`  TOTAL: ${RESULTS.length}`);

  const failures = RESULTS.filter(r => r.status !== 'PASS');
  if (failures.length) {
    console.log('\n--- FAILURES ---');
    failures.forEach(r => {
      console.log(`\n[${r.status}] ${r.page} @ ${r.viewport}`);
      if (r.error) console.log(`  Error: ${r.error}`);
      if (r.consoleList?.length) r.consoleList.forEach(l => console.log(`  ${l.slice(0, 120)}`));
      if (r.networkList?.length) r.networkList.forEach(n => console.log(`  NET: ${n}`));
    });
  }

  console.log(`\nScreenshots: ${SS_DIR}`);
})();
