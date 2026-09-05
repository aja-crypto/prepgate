// Curated fallback data when external sources are unavailable
const EXAM_SCHEDULE = [
  { eventType: 'application_start', label: 'GATE 2027 Registration Opens', date: '2026-08-25', description: 'Online application portal opens on GOAPS', source: 'GATE Official', sourceUrl: 'https://gate2027.iitd.ac.in/' },
  { eventType: 'application_end', label: 'GATE 2027 Registration Closes', date: '2026-10-10', endDate: '2026-10-17', description: 'Last date with late fee extension', source: 'GATE Official', sourceUrl: 'https://gate2027.iitd.ac.in/' },
  { eventType: 'admit_card', label: 'GATE 2027 Admit Card Release', date: '2027-01-05', description: 'Download from GOAPS portal', source: 'GATE Official', sourceUrl: 'https://gate2027.iitd.ac.in/' },
  { eventType: 'exam', label: 'GATE 2027 Examination', date: '2027-02-07', endDate: '2027-02-15', description: 'Computer Based Test (CBT) – multiple sessions', source: 'GATE Official', sourceUrl: 'https://gate2027.iitd.ac.in/' },
  { eventType: 'answer_key', label: 'GATE 2027 Provisional Answer Key', date: '2027-02-20', description: 'Challenge window opens for 2-3 days', source: 'GATE Official', sourceUrl: 'https://gate2027.iitd.ac.in/' },
  { eventType: 'result', label: 'GATE 2027 Result Declaration', date: '2027-03-19', description: 'Scorecard available on GOAPS', source: 'GATE Official', sourceUrl: 'https://gate2027.iitd.ac.in/' },
  { eventType: 'counseling', label: 'CCMT / COAP Counseling Begins', date: '2027-04-15', description: 'M.Tech admission counseling for NITs/IIITs/CFTIs', source: 'CCMT', sourceUrl: 'https://ccmt.admissions.nic.in/' },
];

const GATE_NOTIFICATIONS = [
  { type: 'gate_notification', category: 'GATE Official', title: 'GATE 2027 – Organizing Institute IIT Delhi', summary: 'IIT Delhi is the organizing institute for GATE 2027. Official website: gate2027.iitd.ac.in', url: 'https://gate2027.iitd.ac.in/', source: 'GATE Official', publishedAt: '2026-01-15' },
  { type: 'gate_notification', category: 'GATE Official', title: 'GATE 2027 Exam Pattern Unchanged', summary: 'GATE 2027 will follow the same CBT pattern with 65 questions (100 marks) including General Aptitude and subject-specific sections.', url: 'https://gate2027.iitd.ac.in/exam-pattern', source: 'GATE Official', publishedAt: '2026-02-01' },
  { type: 'syllabus_update', category: 'CS Syllabus', title: 'GATE CS Syllabus 2027 – No Major Changes', summary: 'The GATE Computer Science syllabus remains consistent with previous years. Focus areas: Algorithms, OS, DBMS, CN, CO, TOC.', url: 'https://gate2027.iitd.ac.in/syllabus', source: 'GATE Official', publishedAt: '2026-02-10' },
  { type: 'gate_notification', category: 'Advisory', title: 'Mock Test Series Available on Official Portal', summary: 'Practice mock tests simulating actual GATE CBT environment are available on the GOAPS portal.', url: 'https://gate2027.iitd.ac.in/', source: 'GATE Official', publishedAt: '2026-05-01' },
];

const PSU_RECRUITMENTS = [
  { type: 'psu_recruitment', category: 'Coal India', title: 'Coal India Limited – Management Trainee (CSE) 2026', summary: 'Recruitment through GATE 2026 score. Apply via CIL career portal.', url: 'https://www.coalindia.in/careers/', source: 'Coal India', publishedAt: '2026-03-01' },
  { type: 'psu_recruitment', category: 'ONGC', title: 'ONGC Graduate Trainee – Computer Science', summary: 'GATE score based recruitment for E1 level posts in ONGC.', url: 'https://ongcindia.com/wps/wcm/connect/en/career/', source: 'ONGC', publishedAt: '2026-03-15' },
  { type: 'psu_recruitment', category: 'IOCL', title: 'Indian Oil – Officers through GATE', summary: 'Recruitment of Officers/Engineers through GATE score in relevant disciplines.', url: 'https://iocl.com/latest-job-openings', source: 'IOCL', publishedAt: '2026-04-01' },
  { type: 'psu_recruitment', category: 'HPCL', title: 'HPCL Engineer Recruitment via GATE', summary: 'Hindustan Petroleum recruitment for Engineers through valid GATE score.', url: 'https://www.hindustanpetroleum.com/careers', source: 'HPCL', publishedAt: '2026-04-10' },
  { type: 'psu_recruitment', category: 'BPCL', title: 'BPCL Management Trainee – IT/CSE', summary: 'Bharat Petroleum GATE-based recruitment for IT stream.', url: 'https://www.bharatpetroleum.in/Career-Opportunities.aspx', source: 'BPCL', publishedAt: '2026-04-15' },
  { type: 'psu_recruitment', category: 'BARC', title: 'BARC OCES/DGFS – Scientific Officer', summary: 'BARC recruitment through GATE for Scientific Officer posts.', url: 'https://www.barc.gov.in/careers/', source: 'BARC', publishedAt: '2026-02-20' },
  { type: 'psu_recruitment', category: 'DRDO', title: 'DRDO Scientist B Recruitment', summary: 'DRDO recruits Scientists through GATE score in relevant engineering streams.', url: 'https://www.drdo.gov.in/careers', source: 'DRDO', publishedAt: '2026-03-20' },
  { type: 'psu_recruitment', category: 'ISRO', title: 'ISRO Scientist/Engineer SC – Computer Science', summary: 'ISRO Centralised Recruitment Board (ICRB) through GATE.', url: 'https://www.isro.gov.in/Careers', source: 'ISRO', publishedAt: '2026-04-05' },
  { type: 'psu_recruitment', category: 'NIELIT', title: 'NIELIT Scientist B – IT/CSE', summary: 'National Institute of Electronics & IT recruitment through GATE.', url: 'https://www.nielit.gov.in/content/recruitment', source: 'NIELIT', publishedAt: '2026-05-01' },
];

const MTECH_ADMISSIONS = [
  { type: 'mtech_admission', category: 'IIT', title: 'IIT Bombay M.Tech Admission 2027', summary: 'Admission through GATE score + COAP. Apply via IITB admissions portal.', url: 'https://www.iitb.ac.in/new/en/admissions/m-tech-admissions', source: 'IIT Bombay', publishedAt: '2026-03-25' },
  { type: 'mtech_admission', category: 'IIT', title: 'IIT Delhi M.Tech / MS(R) Admission', summary: 'GATE-qualified candidates can apply for M.Tech programs at IIT Delhi.', url: 'https://home.iitd.ac.in/admissions.php', source: 'IIT Delhi', publishedAt: '2026-03-25' },
  { type: 'mtech_admission', category: 'IIT', title: 'IIT Madras M.Tech Admission Portal Open', summary: 'Online application for M.Tech/MS/PhD through GATE score.', url: 'https://www.iitm.ac.in/admissions', source: 'IIT Madras', publishedAt: '2026-04-01' },
  { type: 'mtech_admission', category: 'NIT', title: 'CCMT 2027 – Centralized Counseling', summary: 'CCMT for admission to NITs, IIEST, IIITM, and other CFTIs through GATE.', url: 'https://ccmt.admissions.nic.in/', source: 'CCMT', publishedAt: '2026-04-15' },
  { type: 'mtech_admission', category: 'IIIT', title: 'IIIT Hyderabad PG Admissions', summary: 'M.Tech admissions through GATE score. Separate application on IIIT-H portal.', url: 'https://www.iiit.ac.in/admissions/', source: 'IIIT Hyderabad', publishedAt: '2026-04-10' },
  { type: 'mtech_admission', category: 'DAU/DAIICT', title: 'DA-IICT M.Tech CSE Admission', summary: 'Dhirubhai Ambani Institute M.Tech admission through GATE.', url: 'https://www.daiict.ac.in/admissions', source: 'DA-IICT', publishedAt: '2026-04-20' },
];

const INTERNSHIPS = [
  { type: 'internship', category: 'CSE Internship', title: 'Google Summer of Code 2027', summary: 'Open source internship program for students. Applications typically open in March.', url: 'https://summerofcode.withgoogle.com/', source: 'Google', publishedAt: '2026-03-01' },
  { type: 'internship', category: 'CSE Internship', title: 'Microsoft Engage Mentorship Program', summary: 'Mentorship and project-based internship for 2nd year CSE students.', url: 'https://careers.microsoft.com/students/', source: 'Microsoft', publishedAt: '2026-04-01' },
  { type: 'internship', category: 'CSE Internship', title: 'Amazon WOW Internship', summary: 'Women of Wisdom internship program for pre-final year CSE students.', url: 'https://www.amazon.jobs/en/teams/internships-for-students', source: 'Amazon', publishedAt: '2026-04-15' },
  { type: 'internship', category: 'CSE Internship', title: 'ISRO Student Internship Programme', summary: 'Internship opportunities at ISRO centres for engineering students.', url: 'https://www.isro.gov.in/Careers', source: 'ISRO', publishedAt: '2026-05-01' },
];

const PLACEMENT_RESOURCES = [
  { type: 'placement_resource', category: 'Interview Prep', title: 'LeetCode GATE + Placement Track', summary: 'Curated problem lists combining GATE concepts with placement interview prep.', url: 'https://leetcode.com/explore/', source: 'LeetCode', publishedAt: '2026-05-01' },
  { type: 'placement_resource', category: 'Resume', title: 'GATE + Campus Placement Resume Templates', summary: 'Resume formats highlighting GATE rank and technical projects for PSU/campus placements.', url: 'https://overleaf.com', source: 'Overleaf', publishedAt: '2026-05-10' },
  { type: 'placement_resource', category: 'Aptitude', title: 'GATE General Aptitude + Placement Aptitude', summary: 'Combined aptitude preparation covering verbal, quantitative, and logical reasoning.', url: 'https://www.indiabix.com/', source: 'IndiaBIX', publishedAt: '2026-05-15' },
];

const STUDY_MATERIALS = [
  { type: 'study_material', category: 'NPTEL', title: 'NPTEL – Design & Analysis of Algorithms', summary: 'Complete video course aligned with GATE Algorithms syllabus.', url: 'https://nptel.ac.in/courses/106106131/', source: 'NPTEL', publishedAt: '2026-01-01' },
  { type: 'study_material', category: 'Notes', title: 'GateOverflow – CSE Notes Collection', summary: 'Community-curated notes and discussions for all GATE CS subjects.', url: 'https://gateoverflow.in/', source: 'GateOverflow', publishedAt: '2026-01-01' },
  { type: 'study_material', category: 'Practice', title: 'GeeksforGeeks GATE CS Corner', summary: 'Topic-wise practice questions and previous year solutions.', url: 'https://www.geeksforgeeks.org/gate-cs-notes-gq/', source: 'GeeksforGeeks', publishedAt: '2026-02-01' },
];

const RSS_FEEDS = [
  { url: 'https://gateoverflow.in/feed', source: 'GateOverflow', type: 'rss' },
  { url: 'https://www.geeksforgeeks.org/feed/', source: 'GeeksforGeeks', type: 'rss' },
];

const TOPIC_WEIGHTAGE = [
  { subject: 'Algorithms', data: [
    { topic: 'Dynamic Programming', weight: 8.5, count: 17, years: [2010, 2024] },
    { topic: 'Graph Algorithms', weight: 7.2, count: 14, years: [2010, 2024] },
    { topic: 'Greedy Algorithms', weight: 5.8, count: 11, years: [2010, 2024] },
    { topic: 'Sorting & Searching', weight: 5.0, count: 10, years: [2010, 2024] },
    { topic: 'Divide & Conquer', weight: 4.2, count: 8, years: [2010, 2024] },
  ]},
  { subject: 'Operating Systems', data: [
    { topic: 'Process Scheduling', weight: 7.5, count: 15, years: [2010, 2024] },
    { topic: 'Deadlock', weight: 6.8, count: 13, years: [2010, 2024] },
    { topic: 'Memory Management', weight: 6.0, count: 12, years: [2010, 2024] },
    { topic: 'Synchronization', weight: 5.5, count: 11, years: [2010, 2024] },
    { topic: 'Paging & Virtual Memory', weight: 5.0, count: 10, years: [2010, 2024] },
  ]},
  { subject: 'DBMS', data: [
    { topic: 'SQL Queries', weight: 8.0, count: 16, years: [2010, 2024] },
    { topic: 'Normalization', weight: 6.5, count: 13, years: [2010, 2024] },
    { topic: 'Transaction & Concurrency', weight: 6.0, count: 12, years: [2010, 2024] },
    { topic: 'Indexing (B/B+ Trees)', weight: 5.5, count: 11, years: [2010, 2024] },
    { topic: 'ER Model & Relational Algebra', weight: 5.0, count: 10, years: [2010, 2024] },
  ]},
  { subject: 'Computer Networks', data: [
    { topic: 'TCP/IP & Transport Layer', weight: 7.0, count: 14, years: [2010, 2024] },
    { topic: 'Routing Algorithms', weight: 6.0, count: 12, years: [2010, 2024] },
    { topic: 'Data Link Layer', weight: 5.5, count: 11, years: [2010, 2024] },
    { topic: 'Application Layer (HTTP/DNS)', weight: 5.0, count: 10, years: [2010, 2024] },
    { topic: 'Network Security', weight: 4.5, count: 9, years: [2010, 2024] },
  ]},
  { subject: 'Computer Organization', data: [
    { topic: 'Pipelining', weight: 7.5, count: 15, years: [2010, 2024] },
    { topic: 'Cache Memory', weight: 6.8, count: 13, years: [2010, 2024] },
    { topic: 'Instruction Set Architecture', weight: 5.5, count: 11, years: [2010, 2024] },
    { topic: 'Memory Hierarchy', weight: 5.0, count: 10, years: [2010, 2024] },
    { topic: 'I/O Organization', weight: 4.0, count: 8, years: [2010, 2024] },
  ]},
  { subject: 'Theory of Computation', data: [
    { topic: 'Regular Expressions & FA', weight: 6.5, count: 13, years: [2010, 2024] },
    { topic: 'Context-Free Grammars', weight: 6.0, count: 12, years: [2010, 2024] },
    { topic: 'Turing Machines', weight: 5.5, count: 11, years: [2010, 2024] },
    { topic: 'Decidability', weight: 5.0, count: 10, years: [2010, 2024] },
    { topic: 'NP-Completeness', weight: 4.5, count: 9, years: [2010, 2024] },
  ]},
];

const MARKS_DISTRIBUTION = [
  { subject: 'Algorithms', marks: 12, percentage: 17.1 },
  { subject: 'Operating Systems', marks: 10, percentage: 14.3 },
  { subject: 'DBMS', marks: 10, percentage: 14.3 },
  { subject: 'Computer Networks', marks: 8, percentage: 11.4 },
  { subject: 'Computer Organization', marks: 8, percentage: 11.4 },
  { subject: 'Engineering Mathematics', marks: 7, percentage: 10.0 },
  { subject: 'Theory of Computation', marks: 6, percentage: 8.6 },
  { subject: 'Compiler Design', marks: 5, percentage: 7.1 },
  { subject: 'Digital Logic', marks: 4, percentage: 5.7 },
];

const FREQUENT_TOPICS = [
  { topic: 'Dynamic Programming', subject: 'Algorithms', frequency: 17, lastAsked: 2024 },
  { topic: 'Process Scheduling', subject: 'Operating Systems', frequency: 15, lastAsked: 2024 },
  { topic: 'Pipelining', subject: 'Computer Organization', frequency: 15, lastAsked: 2023 },
  { topic: 'SQL Queries', subject: 'DBMS', frequency: 16, lastAsked: 2024 },
  { topic: 'TCP/IP', subject: 'Computer Networks', frequency: 14, lastAsked: 2024 },
  { topic: 'Deadlock', subject: 'Operating Systems', frequency: 13, lastAsked: 2023 },
  { topic: 'Normalization', subject: 'DBMS', frequency: 13, lastAsked: 2024 },
  { topic: 'Graph Algorithms', subject: 'Algorithms', frequency: 14, lastAsked: 2024 },
  { topic: 'Regular Expressions', subject: 'TOC', frequency: 13, lastAsked: 2023 },
  { topic: 'Cache Memory', subject: 'Computer Organization', frequency: 13, lastAsked: 2024 },
];

const REPEATED_QUESTIONS = [
  { topic: 'Banker\'s Algorithm', subject: 'Operating Systems', timesRepeated: 5, years: [2014, 2016, 2019, 2021, 2023] },
  { topic: 'Dijkstra\'s Algorithm', subject: 'Algorithms', timesRepeated: 6, years: [2012, 2015, 2017, 2019, 2021, 2024] },
  { topic: '2NF/3NF/BCNF', subject: 'DBMS', timesRepeated: 5, years: [2013, 2016, 2018, 2020, 2022] },
  { topic: 'Sliding Window Protocol', subject: 'Computer Networks', timesRepeated: 4, years: [2015, 2018, 2021, 2024] },
  { topic: 'Hazard Types in Pipelining', subject: 'Computer Organization', timesRepeated: 5, years: [2012, 2015, 2018, 2021, 2023] },
];

const IMPORTANT_TOPICS = [
  { topic: 'Dynamic Programming', subject: 'Algorithms', trend: 'rising', priority: 'high' },
  { topic: 'Process Scheduling', subject: 'Operating Systems', trend: 'stable', priority: 'high' },
  { topic: 'SQL & Joins', subject: 'DBMS', trend: 'stable', priority: 'high' },
  { topic: 'Pipelining Hazards', subject: 'Computer Organization', trend: 'stable', priority: 'high' },
  { topic: 'Minimum Spanning Tree', subject: 'Algorithms', trend: 'rising', priority: 'medium' },
  { topic: 'Transaction Serializability', subject: 'DBMS', trend: 'rising', priority: 'medium' },
  { topic: 'Congestion Control', subject: 'Computer Networks', trend: 'stable', priority: 'medium' },
  { topic: 'NP-Completeness', subject: 'TOC', trend: 'rising', priority: 'medium' },
];

const DAILY_THEORIES = [
  { subject: 'Operating Systems', topic: 'Process Scheduling', title: 'Round Robin vs SRTF', content: 'Round Robin uses a fixed time quantum and is fair but may have higher context switch overhead. SRTF (Shortest Remaining Time First) is preemptive SJF – optimal for average waiting time but can cause starvation of long processes.' },
  { subject: 'Algorithms', topic: 'Dynamic Programming', title: 'Optimal Substructure Property', content: 'A problem has optimal substructure if an optimal solution contains optimal solutions to its subproblems. DP applies when subproblems overlap – memoization (top-down) or tabulation (bottom-up) avoids recomputation.' },
  { subject: 'DBMS', topic: 'Normalization', title: 'BCNF vs 3NF', content: '3NF eliminates transitive dependencies. BCNF is stricter: every determinant must be a candidate key. A relation in BCNF is always in 3NF, but not vice versa. Decomposition into BCNF may lose dependency preservation.' },
  { subject: 'Computer Networks', topic: 'TCP', title: 'TCP Congestion Control', content: 'TCP uses slow start (exponential window growth), congestion avoidance (linear growth), fast retransmit (3 duplicate ACKs), and fast recovery. AIMD ensures fair bandwidth sharing across flows.' },
  { subject: 'Computer Organization', topic: 'Pipelining', title: 'Pipeline Hazards', content: 'Structural hazards: resource conflicts. Data hazards: RAW, WAR, WAW dependencies – solved by forwarding/bypassing or stalling. Control hazards: branch misprediction – solved by branch prediction and delayed branching.' },
  { subject: 'TOC', topic: 'Regular Languages', title: 'Pumping Lemma for Regular Languages', content: 'If L is regular, there exists pumping length p such that any string s in L with |s| ≥ p can be written as s=xyz where |xy|≤p, |y|≥1, and xyⁱz ∈ L for all i≥0. Used to prove languages are NOT regular.' },
  { subject: 'Compiler Design', topic: 'Parsing', title: 'LL vs LR Parsing', content: 'LL parsers are top-down, left-to-right, leftmost derivation. LR parsers are bottom-up, handle rightmost derivation in reverse. LR parsers handle more grammars but are harder to construct manually.' },
];

const DAILY_QUESTIONS = [
  { subject: 'Operating Systems', topic: 'Deadlock', title: 'Banker\'s Algorithm', content: 'Consider a system with 3 processes and 3 resource types. Given Available = (3,3,2), Allocation matrix, and Max matrix – determine if the system is in a safe state.', explanation: 'Apply Banker\'s algorithm: find a safe sequence where each process can finish with currently available resources.' },
  { subject: 'Algorithms', topic: 'Graphs', title: 'Shortest Path', content: 'Apply Dijkstra\'s algorithm on the given weighted graph from source A to find shortest distances to all vertices.', explanation: 'Relax edges in order of increasing distance from source. Cannot handle negative weights.' },
  { subject: 'DBMS', topic: 'SQL', title: 'Join Query', content: 'Write SQL to find employees who earn more than their department average salary using a correlated subquery or window function.', explanation: 'SELECT e.name FROM emp e WHERE e.salary > (SELECT AVG(salary) FROM emp WHERE dept_id = e.dept_id)' },
  { subject: 'Computer Networks', topic: 'TCP', title: 'Sliding Window', content: 'Given window size 4, RTT 100ms, and packet size 1KB – calculate throughput and determine when the sender must wait for ACK.', explanation: 'Throughput = window size / RTT. Sender waits when unacknowledged packets equal window size.' },
];

const DAILY_FORMULAS = [
  { subject: 'Engineering Mathematics', topic: 'Probability', title: 'Bayes\' Theorem', content: 'P(A|B) = P(B|A) × P(A) / P(B)', explanation: 'Used for conditional probability problems – very common in GATE aptitude and CS probability questions.' },
  { subject: 'Computer Organization', topic: 'Cache', title: 'Average Memory Access Time', content: 'AMAT = Hit Time + Miss Rate × Miss Penalty', explanation: 'Fundamental formula for cache performance analysis questions.' },
  { subject: 'Computer Networks', topic: 'Bandwidth', title: 'Shannon Capacity', content: 'C = B × log₂(1 + S/N) bits/sec', explanation: 'Maximum channel capacity given bandwidth B and signal-to-noise ratio.' },
  { subject: 'Algorithms', topic: 'Complexity', title: 'Master Theorem', content: 'T(n) = aT(n/b) + f(n) → compare f(n) with n^(log_b a) to determine Θ bound', explanation: 'Used to solve recurrence relations for divide-and-conquer algorithms.' },
  { subject: 'Operating Systems', topic: 'Paging', title: 'Effective Access Time', content: 'EAT = (1-p) × Memory Access + p × Page Fault Time', explanation: 'p = page fault rate. Page fault time includes disk access for page swap.' },
];

const DAILY_PYQS = [
  { subject: 'Operating Systems', topic: 'Deadlock', title: 'GATE 2022 – Deadlock Detection', content: 'Given a resource allocation graph, determine if the system has deadlock and identify processes in the deadlock cycle.', explanation: 'Build wait-for graph from allocation/request matrices. Cycle in wait-for graph indicates deadlock.', metadata: { year: 2022, difficulty: 'medium' } },
  { subject: 'DBMS', topic: 'B+ Trees', title: 'GATE 2023 – B+ Tree Operations', content: 'After inserting keys into a B+ tree of order 5, determine the resulting tree structure and number of node splits.', explanation: 'B+ tree: all keys in leaves, internal nodes only guide search. Split when node exceeds max keys.', metadata: { year: 2023, difficulty: 'hard' } },
  { subject: 'Algorithms', topic: 'Dynamic Programming', title: 'GATE 2021 – 0/1 Knapsack', content: 'Given items with weights and values, find maximum value that fits in knapsack of capacity W using DP.', explanation: 'dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i]). Space can be optimized to O(W).', metadata: { year: 2021, difficulty: 'medium' } },
  { subject: 'Computer Organization', topic: 'Pipelining', title: 'GATE 2023 – Pipeline Hazards', content: 'Identify data hazards in the given 5-stage pipeline instruction sequence and compute CPI with/without forwarding.', explanation: 'RAW hazards need forwarding or stalling. CPI = 1 + stall cycles / total instructions.', metadata: { year: 2023, difficulty: 'medium' } },
];

module.exports = {
  EXAM_SCHEDULE,
  GATE_NOTIFICATIONS,
  PSU_RECRUITMENTS,
  MTECH_ADMISSIONS,
  INTERNSHIPS,
  PLACEMENT_RESOURCES,
  STUDY_MATERIALS,
  RSS_FEEDS,
  TOPIC_WEIGHTAGE,
  MARKS_DISTRIBUTION,
  FREQUENT_TOPICS,
  REPEATED_QUESTIONS,
  IMPORTANT_TOPICS,
  DAILY_THEORIES,
  DAILY_QUESTIONS,
  DAILY_FORMULAS,
  DAILY_PYQS,
};
