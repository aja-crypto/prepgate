const { chromium } = require('playwright');
const TARGET = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'X-Demo-User': 'true' },
  });

  const pages = ['/dashboard', '/subjects', '/topics', '/pyq', '/referral'];

  for (const path of pages) {
    const page = await ctx.newPage();
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('Warning')) {
        errors.push(`[${msg.type()}] ${msg.text().slice(0, 200)}`);
      }
    });
    page.on('response', resp => {
      const s = resp.status();
      if (s >= 400 && !resp.url().includes('google') && !resp.url().includes('fonts')) {
        errors.push(`[HTTP ${s}] ${resp.url().replace(/http:\/\/localhost[^\/]+/, '')}`);
      }
    });

    try {
      await page.goto(`${TARGET}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);
    } catch (e) {
      errors.push(`[TIMEOUT] ${path}: ${e.message.slice(0, 100)}`);
    }

    console.log(`\n=== ${path} ===`);
    errors.forEach(e => console.log(`  ${e}`));
    if (!errors.length) console.log('  ✅ No errors');

    await page.close();
  }

  await browser.close();
})();
