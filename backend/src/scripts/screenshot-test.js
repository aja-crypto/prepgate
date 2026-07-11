const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Desktop login page
  await page.setViewportSize({width:1920,height:1080});
  await page.goto('http://localhost:5173/login', {waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(3000);
  await page.screenshot({path:'C:/Users/purru/OneDrive/GATE 2026/gate2027/test-login.png'});
  console.log('Login screenshot saved');
  
  // Get login page elements
  const els = await page.evaluate(() => {
    const all = document.querySelectorAll('a, button, input, select, [role="button"]');
    return Array.from(all).map(e => ({
      tag: e.tagName,
      text: (e.textContent || '').trim().substring(0,50),
      type: e.type || '',
      href: e.href || '',
      placeholder: e.placeholder || '',
      visible: e.offsetParent !== null || e.getBoundingClientRect().height > 0
    })).filter(e => e.visible || e.tag === 'INPUT');
  });
  console.log('Login page elements:');
  els.forEach(e => console.log(`  ${e.tag} | ${e.text || e.placeholder || e.type} | ${e.href || ''}`));
  
  await browser.close();
  console.log('Done');
})();
