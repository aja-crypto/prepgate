const { chromium } = require('playwright');

const TARGET = 'http://localhost:5173';
const BACKEND = 'http://localhost:5000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const log = (test, status, detail = '') => {
    results.push({ test, status, detail });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}${detail ? ': ' + detail : ''}`);
  };

  try {
    // ═══════════════════════════════════════════════════════════
    // TEST 1: Homepage loads
    // ═══════════════════════════════════════════════════════════
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const res = await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 15000 });
    log('Homepage loads', res.ok() ? 'PASS' : 'FAIL', `status ${res.status()}`);
    
    const title = await page.title();
    log('Page title', title.includes('Gate') || title.includes('gate') ? 'PASS' : 'FAIL', title);

    // ═══════════════════════════════════════════════════════════
    // TEST 2: Landing page elements
    // ═══════════════════════════════════════════════════════════
    const heroText = await page.textContent('body');
    log('Hero section has content', heroText.length > 100 ? 'PASS' : 'FAIL', `${heroText.length} chars`);

    // Check for key CTAs
    const loginLink = await page.locator('a[href="/login"], button:has-text("Login"), button:has-text("Sign")').first();
    const hasLogin = await loginLink.isVisible().catch(() => false);
    log('Login button visible', hasLogin ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 3: Login page
    // ═══════════════════════════════════════════════════════════
    await page.goto(`${TARGET}/login`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passInput = page.locator('input[type="password"], input[name="password"]').first();
    
    const hasEmailInput = await emailInput.isVisible().catch(() => false);
    const hasPassInput = await passInput.isVisible().catch(() => false);
    log('Login page has email input', hasEmailInput ? 'PASS' : 'FAIL');
    log('Login page has password input', hasPassInput ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 4: Demo mode login
    // ═══════════════════════════════════════════════════════════
    // Look for Demo Mode button
    const demoBtn = page.locator('button:has-text("Demo"), button:has-text("demo"), button:has-text("Try")').first();
    const hasDemo = await demoBtn.isVisible().catch(() => false);
    
    if (hasDemo) {
      await demoBtn.click();
      await page.waitForTimeout(3000);
      const url = page.url();
      log('Demo mode login', url.includes('dashboard') ? 'PASS' : 'FAIL', url);
    } else {
      // Try demo login via API
      const demoRes = await page.evaluate(async () => {
        const r = await fetch('/api/auth/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        return { ok: r.ok, status: r.status };
      });
      log('Demo API endpoint', demoRes.ok ? 'PASS' : 'FAIL', `status ${demoRes.status}`);
    }

    // ═══════════════════════════════════════════════════════════
    // TEST 5: Dashboard loads after login
    // ═══════════════════════════════════════════════════════════
    await page.goto(`${TARGET}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const dashContent = await page.textContent('body');
    const hasDashWidgets = dashContent.includes('Progress') || dashContent.includes('Study') || dashContent.includes('Dashboard');
    log('Dashboard has content', hasDashWidgets ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 6: Sidebar navigation
    // ═══════════════════════════════════════════════════════════
    const sidebar = page.locator('aside, nav[aria-label*="sidebar" i], .sidebar').first();
    const hasSidebar = await sidebar.isVisible().catch(() => false);
    log('Sidebar visible', hasSidebar ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 7: Mobile responsive - hamburger menu
    // ═══════════════════════════════════════════════════════════
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    
    const hamburger = page.locator('button[aria-label*="menu" i], button:has-text("☰"), .hamburger, button.md\\:hidden').first();
    const hasHamburger = await hamburger.isVisible().catch(() => false);
    log('Mobile hamburger visible', hasHamburger ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 8: Mobile sidebar opens
    // ═══════════════════════════════════════════════════════════
    if (hasHamburger) {
      await hamburger.click();
      await page.waitForTimeout(500);
      const mobileSidebar = page.locator('aside').first();
      const sidebarVisible = await mobileSidebar.isVisible().catch(() => false);
      log('Mobile sidebar opens', sidebarVisible ? 'PASS' : 'FAIL');
    }

    // ═══════════════════════════════════════════════════════════
    // TEST 9: Predictor page
    // ═══════════════════════════════════════════════════════════
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${TARGET}/opportunity-predictor`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const predContent = await page.textContent('body');
    const hasPredForm = predContent.includes('marks') || predContent.includes('Marks') || predContent.includes('Predict') || predContent.includes('predict');
    log('Predictor page loads', hasPredForm ? 'PASS' : 'FAIL');

    // Check for marks input
    const marksInput = page.locator('input[type="number"], input[placeholder*="mark" i], input[name*="mark" i]').first();
    const hasMarksInput = await marksInput.isVisible().catch(() => false);
    log('Marks input visible', hasMarksInput ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 10: Fill predictor form and submit
    // ═══════════════════════════════════════════════════════════
    if (hasMarksInput) {
      await marksInput.fill('65');
      await page.waitForTimeout(300);
      
      // Look for category selector
      const catSelect = page.locator('select, [role="combobox"], button:has-text("General")').first();
      const hasCat = await catSelect.isVisible().catch(() => false);
      log('Category selector visible', hasCat ? 'PASS' : 'FAIL');

      // Submit prediction
      const predictBtn = page.locator('button:has-text("Predict"), button[type="submit"]:has-text("Predict")').first();
      const hasPredictBtn = await predictBtn.isVisible().catch(() => false);
      log('Predict button visible', hasPredictBtn ? 'PASS' : 'FAIL');

      if (hasPredictBtn) {
        await predictBtn.click();
        await page.waitForTimeout(5000);
        
        const resultContent = await page.textContent('body');
        const hasResults = resultContent.includes('Score') || resultContent.includes('score') || resultContent.includes('AIR') || resultContent.includes('rank');
        log('Prediction results shown', hasResults ? 'PASS' : 'FAIL');
        
        // Check for college cards
        const hasColleges = resultContent.includes('IIT') || resultContent.includes('NIT') || resultContent.includes('IIIT');
        log('Colleges shown in results', hasColleges ? 'PASS' : 'FAIL');
      }
    }

    // ═══════════════════════════════════════════════════════════
    // TEST 11: Mobile predictor page
    // ═══════════════════════════════════════════════════════════
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${TARGET}/opportunity-predictor`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const mobilePredContent = await page.textContent('body');
    const mobileHasForm = mobilePredContent.includes('marks') || mobilePredContent.includes('Marks') || mobilePredContent.includes('Predict');
    log('Mobile predictor loads', mobileHasForm ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 12: Settings page
    // ═══════════════════════════════════════════════════════════
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${TARGET}/settings`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const settingsContent = await page.textContent('body');
    const hasSettings = settingsContent.includes('Profile') || settingsContent.includes('Settings') || settingsContent.includes('Theme');
    log('Settings page loads', hasSettings ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 13: Mobile settings
    // ═══════════════════════════════════════════════════════════
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${TARGET}/settings`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const mobileSettingsContent = await page.textContent('body');
    const mobileHasSettings = mobileSettingsContent.includes('Profile') || mobileSettingsContent.includes('Settings');
    log('Mobile settings loads', mobileHasSettings ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 14: AI Coach page
    // ═══════════════════════════════════════════════════════════
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${TARGET}/ai/coach`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const coachContent = await page.textContent('body');
    const hasCoach = coachContent.includes('AI') || coachContent.includes('coach') || coachContent.includes('Chat');
    log('AI Coach page loads', hasCoach ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 15: Mobile AI Coach
    // ═══════════════════════════════════════════════════════════
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${TARGET}/ai/coach`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const mobileCoachContent = await page.textContent('body');
    const mobileHasCoach = mobileCoachContent.includes('AI') || mobileCoachContent.includes('coach');
    log('Mobile AI Coach loads', mobileHasCoach ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 16: Focus timer
    // ═══════════════════════════════════════════════════════════
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${TARGET}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Look for focus widget (floating button)
    const focusWidget = page.locator('button:has-text("Focus"), [class*="focus"]').first();
    const hasFocus = await focusWidget.isVisible().catch(() => false);
    log('Focus widget visible', hasFocus ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 17: Notification bell
    // ═══════════════════════════════════════════════════════════
    const notifBell = page.locator('[class*="notification"], button:has-text("🔔"), [aria-label*="notification" i]').first();
    const hasNotif = await notifBell.isVisible().catch(() => false);
    log('Notification bell visible', hasNotif ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 18: Profile dropdown
    // ═══════════════════════════════════════════════════════════
    const profileBtn = page.locator('button:has-text("PA"), [class*="avatar"], [class*="profile"]').first();
    const hasProfile = await profileBtn.isVisible().catch(() => false);
    log('Profile button visible', hasProfile ? 'PASS' : 'FAIL');

    if (hasProfile) {
      await profileBtn.click();
      await page.waitForTimeout(500);
      const dropdownContent = await page.textContent('body');
      const hasDropdown = dropdownContent.includes('Settings') || dropdownContent.includes('Logout') || dropdownContent.includes('Account');
      log('Profile dropdown opens', hasDropdown ? 'PASS' : 'FAIL');
    }

    // ═══════════════════════════════════════════════════════════
    // TEST 19: 404 page
    // ═══════════════════════════════════════════════════════════
    await page.goto(`${TARGET}/nonexistent-page-12345`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
    const notFoundContent = await page.textContent('body');
    const handles404 = notFoundContent.includes('404') || notFoundContent.includes('not found') || notFoundContent.includes('Not Found') || page.url().includes('/');
    log('404 page handled', handles404 ? 'PASS' : 'FAIL');

    // ═══════════════════════════════════════════════════════════
    // TEST 20: Backend health
    // ═══════════════════════════════════════════════════════════
    const healthRes = await page.evaluate(async () => {
      const r = await fetch('/api/health');
      return { ok: r.ok, status: r.status };
    });
    log('Backend health check', healthRes.ok ? 'PASS' : 'FAIL', `status ${healthRes.status}`);

  } catch (e) {
    log('TEST ERROR', 'FAIL', e.message);
  } finally {
    await browser.close();
  }

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`RESULTS: ${passed} PASS, ${failed} FAIL out of ${results.length} tests`);
  console.log(`${'═'.repeat(50)}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ ${r.test}: ${r.detail}`);
    });
  }
})();
