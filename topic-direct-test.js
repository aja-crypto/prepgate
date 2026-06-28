const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page = await browser.newPage();

  // Add demo header interceptor
  await page.route('**/api/**', async (route) => {
    const h = await route.request().allHeaders();
    h['x-demo-user'] = 'true';
    await route.continue({ headers: h });
  });

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().substring(0, 100)); });

  // Login via guest
  await page.goto('http://localhost:5173/subjects', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  // Wait for page to settle
  await page.waitForTimeout(2000);

  // Debug: what's on the page?
  const url = page.url();
  const body = await page.locator('body').textContent();
  console.log(`URL: ${url}`);
  console.log(`Login form visible: ${url.includes('login')}`);

  // If login page, click guest/demo
  if (url.includes('login')) {
    const guest = page.locator('button, a').filter({ hasText: /(Guest|Demo|Skip|Explore)/i });
    if (await guest.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await guest.first().click();
      await page.waitForTimeout(3000);
    }
  }

  // Navigate to subjects page  
  await page.goto('http://localhost:5173/subjects', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  const body2 = await page.locator('body').textContent();
  console.log(`\nSubjects visible: ${body2.includes('Engineering Mathematics')}`);

  // Instead of clicking, use evaluate to find topic links
  const result = await page.evaluate(async () => {
    const apiBase = 'http://localhost:5000';
    const fetchOpts = { headers: { 'X-Demo-User': 'true' } };

    // 1. Get subjects with hierarchy
    const subResp = await fetch(`${apiBase}/api/subjects?hierarchy=true`, fetchOpts);
    const subData = await subResp.json();
    const subjects = subData.data || [];

    const results = [];

    for (const sub of subjects) {
      // Get topics for this subject
      const topicResp = await fetch(`${apiBase}/api/topics?subject=${sub._id}`, fetchOpts);
      const topicData = await topicResp.json();
      const topics = topicData.data || [];

      results.push({
        subject: sub.name,
        code: sub.code,
        topicCount: topics.length,
        topics: topics.map(t => ({ name: t.name, id: t._id })),
      });
    }

    return results;
  });

  console.log('\n=== ALL SUBJECTS WITH TOPICS ===');
  let allOk = true;
  for (const r of result) {
    const status = r.topicCount > 0 ? '✓' : '✗';
    if (r.topicCount === 0) allOk = false;
    console.log(`${status} ${r.code}: ${r.name} -> ${r.topicCount} topics`);
    r.topics.forEach(t => console.log(`     ${t.name}`));
  }

  console.log(`\nAll subjects have topics: ${allOk ? 'YES' : 'NO - SOME MISSING'}`);

  // Now check topic detail for each subject's first topic
  console.log('\n=== TOPIC DETAIL VERIFICATION ===');
  let allDetailsOk = true;
  for (const r of result) {
    if (r.topics.length > 0) {
      const topic = r.topics[0];
      const resp = await page.request.get(`http://localhost:5000/api/topics/${topic.id}/learn`, {
        headers: { 'X-Demo-User': 'true' }
      });
      const data = await resp.json();
      const ok = data.success && data.data && data.data.topic;
      if (!ok) {
        allDetailsOk = false;
        console.log(`✗ ${r.code}: ${topic.name} (${topic.id}) -> FAIL`);
      } else {
        console.log(`✓ ${r.code}: ${topic.name} -> OK`);
      }
    }
  }

  console.log(`All topic details load: ${allDetailsOk ? 'YES' : 'NO'}`);
  console.log(`\nErrors: ${errors.length}`);
  errors.forEach(e => console.log(`  ${e.substring(0, 120)}`));

  // Check SubjectsPage fallback issue
  console.log('\n=== SUBJECTSPAGE FALLBACK CHECK ===');
  // Simulate what localTopics might look like when API fails
  // We need to check what ProgressContext.topics contains
  const localTopicsCheck = await page.evaluate(() => {
    try {
      const stored = localStorage.getItem('gatenexa_progress');
      if (stored) {
        const parsed = JSON.parse(stored);
        const topics = parsed?.gateFeatures?.studyProgress || {};
        const keys = Object.keys(topics);
        return { count: keys.length, sampleId: keys[0], sample: keys.length > 0 ? topics[keys[0]] : null };
      }
      return { count: 0, msg: 'no progress in localStorage' };
    } catch (e) { return { error: e.message }; }
  });
  console.log(`localStorage progress:`, JSON.stringify(localTopicsCheck));

  await page.screenshot({ path: 'topic-verification.png', fullPage: true });
  await browser.close();
})();
