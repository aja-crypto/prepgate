const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const MediaFile = require('../models/MediaFile');
const { isMongoConnected } = require('../config/db');

function fetchBuffer(url, redirects = 3) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, (resp) => {
      if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location && redirects > 0) {
        resp.resume();
        return resolve(fetchBuffer(resp.headers.location, redirects - 1));
      }
      if (resp.statusCode !== 200) {
        resp.resume();
        return reject(new Error('Status ' + resp.statusCode));
      }
      const chunks = [];
      resp.on('data', (c) => chunks.push(c));
      resp.on('end', () => resolve(Buffer.concat(chunks)));
      resp.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });
  });
}

const PAPERS_DIR = path.join(__dirname, '../../uploads/gate-papers');
const MANIFEST_PATH = path.join(PAPERS_DIR, 'manifest.json');

const EMBEDDED_MANIFEST = [
  {"filename":"GATE2008.pdf","year":2008,"set":"CS","title":"GATE 2008 Computer Science"},
  {"filename":"GATE2008IT.pdf","year":2008,"set":"IT","title":"GATE 2008 Information Technology"},
  {"filename":"GATE2009.pdf","year":2009,"set":"CS","title":"GATE 2009 Computer Science"},
  {"filename":"GATE2010.pdf","year":2010,"set":"CS","title":"GATE 2010 Computer Science"},
  {"filename":"GATE2011.pdf","year":2011,"set":"CS","title":"GATE 2011 Computer Science"},
  {"filename":"GATE2012.pdf","year":2012,"set":"CS","title":"GATE 2012 Computer Science"},
  {"filename":"GATE2013.pdf","year":2013,"set":"CS","title":"GATE 2013 Computer Science"},
  {"filename":"GATE2014-Set-1.pdf","year":2014,"set":"Set 1","title":"GATE 2014 CS Set 1"},
  {"filename":"GATE2014-Set-2.pdf","year":2014,"set":"Set 2","title":"GATE 2014 CS Set 2"},
  {"filename":"GATE2014-Set-3.pdf","year":2014,"set":"Set 3","title":"GATE 2014 CS Set 3"},
  {"filename":"GATE2015-Set-2.pdf","year":2015,"set":"Set 2","title":"GATE 2015 CS Set 2"},
  {"filename":"GATE2015-Set-3.pdf","year":2015,"set":"Set 3","title":"GATE 2015 CS Set 3"},
  {"filename":"GATE2016-Set-1.pdf","year":2016,"set":"Set 1","title":"GATE 2016 CS Set 1"},
  {"filename":"GATE2016-Set-2.pdf","year":2016,"set":"Set 2","title":"GATE 2016 CS Set 2"},
  {"filename":"GATE2017-Set-1_compressed1.pdf","year":2017,"set":"Set 1","title":"GATE 2017 CS Set 1"},
  {"filename":"GATE2017-Set-2_compressed.pdf","year":2017,"set":"Set 2","title":"GATE 2017 CS Set 2"},
  {"filename":"GATE2018.pdf","year":2018,"set":"CS","title":"GATE 2018 Computer Science"},
  {"filename":"GATE-2022-part-1.pdf","year":2022,"set":"CS","title":"GATE 2022 CS Part 1"},
  {"filename":"GATE2021_QP_CS-1.pdf","year":2021,"set":"CS Set 1","title":"GATE 2021 CS Set 1"},
  {"filename":"GATE2021_QP_CS-2.pdf","year":2021,"set":"CS Set 2","title":"GATE 2021 CS Set 2"},
  {"filename":"GATE-CS-2020-Original-Paper.pdf","year":2020,"set":"CS","title":"GATE 2020 CS Original Paper"},
  {"filename":"GATE-CS-2025-Set-1-Master-Question-Paper.pdf","year":2025,"set":"Set 1","title":"GATE 2025 CS Set 1"},
  {"filename":"GATE-CS-2025-Set-2-Master-Question-Paper.pdf","year":2025,"set":"Set 2","title":"GATE 2025 CS Set 2"},
  {"filename":"GATE-DA-2025-Master-Question-Paper.pdf","year":2025,"set":"DA","title":"GATE 2025 Data Science & AI"}
];

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    return EMBEDDED_MANIFEST;
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

// GET /api/gate-papers/download/:filename — serve PDF (public), Cloudinary redirect with local fallback
router.get('/download/:filename', async (req, res) => {
  const filename = path.basename(req.params.filename);
  
  // Try Cloudinary first — proxy with correct PDF headers
  if (isMongoConnected()) {
    try {
      const doc = await MediaFile.findOne({ 'meta.filename': filename, category: 'gate-papers' });
      if (doc && doc.secure_url) {
        if (req.query.force === '1') {
          try {
            const buf = await fetchBuffer(doc.secure_url);
            if (buf && buf.length > 0) {
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Length', buf.length);
              res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
              return res.send(buf);
            }
          } catch (_) { /* fallback to redirect */ }
          let url = doc.secure_url;
          url += (url.includes('?') ? '&' : '?') + 'fl_attachment';
          return res.redirect(url);
        }
        // Default preview: inline PDF proxy (fixes iframe JSON bug)
        try {
          const buf = await fetchBuffer(doc.secure_url);
          if (buf && buf.length > 0) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', buf.length);
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.setHeader('Cache-Control', 'private, max-age=3600');
            return res.send(buf);
          }
        } catch (_) { /* fall through to JSON fallback */ }
        return res.json({ success: true, url: doc.secure_url });
      }
    } catch (e) { /* fall through to local */ }
  }
  
  // Local filesystem fallback
  const filePath = path.join(PAPERS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Paper not found' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
