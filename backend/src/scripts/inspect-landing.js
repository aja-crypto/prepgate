const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({width:1920,height:1080});
  await page.goto('http://localhost:5173', {waitUntil:'networkidle',timeout:15000});
  
  const links = await page.locator('a').evaluateAll(els => 
    els.map(e => ({text: e.textContent.trim().substring(0,50), href: e.href, visible: e.offsetParent !== null}))
    .filter(e => e.text && (e.text.toLowerCase().includes('login') || e.text.toLowerCase().includes('sign') || e.text.toLowerCase().includes('demo') || e.text.toLowerCase().includes('get started') || e.text.toLowerCase().includes('try')))
  );
  console.log('Links:', JSON.stringify(links, null, 2));
  
  const buttons = await page.locator('button').evaluateAll(els => 
    els.map(e => ({text: e.textContent.trim().substring(0,50), cls: e.className.substring(0,100), visible: e.offsetParent !== null}))
    .filter(e => e.text && (e.text.toLowerCase().includes('login') || e.text.toLowerCase().includes('demo') || e.text.toLowerCase().includes('try')))
  );
  console.log('Buttons:', JSON.stringify(buttons, null, 2));
  
  await browser.close();
})();
