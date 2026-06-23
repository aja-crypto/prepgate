const { chromium } = require('playwright');
const FRONTEND = 'http://localhost:5173';
const API = 'http://localhost:5000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[ERR] ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`[PAGE] ${err.message}`) );

  // Login
  await page.goto(FRONTEND, { waitUntil: 'networkidle', timeout: 15000 });
  await page.locator('button:has-text("Explore Demo Mode")').click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Dismiss onboarding
  const skip = page.locator('button:has-text("Skip")').first();
  if (await skip.isVisible({ timeout: 2000 }).catch(() => false)) await skip.click();

  // Test 1: Navigate to /subjects and click a subject
  console.log('=== Test 1: Navigate to subjects ===');
  await page.goto(`${FRONTEND}/subjects`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log('Errors so far:', errors.length);
  errors.length = 0;

  console.log('=== Test 2: Click "Engineering Mathematics" ===');
  // Find and click Engineering Mathematics
  const emButton = page.locator('button:has-text("Engineering Mathematics")').first();
  if (await emButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emButton.click();
    await page.waitForTimeout(2000);
    console.log('Expanded Engineering Mathematics');
  } else {
    // Try clicking the subject card directly
    const emCard = page.locator('text=Engineering Mathematics').first();
    if (await emCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emCard.click();
      await page.waitForTimeout(2000);
      console.log('Clicked EM card');
    }
  }

  // Look for topic links
  console.log('=== Test 3: Click first topic link ===');
  const topics = page.locator('a[href*="/learn/topic/"]');
  const count = await topics.count();
  console.log(`Found ${count} topic links`);

  if (count > 0) {
    const href = await topics.first().getAttribute('href');
    console.log(`First topic link: ${href}`);
    await topics.first().click();
    await page.waitForTimeout(3000);
    const body = await page.locator('body').textContent();
    console.log(`Topic detail page contains "Topic Not Available": ${body.includes('Topic Not Available')}`);
    console.log(`Topic detail page contains "Topic not found": ${body.includes('Topic not found')}`);
    console.log(`Topic detail page contains topic name: ${body.includes('Linear') || body.includes('Algebra')}`);
  } else {
    // Try /subjects/EM page
    console.log('No topic links on SubjectsPage. Trying SubjectDetailPage...');
    await page.goto(`${FRONTEND}/subjects/EM`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const topicLinks2 = page.locator('a[href*="/learn/topic/"]');
    const count2 = await topicLinks2.count();
    console.log(`Found ${count2} topic links on SubjectDetailPage`);
    const body2 = await page.locator('body').textContent();
    console.log(`Contains "No topics found": ${body2.includes('No topics found')}`);

    if (count2 > 0) {
      const href2 = await topicLinks2.first().getAttribute('href');
      console.log(`First topic link: ${href2}`);
      await topicLinks2.first().click();
      await page.waitForTimeout(3000);
      const body3 = await page.locator('body').textContent();
      console.log(`Topic detail: "Topic Not Available"=${body3.includes('Topic Not Available')}, "not found"=${body3.includes('not found')}`);
    }
  }

  // Test 3: Try TopicsPage
  console.log('\n=== Test 4: Navigate to /topics ===');
  await page.goto(`${FRONTEND}/topics`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const topicCards = page.locator('a[href*="/learn/topic/"]');
  const tc = await topicCards.count();
  console.log(`Found ${tc} topic links on TopicsPage`);
  const body4 = await page.locator('body').textContent();
  console.log(`Has "Topics": ${body4.includes('Topics')}, Has topics data: ${tc > 0}`);

  // Test 4: Direct navigation to topic
  console.log('\n=== Test 5: Direct access to a topic ===');
  const apiResp = await page.request.get(`${API}/api/topics`, { headers: { 'X-Demo-User': 'true' } });
  const apiData = await apiResp.json();
  if (apiData.data && apiData.data.length > 0) {
    const firstTopicId = apiData.data[0]._id;
    const firstTopicName = apiData.data[0].name;
    console.log(`Going directly to /learn/topic/${firstTopicId} (${firstTopicName})`);
    await page.goto(`${FRONTEND}/learn/topic/${firstTopicId}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const body5 = await page.locator('body').textContent();
    console.log(`Topic "Not Available": ${body5.includes('Topic Not Available')}`);
    console.log(`Topic name found: ${body5.includes(firstTopicName)}`);
    console.log(`"not found": ${body5.includes('not found')}`);
  }

  console.log('\n=== ALL ERRORS ===');
  errors.forEach(e => console.log(`  ${e.substring(0, 150)}`));

  await page.screenshot({ path: 'topic-test-final.png', fullPage: true });
  await browser.close();
})();
