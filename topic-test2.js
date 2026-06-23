const { chromium } = require('playwright');
const FRONTEND = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[ERR] ${msg.text()}`); });
  page.on('pageerror', (err) => errors.push(`[PAGE] ${err.message}`));

  // Login via API
  const loginResp = await page.request.post('http://localhost:5000/api/auth/login', {
    data: { email: 'demo@gate2027.in', password: 'demo123' },
    headers: { 'X-Demo-User': 'true' },
  });
  const loginData = await loginResp.json();
  const token = loginData?.token || loginData?.accessToken || loginData?.data?.token;
  console.log(`Token: ${token ? 'YES (length=' + token.length + ')' : 'NO'}`);

  // Inject token and navigate
  await page.goto(`${FRONTEND}/subjects`, { waitUntil: 'networkidle', timeout: 15000 });
  // Set token in localStorage
  await page.evaluate((t) => { if (t) { localStorage.setItem('accessToken', t); localStorage.setItem('token', t); } }, token);
  // Reload
  await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log(`Errors: ${errors.length}`);

  // Check if subjects page loaded
  const body = await page.locator('body').textContent();
  const subjectsFound = ['Engineering Mathematics', 'Computer Networks', 'DBMS', 'Operating Systems', 'Algorithms'].filter(s => body.includes(s));
  console.log(`Subjects found: ${subjectsFound.length} (${subjectsFound.join(', ')})`);

  // Find topic links
  const links = await page.locator('a[href*="/learn/topic/"]').all();
  console.log(`Topic links on page: ${links.length}`);

  if (links.length > 0) {
    const href = await links[0].getAttribute('href');
    console.log(`First topic link: ${href}`);
  }

  // Navigate to Engineering Mathematics subject page directly
  console.log('\n=== Subject Detail Page (/subjects/EM) ===');
  await page.goto(`${FRONTEND}/subjects/EM`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const body2 = await page.locator('body').textContent();
  console.log(`"No topics found": ${body2.includes('No topics found')}`);
  console.log(`"Topic Not Available": ${body2.includes('Topic Not Available')}`);

  const emLinks = await page.locator('a[href*="/learn/topic/"]').all();
  console.log(`Topic links: ${emLinks.length}`);
  if (emLinks.length > 0) {
    for (let i = 0; i < Math.min(3, emLinks.length); i++) {
      const href = await emLinks[i].getAttribute('href');
      const text = await emLinks[i].textContent();
      console.log(`  [${i}] ${text.trim().substring(0, 30)} -> ${href}`);
    }

    // Click the first topic
    await emLinks[0].click();
    await page.waitForTimeout(3000);

    const body3 = await page.locator('body').textContent();
    console.log(`\nTopic Detail Page:`);
    console.log(`  "Topic Not Available": ${body3.includes('Topic Not Available')}`);
    console.log(`  "Topic not found": ${body3.toLowerCase().includes('not found')}`);
    console.log(`  "Linear Algebra": ${body3.includes('Linear Algebra')}`);
    console.log(`  Title: ${await page.title()}`);
  }

  // Try TopicsPage
  console.log('\n=== TopicsPage (/topics) ===');
  await page.goto(`${FRONTEND}/topics`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const body4 = await page.locator('body').textContent();
  const tpLinks = await page.locator('a[href*="/learn/topic/"]').all();
  console.log(`Topic links: ${tpLinks.length}`);
  console.log(`"Topics" header: ${body4.includes('Topics')}`);

  if (tpLinks.length > 0) {
    const href = await tpLinks[0].getAttribute('href');
    const text = await tpLinks[0].textContent();
    console.log(`First: ${text.trim().substring(0, 30)} -> ${href}`);
  }

  // Direct topic access
  console.log('\n=== Direct Topic Access ===');
  const apiResp = await page.request.get('http://localhost:5000/api/topics', { headers: { 'X-Demo-User': 'true' } });
  const apiData = await apiResp.json();
  if (apiData.data && apiData.data.length > 0) {
    const tid = apiData.data[0]._id;
    const tname = apiData.data[0].name;
    console.log(`Direct access: /learn/topic/${tid} (${tname})`);
    await page.goto(`${FRONTEND}/learn/topic/${tid}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    const body5 = await page.locator('body').textContent();
    console.log(`  "Topic Not Available": ${body5.includes('Topic Not Available')}`);
    console.log(`  Topic name "${tname}": ${body5.includes(tname)}`);
  }

  console.log(`\nTotal console errors: ${errors.length}`);
  errors.forEach(e => console.log(`  ${e.substring(0, 120)}`));

  await page.screenshot({ path: 'topic-test-final2.png', fullPage: true });
  await browser.close();
})();
