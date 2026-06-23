const { chromium } = require('playwright');
const FRONTEND = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  await context.route('**/api/**', async (route) => {
    const h = await route.request().allHeaders();
    h['x-demo-user'] = 'true';
    await route.continue({ headers: h });
  });

  const page = await context.newPage();
  const errors = [];

  // Login via guest
  await page.goto(FRONTEND, { waitUntil: 'networkidle', timeout: 15000 });
  await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Click guest/demo
  const g = page.locator('button, a').filter({ hasText: /(Guest|Demo|Skip)/i }).first();
  if (await g.isVisible({ timeout: 2000 }).catch(() => false)) { await g.click(); await page.waitForTimeout(2000); }

  await page.goto(`${FRONTEND}/subjects`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // Test SubjectsPage accordion
  console.log('=== SubjectsPage Accordion ===');
  // Find Engineering Mathematics button and click to expand
  const emBtn = page.locator('button').filter({ hasText: 'Engineering Mathematics' });
  if (await emBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emBtn.click();
    await page.waitForTimeout(1000);
    const links = page.locator('a[href*="/learn/topic/"]');
    const lc = await links.count();
    console.log(`EM topics visible (accordion expanded): ${lc}`);
    for (let i = 0; i < Math.min(5, lc); i++) {
      const href = await links.nth(i).getAttribute('href');
      const text = await links.nth(i).textContent();
      console.log(`  [${i}] ${text.trim().substring(0, 35)} -> ${href}`);
    }
  } else {
    console.log('EM button not found');
  }

  // Test TopicsPage  
  console.log('\n=== TopicsPage (/topics) ===');
  await page.goto(`${FRONTEND}/topics`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const body = await page.locator('body').textContent();
  console.log(`"Topics" in page: ${body.includes('Topics')}`);
  const tpLinks = page.locator('a[href*="/learn/topic/"]');
  const tpCount = await tpLinks.count();
  console.log(`Topic links: ${tpCount}`);

  // Try clicking first topic
  if (tpCount > 0) {
    const href = await tpLinks.first().getAttribute('href');
    const text = await tpLinks.first().textContent();
    console.log(`First: ${text.trim().substring(0, 35)} -> ${href}`);

    // Click and check
    await tpLinks.first().click();
    await page.waitForTimeout(3000);
    const body2 = await page.locator('body').textContent();
    console.log(`"Topic Not Available": ${body2.includes('Topic Not Available')}`);
    console.log(`"not found": ${body2.toLowerCase().includes('not found')}`);
  }

  // Test ALL 11 subject pages
  console.log('\n=== All Subject Pages ===');
  const subjects = ['EM', 'DL', 'CO', 'DS', 'AL', 'TOC', 'CD', 'OS', 'DB', 'CN', 'APT'];
  for (const code of subjects) {
    await page.goto(`${FRONTEND}/subjects/${code}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const body = await page.locator('body').textContent();
    const hasNoTopics = body.includes('No topics found');
    const hasTopicNotAvail = body.includes('Topic Not Available');
    const topicLinks = await page.locator('a[href*="/learn/topic/"]').count();
    const status = hasNoTopics ? '✗ NO TOPICS' : hasTopicNotAvail ? '✗ NOT AVAIL' : `✓ ${topicLinks} topics`;
    console.log(`  ${code}: ${status}`);
  }

  console.log(`\nConsole errors: ${errors.length}`);
  await page.screenshot({ path: 'topic-all-subjects.png', fullPage: true });
  await browser.close();
})();
