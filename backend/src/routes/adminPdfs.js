const router = require('express').Router();
const multer = require('multer');
const AdminPdf = require('../models/AdminPdf');
const { adminProtect, requirePermission } = require('../middleware/adminAuth');
const { isCloudinaryConfigured, uploadPdf, deletePdf } = require('../config/cloudinary');
const { isMongoConnected } = require('../config/db');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  },
});

function requireCloudinary(req, res, next) {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    });
  }
  next();
}

// GET /api/admin/pdfs
router.get('/', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      return res.json({ success: true, count: 0, data: [], message: 'MongoDB required. Set MONGO_URI in .env to manage PDFs.' });
    }
    const { category, subject, isPublished } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (subject) filter.subject = subject;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    const pdfs = await AdminPdf.find(filter).sort('-createdAt').populate('uploadedBy', 'name email');
    res.json({ success: true, count: pdfs.length, data: pdfs });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/pdfs
router.post('/', adminProtect, requirePermission('content.manage'), requireCloudinary, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
    }

    const { title, description, category, subject, year } = req.body;
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required.' });
    }

    const result = await uploadPdf(req.file.buffer, req.file.originalname);

    const pdf = await AdminPdf.create({
      title,
      description: description || '',
      category,
      subject: subject || '',
      year: year ? parseInt(year, 10) : undefined,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileSize: req.file.size,
      uploadedBy: req.admin._id,
    });

    res.status(201).json({ success: true, data: pdf });
  } catch (e) {
    next(e);
  }
});

// PUT /api/admin/pdfs/:id — update metadata
router.put('/:id', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    const { title, description, category, subject, year } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (subject !== undefined) updates.subject = subject;
    if (year !== undefined) updates.year = parseInt(year, 10);

    const pdf = await AdminPdf.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found.' });

    res.json({ success: true, data: pdf });
  } catch (e) {
    next(e);
  }
});

// PUT /api/admin/pdfs/:id/file — replace file
router.put('/:id/file', adminProtect, requirePermission('content.manage'), requireCloudinary, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
    }

    const pdf = await AdminPdf.findById(req.params.id);
    if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found.' });

    // Delete old file from Cloudinary
    await deletePdf(pdf.publicId).catch((e) => console.warn('[AdminPdfs] Delete old PDF failed:', e.message));

    // Upload new file
    const result = await uploadPdf(req.file.buffer, req.file.originalname);

    pdf.fileUrl = result.secure_url;
    pdf.publicId = result.public_id;
    pdf.fileSize = req.file.size;
    await pdf.save();

    res.json({ success: true, data: pdf });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/admin/pdfs/:id
router.delete('/:id', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    const pdf = await AdminPdf.findById(req.params.id);
    if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found.' });

    if (isCloudinaryConfigured()) {
      await deletePdf(pdf.publicId).catch((e) => console.warn('[AdminPdfs] Delete PDF failed:', e.message));
    }

    await AdminPdf.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'PDF deleted.' });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/admin/pdfs/:id/publish
router.patch('/:id/publish', adminProtect, requirePermission('content.manage'), async (req, res, next) => {
  try {
    const { isPublished } = req.body;
    if (isPublished === undefined) {
      return res.status(400).json({ success: false, message: 'isPublished is required.' });
    }

    const pdf = await AdminPdf.findByIdAndUpdate(
      req.params.id,
      { isPublished },
      { new: true }
    );
    if (!pdf) return res.status(404).json({ success: false, message: 'PDF not found.' });

    res.json({ success: true, data: pdf });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
