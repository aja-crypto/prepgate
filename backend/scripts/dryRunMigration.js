#!/usr/bin/env node
// scripts/dryRunMigration.js — Dry run: report what WOULD be migrated to Cloudinary
// NO uploads, NO database changes, NO file modifications. Read-only.

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const RESOURCES_DIR = path.join(BASE, 'resources');
const GATE_PAPERS_DIR = path.join(BASE, 'uploads', 'gate-papers');
const SHORT_NOTES_DIR = path.join(RESOURCES_DIR, 'short-notes');
const WEEKLY_TESTS_DIR = path.join(RESOURCES_DIR, 'weekly-tests');

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
      results.push({ path: full, name: item.name, size: stat.size, mtime: stat.mtime });
    }
  }
  return results;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function subjectFromPath(filePath, baseDir) {
  const rel = path.relative(baseDir, filePath);
  const parts = rel.split(/[\\/]/);
  return parts.length > 1 ? parts[0] : 'Uncategorized';
}

console.log('=== GATENEXA RESOURCE MIGRATION DRY RUN ===\n');
console.log('This script reports what WOULD be migrated. No files are modified.\n');

// 1. Resources (course notes)
const allResources = scanDir(RESOURCES_DIR, f => f.endsWith('.pdf'));
const realResources = allResources.filter(f => f.size >= 1024);
const placeholderResources = allResources.filter(f => f.size < 1024);

console.log('--- BACKEND/RESOURCES/ ---');
console.log(`Total PDFs: ${allResources.length}`);
console.log(`Real content (>1KB): ${realResources.length}`);
console.log(`Placeholder stubs (<1KB): ${placeholderResources.length}`);
console.log(`Total size: ${formatSize(allResources.reduce((s, f) => s + f.size, 0))}`);
console.log(`Real content size: ${formatSize(realResources.reduce((s, f) => s + f.size, 0))}`);

// Subject breakdown for real resources
const bySubject = {};
for (const f of realResources) {
  const subj = subjectFromPath(f.path, RESOURCES_DIR);
  if (!bySubject[subj]) bySubject[subj] = { count: 0, size: 0 };
  bySubject[subj].count++;
  bySubject[subj].size += f.size;
}
console.log('\nBy subject:');
for (const [subj, info] of Object.entries(bySubject).sort((a, b) => b[1].size - a[1].size)) {
  console.log(`  ${subj}: ${info.count} files, ${formatSize(info.size)}`);
}

// 2. Gate Papers
const gatePapers = scanDir(GATE_PAPERS_DIR, f => f.endsWith('.pdf'));
const manifestPath = path.join(GATE_PAPERS_DIR, 'manifest.json');
const hasManifest = fs.existsSync(manifestPath);

console.log('\n--- BACKEND/UPLOADS/GATE-PAPERS/ ---');
console.log(`PDFs: ${gatePapers.length}`);
console.log(`Manifest.json: ${hasManifest ? 'exists' : 'MISSING'}`);
console.log(`Total size: ${formatSize(gatePapers.reduce((s, f) => s + f.size, 0))}`);

// 3. Short Notes
const shortNotes = scanDir(SHORT_NOTES_DIR, f => f.endsWith('.pdf') || f.endsWith('.png') || f.endsWith('.jpg'));

console.log('\n--- BACKEND/RESOURCES/SHORT-NOTES/ ---');
console.log(`Files: ${shortNotes.length}`);
console.log(`Total size: ${formatSize(shortNotes.reduce((s, f) => s + f.size, 0))}`);

// 4. Weekly Tests
const weeklyTests = scanDir(WEEKLY_TESTS_DIR, f => f.endsWith('.pdf'));

console.log('\n--- BACKEND/RESOURCES/WEEKLY-TESTS/ ---');
console.log(`PDFs: ${weeklyTests.length}`);
console.log(`Total size: ${formatSize(weeklyTests.reduce((s, f) => s + f.size, 0))}`);

const wtBySubject = {};
for (const f of weeklyTests) {
  const subj = subjectFromPath(f.path, WEEKLY_TESTS_DIR);
  if (!wtBySubject[subj]) wtBySubject[subj] = { count: 0, size: 0 };
  wtBySubject[subj].count++;
  wtBySubject[subj].size += f.size;
}
console.log('By subject:');
for (const [subj, info] of Object.entries(wtBySubject).sort((a, b) => b[1].count - a[1].count)) {
  console.log(`  ${subj}: ${info.count} files, ${formatSize(info.size)}`);
}

// Summary
const totalFiles = realResources.length + gatePapers.length + shortNotes.length + weeklyTests.length;
const totalSize = realResources.reduce((s, f) => s + f.size, 0)
  + gatePapers.reduce((s, f) => s + f.size, 0)
  + shortNotes.reduce((s, f) => s + f.size, 0)
  + weeklyTests.reduce((s, f) => s + f.size, 0);

console.log('\n=== MIGRATION SUMMARY ===');
console.log(`Files to upload: ${totalFiles}`);
console.log(`Total size: ${formatSize(totalSize)}`);
console.log(`Estimated Cloudinary API calls: ${totalFiles}`);
console.log(`Estimated MediaFile records: ${totalFiles}`);
console.log(`Cloudinary folder structure:`);
console.log(`  GateNexa/resources/     (${realResources.length} files)`);
console.log(`  GateNexa/gate-papers/   (${gatePapers.length} files)`);
console.log(`  GateNexa/short-notes/   (${shortNotes.length} files)`);
console.log(`  GateNexa/weekly-tests/  (${weeklyTests.length} files)`);

console.log('\n=== PLACEHOLDER STUBS (SKIPPED) ===');
console.log(`${placeholderResources.length} files under 1KB will NOT be migrated:`);
placeholderResources.slice(0, 10).forEach(f => {
  console.log(`  ${formatSize(f.size)}  ${path.relative(RESOURCES_DIR, f.path)}`);
});
if (placeholderResources.length > 10) {
  console.log(`  ... and ${placeholderResources.length - 10} more`);
}
