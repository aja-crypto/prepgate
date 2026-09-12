/* GateNexa OG image builder — renders public/og-image.png (1200x630).
 * Run: node scripts/build-og-image.mjs  (requires `sharp`, already a dep)
 * Brand: dark navy #050816/#0B1030, purple neon #8B5CF6, cyan #22D3EE, orange #F59E0B.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, '..', 'public', 'og-image.png');
const W = 1200;
const H = 630;

let dots = '';
for (let x = 760; x < 1180; x += 28) {
  for (let y = 40; y < 600; y += 28) {
    dots += `<circle cx="${x}" cy="${y}" r="1.6" fill="#ffffff" opacity="0.10"/>`;
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1030"/>
      <stop offset="0.55" stop-color="#050816"/>
      <stop offset="1" stop-color="#070B22"/>
    </linearGradient>
    <linearGradient id="brandWord" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#A78BFA"/>
      <stop offset="0.55" stop-color="#8B5CF6"/>
      <stop offset="1" stop-color="#22D3EE"/>
    </linearGradient>
    <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8B5CF6"/>
      <stop offset="0.55" stop-color="#22D3EE"/>
      <stop offset="1" stop-color="#F59E0B"/>
    </linearGradient>
    <radialGradient id="glowP" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#8B5CF6" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowC" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#22D3EE" stop-opacity="0.40"/>
      <stop offset="1" stop-color="#22D3EE" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowO" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#F59E0B" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <ellipse cx="180" cy="120" rx="330" ry="200" fill="url(#glowP)" filter="url(#soft)"/>
  <ellipse cx="1050" cy="520" rx="360" ry="220" fill="url(#glowC)" filter="url(#soft)"/>
  <ellipse cx="620" cy="640" rx="300" ry="160" fill="url(#glowO)" filter="url(#soft)"/>
  ${dots}
  <rect x="0" y="0" width="1200" height="6" fill="url(#chartLine)"/>
  <rect x="72" y="86" width="76" height="76" rx="20" fill="#121A3F" stroke="#8B5CF6" stroke-width="1.5"/>
  <text x="110" y="140" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900" fill="url(#brandWord)">N</text>
  <text x="166" y="122" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800" fill="url(#brandWord)">GateNexa</text>
  <rect x="72" y="182" width="196" height="46" rx="23" fill="#22D3EE" opacity="0.12"/>
  <rect x="72" y="182" width="196" height="46" rx="23" fill="none" stroke="#22D3EE" stroke-width="2"/>
  <circle cx="102" cy="205" r="7" fill="#F59E0B"/>
  <text x="122" y="221" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" letter-spacing="4" fill="#EAF6FF">GATE 2027</text>
  <text x="72" y="300" font-family="Arial, Helvetica, sans-serif" font-size="43" font-weight="800" fill="#FFFFFF">Prepare Smarter.</text>
  <text x="72" y="352" font-family="Arial, Helvetica, sans-serif" font-size="43" font-weight="800" fill="#FFFFFF">Know What to</text>
  <text x="72" y="404" font-family="Arial, Helvetica, sans-serif" font-size="43" font-weight="800" fill="url(#chartLine)">Study Next.</text>
  <rect x="72" y="446" width="228" height="52" rx="14" fill="#10173A" stroke="#8B5CF6" stroke-width="1.5"/>
  <circle cx="102" cy="472" r="10" fill="#8B5CF6"/>
  <text x="102" y="479" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" fill="#0B1030">AI</text>
  <text x="124" y="480" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#E6E9FF">AI Mentor</text>
  <rect x="316" y="446" width="262" height="52" rx="14" fill="#10173A" stroke="#22D3EE" stroke-width="1.5"/>
  <circle cx="346" cy="472" r="10" fill="#22D3EE"/>
  <text x="368" y="480" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#E6E9FF">Nexa Predictor</text>
  <text x="72" y="552" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#8E93B8">Study with direction. Practice with purpose. Improve with AI.</text>
  <rect x="660" y="70" width="468" height="490" rx="24" fill="#0C1230"/>
  <rect x="660" y="70" width="468" height="490" rx="24" fill="none" stroke="#ffffff" stroke-opacity="0.16"/>
  <circle cx="692" cy="102" r="7" fill="#FF5F57"/>
  <circle cx="714" cy="102" r="7" fill="#FEBC2E"/>
  <circle cx="736" cy="102" r="7" fill="#28C840"/>
  <text x="1090" y="108" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#8E93B8">gatenexa.vercel.app</text>
  <line x1="660" y1="126" x2="1128" y2="126" stroke="#ffffff" stroke-opacity="0.10"/>
  <text x="690" y="168" font-family="Arial, Helvetica, sans-serif" font-size="19" fill="#8E93B8">Readiness Score</text>
  <text x="1098" y="172" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#F59E0B">78%</text>
  <rect x="690" y="188" width="408" height="12" rx="6" fill="#1B2350"/>
  <rect x="690" y="188" width="318" height="12" rx="6" fill="url(#chartLine)"/>
  <rect x="690" y="220" width="408" height="170" rx="14" fill="#111845"/>
  <text x="710" y="248" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#AEB6DC">Performance trend</text>
  <text x="1078" y="248" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#22D3EE">+12%</text>
  <polyline points="710,350 760,330 810,338 860,300 910,312 960,278 1010,288 1058,250" fill="none" stroke="url(#chartLine)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="1058" cy="250" r="7" fill="#F59E0B"/>
  <text x="690" y="424" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#AEB6DC">OS</text>
  <rect x="730" y="410" width="368" height="12" rx="6" fill="#1B2350"/>
  <rect x="730" y="410" width="294" height="12" rx="6" fill="#8B5CF6"/>
  <text x="690" y="454" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#AEB6DC">CN</text>
  <rect x="730" y="440" width="368" height="12" rx="6" fill="#1B2350"/>
  <rect x="730" y="440" width="238" height="12" rx="6" fill="#22D3EE"/>
  <text x="690" y="484" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#AEB6DC">DB</text>
  <rect x="730" y="470" width="368" height="12" rx="6" fill="#1B2350"/>
  <rect x="730" y="470" width="268" height="12" rx="6" fill="#F59E0B"/>
  <rect x="690" y="502" width="196" height="36" rx="18" fill="#8B5CF6" opacity="0.30"/>
  <text x="788" y="526" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#DCCBFF">Mock Tests</text>
  <rect x="902" y="502" width="196" height="36" rx="18" fill="#22D3EE" opacity="0.25"/>
  <text x="1000" y="526" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#A5ECFB">PYQs Solved</text>
  <text x="72" y="598" font-family="Arial, Helvetica, sans-serif" font-size="19" fill="#5E6694">gatenexa.vercel.app</text>
</svg>`;

await sharp(Buffer.from(svg), { density: 150 })
  .png({ compressionLevel: 9 })
  .resize(W, H, { fit: 'fill' })
  .toFile(out);

const meta = await sharp(out).metadata();
console.log(`WROTE ${out} :: ${meta.width}x${meta.height} format=${meta.format}`);
if (meta.width !== 1200 || meta.height !== 630) {
  throw new Error(`BAD DIMENSIONS: ${meta.width}x${meta.height} (need 1200x630)`);
}
console.log('OG IMAGE OK — exactly 1200x630');
