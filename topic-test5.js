const { chromium } = require('playwright');
const FRONTEND = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  await context.route('**/api/**', async (route) => {
    const h = await route.request().allHeaders();
    h['x-demo-user'] = 'true';
    await route.continue({ headers: h });
  });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(`PAGE: ${err.message}`));
  page.on('response', (resp) => { if (resp.url().includes('/api/') && resp.status() >= 400) errors.push(`API ${resp.status()}: ${resp.url().substring(0, 80)}`); });

  // Login
  await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const guestBtn = page.locator('button, a').filter({ hasText: /(Guest|Demo|Skip)/i }).first();
  if (await guestBtn.isVisible({ timeout: 3000 }).catch(() => false)) { await guestBtn.click(); await page.waitForTimeout(2000); }

  // Navigate to subjects
  await page.goto(`${FRONTEND}/subjects`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Dismiss onboarding modal
  let dismissed = false;
  const modalDismiss = page.locator('button').filter({ hasText: /(Skip|Close|X|Got it|Dismiss)/i });
  if (await modalDismiss.first().isVisible({ timeout: 2000 }).catch(() => false)) { 
    await modalDismiss.first().click(); 
    await page.waitForTimeout(1000);
    dismissed = true;
    console.log('Dismissed modal');
  }

  // Try dismissing any overlay
  if (!dismissed) {
    const overlay = page.locator('.fixed.inset-0.z-50').first();
    if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Click the backdrop or a skip button
      const skipBtn = overlay.locator('button').filter({ hasText: /(Skip|Close|X|Got it|Dismiss)/i }).first();
      if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(1000);
        console.log('Dismissed overlay via button');
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('Pressed Escape');
      }
    }
  }

  // Navigate to subjects fresh
  await page.goto(`${FRONTEND}/subjects`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Check all subjects via SubjectDetailPage
  console.log('\n=== SUBJECT → TOPIC LIST → TOPIC DETAIL ===');
  const subjects = [
    { code: 'EM', name: 'Engineering Mathematics' },
    { code: 'DL', name: 'Digital Logic' },
    { code: 'CO', name: 'COA' },
    { code: 'DS', name: 'Programming & Data Structures' },
    { code: 'AL', name: 'Algorithms' },
    { code: 'TOC', name: 'Theory of Computation' },
    { code: 'CD', name: 'Compiler Design' },
    { code: 'OS', name: 'Operating Systems' },
    { code: 'DB', name: 'DBMS' },
    { code: 'CN', name: 'Computer Networks' },
    { code: 'APT', name: 'General Aptitude' },
  ];

  for (const sub of subjects) {
    console.log(`\n--- ${sub.code}: ${sub.name} ---`);
    await page.goto(`${FRONTEND}/subjects/${sub.code}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const body = await page.locator('body').textContent();

    const hasNoTopics = body.includes('No topics found');
    const hasTopicNotAvail = body.includes('Topic Not Available');
    const topicLinks = page.locator('a[href*="/learn/topic/"]');
    const lc = await topicLinks.count();

    console.log(`  Topic links: ${lc}, "No topics found": ${hasNoTopics}`);

    if (lc > 0) {
      // Test first 2 topics
      const maxTest = Math.min(2, lc);
      for (let i = 0; i < maxTest; i++) {
        const href = await topicLinks.nth(i).getAttribute('href');
        const text = await topicLinks.nth(i).textContent();
        const topicName = text.trim().substring(0, 25);

        await page.goto(`${FRONTEND}${href}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2000);
        const detailBody = await page.locator('body').textContent();
        const isNotAvail = detailBody.includes('Topic Not Available');
        const isNotFound = detailBody.toLowerCase().includes('not found');
        
        if (isNotAvail || isNotFound) {
          console.log(`  ✗ [${i}] ${topicName} -> ${href}: FAIL (Not Available=${isNotAvail}, NotFound=${isNotFound})`);
        } else {
          console.log(`  ✓ [${i}] ${topicName}`);
        }
      }
    } else if (hasNoTopics) {
      console.log(`  ✗ FAIL: No topics found for ${sub.code}`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Console/API errors: ${errors.length}`);
  errors.forEach(e => console.log(`  ${e.substring(0, 120)}`));

  await page.screenshot({ path: 'topic-all-subjects-final.png', fullPage: true });
  await browser.close();
})();
