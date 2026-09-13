#!/usr/bin/env node
/**
 * validateKnowledgeBase.mjs
 * Validates generated gateKnowledge.json for completeness and quality.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const KB_PATH = join(__dirname, '..', 'frontend', 'src', 'data', 'generated', 'gateKnowledge.json');

function main() {
  const data = JSON.parse(readFileSync(KB_PATH, 'utf8'));
  const { metadata, entries } = data;

  let errors = 0;
  let warnings = 0;

  console.log('=== GateNexa Knowledge Base Validation ===\n');

  // 1. Metadata check
  console.log('1. METADATA CHECK');
  if (!metadata.generatedAt) { console.error('   FAIL: missing generatedAt'); errors++; }
  if (!metadata.totalCount) { console.error('   FAIL: missing totalCount'); errors++; }
  if (entries.length !== metadata.totalCount) { console.error(`   FAIL: totalCount mismatch (${metadata.totalCount} vs ${entries.length})`); errors++; }
  console.log(`   Total entries: ${entries.length}`);
  console.log(`   Sources: ${metadata.sources.length}`);
  console.log(`   Types: ${Object.keys(metadata.byType).length}`);

  // 2. Required fields check
  console.log('\n2. REQUIRED FIELDS');
  for (const entry of entries) {
    if (!entry.id) { console.error(`   FAIL: entry missing id`); errors++; continue; }
    if (!entry.type) { console.error(`   ${entry.id}: missing type`); errors++; }
    if (!entry.source) { console.error(`   ${entry.id}: missing source`); errors++; }
    if (!entry.tags || entry.tags.length === 0) { console.error(`   ${entry.id}: empty tags`); warnings++; }
    if (!entry.title && !entry.question && !entry.content) { console.error(`   ${entry.id}: missing title/question/content`); warnings++; }
  }

  // 3. Source coverage check
  console.log('\n3. SOURCE COVERAGE');
  const expectedMinCounts = {
    insight: 100,
    qa: 90,
    'roi-topic': 20,
    mistake: 10,
    subject: 10,
    roadmap: 5,
    revision: 4,
    testing: 5,
    'knowledge-graph': 10,
    tracker: 4,
    'subject-insight': 20,
    'general-insight': 50,
    timeline: 5,
    'study-method': 5,
    'testing-insight': 5,
    strategy: 2,
  };
  for (const [type, min] of Object.entries(expectedMinCounts)) {
    const count = metadata.byType[type] || 0;
    const status = count >= min ? 'OK' : 'LOW';
    console.log(`   ${status}: ${type} = ${count} (min: ${min})`);
    if (count < min) warnings++;
  }

  // 4. Duplicate check
  console.log('\n4. DUPLICATE CHECK');
  const ids = new Set();
  const dups = [];
  for (const entry of entries) {
    if (ids.has(entry.id)) dups.push(entry.id);
    ids.add(entry.id);
  }
  if (dups.length > 0) {
    console.error(`   FAIL: ${dups.length} duplicate IDs: ${dups.slice(0, 5).join(', ')}`);
    errors++;
  } else {
    console.log('   OK: no duplicate IDs');
  }

  // 5. Empty content check
  console.log('\n5. EMPTY CONTENT CHECK');
  let emptyCount = 0;
  for (const entry of entries) {
    const hasContent = entry.content || entry.answer || entry.title || entry.question;
    if (!hasContent || (typeof hasContent === 'string' && hasContent.trim().length === 0)) {
      emptyCount++;
    }
  }
  if (emptyCount > 0) {
    console.error(`   FAIL: ${emptyCount} entries with empty content`);
    errors++;
  } else {
    console.log('   OK: all entries have content');
  }

  // 6. Tag diversity
  console.log('\n6. TAG DIVERSITY');
  const allTags = new Set();
  for (const entry of entries) {
    for (const tag of entry.tags) allTags.add(tag);
  }
  console.log(`   Unique tags: ${allTags.size}`);

  // Summary
  console.log(`\n=== SUMMARY ===`);
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);
  console.log(`Verdict: ${errors === 0 ? 'PASS' : 'FAIL'}`);

  process.exit(errors > 0 ? 1 : 0);
}

main();
