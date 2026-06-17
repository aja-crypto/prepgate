// GateForge topic content generator — full learning module per topic
const GATE_SYLLABUS = require('../data/gateSyllabus');
const { getTopicMeta, getDefaultMeta } = require('../data/topicMeta');

const VIDEO_RESOURCES = {
  DS: [
    { title: 'Gate Smashers: Data Structures', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KutE8S8L6P790UvD_YI7v3a', type: 'youtube' },
    { title: 'NPTEL: Data Structures & Algorithms', url: 'https://nptel.ac.in/courses/106106127', type: 'nptel' }
  ],
  AL: [
    { title: 'Gate Smashers: Algorithms', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KiiGZ03_p-N-tH6V6L7G_5A', type: 'youtube' },
    { title: 'Abdul Bari: Algorithms', url: 'https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkfCt686D8fXm7iT68S1S', type: 'youtube' }
  ],
  OS: [
    { title: 'Neso Academy: Operating Systems', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRiVhbXDGLXDk_OQAeuVcp2O', type: 'youtube' },
    { title: 'Gate Smashers: OS', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8Krs7ZhSIT9-J_v8T0S_XzE_', type: 'youtube' }
  ],
  DB: [
    { title: 'Gate Smashers: DBMS', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvV_G2-0QvEclE9A_p6j0-z', type: 'youtube' },
    { title: 'Knowledge Gate: DBMS', url: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesR1rSES7cBQT7EJ-fWv8I-L', type: 'youtube' }
  ],
  CN: [
    { title: 'Gate Smashers: Computer Networks', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvMW674L_5YIuK7f6V7yVf8', type: 'youtube' },
    { title: 'Neso Academy: Computer Networks', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUag00w_P_AdRUEvKzXf', type: 'youtube' }
  ],
  TOC: [
    { title: 'Gate Smashers: Theory of Computation', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KshS9K0vS6O0-fF9H-6q1-O', type: 'youtube' },
    { title: 'Neso Academy: TOC', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgp46KUv4ZY69yXmpwMSIev', type: 'youtube' }
  ],
  CD: [
    { title: 'Gate Smashers: Compiler Design', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KseYAtvP6YfBOfKstf6SNoJ', type: 'youtube' },
    { title: 'Knowledge Gate: Compiler Design', url: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesRH6-W37B3-U9M59b2D_8yO', type: 'youtube' }
  ],
  CO: [
    { title: 'Gate Smashers: COA', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8Kv-U570Q5688j_S8N60Z8-j', type: 'youtube' },
    { title: 'Neso Academy: COA', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgLLlzdgiTUKULruKyQH24z', type: 'youtube' }
  ],
  DL: [
    { title: 'Neso Academy: Digital Electronics', url: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm', type: 'youtube' },
    { title: 'Gate Smashers: Digital Electronics', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvGv_Wz7_83vGZ-H0VnFhX_', type: 'youtube' }
  ],
  EM: [
    { title: 'Gajendra Purohit: Engineering Maths', url: 'https://www.youtube.com/c/GajendraPurohit/playlists', type: 'youtube' },
    { title: 'Knowledge Gate: Engineering Maths', url: 'https://www.youtube.com/playlist?list=PLmXKhU9FNesSpS9N4q3q2w7tq9z3-uW5P', type: 'youtube' }
  ],
  APT: [
    { title: 'Gate Smashers: General Aptitude', url: 'https://www.youtube.com/playlist?list=PLxCzqTqas8KvpYx8_vS2H8p8uT5vVf7Yn', type: 'youtube' },
    { title: 'Unacademy: General Aptitude', url: 'https://www.youtube.com/playlist?list=PLX2_Xf_YvU_zV0T7B9G_y9V7-fX_7Y9vO', type: 'youtube' }
  ],
};

const BOOK_REFS = {
  DS: [{ title: 'Introduction to Algorithms (CLRS)', author: 'Cormen et al.', chapter: 'Data Structures', description: 'The gold standard for algorithms and data structures.' }],
  AL: [{ title: 'Introduction to Algorithms (CLRS)', author: 'Cormen et al.', chapter: 'Algorithm Design', description: 'Comprehensive coverage of greedy, dynamic programming, and graph algorithms.' }],
  OS: [{ title: 'Operating System Concepts', author: 'Silberschatz', chapter: 'Processes & Memory', description: 'Essential for understanding process management and memory allocation.' }],
  DB: [{ title: 'Database System Concepts', author: 'Silberschatz', chapter: 'Relational DB', description: 'Key reference for normalization and transaction management.' }],
  CN: [{ title: 'Computer Networking: A Top-Down Approach', author: 'Kurose & Ross', chapter: 'Internet', description: 'Best for understanding the layered architecture of the internet.' }],
  TOC: [{ title: 'Introduction to Automata Theory', author: 'Hopcroft, Motwani & Ullman', chapter: 'Automata', description: 'Standard text for DFA, CFG, and Turing machines.' }],
  CD: [{ title: 'Compilers: Principles, Techniques and Tools', author: 'Aho (Dragon Book)', chapter: 'Parsing', description: 'The ultimate guide to lexers and parsers.' }],
  CO: [{ title: 'Computer Organization and Design', author: 'Patterson & Hennessy', chapter: 'Architecture', description: 'Modern approach to computer architecture and pipelining.' }],
  DL: [{ title: 'Digital Design', author: 'Morris Mano', chapter: 'Logic Design', description: 'Standard book for boolean logic and sequential circuits.' }],
  EM: [{ title: 'Higher Engineering Mathematics', author: 'B.S. Grewal', chapter: 'GATE Maths', description: 'Comprehensive practice for linear algebra and calculus.' }],
  APT: [{ title: 'Quantitative Aptitude', author: 'R.S. Aggarwal', chapter: 'Aptitude', description: 'Most popular book for numerical and logical reasoning.' }],
};

const PRACTICE_RESOURCES = [
  { title: 'GeeksforGeeks – Topic-wise Practice', url: 'https://practice.geeksforgeeks.org/explore?page=1&sortBy=submissions', type: 'practice' },
  { title: 'NPTEL – Computer Science Courses', url: 'https://nptel.ac.in/', type: 'nptel' },
  { title: 'CP Handbook – Competitive Programming', url: 'https://cses.fi/book/book.pdf', type: 'practice' },
];

const HIGH_YIELD_TOPICS = new Set([
  'Probability', 'Eigen Values', 'AVL', 'Heap', 'Graph', 'Hashing', 'Dynamic Programming',
  'Scheduling', 'Deadlock', 'Paging', 'Normalization', 'TCP/IP', 'IP Addressing',
  'DFA', 'CFG', 'Cache', 'Pipeline', 'Greedy', 'Shortest Path', 'Quantitative Aptitude',
]);

function topicDifficulty(name, subjectCode) {
  const hard = ['Decidability', 'Turing Machine', 'LALR', 'LR Parser', 'AVL', 'Concurrency', 'Recovery', 'NP'];
  const easy = ['Arrays', 'Stack', 'Queue', 'Boolean Algebra', 'SQL', 'OSI Model', 'Process', 'DFA'];
  if (hard.some((h) => name.includes(h))) return 'hard';
  if (easy.some((e) => name.includes(e))) return 'easy';
  if (['APT', 'EM'].includes(subjectCode)) return 'medium';
  return 'medium';
}

function computeTopicWeightage(topicName, subjectMeta, totalTopics) {
  if (HIGH_YIELD_TOPICS.has(topicName)) return Math.min(15, Math.round((subjectMeta.weightage / totalTopics) * 2.5));
  return Math.max(2, Math.round(subjectMeta.weightage / totalTopics));
}

function buildTopicContent(subjectCode, subjectMeta, topicName, order, totalTopics) {
  const meta = getTopicMeta(subjectCode, topicName) || getDefaultMeta(subjectCode, topicName, subjectMeta);
  const difficulty = topicDifficulty(topicName, subjectCode);
  const weightage = computeTopicWeightage(topicName, subjectMeta, totalTopics);
  const priority = subjectMeta.isHighPriority ? 'HIGH' : 'STANDARD';
  const marksRange = subjectMeta.marksRange || `~${subjectMeta.weightage} marks`;

  const subjectFormulas = (subjectMeta.importantFormulas || []).map((f, i) => ({
    name: `${subjectMeta.name} — Key ${i + 1}`,
    expression: f,
    note: 'Subject-level important formula',
  }));

  const allFormulas = [
    ...(meta.formulas || []),
    ...subjectFormulas.filter((sf) => !meta.formulas?.some((mf) => mf.expression === sf.expression)),
  ].slice(0, 6);

  const frequentlyAskedConcepts = [
    ...(meta.faq || []),
    ...(subjectMeta.frequentlyAsked || []).filter((f) => !meta.faq?.includes(f)).slice(0, 2),
  ];

  const expectedQuestions2027 = meta.expected2027 || [
    `GATE 2027 style conceptual question on ${topicName}`,
    `Application/numerical problem — ${topicName}`,
  ];

  const commonMistakes = [
    ...(meta.mistakes || []),
    `Not revising ${topicName} formulas before mock tests`,
    `Skipping PYQ analysis for ${topicName}`,
    `Ignoring ${topicName} connections to other ${subjectMeta.name} topics`,
  ].slice(0, 5);

  return {
    description: `${topicName} — ${subjectMeta.name} (${marksRange}). ${priority} priority for GATE CSE 2027.`,
    theoryNotes: [
      `# ${topicName}`,
      '',
      `**Subject:** ${subjectMeta.name} | **GATE Weightage:** ${marksRange} | **Topic Priority:** ${priority}`,
      `**Difficulty:** ${difficulty} | **Est. topic weightage:** ~${weightage}% within subject`,
      '',
      '## Theory Notes',
      `${topicName} is part of the official GATE CSE 2027 syllabus. Study definitions, standard problems, and trace examples by hand.`,
      '',
      '### Study checklist',
      '1. Read key concepts and definitions',
      '2. Memorize important formulas',
      '3. Review frequently asked GATE concepts',
      '4. Solve related PYQs',
      '5. Attempt topic-wise mock test',
      '6. Mark revision needed for weak areas',
      '',
      `### ${subjectMeta.name} context`,
      subjectMeta.description,
    ].join('\n'),

    keyConcepts: frequentlyAskedConcepts.slice(0, 5).map((c) => `${c}`),
    formulas: allFormulas,
    definitions: [
      { term: topicName, definition: `Core GATE CSE concept under ${subjectMeta.name} — appears in MCQs, numericals, and trace-based questions.` },
      { term: 'GATE 2027 relevance', definition: `${topicName} is ${HIGH_YIELD_TOPICS.has(topicName) ? 'high-yield' : 'standard'} for ${subjectMeta.name} (${marksRange}).` },
    ],
    shortNotes: [
      `📌 ${topicName} | ${subjectMeta.name}`,
      `🎯 GATE marks: ${marksRange} | Priority: ${priority}`,
      `📊 Topic weightage: ~${weightage}% | Difficulty: ${difficulty}`,
      `✅ Revise: formulas → FAQ concepts → PYQs → mock`,
    ].join('\n'),

    revisionNotes: [
      `## Quick Revision — ${topicName}`,
      `1. Top formulas: ${allFormulas.slice(0, 2).map((f) => f.name).join(', ') || 'see Formulas tab'}`,
      `2. FAQ: ${frequentlyAskedConcepts.slice(0, 3).join('; ')}`,
      `3. Expected GATE 2027: ${expectedQuestions2027[0]}`,
      `4. Solve 5 PYQs + 1 topic mock`,
    ].join('\n'),

    commonMistakes,
    frequentlyAskedConcepts,
    expectedQuestions2027,
    faqQuestions: frequentlyAskedConcepts.slice(0, 4).map((concept) => ({
      question: `Why is "${concept}" important for GATE?`,
      answer: `${concept} is frequently tested in ${subjectMeta.name}. Revise theory, practice PYQs, and verify with topic mocks.`,
    })),
    weightage,
    gatePriority: priority,
    marksRange,
    bookReferences: BOOK_REFS[subjectCode] || [{ title: 'GATE CSE Reference', author: 'Standard', chapter: topicName }],
    practiceQuestions: expectedQuestions2027.map((q, i) => ({
      question: q,
      hint: `Review ${topicName} theory notes and related PYQs before attempting.`,
    })),
    resources: [
      ...(VIDEO_RESOURCES[subjectCode] || []),
      ...PRACTICE_RESOURCES,
      { title: `GATE 2027 — ${topicName}`, url: `https://www.google.com/search?q=GATE+CSE+2027+${encodeURIComponent(topicName)}`, type: 'article' },
    ],
  };
}

function buildTopicDocument(subjectCode, subjectMeta, topicName, order) {
  const total = subjectMeta.topics.length;
  const content = buildTopicContent(subjectCode, subjectMeta, topicName, order, total);
  return {
    name: topicName,
    description: content.description,
    difficulty: topicDifficulty(topicName, subjectCode),
    order,
    isDefault: true,
    weightage: content.weightage,
    content,
    resources: content.resources,
  };
}

module.exports = { GATE_SYLLABUS, buildTopicDocument, buildTopicContent, topicDifficulty };
