const router = require('express').Router();
const mongoose = require('mongoose');
const AdminPdf = require('../models/AdminPdf');
const { protect } = require('../middleware/auth');
const { isCloudinaryConfigured, getPdfPageCount, generateSignedPdfPageUrls } = require('../config/cloudinary');

function requireCloudinary(req, res, next) {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Cloudinary not configured. Contact admin.',
    });
  }
  next();
}

// Access log helper (ephemeral — no model needed)
const accessLogs = [];

function logAccess(action, userId, pdfId, ip, userAgent) {
  const entry = { action, userId, pdfId, ip, userAgent, timestamp: new Date().toISOString() };
  accessLogs.unshift(entry);
  if (accessLogs.length > 10000) accessLogs.length = 10000; // keep last 10k
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DOC ACCESS] ${action} — user=${userId} pdf=${pdfId}`);
  }
}

// GET /api/protected/pdf/:id
// Returns signed, time-limited page image URLs with watermark metadata
router.get('/pdf/:id', protect, requireCloudinary, async (req, res, next) => {
  try {
    const pdf = await AdminPdf.findById(req.params.id);
    if (!pdf || !pdf.isPublished) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const userId = req.user._id?.toString() || req.user.id?.toString() || 'unknown';
    const userEmail = req.user.email || 'user';
    const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'] || '';

    // Get page count from Cloudinary
    const totalPages = await getPdfPageCount(pdf.publicId);

    // Generate signed page image URLs with watermark
    const pages = generateSignedPdfPageUrls(pdf.publicId, totalPages, userId, userEmail);

    // Log access
    logAccess('view', userId, pdf._id.toString(), userIp, userAgent);

    res.json({
      success: true,
      data: {
        _id: pdf._id,
        title: pdf.title,
        description: pdf.description,
        category: pdf.category,
        subject: pdf.subject,
        year: pdf.year,
        totalPages,
        pages,
        watermark: {
          email: userEmail,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          brand: 'PREPGATE',
        },
      },
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/protected/pdf/:id/info
// Lightweight metadata-only endpoint (no page images generated)
router.get('/pdf/:id/info', protect, async (req, res, next) => {
  try {
    const pdf = await AdminPdf.findById(req.params.id);
    if (!pdf || !pdf.isPublished) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    res.json({
      success: true,
      data: {
        _id: pdf._id,
        title: pdf.title,
        description: pdf.description,
        category: pdf.category,
        subject: pdf.subject,
        year: pdf.year,
        fileSize: pdf.fileSize,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
