const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.substring(0,80)));
  const r = [];
  const ok = (t,s,d='') => { r.push({t,s,d}); console.log((s==='PASS'?'  ✅ ':'  ❌ ')+t+(d?': '+d:'')); };

  // Login
  await page.goto('http://localhost:5173/login', {waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForTimeout(3000);
  await page.locator('text=Try Demo Mode').first().click({force:true,timeout:5000});
  await page.waitForTimeout(3000);
  try { const s=page.locator('button:has-text("Skip")').first(); if(await s.isVisible({timeout:2000})){await s.click({force:true});await page.waitForTimeout(1000);} } catch {}

  // Test pages at 375px (iPhone)
  for (const p of [
    {path:'/dashboard',n:'Dashboard'},
    {path:'/opportunity-predictor',n:'Predictor'},
    {path:'/ai/coach',n:'AI Coach'},
    {path:'/mock-tests',n:'Mock Tests'},
    {path:'/settings',n:'Settings'},
    {path:'/referral',n:'Referral'},
  ]) {
    errs.length = 0;
    await page.goto('http://localhost:5173'+p.path,{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForTimeout(3000);
    const sw = await page.evaluate(()=>document.documentElement.scrollWidth);
    const cw = await page.evaluate(()=>document.documentElement.clientWidth);
    const hs = sw > cw + 5;
    ok(p.n+' (375px) loads', !hs && errs.length===0 ? 'PASS':'FAIL', hs?`h-scroll ${sw}>${cw}`:errs.length+' errors');
  }

  // Test at 320px (smallest)
  await page.setViewportSize({width:320,height:568});
  for (const p of [{path:'/dashboard',n:'Dashboard'},{path:'/login',n:'Login'}]) {
    await page.goto('http://localhost:5173'+p.path,{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForTimeout(3000);
    const sw=await page.evaluate(()=>document.documentElement.scrollWidth);
    const cw=await page.evaluate(()=>document.documentElement.clientWidth);
    ok(p.n+' (320px)', sw<=cw+5?'PASS':'FAIL', sw>cw+5?`h-scroll ${sw}>${cw}`:'');
  }

  // Test at 768px (tablet)
  await page.setViewportSize({width:768,height:1024});
  await page.goto('http://localhost:5173/dashboard',{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForTimeout(3000);
  const sw=await page.evaluate(()=>document.documentElement.scrollWidth);
  const cw=await page.evaluate(()=>document.documentElement.clientWidth);
  ok('Dashboard (768px)', sw<=cw+5?'PASS':'FAIL', sw>cw+5?`h-scroll ${sw}>${cw}`:'');

  const pass=r.filter(x=>x.s==='PASS').length;
  const fail=r.filter(x=>x.s==='FAIL').length;
  console.log('\n'+'='.repeat(50));
  console.log(`MOBILE AUDIT: ${pass} PASS, ${fail} FAIL`);
  await browser.close();
})();