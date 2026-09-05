// Per-topic GATE 2027 metadata — FAQs, formulas, expected questions
// Key: `${subjectCode}::${topicName}`

const META = {
  // ── Engineering Mathematics ──
  'EM::Linear Algebra': {
    faq: ['Vector space axioms', 'Rank of matrix', 'Linear independence'],
    expected2027: ['Find rank of given matrix', 'Basis and dimension problems', 'Solve system using Gaussian elimination'],
    formulas: [{ name: 'Rank-Nullity', expression: 'rank(A) + nullity(A) = n', note: 'For m×n matrix' }],
    mistakes: ['Confusing rank with determinant for non-square matrices', 'Sign errors in row reduction'],
  },
  'EM::Matrices': {
    faq: ['Matrix multiplication', 'Inverse conditions', 'Transpose properties'],
    expected2027: ['Matrix multiplication count', 'Inverse existence MCQ', 'Properties of symmetric matrices'],
    formulas: [{ name: 'Inverse', expression: 'A⁻¹ exists iff det(A) ≠ 0', note: 'Square matrix only' }],
  },
  'EM::Eigen Values': {
    faq: ['Characteristic equation', 'Eigenvectors', 'Diagonalization'],
    expected2027: ['Compute eigenvalues of 2×2/3×3 matrix', 'Diagonalization applicability'],
    formulas: [{ name: 'Eigenvalue', expression: 'det(A − λI) = 0', note: 'Solve for λ' }, { name: 'Eigenvector', expression: '(A − λI)v = 0', note: 'Non-trivial v' }],
    mistakes: ['Forgetting complex eigenvalues', 'Not normalizing eigenvectors when required'],
  },
  'EM::Probability': {
    faq: ['Bayes theorem', 'Conditional probability', 'Total probability law'],
    expected2027: ['Bayes theorem numerical', 'Conditional probability word problem', 'Independent events'],
    formulas: [{ name: 'Bayes', expression: 'P(A|B) = P(B|A)P(A) / P(B)', note: 'GATE favourite' }, { name: 'Conditional', expression: 'P(A∩B) = P(A|B)P(B)', note: '' }],
  },
  'EM::Statistics': {
    faq: ['Mean, median, mode', 'Variance', 'Standard deviation'],
    expected2027: ['Mean/variance of distribution', 'CDF/PDF based MCQ'],
    formulas: [{ name: 'Variance', expression: 'Var(X) = E[X²] − E[X]²', note: '' }, { name: 'Mean', expression: 'μ = Σxᵢpᵢ', note: 'Discrete RV' }],
  },
  'EM::Calculus': {
    faq: ['Limits', 'Continuity', 'Differentiation rules', 'Integration'],
    expected2027: ['Limit evaluation', 'Maxima/minima', 'Definite integral'],
    formulas: [{ name: 'L\'Hôpital', expression: 'lim f/g = lim f\'/g\'', note: '0/0 or ∞/∞ form' }],
  },
  'EM::Differential Equations': {
    faq: ['First order ODE', 'Linear DE', 'Homogeneous equations'],
    expected2027: ['Solve first-order linear DE', 'Particular solution MCQ'],
    formulas: [{ name: 'Linear 1st order', expression: 'dy/dx + P(x)y = Q(x)', note: 'Use integrating factor' }],
  },

  // ── Programming & DS ──
  'DS::Arrays': {
    faq: ['Time complexity of operations', 'Two-pointer technique', 'Prefix sum'],
    expected2027: ['Subarray sum problems', 'Array rotation', 'Kadane\'s algorithm application'],
    formulas: [{ name: 'Access', expression: 'O(1)', note: 'Random access' }, { name: 'Search unsorted', expression: 'O(n)', note: '' }],
  },
  'DS::Linked List': {
    faq: ['Insertion/deletion complexity', 'Cycle detection', 'Reverse linked list'],
    expected2027: ['Floyd cycle detection', 'Merge two sorted lists', 'Find middle element'],
    formulas: [{ name: 'Insert at head', expression: 'O(1)', note: '' }, { name: 'Search', expression: 'O(n)', note: '' }],
  },
  'DS::Stack': {
    faq: ['LIFO operations', 'Expression evaluation', 'Monotonic stack'],
    expected2027: ['Valid parentheses', 'Infix to postfix', 'Next greater element'],
    formulas: [{ name: 'Push/Pop', expression: 'O(1)', note: 'Amortized' }],
  },
  'DS::Queue': {
    faq: ['Circular queue', 'Deque', 'BFS uses queue'],
    expected2027: ['Circular queue full/empty conditions', 'Queue using two stacks'],
    formulas: [{ name: 'Enqueue/Dequeue', expression: 'O(1)', note: '' }],
  },
  'DS::Tree': {
    faq: ['Tree traversals', 'Height vs depth', 'Complete vs full binary tree'],
    expected2027: ['Traversal order output', 'Height calculation', 'Count nodes'],
    formulas: [{ name: 'Max nodes height h', expression: '2^(h+1) − 1', note: 'Full binary tree' }],
  },
  'DS::BST': {
    faq: ['BST property', 'Inorder sorted', 'Search complexity'],
    expected2027: ['BST validation', 'Kth smallest in BST', 'LCA in BST'],
    formulas: [{ name: 'BST Search', expression: 'O(h) where h = height', note: 'O(log n) if balanced' }],
  },
  'DS::AVL': {
    faq: ['AVL rotations', 'Balance factor', 'Height balance'],
    expected2027: ['Rotation sequence after insert', 'Balance factor calculation', 'AVL vs BST height'],
    formulas: [{ name: 'Balance Factor', expression: 'BF = height(left) − height(right)', note: 'Must be −1, 0, or 1' }],
    mistakes: ['Wrong rotation type (LL vs LR)', 'Not updating heights after rotation'],
  },
  'DS::Heap': {
    faq: ['Heapify', 'Heap sort', 'Priority queue'],
    expected2027: ['Heap insertion steps', 'Heap sort complexity', 'Kth largest element'],
    formulas: [{ name: 'Heapify', expression: 'O(log n)', note: '' }, { name: 'Build heap', expression: 'O(n)', note: 'Bottom-up' }],
  },
  'DS::Graph': {
    faq: ['DFS vs BFS', 'Adjacency list vs matrix', 'Connected components'],
    expected2027: ['BFS/DFS traversal output', 'Count connected components', 'Topological sort'],
    formulas: [{ name: 'BFS/DFS', expression: 'O(V + E)', note: 'Adjacency list' }],
  },
  'DS::Hashing': {
    faq: ['Collision resolution', 'Load factor', 'Chaining vs open addressing'],
    expected2027: ['Hash function output', 'Linear probing cluster', 'Load factor limit'],
    formulas: [{ name: 'Load factor', expression: 'α = n/m', note: 'n entries, m slots' }, { name: 'Average search', expression: 'O(1 + α)', note: 'Chaining' }],
  },

  // ── Algorithms ──
  'AL::Greedy': {
    faq: ['Activity selection', 'Huffman coding', 'Fractional knapsack'],
    expected2027: ['Greedy choice proof MCQ', 'Minimum platforms', 'Job sequencing'],
    formulas: [{ name: 'Greedy choice', expression: 'Locally optimal → globally optimal', note: 'When greedy works' }],
  },
  'AL::Dynamic Programming': {
    faq: ['Memoization vs tabulation', 'Knapsack', 'LCS', 'Matrix chain multiplication'],
    expected2027: ['0/1 Knapsack table fill', 'LCS length', 'MCM parenthesization'],
    formulas: [{ name: 'LCS', expression: 'dp[i][j] = dp[i-1][j-1]+1 if match else max(...)', note: '' }],
  },
  'AL::Divide & Conquer': {
    faq: ['Merge sort', 'Quick sort', 'Binary search', 'Master theorem'],
    expected2027: ['Recurrence relation solve', 'Merge sort comparisons', 'Karatsuba multiplication'],
    formulas: [{ name: 'Master Theorem', expression: 'T(n) = aT(n/b) + O(n^d)', note: 'Three cases' }],
  },
  'AL::Graph Algorithms': {
    faq: ['Topological sort', 'Strongly connected components', 'Bipartite check'],
    expected2027: ['Topological order', 'Kosaraju/Tarjan MCQ', 'BFS bipartite'],
  },
  'AL::MST': {
    faq: ['Kruskal algorithm', 'Prim algorithm', 'Cut property'],
    expected2027: ['MST edge selection steps', 'Kruskal vs Prim complexity', 'MST weight calculation'],
    formulas: [{ name: 'Kruskal', expression: 'O(E log E)', note: 'Sort edges' }, { name: 'Prim (heap)', expression: 'O((V+E) log V)', note: '' }],
  },
  'AL::Shortest Path': {
    faq: ['Dijkstra', 'Bellman-Ford', 'Floyd-Warshall', 'Negative edges'],
    expected2027: ['Dijkstra step trace', 'Bellman-Ford relaxation', 'All-pairs shortest path'],
    formulas: [{ name: 'Dijkstra', expression: 'O((V+E) log V)', note: 'Non-negative weights' }, { name: 'Floyd-Warshall', expression: 'O(V³)', note: 'All pairs' }],
  },

  // ── Operating Systems ──
  'OS::Process': {
    faq: ['Process vs program', 'PCB', 'Process states', 'Context switch'],
    expected2027: ['Process state transition', 'Context switch overhead', 'Zombie/orphan process'],
    formulas: [{ name: 'Turnaround Time', expression: 'Completion − Arrival', note: '' }],
  },
  'OS::Thread': {
    faq: ['User vs kernel thread', 'Multithreading models', 'Thread vs process'],
    expected2027: ['Thread sharing resources MCQ', 'Many-to-one model'],
  },
  'OS::Scheduling': {
    faq: ['FCFS', 'SJF', 'Round Robin', 'Priority scheduling'],
    expected2027: ['Gantt chart waiting time', 'Round robin with quantum', 'Convoy effect'],
    formulas: [{ name: 'RR waiting time', expression: 'Depends on quantum q', note: 'q too large → FCFS' }],
  },
  'OS::Deadlock': {
    faq: ['Banker\'s algorithm', 'Deadlock conditions', 'Resource allocation graph'],
    expected2027: ['Banker\'s safety algorithm trace', 'Deadlock detection', 'Coffman conditions'],
    formulas: [{ name: 'Safe state', expression: '∃ sequence where all processes finish', note: 'Banker\'s algo' }],
  },
  'OS::Memory Management': {
    faq: ['Contiguous allocation', 'Fragmentation', 'Swapping'],
    expected2027: ['External vs internal fragmentation', 'Best/worst/first fit'],
  },
  'OS::Paging': {
    faq: ['Page table', 'TLB', 'Page replacement', 'Effective access time'],
    expected2027: ['EAT calculation', 'LRU page replacement', 'TLB hit ratio'],
    formulas: [{ name: 'EAT', expression: 'h×(t_TLB+t_mem) + (1−h)×(t_TLB+t_mem+t_fault)', note: 'h = TLB hit ratio' }],
  },
  'OS::Segmentation': {
    faq: ['Segment table', 'External fragmentation', 'Paging vs segmentation'],
    expected2027: ['Logical to physical address', 'Combined paging+segmentation'],
  },
  'OS::Virtual Memory': {
    faq: ['Demand paging', 'Thrashing', 'Working set model'],
    expected2027: ['Page fault frequency', 'Thrashing prevention', 'Belady\'s anomaly'],
    formulas: [{ name: 'Page Fault Rate', expression: 'faults / total references', note: '' }],
  },

  // ── DBMS ──
  'DB::ER Model': {
    faq: ['Entity, attribute, relationship', 'Weak entity', 'Cardinality'],
    expected2027: ['ER to relational schema', 'Weak entity key', 'ISA hierarchy'],
  },
  'DB::Relational Algebra': {
    faq: ['Select, project, join', 'Division operator', 'RA vs SQL'],
    expected2027: ['RA expression evaluation', 'Natural join result', 'Division query'],
  },
  'DB::SQL': {
    faq: ['JOIN types', 'GROUP BY', 'Subqueries', 'HAVING'],
    expected2027: ['SQL query output', 'Nested subquery', 'Aggregate with GROUP BY'],
  },
  'DB::Normalization': {
    faq: ['1NF to BCNF', 'Functional dependencies', 'Decomposition lossless'],
    expected2027: ['Find highest normal form', 'Attribute closure', 'BCNF decomposition'],
    formulas: [{ name: 'Attribute Closure', expression: 'X⁺ = all attrs functionally determined by X', note: 'Armstrong axioms' }],
    mistakes: ['Confusing 2NF with 3NF partial dependency', 'Missing transitive dependency in 3NF'],
  },
  'DB::Transactions': {
    faq: ['ACID', 'Serializability', 'Recoverability'],
    expected2027: ['Conflict serializability test', 'Recoverable schedule', 'Cascadeless'],
    formulas: [{ name: 'ACID', expression: 'Atomicity, Consistency, Isolation, Durability', note: '' }],
  },
  'DB::Concurrency': {
    faq: ['2PL', 'Deadlock in DB', 'Timestamp ordering'],
    expected2027: ['Strict 2PL', 'Wait-die vs wound-wait', 'Serializable isolation'],
  },
  'DB::Recovery': {
    faq: ['Undo/redo logs', 'Checkpoint', 'ARIES'],
    expected2027: ['Log-based recovery steps', 'Force/steal policies'],
  },

  // ── Computer Networks ──
  'CN::OSI Model': {
    faq: ['7 layers', 'PDU at each layer', 'Encapsulation'],
    expected2027: ['Layer identification MCQ', 'Which layer handles routing'],
  },
  'CN::TCP/IP': {
    faq: ['4 layers', 'TCP vs UDP', 'IP protocol'],
    expected2027: ['TCP/IP stack mapping', 'Protocol at transport layer'],
  },
  'CN::Routing': {
    faq: ['Distance vector', 'Link state', 'Dijkstra in OSPF', 'Bellman-Ford in RIP'],
    expected2027: ['Routing table update', 'Count-to-infinity', 'Shortest path tree'],
  },
  'CN::Flow Control': {
    faq: ['Sliding window', 'Stop-and-wait', 'Go-back-N', 'Selective repeat'],
    expected2027: ['Window size efficiency', 'Utilization calculation'],
    formulas: [{ name: 'Stop-and-wait util.', expression: '1 / (1 + 2a)', note: 'a = Tprop/Ttrans' }],
  },
  'CN::Congestion Control': {
    faq: ['TCP congestion window', 'Slow start', 'AIMD', 'Fast retransmit'],
    expected2027: ['Congestion window growth', 'TCP Tahoe vs Reno'],
  },
  'CN::IP Addressing': {
    faq: ['Subnetting', 'CIDR', 'VLSM', 'NAT'],
    expected2027: ['Subnet mask calculation', 'Usable host count', 'Network/broadcast address'],
    formulas: [{ name: 'Usable hosts', expression: '2^(32−prefix) − 2', note: 'IPv4' }, { name: 'CRC', expression: 'Polynomial division over GF(2)', note: 'Error detection' }],
  },

  // ── TOC ──
  'TOC::DFA': {
    faq: ['DFA minimization', 'Acceptance', 'Transition function'],
    expected2027: ['DFA state transition trace', 'Minimized DFA states'],
  },
  'TOC::NFA': {
    faq: ['ε-transitions', 'NFA to DFA subset construction', 'Non-determinism'],
    expected2027: ['Subset construction steps', 'NFA state count after conversion'],
  },
  'TOC::Regex': {
    faq: ['Regex to NFA', 'Operators', 'Equivalence with regular languages'],
    expected2027: ['Regex matching', 'Identify equivalent regex'],
  },
  'TOC::CFG': {
    faq: ['Derivations', 'Parse trees', 'Ambiguity', 'CNF/GNF'],
    expected2027: ['Leftmost derivation', 'Ambiguous grammar check', 'CNF conversion'],
  },
  'TOC::PDA': {
    faq: ['Stack operations', 'DPDA vs NPDA', 'CFL acceptance'],
    expected2027: ['PDA configuration trace', 'DPDA for language'],
  },
  'TOC::Turing Machine': {
    faq: ['TM variants', 'Universal TM', 'Halting problem'],
    expected2027: ['TM tape head movement', 'Decidable vs undecidable'],
  },
  'TOC::Decidability': {
    faq: ['Rice\'s theorem', 'Reduction', 'Halting problem'],
    expected2027: ['Prove undecidable', 'Mapping reduction MCQ'],
    mistakes: ['Assuming all CFL problems are decidable', 'Confusing recognizable vs decidable'],
  },

  // ── Compiler Design ──
  'CD::Lexical Analysis': {
    faq: ['Tokens', 'Regex to NFA', 'Lex analyzer generator'],
    expected2027: ['Token identification', 'Longest match rule'],
  },
  'CD::Parsing': {
    faq: ['LL(1)', 'LR parsing', 'Ambiguous grammar'],
    expected2027: ['LL(1) parse table', 'Shift-reduce steps'],
  },
  'CD::LR Parser': {
    faq: ['LR(0)', 'SLR', 'LALR', 'Canonical LR'],
    expected2027: ['LR item closure', 'Goto table construction'],
  },
  'CD::SLR': {
    faq: ['Follow sets in SLR', 'SLR vs LR(0)'],
    expected2027: ['SLR parse table entry', 'Conflict resolution'],
  },
  'CD::LALR': {
    faq: ['State merging', 'LALR vs CLR', 'Kernel items'],
    expected2027: ['LALR table size comparison', 'Reduce-reduce conflict'],
  },
  'CD::Syntax Directed Translation': {
    faq: ['SDD', 'S-attributed', 'L-attributed', 'Syntax tree'],
    expected2027: ['SDT evaluation order', 'Attribute computation'],
  },

  // ── COA ──
  'CO::Pipeline': {
    faq: ['5-stage pipeline', 'Data hazard', 'Control hazard', 'Structural hazard'],
    expected2027: ['Pipeline timing diagram', 'Stall cycles', 'Branch penalty'],
    formulas: [{ name: 'Speedup', expression: '1 / ((1−f) + f/s)', note: 'f = fraction enhanced' }, { name: 'CPI pipeline', expression: '1 + stall_cycles/instructions', note: '' }],
  },
  'CO::Cache': {
    faq: ['Direct mapped', 'Set associative', 'Fully associative', 'LRU in cache'],
    expected2027: ['Cache hit/miss trace', 'Mapping function', 'Tag/dirty bit'],
    formulas: [{ name: 'AMAT', expression: 'Hit_Time + Miss_Rate × Miss_Penalty', note: 'Average memory access time' }],
  },
  'CO::Memory Hierarchy': {
    faq: ['Locality', 'Register-cache-DRAM-disk', 'Temporal vs spatial'],
    expected2027: ['Hierarchy latency comparison', 'Locality principle MCQ'],
  },
  'CO::Addressing Modes': {
    faq: ['Immediate', 'Direct', 'Indirect', 'Indexed', 'Base+offset'],
    expected2027: ['Effective address calculation', 'Addressing mode count'],
  },
  'CO::Instruction Formats': {
    faq: ['RISC vs CISC', 'Fixed vs variable length', 'Opcode fields'],
    expected2027: ['Instruction size bits', 'RISC pipeline advantage'],
  },

  // ── Digital Logic ──
  'DL::Boolean Algebra': {
    faq: ['De Morgan', 'Canonical forms', 'Logic gates'],
    expected2027: ['Simplify Boolean expression', 'NAND/NOR universality'],
    formulas: [{ name: 'De Morgan', expression: '(A+B)\' = A\'·B\'', note: '' }],
  },
  'DL::K-Maps': {
    faq: ['SOP minimization', 'Don\'t care', '4/5 variable K-map'],
    expected2027: ['K-map grouping', 'Minimum term count', 'Don\'t care optimization'],
    mistakes: ['Wrong group size (not power of 2)', 'Missing prime implicants'],
  },
  'DL::Flip Flops': {
    faq: ['SR, JK, D, T flip-flops', 'Characteristic table', 'Conversion between FFs'],
    expected2027: ['Flip-flop conversion circuit', 'Next state from inputs'],
    formulas: [{ name: 'D FF', expression: 'Q⁺ = D', note: 'Edge triggered' }],
  },
  'DL::Counters': {
    faq: ['Synchronous vs asynchronous', 'Mod-n counter', 'Ring counter'],
    expected2027: ['Counter sequence', 'Number of FFs for mod-n'],
  },
  'DL::FSM': {
    faq: ['Moore vs Mealy', 'State diagram', 'State minimization'],
    expected2027: ['State reduction table', 'Output for Mealy/Moore'],
    mistakes: ['Confusing Moore output (on state) vs Mealy (on transition)'],
  },

  // ── Aptitude ──
  'APT::Quantitative Aptitude': {
    faq: ['Percentage', 'Profit-loss', 'Ratio', 'Averages'],
    expected2027: ['Percentage change problem', 'Profit/loss percentage'],
  },
  'APT::Logical Reasoning': {
    faq: ['Syllogisms', 'Blood relations', 'Seating arrangement', 'Puzzles'],
    expected2027: ['Syllogism validity', 'Circular arrangement'],
  },
  'APT::Verbal Ability': {
    faq: ['Reading comprehension', 'Sentence completion', 'Grammar'],
    expected2027: ['RC inference question', 'Synonym/antonym'],
  },
  'APT::Data Interpretation': {
    faq: ['Tables', 'Bar/pie charts', 'Data sufficiency'],
    expected2027: ['Chart-based calculation', 'Percentage from table'],
  },
};

function getTopicMeta(subjectCode, topicName) {
  return META[`${subjectCode}::${topicName}`] || null;
}

function getDefaultMeta(subjectCode, topicName, subjectMeta) {
  const subFaq = subjectMeta?.frequentlyAsked || [];
  const subFormulas = (subjectMeta?.importantFormulas || []).map((f, i) => ({
    name: `Formula ${i + 1}`,
    expression: f,
    note: `${subjectMeta.name} — ${topicName}`,
  }));
  return {
    faq: subFaq.slice(0, 3).map((q) => `${q} (applies to ${topicName})`),
    expected2027: [
      `Conceptual MCQ on ${topicName}`,
      `Numerical/application problem from ${topicName}`,
      `Compare/tracing question — ${topicName}`,
    ],
    formulas: subFormulas.length ? subFormulas.slice(0, 2) : [],
    mistakes: [
      `Rushing ${topicName} without tracing examples`,
      `Skipping PYQ practice for ${topicName}`,
    ],
  };
}

module.exports = { META, getTopicMeta, getDefaultMeta };
