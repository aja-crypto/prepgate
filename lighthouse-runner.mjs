// Custom Lighthouse runner using puppeteer-style chrome control
import { chromium } from 'playwright';
import lighthouse from 'lighthouse/core/index.js';
import { writeFileSync } from 'fs';

const URL = process.argv[2] || 'https://gatenexa.vercel.app';
const OUTPUT = process.argv[3] || './lighthouse-report.json';

const chrome = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

try {
  const { port } = chrome.server() || { port: null };
  // Use a separate exec to launch chrome with remote debugging
} catch (e) {
  console.log('Playwright not available, trying alternative approach');
}

writeFileSync(OUTPUT, JSON.stringify({ error: 'manual' }));
