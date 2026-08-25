// GATE Intelligence Service
// Detects subject/topic, queries PYQ database for verified stats,
// and provides context to the AI prompt so it never hallucinates data.
// All statistics are DATABASE-DERIVED — never invented by the LLM.

const { detectSubjectTopic } = require('./questionParser');
const GATE_SYLLABUS = require('../data/gateSyllabus');

// ─── Intent Classification ────────────────────────────────────
// Classifies the user's current message intent so the AI can adapt
// its response style (concise vs comprehensive, GATE-aware vs generic).

const INTENT_PATTERNS = {
  greeting: [
    /^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening|howdy|namaste|greetings)\b/i,
    /^(how are you|what's up|what's good|sup)\b/i,
  ],
  simpleFactual: [
    /^(what is|what are|what does|what do you mean by|define|who is|who was|when was|where is)\b/i,
    /^(is |are |do |does |can |could |would |should )/i,
  ],
  conceptExplanation: [
    /^(explain|tell me about|describe|how does|how do|how does .+ work|teach me|walk me through|elaborate on|deep dive into)\b/i,
    /^(give me an overview|give me a summary|introduce me to|what do you know about)\b/i,
  ],
  gateQuestion: [
    /gate/i,
    /gate 20\d{2}/i,
    /gate cse/i,
    /for gate/i,
    /gate exam/i,
    /gate syllabus/i,
  ],
  pyqRequest: [
    /(previous year|pyq|past year|past paper|question paper|old paper)/i,
    /(give me|show me|solve|what are|can you solve).*\b(pyq|previous year)\b/i,
    /(pyq|previous year|past year).*\b(solve|solution|answer|explanation)\b/i,
  ],
  numericalProblem: [
    /(calculate|compute|solve|find the|what is the value of|numerical|problem)/i,
    /(formula|derivation|proof|show that)/i,
  ],
  doubtClarification: [
    /(i don't understand|i'm confused|i don't get|can you clarify|what do you mean|why is|why does|why do)/i,
    /(can you explain again|that's not clear|still unclear|how come|but why)/i,
  ],
  revision: [
    /(revise|revision|review|quick recap|summary|quick notes|short notes|key points)/i,
    /(what should i revise|what are the key|important points|things to remember)/i,
  ],
  studyPlanning: [
    /(what should i study|study plan|schedule|timetable|daily plan|weekly plan|how to prepare)/i,
    /(how many hours|how long|what order|which subject first|preparation strategy)/i,
  ],
  performance: [
    /(weak|strong|accuracy|progress|how am i doing|performance|score|rank|prediction)/i,
    /(mock|test result|my stats|my progress|how many|what's my)/i,
  ],
  examStrategy: [
    /(strategy|approach|tips|tricks|how to crack|how to score|time management|last month)/i,
    /(exam day|day before|how to attempt|paper attempting)/i,
  ],
};

function classifyIntent(message) {
  const lower = message.toLowerCase().trim();
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const p of patterns) {
      if (p.test(lower)) return intent;
    }
  }
  return 'ambiguous';
}

// ─── PYQ Statistics Lookup ────────────────────────────────────
// Queries the PYQ database for verified statistics about a subject/topic.
// Returns null if DB is unavailable or no data exists.

async function getTopicPYQStats(subjectCode, topicName) {
  try {
    const { PYQ } = require('../models');
    const Subject = require('../models/Subject');
    const { isMongoConnected } = require('../config/db');

    if (!isMongoConnected() || !PYQ?.aggregate) return null;

    // Find the subject
    const subjectDoc = await Subject.findOne({
      $or: [
        { code: subjectCode },
        { name: { $regex: subjectCode, $options: 'i' } },
      ],
    }).lean();

    if (!subjectDoc) return null;

    // Build match filter — PYQ model uses ObjectId refs
    const matchFilter = { subject: subjectDoc._id, isActive: { $ne: false } };

    // Aggregate stats
    const result = await PYQ.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byYear: { $addToSet: '$year' },
          byDifficulty: { $push: '$difficulty' },
          byType: { $push: '$questionType' },
          oneMark: { $sum: { $cond: [{ $eq: ['$marks', 1] }, 1, 0] } },
          twoMark: { $sum: { $cond: [{ $eq: ['$marks', 2] }, 1, 0] } },
        },
      },
    ]);

    if (!result || result.length === 0) return null;

    const data = result[0];
    const years = [...data.byYear].sort((a, b) => b - a);
    const recentYear = years[0] || null;

    // Count difficulty distribution
    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
    for (const d of data.byDifficulty) {
      if (difficultyCounts[d] !== undefined) difficultyCounts[d]++;
    }

    // Count question type distribution
    const typeCounts = { MCQ: 0, MSQ: 0, NAT: 0 };
    for (const t of data.byType) {
      if (typeCounts[t] !== undefined) typeCounts[t]++;
    }

    // Determine typical difficulty
    const maxDiff = Object.entries(difficultyCounts).sort((a, b) => b[1] - a[1])[0];
    const typicalDifficulty = maxDiff[0] || 'medium';

    // Estimate historical marks (assuming 1-mark × count + 2-mark × count × 2)
    const historicalMarks = (data.oneMark * 1) + (data.twoMark * 2);

    return {
      total: data.total,
      years,
      recentYear,
      oneMark: data.oneMark,
      twoMark: data.twoMark,
      historicalMarks,
      typicalDifficulty,
      difficultyCounts,
      typeCounts,
    };
  } catch (e) {
    console.error('[GATE Intelligence] PYQ stats query failed:', e.message);
    return null;
  }
}

// ─── Subject Info Lookup ──────────────────────────────────────
// Returns verified subject-level info from gateSyllabus.js

function getSubjectInfo(subjectCode) {
  const info = GATE_SYLLABUS[subjectCode];
  if (!info) return null;
  return {
    code: subjectCode,
    name: info.name,
    weightage: info.weightage,
    marksRange: info.marksRange,
    isHighPriority: info.isHighPriority,
    frequentlyAsked: info.frequentlyAsked || [],
    importantFormulas: info.importantFormulas || [],
  };
}

// ─── Full GATE Context Builder ────────────────────────────────
// Main entry point: given a user message and optional student context,
// detects subject/topic, queries DB for verified stats, and returns
// a structured context block to inject into the system prompt.

async function getGATEContext(message, studentContext) {
  const intent = classifyIntent(message);
  const detection = detectSubjectTopic(message);

  // If no academic topic detected, return minimal context
  if (!detection.subject) {
    return { intent, hasTopic: false, subjectCode: null, topicName: null, stats: null };
  }

  const subjectCode = detection.subject;
  const subjectName = detection.subjectName || detection.subject;
  const topicName = detection.topic || null;

  // Get verified stats from database
  const stats = await getTopicPYQStats(subjectCode, topicName);

  // Get subject-level info from syllabus
  const subjectInfo = getSubjectInfo(subjectCode);

  // Build the verified context
  const context = {
    intent,
    hasTopic: true,
    subjectCode,
    subjectName,
    topicName,
    subjectInfo,
    stats,
  };

  // Determine relevance level based on data
  if (stats) {
    const highThreshold = stats.total >= 5;
    const mediumThreshold = stats.total >= 2;
    context.relevance = highThreshold ? 'HIGH' : mediumThreshold ? 'MEDIUM' : 'LOW';
  } else {
    context.relevance = subjectInfo?.isHighPriority ? 'HIGH' : 'MEDIUM';
  }

  return context;
}

// ─── Prompt Context Formatter ─────────────────────────────────
// Formats the verified GATE context into a text block that can be
// injected into the system prompt. Only includes data that is actually
// available — never fabricates statistics.

function formatGATEContextPrompt(context) {
  if (!context || !context.hasTopic) return '';

  const lines = [];

  lines.push(`## Verified GATE Intelligence (Database-Derived)`);
  lines.push(`- Subject: ${context.subjectName} (${context.subjectCode})`);
  if (context.topicName) {
    lines.push(`- Topic: ${context.topicName}`);
  }
  lines.push(`- GATE relevance: ${context.relevance}`);

  // Subject-level weightage from syllabus
  if (context.subjectInfo) {
    lines.push(`- Typical marks in GATE: ${context.subjectInfo.marksRange} (${context.subjectInfo.weightage}% of paper)`);
    if (context.subjectInfo.isHighPriority) {
      lines.push(`- Priority subject: YES`);
    }
  }

  // PYQ database stats (only if available)
  if (context.stats) {
    const s = context.stats;
    lines.push(`\n### PYQ Database Statistics`);
    lines.push(`- Total PYQs analyzed: ${s.total}`);
    if (s.years.length > 0) {
      lines.push(`- Years appearing: ${s.years.join(', ')}`);
    }
    if (s.recentYear) {
      lines.push(`- Most recent appearance: ${s.recentYear}`);
    }
    lines.push(`- 1-mark questions: ${s.oneMark}`);
    lines.push(`- 2-mark questions: ${s.twoMark}`);
    lines.push(`- Historical marks total: ${s.historicalMarks}`);
    lines.push(`- Typical difficulty: ${s.typicalDifficulty}`);
    if (s.typeCounts) {
      const types = Object.entries(s.typeCounts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (types) lines.push(`- Question types: ${types}`);
    }
    lines.push(`- Source: GateNexa PYQ dataset`);
  } else {
    lines.push(`\n### PYQ Database Statistics`);
    lines.push(`- PYQ frequency data not yet available for this topic.`);
    lines.push(`- Source: GateNexa (no data)`);
  }

  // Frequently asked subtopics (from syllabus, NOT invented)
  if (context.subjectInfo?.frequentlyAsked?.length > 0) {
    lines.push(`\n### Frequently Asked Subtopics`);
    for (const fa of context.subjectInfo.frequentlyAsked.slice(0, 5)) {
      lines.push(`- ${fa}`);
    }
  }

  return lines.join('\n');
}

// ─── Next Action Generator ────────────────────────────────────
// Generates ONE contextual next action based on intent, topic, and student data.
// Never generates "Would you like me to explain more?" — always specific.

function generateNextAction(context, studentContext) {
  const { intent, subjectName, topicName, relevance } = context || {};

  // If weak in this topic (from student data)
  const weakSubjects = studentContext?.weakSubjects || [];
  const isWeak = weakSubjects.some(w =>
    w.toLowerCase().includes((subjectName || '').toLowerCase()) ||
    (subjectName || '').toLowerCase().includes(w.toLowerCase())
  );

  if (isWeak) {
    return `**Nexa recommendation:** Your accuracy in ${subjectName || 'this topic'} is below average. Revise the core concepts before attempting more questions.`;
  }

  switch (intent) {
    case 'conceptExplanation':
      return `**Next best step:** Solve PYQs on ${topicName || subjectName || 'this topic'} to test your understanding.`;
    case 'gateQuestion':
      return `**Quick check:** Can you solve a GATE-level problem on ${topicName || subjectName || 'this topic'} now?`;
    case 'pyqRequest':
      return `**Next:** Try another question at the same difficulty level.`;
    case 'numericalProblem':
      return `**Next:** Verify your answer and try a variation with different values.`;
    case 'doubtClarification':
      return `**Study tip:** Spend 10 minutes on ${topicName || subjectName || 'this topic'} notes, then retry.`;
    case 'revision':
      return `**After revision:** Attempt 3 PYQs on ${topicName || subjectName || 'this topic'} to check retention.`;
    case 'studyPlanning':
      return `**Suggested time:** Spend 45–60 minutes on ${subjectName || 'this topic'} today.`;
    case 'performance':
      return `**Nexa recommendation:** Focus on your weakest subject first, then build confidence with PYQs.`;
    case 'examStrategy':
      return `**Tip:** Prioritize high-weightage subjects and solve PYQs under timed conditions.`;
    default:
      return `**Next step:** Practice 5 ${topicName || subjectName || ''} PYQs to solidify your understanding.`;
  }
}

module.exports = {
  classifyIntent,
  getGATEContext,
  formatGATEContextPrompt,
  getTopicPYQStats,
  getSubjectInfo,
  generateNextAction,
};
