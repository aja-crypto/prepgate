// Question parser — converts OCR page text into structured question objects
// Detects: question number, question text, options (A/B/C/D), answer key, marks, subject, topic

// ─── Regex patterns ─────────────────────────────────────────
const QUESTION_START = /^(?:\d+[\.\)])\s*/m;
const OPTION_LINE = /^\(?([A-D])\)?[\.\)]\s*(.+)/m;
const MARKS_LINE = /\[(\d+)\s*Mark[s]?\]|(\d+)\s*[Mm]ark[s]?/;
const YEAR_LINE = /GATE\s*(20\d{2})/i;
const ANSWER_KEY_HEADER = /Answer\s*Key|Answer|ANSWER/i;
const ANSWER_LINE = /^(\d+)\s*[\.:\)]\s*(.+)$/m;

// ─── Subject/Topic keyword mapping (built from GATE syllabus) ─
const GATE_SYLLABUS = {
  APT: {
    name: 'General Aptitude', code: 'APT',
    topics: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation', 'Speed & Distance', 'Work & Time', 'Permutations & Combinations'],
    keywords: ['ratio', 'proportion', 'time speed', 'distance', 'work', 'permutation', 'combination', 'probability', 'average', 'percentage', 'profit loss', 'simple interest', 'compound interest', 'clock', 'calendar', 'data interpretation', 'table chart', 'bar graph', 'pie chart', 'logical reasoning', 'verbal ability', 'passage', 'reading comprehension'],
  },
  EM: {
    name: 'Engineering Mathematics', code: 'EM',
    topics: ['Linear Algebra', 'Matrices', 'Eigen Values', 'Probability', 'Statistics', 'Calculus', 'Differential Equations'],
    keywords: ['matrix', 'determinant', 'eigen value', 'eigen vector', 'linear algebra', 'linear equation', 'rank', 'nullity', 'bayes', 'probability distribution', 'random variable', 'variance', 'standard deviation', 'mean', 'median', 'correlation', 'regression', 'calculus', 'limit', 'continuity', 'differentiation', 'integration', 'differential equation', 'laplace', 'fourier', 'gradient', 'curl', 'divergence'],
  },
  DS: {
    name: 'Data Structures & Programming', code: 'DS',
    topics: ['Arrays', 'Linked List', 'Stack', 'Queue', 'Tree', 'BST', 'AVL', 'Heap', 'Graph', 'Hashing'],
    keywords: ['array', 'linked list', 'stack', 'queue', 'tree', 'binary tree', 'binary search tree', 'bst', 'avl', 'heap', 'graph', 'hashing', 'hash table', 'collision', 'recursion', 'pointer', 'memory allocation', 'data structure', 'traversal', 'inorder', 'preorder', 'postorder', 'bfs', 'dfs'],
  },
  CN: {
    name: 'Computer Networks', code: 'CN',
    topics: ['OSI Model', 'TCP/IP', 'Routing', 'Flow Control', 'Congestion Control', 'IP Addressing'],
    keywords: ['osi', 'tcp/ip', 'routing', 'flow control', 'congestion control', 'ip address', 'subnet', 'subnetting', 'crc', 'hamming', 'error detection', 'error correction', 'mac', 'ethernet', 'token ring', 'network layer', 'transport layer', 'application layer', 'http', 'ftp', 'smtp', 'dns', 'dhcp', 'sliding window', 'stop and wait', 'go back n', 'selective repeat', 'csma', 'aloha', 'throughput', 'bandwidth', 'latency', 'propagation delay', 'transmission delay'],
  },
  OS: {
    name: 'Operating Systems', code: 'OS',
    topics: ['Process', 'Thread', 'Scheduling', 'Deadlock', 'Memory Management', 'Paging', 'Segmentation', 'Virtual Memory'],
    keywords: ['process', 'thread', 'scheduling', 'fcfs', 'sjf', 'round robin', 'priority scheduling', 'deadlock', 'banker', 'semaphore', 'mutex', 'monitor', 'producer consumer', 'reader writer', 'dining philosopher', 'paging', 'segmentation', 'virtual memory', 'page fault', 'page replacement', 'fifo', 'lru', 'optimal', 'memory management', 'fragmentation', 'compaction', 'disk scheduling', 'file system', 'inode'],
  },
  DB: {
    name: 'DBMS', code: 'DB',
    topics: ['ER Model', 'Relational Algebra', 'SQL', 'Normalization', 'Transactions', 'Concurrency', 'Recovery'],
    keywords: ['er model', 'entity', 'relationship', 'relational algebra', 'sql', 'select', 'join', 'normalization', 'normal form', '1nf', '2nf', '3nf', 'bcnf', 'functional dependency', 'closure', 'candidate key', 'primary key', 'foreign key', 'transaction', 'acid', 'concurrency', 'lock', 'serializability', 'conflict serializable', 'view serializable', 'recovery', 'log', 'checkpoint', 'timestamp', 'deadlock', 'indexing', 'b+ tree', 'hashing'],
  },
  CO: {
    name: 'Computer Organization', code: 'CO',
    topics: ['Pipeline', 'Cache', 'Memory Hierarchy', 'Addressing Modes', 'Instruction Formats'],
    keywords: ['pipeline', 'hazard', 'cache', 'memory hierarchy', 'addressing mode', 'instruction format', 'alu', 'control unit', 'microprogramming', 'hardwired', 'register', 'bus', 'dma', 'interrupt', 'io', 'input output', 'memory mapped', 'cpi', 'speedup', 'amda', 'flynn', 'risc', 'cisc', 'pipeline stall', 'data hazard', 'control hazard', 'branch prediction'],
  },
  TOC: {
    name: 'Theory of Computation', code: 'TOC',
    topics: ['DFA', 'NFA', 'Regex', 'CFG', 'PDA', 'Turing Machine', 'Decidability'],
    keywords: ['dfa', 'nfa', 'regular expression', 'regex', 'finite automata', 'pumping lemma', 'context free grammar', 'cfg', 'pda', 'pushdown', 'turing machine', 'tm', 'decidability', 'undecidable', 'halting problem', 'chomsky hierarchy', 'regular language', 'context free language', 'closure property', 'myhill nerode', 'grammar', 'derivation', 'parse tree', 'ambiguity'],
  },
  AL: {
    name: 'Algorithms', code: 'AL',
    topics: ['Greedy', 'Dynamic Programming', 'Divide & Conquer', 'Graph Algorithms', 'MST', 'Shortest Path'],
    keywords: ['greedy', 'dynamic programming', 'dp', 'divide and conquer', 'graph algorithm', 'mst', 'minimum spanning tree', 'shortest path', 'dijkstra', 'bellman ford', 'floyd warshall', 'kruskal', 'prim', 'topological sort', 'strongly connected', 'backtracking', 'branch and bound', 'time complexity', 'space complexity', 'big o', 'omega', 'theta', 'master theorem', 'recurrence', 'sorting', 'searching', 'binary search', 'merge sort', 'quick sort', 'heap sort'],
  },
  CD: {
    name: 'Compiler Design', code: 'CD',
    topics: ['Lexical Analysis', 'Parsing', 'LR Parser', 'SLR', 'LALR', 'Syntax Directed Translation'],
    keywords: ['lexical analysis', 'token', 'lexeme', 'parsing', 'parser', 'lr', 'slr', 'lalr', 'clr', 'syntax directed', 'sdt', 'semantic analysis', 'intermediate code', 'code generation', 'code optimization', 'symbol table', 'type checking', 'first', 'follow', 'parse table', 'shift reduce', 'reduce reduce', 'operator precedence', 'three address code', 'dag', 'basic block'],
  },
  DL: {
    name: 'Digital Logic', code: 'DL',
    topics: ['Boolean Algebra', 'K-Maps', 'Flip Flops', 'Counters', 'FSM'],
    keywords: ['boolean algebra', 'k map', 'karnaugh', 'flip flop', 'sr', 'jk', 'd flip flop', 't flip flop', 'counter', 'finite state machine', 'fsm', 'mealy', 'moore', 'multiplexer', 'demultiplexer', 'encoder', 'decoder', 'adder', 'subtractor', 'half adder', 'full adder', 'sequential circuit', 'combinational circuit', 'state diagram', 'state table', 'race condition', 'hazard'],
  },
};

function buildSubjectKeywordMap() {
  const subjectMap = {};
  for (const [code, sub] of Object.entries(GATE_SYLLABUS)) {
    const allKeywords = [
      ...(sub.keywords || []),
      ...sub.topics.map(t => t.toLowerCase()),
      sub.name.toLowerCase(),
    ];
    for (const kw of allKeywords) {
      if (!subjectMap[kw]) subjectMap[kw] = [];
      if (!subjectMap[kw].find(s => s.code === code)) {
        subjectMap[kw].push({ code, name: sub.name, topic: null });
      }
    }
    // Map topic-level keywords
    for (const topic of sub.topics) {
      const tlw = topic.toLowerCase();
      if (!subjectMap[tlw]) subjectMap[tlw] = [];
      if (!subjectMap[tlw].find(s => s.code === code)) {
        subjectMap[tlw].push({ code, name: sub.name, topic });
      }
    }
  }
  return subjectMap;
}

const SUBJECT_KEYWORDS = buildSubjectKeywordMap();

// ─── Auto-detect subject and topic from question text ───────
function detectSubjectTopic(questionText) {
  const lower = questionText.toLowerCase();
  const matches = [];

  for (const [keyword, subjects] of Object.entries(SUBJECT_KEYWORDS)) {
    if (lower.includes(keyword)) {
      for (const s of subjects) {
        const existing = matches.find(m => m.code === s.code);
        if (existing) {
          existing.score++;
          if (s.topic && !existing.topics.includes(s.topic)) {
            existing.topics.push(s.topic);
          }
        } else {
          matches.push({ code: s.code, name: s.name, score: 1, topics: s.topic ? [s.topic] : [] });
        }
      }
    }
  }

  // Score each matched subject by how many distinct keywords matched
  matches.sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return { subject: null, topic: null, confidence: 0 };
  }

  const best = matches[0];
  const totalKeywords = Object.keys(SUBJECT_KEYWORDS).length;
  const confidence = Math.min(100, Math.round((best.score / Math.max(1, best.score + 1)) * 100));

  return {
    subject: best.code,
    subjectName: best.name,
    topic: best.topics.length > 0 ? best.topics[0] : null,
    alternatives: matches.slice(1, 3).map(m => ({ code: m.code, name: m.name, score: m.score })),
    confidence,
  };
}

// ─── Parse a single question block ──────────────────────────
function parseQuestionBlock(block, subjectCode) {
  const lines = block.split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;

  let questionText = '';
  const options = [];
  let marks = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    const marksMatch = trimmed.match(MARKS_LINE);
    if (marksMatch) {
      marks = parseInt(marksMatch[1] || marksMatch[2], 10);
      continue;
    }

    const optMatch = trimmed.match(OPTION_LINE);
    if (optMatch) {
      options.push({ key: optMatch[1], text: optMatch[2].trim() });
      continue;
    }

    // Skip "statement(s) true" etc — part of question
    if (questionText) questionText += '\n';
    questionText += trimmed;
  }

  // Clean up question text
  questionText = questionText
    .replace(QUESTION_START, '')
    .replace(YEAR_LINE, '')
    .trim();

  if (!questionText) return null;

  const questionType = options.length >= 2
    ? (options.length > 1 ? (options.length === 1 ? 'NAT' : 'MCQ') : 'MCQ')
    : 'NAT';

  // MSQ detection: keywords indicating multiple correct
  let isMsq = false;
  const msqKeywords = ['which of the following is/are', 'which of the following are', 'choose the correct options', 'select all'];
  if (msqKeywords.some(k => questionText.toLowerCase().includes(k))) {
    isMsq = true;
  }

  return {
    questionText,
    options,
    marks,
    questionType: isMsq ? 'MSQ' : questionType,
    difficulty: estimateDifficulty(questionText),
  };
}

// ─── Estimate difficulty ────────────────────────────────────
function estimateDifficulty(text) {
  const hard = ['complex', 'advanced', 'tricky', 'hard', 'difficult'];
  const easy = ['basic', 'simple', 'easy', 'fundamental'];
  const lower = text.toLowerCase();
  if (hard.some(w => lower.includes(w))) return 'hard';
  if (easy.some(w => lower.includes(w))) return 'easy';
  return 'medium';
}

// ─── Parse answer key section ───────────────────────────────
function parseAnswerKey(text) {
  const answers = {};
  const lines = text.split('\n');
  let inKey = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (ANSWER_KEY_HEADER.test(trimmed)) {
      inKey = true;
      continue;
    }

    if (inKey) {
      const match = trimmed.match(/^(\d+)\s*[\.:\)]\s*(.+)$/);
      if (match) {
        const qNum = parseInt(match[1], 10);
        let answer = match[2].trim();
        // Handle multiple answers (e.g., "B, C" or "B,C")
        if (answer.includes(',')) {
          answer = answer.split(',').map(a => a.trim()).filter(Boolean);
        }
        answers[qNum] = answer;
      }
    }
  }

  return answers;
}

// ─── Main parser ─────────────────────────────────────────────
function parseQuestions(ocrPages, metadata = {}) {
  const { subjectCode = 'DB', year = new Date().getFullYear() } = metadata;

  // Combine all pages into one text
  const fullText = ocrPages
    .map(p => `--- PAGE ${p.pageNumber} ---\n${p.markdown}`)
    .join('\n\n');

  // Split into sections: question blocks vs answer key
  const sections = fullText.split(/--- PAGE \d+ ---/).filter(Boolean);

  // Extract year from text
  let detectedYear = year;
  const yearMatch = fullText.match(YEAR_LINE);
  if (yearMatch) detectedYear = parseInt(yearMatch[1], 10);

  // Parse answer key if present
  const answerKeySection = sections.find(s => ANSWER_KEY_HEADER.test(s));
  const answerKey = answerKeySection ? parseAnswerKey(answerKeySection) : {};

  // Extract question blocks (everything before answer key)
  const questionSection = answerKeySection
    ? fullText.substring(0, fullText.indexOf(answerKeySection))
    : fullText;

  // Split into individual question blocks
  const questionBlocks = questionSection
    .split(/(?=^\d+[\.\)]\s)/m)
    .filter(b => b.trim().length > 20);

  const questions = [];

  for (const block of questionBlocks) {
    const parsed = parseQuestionBlock(block, subjectCode);
    if (!parsed) continue;

    // Extract question number
    const numMatch = block.trim().match(/^(\d+)/);
    const qNum = numMatch ? parseInt(numMatch[1], 10) : questions.length + 1;

    // Find answer from answer key
    let correctAnswer = null;
    if (answerKey[qNum]) {
      correctAnswer = answerKey[qNum];
    }

    const autoTag = detectSubjectTopic(parsed.questionText);
    const detectedSubject = (autoTag.subject && autoTag.confidence >= 30) ? autoTag.subject : subjectCode;
    const detectedTopic = (autoTag.topic && autoTag.confidence >= 30) ? autoTag.topic : null;

    questions.push({
      title: `${metadata.subjectCode || subjectCode} Q${qNum}`,
      subject: detectedSubject,
      topic: detectedTopic,
      autoTag,
      year: detectedYear,
      difficulty: parsed.difficulty,
      marks: parsed.marks,
      questionType: parsed.questionType,
      questionText: parsed.questionText,
      options: parsed.options,
      correctAnswer: correctAnswer || undefined,
      explanation: '',
      tags: autoTag.alternatives ? autoTag.alternatives.map(a => a.code) : [],
      source: 'GATE Official',
    });
  }

  return questions;
}

module.exports = { parseQuestions };
