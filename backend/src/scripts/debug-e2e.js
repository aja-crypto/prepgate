const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Login via demo
  await page.setViewportSize({width:1920,height:1080});
  await page.goto('http://localhost:5173/login', {waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(2000);
  await page.locator('text=Try Demo Mode').first().click({force:true,timeout:5000});
  await page.waitForTimeout(3000);
  console.log('Logged in, URL:', page.url());
  
  // Check localStorage for tokens
  const tokens = await page.evaluate(() => ({
    accessToken: localStorage.getItem('accessToken') ? 'present' : 'missing',
    refreshToken: localStorage.getItem('refreshToken') ? 'present' : 'missing',
    user: localStorage.getItem('user') ? 'present' : 'missing',
  }));
  console.log('Tokens:', tokens);
  
  // Navigate to predictor within same session
  await page.goto('http://localhost:5173/opportunity-predictor', {waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(3000);
  console.log('Predictor URL:', page.url());
  
  const predBody = await page.textContent('body');
  console.log('Predictor body preview:', predBody.substring(0, 300));
  
  // Take screenshot
  await page.screenshot({path:'C:/Users/purru/OneDrive/GATE 2026/gate2027/test-predictor.png'});
  console.log('Predictor screenshot saved');
  
  // Check settings
  await page.goto('http://localhost:5173/settings', {waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(2000);
  console.log('Settings URL:', page.url());
  const settingsBody = await page.textContent('body');
  console.log('Settings body preview:', settingsBody.substring(0, 300));
  
  // Mobile hamburger check
  await page.setViewportSize({width:375,height:812});
  await page.goto('http://localhost:5173/dashboard', {waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(2000);
  
  // Find all buttons on mobile
  const btns = await page.locator('button').evaluateAll(els => 
    els.map(e => ({
      text: (e.textContent||'').trim().substring(0,30),
      ariaLabel: e.getAttribute('aria-label') || '',
      cls: e.className.substring(0,80),
      visible: e.offsetParent !== null || e.getBoundingClientRect().height > 0
    })).filter(e => e.visible)
  );
  console.log('Mobile buttons:', JSON.stringify(btns, null, 2));
  
  await browser.close();
})();
