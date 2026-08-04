const SUBJECT_DEPENDENCIES = {
  'Programming & Data Structures': [],
  'Algorithms': ['Programming & Data Structures'],
  'DBMS': [],
  'Operating Systems': ['Programming & Data Structures'],
  'Computer Networks': [],
  'Theory of Computation': [],
  'Compiler Design': ['Theory of Computation', 'Programming & Data Structures'],
  'Computer Organization': [],
  'Digital Logic': [],
  'Engineering Mathematics': [],
  'General Aptitude': [],
};

const TOPIC_WEIGHTAGE = {
  'Engineering Mathematics': { 'Linear Algebra': 5, 'Probability': 5, 'Discrete Mathematics': 4, 'Calculus': 3, 'Numerical Methods': 2 },
  'Programming & Data Structures': { 'Arrays': 4, 'Linked Lists': 3, 'Stacks & Queues': 3, 'Trees': 5, 'Graphs': 4, 'Sorting & Searching': 3, 'Hash Tables': 2, 'Recursion': 2 },
  'Algorithms': { 'Time Complexity': 4, 'Divide & Conquer': 3, 'Greedy': 3, 'Dynamic Programming': 5, 'Graph Algorithms': 4, 'P vs NP': 2 },
  'DBMS': { 'ER Diagrams': 3, 'SQL': 5, 'Normalization': 4, 'Transactions': 4, 'Concurrency Control': 3, 'File Organization': 2, 'Indexing': 3 },
  'Operating Systems': { 'Process Management': 5, 'Memory Management': 5, 'File Systems': 3, 'I/O Management': 2, 'Deadlocks': 4, 'Synchronization': 4, 'Disk Scheduling': 2 },
  'Computer Networks': { 'Layering': 2, 'Application Layer': 4, 'Transport Layer': 5, 'Network Layer': 5, 'Data Link Layer': 4, 'Physical Layer': 2, 'Network Security': 2 },
  'Theory of Computation': { 'Regular Languages': 4, 'Context-Free Languages': 4, 'Turing Machines': 5, 'Undecidability': 3, 'Complexity Classes': 2 },
  'Compiler Design': { 'Lexical Analysis': 3, 'Parsing': 5, 'Syntax-Directed Translation': 3, 'Intermediate Code': 3, 'Code Optimization': 3, 'Code Generation': 2 },
  'Computer Organization': { 'Digital Logic Circuits': 3, 'ALU & Data Path': 4, 'Memory Hierarchy': 5, 'I/O Organization': 3, 'Pipelining': 5 },
  'Digital Logic': { 'Boolean Algebra': 4, 'Logic Gates': 3, 'Combinational Circuits': 4, 'Sequential Circuits': 4, 'Counters & Registers': 2 },
};

const EXAM_WEIGHTAGE = {
  'General Aptitude': 15,
  'Engineering Mathematics': 15,
  'Programming & Data Structures': 10,
  'Algorithms': 8,
  'DBMS': 8,
  'Operating Systems': 8,
  'Computer Networks': 8,
  'Theory of Computation': 6,
  'Compiler Design': 6,
  'Computer Organization': 8,
  'Digital Logic': 8,
};

const SUBJECT_CONCEPTUAL_CONTINUITY = {
  'Programming & Data Structures': { continuesInto: ['Algorithms', 'Operating Systems', 'Compiler Design'], reason: 'PDS concepts like pointers, memory layout, and data structures form the backbone for algorithm design, OS memory management, and compiler symbol tables.' },
  'Algorithms': { continuesInto: ['Compiler Design'], reason: 'Algorithm analysis directly applies to compiler optimization phases.' },
  'DBMS': { continuesInto: ['Operating Systems'], reason: 'DBMS transaction management and OS synchronization share concurrency control concepts. Both deal with locking, scheduling, and resource management.' },
  'Operating Systems': { continuesInto: ['Computer Networks'], reason: 'OS networking stack, IPC, and socket programming bridge naturally into network layers and protocols.' },
  'Theory of Computation': { continuesInto: ['Compiler Design'], reason: 'TOC provides the language hierarchy (regular, context-free) that defines compiler frontend design: lexer, parser.' },
  'Computer Organization': { continuesInto: ['Operating Systems'], reason: 'COA provides the hardware foundation (interrupts, DMA, memory hierarchy) that OS manages.' },
  'Digital Logic': { continuesInto: ['Computer Organization'], reason: 'Digital logic circuits (gates, ALU, flip-flops) are the building blocks of computer architecture.' },
  'Engineering Mathematics': { continuesInto: ['Algorithms', 'Theory of Computation'], reason: 'Discrete math and probability underpin algorithm analysis and TOC complexity classes.' },
  'Computer Networks': { continuesInto: [], reason: 'Standalone subject with minimal dependency on other GATE CS topics.' },
  'Compiler Design': { continuesInto: [], reason: 'Capstone subject — consumes concepts from many topics but feeds into none.' },
  'General Aptitude': { continuesInto: [], reason: 'Standalone — no dependency on other subjects.' },
};

const AIR_KNOWLEDGE = {
  studyStrategy: {
    principle: 'Build preparation in layers: lectures, revision, PYQs, quizzes, tests, analysis, and repeat. The Four-Step Subject Cycle: Learn → Revise → Practice → Test.',
    approach: [
      'Phase 1 — Foundation: Lectures and notes, lecture questions, basic revision.',
      'Phase 2 — Layered Build: PYQs, quizzes, DPPs, subject completion, short notes.',
      'Phase 3 — Testing Phase: Topic tests, subject tests, stronger analysis, weak-topic repair.',
      'Phase 4 — Exam Mode: Full-length tests, rapid revision, calmness, mistake reduction.',
    ],
    goldenRule: 'A topic is not complete when you finish the lecture. It is complete when you can revise it, solve PYQs on it, and trust yourself in a test. Lecture completion alone is never enough — you need: lecture + notes + PYQs + one quiz/test exposure.',
    corePhilosophy: 'Build depth through repeated contact with the same topic in different forms. Progress should be measured by retention and performance, not only by hours watched.',
    realTopicCompletion: [
      'Lecture or theory study',
      'Own notes, topper\'s notes, or annotated notes',
      'PYQs or strong practice on that topic',
      'One quiz or test exposure',
    ],
    resourceDiscipline: 'Use GO Classes as the main study system. Follow their subject sequence. Use a single note-making style. Keep one mistake notebook and one short-notes system. Switch a source only when understanding is consistently blocked, not because of boredom. Standard resources are for specific doubt reference, not as a second full syllabus.',
    subjectParallelCount: 'Usually 1-2 subjects in parallel. One heavy + one lighter works well. Aptitude or Engineering Mathematics can run as a parallel stream.',
  },
  subjectOrder: {
    principle: 'Build subjects with conceptual continuity. Programming & Data Structures → Algorithms. TOC → Compiler Design. Digital Logic → COA → OS. DBMS pairs with Discrete Math. Aptitude pairs with Probability.',
    recommendedOrder: [
      { subject: 'Programming & Data Structures', reason: 'Prerequisite for Algorithms, OS, Compiler Design. Output-based questions need careful dry runs.' },
      { subject: 'Algorithms', reason: 'Highest-return subject if practiced seriously. Focus on why an algorithm works, not only the procedure.' },
      { subject: 'Digital Logic', reason: 'Should be done before COA. Strengthens number systems, Boolean algebra, sequential thinking.' },
      { subject: 'Computer Organization', reason: 'Builds on Digital Logic. Foundational for OS. Practice numericals patiently — this is not a subject to rush.' },
      { subject: 'Operating Systems', reason: 'COA complements OS. Becomes intuitive as process, memory, file, and synchronization behavior. Question reading matters — small wording changes change the answer.' },
      { subject: 'DBMS', reason: 'Discrete Math style thinking helps in keys, dependencies, normalization. Scoring subject if concepts are neat and revision is regular.' },
      { subject: 'Theory of Computation', reason: 'Prerequisite for Compiler Design. May feel abstract initially — becomes easier once definitions and standard constructions become familiar.' },
      { subject: 'Compiler Design', reason: 'Capstone — requires TOC and PDS. Compact subject, but easy to make state-table and parser mistakes if practice is weak.' },
      { subject: 'Computer Networks', reason: 'Wide subject — revision matters a lot. Details fade quickly. Keep this subject active.' },
      { subject: 'Engineering Mathematics', reason: 'Very scoring when revised properly. Forms base for AI/ML through probability and linear algebra. Requires a lot of practice.' },
      { subject: 'General Aptitude', reason: '15% weightage. Small daily practice beats late bulk push. Accuracy and careful reading matter as much as speed.' },
    ],
    conceptualPairing: [
      { subjects: ['Programming & Data Structures', 'Algorithms'], reason: 'PDS builds the data structure intuition that Algorithms depends on. Do them consecutively.' },
      { subjects: ['Theory of Computation', 'Compiler Design'], reason: 'TOC provides the language hierarchy (regular, context-free) that defines compiler frontend design.' },
      { subjects: ['Digital Logic', 'Computer Organization'], reason: 'Digital Logic before COA makes the hardware side much easier.' },
      { subjects: ['Computer Organization', 'Operating Systems'], reason: 'COA provides hardware foundation (interrupts, DMA, memory hierarchy) that OS manages.' },
      { subjects: ['DBMS', 'Discrete Mathematics'], reason: 'Discrete Math style thinking directly applies to keys, dependencies, and normalization in DBMS.' },
      { subjects: ['General Aptitude', 'Probability'], reason: 'Aptitude reasoning pairs naturally with probability concepts from Engineering Mathematics.' },
    ],
  },
  topicPriority: {
    principle: 'Complete one subject fully before moving to the next. Do not leave easy and medium parts from any subject. There is no permanently low-scoring subject — weightage changes every year.',
    rules: [
      'Do not skip the first lecture of any subject — it builds motivation and curiosity.',
      'Within each subject, start with easy/medium parts, then difficult ones.',
      'Do NOT abandon entire subjects. Cover at least easy and medium parts from every subject.',
      'If a topic is hard, slow down rather than pretending it is done.',
    ],
    subjectDurations: {
      'Discrete Mathematics': '~248 hours across 9 modules in GO Classes. Focus on practice and application.',
      'Engineering Mathematics': '~66 hours. Linear Algebra (30h), Probability (28h), Calculus (8-10h).',
      'Digital Logic': '~96 hours across 5 modules. Practice conversions, minimization, circuit interpretation.',
      'C Programming': '~36 hours. Pay attention to pointers, arrays, operator precedence, recursion, type conversion.',
      'Data Structures': '~60 hours. Trees, heaps, hashing, stacks, queues need repeated practice. Draw structures by hand.',
      'Algorithms': '~60 hours. Greedy, DP, graphs, recurrences improve mainly through problem solving.',
      'Theory of Computation': '~157 hours across 6 modules. Practice automata construction, conversions, grammar questions.',
      'Compiler Design': '~47 hours across 4 modules. Focus on parsing-oriented questions. Compact but precise.',
      'Computer Organization': '~69 hours. Memory hierarchy, pipelining, addressing need conceptual clarity.',
      'Operating Systems': '~76 hours (excluding PYQs). Scheduling, deadlocks, paging, memory management need regular practice.',
      'Databases': '~165 hours across 8 modules. Relational algebra, SQL, normalization, transactions all need repeated exposure.',
      'Computer Networks': '~77 hours across 6 modules. Application layer, IP addressing, subnetting need repeated revision.',
    },
  },
  revisionStrategy: {
    principle: 'Revision starts immediately after topic completion — do not wait for full syllabus. Without revision, forgetting is guaranteed. Revision is where confidence is built.',
    defaultSchedule: [
      { after: '1 day', label: 'Next Day Revision', layer: 'First immediate recall after topic completion' },
      { after: '7 days', label: 'First Weekly Revision', layer: 'Consolidate — active recall, re-solve starred PYQs' },
      { after: '14 days', label: 'Fortnightly Revision', layer: 'Second recall — should be faster than first' },
      { after: '30 days', label: 'Monthly Revision', layer: 'Third recall — compact scan of notes and mistake log' },
      { after: '60 days', label: 'Pre-Mock Revision', layer: 'Final scan before full-length test exposure' },
    ],
    minimumModel: [
      'Immediate revision after topic completion',
      'Revision after subject completion',
      'Final revision before the exam',
    ],
    adaptiveRules: [
      'If PYQ accuracy > 80%: extend interval by 50% — topic is strong.',
      'If PYQ accuracy < 40%: shorten interval by 50% and revisit lecture/notes.',
      'If topic untouched > 30 days: mark as FORGOTTEN — requires full lecture re-do.',
    ],
    weeklyRevisionCycle: 'Every Sunday: full revision of the week\'s completed topics. In a round-robin model: first round is slow, second is faster, third is compact.',
    activeRecallMethods: [
      'Self-quizzing without looking at notes',
      'Re-solving starred PYQs from memory',
      'Blank-page recall — write everything you remember on a topic',
      'Short oral explanation — explain the concept aloud',
      'Answer writing on GateOverflow — explaining forces clarity',
    ],
  },
  pyqStrategy: {
    principle: 'PYQs are among the highest-value resources. Use them to understand what is important, what patterns repeat, where concepts are shaky, and what the real exam feels like.',
    phases: [
      {
        phase: 'Topic-wise PYQs',
        when: 'Immediately after completing each topic',
        count: 'All PYQs for that topic from the last 10 years',
        method: 'Solve topic-wise. Save important/tricky questions for revision. Use a star system: ★ useful, ★★ important, ★★★ high-value revision.',
        notebook: 'Maintain a digital mistake notebook. Tag every wrong answer to a specific topic and error type.',
      },
      {
        phase: 'Subject-wise PYQs',
        when: 'After completing an entire subject',
        count: 'All PYQs for that subject from the last 10 years',
        method: 'Solve in mixed topic order. Time-bound (2 min per question). Identify which topics need re-study.',
      },
      {
        phase: 'Full-length PYQ papers',
        when: 'After completing 8+ subjects',
        count: '1 full PYQ paper every 3 days',
        method: 'Full 3-hour exam simulation. No interruptions. No phone. Strict timing.',
      },
    ],
    starSystem: { 1: 'Useful question', 2: 'Important question', 3: 'High-value revision question — revisit multiple times' },
    targetAccuracy: 'Subject-wise PYQs: 85%+ before moving on from a subject. Overall target: 90%+ before exam.',
    resource: 'GateOverflow PYQ book: github.com/GATEOverflow/GO-PDFs',
  },
  mockStrategy: {
    phases: [
      {
        stage: 'Not Ready',
        condition: 'Completed < 5 subjects OR no PYQ practice OR overall progress < 40%',
        advice: 'Do NOT take mocks yet. Focus on completing subjects and topic-wise PYQs. Start with topic quizzes instead.',
      },
      {
        stage: 'Almost Ready',
        condition: 'Completed 5-8 subjects with PYQs for each. Progress 40-70%.',
        advice: 'Start with 1 mock per week. Purpose: identify weak areas, not score. Topic and subject tests build technical sharpness first.',
      },
      {
        stage: 'Ready',
        condition: 'Completed 8+ subjects. PYQ accuracy 70%+. Progress 70-85%.',
        advice: '2 mocks per week. Analyze every mistake deeply. Create error log. Full-length mocks build stamina and decision-making.',
      },
      {
        stage: 'Mock Intensive',
        condition: 'All subjects covered. Revision in progress. Progress 85%+.',
        advice: 'Alternate: mock one day, analysis next day. 3-4 mocks per week in last month. Align mock timing with your exam slot.',
      },
    ],
    analysisRoutine: 'After each mock: 1hr analysis for every 3hr mock. Record: total questions, correct, wrong, unattempted, accuracy. Categorize: easy-correct, correct-slow, wrong-attempted, unattempted-should-know. For each wrong/skipped: identify reason (concept unclear, formula forgotten, silly mistake, time pressure, misread, weak topic). Re-solve the test without a timer. Update mistake notebook.',
    goldenRule: 'Low marks in a mock are useful only if they lead to better revision decisions. Use mocks as diagnostics, not as identity. One honestly analyzed test improves you more than three carelessly given tests.',
  },
  commonMistakes: [
    { mistake: 'Finishing months of lectures without revision', consequence: 'Forgetting ~70% within 30 days (Ebbinghaus curve). Lecture-only preparation is the biggest mistake.', fix: 'Revision starts immediately after topic completion. Minimum: next-day, weekly, monthly layers.' },
    { mistake: 'Switching resources repeatedly', consequence: 'Resource instability creates fake activity and weak retention. Clarity grows when resources become fewer.', fix: 'One main source per subject. GO Classes as primary system. Standard resources only for specific doubt reference.' },
    { mistake: 'Abandoning entire subjects', consequence: 'Weightage changes every year. Leaving a subject is a bad gamble — you never know what will be heavy in your exam.', fix: 'Cover at least easy and medium parts from every subject. There is no permanently low-scoring subject.' },
    { mistake: 'Not solving PYQs subject-wise', consequence: 'No exam context. Underestimating question patterns. PYQs are the highest-value resource.', fix: 'Start topic-wise PYQs immediately after completing each topic. Save important questions with a star system.' },
    { mistake: 'Ignoring revision until the end', consequence: 'Weak retention. A rushed and forgotten syllabus is worse than a slightly late but well-revised one.', fix: 'Keep daily/weekly revision blocks. Use active recall: self-quizzing, blank-page recall, oral explanation.' },
    { mistake: 'No mistake notebook', consequence: 'Repeating the same errors across topics. Silly mistakes in the exam hall are most costly.', fix: 'Maintain one dedicated mistake notebook. Record: concept mistakes, silly errors, misread questions, repeated traps.' },
    { mistake: 'Treating mocks as score validation', consequence: 'Demotivation from low scores. Mock scores are diagnostics, not identity. One bad test does not define your potential.', fix: 'Analyze every mock honestly. Categorize mistakes. Re-solve. Update mistake log. The trend of correction matters more than any single score.' },
    { mistake: 'Ignoring General Aptitude', consequence: 'Losing 15% easy marks. GA is the most scoring section when practiced consistently.', fix: 'Practice GA for 30 min daily from day one. Small daily practice beats late bulk push.' },
    { mistake: 'Preparing for GATE and placements together', consequence: 'Half-preparation on both sides. Divided attention weakens deep GATE preparation.', fix: 'If GATE is your real target, focus only on GATE and leave placements completely. Remove split focus early.' },
    { mistake: 'Not maintaining short notes', consequence: 'Entering revision season empty-handed. No quick reference material for last-month revision.', fix: 'After enough exposure to a subject, prepare compact short notes with formulas, standard tricks, common pitfalls, and patterns you keep forgetting.' },
    { mistake: 'Ignoring sleep and health', consequence: 'A tired brain remembers worse, solves slower, and makes more mistakes. Sleep deprivation quietly destroys consistency.', fix: 'Stable sleep beats extreme study hours. A sharp brain outperforms a tired brain. Protect sleep, hydration, and basic exercise.' },
    { mistake: 'Overcomplicating preparation', consequence: 'Anxiety over progress. Overcomplication creates more anxiety than actual progress.', fix: 'When preparation feels confusing, come back to four pillars: Concepts, PYQs, Revision, Test Series. Keep it simple.' },
  ],
  dailyRoutine: {
    structure: 'Strong default: lecture block → practice block → revision block.',
    blocks: [
      { time: 'Lecture Block', duration: '2-3 hrs', task: 'New topic learning — lecture + notes. Highest focus time. Complete lectures actively, not as background audio. Pause and solve examples yourself.' },
      { time: 'Practice Block', duration: '1-2 hrs', task: 'PYQs on recently completed topics. Lecture questions and DPPs. Active recall without looking at notes.' },
      { time: 'Revision Block', duration: '1 hr', task: 'Revision of topics from last week. Spaced repetition. Re-solve starred PYQs. Update short notes and mistake log.' },
      { time: 'Maths/Aptitude', duration: '30-60 min', task: 'Steady daily or near-daily contact with Engineering Mathematics and General Aptitude. Do not treat them as endgame subjects.' },
      { time: 'Review & Plan', duration: '10 min', task: 'Review day\'s effort honestly. Acknowledge what improved. Plan next day\'s 3 most important tasks.' },
    ],
    rule: 'Keep a minimum daily floor so momentum never drops to zero. Even a small study day is better than a zero day.',
  },
  weeklyRoutine: {
    structure: [
      { day: 'Monday-Friday', focus: 'Lecture + practice + revision blocks as scheduled. One heavy subject + one lighter subject in parallel. Steady Maths/Aptitude.' },
      { day: 'Saturday', focus: 'Catch-up day — complete pending topics, resolve all doubts from the week. Clear your question backlog before Sunday.' },
      { day: 'Sunday', focus: 'Full revision of the week. Weekly mock test (if in mock phase). Mistake notebook review. Plan next week\'s targets.' },
    ],
    rule: 'Never start a new week with pending work from the previous week. Short planning cycles work best: daily goal + weekly correction.',
  },
  lastMonthStrategy: {
    focus: 'Mock tests + revision + mistake analysis. NO new topics. Zero exceptions.',
    schedule: [
      { week: 'Week 1', activity: '3 mocks. Full syllabus revision scan (rapid, not deep). Identify top 5 weakest areas for targeted work.' },
      { week: 'Week 2', activity: '4 mocks. Targeted revision of weak areas. Re-solve important PYQs. Compact short notes.' },
      { week: 'Week 3', activity: '5 mocks. Time management refinement. Formula sheets review. Mistake notebook deep review.' },
      { week: 'Week 4', activity: 'Light revision. Confidence building. 2 mocks max. Protect sleep and mental stability.' },
    ],
    rule: 'In the last 7 days: no new problems. Only revision of what you already know. Final exam day preparation: stop studying by 6 PM the day before. Relax. Walk. Talk to family.',
  },
  examWeekStrategy: [
    'No new topics. Zero exceptions. Your goal is to make fewer mistakes in what you already know, not to learn more.',
    'Revise only formula sheets, shortcut notes, and your mistake notebook — these are your highest-value resources.',
    'One light mock (not full 3 hours) just to stay in exam rhythm. Do not exhaust yourself.',
    'Sleep 8 hours every night. Exam performance is 50% preparation, 50% rest. A calm and rested mind remembers better.',
    'Day before exam: stop studying by 6 PM. Relax. Walk. Talk to family. Do not open any new material.',
    'In the exam hall: calmness is worth marks. Do not get trapped by a single long question. Do not assume every 2-mark question deserves early attention. Read carefully — many marks are lost by misreading.',
    'Exam hall strategy: Answer ALL easy questions first (15 min). Then medium (45 min). Then hard (60 min). Use last 15 min for review. Never spend more than 3 minutes on a single question — mark and move on.',
    'Silent mark killers: silly calculation errors, wrong option marking, poor question selection, panic after one hard question. Stay calm and choose well.',
    'Quote from Deepak Poonia Sir: "Calmness has the weightage of 10 marks in GATE Exam."',
  ],
  timeManagement: {
    perQuestion: { easy: '1 min', medium: '2 min', hard: '3 min' },
    strategy: 'Answer ALL easy questions first (15 min). Then medium (45 min). Then hard (60 min). Use last 15 min for review. Read carefully before solving.',
    sectionSplit: 'GA: 15 min. Core CS: 135 min. Flex: 30 min for review and re-attempts.',
    goldenRule: 'Never spend more than 3 min on a single question. Mark and move on. Discipline beats drama in the exam hall.',
    prevention: 'Avoid silent mark killers: silly calculation errors, wrong option marking, poor question selection, panic after a hard question.',
  },
  weakSubjectHandling: {
    principle: 'There is no permanently low-scoring subject in GATE. Weightage and difficulty change every year.',
    diagnosis: [
      { cause: 'Concept gap', solution: 'Revisit lectures and notes. Start fresh if needed.' },
      { cause: 'Low practice', solution: 'Increase PYQs and selected problems on that subject.' },
      { cause: 'Poor revision', solution: 'Improve short notes and spaced review frequency.' },
      { cause: 'Fear and avoidance', solution: 'Give smaller tests more frequently. Stop avoiding — the subject improves fastest when you face it.' },
      { cause: 'Poor test temperament', solution: 'Practice time-bound quizzes. Build stamina gradually.' },
    ],
    strategy: 'Cover easy topics from the weak subject first. Then secure medium-level topics. Then improve difficult areas gradually. Weak subjects improve fastest when you stop avoiding them.',
  },
  lateStartStrategy: {
    principle: 'If starting late, remove fancy ideas and keep the process simple. A late but disciplined start can still be dangerous competition for many who started early but stayed inconsistent.',
    focus: [
      'One main source — do not shop for resources.',
      'Topic completion with PYQs — skip nothing in the core subjects.',
      'Regular revision — even 15 min daily keeps retention alive.',
      'Early tests — topic quizzes from week one.',
    ],
    warning: 'Do not spend too much time designing a perfect timetable. Use short planning cycles: daily goal, weekly correction.',
  },
  studentTypeGuidance: {
    college: {
      advantage: 'Your time advantage is your biggest strength. Start early enough that you can revise properly.',
      strategy: 'Use semester breaks and lighter academic windows to push hard on core subjects. Handle college exams efficiently without letting them consume months of attention. Do not obsess over CGPA — keep it respectable, but protect time for GATE.',
      warning: 'Do not let random events and distractions eat the most valuable months. If college lectures are low value for your target, use time strategically.',
    },
    dropper: {
      advantage: 'Previous attempt data is your edge. Use it to identify weak subjects, silly mistakes, poor question selection, time-management errors, and skipped topics.',
      strategy: 'A drop year should not become a second round of passive lecture watching. Your edge comes from refinement, deeper revision, and better testing discipline. Identify what went wrong last time and fix it specifically.',
    },
    working: {
      advantage: 'Consistency over occasional extreme bursts.',
      strategy: 'Build realistic weekday targets and stronger weekend blocks. Keep resources limited and predictable. Protect health, sleep, and work stability. If possible, try for work-from-home to reduce travel time. Early morning or late-night study windows work best.',
    },
  },
  recommendedResources: {
    'Discrete Mathematics': { primary: 'GO Classes (Module 1-9, ~248 hrs)', book: 'Discrete Mathematics and Its Applications by Rosen', practice: 'GateOverflow topic-wise sorting', note: 'Focus more on practice. Strong only when ideas are applied repeatedly.' },
    'Engineering Mathematics': { primary: 'GO Classes (Linear Algebra ~30h, Probability ~28h, Calculus ~8-10h)', book: 'Higher Engineering Mathematics by B.S. Grewal', practice: 'Daily 10-math problem set', note: 'Very scoring when revised properly. Probability needs application understanding, not formula memorization.' },
    'Programming & Data Structures': { primary: 'GO Classes (~36 hrs for C Prog + ~60 hrs for DS)', book: 'Let Us C by Yashwant Kanetkar', practice: 'Hand-trace output-based questions. Draw data structures.', note: 'Contains many edge cases. Passive reading is not enough — practice and tracing matter more.' },
    'Algorithms': { primary: 'GO Classes (~60 hrs)', book: 'Introduction to Algorithms (CLRS) — selective reference', practice: 'GateOverflow algorithm problems. Focus on Greedy, DP, graphs.', note: 'One of the highest-return subjects if practiced seriously. Focus on WHY an algorithm works.' },
    'Theory of Computation': { primary: 'GO Classes (~157 hrs across 6 modules)', book: 'Introduction to Automata Theory by Hopcroft — selective reference', practice: 'GateOverflow TOC problems. Practice automata construction and conversions.', note: 'May feel abstract initially. Becomes much easier once definitions and standard constructions become familiar.' },
    'Compiler Design': { primary: 'GO Classes (~47 hrs across 4 modules)', book: 'Compilers by Aho, Lam, Sethi, Ullman (Dragon Book) — selective reference', practice: 'Parsing-oriented questions. State-table and parser practice.', note: 'Becomes much easier if TOC is already comfortable. Easy to make state-table mistakes if practice is weak.' },
    'Digital Logic': { primary: 'GO Classes (~96 hrs across 5 modules)', book: 'Digital Logic and Computer Design by Morris Mano', practice: 'Boolean algebra simplification daily. Circuit interpretation.', note: 'Should be done before COA. Makes the hardware side much easier.' },
    'Computer Organization': { primary: 'GO Classes (~69 hrs)', book: 'Computer Organization by Hamacher — selective reference', practice: 'Subject-wise PYQs. Numerical patience.', note: 'Often feels difficult initially, but becomes one of the most interesting subjects once understood.' },
    'Operating Systems': { primary: 'GO Classes (~76 hrs excluding PYQs)', book: 'Operating System Concepts by Galvin — selective reference', practice: 'GateOverflow thread discussions. Scheduling and deadlock problems.', note: 'Becomes more intuitive when seen as process/memory/file/sync behavior. Question reading matters a lot.' },
    'Databases': { primary: 'GO Classes (~165 hrs across 8 modules)', book: 'Database System Concepts by Korth — selective reference', practice: 'Subject-wise PYQs. SQL and normalization practice.', note: 'Scoring subject if concepts are neat and revision is regular. Mix conceptual clarity with question practice.' },
    'Computer Networks': { primary: 'GO Classes (~77 hrs across 6 modules)', book: 'Computer Networking by Kurose — selective reference', practice: 'Subject-wise PYQs. IP addressing and subnetting practice.', note: 'Wide subject — revision matters a lot. Keep this subject active because details fade quickly.' },
    'General Aptitude': { primary: 'GO Classes Aptitude + RS Aggarwal', book: 'RS Aggarwal — Quantitative Aptitude and Verbal & Non-Verbal Reasoning', practice: '30 min daily from day one. Use previous year GA papers.', note: 'Scoring section — should not be postponed. Small daily practice beats late bulk push.' },
  },
  answerWriting: {
    principle: 'Answer writing on GateOverflow helps retain concepts because explaining an answer forces clarity. It also boosts confidence and trains you to express concepts in clean logical order.',
    guidance: [
      'Do not wait until you feel like an expert before contributing.',
      'Even if a question already has a strong answer, writing your own explanation is still useful for your growth.',
      'The GATE community is very supportive — do not be afraid of being judged.',
      'Solving doubts of other people is also active recall — it forces you to reconstruct the concept clearly in your own words.',
    ],
    quote: 'Keep contributing. Keep learning. Results will follow.',
  },
  fourPillars: {
    pillars: ['Concepts', 'PYQs', 'Revision', 'Test Series'],
    principle: 'When preparation feels confusing, come back to these four pillars. Overcomplication usually creates more anxiety than progress.',
    finalChecklist: [
      'One main source per subject',
      'Revision in parallel with lectures',
      'PYQs taken seriously',
      'Topic-wise testing started early',
      'Short notes maintained',
      'Mistake notebook updated',
      'Sleep and health protected',
      'Calmness trained before the exam',
    ],
    finalMessage: 'If discipline is real, revision is regular, and testing is analyzed honestly, then strong ranks become realistic. Depth over distraction. Consistency over excitement. Focus over multitasking.',
  },
};

export function getPrerequisites(subject) {
  return SUBJECT_DEPENDENCIES[subject] || [];
}

export function getTopicWeightage(subject, topic) {
  const sub = TOPIC_WEIGHTAGE[subject];
  if (!sub) return 0;
  return sub[topic] || 0;
}

export function getExamWeightage(subject) {
  return EXAM_WEIGHTAGE[subject] || 0;
}

export function getSubjectExamOrder() {
  return Object.entries(EXAM_WEIGHTAGE).sort((a, b) => b[1] - a[1]).map(([s]) => s);
}

export function getRecommendedStudyOrder(completedSubjects = []) {
  const order = getSubjectExamOrder();
  const completed = new Set(completedSubjects);
  const remaining = order.filter(s => !completed.has(s));

  return remaining.sort((a, b) => {
    const aPrereqs = getPrerequisites(a).filter(p => !completed.has(p));
    const bPrereqs = getPrerequisites(b).filter(p => !completed.has(p));
    if (aPrereqs.length !== bPrereqs.length) return aPrereqs.length - bPrereqs.length;
    return getExamWeightage(b) - getExamWeightage(a);
  });
}

export function getTopicsBySubject(subject) {
  return Object.keys(TOPIC_WEIGHTAGE[subject] || {});
}

export function getAirKnowledge(category) {
  return AIR_KNOWLEDGE[category] || null;
}

export function getAllAirKnowledge() {
  return AIR_KNOWLEDGE;
}

export function getSubjectConceptualContinuity(subject) {
  return SUBJECT_CONCEPTUAL_CONTINUITY[subject] || { continuesInto: [], reason: '' };
}

export function getSmartSubjectOrder(completedSubjects = []) {
  const completed = new Set(completedSubjects);
  const remaining = AIR_KNOWLEDGE.subjectOrder.recommendedOrder.filter(s => !completed.has(s.subject));
  const paired = AIR_KNOWLEDGE.subjectOrder.conceptualPairing.find(p =>
    p.subjects.some(s => completed.has(s)) && p.subjects.some(s => !completed.has(s))
  );

  return remaining.map((s, i) => {
    const continuity = getSubjectConceptualContinuity(s.subject);
    const followedByCompletion = continuity.continuesInto.filter(cs => completed.has(cs));
    const prereqs = getPrerequisites(s.subject).filter(p => !completed.has(p));
    const pairedContinuity = paired && paired.subjects.includes(s.subject)
      ? { pairedSubject: paired.subjects.find(x => x !== s.subject), reason: paired.reason }
      : null;

    return {
      ...s,
      remainingPrerequisites: prereqs,
      conceptualContinuity: followedByCompletion.length > 0 ? followedByCompletion : null,
      pairedContinuity,
      priorityScore: (prereqs.length === 0 ? 10 : 0) + (getExamWeightage(s.subject) * 0.5) - (i * 0.5),
      estimatedWeeks: s.subject === 'General Aptitude' ? 0 : s.subject === 'Engineering Mathematics' ? 2 : 3,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getResourcesForSubject(subject) {
  return AIR_KNOWLEDGE.recommendedResources[subject] || null;
}

export function getMockPhase(studentState) {
  const completedSubjects = studentState.profile?.completedSubjects?.length || 0;
  const progress = studentState.studyStats?.overallProgress || 0;
  const accuracy = studentState.studyStats?.pyqStats?.overallAccuracy || 0;
  const stages = AIR_KNOWLEDGE.mockStrategy.phases;

  if (completedSubjects >= 11 && progress >= 85) return stages[3];
  if (completedSubjects >= 8 && accuracy >= 70 && progress >= 70) return stages[2];
  if (completedSubjects >= 5 && progress >= 40) return stages[1];
  return stages[0];
}

export function getRevisionSchedule(topic) {
  const p = topic.progress || {};
  const doneCount = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'].filter(k => p[k]).length;
  if (doneCount < 3) return { nextRevisionIn: null, stage: 'incomplete' };

  const completedDate = topic.lastRevised ? new Date(topic.lastRevised).getTime() : Date.now();
  const daysSince = Math.floor((Date.now() - completedDate) / 86400000);
  const intervals = [1, 7, 14, 30, 60];
  const accuracy = p.pyqAccuracy || p.accuracy || 50;

  const adaptiveMultiplier = accuracy > 80 ? 1.5 : accuracy < 40 ? 0.5 : 1;
  const nextInterval = intervals.find(d => daysSince < d * adaptiveMultiplier) || intervals[intervals.length - 1];
  const daysUntilNext = Math.round((nextInterval * adaptiveMultiplier) - daysSince);

  return {
    stage: doneCount >= 8 ? 'completed' : 'in_progress',
    daysSinceCompletion: daysSince,
    nextRevisionIn: daysUntilNext > 0 ? daysUntilNext : 0,
    adaptiveInterval: Math.round(nextInterval * adaptiveMultiplier),
    reason: accuracy > 80
      ? 'High accuracy — extending revision interval to focus on weaker topics.'
      : accuracy < 40
        ? 'Low accuracy — shortening revision interval. Revisit concepts before PYQs.'
        : 'Standard interval based on spaced repetition.',
  };
}

export const TOTAL_SUBJECTS = 11;
export const TOTAL_EXAM_MARKS = 100;
export const GATE_PASSING_MARKS = 25;

const PYQ_PATTERNS = {
  'Programming & Data Structures': { weightage: 10, difficulty: 'Medium', topics: ['Arrays', 'Trees', 'Graphs', 'Linked Lists', 'Stack & Queue'], avgQuestions: 5, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'Algorithms': { weightage: 8, difficulty: 'Hard', topics: ['Dynamic Programming', 'Greedy', 'Graph Algorithms', 'Divide & Conquer', 'Time Complexity'], avgQuestions: 4, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'DBMS': { weightage: 8, difficulty: 'Medium', topics: ['SQL', 'Normalization', 'Transactions', 'ER Diagrams', 'Indexing'], avgQuestions: 4, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'Operating Systems': { weightage: 8, difficulty: 'Medium', topics: ['Process Management', 'Memory Management', 'Synchronization', 'Deadlocks', 'File Systems'], avgQuestions: 4, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'Computer Networks': { weightage: 8, difficulty: 'Medium', topics: ['Network Layer', 'Transport Layer', 'Application Layer', 'Data Link Layer', 'IP Addressing'], avgQuestions: 4, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'Theory of Computation': { weightage: 6, difficulty: 'Hard', topics: ['Turing Machines', 'Regular Languages', 'Context-Free Languages', 'Undecidability'], avgQuestions: 3, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'Compiler Design': { weightage: 6, difficulty: 'Hard', topics: ['Parsing', 'Lexical Analysis', 'Intermediate Code', 'Code Optimization'], avgQuestions: 3, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'Computer Organization': { weightage: 8, difficulty: 'Hard', topics: ['Memory Hierarchy', 'Pipelining', 'ALU & Data Path', 'I/O Organization'], avgQuestions: 4, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'Digital Logic': { weightage: 8, difficulty: 'Easy', topics: ['Boolean Algebra', 'Combinational Circuits', 'Sequential Circuits', 'Logic Gates'], avgQuestions: 4, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'Engineering Mathematics': { weightage: 15, difficulty: 'Easy-Medium', topics: ['Linear Algebra', 'Probability', 'Discrete Mathematics', 'Calculus'], avgQuestions: 7, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
  'General Aptitude': { weightage: 15, difficulty: 'Easy', topics: ['Numerical Ability', 'Verbal Ability', 'Reasoning'], avgQuestions: 10, pyqYears: [2020, 2021, 2022, 2023, 2024, 2025, 2026] },
};

const LEARNING_RESOURCES = {
  'Programming & Data Structures': {
    videos: 'GO Classes C Programming + Data Structures (96 hrs total)',
    notes: 'GO Class notes + Hand-drawn data structure diagrams',
    pdfs: 'Let Us C by Kanetkar, Data Structures by Horowitz',
    playlists: 'GO Classes YouTube: C Programming, DS lectures',
    practice: 'GateOverflow topic-wise sorting, coding questions',
  },
  'Algorithms': {
    videos: 'GO Classes Algorithms (~60 hrs)',
    notes: 'CLRS selective notes + GO Class notes',
    pdfs: 'CLRS reference, GateOverflow algorithm problems',
    playlists: 'GO Classes YouTube: Algorithm Design lectures',
    practice: 'GateOverflow DP, Greedy, Graph problem sets',
  },
  'DBMS': {
    videos: 'GO Classes Databases (~165 hrs across 8 modules)',
    notes: 'GO Class notes, SQL cheat sheet',
    pdfs: 'Korth selective reference, SQL practice problems',
    playlists: 'GO Classes YouTube: DBMS lectures',
    practice: 'Subject-wise PYQs, SQL query writing practice',
  },
  'Operating Systems': {
    videos: 'GO Classes OS (~76 hrs excluding PYQs)',
    notes: 'GO Class notes, process/memory state diagrams',
    pdfs: 'Galvin reference, GateOverflow thread discussions',
    playlists: 'GO Classes YouTube: OS lectures',
    practice: 'Scheduling, deadlock, paging problem sets',
  },
  'Computer Networks': {
    videos: 'GO Classes CN (~77 hrs across 6 modules)',
    notes: 'GO Class notes, IP addressing cheat sheet',
    pdfs: 'Kurose reference, subnetting practice problems',
    playlists: 'GO Classes YouTube: CN lectures',
    practice: 'IP addressing, subnetting, CRC calculation sets',
  },
  'Theory of Computation': {
    videos: 'GO Classes TOC (~157 hrs across 6 modules)',
    notes: 'GO Class notes, automata construction templates',
    pdfs: 'Hopcroft reference, GateOverflow TOC problems',
    playlists: 'GO Classes YouTube: TOC lectures',
    practice: 'Automata construction, grammar conversion problems',
  },
  'Compiler Design': {
    videos: 'GO Classes CD (~47 hrs across 4 modules)',
    notes: 'GO Class notes, parser table templates',
    pdfs: 'Dragon Book selective reference',
    playlists: 'GO Classes YouTube: Compiler Design lectures',
    practice: 'Parsing table construction, SDT problems',
  },
  'Computer Organization': {
    videos: 'GO Classes COA (~69 hrs)',
    notes: 'GO Class notes, pipeline diagram templates',
    pdfs: 'Hamacher reference, numerical practice sets',
    playlists: 'GO Classes YouTube: COA lectures',
    practice: 'Memory hierarchy, pipelining numericals',
  },
  'Digital Logic': {
    videos: 'GO Classes DL (~96 hrs across 5 modules)',
    notes: 'GO Class notes, K-map templates',
    pdfs: 'Morris Mano reference, circuit interpretation',
    playlists: 'GO Classes YouTube: Digital Logic lectures',
    practice: 'Boolean minimization, circuit design problems',
  },
  'Engineering Mathematics': {
    videos: 'GO Classes EM (~66 hrs: Linear Algebra 30h, Probability 28h, Calculus 8-10h)',
    notes: 'GO Class notes, formula compilation',
    pdfs: 'B.S. Grewal reference, 10-math daily problem set',
    playlists: 'GO Classes YouTube: Engineering Maths lectures',
    practice: 'Daily math problem set, subject-wise PYQs',
  },
  'General Aptitude': {
    videos: 'GO Classes Aptitude + RS Aggarwal',
    notes: 'Shortcut formula cards, verbal ability notes',
    pdfs: 'RS Aggarwal — Quantitative Aptitude and Verbal & Non-Verbal Reasoning',
    playlists: 'GO Classes YouTube: Aptitude lectures',
    practice: '30 min daily, previous year GA papers',
  },
};

const MOCK_READINESS_RULES = {
  notReady: { minSubjects: 0, maxSubjects: 4, maxProgress: 39, advice: 'Do NOT take mocks yet. Complete subjects and topic-wise PYQs. Start with topic quizzes.' },
  almostReady: { minSubjects: 5, maxSubjects: 7, minProgress: 40, maxProgress: 69, advice: '1 mock per week. Purpose: identify weak areas, not score. Focus on topic/subject tests first.' },
  ready: { minSubjects: 8, maxSubjects: 10, minProgress: 70, maxProgress: 84, minAccuracy: 70, advice: '2 mocks per week. Analyze every mistake deeply. Create error log. Full-length builds stamina.' },
  mockIntensive: { minSubjects: 11, minProgress: 85, advice: 'Alternate: mock one day, analysis next day. 3-4 mocks per week in last month. Align timing with exam slot.' },
  finalRevision: { minSubjects: 11, minProgress: 95, advice: 'Light revision. No new topics. 2 mocks max. Protect sleep. Review formula sheets and mistake notebook.' },
};

const CONFIDENCE_RULES = {
  byAccuracy: [
    { range: [0, 30], label: 'Very Low', description: 'Conceptual gaps — revisit lecture and notes before attempting more PYQs.' },
    { range: [30, 50], label: 'Low', description: 'Weak foundation — needs concept revision and guided practice.' },
    { range: [50, 70], label: 'Moderate', description: 'Functional understanding — needs more PYQ exposure and mistake analysis.' },
    { range: [70, 85], label: 'Good', description: 'Solid understanding — maintain with regular revision and mock tests.' },
    { range: [85, 100], label: 'Strong', description: 'Exam-ready — focus on speed, accuracy, and avoiding silly mistakes.' },
  ],
  byRevisionFreshness: [
    { daysSince: 0, label: 'Fresh', multiplier: 1.0 },
    { daysSince: 7, label: 'Recent', multiplier: 0.85 },
    { daysSince: 14, label: 'Fading', multiplier: 0.7 },
    { daysSince: 30, label: 'Stale', multiplier: 0.5 },
    { daysSince: 60, label: 'Forgotten', multiplier: 0.3 },
  ],
};

function getConfidenceLabel(accuracy) {
  const rule = CONFIDENCE_RULES.byAccuracy.find(r => accuracy >= r.range[0] && accuracy <= r.range[1]);
  return rule || { label: 'Unknown', description: 'Insufficient data to estimate confidence.' };
}

function getFreshnessMultiplier(daysSinceRevision) {
  const rules = CONFIDENCE_RULES.byRevisionFreshness;
  for (const r of rules) {
    if (daysSinceRevision <= r.daysSince) return r.multiplier;
  }
  return 0.2;
}

function determineMockReadiness(completedSubjects, progress, accuracy) {
  const c = completedSubjects.length || completedSubjects || 0;
  const p = progress || 0;
  const a = accuracy || 0;

  if (c >= 11 && p >= 95) return { ...MOCK_READINESS_RULES.finalRevision, stage: 'Final Revision Phase' };
  if (c >= 11 && p >= 85) return { ...MOCK_READINESS_RULES.mockIntensive, stage: 'Mock Intensive Phase' };
  if (c >= 8 && p >= 70 && a >= 70) return { ...MOCK_READINESS_RULES.ready, stage: 'Ready' };
  if (c >= 5 && p >= 40) return { ...MOCK_READINESS_RULES.almostReady, stage: 'Almost Ready' };
  return { ...MOCK_READINESS_RULES.notReady, stage: 'Not Ready' };
}

export function getPyqPatterns(subject) {
  return PYQ_PATTERNS[subject] || null;
}

export function getLearningResources(subject) {
  return LEARNING_RESOURCES[subject] || null;
}

export function getMockReadiness(completedSubjects, progress, accuracy) {
  return determineMockReadiness(completedSubjects, progress, accuracy);
}

export function estimateTopicConfidence(accuracy, daysSinceRevision) {
  const base = getConfidenceLabel(accuracy || 50);
  const multiplier = getFreshnessMultiplier(daysSinceRevision || 999);
  const score = Math.round(Math.min(100, (accuracy || 50) * multiplier));
  return {
    score,
    label: score >= 85 ? 'Strong' : score >= 70 ? 'Good' : score >= 50 ? 'Moderate' : score >= 30 ? 'Low' : 'Very Low',
    accuracy: accuracy || 50,
    freshnessMultiplier: multiplier,
    daysSinceRevision: daysSinceRevision || 999,
    description: base.description,
  };
}

export function enrichWithAirIntelligence(studentState) {
  const subjects = Object.keys(TOPIC_WEIGHTAGE);
  const completedSubjects = studentState.profile?.completedSubjects || [];
  const analytics = studentState.analytics || {};
  const memory = studentState.memory || {};
  const progress = analytics.coveragePct || studentState.overallProgress || 0;
  const accuracy = analytics.accuracy || studentState.pyqAccuracy || 0;

  const pyqPatterns = {};
  subjects.forEach(s => {
    pyqPatterns[s] = getPyqPatterns(s);
  });

  const mockReadiness = determineMockReadiness(completedSubjects, progress, accuracy);

  const topicConfidence = {};
  (studentState.topics || []).forEach(t => {
    const topicAccuracy = t.progress?.pyqAccuracy || accuracy || 50;
    const lastRevised = t.lastRevised ? Math.floor((Date.now() - new Date(t.lastRevised).getTime()) / 86400000) : 999;
    topicConfidence[t.name] = estimateTopicConfidence(topicAccuracy, lastRevised);
  });

  const learningResources = {};
  (analytics.weakAreas || []).forEach(wa => {
    const resource = getLearningResources(wa.subject || wa);
    if (resource) learningResources[wa.subject || wa] = resource;
  });

  const currentSubject = studentState.currentSubject;
  if (currentSubject && !learningResources[currentSubject]) {
    const resource = getLearningResources(currentSubject);
    if (resource) learningResources[currentSubject] = resource;
  }

  return {
    pyqPatterns,
    mockReadiness,
    topicConfidence,
    learningResources,
    revisionSchedule: AIR_KNOWLEDGE.revisionStrategy,
    examHallStrategy: AIR_KNOWLEDGE.examWeekStrategy,
    timeManagement: AIR_KNOWLEDGE.timeManagement,
    commonMistakesList: AIR_KNOWLEDGE.commonMistakes,
  };
}

export function enrichWithKnowledge(studentState) {
  const subjects = Object.keys(TOPIC_WEIGHTAGE);
  const completedSubjects = studentState.profile?.completedSubjects || [];
  const currentSubject = studentState.currentSubject;

  const remainingSubjects = subjects.filter(s => !completedSubjects.includes(s));
  const suggestedNextSubjects = getRecommendedStudyOrder(completedSubjects).slice(0, 3);

  const subjectPrerequisites = {};
  remainingSubjects.forEach(s => {
    subjectPrerequisites[s] = getPrerequisites(s).filter(p => !completedSubjects.includes(p));
  });

  const currentSubjectTips = currentSubject ? (TOPIC_WEIGHTAGE[currentSubject]
    ? Object.entries(TOPIC_WEIGHTAGE[currentSubject])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([topic, weight]) => ({ topic, weight, tip: `${topic} — ${weight} marks weightage` }))
    : []
  ) : [];

  const examComposition = Object.entries(EXAM_WEIGHTAGE)
    .sort((a, b) => b[1] - a[1])
    .map(([subject, pct]) => {
      const completed = completedSubjects.includes(subject);
      return { subject, weightage: pct, completed };
    });

  const totalCoveredWeightage = examComposition
    .filter(e => e.completed)
    .reduce((s, e) => s + e.weightage, 0);

  return {
    totalSubjects: subjects.length,
    remainingSubjects: remainingSubjects.length,
    suggestedNextSubjects,
    subjectPrerequisites,
    currentSubjectTips,
    examComposition,
    totalCoveredWeightage,
    remainingWeightage: 100 - totalCoveredWeightage,
    recommendedOrder: getRecommendedStudyOrder(completedSubjects),
    smartSubjectOrder: getSmartSubjectOrder(completedSubjects),
    resources: currentSubject ? getResourcesForSubject(currentSubject) : null,
    mockPhase: getMockPhase(studentState),
    commonMistakes: AIR_KNOWLEDGE.commonMistakes,
    studyStrategy: AIR_KNOWLEDGE.studyStrategy,
    dailyRoutine: AIR_KNOWLEDGE.dailyRoutine,
    subjectContinuity: currentSubject ? getSubjectConceptualContinuity(currentSubject) : null,
    airIntelligence: enrichWithAirIntelligence(studentState),
  };
}
