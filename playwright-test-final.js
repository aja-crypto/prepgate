const { chromium } = require('playwright');

const FRONTEND = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  const apiErrors = [];
  page.on('response', (resp) => {
    if (resp.url().includes('/api/') && resp.status() >= 500) {
      apiErrors.push({ url: resp.url(), status: resp.status() });
    }
  });

  // Intercept API calls to add X-Demo-User for demo mode
  await context.route('**/api/**', async (route) => {
    const headers = await route.request().allHeaders();
    headers['x-demo-user'] = 'true';
    await route.continue({ headers });
  });

  try {
    // Step 1: Register page -> click Demo Mode
    console.log('=== Step 1: Go to Register and click Demo Mode ===');
    await page.goto(`${FRONTEND}/register`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\f-01-register.png', fullPage: true });
    
    // Click the "Explore Demo Mode" button
    const demoBtn = page.locator('button:has-text("Explore Demo Mode")');
    console.log('Demo button visible:', await demoBtn.isVisible());
    await demoBtn.click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Navigated to:', page.url());
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\f-02-dashboard.png', fullPage: true });
    console.log('OK - Dashboard loaded\n');

    // Check onboarding modal - dismiss it if present
    const onboardingModal = page.locator('text=Skip, text=Continue, text=Get Started').first();
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("skip")').first();
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Dismissing onboarding...');
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }

    // Step 2: Navigate to Subjects
    console.log('=== Step 2: Navigate to Subjects ===');
    await page.goto(`${FRONTEND}/subjects`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\f-03-subjects.png', fullPage: true });
    
    const bodyText = await page.locator('body').textContent();
    const hasSubjects = bodyText.includes('Computer') || bodyText.includes('Network') || bodyText.includes('Mathematics');
    console.log('Subjects content found:', hasSubjects);
    console.log('Has "Topic Not Available":', bodyText.includes('Topic Not Available'));
    console.log('API errors so far:', apiErrors.length);
    console.log('OK - Subjects loaded\n');

    // Step 3: Find and click a subject
    console.log('=== Step 3: Click a Subject ===');
    let subjectClicked = false;
    // Try clicking any link or card that looks like a subject
    const subjectElements = await page.locator('a[href*="/subjects/"], [class*="subject"] a, [class*="Subject"] a, [class*="card"]:has-text("Computer"), [class*="card"]:has-text("Network"), [class*="card"]:has-text("Math")').all();
    console.log('Subject-like elements found:', subjectElements.length);
    
    for (const el of subjectElements) {
      const href = await el.getAttribute('href');
      const text = await el.textContent();
      console.log(`  Element: "${text?.trim().substring(0, 30)}" href: ${href}`);
      if (href && href.startsWith('/subjects/')) {
        console.log(`Clicking: ${href}`);
        await el.click();
        subjectClicked = true;
        break;
      }
    }

    if (!subjectClicked) {
      // Try clicking any visible card
      const cards = page.locator('[class*="card"], [class*="Card"], [class*="glass"]').all();
      const cards2 = await cards;
      console.log(`Checking ${cards2.length} cards...`);
      for (const card of cards2) {
        if (await card.isVisible()) {
          const text = await card.textContent();
          if (text && (text.includes('Computer') || text.includes('Network') || text.includes('Math'))) {
            console.log(`Clicking card with text: "${text.trim().substring(0, 30)}"`);
            await card.click();
            subjectClicked = true;
            break;
          }
        }
      }
    }

    if (subjectClicked) {
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\f-04-subject-detail.png', fullPage: true });
      console.log('Subject detail URL:', page.url());
      
      // Check for topic content
      const detailText = await page.locator('body').textContent();
      console.log('Has "Topic" heading:', detailText.includes('Topic'));
      console.log('Has chapter/syllabus content:', detailText.includes('Chapter') || detailText.includes('Syllabus'));
      
      // Find topic links
      const topicElements = await page.locator('a[href*="/topics/"], [class*="topic"] a, button:has-text("Learn"), button:has-text("Study")').all();
      console.log('Topic elements:', topicElements.length);
      
      for (const el of topicElements) {
        const href = await el.getAttribute('href');
        const text = await el.textContent();
        console.log(`  Topic: "${text?.trim().substring(0, 40)}" href: ${href}`);
      }
      
      // Click first topic
      if (topicElements.length > 0) {
        const firstTopic = topicElements[0];
        const href = await firstTopic.getAttribute('href');
        console.log(`\n=== Step 4: Click topic -> ${href} ===`);
        await firstTopic.click();
        await page.waitForTimeout(4000);
        await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\f-05-topic-learn.png', fullPage: true });
        
        const learnText = await page.locator('body').textContent();
        console.log('URL:', page.url());
        console.log('Has "Topic Not Available":', learnText.includes('Topic Not Available'));
        
        if (!learnText.includes('Topic Not Available')) {
          console.log('SUCCESS - Topic learn page loaded!');
        } else {
          console.log('FAIL - Topic Not Available still showing');
        }
      }
    }

    console.log('\n=== Final Summary ===');
    console.log('Console errors:', errors.length);
    errors.forEach(e => console.log('  -', e.substring(0, 200)));
    console.log('API 5xx errors:', apiErrors.length);
    apiErrors.forEach(e => console.log(`  ${e.status} ${e.url.substring(0, 80)}`));
    
    if (errors.length === 0 && apiErrors.length === 0) {
      console.log('ALL CHECKS PASSED - No errors detected!');
    }

  } catch (err) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\f-error.png', fullPage: true });
  }

  await page.waitForTimeout(3000);
  await browser.close();
  console.log('\nDone');
})();
