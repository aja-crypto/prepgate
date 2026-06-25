const router = require('express').Router();
const path = require('path');
const fs = require('fs');

const PAPERS_DIR = path.join(__dirname, '../../uploads/gate-papers');
const MANIFEST_PATH = path.join(PAPERS_DIR, 'manifest.json');

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

// GET /api/gate-papers — list all papers (public)
router.get('/', (req, res) => {
  const papers = loadManifest();
  const { year } = req.query;
  let filtered = papers;
  if (year) filtered = papers.filter(p => p.year === parseInt(year));
  const years = [...new Set(papers.map(p => p.year))].sort((a, b) => a - b);
  res.json({ success: true, count: filtered.length, years, data: filtered });
});

// GET /api/gate-papers/download/:filename — serve PDF (public)
router.get('/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(PAPERS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Paper not found' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
