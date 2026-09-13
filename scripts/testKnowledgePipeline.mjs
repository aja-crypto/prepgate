#!/usr/bin/env node
/**
 * testKnowledgePipeline.mjs
 * Focused tests for the knowledge base pipeline.
 * Run: node scripts/testKnowledgePipeline.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const JSON_PATH = join(ROOT, 'frontend', 'src', 'data', 'generated', 'gateKnowledge.json');
const KB_PATH = join(ROOT, 'resources', 'GATE_KNOWLEDGE_BASE.md');
const INSIGHTS_PATH = join(ROOT, 'resources', 'insights.txt');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(`  ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertGreaterThan(actual, min, message) {
  if (actual <= min) {
    throw new Error(message || `Expected > ${min}, got ${actual}`);
  }
}

// ─── Source Files Exist ──────────────────────────────────────────────

test('GATE_KNOWLEDGE_BASE.md exists', () => {
  assert(existsSync(KB_PATH), 'File not found: resources/GATE_KNOWLEDGE_BASE.md');
});

test('insights.txt exists', () => {
  assert(existsSync(INSIGHTS_PATH), 'File not found: resources/insights.txt');
});

test('Generated JSON exists', () => {
  assert(existsSync(JSON_PATH), 'File not found: frontend/src/data/generated/gateKnowledge.json');
});

// ─── JSON Validity ──────────────────────────────────────────────────

const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

test('JSON has metadata', () => {
  assert(data.metadata, 'Missing metadata');
  assert(data.metadata.generatedAt, 'Missing generatedAt');
  assert(data.metadata.totalCount, 'Missing totalCount');
});

test('JSON has entries array', () => {
  assert(Array.isArray(data.entries), 'entries is not an array');
  assertGreaterThan(data.entries.length, 100, 'Too few entries');
});

test('Metadata totalCount matches entries length', () => {
  assertEqual(data.metadata.totalCount, data.entries.length, 'totalCount mismatch');
});

// ─── Duplicate IDs ──────────────────────────────────────────────────

test('No duplicate IDs', () => {
  const ids = new Set();
  const dups = [];
  for (const entry of data.entries) {
    if (ids.has(entry.id)) dups.push(entry.id);
    ids.add(entry.id);
  }
  assertEqual(dups.length, 0, `Duplicate IDs found: ${dups.slice(0, 5).join(', ')}`);
});

// ─── Required Fields ────────────────────────────────────────────────

test('All entries have required fields', () => {
  const missing = [];
  for (const entry of data.entries) {
    if (!entry.id) missing.push('id');
    if (!entry.type) missing.push(`type (${entry.id})`);
    if (!entry.source) missing.push(`source (${entry.id})`);
  }
  assertEqual(missing.length, 0, `Missing fields: ${missing.slice(0, 5).join(', ')}`);
});

test('All entries have content', () => {
  const empty = [];
  for (const entry of data.entries) {
    const hasContent = entry.content || entry.answer || entry.title || entry.question;
    if (!hasContent || (typeof hasContent === 'string' && hasContent.trim().length === 0)) {
      empty.push(entry.id);
    }
  }
  assertEqual(empty.length, 0, `Empty content: ${empty.slice(0, 5).join(', ')}`);
});

// ─── Q&A Extraction ────────────────────────────────────────────────

test('Q&A entries have question and answer', () => {
  const qa = data.entries.filter(e => e.type === 'qa');
  assertGreaterThan(qa.length, 50, 'Too few Q&A entries');
  const bad = qa.filter(q => !q.question || !q.answer);
  assertEqual(bad.length, 0, `Q&A entries missing question/answer: ${bad.slice(0, 3).map(b => b.id).join(', ')}`);
});

test('Q&A entries have category', () => {
  const qa = data.entries.filter(e => e.type === 'qa');
  const noCategory = qa.filter(q => !q.category);
  assertEqual(noCategory.length, 0, `Q&A entries missing category: ${noCategory.slice(0, 3).map(b => b.id).join(', ')}`);
});

// ─── Subject Extraction ────────────────────────────────────────────

test('Subject entries have topics array', () => {
  const subjects = data.entries.filter(e => e.type === 'subject');
  assertGreaterThan(subjects.length, 10, 'Too few subject entries');
  const bad = subjects.filter(s => !Array.isArray(s.topics) || s.topics.length === 0);
  assertEqual(bad.length, 0, `Subjects missing topics: ${bad.map(b => b.subject).join(', ')}`);
});

test('Engineering Mathematics has keyInsight', () => {
  const em = data.entries.find(e => e.type === 'subject' && e.subject === 'Engineering Mathematics');
  assert(em, 'Engineering Mathematics not found');
  assert(em.keyInsight && em.keyInsight.length > 10, `Engineering Mathematics keyInsight empty or too short: "${em.keyInsight}"`);
});

// ─── ROI Topics ────────────────────────────────────────────────────

test('ROI topics have required fields', () => {
  const roi = data.entries.filter(e => e.type === 'roi-topic');
  assertGreaterThan(roi.length, 20, 'Too few ROI topics');
  const bad = roi.filter(r => !r.title || !r.subject || !r.priority);
  assertEqual(bad.length, 0, `ROI topics missing fields: ${bad.slice(0, 3).map(b => b.id).join(', ')}`);
});

// ─── Type Classification ───────────────────────────────────────────

test('insights.txt entries classified into meaningful types', () => {
  const txtTypes = ['subject-insight', 'resource-summary', 'timeline', 'study-method', 'general-insight', 'mistake-prevention', 'testing-insight', 'strategy'];
  const txtEntries = data.entries.filter(e => txtTypes.includes(e.type));
  assertGreaterThan(txtEntries.length, 100, 'Too few insights.txt entries');
});

test('No tracker-insight type remains', () => {
  const trackerInsights = data.entries.filter(e => e.type === 'tracker-insight');
  assertEqual(trackerInsights.length, 0, `tracker-insight type still exists: ${trackerInsights.length} entries`);
});

// ─── Source Attribution ────────────────────────────────────────────

test('All entries have source field', () => {
  const noSource = data.entries.filter(e => !e.source);
  assertEqual(noSource.length, 0, `Entries missing source: ${noSource.slice(0, 5).map(e => e.id).join(', ')}`);
});

test('KB entries sourced from GATE_KNOWLEDGE_BASE.md', () => {
  const kbEntries = data.entries.filter(e => e.source === 'GATE_KNOWLEDGE_BASE.md');
  assertGreaterThan(kbEntries.length, 200, 'Too few KB entries');
});

test('Insights entries sourced from insights.txt', () => {
  const insightEntries = data.entries.filter(e => e.source === 'insights.txt');
  assertGreaterThan(insightEntries.length, 100, 'Too few insights.txt entries');
});

// ─── Search Functionality ──────────────────────────────────────────

test('Entries have searchable tags', () => {
  const noTags = data.entries.filter(e => !e.tags || e.tags.length === 0);
  assertEqual(noTags.length, 0, `Entries missing tags: ${noTags.slice(0, 5).map(e => e.id).join(', ')}`);
});

// ─── Summary ────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
console.log(`Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
