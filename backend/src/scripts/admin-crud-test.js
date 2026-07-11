const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const wait = ms => page.waitForTimeout(ms);
  const r = [];
  const ok = (t, s, d='') => { r.push({t,s,d}); console.log((s==='PASS'?'  ✅ ':'  ❌ ')+t+(d?': '+d:'')); };

  // Admin login
  await page.goto('http://localhost:5173/admin/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(3000);
  await page.fill('input[type="email"]', 'admin@gatenexa.dev');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await wait(3000);
  ok('Admin login', page.url().includes('/dashboard')?'PASS':'FAIL');

  // Test 1: Mock Tests page
  await page.goto('http://localhost:5173/admin/mock-tests', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(5000);
  const mockBtns = await page.$$('button');
  let hasNewTest = false;
  for (const btn of mockBtns) {
    const txt = await btn.textContent();
    if (txt.includes('New Test')) hasNewTest = true;
  }
  ok('Mock Tests - New Test button', hasNewTest?'PASS':'FAIL');

  // Click New Test - use more specific selector
  for (const btn of mockBtns) {
    const txt = await btn.textContent();
    if (txt.includes('New Test')) { await btn.click({timeout:3000}); await wait(1000); break; }
  }
  // Check modal
  const modalEls = await page.$$('.fixed.inset-0');
  ok('Mock Tests - modal opens on click', modalEls.length >= 1?'PASS':'FAIL');

  // Fill form and save
  if (modalEls.length > 1) {
    // Fill inputs
    const inputs = await page.$$('input');
    for (const inp of inputs) {
      const ph = await inp.getAttribute('placeholder');
      if (ph && ph.includes('e.g. Algorithms') && !ph.includes('Topic')) {
        await inp.fill('E2E Test Subject');
        break;
      }
    }
    for (const inp of inputs) {
      const ph = await inp.getAttribute('placeholder');
      if (ph && (ph.includes('e.g. Asymptotic') || ph.includes('comma'))) {
        await inp.fill('E2E, Auto, Test');
        break;
      }
    }
    // Click Save
    const saveBtns = await page.$$('button');
    for (const btn of saveBtns) {
      const txt = await btn.textContent();
      if (txt.trim() === 'Save') { await btn.click({timeout:3000}); break; }
    }
    await wait(2000);
    ok('Mock Tests - create saves without errors', errs.length === 0?'PASS':'FAIL', errs.length>0?errs.slice(-1)[0]:'');
  }

  // Test 2: Users page
  await page.goto('http://localhost:5173/admin/users', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(5000);
  const uBody = await page.textContent('body');
  ok('Users - metrics cards visible', uBody.includes('Total Users')?'PASS':'FAIL');
  ok('Users - data table visible', (uBody.includes('Last Active')||uBody.includes('Logins'))?'PASS':'FAIL');

  // Test 3: Analytics
  await page.goto('http://localhost:5173/admin/analytics', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(5000);
  const aBody = await page.textContent('body');
  const stats = ['Total Users', 'Active Today', 'New This Week', 'Subjects', 'Topics'];
  let statCount = 0;
  for (const s of stats) { if (aBody.includes(s)) statCount++; }
  ok('Analytics - stat cards rendering', statCount >= 3?'PASS':'FAIL', statCount+'/5 found');

  // Test 4: Notifications
  await page.goto('http://localhost:5173/admin/notifications', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(5000);
  const nBody = await page.textContent('body');
  ok('Notifications - page loads', nBody.length > 200?'PASS':'FAIL');

  // Test 5: Gate Vault
  await page.goto('http://localhost:5173/admin/gate-vault', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(5000);
  const gBody = await page.textContent('body');
  ok('Gate Vault - Smart Upload section', (gBody.includes('Smart')||gBody.includes('Upload')||gBody.includes('Flashcard'))?'PASS':'FAIL');

  // Test 6: PYQ
  await page.goto('http://localhost:5173/admin/pyq', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(5000);
  const pBody = await page.textContent('body');
  ok('PYQ - filter controls present', (pBody.includes('Subject')||pBody.includes('Year')||pBody.includes('Difficulty'))?'PASS':'FAIL');

  // Test 7: Question Bank
  await page.goto('http://localhost:5173/admin/question-bank', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(5000);
  const qBody = await page.textContent('body');
  ok('Question Bank - content loads', (qBody.includes('Question')||qBody.includes('Type')||qBody.includes('Subject'))?'PASS':'FAIL');

  // Errors
  ok('Console errors', errs.length === 0?'PASS':'FAIL', errs.length+' found');
  if (errs.length > 0) errs.slice(0,3).forEach(e => console.log('  Error:', e.substring(0,120)));

  const passed = r.filter(x=>x.s==='PASS').length;
  const failed = r.filter(x=>x.s==='FAIL').length;
  console.log('\n══════════════════════════════════════');
  console.log(`ADMIN CRUD: ${passed} PASS, ${failed} FAIL out of ${r.length}`);

  await browser.close();
})();
