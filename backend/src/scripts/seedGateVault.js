const mongoose = require('mongoose');

const questions = [
  // Q1-5: Aptitude (APT)
  { question: 'A train travels 120 km in 2 hours. Its average speed is:', options: ['40 km/h', '50 km/h', '60 km/h', '80 km/h'], correctAnswer: 2, explanation: 'Average speed = Total distance / Total time = 120/2 = 60 km/h', subject: 'APT', topic: 'Speed and Distance', importanceScore: 8, difficulty: 'easy' },
  { question: 'If 20% of a number is 50, the number is:', options: ['200', '250', '300', '150'], correctAnswer: 1, explanation: '20% of x = 50 => x = 50 * 100 / 20 = 250', subject: 'APT', topic: 'Percentages', importanceScore: 8, difficulty: 'easy' },
  { question: 'Average of 5, 10, 15, 20, 25 is:', options: ['10', '12', '15', '18'], correctAnswer: 2, explanation: 'Sum = 75, Count = 5, Average = 75/5 = 15', subject: 'APT', topic: 'Averages', importanceScore: 9, difficulty: 'easy' },
  { question: 'Find the next number: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '36'], correctAnswer: 1, explanation: 'Pattern: n*(n+1) => 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30, 6*7=42', subject: 'APT', topic: 'Series and Patterns', importanceScore: 7, difficulty: 'medium' },
  { question: 'A work is completed by 10 people in 20 days. How many days for 20 people?', options: ['5 days', '10 days', '15 days', '40 days'], correctAnswer: 1, explanation: 'Work = 10*20 = 200 man-days. With 20 people: 200/20 = 10 days', subject: 'APT', topic: 'Work and Time', importanceScore: 8, difficulty: 'medium' },

  // Q6-10: Engineering Mathematics (MA)
  { question: 'What is the derivative of x²?', options: ['x', '2x', 'x²', '2x²'], correctAnswer: 1, explanation: 'd/dx(x²) = 2x (power rule: d/dx(x^n) = n*x^(n-1))', subject: 'MA', topic: 'Calculus - Differentiation', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is the integral ∫1 dx?', options: ['1', 'x', 'x + C', '0'], correctAnswer: 2, explanation: '∫1 dx = x + C, where C is the constant of integration', subject: 'MA', topic: 'Calculus - Integration', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is the determinant of [[1,0],[0,1]]?', options: ['0', '1', '2', 'undefined'], correctAnswer: 1, explanation: 'Determinant of 2x2 identity matrix = (1*1) - (0*0) = 1', subject: 'MA', topic: 'Linear Algebra - Determinants', importanceScore: 7, difficulty: 'easy' },
  { question: 'What is the rank of an n×n identity matrix?', options: ['0', '1', 'n-1', 'n'], correctAnswer: 3, explanation: 'Rank of identity matrix In is n (full rank, all columns linearly independent)', subject: 'MA', topic: 'Linear Algebra - Rank', importanceScore: 6, difficulty: 'medium' },
  { question: 'Probability of getting exactly one head in two coin tosses?', options: ['1/4', '1/3', '1/2', '2/3'], correctAnswer: 2, explanation: 'Favorable: HT, TH = 2 outcomes. Total: 4. P = 2/4 = 1/2', subject: 'MA', topic: 'Probability', importanceScore: 8, difficulty: 'medium' },

  // Q11-15: Discrete Mathematics (DS)
  { question: 'Number of subsets of a set with 4 elements?', options: ['4', '8', '16', '32'], correctAnswer: 2, explanation: 'Number of subsets = 2^n = 2^4 = 16 (including empty set)', subject: 'DS', topic: 'Set Theory', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is 5! (5 factorial)?', options: ['20', '60', '120', '240'], correctAnswer: 2, explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120', subject: 'DS', topic: 'Combinatorics', importanceScore: 9, difficulty: 'easy' },
  { question: 'A connected graph with no cycles is called:', options: ['Complete graph', 'Tree', 'Bipartite graph', 'Eulerian graph'], correctAnswer: 1, explanation: 'A connected acyclic graph is called a Tree. A tree with n vertices has exactly n-1 edges.', subject: 'DS', topic: 'Graph Theory', importanceScore: 7, difficulty: 'easy' },
  { question: 'Maximum edges in a complete graph K₄?', options: ['4', '6', '8', '12'], correctAnswer: 1, explanation: 'Max edges in Kn = n(n-1)/2. For K₄: 4*3/2 = 6', subject: 'DS', topic: 'Graph Theory', importanceScore: 8, difficulty: 'medium' },
  { question: 'Binary representation of decimal 10?', options: ['1001', '1010', '1100', '1110'], correctAnswer: 1, explanation: '10 = 8+0+2+0 = 1010 in binary', subject: 'DS', topic: 'Number Systems', importanceScore: 9, difficulty: 'easy' },

  // Q16-20: Digital Logic (DL)
  { question: 'Select lines needed for an 8:1 MUX?', options: ['2', '3', '4', '8'], correctAnswer: 1, explanation: 'For 2^n inputs, n select lines. 8 = 2³, so 3 select lines', subject: 'DL', topic: 'Multiplexers', importanceScore: 8, difficulty: 'easy' },
  { question: 'Outputs of a 3-input decoder?', options: ['3', '6', '8', '16'], correctAnswer: 2, explanation: 'n-input decoder has 2^n outputs. 3 inputs → 8 outputs', subject: 'DL', topic: 'Decoders', importanceScore: 8, difficulty: 'easy' },
  { question: 'Which gate is called Universal Gate?', options: ['NOT', 'AND', 'NAND', 'XOR'], correctAnswer: 2, explanation: 'NAND is universal — any Boolean function can be implemented using only NAND gates', subject: 'DL', topic: 'Logic Gates', importanceScore: 9, difficulty: 'easy' },
  { question: 'Output of 1 XOR 1?', options: ['0', '1', '2', 'undefined'], correctAnswer: 0, explanation: 'XOR outputs 1 when inputs differ. 1 XOR 1 = 0', subject: 'DL', topic: 'Logic Gates', importanceScore: 8, difficulty: 'easy' },
  { question: 'How many bits per hex digit?', options: ['2', '4', '8', '16'], correctAnswer: 1, explanation: 'One hex digit = 4 binary bits (0-F → 0000-1111)', subject: 'DL', topic: 'Number Systems', importanceScore: 9, difficulty: 'easy' },

  // Q21-25: Computer Organization (CO)
  { question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'], correctAnswer: 0, explanation: 'CPU = Central Processing Unit — the brain of the computer', subject: 'CO', topic: 'CPU Architecture', importanceScore: 9, difficulty: 'easy' },
  { question: 'How many stages in a classic RISC pipeline?', options: ['3', '4', '5', '6'], correctAnswer: 2, explanation: 'Classic 5-stage RISC pipeline: IF, ID, EX, MEM, WB', subject: 'CO', topic: 'Pipelining', importanceScore: 8, difficulty: 'medium' },
  { question: 'Which cache mapping has the highest conflict misses?', options: ['Direct mapped', 'Fully associative', 'Set associative', 'Sector mapped'], correctAnswer: 0, explanation: 'Direct mapped cache has highest conflict misses since each block maps to exactly one cache line', subject: 'CO', topic: 'Cache Memory', importanceScore: 7, difficulty: 'medium' },
  { question: 'How many bits is a word typically in MIPS?', options: ['16', '32', '64', '8'], correctAnswer: 1, explanation: 'MIPS architecture uses a 32-bit word size', subject: 'CO', topic: 'MIPS Architecture', importanceScore: 8, difficulty: 'easy' },
  { question: 'What hazard does forwarding resolve?', options: ['Structural', 'Data', 'Control', 'All of these'], correctAnswer: 1, explanation: 'Data forwarding (bypassing) resolves data hazards by forwarding ALU results directly to dependent instructions', subject: 'CO', topic: 'Pipeline Hazards', importanceScore: 8, difficulty: 'medium' },

  // Q26-30: Algorithms (AL)
  { question: 'Time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(2ⁿ)'], correctAnswer: 1, explanation: 'Binary search halves the search space each iteration → O(log n)', subject: 'AL', topic: 'Searching', importanceScore: 9, difficulty: 'easy' },
  { question: 'Which sorting algorithm is O(n log n) worst-case?', options: ['Bubble sort', 'Quick sort', 'Merge sort', 'Insertion sort'], correctAnswer: 2, explanation: 'Merge sort guarantees O(n log n). Quick sort worst-case is O(n²)', subject: 'AL', topic: 'Sorting', importanceScore: 9, difficulty: 'easy' },
  { question: 'What data structure does Dijkstra use?', options: ['Stack', 'Queue', 'Priority Queue', 'Hash Table'], correctAnswer: 2, explanation: 'Dijkstra uses a priority queue (min-heap) to extract the vertex with minimum distance', subject: 'AL', topic: 'Graph Algorithms', importanceScore: 8, difficulty: 'medium' },
  { question: 'Recurrence T(n) = 2T(n/2) + n solves to?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctAnswer: 1, explanation: 'Master Theorem: a=2, b=2, f(n)=n. n^log_b(a) = n^1 = n. Case 2: O(n log n)', subject: 'AL', topic: 'Complexity Analysis', importanceScore: 7, difficulty: 'medium' },
  { question: 'Which algorithm finds MST?', options: ['Dijkstra', 'Bellman-Ford', 'Kruskal', 'Floyd-Warshall'], correctAnswer: 2, explanation: "Kruskal's algorithm finds Minimum Spanning Tree using greedy edge selection with union-find", subject: 'AL', topic: 'MST', importanceScore: 8, difficulty: 'medium' },

  // Q31-35: Operating Systems (OS)
  { question: 'Which scheduling algo minimizes average waiting time?', options: ['FCFS', 'SJF', 'Round Robin', 'Priority'], correctAnswer: 1, explanation: 'SJF (Shortest Job First) minimizes average waiting time theoretically', subject: 'OS', topic: 'CPU Scheduling', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is a deadlock?', options: ['No resources', 'Circular wait', 'Process crash', 'Memory full'], correctAnswer: 1, explanation: 'Deadlock occurs when each process in a set waits for a resource held by another — circular wait', subject: 'OS', topic: 'Deadlocks', importanceScore: 8, difficulty: 'medium' },
  { question: 'Page size in paging is typically:', options: ['4 KB', '4 MB', '4 GB', '4 bytes'], correctAnswer: 0, explanation: 'Typical page size is 4 KB in most operating systems', subject: 'OS', topic: 'Memory Management', importanceScore: 8, difficulty: 'easy' },
  { question: 'Which IPC mechanism uses shared memory?', options: ['Pipes', 'Message queues', 'Signals', 'Shared memory segments'], correctAnswer: 3, explanation: 'Shared memory segments (shmget/shmat) allow processes to share memory directly for fastest IPC', subject: 'OS', topic: 'IPC', importanceScore: 7, difficulty: 'medium' },
  { question: 'Bankers algorithm is used for:', options: ['CPU scheduling', 'Deadlock avoidance', 'Memory allocation', 'File management'], correctAnswer: 1, explanation: "Banker's algorithm is a deadlock avoidance algorithm that checks if granting a request keeps the system in a safe state", subject: 'OS', topic: 'Deadlock Avoidance', importanceScore: 8, difficulty: 'medium' },

  // Q36-40: DBMS
  { question: 'Which normal form removes transitive dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctAnswer: 2, explanation: '3NF removes transitive dependencies — a non-key attribute depending on another non-key attribute', subject: 'DBMS', topic: 'Normalization', importanceScore: 9, difficulty: 'medium' },
  { question: 'SQL keyword for sorting?', options: ['GROUP BY', 'ORDER BY', 'SORT BY', 'ARRANGE'], correctAnswer: 1, explanation: 'ORDER BY sorts query results in ascending (ASC) or descending (DESC) order', subject: 'DBMS', topic: 'SQL', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is ACID?', options: ['A protocol', 'A transaction property', 'A query language', 'A model'], correctAnswer: 1, explanation: 'ACID = Atomicity, Consistency, Isolation, Durability — properties guaranteeing reliable transactions', subject: 'DBMS', topic: 'Transactions', importanceScore: 8, difficulty: 'medium' },
  { question: 'Which join returns matching rows from both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL OUTER JOIN'], correctAnswer: 2, explanation: 'INNER JOIN returns rows where the join condition is satisfied in both tables', subject: 'DBMS', topic: 'Joins', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is a foreign key?', options: ['Primary key of same table', 'Key referencing another table', 'Unique key', 'Composite key'], correctAnswer: 1, explanation: 'A foreign key is a field that references the primary key of another table, establishing referential integrity', subject: 'DBMS', topic: 'Keys', importanceScore: 8, difficulty: 'easy' },

  // Q41-45: Computer Networks (CN)
  { question: 'Which layer does TCP operate at?', options: ['Physical', 'Network', 'Transport', 'Application'], correctAnswer: 2, explanation: 'TCP operates at the Transport layer (Layer 4) of the OSI model', subject: 'CN', topic: 'TCP/IP', importanceScore: 9, difficulty: 'easy' },
  { question: 'What does IP stand for?', options: ['Internet Protocol', 'Internal Program', 'Integrated Processor', 'Interface Protocol'], correctAnswer: 0, explanation: 'IP = Internet Protocol — the primary protocol for routing and addressing in the network layer', subject: 'CN', topic: 'IP', importanceScore: 9, difficulty: 'easy' },
  { question: 'CIDR notation /24 means how many IP addresses?', options: ['128', '256', '512', '1024'], correctAnswer: 1, explanation: '/24 means 32-24 = 8 bits for hosts. 2^8 = 256 addresses (254 usable)', subject: 'CN', topic: 'Subnetting', importanceScore: 8, difficulty: 'medium' },
  { question: 'Which protocol resolves domain names to IPs?', options: ['HTTP', 'DNS', 'DHCP', 'ARP'], correctAnswer: 1, explanation: 'DNS (Domain Name System) translates human-readable domain names into IP addresses', subject: 'CN', topic: 'DNS', importanceScore: 9, difficulty: 'easy' },
  { question: 'Sliding window protocol is used for:', options: ['Error detection', 'Flow control', 'Routing', 'Encryption'], correctAnswer: 1, explanation: 'Sliding window protocol provides flow control by allowing sender to transmit multiple packets before waiting for ACK', subject: 'CN', topic: 'Flow Control', importanceScore: 7, difficulty: 'medium' },

  // Q46-50: Theory of Computation (TOC)
  { question: 'Which automaton recognizes regular languages?', options: ['PDA', 'Turing Machine', 'DFA', 'LBA'], correctAnswer: 2, explanation: 'DFA (Deterministic Finite Automaton) recognizes exactly the class of regular languages', subject: 'TOC', topic: 'Automata Theory', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is the pumping lemma used for?', options: ['Parsing', 'Proving non-regularity', 'Optimization', 'Code generation'], correctAnswer: 1, explanation: 'Pumping lemma is used to prove that a language is NOT regular by contradiction', subject: 'TOC', topic: 'Pumping Lemma', importanceScore: 7, difficulty: 'medium' },
  { question: 'Which language class does a PDA recognize?', options: ['Regular', 'Context-free', 'Context-sensitive', 'Recursively enumerable'], correctAnswer: 1, explanation: 'Pushdown Automata (PDA) recognize exactly the class of context-free languages', subject: 'TOC', topic: 'PDA', importanceScore: 8, difficulty: 'medium' },
  { question: 'What does NP stand for?', options: ['Non-deterministic Polynomial', 'Non-linear Program', 'Network Protocol', 'Numerical Processing'], correctAnswer: 0, explanation: 'NP = Nondeterministic Polynomial time — problems verifiable in polynomial time', subject: 'TOC', topic: 'Complexity Classes', importanceScore: 8, difficulty: 'medium' },
  { question: 'Which language is accepted by a Turing Machine?', options: ['Regular', 'Context-free', 'Recursively enumerable', 'All of these'], correctAnswer: 2, explanation: 'Turing Machines accept exactly the class of recursively enumerable languages (Type-0)', subject: 'TOC', topic: 'Turing Machines', importanceScore: 9, difficulty: 'medium' },

  // Q51-55: Compiler Design (CD)
  { question: 'Which phase produces tokens?', options: ['Syntax analysis', 'Lexical analysis', 'Semantic analysis', 'Code generation'], correctAnswer: 1, explanation: 'Lexical analysis (scanning) breaks source code into tokens — the first phase of compilation', subject: 'CD', topic: 'Lexical Analysis', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is a parse tree?', options: ['Tree of tokens', 'Tree showing derivation', 'Tree of types', 'Tree of registers'], correctAnswer: 1, explanation: 'A parse tree shows how the start symbol derives the input string according to grammar productions', subject: 'CD', topic: 'Parsing', importanceScore: 8, difficulty: 'medium' },
  { question: 'Which parser uses a parsing table?', options: ['Recursive descent', 'LL(1)', 'LR(1)', 'Backtracking'], correctAnswer: 1, explanation: 'LL(1) parsers use a parsing table constructed from FIRST and FOLLOW sets', subject: 'CD', topic: 'Top-down Parsing', importanceScore: 7, difficulty: 'medium' },
  { question: 'What does a YACC generate?', options: ['Lexer', 'Parser', 'Code generator', 'Optimizer'], correctAnswer: 1, explanation: 'YACC (Yet Another Compiler Compiler) generates an LALR(1) parser from a grammar specification', subject: 'CD', topic: 'Parser Generators', importanceScore: 8, difficulty: 'medium' },
  { question: 'Which optimization removes dead code?', options: ['Constant folding', 'Dead code elimination', 'Loop unrolling', 'Inline expansion'], correctAnswer: 1, explanation: 'Dead code elimination removes unreachable or redundant code that does not affect program output', subject: 'CD', topic: 'Code Optimization', importanceScore: 8, difficulty: 'medium' },
];

async function seed() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const mongoUri = envContent.match(/MONGO_URI=(.+)/)?.[1];
  if (!mongoUri) { console.error('MONGO_URI not found in .env'); process.exit(1); }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const GateVault = require('../models/GateVault');
  const { Flashcard, MonthlySet } = GateVault;

  await Flashcard.deleteMany({});
  await MonthlySet.deleteMany({});
  console.log('Cleared existing data');

  const created = await Flashcard.insertMany(questions);
  console.log(`Inserted ${created.length} flashcards (11 subjects, 5 each)`);

  const now = new Date();
  const monthName = now.toLocaleString('en', { month: 'long' });
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  const monthlySet = await MonthlySet.create({
    name: `${monthName} ${year} Top 50`,
    month: `${year}-${month}`,
    year,
    monthName,
    totalQuestions: created.length,
    isPublished: true,
    publishedAt: new Date(),
    flashcardIds: created.map(c => c._id),
    subjectDistribution: {
      'APT': 5, 'MA': 5, 'DS': 5, 'DL': 5, 'CO': 5,
      'AL': 5, 'OS': 5, 'DBMS': 5, 'CN': 5, 'TOC': 5, 'CD': 5,
    }
  });
  console.log(`Created monthly set: ${monthlySet.name}`);
  console.log('Done!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
