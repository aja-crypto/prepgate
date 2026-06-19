const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to subjects page directly
  await page.goto('http://localhost:5173/subjects', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  
  // Extract page text
  const text = await page.evaluate(() => document.body.innerText);
  console.log('=== SUBJECTS PAGE ===');
  console.log(text.substring(0, 3000));
  
  await browser.close();
})();