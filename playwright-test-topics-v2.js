const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
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
    console.log('=== Step 1: Landing page ===');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 15000 });
    console.log('Title:', await page.title());
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v2-01-landing.png', fullPage: true });

    // Check for demo/guest/explore button
    const buttons = await page.locator('button, a[role="button"], [class*="btn"], [class*="Button"]').all();
    console.log('Buttons on page:', buttons.length);
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text) console.log(`  Button: "${text.trim().substring(0, 50)}"`);
    }

    // Check for links
    const links = await page.locator('a').all();
    console.log('Links on page:', links.length);
    let demoLink = null;
    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (text) console.log(`  Link: "${text.trim().substring(0, 50)}" -> ${href}`);
      if (href && (href.includes('demo') || href.includes('guest') || href === '/subjects' || href === '/dashboard')) {
        demoLink = link;
      }
    }

    // Try clicking Get Started or login
    if (demoLink) {
      console.log('\n=== Clicking demo/guest link ===');
      await demoLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v2-after-click.png', fullPage: true });
    } else {
      // Try going directly to login
      console.log('\n=== Going to login page ===');
      await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v2-login.png', fullPage: true });

      // Find all buttons on login page
      const loginButtons = await page.locator('button, a[role="button"], [class*="btn"], [class*="Button"]').all();
      console.log('Buttons on login page:', loginButtons.length);
      for (const btn of loginButtons) {
        const text = await btn.textContent();
        if (text) console.log(`  Button: "${text.trim().substring(0, 60)}"`);
      }

      // Try typing demo credentials
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email" i]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
        console.log('Found email/password fields - trying demo credentials');
        await emailInput.fill('demo@gate2027.in');
        await passwordInput.fill('demo123');
        await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v2-login-filled.png', fullPage: true });

        // Click submit button
        const submitBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Sign in")').first();
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
          await page.waitForTimeout(4000);
          await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v2-after-login.png', fullPage: true });
          console.log('Current URL:', page.url());
        }
      }
    }

    // Check current URL
    console.log('\n=== Current state ===');
    console.log('URL:', page.url());
    console.log('Errors so far:', errors.length);

    // Step: Navigate to subjects
    console.log('\n=== Navigating to /subjects ===');
    await page.goto(`${TARGET_URL}/subjects`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v2-subjects.png', fullPage: true });
    console.log('URL after subjects:', page.url());

    // Check for subject content
    const bodyText = await page.locator('body').textContent();
    const hasSubjectCards = bodyText.includes('Computer') || bodyText.includes('Network') || bodyText.includes('OS') || bodyText.includes('Math');
    console.log('Has subject mentions:', hasSubjectCards);

    // Check all subject links
    const allLinks = await page.locator('a').all();
    let subjectCount = 0;
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && href.includes('/subjects/')) {
        subjectCount++;
        const text = await link.textContent();
        console.log(`  Subject link: "${text?.trim().substring(0, 40)}" -> ${href}`);
      }
    }
    console.log('Total subject links:', subjectCount);

    // Click first subject link
    if (subjectCount > 0) {
      const firstSubject = page.locator('a[href*="/subjects/"]').first();
      console.log('\n=== Clicking first subject ===');
      await firstSubject.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v2-subject-detail.png', fullPage: true });
      console.log('URL:', page.url());

      // Look for topic links
      const pageLinks = await page.locator('a').all();
      let topicCount = 0;
      for (const link of pageLinks) {
        const href = await link.getAttribute('href');
        if (href && (href.includes('/topics/') || href.includes('/learn/'))) {
          topicCount++;
          const text = await link.textContent();
          console.log(`  Topic link: "${text?.trim().substring(0, 40)}" -> ${href}`);
        }
      }
      console.log('Total topic links:', topicCount);

      // Click first topic link
      if (topicCount > 0) {
        const firstTopic = page.locator('a[href*="/topics/"], a[href*="/learn/"]').first();
        console.log('\n=== Clicking first topic ===');
        await firstTopic.click();
        await page.waitForTimeout(4000);
        await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v2-topic-learn.png', fullPage: true });
        console.log('URL:', page.url());

        const content = await page.content();
        const hasError = content.includes('Topic Not Available') || errors.some(e => e.includes('Topic Not Available'));
        const hasProgressError = errors.some(e => e.includes('Progress is not defined'));
        console.log('"Topic Not Available" on page:', hasError);
        console.log('"Progress is not defined" error:', hasProgressError);

        if (!hasError && !hasProgressError) {
          console.log('SUCCESS - Topic learn page works!');
        } else {
          console.log('FAIL - Errors on topic page');
        }
      } else {
        console.log('No topic links found on subject page');
      }
    } else {
      console.log('No subject links found. Checking page content...');
      const links2 = await page.locator('a').all();
      console.log('Total links on page:', links2.length);
      for (const link of links2) {
        const href = await link.getAttribute('href');
        if (href) console.log(`  href: ${href.substring(0, 60)} -> "${(await link.textContent())?.trim().substring(0, 40)}"`);
      }
    }

    console.log('\n=== Summary ===');
    console.log('Total errors:', errors.length);
    errors.forEach(e => console.log('  -', e.substring(0, 200)));
    if (errors.length === 0) console.log('No errors detected!');

  } catch (err) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'C:\\Users\\purru\\OneDrive\\GATE 2026\\gate2027\\screenshots\\v2-error.png', fullPage: true });
  }

  await page.waitForTimeout(2000);
  await browser.close();
  console.log('\nDone');
})();
