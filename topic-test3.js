const { chromium } = require('playwright');
const FRONTEND = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Intercept API calls to add X-Demo-User header
  await context.route('**/api/**', async (route) => {
    const headers = await route.request().allHeaders();
    headers['x-demo-user'] = 'true';
    await route.continue({ headers });
  });

  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[ERR] ${msg.text()}`); });

  // Navigate to landing page, enter demo mode
  await page.goto(FRONTEND, { waitUntil: 'networkidle', timeout: 15000 });

  // Try clicking "Explore Demo Mode" or "Try Demo" or "Demo"
  const demoBtn = page.locator('button, a').filter({ hasText: /Demo/i }).first();
  if (await demoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Found demo button, clicking...');
    await demoBtn.click();
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => page.waitForTimeout(3000));
  } else {
    // Try localStorage approach
    console.log('No demo button, trying localStorage...');
    await page.goto(`${FRONTEND}/subjects`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Try Subjects page directly
  await page.goto(`${FRONTEND}/subjects`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  let body = await page.locator('body').textContent();
  console.log(`Subjects page - subjects visible: ${body.includes('Engineering Mathematics') || body.includes('Aptitude')}`);
  console.log(`Login form: ${body.includes('login') || body.includes('Login')}`);
  console.log(`Url: ${page.url()}`);

  if (body.includes('login') || body.includes('Login') || page.url().includes('login')) {
    console.log('Redirected to login - trying guest/demo access');
    // Check if there's a guest/demo link
    const guestBtn = page.locator('button, a').filter({ hasText: /(Guest|Demo|Skip|Continue|Explore)/i }).first();
    if (await guestBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await guestBtn.click();
      await page.waitForTimeout(3000);
      body = await page.locator('body').textContent();
      console.log(`After guest click: ${page.url()}`);
    }
  }

  // Now try topics
  body = await page.locator('body').textContent();
  console.log(`\n=== Subjects check ===`);
  const subs = ['Engineering Mathematics', 'Computer Networks', 'DBMS', 'Operating Systems', 'Digital Logic', 'COA', 'Programming', 'Data Structures', 'Algorithms', 'TOC', 'Compiler Design'];
  subs.forEach(s => { if (body.includes(s)) console.log(`  Found: ${s}`); });

  // Navigate to subject
  console.log(`\n=== EM Subject Detail ===`);
  await page.goto(`${FRONTEND}/subjects/EM`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  body = await page.locator('body').textContent();
  console.log(`"No topics found": ${body.includes('No topics found')}`);
  console.log(`"Topic Not Available": ${body.includes('Topic Not Available')}`);

  const links = page.locator('a[href*="/learn/topic/"]');
  const lc = await links.count();
  console.log(`Topic links: ${lc}`);
  for (let i = 0; i < Math.min(3, lc); i++) {
    const href = await links.nth(i).getAttribute('href');
    const text = await links.nth(i).textContent();
    console.log(`  [${i}] ${text.trim().substring(0, 35)} -> ${href}`);
  }

  if (lc > 0) {
    // Check topic detail
    const href = await links.first().getAttribute('href');
    await page.goto(`${FRONTEND}${href}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    body = await page.locator('body').textContent();
    console.log(`\nTopic Detail:`);
    console.log(`  "Topic Not Available": ${body.includes('Topic Not Available')}`);
    console.log(`  Title: ${await page.title()}`);
  }

  // Direct from API
  console.log(`\n=== Direct API verification ===`);
  const apiResp = await page.request.get('http://localhost:5000/api/topics?withProgress=true', {
    headers: { 'X-Demo-User': 'true' }
  });
  const apiData = await apiResp.json();
  console.log(`API topics: ${apiData.count || 0}`);
  if (apiData.data && apiData.data.length > 0) {
    console.log(`First: ${apiData.data[0]._id} - ${apiData.data[0].name}`);
    console.log(`Subject ref: ${apiData.data[0].subject?.name || apiData.data[0].subject?.code || 'object'}`);

    const tid = apiData.data[0]._id;
    const resp = await page.request.get(`http://localhost:5000/api/topics/${tid}/learn`, {
      headers: { 'X-Demo-User': 'true' }
    });
    const detailData = await resp.json();
    console.log(`Detail API: success=${detailData.success} name=${detailData?.data?.topic?.name || 'N/A'}`);
  }

  console.log(`\nConsole errors: ${errors.length}`);
  errors.forEach(e => console.log(`  ${e.substring(0, 120)}`));

  await page.screenshot({ path: 'topic-test-final3.png', fullPage: true });
  await browser.close();
})();
