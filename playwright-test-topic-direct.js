const { chromium } = require('playwright');
const FRONTEND = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));

  let apis500 = 0;
  page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 500) apis500++; });

  // Add X-Demo-User to all API calls
  await context.route('**/api/**', async (route) => {
    const h = await route.request().allHeaders();
    h['x-demo-user'] = 'true';
    await route.continue({ headers: h });
  });

  // Login as guest
  await page.goto(`${FRONTEND}/register`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.locator('button:has-text("Explore Demo Mode")').click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Dashboard loaded');

  // Dismiss onboarding
  const skip = page.locator('button:has-text("Skip")').first();
  if (await skip.isVisible({ timeout: 2000 }).catch(() => false)) { await skip.click(); await page.waitForTimeout(500); }

  // Navigate directly to topic learn pages
  const topicIds = ['6a3297f2d86d7b7af86d8f7e', 'c5fcf8e0f9e64a2b8a1d3b4c']; // arrays, linked lists
  for (const id of topicIds) {
    console.log(`\n=== Testing topic: ${id} ===`);
    await page.goto(`${FRONTEND}/topics/${id}/learn`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const text = await page.locator('body').textContent();
    const hasError = text.includes('Topic Not Available') || text.includes('not found') || text.includes('404');
    console.log('Has error:', hasError);
    if (!hasError) {
      // Check for meaningful content
      const title = await page.title().catch(() => 'no title');
      console.log('Title:', title);
      console.log('Page loaded successfully!');
    }
  }

  // Navigate to /subjects/OS to check topics listing
  console.log('\n=== Testing /subjects/OS ===');
  await page.goto(`${FRONTEND}/subjects/OS`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const subjectText = await page.locator('body').textContent();
  console.log('Has subjects content:', subjectText.includes('Topic') || subjectText.includes('topic') || subjectText.includes('Chapter'));
  console.log('Has "Topic Not Available":', subjectText.includes('Topic Not Available'));

  // Try /subjects with code
  for (const code of ['CS', 'OS', 'DM', 'CN']) {
    await page.goto(`${FRONTEND}/subjects/${code}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    const t = await page.locator('body').textContent();
    if (t.includes('Topic')) { console.log(`${code}: Has topics!`); break; }
  }

  console.log(`\n=== Summary ===`);
  console.log('Console errors:', errors.length);
  errors.forEach(e => console.log('  -', e.substring(0, 150)));
  console.log('5xx API responses:', apis500);

  await page.waitForTimeout(2000);
  await browser.close();
})();
