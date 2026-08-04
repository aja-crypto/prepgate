// Infer a GATE subject from a learning-hub video using title/tags keywords.
// Videos in the data set do not carry a `subject` field, so collections like
// "High Weightage Topics" and "Weak Topics For You" need a reliable inference.

const SUBJECT_KEYWORDS = {
  'Operating Systems': [
    'operating system', ' deadlock', 'process scheduling', 'process synchronization',
    'semaphore', 'banker', 'memory management', 'paging', 'segmentation', 'os one shot',
    'os ', 'scheduling', 'context switch', 'deadlocks',
  ],
  'Computer Networks': [
    'computer network', ' networking', 'tcp', 'udp', 'ip address', 'osi model',
    'routing', 'gateway', 'network layer', 'transport layer', 'cn ',
  ],
  'DBMS': [
    'dbms', 'database', 'sql', 'transaction', 'normalization', 'er model', 'joins',
    'acid', 'bcnf', 'indexing',
  ],
  'Computer Organization': [
    'computer organization', 'coa', 'pipeline', 'cache', 'instruction set', 'memory hierarchy',
    'addressing modes', 'alu', 'control unit',
  ],
  'Theory of Computation': [
    'theory of computation', 'automata', 'regular expression', 'context free', 'turing',
    'pushdown', 'toc', 'finite automata', 'grammar',
  ],
  'Compiler Design': [
    'compiler', 'lexical analysis', 'parsing', 'syntax analysis', 'intermediate code',
    'code generation', 'symbol table', 'cd ',
  ],
  'Algorithms': [
    'algorithm', 'sorting', 'searching', 'graph', 'dynamic programming', 'greedy',
    'divide and conquer', 'a*', 'dijkstra', 'complexity', 'recursion', 'np',
  ],
  'Programming & Data Structures': [
    'programming', 'data structure', 'array', 'linked list', 'stack', 'queue', 'tree',
    'c programming', 'java', 'python', 'pointers', 'cpp',
  ],
  'Engineering Mathematics': [
    'mathematics', ' maths', 'linear algebra', 'probability', 'calculus', 'discrete',
    'combinatorics', 'graph theory', 'matrices', 'eigen', 'gate maths',
  ],
  'Digital Logic': [
    'digital logic', 'logic gates', 'boolean', 'flip flop', 'sequential circuit',
    'k-map', 'combinational circuit', 'number system', 'dl ',
  ],
  'General Aptitude': [
    'aptitude', 'quantitative', 'logical reasoning', 'verbal ability', 'percentage',
    'permutation', 'puzzle',
  ],
};

const SUBJECT_TAGS = {
  'Operating Systems': ['os'],
  'Computer Networks': ['cn', 'computer networks'],
  'DBMS': ['dbms'],
  'Computer Organization': ['coa'],
  'Theory of Computation': ['toc'],
  'Compiler Design': ['compiler', 'compiler design'],
  'Algorithms': ['algorithms'],
  'Programming & Data Structures': ['ds', 'cse', 'programming'],
  'Engineering Mathematics': ['maths', 'engineering mathematics'],
  'Digital Logic': ['digital logic'],
  'General Aptitude': ['aptitude'],
};

/** Rank a list of GATE subject names by how strongly a video's text matches them. */
export function inferVideoSubjects(video) {
  const text = [
    video?.title || '',
    ...(video?.tags || []),
  ].join(' ').toLowerCase();

  const scores = Object.entries(SUBJECT_KEYWORDS).map(([subject, kws]) => {
    let score = 0;
    for (const kw of kws) {
      if (text.includes(kw)) score += kw.length >= 6 ? 2 : 1;
    }
    return { subject, score };
  });

  const viaTags = Object.entries(SUBJECT_TAGS).filter(([, tags]) =>
    (video?.tags || []).some((t) => tags.includes(t.toLowerCase()))
  ).map(([subject]) => subject);

  viaTags.forEach((s) => {
    const hit = scores.find((x) => x.subject === s);
    if (hit) hit.score += 3;
  });

  return scores.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
}

/** Return the single best-guess subject for a video, or null. */
export function inferVideoSubject(video) {
  const top = inferVideoSubjects(video)[0];
  return top && top.score >= 2 ? top.subject : null;
}
