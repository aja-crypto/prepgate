const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { Note } = require('../models');
const { isMongoConnected } = require('../config/db');
const {
  saveLocalNote,
  getLocalNotes,
  updateLocalNote,
  deleteLocalNote,
} = require('../store/localDataStore');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads/notes');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path
      .basename(file.originalname || 'note', ext)
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'note';
    cb(null, `${Date.now()}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/')
    ) {
      return cb(null, true);
    }
    cb(new Error('Only PDF and image uploads are supported.'));
  },
});

function userId(req) {
  return req.user?._id || req.user?.id;
}

function normalizeBool(value) {
  return value === true || value === 'true' || value === '1';
}

function publicFileUrl(file) {
  return file ? `/uploads/notes/${file.filename}` : undefined;
}

function pickNoteBody(body, file) {
  const payload = {
    title: body.title,
    subject: body.subject,
    topic: body.topic || undefined,
    content: body.content || '',
    type: body.type || (file ? 'pdf' : 'text'),
    tags: Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
    isPinned: normalizeBool(body.isPinned),
    isFavorite: normalizeBool(body.isFavorite),
    color: body.color || undefined,
  };

  if (file) {
    payload.fileUrl = publicFileUrl(file);
    payload.fileType = file.mimetype;
    payload.fileSize = file.size;
  }

  return payload;
}

function serialize(note) {
  const obj = typeof note.toObject === 'function'
    ? note.toObject({ virtuals: true })
    : { ...note };
  if (!obj.imageUrl && obj.fileUrl) obj.imageUrl = obj.fileUrl;
  return obj;
}

function noteFilter(req) {
  const filter = { user: userId(req) };
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.pinned === 'true') filter.isPinned = true;
  if (req.query.type) filter.type = req.query.type;
  return filter;
}

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({
        success: true,
        data: getLocalNotes({
          user: userId(req),
          subject: req.query.subject,
          isPinned: req.query.pinned === 'true',
          search: req.query.search,
        }).map(serialize),
      });
    }

    const filter = noteFilter(req);
    let query = Note.find(filter).sort({ isPinned: -1, updatedAt: -1 });

    if (req.query.search) {
      query = query.find({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { content: { $regex: req.query.search, $options: 'i' } },
          { ocrText: { $regex: req.query.search, $options: 'i' } },
          { tags: { $regex: req.query.search, $options: 'i' } },
        ],
      });
    }

    const notes = await query;
    res.json({ success: true, data: notes.map(serialize) });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const notes = isMongoConnected()
      ? await Note.find({ user: userId(req) }).sort({ updatedAt: -1 }).limit(100)
      : getLocalNotes({ user: userId(req) });

    res.json({
      success: true,
      data: {
        recent: notes.slice(0, 4).map(serialize),
        mostViewed: [...notes]
          .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
          .slice(0, 4)
          .map(serialize),
        pinned: notes.filter((note) => note.isPinned).slice(0, 6).map(serialize),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const payload = { ...pickNoteBody(req.body, req.file), user: userId(req) };
    if (!payload.title || !payload.subject) {
      return res.status(400).json({ success: false, message: 'Title and subject are required.' });
    }

    const note = isMongoConnected()
      ? await Note.create(payload)
      : saveLocalNote(payload);

    res.status(201).json({ success: true, data: serialize(note) });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', upload.single('file'), async (req, res, next) => {
  try {
    const payload = pickNoteBody(req.body, req.file);
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const note = isMongoConnected()
      ? await Note.findOneAndUpdate(
          { _id: req.params.id, user: userId(req) },
          payload,
          { new: true, runValidators: true }
        )
      : updateLocalNote(req.params.id, payload);

    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    res.json({ success: true, data: serialize(note) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/view', async (req, res, next) => {
  try {
    const note = isMongoConnected()
      ? await Note.findOneAndUpdate(
          { _id: req.params.id, user: userId(req) },
          { $inc: { viewCount: 1 }, lastViewed: new Date() },
          { new: true }
        )
      : updateLocalNote(req.params.id, { lastViewed: new Date() });

    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    res.json({ success: true, data: serialize(note) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const note = isMongoConnected()
      ? await Note.findOneAndDelete({ _id: req.params.id, user: userId(req) })
      : deleteLocalNote(req.params.id);

    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
