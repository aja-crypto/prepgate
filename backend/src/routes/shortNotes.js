const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect } = require('../middleware/auth');

const NOTES_DIR = path.join(__dirname, '../../../resources/short-notes');

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
  C: { code: 'DS', name: 'C Programming', icon: '🐍', color: '#ff9f43' },
  DL: { code: 'DL', name: 'Digital Logic', icon: '💻', color: '#7c5cfc' },
};

function scanNotesDir() {
  if (!fs.existsSync(NOTES_DIR)) return [];
  const subjects = [];
  const entries = fs.readdirSync(NOTES_DIR, { withFileTypes: true });
  entries.forEach(entry => {
    if (!entry.isDirectory()) return;
    const folderName = entry.name;
    const subjectMeta = FOLDER_TO_SUBJECT[folderName] || { code: folderName, name: folderName, icon: '📄', color: '#64748b' };
    const folderPath = path.join(NOTES_DIR, folderName);
    const files = fs.readdirSync(folderPath)
      .filter(f => /\.(pdf|png|jpg|jpeg|webp)$/i.test(f))
      .map(f => ({
        name: f,
        fileUrl: `/resources/short-notes/${folderName}/${f}`,
        type: f.endsWith('.pdf') ? 'pdf' : 'image',
        size: fs.statSync(path.join(folderPath, f)).size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (files.length) {
      subjects.push({
        folder: folderName,
        ...subjectMeta,
        files,
        count: files.length,
        lastModified: Math.max(...files.map(f => fs.statSync(path.join(folderPath, f.name)).mtimeMs)),
      });
    }
  });
  return subjects.sort((a, b) => a.name.localeCompare(b.name));
}

// GET /api/short-notes — list all subjects with their note files
router.get('/', protect, (req, res, next) => {
  try {
    const notes = scanNotesDir();
    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
});

// Multer for admin upload
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { folder } = req.params;
    const dir = path.join(NOTES_DIR, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname.replace(/\s+/g, '_'));
  },
});
const uploadNote = multer({ storage: uploadStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/short-notes/upload/:folder — admin upload note file
router.post('/upload/:folder', protect, uploadNote.single('file'), (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, data: { fileUrl: `/resources/short-notes/${req.params.folder}/${req.file.filename}`, filename: req.file.filename } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
