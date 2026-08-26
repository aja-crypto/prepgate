#!/usr/bin/env node
// scripts/migrateToCloudinary.js — Upload local PDFs to Cloudinary + create MediaFile records
// Run locally: node scripts/migrateToCloudinary.js [--dry-run]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DRY_RUN = process.argv.includes('--dry-run');

// Load env
require('../src/config/loadEnv');

// Debug: verify env
if (!process.env.CLOUDINARY_API_SECRET) {
  console.error('FATAL: CLOUDINARY_API_SECRET not loaded from .env');
  process.exit(1);
}
console.log('Cloudinary config OK:', process.env.CLOUDINARY_CLOUD_NAME);

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const MediaFile = require('../src/models/MediaFile');

const BASE = path.join(__dirname, '..');
const RESOURCES_DIR = path.join(BASE, 'resources');
const GATE_PAPERS_DIR = path.join(BASE, 'uploads', 'gate-papers');
const SHORT_NOTES_DIR = path.join(RESOURCES_DIR, 'short-notes');
const WEEKLY_TESTS_DIR = path.join(RESOURCES_DIR, 'weekly-tests');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function scanDir(dir, filter) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...scanDir(full, filter));
    } else if (!filter || filter(item.name)) {
      const stat = fs.statSync(full);
      results.push({ path: full, name: item.name, size: stat.size });
    }
  }
  return results;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function uploadOne(filePath, folder, legacyPath, category, meta = {}, customPublicId) {
  const buffer = fs.readFileSync(filePath);
  const hash = sha256(buffer);
  const fileName = path.basename(filePath);
  const publicId = customPublicId || fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

  if (DRY_RUN) {
    return { public_id: `${folder}/${publicId}`, secure_url: `(dry-run)`, size: buffer.length, sha256: hash };
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder,
        public_id: publicId,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) {
          console.error('  Cloudinary error:', error.message);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });

  if (!result || !result.public_id) {
    console.error('  Unexpected result:', JSON.stringify(result).substring(0, 200));
    throw new Error('Upload returned no public_id');
  }

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    size: buffer.length,
    sha256: hash,
  };
}

async function main() {
  console.log(`=== GATENEXA CLOUDINARY MIGRATION ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // Connect to MongoDB
  if (!DRY_RUN) {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.\n');
  }

  let totalUploaded = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  // 1. Resources (course notes) — exclude short-notes and weekly-tests (handled separately)
  console.log('--- MIGRATING RESOURCES ---');
  const resources = scanDir(RESOURCES_DIR, f => f.endsWith('.pdf')).filter(f => {
    if (f.size < 1024) return false;
    const relFromResources = path.relative(RESOURCES_DIR, f.path).replace(/\\/g, '/');
    if (relFromResources.startsWith('short-notes/') || relFromResources.startsWith('weekly-tests/')) return false;
    return true;
  });
  console.log(`Found ${resources.length} real PDFs to upload\n`);

  for (const file of resources) {
    const relPath = path.relative(RESOURCES_DIR, file.path).replace(/\\/g, '/');
    const parts = relPath.split('/');
    const subject = parts.length > 1 ? parts[0] : 'Uncategorized';
    const topic = path.basename(file.name, '.pdf').replace(/[_-]/g, ' ');

    try {
      const uploaded = await uploadOne(file.path, 'GateNexa/resources', relPath, 'resources', { subject, topic });

      if (!DRY_RUN) {
        await MediaFile.findOneAndUpdate(
          { public_id: uploaded.public_id },
          {
            title: topic,
            subject,
            category: 'resources',
            type: 'pdf',
            public_id: uploaded.public_id,
            secure_url: uploaded.secure_url,
            resource_type: 'raw',
            size: uploaded.size,
            sha256: uploaded.sha256,
            visibility: 'premium',
            folder: subject,
            legacy_path: `/resources/${relPath}`,
            meta: { topic },
          },
          { upsert: true, new: true }
        );
      }

      totalUploaded++;
      process.stdout.write(`  ✅ ${relPath.substring(0, 60)}\n`);
    } catch (e) {
      totalFailed++;
      process.stdout.write(`  ❌ ${relPath.substring(0, 60)} — ${e.message}\n`);
    }
  }

  // 2. Short Notes
  console.log('\n--- MIGRATING SHORT NOTES ---');
  const SHORT_NOTES_DIR = path.join(RESOURCES_DIR, 'short-notes');
  const shortNotes = scanDir(SHORT_NOTES_DIR, f => f.endsWith('.pdf')).filter(f => f.size >= 1024);
  console.log(`Found ${shortNotes.length} real PDFs to upload\n`);

  const SHORT_NOTE_FOLDER_MAP = {
    'OS': 'OS', 'DBMS': 'DB', 'CN': 'CN', 'Algorithms': 'AL',
    'COA': 'CO', 'Compiler': 'CD', 'Mathematics': 'EM', 'TOC': 'TOC',
    'DS': 'DS', 'DL': 'DL', 'Aptitude': 'APT', 'C': 'DS'
  };

  for (const file of shortNotes) {
    const relPath = path.relative(SHORT_NOTES_DIR, file.path).replace(/\\/g, '/');
    const parts = relPath.split('/');
    const rawFolder = parts.length > 1 ? parts[0] : 'Uncategorized';
    const folderCode = SHORT_NOTE_FOLDER_MAP[rawFolder] || rawFolder;
    const fileName = file.name;
    const safeFileName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicIdWithFolder = `${folderCode}_${safeFileName}`;

    try {
      const uploaded = await uploadOne(file.path, 'GateNexa/short-notes', relPath, 'short-notes', { subject: folderCode, topic: fileName.replace('.pdf', '') }, publicIdWithFolder);

      if (!DRY_RUN) {
        await MediaFile.findOneAndUpdate(
          { public_id: uploaded.public_id },
          {
            title: fileName.replace('.pdf', ''),
            subject: folderCode,
            category: 'short-notes',
            type: 'pdf',
            public_id: uploaded.public_id,
            secure_url: uploaded.secure_url,
            resource_type: 'raw',
            size: uploaded.size,
            sha256: uploaded.sha256,
            visibility: 'premium',
            folder: rawFolder,
            legacy_path: `/resources/short-notes/${rawFolder}/${fileName}`,
            meta: { subject: folderCode, topic: fileName.replace('.pdf', '') },
          },
          { upsert: true, new: true }
        );
      }

      totalUploaded++;
      process.stdout.write(`  ✅ ${rawFolder}/${fileName} (${(file.size / 1024 / 1024).toFixed(1)} MB)\n`);
    } catch (e) {
      totalFailed++;
      process.stdout.write(`  ❌ ${rawFolder}/${fileName} — ${e.message}\n`);
    }
  }

  // 3. Gate Papers
  console.log('\n--- MIGRATING GATE PAPERS ---');
  const gatePapers = scanDir(GATE_PAPERS_DIR, f => f.endsWith('.pdf'));
  console.log(`Found ${gatePapers.length} PDFs to upload\n`);

  const manifestPath = path.join(GATE_PAPERS_DIR, 'manifest.json');
  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  for (const file of gatePapers) {
    const fileName = file.name;
    const manifestEntry = manifest.find(m => m.filename === fileName);
    const year = manifestEntry?.year || 0;
    const set = manifestEntry?.set || '';
    const title = manifestEntry?.title || fileName.replace('.pdf', '');

    try {
      const uploaded = await uploadOne(file.path, 'GateNexa/gate-papers', fileName, 'gate-papers', { year, set });

      if (!DRY_RUN) {
        await MediaFile.findOneAndUpdate(
          { public_id: uploaded.public_id },
          {
            title,
            category: 'gate-papers',
            type: 'pdf',
            public_id: uploaded.public_id,
            secure_url: uploaded.secure_url,
            resource_type: 'raw',
            size: uploaded.size,
            sha256: uploaded.sha256,
            visibility: 'public',
            legacy_path: `/uploads/gate-papers/${fileName}`,
            meta: { year, set, filename: fileName },
          },
          { upsert: true, new: true }
        );
      }

      totalUploaded++;
      process.stdout.write(`  ✅ ${fileName}\n`);
    } catch (e) {
      totalFailed++;
      process.stdout.write(`  ❌ ${fileName} — ${e.message}\n`);
    }
  }

  // 3. Weekly Tests
  console.log('\n--- MIGRATING WEEKLY TESTS ---');
  const weeklyTests = scanDir(WEEKLY_TESTS_DIR, f => f.endsWith('.pdf'));
  console.log(`Found ${weeklyTests.length} PDFs to upload\n`);

  for (const file of weeklyTests) {
    const relPath = path.relative(WEEKLY_TESTS_DIR, file.path).replace(/\\/g, '/');
    const parts = relPath.split('/');
    const subject = parts.length > 1 ? parts[0] : 'misc';
    const fileName = file.name;
    const safeFileName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicIdWithSubject = `${subject}_${safeFileName}`;

    try {
      const uploaded = await uploadOne(file.path, 'GateNexa/weekly-tests', relPath, 'weekly-tests', { subject }, publicIdWithSubject);

      if (!DRY_RUN) {
        await MediaFile.findOneAndUpdate(
          { public_id: uploaded.public_id },
          {
            title: fileName.replace('.pdf', ''),
            subject,
            category: 'weekly-tests',
            type: 'pdf',
            public_id: uploaded.public_id,
            secure_url: uploaded.secure_url,
            resource_type: 'raw',
            size: uploaded.size,
            sha256: uploaded.sha256,
            visibility: 'premium',
            folder: subject,
            legacy_path: `/resources/weekly-tests/${relPath}`,
            meta: { subject },
          },
          { upsert: true, new: true }
        );
      }

      totalUploaded++;
      process.stdout.write(`  ✅ ${relPath}\n`);
    } catch (e) {
      totalFailed++;
      process.stdout.write(`  ❌ ${relPath} — ${e.message}\n`);
    }
  }

  console.log(`\n=== MIGRATION COMPLETE ===`);
  console.log(`Uploaded: ${totalUploaded}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Skipped: ${totalSkipped}`);

  if (!DRY_RUN) {
    const count = await MediaFile.countDocuments();
    console.log(`MediaFile records in DB: ${count}`);
    await mongoose.disconnect();
  }
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
