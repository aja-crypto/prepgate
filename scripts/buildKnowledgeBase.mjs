#!/usr/bin/env node
/**
 * buildKnowledgeBase.mjs
 * 
 * Build-time extraction pipeline for GateNexa Knowledge Base.
 * Reads source files and generates normalized JSON for frontend consumption.
 * 
 * Usage: node scripts/buildKnowledgeBase.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const KB_PATH = join(ROOT, 'resources', 'GATE_KNOWLEDGE_BASE.md');
const INSIGHTS_PATH = join(ROOT, 'resources', 'insights.txt');
const OUTPUT_DIR = join(ROOT, 'frontend', 'src', 'data', 'generated');
const OUTPUT_PATH = join(OUTPUT_DIR, 'gateKnowledge.json');

// ─── Helpers ───────────────────────────────────────────────────────────

let idCounter = 0;
function nextId(prefix = 'kb') {
  return `${prefix}-${String(++idCounter).padStart(4, '0')}`;
}

function parseMarkdownTable(lines) {
  if (lines.length < 3) return [];
  const header = lines[0].split('|').map(c => c.trim()).filter(Boolean);
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length === 0 || cells.every(c => /^[-:]+$/.test(c))) continue;
    const row = {};
    header.forEach((h, idx) => {
      row[h] = cells[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

function extractTableBlock(lines, startIdx) {
  let i = startIdx;
  // Skip blank lines before table
  while (i < lines.length && lines[i].trim() === '') i++;
  const block = [];
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    block.push(lines[i]);
    i++;
  }
  return { block, endIdx: i };
}

function cleanText(s) {
  return (s || '').replace(/\*\*/g, '').replace(/`/g, '').trim();
}

function parseListItems(text) {
  return text.split('\n')
    .map(l => l.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

// ─── Parse GATE_KNOWLEDGE_BASE.md ─────────────────────────────────────

function parseKnowledgeBase() {
  const content = readFileSync(KB_PATH, 'utf8');
  const lines = content.split('\n');
  const entries = [];

  // ── Section 1: Insights Database ──
  // 1.1 Core Preparation Insights
  let i = lines.findIndex(l => l.includes('## 1.1 Core Preparation Insights'));
  if (i >= 0) {
    const { block, endIdx } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('insight'),
        type: 'insight',
        category: 'Core Preparation',
        title: cleanText(row['Insight'] || ''),
        content: cleanText(row['Why It Matters'] || ''),
        evidence: cleanText(row['Evidence'] || ''),
        actionItem: cleanText(row['Action Item'] || ''),
        tags: (row['Tags'] || '').split(',').map(t => t.trim()).filter(Boolean),
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: '1.1 Core Preparation Insights',
      });
    }
  }

  // 1.2 Resource Insights
  i = lines.findIndex(l => l.includes('## 1.2 Resource Insights'));
  if (i >= 0) {
    const { block } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('insight'),
        type: 'insight',
        category: 'Resource',
        title: cleanText(row['Insight'] || ''),
        content: cleanText(row['Why It Matters'] || ''),
        evidence: cleanText(row['Evidence'] || ''),
        actionItem: cleanText(row['Action Item'] || ''),
        tags: (row['Tags'] || '').split(',').map(t => t.trim()).filter(Boolean),
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: '1.2 Resource Insights',
      });
    }
  }

  // 1.3 High-Weightage Topic Insights
  i = lines.findIndex(l => l.includes('## 1.3 High-Weightage Topic Insights'));
  if (i >= 0) {
    const { block } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('insight'),
        type: 'insight',
        category: 'High-Weightage Topic',
        title: cleanText(row['Insight'] || ''),
        content: cleanText(row['Why It Matters'] || ''),
        evidence: cleanText(row['Evidence'] || ''),
        actionItem: cleanText(row['Action Item'] || ''),
        tags: (row['Tags'] || '').split(',').map(t => t.trim()).filter(Boolean),
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: '1.3 High-Weightage Topic Insights',
      });
    }
  }

  // 1.4 Exam Strategy Insights
  i = lines.findIndex(l => l.includes('## 1.4 Exam Strategy Insights'));
  if (i >= 0) {
    const { block } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('insight'),
        type: 'insight',
        category: 'Exam Strategy',
        title: cleanText(row['Insight'] || ''),
        content: cleanText(row['Why It Matters'] || ''),
        evidence: cleanText(row['Evidence'] || ''),
        actionItem: cleanText(row['Action Item'] || ''),
        tags: (row['Tags'] || '').split(',').map(t => t.trim()).filter(Boolean),
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: '1.4 Exam Strategy Insights',
      });
    }
  }

  // ── Section 2: Q&A Database ──
  const qaSections = [
    { marker: '## 2.1 Drop Year', category: 'Drop Year & Career' },
    { marker: '## 2.2 Timeline', category: 'Timeline & Planning' },
    { marker: '## 2.3 Daily Schedule', category: 'Daily Schedule' },
    { marker: '## 2.4 Resources', category: 'Resources' },
    { marker: '## 2.5 Mock Tests', category: 'Mock Tests & Practice' },
    { marker: '## 2.6 Subject-Specific', category: 'Subject-Specific' },
    { marker: '## 2.7 Exam Strategy', category: 'Exam Strategy' },
    { marker: '## 2.8 Revision', category: 'Revision' },
    { marker: '## 2.9 Error Prevention', category: 'Error Prevention' },
    { marker: '## 2.10 Mindset', category: 'Mindset & Motivation' },
  ];

  for (const sec of qaSections) {
    i = lines.findIndex(l => l.includes(sec.marker));
    if (i < 0) continue;
    const { block } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('qa'),
        type: 'qa',
        category: sec.category,
        question: cleanText(row['Question'] || ''),
        answer: cleanText(row['Answer'] || ''),
        importance: cleanText(row['Importance'] || 'Medium'),
        relatedSubjects: (row['Related Subjects'] || '').split(',').map(s => s.trim()).filter(Boolean),
        tags: [(row['Category'] || '').trim()].filter(Boolean),
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: sec.marker.replace('## ', ''),
      });
    }
  }

  // ── Section 3: Decision Frameworks ──
  const decisionSections = [
    { marker: '## 3.1 Should You Take a Drop Year', title: 'Should You Take a Drop Year?' },
    { marker: '## 3.2 GATE Preparation vs Software Job', title: 'GATE Preparation vs Software Job' },
    { marker: '## 3.3 Resource Selection', title: 'Resource Selection Framework' },
    { marker: '## 3.4 Coaching vs Self-Study', title: 'Coaching vs Self-Study' },
    { marker: '## 3.5 Subject Priority', title: 'Subject Priority Order (When Time is Limited)' },
  ];

  for (const sec of decisionSections) {
    i = lines.findIndex(l => l.includes(sec.marker));
    if (i < 0) continue;
    // Collect content until next ## or ---
    let contentLines = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith('## ') && !lines[j].startsWith('---')) {
      contentLines.push(lines[j]);
      j++;
    }
    const content = contentLines.join('\n').trim();
    // Try to parse as table
    const tableLines = contentLines.filter(l => l.trim().startsWith('|'));
    let structured = null;
    if (tableLines.length > 2) {
      structured = parseMarkdownTable(tableLines);
    }
    entries.push({
      id: nextId('decision'),
      type: 'decision-framework',
      title: sec.title,
      content: content.substring(0, 2000),
      structured: structured || undefined,
      tags: ['decision-framework', 'strategy'],
      source: 'GATE_KNOWLEDGE_BASE.md',
      sourceSection: sec.marker.replace('## ', ''),
    });
  }

  // ── Section 4: Subject-Wise Insights ──
  const subjectSections = [
    { marker: '## 4.1 Engineering Mathematics', subject: 'Engineering Mathematics' },
    { marker: '## 4.2 Discrete Mathematics', subject: 'Discrete Mathematics' },
    { marker: '## 4.3 Digital Logic', subject: 'Digital Logic' },
    { marker: '## 4.4 C Programming', subject: 'C Programming' },
    { marker: '## 4.5 Data Structures', subject: 'Data Structures' },
    { marker: '## 4.6 Algorithms', subject: 'Algorithms' },
    { marker: '## 4.7 Computer Organization', subject: 'COA' },
    { marker: '## 4.8 Theory of Computation', subject: 'TOC' },
    { marker: '## 4.9 Compiler Design', subject: 'Compiler Design' },
    { marker: '## 4.10 Operating Systems', subject: 'Operating Systems' },
    { marker: '## 4.11 DBMS', subject: 'DBMS' },
    { marker: '## 4.12 Computer Networks', subject: 'Computer Networks' },
  ];

  for (const sec of subjectSections) {
    i = lines.findIndex(l => l.includes(sec.marker));
    if (i < 0) continue;
    let contentLines = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith('## ') && !lines[j].startsWith('---')) {
      contentLines.push(lines[j]);
      j++;
    }
    const tableLines = contentLines.filter(l => l.trim().startsWith('|'));
    let topics = [];
    if (tableLines.length > 2) {
      const rows = parseMarkdownTable(tableLines);
      topics = rows.map(r => ({
        topic: cleanText(r['Topic'] || r['Questions Asked'] || ''),
        weightage: cleanText(r['Weightage'] || ''),
        difficulty: cleanText(r['Difficulty'] || ''),
        roi: cleanText(r['ROI'] || ''),
        mustStudy: cleanText(r['Must Study'] || ''),
        frequency: cleanText(r['Frequency'] || ''),
        importance: cleanText(r['Importance'] || ''),
      }));
    }
    // Extract key insight and primary book (handle multiple format variations)
    const keyInsightLine = contentLines.find(l => l.includes('**Key Insight**:') || l.includes('**Key Resources**:'));
    const bookLine = contentLines.find(l => l.includes('**Primary Book') || l.includes('**Primary Books'));
    entries.push({
      id: nextId('subject'),
      type: 'subject',
      subject: sec.subject,
      title: sec.subject,
      topics,
      keyInsight: keyInsightLine ? cleanText(keyInsightLine.replace(/\*\*(?:Key Insight|Key Resources)\*\*:\s*/, '')) : '',
      primaryBook: bookLine ? cleanText(bookLine.replace(/\*\*(?:Primary Books?|Key Resources)\*\*:\s*/, '')) : '',
      tags: [sec.subject.toLowerCase(), 'subject-insight'],
      source: 'GATE_KNOWLEDGE_BASE.md',
      sourceSection: sec.marker.replace('## ', ''),
    });
  }

  // ── Section 5: ROI Database ──
  const roiSections = [
    { marker: '## 5.1 Tier 1', tier: 'Tier 1' },
    { marker: '## 5.2 Tier 2', tier: 'Tier 2' },
    { marker: '## 5.3 Tier 3', tier: 'Tier 3' },
  ];

  for (const sec of roiSections) {
    i = lines.findIndex(l => l.includes(sec.marker));
    if (i < 0) continue;
    const { block } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('roi'),
        type: 'roi-topic',
        title: cleanText(row['Topic'] || ''),
        subject: cleanText(row['Subject'] || ''),
        priority: sec.tier,
        estimatedHours: cleanText(row['Est. Hours'] || row['Notes'] || ''),
        estimatedMarks: cleanText(row['Est. Marks'] || ''),
        marksPerHour: cleanText(row['Marks/Hour'] || ''),
        historicalQuestions: cleanText(row['Historical Questions'] || row['ROI Score'] || ''),
        rank: parseInt(cleanText(row['Rank'] || '0')) || undefined,
        tags: ['roi', sec.tier.toLowerCase().replace(' ', '-'), cleanText(row['Subject'] || '').toLowerCase()],
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: sec.marker.replace('## ', ''),
      });
    }
  }

  // ── Section 6: Mistake Database ──
  i = lines.findIndex(l => l.includes('## 6.1 Mistake Categories'));
  if (i >= 0) {
    const { block } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('mistake'),
        type: 'mistake',
        category: cleanText(row['Category'] || ''),
        title: cleanText(row['Category'] || ''),
        description: cleanText(row['Description'] || ''),
        impact: cleanText(row['Impact'] || ''),
        prevention: cleanText(row['Prevention'] || ''),
        tags: ['mistake', 'error-prevention'],
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: '6.1 Mistake Categories',
      });
    }
  }

  // 6.2 Specific silly mistake patterns
  i = lines.findIndex(l => l.includes('## 6.2 Common Silly Mistakes'));
  if (i >= 0) {
    const { block } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('mistake'),
        type: 'mistake',
        category: 'Silly Mistake Pattern',
        title: cleanText(row['Mistake Pattern'] || ''),
        subject: cleanText(row['Subject Most Common'] || ''),
        prevention: cleanText(row['Prevention Strategy'] || ''),
        tags: ['mistake', 'silly-mistake', cleanText(row['Subject Most Common'] || '').toLowerCase()],
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: '6.2 Common Silly Mistakes',
      });
    }
  }

  // ── Section 7: Revision System ──
  const revisionSections = [
    { marker: '## 7.1 The RNP Method', title: 'The RNP Method (Daily)' },
    { marker: '## 7.2 Weekly Revision', title: 'Weekly Revision Schedule' },
    { marker: '## 7.3 Short Notes', title: 'Short Notes System' },
    { marker: '## 7.4 Revision Timeline', title: 'Revision Timeline' },
    { marker: '## 7.5 Forgetting Combat', title: 'Forgetting Combat Strategy' },
  ];

  for (const sec of revisionSections) {
    i = lines.findIndex(l => l.includes(sec.marker));
    if (i < 0) continue;
    let contentLines = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith('## ') && !lines[j].startsWith('---')) {
      contentLines.push(lines[j]);
      j++;
    }
    const content = contentLines.join('\n').trim();
    const tableLines = contentLines.filter(l => l.trim().startsWith('|'));
    let structured = null;
    if (tableLines.length > 2) {
      structured = parseMarkdownTable(tableLines);
    }
    entries.push({
      id: nextId('revision'),
      type: 'revision',
      title: sec.title,
      content: content.substring(0, 2000),
      structured: structured || undefined,
      tags: ['revision', 'study-method'],
      source: 'GATE_KNOWLEDGE_BASE.md',
      sourceSection: sec.marker.replace('## ', ''),
    });
  }

  // ── Section 8: Mock Test System ──
  const mockSections = [
    { marker: '## 8.1 Three-Tier Testing', title: 'Three-Tier Testing Framework' },
    { marker: '## 8.2 Full-Length Mock Schedule', title: 'Full-Length Mock Schedule' },
    { marker: '## 8.3 Mock Test Analysis', title: 'Mock Test Analysis Protocol' },
    { marker: '## 8.4 Mock Test Sources', title: 'Mock Test Sources Ranked' },
    { marker: '## 8.5 Recommended Mock Attempt', title: 'Mock Attempt Strategy' },
    { marker: '## 8.6 Mock Score Interpretation', title: 'Mock Score Interpretation' },
  ];

  for (const sec of mockSections) {
    i = lines.findIndex(l => l.includes(sec.marker));
    if (i < 0) continue;
    let contentLines = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith('## ') && !lines[j].startsWith('---')) {
      contentLines.push(lines[j]);
      j++;
    }
    const content = contentLines.join('\n').trim();
    const tableLines = contentLines.filter(l => l.trim().startsWith('|'));
    let structured = null;
    if (tableLines.length > 2) {
      structured = parseMarkdownTable(tableLines);
    }
    entries.push({
      id: nextId('testing'),
      type: 'testing',
      title: sec.title,
      content: content.substring(0, 2000),
      structured: structured || undefined,
      tags: ['mock-test', 'testing'],
      source: 'GATE_KNOWLEDGE_BASE.md',
      sourceSection: sec.marker.replace('## ', ''),
    });
  }

  // ── Section 9: Rank Roadmaps ──
  const roadmapSections = [
    { marker: '## 9.1 AIR < 100', title: 'AIR < 100 Roadmap', roadmapType: 'AIR < 100' },
    { marker: '## 9.2 AIR < 500', title: 'AIR < 500 Roadmap', roadmapType: 'AIR < 500' },
    { marker: '## 9.3 55+ Marks', title: '55+ Marks Roadmap (Limited Time)', roadmapType: '55+ Marks' },
    { marker: '## 9.4 75+ Marks', title: '75+ Marks Roadmap (Full Preparation)', roadmapType: '75+ Marks' },
    { marker: '## 9.5 Self-Study', title: 'Self-Study Roadmap (No Coaching)', roadmapType: 'Self-Study' },
    { marker: '## 9.6 Qualification-Only', title: 'Qualification-Only vs Top Rank Strategy', roadmapType: 'Qualification vs Top Rank' },
  ];

  for (const sec of roadmapSections) {
    i = lines.findIndex(l => l.includes(sec.marker));
    if (i < 0) continue;
    let contentLines = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith('## ') && !lines[j].startsWith('---')) {
      contentLines.push(lines[j]);
      j++;
    }
    const content = contentLines.join('\n').trim();
    const tableLines = contentLines.filter(l => l.trim().startsWith('|'));
    let structured = null;
    if (tableLines.length > 2) {
      structured = parseMarkdownTable(tableLines);
    }
    entries.push({
      id: nextId('roadmap'),
      type: 'roadmap',
      title: sec.title,
      roadmapType: sec.roadmapType,
      content: content.substring(0, 2000),
      structured: structured || undefined,
      tags: ['roadmap', sec.roadmapType.toLowerCase().replace(/[<\s]/g, '-')],
      source: 'GATE_KNOWLEDGE_BASE.md',
      sourceSection: sec.marker.replace('## ', ''),
    });
  }

  // ── Section 10: Knowledge Graph ──
  i = lines.findIndex(l => l.includes('## 10.2 Prerequisite Table'));
  if (i >= 0) {
    const { block } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('kgraph'),
        type: 'knowledge-graph',
        subject: cleanText(row['Subject'] || ''),
        requires: cleanText(row['Requires'] || ''),
        neededFor: cleanText(row['Needed For'] || ''),
        dependencyStrength: cleanText(row['Dependency Strength'] || ''),
        title: `${cleanText(row['Subject'] || '')} Prerequisites`,
        content: `${cleanText(row['Subject'] || '')} requires ${cleanText(row['Requires'] || '')} knowledge. Used for: ${cleanText(row['Needed For'] || '')}. Dependency strength: ${cleanText(row['Dependency Strength'] || '')}.`,
        tags: ['knowledge-graph', 'prerequisite', cleanText(row['Subject'] || '').toLowerCase()],
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: '10.2 Prerequisite Table',
      });
    }
  }

  // 10.4 Interconnected Topics Map
  i = lines.findIndex(l => l.includes('## 10.4 Interconnected Topics'));
  if (i >= 0) {
    const { block } = extractTableBlock(lines, i + 1);
    const rows = parseMarkdownTable(block);
    for (const row of rows) {
      entries.push({
        id: nextId('kgraph'),
        type: 'knowledge-graph',
        title: cleanText(row['Topic'] || ''),
        appearsIn: cleanText(row['Appears In'] || ''),
        relevance: cleanText(row['Relevance'] || ''),
        content: `${cleanText(row['Topic'] || '')} appears in ${cleanText(row['Appears In'] || '')}. Relevance: ${cleanText(row['Relevance'] || '')}.`,
        tags: ['knowledge-graph', 'interconnected', cleanText(row['Topic'] || '').toLowerCase()],
        source: 'GATE_KNOWLEDGE_BASE.md',
        sourceSection: '10.4 Interconnected Topics Map',
      });
    }
  }

  // ── Section 11: Tracker Database ──
  const trackerSections = [
    { marker: '## 11.1 Monthly Milestone', title: 'Monthly Milestone Tracker' },
    { marker: '## 11.2 Daily Study', title: 'Daily Study Tracker' },
    { marker: '## 11.3 Subject Completion', title: 'Subject Completion Tracker' },
    { marker: '## 11.4 Mock Test Tracker', title: 'Mock Test Tracker' },
    { marker: '## 11.5 Error Log', title: 'Error Log Summary' },
  ];

  for (const sec of trackerSections) {
    i = lines.findIndex(l => l.includes(sec.marker));
    if (i < 0) continue;
    let contentLines = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith('## ') && !lines[j].startsWith('---')) {
      contentLines.push(lines[j]);
      j++;
    }
    const content = contentLines.join('\n').trim();
    entries.push({
      id: nextId('tracker'),
      type: 'tracker',
      title: sec.title,
      content: content.substring(0, 2000),
      tags: ['tracker', 'planning'],
      source: 'GATE_KNOWLEDGE_BASE.md',
      sourceSection: sec.marker.replace('## ', ''),
    });
  }

  // ── Section 13: Cross-Source Intelligence ──
  const intelSections = [
    { marker: '## 13.1 Cross-Source Pattern', title: 'Cross-Source Pattern Analysis' },
    { marker: '## 13.2 Key Decision', title: 'Key Decision Points' },
    { marker: '## 13.3 Risk Assessment', title: 'Risk Assessment' },
  ];

  for (const sec of intelSections) {
    i = lines.findIndex(l => l.includes(sec.marker));
    if (i < 0) continue;
    let contentLines = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith('## ') && !lines[j].startsWith('---')) {
      contentLines.push(lines[j]);
      j++;
    }
    const content = contentLines.join('\n').trim();
    const tableLines = contentLines.filter(l => l.trim().startsWith('|'));
    let structured = null;
    if (tableLines.length > 2) {
      structured = parseMarkdownTable(tableLines);
    }
    entries.push({
      id: nextId('intel'),
      type: 'cross-source',
      title: sec.title,
      content: content.substring(0, 3000),
      structured: structured || undefined,
      tags: ['cross-source', 'intelligence'],
      source: 'GATE_KNOWLEDGE_BASE.md',
      sourceSection: sec.marker.replace('## ', ''),
    });
  }

  return entries;
}

// ─── Parse insights.txt ──────────────────────────────────────────────

function classifyInsightType(heading, content) {
  const h = heading.toLowerCase();
  const c = content.toLowerCase();
  
  // Timeline/phase content
  if (h.includes('phase') || h.includes('timeline') || h.includes('month') || h.includes('duration')) {
    return 'timeline';
  }
  
  // Video/resource summaries
  if (h.includes('video summary') || h.includes('resource') || h.includes('lecture')) {
    return 'resource-summary';
  }
  
  // Rules and methods
  if (h.includes('rule') || h.includes('method') || h.includes('rnp') || h.includes('short notes')) {
    return 'study-method';
  }
  
  // Strategy content
  if (h.includes('strategy') || h.includes('approach') || h.includes('plan') || h.includes('roadmap')) {
    return 'strategy';
  }
  
  // Subject-specific insights
  if (h.includes('subject') || h.includes('topic') || c.includes('marks') || c.includes('weightage')) {
    return 'subject-insight';
  }
  
  // Mock/test related
  if (h.includes('mock') || h.includes('test') || h.includes('practice') || c.includes('accuracy')) {
    return 'testing-insight';
  }
  
  // Mistake/prevention
  if (h.includes('mistake') || h.includes('error') || h.includes('avoid') || h.includes('prevent')) {
    return 'mistake-prevention';
  }
  
  // General advice/insight
  return 'general-insight';
}

function parseInsightsTxt() {
  const content = readFileSync(INSIGHTS_PATH, 'utf8');
  const entries = [];
  const sections = content.split(/^# GATE 2027 TRACKER ENTRY/m);

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s];
    if (s === 0 && !section.includes('TRACKER ENTRY')) continue;

    // Extract video type / source info
    const videoTypeMatch = section.match(/(?:VIDEO TYPE|RESOURCE CATEGORY)[:\s]*\n([\s\S]*?)(?=\n---|\n#|\n\*\*)/);
    const videoType = videoTypeMatch ? videoTypeMatch[1].replace(/[*\-]/g, '').trim().split('\n')[0] : '';

    // Extract speaker/source
    const speakerMatch = section.match(/\*\*Speaker:\*\*\s*(.*)/);
    const speaker = speakerMatch ? speakerMatch[1].trim() : '';

    // Extract core message / core principle
    const coreMatch = section.match(/(?:CORE MESSAGE|CORE PRINCIPLE)[:\s]*\n([\s\S]*?)(?=\n---|\n#)/);
    const coreMessage = coreMatch ? coreMatch[1].replace(/[*`#]/g, '').trim().substring(0, 500) : '';

    // Extract sections by ## headings
    const subSections = section.split(/^## /m);
    for (const sub of subSections) {
      const lines = sub.split('\n');
      const heading = lines[0]?.trim();
      if (!heading || heading.length < 3) continue;

      // Extract key content
      const contentLines = lines.slice(1).filter(l => l.trim() && !l.startsWith('---'));
      const text = contentLines.join('\n').replace(/[*`]/g, '').trim();
      if (text.length < 20) continue;

      // Extract YAML tags
      const yamlMatch = text.match(/```yaml([\s\S]*?)```/);
      const tags = [];
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];
        const tagMatches = yamlContent.match(/(?:video_type|target_exam|key_message|main_message):\s*(.+)/g);
        if (tagMatches) {
          for (const tm of tagMatches) {
            const val = tm.replace(/[^:]+:\s*/, '').trim();
            tags.push(...val.split(/[,\s]+/).filter(Boolean));
          }
        }
      }

      entries.push({
        id: nextId('insight-source'),
        type: classifyInsightType(heading, text),
        title: heading.substring(0, 200),
        content: text.substring(0, 1500),
        videoType: videoType || undefined,
        speaker: speaker || undefined,
        coreMessage: coreMessage || undefined,
        tags: [...new Set([...tags, classifyInsightType(heading, text), 'insights-txt'])],
        source: 'insights.txt',
        sourceSection: `Entry #${s}`,
      });
    }
  }

  return entries;
}

// ─── Main ─────────────────────────────────────────────────────────────

function main() {
  console.log('Building GateNexa Knowledge Base...\n');

  // Parse both sources
  console.log('Parsing GATE_KNOWLEDGE_BASE.md...');
  const kbEntries = parseKnowledgeBase();
  console.log(`  Extracted ${kbEntries.length} entries from KB`);

  console.log('Parsing insights.txt...');
  const insightEntries = parseInsightsTxt();
  console.log(`  Extracted ${insightEntries.length} entries from insights.txt`);

  // Merge all entries
  const allEntries = [...kbEntries, ...insightEntries];

  // Build metadata
  const metadata = {
    generatedAt: new Date().toISOString(),
    sources: [
      { file: 'GATE_KNOWLEDGE_BASE.md', entries: kbEntries.length },
      { file: 'insights.txt', entries: insightEntries.length },
    ],
    totalCount: allEntries.length,
    byType: {},
    bySource: {},
    byCategory: {},
  };

  for (const entry of allEntries) {
    metadata.byType[entry.type] = (metadata.byType[entry.type] || 0) + 1;
    metadata.bySource[entry.source] = (metadata.bySource[entry.source] || 0) + 1;
    if (entry.category) {
      metadata.byCategory[entry.category] = (metadata.byCategory[entry.category] || 0) + 1;
    }
  }

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Write output
  const output = { metadata, entries: allEntries };
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`\nOutput: ${OUTPUT_PATH}`);
  console.log(`Total entries: ${allEntries.length}`);
  console.log('\nBy type:');
  for (const [type, count] of Object.entries(metadata.byType)) {
    console.log(`  ${type}: ${count}`);
  }
  console.log('\nBy source:');
  for (const [source, count] of Object.entries(metadata.bySource)) {
    console.log(`  ${source}: ${count}`);
  }
  console.log('\nBuild complete.');
}

main();
