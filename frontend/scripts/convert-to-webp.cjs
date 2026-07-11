// Convert hero/dashboard images to WebP for performance
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC = path.join(__dirname, '..', 'public');

const TARGETS = [
  { src: 'images/login-wallpaper.png', maxWidth: 1920, quality: 82 },
  { src: 'images/login-wallpaper-2.png', maxWidth: 1920, quality: 82 },
  { src: 'images/logo.png', maxWidth: 512, quality: 88 },
  { src: 'images/ai symbol.png', maxWidth: 512, quality: 82 },
  { src: 'images/batman.png', maxWidth: 1920, quality: 82 },
];

async function convertOne(target) {
  const srcPath = path.join(PUBLIC, target.src);
  if (!fs.existsSync(srcPath)) {
    console.log('SKIP missing:', target.src);
    return;
  }
  const ext = path.extname(target.src);
  const out = target.src.replace(ext, '.webp');
  const outPath = path.join(PUBLIC, out);
  try {
    const meta = await sharp(srcPath).metadata();
    await sharp(srcPath)
      .resize({ width: Math.min(target.maxWidth, meta.width || target.maxWidth), withoutEnlargement: true })
      .webp({ quality: target.quality })
      .toFile(outPath);
    const inSize = fs.statSync(srcPath).size;
    const outSize = fs.statSync(outPath).size;
    const saving = ((1 - outSize / inSize) * 100).toFixed(1);
    console.log(`OK  ${target.src} -> ${out}  (${(inSize/1024).toFixed(0)}KB -> ${(outSize/1024).toFixed(0)}KB, -${saving}%)`);
  } catch (e) {
    console.error('FAIL', target.src, e.message);
  }
}

(async () => {
  console.log('Converting images to WebP...');
  for (const t of TARGETS) await convertOne(t);
  console.log('Done.');
})();
