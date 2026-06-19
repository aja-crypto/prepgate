const mongoose = require('mongoose');

const questions = [
  // Q1-5: Aptitude
  { question: 'A train travels 120 km in 2 hours. Its average speed is:', options: ['40 km/h', '50 km/h', '60 km/h', '80 km/h'], correctAnswer: 2, explanation: 'Average speed = Total distance / Total time = 120/2 = 60 km/h', subject: 'APT', topic: 'Speed and Distance', importanceScore: 8, difficulty: 'easy' },
  { question: 'If 20% of a number is 50, the number is:', options: ['200', '250', '300', '150'], correctAnswer: 1, explanation: '20% of x = 50 => x = 50 * 100 / 20 = 250', subject: 'APT', topic: 'Percentages', importanceScore: 8, difficulty: 'easy' },
  { question: 'Average of 5, 10, 15, 20, 25 is:', options: ['10', '12', '15', '18'], correctAnswer: 2, explanation: 'Sum = 75, Count = 5, Average = 75/5 = 15', subject: 'APT', topic: 'Averages', importanceScore: 9, difficulty: 'easy' },
  { question: 'Find the next number: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '36'], correctAnswer: 1, explanation: 'Pattern: n*(n+1) => 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30, 6*7=42', subject: 'APT', topic: 'Series and Patterns', importanceScore: 7, difficulty: 'medium' },
  { question: 'A work is completed by 10 people in 20 days. How many days for 20 people?', options: ['5 days', '10 days', '15 days', '40 days'], correctAnswer: 1, explanation: 'Work = 10*20 = 200 man-days. With 20 people: 200/20 = 10 days', subject: 'APT', topic: 'Work and Time', importanceScore: 8, difficulty: 'medium' },
  // Q6-10: Engineering Mathematics
  { question: 'What is the derivative of x²?', options: ['x', '2x', 'x²', '2x²'], correctAnswer: 1, explanation: 'd/dx(x²) = 2x (power rule: d/dx(x^n) = n*x^(n-1))', subject: 'MA', topic: 'Calculus - Differentiation', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is the integral ∫1 dx?', options: ['1', 'x', 'x + C', '0'], correctAnswer: 2, explanation: '∫1 dx = x + C, where C is the constant of integration', subject: 'MA', topic: 'Calculus - Integration', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is the determinant of the identity matrix |1 0; 0 1|?', options: ['0', '1', '2', 'undefined'], correctAnswer: 1, explanation: 'Determinant of 2x2 identity matrix = (1*1) - (0*0) = 1', subject: 'MA', topic: 'Linear Algebra - Determinants', importanceScore: 7, difficulty: 'easy' },
  { question: 'What is the rank of an n×n identity matrix?', options: ['0', '1', 'n-1', 'n'], correctAnswer: 3, explanation: 'The rank of an n×n identity matrix is n (full rank, all rows/columns are linearly independent)', subject: 'MA', topic: 'Linear Algebra - Rank', importanceScore: 6, difficulty: 'medium' },
  { question: 'What is the probability of getting Head once in one coin toss?', options: ['1', '1/2', '1/4', '0'], correctAnswer: 1, explanation: 'A fair coin has 2 equally likely outcomes (H, T). Probability of Head = 1/2', subject: 'MA', topic: 'Probability', importanceScore: 8, difficulty: 'easy' },
  // Q11-15: Discrete Mathematics
  { question: 'Number of subsets of a set with 4 elements?', options: ['4', '8', '16', '32'], correctAnswer: 2, explanation: 'Number of subsets = 2^n = 2^4 = 16 (including empty set)', subject: 'DS', topic: 'Set Theory', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is 5! (5 factorial)?', options: ['20', '60', '120', '240'], correctAnswer: 2, explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120', subject: 'DS', topic: 'Combinatorics', importanceScore: 9, difficulty: 'easy' },
  { question: 'A graph with no cycles is called:', options: ['Complete', 'Tree', 'Bipartite', 'Eulerian'], correctAnswer: 1, explanation: 'A connected acyclic graph is called a Tree. It has n vertices and n-1 edges.', subject: 'DS', topic: 'Graph Theory', importanceScore: 7, difficulty: 'easy' },
  { question: 'Maximum edges in a complete graph with 4 vertices?', options: ['4', '6', '8', '12'], correctAnswer: 1, explanation: 'Maximum edges in complete graph Kn = n(n-1)/2 = 4*3/2 = 6', subject: 'DS', topic: 'Graph Theory - Complete Graphs', importanceScore: 8, difficulty: 'medium' },
  { question: 'What is the binary representation of decimal 10?', options: ['1001', '1010', '1100', '1110'], correctAnswer: 1, explanation: '10 in binary: 1010 (8+0+2+0). Verification: 1*8 + 0*4 + 1*2 + 0*1 = 10', subject: 'DS', topic: 'Number Systems', importanceScore: 9, difficulty: 'easy' },
  // Q16-20: Digital Logic
  { question: 'How many select lines are required for an 8:1 MUX?', options: ['2', '3', '4', '8'], correctAnswer: 1, explanation: 'For 2^n inputs, n select lines are needed. 8 = 2^3, so 3 select lines', subject: 'CO', topic: 'Multiplexers', importanceScore: 8, difficulty: 'easy' },
  { question: 'How many outputs does a decoder have with 3 inputs?', options: ['3', '6', '8', '16'], correctAnswer: 2, explanation: 'An n-input decoder has 2^n outputs. With 3 inputs: 2^3 = 8 outputs', subject: 'CO', topic: 'Decoders', importanceScore: 8, difficulty: 'easy' },
  { question: 'Which gate is called the Universal Gate?', options: ['NOT', 'AND', 'NAND', 'XOR'], correctAnswer: 2, explanation: 'NAND gate is universal because any Boolean function can be implemented using only NAND gates', subject: 'CO', topic: 'Logic Gates', importanceScore: 9, difficulty: 'easy' },
  { question: 'What is the output of 1 AND 0?', options: ['0', '1', 'Invalid', 'Both 0 and 1'], correctAnswer: 0, explanation: 'AND operation: 1 AND 0 = 0 (result is 1 only if both inputs are 1)', subject: 'CO', topic: 'Logic Gates - AND', importanceScore: 9, difficulty: 'easy' },
  { question: 'How many bits are represented by one hexadecimal digit?', options: ['2', '4', '8', '16'], correctAnswer: 1, explanation: 'One hex digit represents 4 binary bits (0-F = 0000-1111 in binary)', subject: 'CO', topic: 'Number Systems - Hexadecimal', importanceScore: 9, difficulty: 'easy' },
];

async function seed() {
  const fs = require('fs');
  const envContent = fs.readFileSync('./.env', 'utf8');
  const mongoUri = envContent.match(/MONGO_URI=(.+)/)?.[1];
  if (!mongoUri) { console.error('MONGO_URI not found'); process.exit(1); }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Load models
  const GateVault = require('../models/GateVault');
  const { Flashcard, MonthlySet } = GateVault;

  // Clear existing flashcards and monthly sets
  await Flashcard.deleteMany({});
  await MonthlySet.deleteMany({});
  console.log('Cleared existing data');

  // Insert all questions
  const created = await Flashcard.insertMany(questions);
  console.log(`Inserted ${created.length} flashcards`);

  // Create a monthly set with all 20 questions
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
      'APT': 5,
      'MA': 5,
      'DS': 5,
      'CO': 5,
    }
  });
  console.log(`Created monthly set: ${monthlySet.name}`);
  console.log('Done!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });