const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to frontend
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  
  // Extract page text
  const text = await page.evaluate(() => document.body.innerText);
  console.log('=== FRONTEND PAGE TEXT ===');
  console.log(text.substring(0, 3000));
  
  await browser.close();
})();