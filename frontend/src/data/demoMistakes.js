function svgDataUri(subject, topic, color) {
  const label = `${subject}${topic ? ' — ' + topic : ''}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect width="400" height="250" fill="${color}"/><text x="200" y="125" text-anchor="middle" font-family="sans-serif" font-size="22" fill="rgba(255,255,255,0.15)" font-weight="bold">${subject}</text><text x="200" y="155" text-anchor="middle" font-family="sans-serif" font-size="13" fill="rgba(255,255,255,0.08)">${topic || ''}</text><rect x="160" y="100" width="80" height="50" rx="8" fill="rgba(255,255,255,0.04)"/><text x="200" y="130" text-anchor="middle" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.1)">Q</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${svg.replace(/#/g, '%23').replace(/\n\s*/g, ' ')}`;
}

export const DEMO_MISTAKES = [
  {
    _id: 'demo-1',
    subject: 'Operating Systems',
    topic: 'Deadlock',
    mistakeType: 'concept_mistake',
    learning: 'Confused deadlock prevention with avoidance. Prevention ensures at least one condition fails, while avoidance uses Banker\'s algorithm.',
    reason: 'Deadlock prevention breaks one of the 4 conditions. Avoidance uses safe state checking via Banker\'s algorithm.',
    questionImage: svgDataUri('Operating Systems', 'Deadlock', '#1a1a2e'),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    resolved: false,
  },
  {
    _id: 'demo-2',
    subject: 'DBMS',
    topic: 'Normalization',
    mistakeType: 'silly_mistake',
    learning: 'Marked 3NF instead of BCNF. Forgot that BCNF requires every determinant to be a candidate key.',
    reason: 'BCNF: For every FD X → Y, X must be a superkey. 3NF allows prime attribute on RHS.',
    questionImage: svgDataUri('DBMS', 'Normalization', '#2d1b3e'),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    resolved: true,
  },
  {
    _id: 'demo-3',
    subject: 'Computer Networks',
    topic: 'TCP/IP',
    mistakeType: 'calculation_mistake',
    learning: 'Calculated throughput wrong. Used window size without considering RTT correctly.',
    reason: 'Throughput = Window Size / RTT. For selective repeat, window size = 2^(m-1).',
    questionImage: svgDataUri('Computer Networks', 'TCP/IP', '#1a2e2e'),
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    resolved: false,
  },
  {
    _id: 'demo-4',
    subject: 'Theory of Computation',
    topic: 'DFA/NFA',
    mistakeType: 'guess_mistake',
    learning: "Guessed the language incorrectly. The DFA accepts strings where every 'a' is followed by a 'b', not strings with equal a and b.",
    reason: "L = { w | every 'a' in w is immediately followed by a 'b' }. This means no two consecutive a's.",
    questionImage: svgDataUri('Theory of Computation', 'DFA/NFA', '#2e1a2e'),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    resolved: false,
  },
  {
    _id: 'demo-5',
    subject: 'Engineering Mathematics',
    topic: 'Linear Algebra',
    mistakeType: 'time_management',
    learning: 'Spent too long on Eigenvalues. Should have used properties: trace = sum of eigenvalues, det = product.',
    reason: 'For quick eigenvalue problems: trace(A) = λ₁ + λ₂ + ... + λn, det(A) = λ₁ × λ₂ × ... × λn.',
    questionImage: svgDataUri('Engineering Mathematics', 'Linear Algebra', '#1e2e2e'),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    resolved: false,
  },
  {
    _id: 'demo-6',
    subject: 'Computer Organization',
    topic: 'Pipeline',
    mistakeType: 'revision_mistake',
    learning: 'Forgot how to calculate CPI for pipelined processor with stalls. Missed the branch penalty calculation.',
    reason: 'CPI_pipeline = 1 + stall_cycles_per_instruction. For branches: CPI += branch_frequency × branch_penalty.',
    questionImage: svgDataUri('Computer Organization', 'Pipeline', '#1a1a3e'),
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    resolved: true,
  },
];