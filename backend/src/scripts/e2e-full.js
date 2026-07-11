const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];
  const log = (t, s, d='') => { results.push({t,s,d}); console.log((s==='PASS'?'✅':'❌')+' '+t+(d?': '+d:'')); };
  const wait = (ms) => page.waitForTimeout(ms);

  async function safeText() {
    try { return await page.textContent('body', {timeout:5000}); } catch { return ''; }
  }

  async function isVisible(sel, timeout=3000) {
    try { return await page.locator(sel).first().isVisible({timeout}); } catch { return false; }
  }

  try {
    // ═══════════════════════════════════════
    // DESKTOP (1920×1080)
    // ═══════════════════════════════════════
    await page.setViewportSize({width:1920,height:1080});

    // 1. Homepage
    await page.goto('http://localhost:5173', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    log('D1: Homepage loads', (await page.title())?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/01-homepage.png'});

    // 2. Login page
    await page.goto('http://localhost:5173/login', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    log('D2: Email input', await isVisible('input[type="email"], input[placeholder*="email" i]')?'PASS':'FAIL');
    log('D3: Password input', await isVisible('input[type="password"]')?'PASS':'FAIL');
    log('D4: Sign In button', await isVisible('button:has-text("Sign In")')?'PASS':'FAIL');
    log('D5: Google OAuth', await isVisible('text=Sign in with Google')?'PASS':'FAIL');
    log('D6: Demo Mode link', await isVisible('text=Try Demo Mode')?'PASS':'FAIL');
    log('D7: Sign up link', await isVisible('a:has-text("Sign up")')?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/02-login.png'});

    // 3. Register page
    await page.goto('http://localhost:5173/register', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    log('D8: Register - name', await isVisible('input[placeholder*="name" i]')?'PASS':'FAIL');
    log('D9: Register - email', await isVisible('input[type="email"], input[placeholder*="email" i]')?'PASS':'FAIL');
    log('D10: Register - password', await isVisible('input[type="password"]')?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/03-register.png'});

    // 4. Demo login
    await page.goto('http://localhost:5173/login', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    await page.locator('text=Try Demo Mode').first().click({force:true,timeout:5000});
    await wait(4000);
    // Dismiss onboarding if it appears
    if (await isVisible('button:has-text("Skip")', 2000)) {
      await page.locator('button:has-text("Skip")').first().click({force:true,timeout:3000});
      await wait(1000);
    }
    log('D11: Demo → dashboard', page.url().includes('dashboard')?'PASS':'FAIL', page.url());
    const dash = await safeText();
    log('D12: Dashboard has Progress', dash.includes('Progress')?'PASS':'FAIL');
    log('D13: Dashboard has Study', (dash.includes('study')||dash.includes('hour')||dash.includes('Focus'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/04-dashboard.png'});

    // 5. Sidebar visible on desktop
    log('D14: Sidebar visible', await isVisible('aside')?'PASS':'FAIL');

    // 6. Predictor
    await page.goto('http://localhost:5173/opportunity-predictor', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    log('D15: Predictor loads', await isVisible('input[type="number"]')?'PASS':'FAIL');
    log('D16: Run NEXA Analysis button', await isVisible('button:has-text("Run NEXA Analysis")')?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/05-predictor.png'});

    // 7. Fill and predict
    if (await isVisible('input[type="number"]')) {
      await page.locator('input[type="number"]').first().fill('65');
      await wait(500);
      await page.locator('button:has-text("Run NEXA Analysis")').first().click({force:true,timeout:5000});
      // Wait for loading animation + API response (up to 25s)
      await wait(20000);
      await page.screenshot({path:'screenshots/06-predictor-results.png'});
      const res = await safeText();
      const hasResults = res.includes('Predicted GATE Score') || res.includes('predictedScore') || res.includes('Performance');
      log('D17: Results rendered', hasResults?'PASS':'FAIL (still loading)');
      log('D18: Results - Score', (res.includes('Score')||res.includes('score')||res.includes('689'))?'PASS':'FAIL');
      log('D19: Results - Colleges', (res.includes('IIT')||res.includes('NIT')||res.includes('IIIT'))?'PASS':'FAIL');
      log('D20: Results - Tabs', (res.includes('Performance')||res.includes('Career')||res.includes('College')||res.includes('Dream')||res.includes('Target'))?'PASS':'FAIL');
      await page.screenshot({path:'screenshots/06-predictor-results.png'});

      // Career tab
      if (await isVisible('button:has-text("Career")', 2000)) {
        await page.locator('button:has-text("Career")').first().click({timeout:3000});
        await wait(1500);
        const career = await safeText();
        log('D21: Career tab - IITs', career.includes('IIT')?'PASS':'FAIL');
        log('D22: Career tab - NITs', career.includes('NIT')?'PASS':'FAIL');
        log('D23: Career tab - IIITs', career.includes('IIIT')?'PASS':'FAIL');
        await page.screenshot({path:'screenshots/07-predictor-career.png'});
      }
    }

    // 8. Settings
    await page.goto('http://localhost:5173/settings', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    const settings = await safeText();
    log('D24: Settings loads', (settings.includes('Profile')||settings.includes('Theme')||settings.includes('Dark'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/08-settings.png'});

    // 9. AI Coach
    await page.goto('http://localhost:5173/ai/coach', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    const coach = await safeText();
    log('D25: AI Coach loads', (coach.includes('AI')||coach.includes('coach')||coach.includes('Chat'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/09-ai-coach.png'});

    // 10. Subjects
    await page.goto('http://localhost:5173/subjects', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    const subj = await safeText();
    log('D26: Subjects loads', (subj.includes('Subject')||subj.includes('subject')||subj.includes('Mathematics'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/10-subjects.png'});

    // 11. Mock Tests
    await page.goto('http://localhost:5173/mock-tests', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    const mock = await safeText();
    log('D27: Mock Tests loads', (mock.includes('Mock')||mock.includes('mock')||mock.includes('Test'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/11-mocks.png'});

    // 12. PYQ
    await page.goto('http://localhost:5173/pyq-practice', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    const pyq = await safeText();
    log('D28: PYQ loads', (pyq.includes('PYQ')||pyq.includes('Question')||pyq.includes('Previous'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/12-pyq.png'});

    // ═══════════════════════════════════════
    // MOBILE (375×812 iPhone)
    // ═══════════════════════════════════════
    await page.setViewportSize({width:375,height:812});

    // 13. Mobile login
    await page.goto('http://localhost:5173/login', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    log('M1: Mobile login - email', await isVisible('input[type="email"], input[placeholder*="email" i]')?'PASS':'FAIL');
    log('M2: Mobile login - pass', await isVisible('input[type="password"]')?'PASS':'FAIL');
    log('M3: Mobile login - Sign In', await isVisible('button:has-text("Sign In")')?'PASS':'FAIL');
    log('M4: Mobile login - Demo', await isVisible('text=Try Demo Mode')?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/13-mobile-login.png'});

    // 14. Mobile demo
    await page.locator('text=Try Demo Mode').first().click({force:true,timeout:5000});
    await wait(4000);
    // Dismiss onboarding if it appears
    if (await isVisible('button:has-text("Skip")', 2000)) {
      await page.locator('button:has-text("Skip")').first().click({force:true,timeout:3000});
      await wait(1000);
    }
    log('M5: Mobile demo → dashboard', page.url().includes('dashboard')?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/14-mobile-dashboard.png'});

    // 15. Mobile hamburger
    const hamburger = page.locator('[aria-label="Open navigation menu"]').first();
    const hasHamburger = await hamburger.isVisible({timeout:3000}).catch(()=>false);
    log('M6: Hamburger visible', hasHamburger?'PASS':'FAIL');
    if (hasHamburger) {
      await hamburger.click({force:true,timeout:5000});
      await wait(1000);
      log('M7: Sidebar opens', await isVisible('aside', 2000)?'PASS':'FAIL');
      await page.screenshot({path:'screenshots/15-mobile-sidebar.png'});
      // close
      await page.locator('.fixed.inset-0').first().click({timeout:2000}).catch(()=>{});
      await wait(500);
    }

    // 16. Mobile predictor
    await page.goto('http://localhost:5173/opportunity-predictor', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    log('M8: Mobile predictor', await isVisible('input[type="number"]')?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/16-mobile-predictor.png'});

    // 17. Mobile settings
    await page.goto('http://localhost:5173/settings', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    const mSettings = await safeText();
    log('M9: Mobile settings', (mSettings.includes('Profile')||mSettings.includes('Theme'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/17-mobile-settings.png'});

    // 18. Mobile AI Coach
    await page.goto('http://localhost:5173/ai/coach', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    const mCoach = await safeText();
    log('M10: Mobile AI Coach', (mCoach.includes('AI')||mCoach.includes('coach'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/18-mobile-ai-coach.png'});

    // 19. Mobile subjects
    await page.goto('http://localhost:5173/subjects', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    const mSubj = await safeText();
    log('M11: Mobile subjects', (mSubj.includes('Subject')||mSubj.includes('subject'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/19-mobile-subjects.png'});

    // 20. Mobile mock tests
    await page.goto('http://localhost:5173/mock-tests', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    const mMock = await safeText();
    log('M12: Mobile mock tests', (mMock.includes('Mock')||mMock.includes('Test'))?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/20-mobile-mocks.png'});

    // ═══════════════════════════════════════
    // TABLET (768×1024 iPad)
    // ═══════════════════════════════════════
    await page.setViewportSize({width:768,height:1024});

    // 21. Tablet login
    await page.goto('http://localhost:5173/login', {waitUntil:'domcontentloaded',timeout:15000});
    await wait(5000);
    log('T1: Tablet login', await isVisible('button:has-text("Sign In")')?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/21-tablet-login.png'});

    // 22. Tablet dashboard
    await page.locator('text=Try Demo Mode').first().click({force:true,timeout:5000});
    await wait(4000);
    // Dismiss onboarding if it appears
    if (await isVisible('button:has-text("Skip")', 2000)) {
      await page.locator('button:has-text("Skip")').first().click({force:true,timeout:3000});
      await wait(1000);
    }
    log('T2: Tablet dashboard', page.url().includes('dashboard')?'PASS':'FAIL');
    await page.screenshot({path:'screenshots/22-tablet-dashboard.png'});

    // ═══════════════════════════════════════
    // BACKEND API TESTS
    // ═══════════════════════════════════════
    const api = async (method, path, body=null) => {
      const opts = {method, headers:{'Content-Type':'application/json'}};
      if(body) opts.body = JSON.stringify(body);
      const r = await fetch(`http://localhost:5000${path}`, opts);
      const d = await r.json().catch(()=>null);
      return {status:r.status, data:d};
    };

    // 23-34: API tests
    let h = await api('GET','/api/health');
    log('API: Health', h.status===200?'PASS':'FAIL');

    h = await api('GET','/api/subjects');
    log('API: Subjects', (h.status===200 && h.data)?'PASS':'FAIL', `${(h.data?.data||h.data||[]).length} subjects`);

    h = await api('GET','/api/mock-tests');
    log('API: Mock Tests', (h.status===200)?'PASS':'FAIL');

    h = await api('POST','/api/predictor/predict',{marks:65,category:'General',branch:'cs',examYear:2026});
    log('API: Predictor 65 marks', h.status===200?'PASS':'FAIL', `${(h.data?.data||h.data?.opportunities||[]).length} opportunities`);

    h = await api('POST','/api/predictor/predict',{marks:0,category:'General',branch:'cs'});
    log('API: Predictor 0 marks', (h.status===200||h.status===400)?'PASS':'FAIL');

    h = await api('POST','/api/predictor/predict',{marks:-5,category:'General',branch:'cs'});
    log('API: Predictor negative', (h.status===200||h.status===400)?'PASS':'FAIL');

    h = await api('POST','/api/predictor/predict',{marks:100,category:'General',branch:'cs',examYear:2026});
    log('API: Predictor 100 marks', h.status===200?'PASS':'FAIL', `${(h.data?.data||h.data?.opportunities||[]).length} opportunities`);

    h = await api('POST','/api/predictor/predict',{marks:55,category:'OBC-NCL',branch:'cs',examYear:2026});
    log('API: Predictor OBC-NCL', h.status===200?'PASS':'FAIL', `${(h.data?.data||h.data?.opportunities||[]).length} opportunities`);

    h = await api('POST','/api/predictor/predict',{marks:40,category:'SC',branch:'cs',examYear:2026});
    log('API: Predictor SC', h.status===200?'PASS':'FAIL', `${(h.data?.data||h.data?.opportunities||[]).length} opportunities`);

    h = await api('POST','/api/predictor/predict',{marks:50,category:'General',branch:'cs',examYear:2026,isPwD:true});
    log('API: Predictor PwD', h.status===200?'PASS':'FAIL');

    h = await api('GET','/api/pyq/browse');
    log('API: PYQ Browse', (h.status===200||h.status===401)?'PASS':'FAIL');

    h = await api('POST','/api/auth/demo');
    log('API: Demo auth', (h.status===200)?'PASS':'FAIL');

  } catch(e) {
    log('TEST ERROR', 'FAIL', e.message.substring(0,200));
  } finally {
    await browser.close();
  }

  const passed = results.filter(r=>r.s==='PASS').length;
  const failed = results.filter(r=>r.s==='FAIL').length;
  console.log('\n'+'═'.repeat(60));
  console.log(`TOTAL: ${passed} PASS, ${failed} FAIL out of ${results.length}`);
  console.log('═'.repeat(60));
  if (failed>0) {
    console.log('\nFailed:');
    results.filter(r=>r.s==='FAIL').forEach(r=>console.log(`  ❌ ${r.t}: ${r.d}`));
  }
})();
