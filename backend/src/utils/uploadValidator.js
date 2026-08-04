const path = require('path');

const ALLOWED_MIMETYPES = {
  pdf: {
    mime: ['application/pdf'],
    ext: ['.pdf'],
  },
  image: {
    mime: ['image/jpeg', 'image/png', 'image/webp'],
    ext: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  document: {
    mime: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    ext: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
  },
};

function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 200) || 'unnamed';
}

function createFileFilter(allowedTypes) {
  const allowed = ALLOWED_MIMETYPES[allowedTypes];
  if (!allowed) throw new Error(`Unknown allowed type: ${allowedTypes}`);

  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    const extOk = allowed.ext.includes(ext);
    const mimeOk = allowed.mime.some(m => mime.startsWith(m)) || mime === ext.slice(1);

    if (!extOk) {
      return cb(new Error(`Invalid file extension: ${ext}. Allowed: ${allowed.ext.join(', ')}`), false);
    }

    cb(null, true);
  };
}

module.exports = { sanitizeFilename, createFileFilter, ALLOWED_MIMETYPES };
