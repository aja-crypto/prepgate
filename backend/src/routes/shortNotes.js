const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mkdirp = require('mkdirp');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const MediaFile = require('../models/MediaFile');
const { isMongoConnected } = require('../config/db');

const NOTES_DIR = path.join(__dirname, '../../../resources/short-notes');

// Ensure NOTES_DIR exists for local fallback
if (!fs.existsSync(NOTES_DIR)) {
  try { fs.mkdirSync(NOTES_DIR, { recursive: true }); } catch {}
}

// Short-lived token store for local file access
const localFileTokens = new Map();

const EMBEDDED_SHORT_NOTES = [
  { folder: 'OS', code: 'OS', name: 'Operating Systems', icon: '⚙️', color: '#a855f7', files: [
    { name: 'OS ShortNotes.pdf', fileUrl: '/api/short-notes/download/OS/OS ShortNotes.pdf', type: 'pdf', size: 0 },
    { name: 'os-notes.pdf', fileUrl: '/api/short-notes/download/OS/os-notes.pdf', type: 'pdf', size: 0 },
  ], count: 2, lastModified: Date.now() },
  { folder: 'DBMS', code: 'DB', name: 'DBMS', icon: '🗄', color: '#06b6d4', files: [
    { name: 'DBMS ShortNotes.pdf', fileUrl: '/api/short-notes/download/DBMS/DBMS ShortNotes.pdf', type: 'pdf', size: 0 },
  ], count: 1, lastModified: Date.now() },
  { folder: 'CN', code: 'CN', name: 'Computer Networks', icon: '🌐', color: '#ffd166', files: [
    { name: 'CN ShortNotes.pdf', fileUrl: '/api/short-notes/download/CN/CN ShortNotes.pdf', type: 'pdf', size: 0 },
    { name: 'Computer Networks.pdf', fileUrl: '/api/short-notes/download/CN/Computer Networks.pdf', type: 'pdf', size: 0 },
  ], count: 2, lastModified: Date.now() },
  { folder: 'Algorithms', code: 'AL', name: 'Algorithms', icon: '⚡', color: '#ff6b6b', files: [
    { name: 'Algo ShortNotes.pdf', fileUrl: '/api/short-notes/download/Algorithms/Algo ShortNotes.pdf', type: 'pdf', size: 0 },
  ], count: 1, lastModified: Date.now() },
  { folder: 'COA', code: 'CO', name: 'Computer Organization (COA)', icon: '🖥', color: '#06d6a0', files: [
    { name: 'COA ShortNotes.pdf', fileUrl: '/api/short-notes/download/COA/COA ShortNotes.pdf', type: 'pdf', size: 0 },
  ], count: 1, lastModified: Date.now() },
  { folder: 'Compiler', code: 'CD', name: 'Compiler Design', icon: '🔧', color: '#4cc9f0', files: [], count: 0, lastModified: Date.now() },
  { folder: 'Mathematics', code: 'EM', name: 'Engineering Mathematics', icon: '🔢', color: '#4f8dff', files: [
    { name: 'LA_ShortNotes.pdf', fileUrl: '/api/short-notes/download/Mathematics/LA_ShortNotes.pdf', type: 'pdf', size: 0 },
    { name: 'Prob&Stats ShortNotes.pdf', fileUrl: '/api/short-notes/download/Mathematics/Prob&Stats ShortNotes.pdf', type: 'pdf', size: 0 },
    { name: 'DM ShortNotes.pdf', fileUrl: '/api/short-notes/download/Mathematics/DM ShortNotes.pdf', type: 'pdf', size: 0 },
  ], count: 3, lastModified: Date.now() },
  { folder: 'TOC', code: 'TOC', name: 'Theory of Computation', icon: '🤖', color: '#f72585', files: [
    { name: 'TOC ShortNotes.pdf', fileUrl: '/api/short-notes/download/TOC/TOC ShortNotes.pdf', type: 'pdf', size: 0 },
  ], count: 1, lastModified: Date.now() },
  { folder: 'DS', code: 'DS', name: 'Programming & Data Structures', icon: '🐍', color: '#ff9f43', files: [
    { name: 'Data Structures ShortNotes.pdf', fileUrl: '/api/short-notes/download/DS/Data Structures ShortNotes.pdf', type: 'pdf', size: 0 },
  ], count: 1, lastModified: Date.now() },
  { folder: 'C', code: 'DS', name: 'Programming & Data Structures', icon: '🐍', color: '#ff9f43', files: [
    { name: 'C-Programming ShortNotes.pdf', fileUrl: '/api/short-notes/download/C/C-Programming ShortNotes.pdf', type: 'pdf', size: 0 },
  ], count: 1, lastModified: Date.now() },
  { folder: 'DL', code: 'DL', name: 'Digital Logic', icon: '💻', color: '#7c5cfc', files: [], count: 0, lastModified: Date.now() },
  { folder: 'Aptitude', code: 'APT', name: 'General Aptitude', icon: '🧮', color: '#43aa8b', files: [
    { name: 'Apti ShortNotes.pdf', fileUrl: '/api/short-notes/download/Aptitude/Apti ShortNotes.pdf', type: 'pdf', size: 0 },
  ], count: 1, lastModified: Date.now() },
];

const FOLDER_TO_SUBJECT = {
  DBMS: { code: 'DB', name: 'DBMS', icon: '🗄', color: '#06b6d4' },
  OS: { code: 'OS', name: 'Operating Systems', icon: '⚙️', color: '#a855f7' },
  CN: { code: 'CN', name: 'Computer Networks', icon: '🌐', color: '#ffd166' },
  TOC: { code: 'TOC', name: 'Theory of Computation', icon: '🤖', color: '#f72585' },
  COA: { code: 'CO', name: 'Computer Organization (COA)', icon: '🖥', color: '#06d6a0' },
  Compiler: { code: 'CD', name: 'Compiler Design', icon: '🔧', color: '#4cc9f0' },
  Algorithms: { code: 'AL', name: 'Algorithms', icon: '⚡', color: '#ff6b6b' },
  Mathematics: { code: 'EM', name: 'Engineering Mathematics', icon: '🔢', color: '#4f8dff' },
  Aptitude: { code: 'APT', name: 'General Aptitude', icon: '🧮', color: '#43aa8b' },
  DS: { code: 'DS', name: 'Programming & Data Structures', icon: '🐍', color: '#ff9f43' },
  'Data Structures': { code: 'DS', name: 'Programming & Data Structures', icon: '🐍', color: '#ff9f43' },
  C: { code: 'DS', name: 'Programming & Data Structures', icon: '🐍', color: '#ff9f43' },
  DL: { code: 'DL', name: 'Digital Logic', icon: '💻', color: '#7c5cfc' },
};

const FOLDER_ALIASES = {
  'operating systems': 'OS', 'operating system': 'OS', 'os': 'OS',
  'dbms': 'DBMS', 'database': 'DBMS', 'databases': 'DBMS', 'db': 'DBMS',
  'computer networks': 'CN', 'computer network': 'CN', 'networks': 'CN', 'cn': 'CN',
  'theory of computation': 'TOC', 'toc': 'TOC', 'computation theory': 'TOC',
  'computer organization': 'COA', 'computer organization and architecture': 'COA',
  'coa': 'COA', 'co': 'COA',
  'compiler design': 'Compiler', 'compiler': 'Compiler', 'compilers': 'Compiler', 'cd': 'Compiler',
  'algorithms': 'Algorithms', 'algorithm': 'Algorithms', 'algo': 'Algorithms', 'al': 'Algorithms',
  'engineering mathematics': 'Mathematics', 'mathematics': 'Mathematics', 'math': 'Mathematics',
  'maths': 'Mathematics', 'em': 'Mathematics',
  'general aptitude': 'Aptitude', 'aptitude': 'Aptitude', 'apt': 'Aptitude',
  'programming & data structures': 'DS', 'programming and data structures': 'DS',
  'data structures': 'DS', 'data structure': 'DS', 'ds': 'DS',
  'c programming': 'C', 'c': 'C',
  'digital logic': 'DL', 'digital design': 'DL', 'dl': 'DL',
};

function resolveFolderKey(rawFolder) {
  if (!rawFolder) return null;
  if (FOLDER_TO_SUBJECT[rawFolder]) return rawFolder;
  const lower = String(rawFolder).toLowerCase().trim();
  if (FOLDER_ALIASES[lower]) return FOLDER_ALIASES[lower];
  // direct keys on FOLDER_TO_SUBJECT (case-insensitive)
  for (const key of Object.keys(FOLDER_TO_SUBJECT)) {
    if (key.toLowerCase() === lower) return key;
  }
  return null;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SAFE_FOLDER_NAMES = Object.keys(FOLDER_TO_SUBJECT);

function sanitizeFilename(filename) {
  return filename.replace(/[^\w\-\.]/g, '_').replace(/_{2,}/g, '_');
}

function validateFileUpload(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }

  if (file.size > MAX_FILE_SIZE) {
    return cb(new Error(`File size ${file.size} exceeds limit of ${MAX_FILE_SIZE} bytes`), false);
  }

  file.originalname = sanitizeFilename(file.originalname);
  cb(null, true);
}

function ensureDirectoryExists(dirPath) {
  return mkdirp.sync(dirPath);
}

function isSafeFolder(folderName) {
  return Boolean(resolveFolderKey(folderName));
}

function scanNotesDir() {
  if (!fs.existsSync(NOTES_DIR)) return JSON.parse(JSON.stringify(EMBEDDED_SHORT_NOTES));
  const subjects = [];
  const entries = fs.readdirSync(NOTES_DIR, { withFileTypes: true });
  entries.forEach(entry => {
    if (!entry.isDirectory()) return;
    const rawFolder = entry.name;
    const resolvedFolder = resolveFolderKey(rawFolder) || rawFolder;
    const subjectMeta = FOLDER_TO_SUBJECT[resolvedFolder] || { code: resolvedFolder, name: resolvedFolder, icon: '📄', color: '#64748b' };
    const folderPath = path.join(NOTES_DIR, rawFolder);
    const files = fs.readdirSync(folderPath)
      .filter(f => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map(f => {
        const downloadUrl = `/api/short-notes/download/${resolvedFolder}/${f}`;
        return {
          name: f,
          fileUrl: downloadUrl,
          type: path.extname(f).toLowerCase() === '.pdf' ? 'pdf' : 'image',
          size: fs.statSync(path.join(folderPath, f)).size,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    if (files.length) {
      subjects.push({
        folder: resolvedFolder,
        ...subjectMeta,
        files,
        count: files.length,
        lastModified: Math.max(...files.map(f => fs.statSync(path.join(folderPath, f.name)).mtimeMs)),
      });
    }
  });
  // If disk returned nothing useful, fall back to embedded
  if (!subjects.length) return JSON.parse(JSON.stringify(EMBEDDED_SHORT_NOTES));
  // Merge disk subjects with embedded (add any embedded subjects that disk missed entirely)
  const mergedByFolder = new Map();
  subjects.forEach(s => mergedByFolder.set(s.folder, s));
  for (const emb of JSON.parse(JSON.stringify(EMBEDDED_SHORT_NOTES))) {
    const existing = mergedByFolder.get(emb.folder);
    if (existing) {
      const seenFiles = new Set(existing.files.map(f => f.name));
      for (const f of emb.files) {
        if (!seenFiles.has(f.name)) existing.files.push(f);
      }
      existing.count = existing.files.length;
    } else {
      mergedByFolder.set(emb.folder, emb);
    }
  }
  return Array.from(mergedByFolder.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// GET /api/short-notes — list all subjects with their note files
router.get('/', protect, async (req, res, next) => {
  try {
    let notes = scanNotesDir();

    if (isMongoConnected()) {
      try {
        const mediaFiles = await MediaFile.find({ $or: [{ category: 'short-notes' }, { legacy_path: /\/short-notes\// }] });
        if (mediaFiles.length > 0) {
          const mediaByFolder = {};
          mediaFiles.forEach(doc => {
            // Resolve folder from doc.folder, meta.subject, or legacy_path
            let rawFolder = doc.folder || doc.meta?.subject || doc.subject || null;
            if (!rawFolder && doc.legacy_path) {
              const parts = String(doc.legacy_path).split(/[\/\\]/);
              const snIdx = parts.indexOf('short-notes');
              if (snIdx >= 0 && parts.length > snIdx + 1) rawFolder = parts[snIdx + 1];
            }
            const resolvedFolder = resolveFolderKey(rawFolder);
            if (!resolvedFolder) return; // skip unmatched categories
            const bucket = resolvedFolder;
            if (!mediaByFolder[bucket]) mediaByFolder[bucket] = [];
            let fileName = doc.originalname || doc.filename || (doc.title ? doc.title + '.pdf' : null);
            if (!fileName && doc.legacy_path) fileName = String(doc.legacy_path).split('/').pop();
            if (!fileName) fileName = 'file.pdf';
            let safeFileName = String(fileName).replace(/[^\w\-\.\s&]/g, '_').replace(/_{2,}/g, '_');
            if (!safeFileName.toLowerCase().endsWith('.pdf')) safeFileName += '.pdf';
            mediaByFolder[bucket].push({
              name: safeFileName,
              fileUrl: `/api/short-notes/download/${bucket}/${safeFileName}`,
              type: 'pdf',
              size: doc.size || 0,
              _legacyPath: doc.legacy_path || null,
              _fileName: (doc.originalname || doc.filename || safeFileName),
            });
          });

          const notesByFolder = new Map(notes.map(n => [n.folder, n]));
          for (const [folder, files] of Object.entries(mediaByFolder)) {
            const subjectMeta = FOLDER_TO_SUBJECT[folder] || { code: folder, name: folder, icon: '📄', color: '#64748b' };
            if (notesByFolder.has(folder)) {
              const cur = notesByFolder.get(folder);
              const seen = new Set(cur.files.map(f => f.name.toLowerCase()));
              for (const f of files) {
                if (!seen.has(f.name.toLowerCase())) {
                  cur.files.push({ name: f.name, fileUrl: f.fileUrl, type: f.type, size: f.size });
                }
              }
              cur.count = cur.files.length;
            } else {
              const entry = { folder, ...subjectMeta, files: files.map(f => ({ name: f.name, fileUrl: f.fileUrl, type: f.type, size: f.size })), count: files.length, lastModified: Date.now() };
              notes.push(entry);
              notesByFolder.set(folder, entry);
            }
          }
          notes.sort((a, b) => a.name.localeCompare(b.name));
        }
      } catch (e) { /* fall through */ }
    }

    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
});

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { folder } = req.params;
    if (!isSafeFolder(folder)) {
      return cb(new Error(`Invalid folder: ${folder}`), false);
    }
    const dir = path.join(NOTES_DIR, folder);
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeFilename = sanitizeFilename(file.originalname);
    cb(null, safeFilename);
  },
});

const fileFilter = (req, file, cb) => {
  validateFileUpload(req, file, cb);
};

const uploadNote = multer({
  storage: uploadStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// POST /api/short-notes/upload/:folder — admin upload note file
router.post('/upload/:folder', protect, uploadNote.single('file'), async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Verify the file actually exists on disk
    const filePath = path.join(NOTES_DIR, req.params.folder, req.file.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ success: false, message: 'Uploaded file not found on disk' });
    }

    // Get file size and type
    const stats = fs.statSync(filePath);
    const ext = path.extname(req.file.filename).toLowerCase();
    const isPdf = ext === '.pdf';

    res.json({
      success: true,
      data: {
        fileUrl: `/api/short-notes/download/${req.params.folder}/${req.file.filename}`,
        filename: req.file.filename,
        size: stats.size,
        type: isPdf ? 'pdf' : 'image',
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[ShortNotes Upload] Error:', err);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// GET /api/short-notes/download/:folder/:filename — serve PDF via Cloudinary or local fallback
router.get('/download/:folder/:filename', protect, async (req, res) => {
  const { folder, filename } = req.params;
  const resolvedFolder = resolveFolderKey(folder);
  if (!resolvedFolder) {
    return res.status(400).json({ success: false, message: 'Invalid folder' });
  }

  const safeFilename = path.basename(filename);
  const fnLower = safeFilename.toLowerCase();

  // Try Cloudinary first via MediaFile lookup — try multiple match strategies
  if (isMongoConnected()) {
    try {
      const folderAliases = new Set([folder, resolvedFolder]);
      // Also try all other folder keys that map to the same subject
      for (const [k, v] of Object.entries(FOLDER_ALIASES)) {
        if (v === resolvedFolder) folderAliases.add(k);
      }
      for (const [k, v] of Object.entries(FOLDER_TO_SUBJECT)) {
        if (v && resolveFolderKey(k) === resolvedFolder) folderAliases.add(k);
      }

      let doc = null;
      const triedPaths = [];
      for (const f of folderAliases) {
        triedPaths.push(`/resources/short-notes/${f}/${safeFilename}`);
        triedPaths.push(`/short-notes/${f}/${safeFilename}`);
        triedPaths.push(`short-notes/${f}/${safeFilename}`);
      }
      doc = await MediaFile.findOne({ legacy_path: { $in: triedPaths } });
      if (!doc) {
        // Looser match: find short-notes doc whose legacy_path or filename matches
        const candidates = await MediaFile.find({
          $or: [{ category: 'short-notes' }, { legacy_path: /\/short-notes\// }],
          secure_url: { $exists: true, $ne: null },
        }).limit(200);
        const basename = fnLower.replace(/[^a-z0-9]/g, '');
        doc = candidates.find(c => {
          const cPath = String(c.legacy_path || c.originalname || c.filename || c.title || '').toLowerCase();
          const nameOnly = (c.filename || c.originalname || (c.title ? c.title + '.pdf' : '') || '').toLowerCase();
          const a = cPath.replace(/[^a-z0-9]/g, '');
          const b = nameOnly.replace(/[^a-z0-9]/g, '');
          return a.includes(basename) || b.includes(basename) || basename.includes(b) || basename.includes(a.replace(/^.*[\\/]/, ''));
        }) || null;
      }
      if (doc && doc.secure_url) {
        let url = doc.secure_url;
        if (req.query.force === '1') url += (url.includes('?') ? '&' : '?') + 'fl_attachment';
        return res.json({ success: true, url });
      }
    } catch (e) { /* fall through to local */ }
  }

  // Local filesystem fallback - try resolved folder first, then raw folder
  let filePath = path.join(NOTES_DIR, resolvedFolder, safeFilename);
  if (!fs.existsSync(filePath) && resolvedFolder !== folder) {
    filePath = path.join(NOTES_DIR, folder, safeFilename);
  }
  if (fs.existsSync(filePath)) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 5 * 60 * 1000;
    localFileTokens.set(token, { filePath, expires });
    const tokenUrl = `/api/short-notes/local-file/${token}`;
    return res.json({ success: true, url: tokenUrl });
  }

  res.status(404).json({ success: false, message: 'File not found' });
});

// GET /api/short-notes/local-file/:token — serve local file with short-lived token
router.get('/local-file/:token', async (req, res) => {
  const tokenData = localFileTokens.get(req.params.token);
  if (!tokenData || tokenData.expires < Date.now()) {
    localFileTokens.delete(req.params.token);
    return res.status(404).json({ success: false, message: 'Token expired or invalid' });
  }
  localFileTokens.delete(req.params.token);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(tokenData.filePath)}"`);
  fs.createReadStream(tokenData.filePath).pipe(res);
});

module.exports = router;