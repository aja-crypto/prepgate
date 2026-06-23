const { chromium } = require('playwright');

const FRONTEND = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  // Track API responses
  const apiResponses = [];
  page.on('response', (resp) => {
    if (resp.url().includes('/api/')) {
      apiResponses.push({ url: resp.url().substring(0, 80), status: resp.status() });
    }
  });

  try {
    // Intercept API calls to add X-Demo-User but KEEP Authorization
    await context.route('**/api/**', async (route) => {
      const headers = await route.request().allHeaders();
      headers['x-demo-user'] = 'true';
      await route.continue({ headers });
    });

    // Step 1: Go directly to subjects page (will go through auth -> demo user)
    console.log('=== Step 1: Direct navigation to /subjects ===');
    await page.goto(`${FRONTEND}/subjects`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v3-01-subjects.png', fullPage: true });
    console.log('URL:', page.url());
    
    // Check body text for subjects
    const bodyText = await page.locator('body').textContent();
    const hasSubjects = bodyText.includes('Computer') || bodyText.includes('Network') || bodyText.includes('Mathematics');
    console.log('Subjects content found:', hasSubjects);
    console.log('API responses:', apiResponses.filter(r => r.url.includes('/api/subjects') || r.url.includes('/api/topics')).map(r => `${r.status} ${r.url}`).join(', '));

    // Step 2: Navigate to topics page (some subject)
    console.log('\n=== Step 2: Going to subject detail page for OS ===');
    // Try different URL patterns
    const urlsToTry = [
      '/subjects/OS',
      '/subjects/cs',
      '/subjects/cs/it-and-software',
    ];
    for (const url of urlsToTry) {
      console.log(`Trying: ${url}`);
      await page.goto(`${FRONTEND}${url}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
      const text = await page.locator('body').textContent();
      if (text.includes('Topic') || text.includes('topic') || text.includes('Chapter') || text.includes('Syllabus')) {
        console.log('  Found topic content!');
        await page.screenshot({ path: `C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v3-${url.replace(/\//g, '-')}.png`, fullPage: true });
        break;
      }
    }

    // Step 3: Check all API responses for errors
    const failedApis = apiResponses.filter(r => r.status >= 400);
    console.log('\n=== API Results ===');
    console.log('Total API calls:', apiResponses.length);
    console.log('Failed APIs:', failedApis.length);
    failedApis.forEach(r => console.log(`  ${r.status} ${r.url}`));

    // Step 4: Check topic learn API directly
    console.log('\n=== Step 4: Check Topic Learn API ===');
    const learnResp = await page.request.get('http://localhost:5000/api/topics/6a3297f2d86d7b7af86d8f7e/learn', {
      headers: { 'X-Demo-User': 'true' }
    });
    const learnBody = await learnResp.json();
    console.log('Learn API status:', learnResp.status());
    console.log('Learn API success:', learnBody.success);

    console.log('\n=== Summary ===');
    console.log('Console errors:', errors.length);
    errors.forEach(e => console.log('  -', e.substring(0, 150)));
    if (errors.length === 0) console.log('No runtime errors!');

  } catch (err) {
    console.error('Error:', err.message);
  }

  await browser.close();
  console.log('\nDone');
})();
