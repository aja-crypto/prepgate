// src/routes/notes.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const { protect } = require('../middleware/auth');
const { isMongoConnected } = require('../config/db');
const { Note } = require('../models');
const { getLocalNotes, saveLocalNote, updateLocalNote, deleteLocalNote } = require('../store/localDataStore');

// Configure Multer for local uploads
const uploadsNotesDir = path.join(__dirname, '../..', 'uploads', 'notes');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsNotesDir)) fs.mkdirSync(uploadsNotesDir, { recursive: true });
    cb(null, uploadsNotesDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
  }
});

// Stats for Revision Mode (Moved up for priority)
router.get('/stats', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (!isMongoConnected()) {
      const allLocal = getLocalNotes({ user: userId });
      return res.json({
        success: true,
        data: {
          recent: allLocal.slice(0, 5),
          mostViewed: allLocal.slice(0, 5), // Basic fallback
          pinned: allLocal.filter(n => n.isPinned)
        }
      });
    }
    
    const [recent, mostViewed, pinned] = await Promise.all([
      Note.find({ user: userId }).sort('-updatedAt').limit(5),
      Note.find({ user: userId }).sort('-viewCount').limit(5),
      Note.find({ user: userId, isPinned: true }).limit(10)
    ]);

    res.json({ success: true, data: { recent, mostViewed, pinned } });
  } catch (e) { next(e); }
});

router.get('/', protect, async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.pinned) filter.isPinned = true;
    if (req.query.favorite) filter.isFavorite = true;
    if (req.query.search) filter.search = req.query.search;

    if (!isMongoConnected()) {
      const notes = getLocalNotes(filter);
      return res.json({ success: true, count: notes.length, data: notes });
    }

    const dbFilter = { user: req.user._id };
    if (req.query.subject) dbFilter.subject = req.query.subject;
    if (req.query.type) dbFilter.type = req.query.type;
    if (req.query.pinned) dbFilter.isPinned = true;
    if (req.query.favorite) dbFilter.isFavorite = true;
    if (req.query.search) dbFilter.$text = { $search: req.query.search };

    const notes = await Note.find(dbFilter).sort('-isPinned -updatedAt');
    res.json({ success: true, count: notes.length, data: notes });
  } catch (e) { next(e); }
});

router.post('/', protect, upload.single('file'), async (req, res, next) => {
  try {
    // Ensure numeric/boolean conversions for FormData strings
    const noteData = { 
      ...req.body, 
      user: req.user._id,
      isPinned: req.body.isPinned === 'true',
      isFavorite: req.body.isFavorite === 'true'
    };
    
    if (req.file) {
      noteData.fileUrl = `/uploads/notes/${req.file.filename}`;
      noteData.fileType = req.file.mimetype;
      noteData.fileSize = req.file.size;
      console.log('--- Note File Upload Debug ---');
      console.log('File stored at:', req.file.path);
      console.log('Public URL path:', noteData.fileUrl);
    }

    let note;
    if (!isMongoConnected()) {
      note = saveLocalNote(noteData);
      console.log('Saved to Local Store:', note._id);
    } else {
      note = await Note.create(noteData);
      console.log('Saved to MongoDB:', note._id);
    }

    // Perform OCR in background to not block response
    if (req.file && req.file.mimetype.startsWith('image/')) {
      Tesseract.recognize(req.file.path, 'eng')
        .then(({ data: { text } }) => {
          if (isMongoConnected()) {
            Note.findByIdAndUpdate(note._id, { ocrText: text }).catch(console.error);
          } else {
            updateLocalNote(note._id, { ocrText: text });
          }
        })
        .catch(err => console.error('Background OCR Error:', err));
    }

    res.status(201).json({ success: true, data: note });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', protect, upload.single('file'), async (req, res, next) => {
  try {
    const updateData = {
      ...req.body,
      isPinned: req.body.isPinned === 'true',
      isFavorite: req.body.isFavorite === 'true',
    };
    if (req.file) {
      // Delete old file before replacing
      let oldNote;
      if (isMongoConnected()) {
        oldNote = await Note.findOne({ _id: req.params.id, user: req.user._id });
      } else {
        const allLocal = getLocalNotes({ user: req.user._id });
        oldNote = allLocal.find(n => n._id === req.params.id);
      }
      if (oldNote && oldNote.fileUrl) {
        const oldFilePath = path.join(__dirname, '../..', oldNote.fileUrl);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      updateData.fileUrl = `/uploads/notes/${req.file.filename}`;
      updateData.fileType = req.file.mimetype;
      updateData.fileSize = req.file.size;
    }

    let note;
    if (!isMongoConnected()) {
      note = updateLocalNote(req.params.id, updateData);
    } else {
      note = await Note.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        updateData,
        { new: true, runValidators: true }
      );
    }

    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (e) { next(e); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    let note;
    if (isMongoConnected()) {
      note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    } else {
      const allLocal = getLocalNotes({ user: req.user._id });
      note = allLocal.find(n => n._id === req.params.id);
    }

    if (note && note.fileUrl) {
      const filePath = path.join(__dirname, '../..', note.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    if (isMongoConnected()) {
      await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    } else {
      deleteLocalNote(req.params.id);
    }

    res.json({ success: true, message: 'Note deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
