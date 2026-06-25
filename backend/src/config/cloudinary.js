const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

async function uploadPdf(fileBuffer, fileName, folder = 'GateApex/pdfs') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder,
        public_id: fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_'),
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

async function deletePdf(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
}

async function getPdfPageCount(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
    return result.pages || 1;
  } catch (e) {
    // Fallback: assume single page
    return 1;
  }
}

function generateSignedPdfPageUrls(publicId, totalPages, userId, userEmail) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 300; // 5 minutes
  const dateStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    const url = cloudinary.url(publicId, {
      resource_type: 'image',
      type: 'upload',
      sign_url: true,
      secure: true,
      transformation: [
        { width: 1400, crop: 'limit', page: i },
        {
          overlay: `text:Arial_24:${encodeURIComponent('GateApex')}`,
          color: '#ffffff20',
          gravity: 'north_west',
          x: 12,
          y: 12,
        },
        {
          overlay: `text:Arial_18:${encodeURIComponent(`${userEmail} | ${dateStr}`)}`,
          color: '#ffffff20',
          gravity: 'south_east',
          x: 12,
          y: 12,
        },
      ],
      expires_at: expiresAt,
    });
    pages.push({ pageNumber: i, url });
  }
  return pages;
}

module.exports = {
  cloudinary, isCloudinaryConfigured, uploadPdf, deletePdf,
  getPdfPageCount, generateSignedPdfPageUrls,
};

