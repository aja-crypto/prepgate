const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text().substring(0,200)); });

  // Login
  await page.goto('http://localhost:5173/admin/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.fill('input[type="email"]', 'admin@gatenexa.dev');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Go to mock tests
  await page.goto('http://localhost:5173/admin/mock-tests', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);

  // Check initial state - no modal
  let body = await page.textContent('body');
  console.log('Before click - has Create Mock Test:', body.includes('Create Mock Test'));

  // Find and click the + New Test button
  const allBtns = await page.locator('button').all();
  for (const btn of allBtns) {
    const txt = await btn.textContent();
    if (txt.includes('New Test')) {
      console.log('Found New Test button');
      await btn.click({ force: true, timeout: 3000 });
      console.log('Clicked!');
      break;
    }
  }
  await page.waitForTimeout(2000);

  // Check state after click
  body = await page.textContent('body');
  console.log('After click - has Create Mock Test:', body.includes('Create Mock Test'));
  console.log('After click - has Subject selector:', body.includes('Subject *'));
  
  // Try clicking directly via JS
  console.log('\nTrying direct clickJS...');
  const newTestBtn = page.locator('button').filter({ hasText: 'New Test' });
  const count = await newTestBtn.count();
  console.log('Buttons with New Test text:', count);
  if (count > 0) {
    await newTestBtn.first().dispatchEvent('click');
    await page.waitForTimeout(1000);
    body = await page.textContent('body');
    console.log('After dispatchEvent - has Create Mock Test:', body.includes('Create Mock Test'));
  }

  await browser.close();
})();
