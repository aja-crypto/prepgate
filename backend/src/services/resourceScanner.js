// src/services/resourceScanner.js — Scans /resources folder and indexes PDFs

const fs = require('fs');
const path = require('path');
const { EMBEDDED_RESOURCES } = require('./embeddedResources');

const RESOURCES_DIR = path.join(__dirname, '../..', 'resources');
const INDEX_CACHE_PATH = path.join(__dirname, '../..', 'data', 'resource-index.json');

let resourceIndex = [];

const SUBJECT_ALIASES = {
  'os': 'Operating Systems',
  'operating system': 'Operating Systems',
  'operating systems': 'Operating Systems',
  'cn': 'Computer Networks',
  'computer network': 'Computer Networks',
  'computer networks': 'Computer Networks',
  'networks': 'Computer Networks',
  'dbms': 'DBMS',
  'database': 'DBMS',
  'database management systems': 'DBMS',
  'toc': 'Theory of Computation',
  'theory of computation': 'Theory of Computation',
  'co': 'Computer Organization',
  'computer organization': 'Computer Organization',
  'coa': 'Computer Organization',
  'computer organization and architecture': 'Computer Organization',
  'dl': 'Digital Logic',
  'digital logic': 'Digital Logic',
  'digital design': 'Digital Logic',
  'ds': 'Programming & Data Structures',
  'data structures': 'Programming & Data Structures',
  'data structure': 'Programming & Data Structures',
  'programming': 'Programming & Data Structures',
  'c programming': 'Programming & Data Structures',
  'programming and data structures': 'Programming & Data Structures',
  'programming & data structures': 'Programming & Data Structures',
  'algo': 'Algorithms',
  'algorithm': 'Algorithms',
  'algorithms': 'Algorithms',
  'cd': 'Compiler Design',
  'compiler': 'Compiler Design',
  'compiler design': 'Compiler Design',
  'compilers': 'Compiler Design',
  'math': 'Engineering Mathematics',
  'maths': 'Engineering Mathematics',
  'engineering mathematics': 'Engineering Mathematics',
  'mathematics': 'Engineering Mathematics',
  'aptitude': 'General Aptitude',
  'general aptitude': 'General Aptitude',
  'apt': 'General Aptitude',
};

const FOLDER_TO_SUBJECT = {
  'c by pankaj sir': 'Programming & Data Structures',
  'coa by vd sir': 'Computer Organization',
  'dm satish yadav': 'Discrete Mathematics',
  'os by vd sir': 'Operating Systems',
  'discrete mathematics': 'Discrete Mathematics',
  'dm': 'Discrete Mathematics',
  'c': 'Programming & Data Structures',
  'computer organization': 'Computer Organization',
  'coa': 'Computer Organization',
  'algorithms': 'Algorithms',
  'algo': 'Algorithms',
  'compiler design': 'Compiler Design',
  'cd': 'Compiler Design',
  'compiler': 'Compiler Design',
  'digital logic': 'Digital Logic',
  'dl': 'Digital Logic',
  'engineering mathematics': 'Engineering Mathematics',
  'mathematics': 'Engineering Mathematics',
  'math': 'Engineering Mathematics',
  'general aptitude': 'General Aptitude',
  'aptitude': 'General Aptitude',
  'apt': 'General Aptitude',
  'dbms': 'DBMS',
  'database': 'DBMS',
  'toc': 'Theory of Computation',
  'theory of computation': 'Theory of Computation',
  'computer networks': 'Computer Networks',
  'cn': 'Computer Networks',
  'networks': 'Computer Networks',
  'operating systems': 'Operating Systems',
  'os': 'Operating Systems',
  'data structures': 'Programming & Data Structures',
  'ds': 'Programming & Data Structures',
  'programming': 'Programming & Data Structures',
  'programming & data structures': 'Programming & Data Structures',
};

function normalizeSubject(name) {
  const lower = name.toLowerCase().trim();
  if (FOLDER_TO_SUBJECT[lower]) return FOLDER_TO_SUBJECT[lower];
  if (SUBJECT_ALIASES[lower]) return SUBJECT_ALIASES[lower];
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const TOPIC_KEYWORDS = {
  'deadlock': { subject: 'Operating Systems', topic: 'Deadlock' },
  'cpu scheduling': { subject: 'Operating Systems', topic: 'CPU Scheduling' },
  'process': { subject: 'Operating Systems', topic: 'Process Management' },
  'memory': { subject: 'Operating Systems', topic: 'Memory Management' },
  'paging': { subject: 'Operating Systems', topic: 'Memory Management' },
  'file system': { subject: 'Operating Systems', topic: 'File Systems' },
  'bst': { subject: 'Programming & Data Structures', topic: 'Trees' },
  'avl': { subject: 'Programming & Data Structures', topic: 'Trees' },
  'binary tree': { subject: 'Programming & Data Structures', topic: 'Trees' },
  'binary search tree': { subject: 'Programming & Data Structures', topic: 'Trees' },
  'tree': { subject: 'Programming & Data Structures', topic: 'Trees' },
  'heap': { subject: 'Programming & Data Structures', topic: 'Heap' },
  'hashing': { subject: 'Programming & Data Structures', topic: 'Hashing' },
  'linked list': { subject: 'Programming & Data Structures', topic: 'Linked List' },
  'stack': { subject: 'Programming & Data Structures', topic: 'Stack & Queue' },
  'queue': { subject: 'Programming & Data Structures', topic: 'Stack & Queue' },
  'sorting': { subject: 'Programming & Data Structures', topic: 'Sorting' },
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
    try { fs.mkdirSync(RESOURCES_DIR, { recursive: true }); } catch (_) {}
    console.log('[ResourceScanner] Created resources directory at', RESOURCES_DIR);
  }

  resourceIndex = scanDirectory(RESOURCES_DIR);
  
  // Always merge embedded data: fill in subjects missing from filesystem
  if (Array.isArray(EMBEDDED_RESOURCES) && EMBEDDED_RESOURCES.length > 0) {
    const fsKeys = new Set(resourceIndex.map(r => (r.subject + '||' + r.filePath).toLowerCase()));
    const fsSubjects = new Set(resourceIndex.map(r => r.subject));
    const merged = [...resourceIndex];
    let addedCount = 0;
    for (const emb of EMBEDDED_RESOURCES) {
      const key = (emb.subject + '||' + emb.filePath).toLowerCase();
      if (!fsKeys.has(key)) {
        // Skip duplicate subjects' files when filesystem already has the subject (avoid duplication of content)
        if (fsSubjects.has(emb.subject)) continue;
        merged.push(emb);
        addedCount++;
      }
    }
    if (addedCount > 0) {
      console.log(`[ResourceScanner] Merged ${addedCount} embedded resources (${resourceIndex.length} from disk)`);
      resourceIndex = merged;
    }
  }
  
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