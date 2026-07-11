// src/services/resourceScanner.js — Scans /resources folder and indexes PDFs

const fs = require('fs');
const path = require('path');

const RESOURCES_DIR = path.join(__dirname, '../..', 'resources');
const INDEX_CACHE_PATH = path.join(__dirname, '../..', 'data', 'resource-index.json');

let resourceIndex = [];

const FOLDER_TO_SUBJECT = {
  'c by pankaj sir': 'Programming & Data Structures',
  'coa by vd sir': 'Computer Organization',
  'dm satish yadav': 'Discrete Mathematics',
  'os by vd sir': 'Operating Systems',
};

function normalizeSubject(name) {
  const lower = name.toLowerCase().trim();
  if (FOLDER_TO_SUBJECT[lower]) return FOLDER_TO_SUBJECT[lower];
  return SUBJECT_ALIASES[lower] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const SUBJECT_ALIASES = {
  'os': 'Operating Systems',
  'operating system': 'Operating Systems',
  'operating systems': 'Operating Systems',
  'cn': 'Computer Networks',
  'computer network': 'Computer Networks',
  'computer networks': 'Computer Networks',
  'dbms': 'DBMS',
  'toc': 'Theory of Computation',
  'theory of computation': 'Theory of Computation',
  'co': 'Computer Organization',
  'computer organization': 'Computer Organization',
  'coa': 'Computer Organization',
  'dl': 'Digital Logic',
  'digital logic': 'Digital Logic',
  'ds': 'Data Structures',
  'data structures': 'Data Structures',
  'programming': 'Programming & Data Structures',
  'algo': 'Algorithms',
  'algorithm': 'Algorithms',
  'math': 'Engineering Mathematics',
  'maths': 'Engineering Mathematics',
  'engineering mathematics': 'Engineering Mathematics',
  'aptitude': 'General Aptitude',
  'general aptitude': 'General Aptitude',
};

const TOPIC_KEYWORDS = {
  'deadlock': { subject: 'Operating Systems', topic: 'Deadlock' },
  'cpu scheduling': { subject: 'Operating Systems', topic: 'CPU Scheduling' },
  'process': { subject: 'Operating Systems', topic: 'Process Management' },
  'memory': { subject: 'Operating Systems', topic: 'Memory Management' },
  'paging': { subject: 'Operating Systems', topic: 'Memory Management' },
  'file system': { subject: 'Operating Systems', topic: 'File Systems' },
  'bst': { subject: 'Data Structures', topic: 'Trees' },
  'avl': { subject: 'Data Structures', topic: 'Trees' },
  'binary tree': { subject: 'Data Structures', topic: 'Trees' },
  'binary search tree': { subject: 'Data Structures', topic: 'Trees' },
  'tree': { subject: 'Data Structures', topic: 'Trees' },
  'heap': { subject: 'Data Structures', topic: 'Heap' },
  'hashing': { subject: 'Data Structures', topic: 'Hashing' },
  'linked list': { subject: 'Data Structures', topic: 'Linked List' },
  'stack': { subject: 'Data Structures', topic: 'Stack & Queue' },
  'queue': { subject: 'Data Structures', topic: 'Stack & Queue' },
  'sorting': { subject: 'Data Structures', topic: 'Sorting' },
  'graph': { subject: 'Algorithms', topic: 'Graphs' },
  'dp': { subject: 'Algorithms', topic: 'Dynamic Programming' },
  'dynamic programming': { subject: 'Algorithms', topic: 'Dynamic Programming' },
  'greedy': { subject: 'Algorithms', topic: 'Greedy Algorithms' },
  'tcp': { subject: 'Computer Networks', topic: 'Transport Layer' },
  'udp': { subject: 'Computer Networks', topic: 'Transport Layer' },
  'ip': { subject: 'Computer Networks', topic: 'Network Layer' },
  'routing': { subject: 'Computer Networks', topic: 'Routing' },
  'normalization': { subject: 'DBMS', topic: 'Normalization' },
  'sql': { subject: 'DBMS', topic: 'SQL' },
  'join': { subject: 'DBMS', topic: 'SQL' },
  'transaction': { subject: 'DBMS', topic: 'Transactions' },
  'er diagram': { subject: 'DBMS', topic: 'ER Diagrams' },
  'turing machine': { subject: 'Theory of Computation', topic: 'Turing Machines' },
  'regular expression': { subject: 'Theory of Computation', topic: 'Regular Expressions' },
  'compiler': { subject: 'Compiler Design', topic: 'Compiler Design' },
  'parsing': { subject: 'Compiler Design', topic: 'Parsing' },
  'pipeline': { subject: 'Computer Organization', topic: 'Pipelining' },
  'boolean': { subject: 'Digital Logic', topic: 'Boolean Algebra' },
  'kmap': { subject: 'Digital Logic', topic: 'K-Map' },
  'probability': { subject: 'Engineering Mathematics', topic: 'Probability' },
  'linear algebra': { subject: 'Engineering Mathematics', topic: 'Linear Algebra' },
  'calculus': { subject: 'Engineering Mathematics', topic: 'Calculus' },
};

function inferTopicFromFilename(filename) {
  const name = path.basename(filename, path.extname(filename)).toLowerCase().replace(/[_-]/g, ' ');
  for (const [key, val] of Object.entries(TOPIC_KEYWORDS)) {
    if (name.includes(key)) return val.topic;
  }
  // Use filename as topic if no keyword match
  return path.basename(filename, path.extname(filename)).replace(/[_-]/g, ' ');
}

function scanDirectory(dirPath, relativePath = '') {
  const entries = [];
  if (!fs.existsSync(dirPath)) return entries;

  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relPath = relativePath ? `${relativePath}/${item}` : item;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      entries.push(...scanDirectory(fullPath, relPath));
    } else if (item.endsWith('.pdf')) {
      const parts = relPath.split(/[\/\\]/);
      const subject = parts.length > 1 ? normalizeSubject(parts[0]) : 'Uncategorized';
      const folder = parts.length > 1 ? parts.slice(1, -1).join(' → ') : '';
      
      entries.push({
        id: relPath.replace(/[\/\\]/g, '_').replace(/\.pdf$/i, ''),
        title: path.basename(item, '.pdf').replace(/[_-]/g, ' '),
        subject,
        folder,
        topic: inferTopicFromFilename(item),
        filePath: relPath.replace(/\\/g, '/'),
        type: 'pdf',
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      });
    }
  }
  return entries;
}

function buildIndex() {
  console.log('[ResourceScanner] Scanning resources directory...');
  const start = Date.now();
  
  if (!fs.existsSync(RESOURCES_DIR)) {
    fs.mkdirSync(RESOURCES_DIR, { recursive: true });
    console.log('[ResourceScanner] Created resources directory at', RESOURCES_DIR);
  }

  resourceIndex = scanDirectory(RESOURCES_DIR);
  
  // Sort by subject then title
  resourceIndex.sort((a, b) => a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title));

  // Cache the index
  try {
    const dataDir = path.dirname(INDEX_CACHE_PATH);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(INDEX_CACHE_PATH, JSON.stringify(resourceIndex, null, 2));
  } catch (e) {
    console.error('[ResourceScanner] Failed to cache index:', e.message);
  }

  console.log(`[ResourceScanner] Indexed ${resourceIndex.length} resources in ${Date.now() - start}ms`);
  return resourceIndex;
}

function getIndex() {
  return resourceIndex;
}

function getSubjects() {
  const subjects = new Set();
  resourceIndex.forEach(r => subjects.add(r.subject));
  return Array.from(subjects).sort();
}

function getBySubject(subject) {
  return resourceIndex.filter(r => r.subject === subject);
}

function searchResources(query) {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];

  // Check for exact topic match first
  for (const [key, val] of Object.entries(TOPIC_KEYWORDS)) {
    if (lower.includes(key)) {
      return resourceIndex.filter(r => r.subject === val.subject && (!val.topic || r.topic === val.topic || r.title.toLowerCase().includes(val.topic.toLowerCase())));
    }
  }

  // Subject alias match
  for (const [alias, subject] of Object.entries(SUBJECT_ALIASES)) {
    if (lower.includes(alias)) {
      return resourceIndex.filter(r => r.subject === subject);
    }
  }

  // Fallback: full-text search in title and topic
  const terms = lower.split(/\s+/).filter(Boolean);
  return resourceIndex.filter(r => {
    const searchStr = `${r.title} ${r.topic} ${r.subject} ${r.folder}`.toLowerCase();
    return terms.some(t => searchStr.includes(t));
  });
}

// Build index on startup
buildIndex();

module.exports = {
  buildIndex,
  getIndex,
  getSubjects,
  getBySubject,
  searchResources,
  RESOURCES_DIR,
};