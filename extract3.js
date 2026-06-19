const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // First click demo mode
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  
  // Click "Enter Demo Mode" button
  await page.click('button:has-text("ENTER DEMO MODE")');
  await page.waitForTimeout(5000);
  
  // Now navigate to subjects
  await page.goto('http://localhost:5173/subjects', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  
  // Extract page text
  const text = await page.evaluate(() => document.body.innerText);
  console.log('=== SUBJECTS PAGE (Demo Mode) ===');
  console.log(text.substring(0, 5000));
  
  await browser.close();
})();