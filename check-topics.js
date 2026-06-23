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
  const skip = await page.$('text=Skip');
  if (skip) await skip.click();

  // Navigate to subjects page
  await page.goto('http://localhost:5173/subjects', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log('Subjects URL:', page.url());
  const body = await page.evaluate(() => document.body.innerText.substring(0, 400));
  console.log('Subjects:', body.substring(0, 200));
  
  // Find a topic link and click it
  const topicLinks = await page.$$('a[href*="/learn/topic/"]');
  console.log('Topic links found:', topicLinks.length);
  
  if (topicLinks.length > 0) {
    const href = await topicLinks[0].getAttribute('href');
    console.log('Clicking:', href);
    await topicLinks[0].click();
    await page.waitForTimeout(5000);
    console.log('Topic URL:', page.url());
    const topicBody = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('Topic page:', topicBody.substring(0, 300));
    const hasError = topicBody.includes('Topic Not Available');
    console.log('Has Topic Not Available:', hasError ? 'YES' : 'NO');
  }
  
  // Check for "Progress is not defined" in all errors
  const progressErrors = jsErrors.filter(e => e.text.includes('Progress'));
  console.log('Progress errors:', progressErrors.length > 0 ? progressErrors : 'None');
  console.log('All JS errors:', jsErrors.length);

  await browser.close();
})();
