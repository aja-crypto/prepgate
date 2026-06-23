const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const jsErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') jsErrors.push({ text: msg.text(), url: page.url() });
  });
  page.on('pageerror', err => jsErrors.push({ text: 'PAGE: ' + err.message, url: page.url() }));

  // Login via demo
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const t = await btn.innerText();
    if (t.includes('ENTER DEMO MODE')) { await btn.click(); break; }
  }
  await page.waitForTimeout(4000);

  // Check all pages for errors
  const pages = ['/dashboard', '/subjects', '/topics', '/planner', '/gate-vault', '/analytics'];
  for (const p of pages) {
    const before = jsErrors.length;
    await page.goto('http://localhost:5173' + p, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(4000);
    const newErrors = jsErrors.slice(before);
    if (newErrors.length > 0) {
      console.log(p + ': ' + newErrors.length + ' error(s)');
      newErrors.forEach(e => console.log('  ' + e.text.substring(0, 200)));
    } else {
      console.log(p + ': OK (no errors)');
    }
  }

  await browser.close();
  console.log('\nTotal errors:', jsErrors.length > 0 ? jsErrors.map(e => e.url + ': ' + e.text.substring(0, 100)).join('\n') : 'None');
})();
