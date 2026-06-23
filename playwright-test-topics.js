const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  // Intercept all API calls and add X-Demo-User header
  await context.route('**/api/**', async (route) => {
    const headers = route.request().headers();
    headers['X-Demo-User'] = 'true';
    // Remove Authorization header if present to force demo flow
    delete headers['authorization'];
    delete headers['Authorization'];
    await route.continue({ headers });
  });

  const page = await context.newPage();

  // Listen for console errors
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  try {
    // Step 1: Go to landing page
    console.log('=== Step 1: Navigating to landing page ===');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 15000 });
    console.log('Title:', await page.title());
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\01-landing.png', fullPage: true });
    console.log('OK - landing page loaded\n');

    // Step 2: Navigate to login
    console.log('=== Step 2: Navigating to login page ===');
    await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\02-login.png', fullPage: true });
    console.log('OK - login page loaded\n');

    // Step 3: Navigate to subjects page
    console.log('=== Step 3: Navigating to subjects page ===');
    await page.goto(`${TARGET_URL}/subjects`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\03-subjects.png', fullPage: true });
    
    // Check for errors
    const pageContent = await page.content();
    const hasTopicNotAvailable = pageContent.includes('Topic Not Available');
    console.log('Has "Topic Not Available" error:', hasTopicNotAvailable);
    
    // Check for subject cards
    const subjectCards = await page.locator('[class*="subject"], [class*="Subject"], a[href*="/subjects/"]').count();
    console.log('Subject links found:', subjectCards);
    
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
    console.log('OK - subjects page loaded\n');

    // Step 4: Try to click first subject
    console.log('=== Step 4: Clicking first subject ===');
    const subjectLink = page.locator('a[href*="/subjects/"]').first();
    if (await subjectLink.count() > 0) {
      await subjectLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\04-subject-detail.png', fullPage: true });
      console.log('OK - subject detail page loaded\n');

      // Step 5: Look for topic links
      console.log('=== Step 5: Looking for topic links ===');
      const topicLinks = page.locator('a[href*="/topics/"], a[href*="/topic/"], [class*="topic"] a, button:has-text("Learn")');
      const topicCount = await topicLinks.count();
      console.log('Topic links found:', topicCount);
      await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\05-topics-list.png', fullPage: true });

      // Step 6: Try to click first topic
      if (topicCount > 0) {
        console.log('=== Step 6: Clicking first topic ===');
        await topicLinks.first().click();
        await page.waitForTimeout(4000);
        await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\06-topic-learn.png', fullPage: true });
        
        const learnContent = await page.content();
        const topicNotAvail = learnContent.includes('Topic Not Available');
        const hasProgressError = learnContent.includes('Progress is not defined') || errors.some(e => e.includes('Progress is not defined'));
        console.log('Has "Topic Not Available":', topicNotAvail);
        console.log('Has "Progress is not defined":', hasProgressError);
        if (!topicNotAvail && !hasProgressError) {
          console.log('SUCCESS - Topic learn page loaded without errors!');
        } else {
          console.log('FAIL - Errors found on topic learn page');
          console.log('Errors:', errors);
        }
      }
    }

    // Check all API call statuses
    console.log('\n=== Summary ===');
    console.log('Total console errors:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    } else {
      console.log('No runtime errors detected!');
    }

  } catch (err) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\error.png', fullPage: true });
  }

  await page.waitForTimeout(2000);
  await browser.close();
  console.log('\nDone');
})();
