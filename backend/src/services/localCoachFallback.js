const { SUBJECT_WEIGHTAGE, getExamPhase } = require('./aiPromptBuilder');

const GROUPS = [
  { name: 'HELLO', keywords: ['hello', 'hi', 'hey', 'greetings'], priority: 80 },
  { name: 'STUDY', keywords: ['study', 'plan', 'today', 'daily', 'schedule', 'hours'], priority: 70 },
  { name: 'WEAK', keywords: ['weak', 'weakness', 'improve', 'bad at', 'struggle', 'difficult'], priority: 75 },
  { name: 'REVISE', keywords: ['revise', 'revision', 'review', 'recall', 'retention', 'spaced'], priority: 70 },
  { name: 'MOCK', keywords: ['mock', 'test', 'exam', 'score', 'performance', 'result'], priority: 70 },
  { name: 'MOTIVE', keywords: ['motivat', 'discourag', 'stress', 'burnout', 'tired', 'give up', 'quit'], priority: 65 },
  { name: 'TIME', keywords: ['time', 'hour', 'routine', 'schedule', 'manage', 'balance'], priority: 60 },
  { name: 'SUBJECT', keywords: ['subject', 'topic', 'syllabus', 'priority', 'weightage', 'important'], priority: 70 },
  { name: 'PYQ', keywords: ['pyq', 'previous year', 'past paper', 'question bank', 'practice'], priority: 65 },
  { name: 'FORMULA', keywords: ['formula', 'note', 'notes', 'sheet', 'cheat', 'summary'], priority: 60 },
  { name: 'MISTAKE', keywords: ['mistake', 'error', 'wrong', 'accuracy', 'silly', 'careless'], priority: 60 },
  { name: 'RANK', keywords: ['rank', 'air', 'score', 'marks', 'cutoff', 'college', 'iit', 'nit'], priority: 60 },
  { name: 'RESOURCE', keywords: ['resource', 'book', 'youtube', 'channel', 'material', 'reference', 'lecture'], priority: 55 },
  { name: 'MATH', keywords: ['math', 'mathematics', 'discrete', 'probability', 'linear algebra', 'calculus', 'graph theory', 'combinatorics', 'set theory', 'boolean algebra', 'propositional'], priority: 55 },
  { name: 'DSA', keywords: ['dsa', 'data structure', 'algorithm', 'array', 'tree', 'bst', 'avl', 'binary', 'heap', 'hashing', 'linked list', 'stack', 'queue', 'graph', 'dp', 'dynamic programming', 'greedy', 'sorting', 'recursion', 'backtracking'], priority: 70 },
  { name: 'OS', keywords: ['operating system', 'os', 'process', 'scheduling', 'deadlock', 'memory', 'page', 'thread', 'sync'], priority: 70 },
  { name: 'DBMS', keywords: ['dbms', 'database', 'sql', 'normalization', 'transaction', 'concurrency', 'index', 'er diagram', 'relational'], priority: 70 },
  { name: 'CN', keywords: ['computer network', 'cn', 'tcp', 'udp', 'ip', 'http', 'dns', 'routing', 'subnet', 'congestion', 'flow control'], priority: 65 },
  { name: 'TOC', keywords: ['toc', 'theory of computation', 'automata', 'dfa', 'nfa', 'regex', 'cfg', 'pda', 'turing', 'decidability'], priority: 60 },
  { name: 'COA', keywords: ['coa', 'computer organization', 'architecture', 'pipeline', 'cache', 'memory hierarchy', 'boolean', 'number system', 'digital logic'], priority: 60 },
  { name: 'TRACK', keywords: ['track', 'progress', 'on track', 'am i', 'how am i', 'status', 'doing well'], priority: 60 },
];

function findBestGroup(msg) {
  const lower = msg.toLowerCase();
  let best = { name: 'GENERIC', score: 0, priority: 0 };

  for (const group of GROUPS) {
    let score = 0;
    for (const kw of group.keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > 0 && (score > best.score || (score === best.score && group.priority > best.priority))) {
      best = { name: group.name, score, priority: group.priority };
    }
  }
  return best.name;
}

function localCoachResponse(message, context) {
  const msg = message.toLowerCase();
  const weakSub = context.weakSubjects?.length ? context.weakSubjects[0] : 'your weak areas';
  const strongSub = context.strongSubjects?.length ? context.strongSubjects[0] : 'your strong subjects';
  const progress = context.overallProgress || 0;
  const avg = context.mockAvg || 0;
  const streak = context.streak || 0;

  let text = '';
  let suggestions = ["What should I study today?", "Am I on track?", "Which subject should I prioritize?"];

  const bestGroup = findBestGroup(msg);

  if (bestGroup === 'HELLO') {
    text = `Hey there, GATE warrior! 👋 Ready to crush it today. ${
      streak > 0 ? `You're on a ${streak}-day streak — that's solid discipline!` : 'Consistency is key — let\'s build that streak.'
    } I'm here to help with study plans, topic advice, revision tips, or anything GATE-related. What do you need?`;
    suggestions = ["Plan my study day", "Show my weak topics", "How should I revise?"];
  } else if (bestGroup === 'STUDY') {
    text = `Here's your daily focus plan:\n\n${progress > 50 ? '📗 You\'re past halfway — great momentum!' : '📘 Starting strong — every hour counts!'}\n\n**Morning (2h):** ${weakSub} — focus on concept clarity + 5 PYQs\n**Afternoon (1.5h):** ${strongSub} — reinforce your strength area\n**Evening (1h):** Revision of last week's topics\n**Night (30m):** Formula sheet review + plan tomorrow\n\nStay consistent, and you'll see results every week! 🚀`;
    suggestions = ["Which topics in " + weakSub + " should I focus?", "How many PYQs should I solve daily?", "Give me a weekly study plan"];
  } else if (bestGroup === 'WEAK') {
    text = `Your current weak areas are: **${weakSub}** (${context.weakTopics?.slice(0,3)?.join(', ') || 'core topics'}).\n\nHere's a targeted attack plan:\n1. **Watch 1 good NPTEL/YouTube lecture** on the foundational concepts\n2. **Solve 10 PYQs** from the last 5 years on this subject\n3. **Create a one-page formula sheet** for quick revision\n\nDedicate 2 hours daily to ${weakSub} for the next 5 days and you'll see a clear improvement!`;
    suggestions = ["Show subject-wise progress", "Which PYQs should I solve first?", "Create a weekly plan for " + weakSub];
  } else if (bestGroup === 'REVISE') {
    text = `Spaced repetition is your secret weapon! 🧠\n\n${context.overdueTopics > 0 ? `⚠️ You have **${context.overdueTopics} topics** overdue for revision. Let's fix that!` : '✅ You\'re up to date on revisions — great habit!'}\n\n**Quick revision plan:**\n1. Revise **3 old topics** daily (30 min each)\n2. Use your short notes + formula sheets\n3. Solve **5 PYQs** from each topic to test retention\n4. Mark topics as done in the revision scheduler\n\nStart with the oldest unreviewed topic first!`;
    suggestions = ["Show my revision schedule", "Which topics are due today?", "How does spaced repetition work?"];
  } else if (bestGroup === 'MOCK') {
    text = avg === 0
      ? `You haven't taken any mock tests yet! 🧪\n\nMocks are **critical** for GATE success. Start with:\n1. **Subject-wise mock** for your strongest subject (to build confidence)\n2. **Full-length mock** every Sunday\n3. **Analyze every mistake** — create an error log\n\nWant me to suggest a mock test plan?`
      : `Your average mock score is **${avg}%**. ${avg >= 60 ? '✅ Solid! Focus on converting 60s to 80s.' : avg >= 40 ? '📈 Improving — analyze your mistake patterns.' : '🎯 Early stage — focus on concept clarity first.'}\n\n**Mock strategy:**\n- Take 1 full-length mock every week\n- Spend **equal time analyzing** as taking the test\n- Track your per-subject accuracy to find patterns\n- Re-solve mistakes after 3 days`;
    suggestions = ["Suggest a mock test", "How to analyze mock results?", "What's a good GATE score?"];
  } else if (bestGroup === 'MOTIVE') {
    text = `Stay strong, GATE aspirant! 💪\n\nRemember why you started. Every hour you put in is an investment in your future. **Small daily wins compound into extraordinary results.**\n\nQuick reset tips:\n1. Take a 15-min break — walk, stretch, breathe\n2. Review your "why" — IIT, PSU, or your dream role\n3. Set **one small goal** for the next 30 minutes\n4. Celebrate small wins — completed a topic? Mark it!\n\nYou're not alone in this journey. Keep going! 🔥`;
    suggestions = ["Plan a lighter study day", "How to avoid burnout?", "Celebrate my progress so far"];
  } else if (bestGroup === 'TIME') {
    text = `Quality > Quantity. Here's an optimized routine:\n\n🌅 **Morning (2h):** Deep focus — new concepts (highest concentration)\n🌤️ **Afternoon (1.5h):** PYQ practice + problem solving\n🌆 **Evening (1.5h):** Revision + weak area attack\n🌙 **Night (30m):** Formula review + plan next day\n\n💡 **Pro tip:** Use Pomodoro: 50 min study + 10 min break. Track your hours in the Productivity page!`;
    suggestions = ["How many hours should I study?", "Best study techniques for GATE", "How to avoid distractions?"];
  } else if (bestGroup === 'SUBJECT') {
    text = `**Priority order for GATE CSE:**\n\n🥇 **High weightage:** DSA, Algorithms, OS, DBMS, CN\n🥈 **Medium weightage:** COA, TOC, Discrete Math\n🥉 **Foundation:** Mathematics, Aptitude\n\nYour current order should be:\n1. Cover **Mathematics + Aptitude** early (they boost scores)\n2. **DSA + OS + DBMS** — most questions come from here\n3. **CN + TOC + COA** — moderate weightage, don't skip\n4. **Revision + Mocks** — keep revisiting completed subjects\n\nFocus on **completing one subject at a time** rather than jumping between them.`;
    suggestions = ["Subject-wise weightage breakdown", "Which subject to start first?", "How much time per subject?"];
  } else if (bestGroup === 'PYQ') {
    text = `PYQs are the **gold mine** of GATE preparation! 🏆\n\n**Strategy:**\n1. Solve PYQs **subject-wise** first (after completing each subject)\n2. Then solve **year-wise** as full-length tests\n3. **Revise your mistakes** after 3 days and again after 7 days\n4. Aim for **90%+ accuracy** on 2020-2024 papers\n\n💡 **Tip:** PYQs from 2015-2024 cover almost all important concepts. Solve them at least twice!`;
    suggestions = ["Show PYQ browser", "Most repeated PYQ topics", "How to analyze PYQ mistakes?"];
  } else if (bestGroup === 'FORMULA') {
    text = `Short notes + Formula sheets = **Revision superpower** 📝\n\n**How to create effective formula sheets:**\n1. One page per subject — only formulas, definitions, key points\n2. Use colors for different categories (green = easy, yellow = moderate, red = tricky)\n3. Keep updating as you learn new topics\n4. Review them **daily** — 5 minutes before starting study\n\n✅ Already have notes? Great! Just opening them daily reinforces memory.`;
    suggestions = ["Show my formula sheets", "How to make effective notes?", "Show revision notes for OS"];
  } else if (bestGroup === 'MISTAKE') {
    text = `Mistakes are **learning opportunities** in disguise! 🔍\n\n${context.recentAccuracy > 0 ? `Your current accuracy is **${context.recentAccuracy}%**.` : ''}\n\n**Mistake analysis framework:**\n1. **Categorize** each mistake: Silly / Concept Gap / Reading Error\n2. **Fix concept gaps** by re-watching lectures or reading textbooks\n3. **Re-solve** the question after 3 days (spaced repetition!)\n4. **Track patterns** — if you keep making the same type of error, drill it\n\nYour Mistake Notebook is the best tool — use it after every practice session!`;
    suggestions = ["Open Mistake Notebook", "How to avoid silly mistakes?", "Analyze my mistake patterns"];
  } else if (bestGroup === 'RANK') {
    text = `**GATE Score → Rank estimates (general category):**\n\n🏆 **AIR < 100:** 75+ marks (IIT Bombay/Delhi CSE)\n🥇 **AIR < 500:** 65+ marks (Top IITs)\n🥈 **AIR < 2000:** 55+ marks (IITs, NITs)\n🥉 **AIR < 5000:** 45+ marks (Good NITs, IIITs)\n\n**Your current path:** ${progress > 70 ? 'You\'re on track for a strong rank!' : progress > 40 ? 'Good progress — keep building!' : 'Early stage — focus on learning, not ranks yet!'}\n\nYou can track your predicted rank in the Analytics page!`;
    suggestions = ["Predict my AIR", "Show college cutoffs", "What score for IIT Madras?"];
  } else if (bestGroup === 'RESOURCE') {
    text = `**Best free resources for GATE CSE:**\n\n📺 **YouTube:** NPTEL (IIT professors), Gate Smashers, Knowledge Gate\n📘 **Books:** CLRS (Algorithms), Tanenbaum (OS/CN), Korth (DBMS), Ullman (TOC)\n🧠 **Practice:** GateNexa PYQ browser + Mock tests\n📝 **Notes:** Create your own short notes (10-15 pages per subject)\n\n💡 **Rule:** Stick to **1-2 resources per subject**. Hoarding resources wastes time!`;
    suggestions = ["Best YouTube channels", "Recommended textbooks", "Free mock test sources"];
  } else if (bestGroup === 'MATH') {
    text = `**Mathematics for GATE CSE — Priority order:**\n\n1. **Discrete Mathematics** — Graph Theory, Combinatorics, Set Theory (highest weightage)\n2. **Linear Algebra** — Matrices, Vector Spaces, Eigenvalues\n3. **Probability & Statistics** — Random Variables, Distributions\n4. **Calculus** — Limits, Continuity, Differentiation\n\n📈 **Strategy:** Solve **5 math problems daily** — consistency matters more than intensity. Most math questions in GATE are moderate difficulty but need practice.`;
    suggestions = ["Discrete Math topics", "Probability PYQs", "Linear Algebra weightage"];
  } else if (bestGroup === 'DSA') {
    text = `**DSA for GATE — high weightage subject!** ⚡\n\nKey topics: Arrays, Linked Lists, Trees, Graphs, Sorting & Searching, Hashing, Dynamic Programming, Greedy Algorithms.\n\n**Study plan:**\n1. Master **arrays + linked lists** first (building blocks)\n2. **Trees + Graphs** — most GATE questions come from these\n3. **Sorting + Searching** — know time/space complexities cold\n4. **DP + Greedy** — practice 5+ problems per concept\n\nSolve **10 DSA PYQs weekly** and track your accuracy!`;
    suggestions = ["DSA PYQs by topic", "Graph algorithms weightage", "How to master DP for GATE?"];
  } else if (bestGroup === 'OS') {
    text = `**Operating Systems — core subject for GATE!** 💻\n\nKey topics: Processes & Threads, CPU Scheduling, Synchronization, Deadlocks, Memory Management, File Systems, I/O.\n\n**Study plan:**\n1. **Process management + Scheduling** — most numericals come from here\n2. **Memory management** — paging, segmentation, virtual memory\n3. **Synchronization + Deadlocks** — critical for GATE\n4. **File systems + I/O** — moderate weightage\n\nSolve **OS PYQs from the last 10 years** — patterns repeat frequently!`;
    suggestions = ["OS scheduling numericals", "Memory management PYQs", "Deadlock practice questions"];
  } else if (bestGroup === 'DBMS') {
    text = `**DBMS — high-weightage, high-reward subject!** 🗄️\n\nKey topics: ER Model, Relational Model, SQL, Normalization, Transactions, Concurrency Control, Indexing.\n\n**Study plan:**\n1. **SQL + Relational Algebra** — practice writing queries daily\n2. **Normalization** — know 1NF through BCNF with examples\n3. **Transactions + Concurrency** — ACID, schedules, locking protocols\n4. **Indexing** — B+ trees, hash-based indexing\n\nSQL questions are free marks — practice until perfect!`;
    suggestions = ["SQL practice questions", "Normalization exercises", "Transaction PYQs"];
  } else if (bestGroup === 'CN') {
    text = `**Computer Networks — moderate weightage, manageable scope!** 🌐\n\nKey topics: OSI/TCP-IP Model, Application Layer (HTTP, DNS), Transport Layer (TCP, UDP), Network Layer (IP, Routing), Data Link Layer.\n\n**Study plan:**\n1. **TCP/IP model + layers** — know what each layer does\n2. **TCP + UDP** — congestion control, flow control\n3. **IP addressing + Routing** — subnetting, CIDR, routing algorithms\n4. **Application layer** — HTTP, DNS, SMTP basics\n\nFocus on **numericals** — IP addressing and TCP flow control are GATE favorites!`;
    suggestions = ["IP addressing numericals", "TCP congestion control", "Routing algorithm PYQs"];
  } else if (bestGroup === 'TOC') {
    text = `**Theory of Computation — conceptual but scoring!** 🔤\n\nKey topics: Regular Languages, DFA/NFA, Regular Expressions, Context-Free Grammars, Pushdown Automata, Turing Machines, Undecidability.\n\n**Study plan:**\n1. **DFA/NFA design** — practice constructing automata for languages\n2. **Regular expressions** — conversion to/from automata\n3. **CFG + PDA** — derivations, parse trees, pushdown automata\n4. **Turing Machines + Undecidability** — understand concepts, not memorize\n\nTOC is a **high-confidence scoring subject** — consistent practice yields full marks!`;
    suggestions = ["DFA practice problems", "CFG to PDA conversion", "Turing machine basics"];
  } else if (bestGroup === 'COA') {
    text = `**Computer Organization & Architecture — must-know!** ⚙️\n\nKey topics: Number Systems, Boolean Algebra, Combinational/Sequential Circuits, CPU Architecture, Pipelining, Memory Hierarchy, Cache, I/O.\n\n**Study plan:**\n1. **Digital Logic (Number systems + Boolean)** — foundation for COA\n2. **CPU Architecture + Pipelining** — most numericals here\n3. **Cache + Memory Hierarchy** — know mapping techniques\n4. **I/O + DMA** — basic understanding enough\n\nCOA numericals (cache, pipeline) are **free marks** with enough practice!`;
    suggestions = ["Pipeline numericals", "Cache mapping techniques", "COA PYQs by topic"];
  } else if (bestGroup === 'TRACK') {
    text = `**Am I on track? Let's check!** 📊\n\n${progress > 70 ? '✅ **Excellent progress!** You\'re well ahead. Focus on revision + mock tests.' : progress > 50 ? '✅ **Good progress!** Keep up the momentum. Start PYQs for completed subjects.' : progress > 30 ? '⚠️ **On track, but can accelerate!** Increase daily study hours and prioritize weak subjects.' : '🔴 **Early stage — this is okay!** Focus on covering core subjects (DSA, OS, DBMS) first.'}\n\n🎯 **Suggested daily targets:**\n- ${progress < 30 ? '4-5 hours: 2h new content + 2h practice + 1h revision' : progress < 60 ? '5-6 hours: 2h new + 2h PYQs + 1.5h revision + 0.5h planning' : '5-6 hours: 3h PYQs/mocks + 2h revision + 1h weak area attack'}\n\n🔥 ${streak > 0 ? `Your ${streak}-day streak is solid!` : 'Start a streak today!'}`;
    suggestions = ["Weekly study plan", "How many hours should I study?", "Adjust my preparation strategy"];
  } else {
    // Extract the core subject from the question to give a relevant answer
    const coreSubjects = ['deadlock', 'scheduling', 'normalization', 'sql', 'tcp', 'routing', 'pipeline', 'cache', 'dfa', 'turing', 'grammar', 'boolean', 'kmap', 'probability', 'combinatorics', 'graph theory', 'set theory', 'propositional', 'predicate'];
    const askedSubject = coreSubjects.find(s => msg.includes(s));
    text = askedSubject
      ? `Great question about **${askedSubject}**! Here's what you need to know for GATE:\n\n📚 **${askedSubject}** is an important topic in GATE CSE. Key points:\n1. Understand the **core concepts** thoroughly before attempting PYQs\n2. Practice **numericals** — they're high-scoring in this area\n3. **Revise** with short notes every 3-7 days using spaced repetition\n\n📊 **Your current progress:** ${progress}% overall\n${weakSub !== 'your weak areas' ? `⚠️ **Focus area:** ${weakSub}` : ''}\n\nWould you like me to explain a specific concept within ${askedSubject} or suggest PYQs to practice?`
      : `Great question! Here's my take based on your GATE preparation:\n\n📊 **Progress:** ${progress}% complete\n🔥 **Streak:** ${streak} days\n📚 **Weak areas:** ${weakSub}\n✅ **Strong areas:** ${strongSub}\n\n**My advice:** ${progress < 30 ? 'Focus on completing core subjects first.' : progress < 60 ? 'Good progress! Shift focus to PYQs alongside learning.' : 'Excellent! You are in revision + mock phase now.'}\n\nCan you tell me more about what you'd like help with? I can explain concepts, suggest study plans, or recommend resources.`;
    suggestions = ["What should I study today?", "Am I on track for GATE 2027?", "Explain a GATE concept"];
  }

  return { text, suggestions };
}

module.exports = { localCoachResponse };