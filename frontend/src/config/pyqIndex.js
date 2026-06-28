// PYQ PDF Subject Index
// PDF file expected at: /pyq/gate-cse-pyq-2000-2026.pdf
// Edit these page ranges to match your actual PDF.
// Later each subject can be divided into topics with their own ranges.

const PYQ_PDF_FILENAME = '/pyq/gate-cse-pyq-2000-2026.pdf';

const SUBJECTS = [
  { id: 'engineering-mathematics',     label: 'Engineering Mathematics',    short: 'Maths',   startPage: 1,   endPage: 90  },
  { id: 'general-aptitude',            label: 'General Aptitude',           short: 'Aptitude',startPage: 91,  endPage: 150 },
  { id: 'digital-logic',               label: 'Digital Logic',              short: 'DL',      startPage: 151, endPage: 200 },
  { id: 'computer-organization',       label: 'Computer Organization',      short: 'CO',      startPage: 201, endPage: 250 },
  { id: 'programming',                 label: 'Programming',                short: 'Prog',    startPage: 251, endPage: 300 },
  { id: 'data-structures',             label: 'Data Structures',            short: 'DS',      startPage: 301, endPage: 350 },
  { id: 'algorithms',                  label: 'Algorithms',                 short: 'ALGO',    startPage: 351, endPage: 400 },
  { id: 'operating-systems',           label: 'Operating Systems',          short: 'OS',      startPage: 401, endPage: 460 },
  { id: 'dbms',                        label: 'DBMS',                       short: 'DBMS',    startPage: 461, endPage: 520 },
  { id: 'computer-networks',           label: 'Computer Networks',          short: 'CN',      startPage: 521, endPage: 580 },
  { id: 'theory-of-computation',       label: 'Theory of Computation',      short: 'TOC',     startPage: 581, endPage: 630 },
  { id: 'compiler-design',             label: 'Compiler Design',            short: 'CD',      startPage: 631, endPage: 670 },
];

// Optional: topic-level breakdown for future use
// Each topic has its own page range within its parent subject
// const TOPICS = {
//   algorithms: [
//     { id: 'sorting',              label: 'Sorting',              startPage: 351, endPage: 365 },
//     { id: 'searching',            label: 'Searching',            startPage: 366, endPage: 372 },
//     { id: 'dynamic-programming',  label: 'Dynamic Programming',   startPage: 373, endPage: 385 },
//     { id: 'greedy',               label: 'Greedy',               startPage: 386, endPage: 392 },
//     { id: 'graphs',               label: 'Graphs',               startPage: 393, endPage: 400 },
//   ],
//   // ... other subjects
// };

const PDF_TOTAL_PAGES = 670; // Update to match your PDF
const PDF_YEARS = '2000–2026';

export { PYQ_PDF_FILENAME, SUBJECTS, PDF_TOTAL_PAGES, PDF_YEARS };
