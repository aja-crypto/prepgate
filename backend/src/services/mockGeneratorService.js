// Generate mock tests from stored PYQ bank
const Subject = require('../models/Subject');
const { PYQ } = require('../models');

const GATE_SUBJECT_WEIGHTS = {
  EM: 12.5, DL: 5, CO: 8.5, DS: 11.5, AL: 7.5, OS: 9, DB: 8, CN: 8.5, TOC: 8, CD: 5, APT: 15,
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildFilter(config = {}) {
  const filter = { isActive: { $ne: false } };
  if (config.subjects?.length) filter.subject = { $in: config.subjects };
  if (config.topics?.length) filter.topic = { $in: config.topics };
  if (config.years?.length) filter.year = { $in: config.years };
  if (config.difficulties?.length) filter.difficulty = { $in: config.difficulties };
  return filter;
}

async function pickQuestions(config, count) {
  const filter = buildFilter(config);
  const pool = await PYQ.find(filter).select('_id marks difficulty subject topic year');
  if (!pool.length) return [];

  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((q, i) => ({
    pyq: q._id,
    order: i + 1,
    marks: q.marks || 2,
  }));
}

async function generateFullLengthMock() {
  const subjects = await Subject.find({ isActive: { $ne: false } });
  const codeMap = {};
  subjects.forEach((s) => { codeMap[s.code] = s._id; });

  const targetCount = 65;
  const questions = [];
  const usedIds = new Set();

  for (const [code, weight] of Object.entries(GATE_SUBJECT_WEIGHTS)) {
    const subjectId = codeMap[code];
    if (!subjectId) continue;
    const subjectCount = Math.max(1, Math.round((weight / 100) * targetCount));
    const pool = await PYQ.find({ subject: subjectId, isActive: { $ne: false } }).select('_id marks');
    const picked = shuffle(pool.filter((q) => !usedIds.has(q._id.toString()))).slice(0, subjectCount);
    picked.forEach((q) => {
      usedIds.add(q._id.toString());
      questions.push({ pyq: q._id, order: questions.length + 1, marks: q.marks || 2 });
    });
  }

  // Fill remaining from any subject if bank is sparse
  if (questions.length < targetCount) {
    const extra = await PYQ.find({ isActive: { $ne: false }, _id: { $nin: [...usedIds] } }).limit(targetCount - questions.length);
    extra.forEach((q) => {
      questions.push({ pyq: q._id, order: questions.length + 1, marks: q.marks || 2 });
    });
  }

  return shuffle(questions).map((q, i) => ({ ...q, order: i + 1 }));
}

async function generateMock(config) {
  const type = config.type || 'custom';
  const count = config.count || 10;

  let questions = [];
  let name = config.name;
  let durationMinutes = config.durationMinutes;

  switch (type) {
    case 'full':
      questions = await generateFullLengthMock();
      name = name || 'Full-Length GATE Mock';
      durationMinutes = durationMinutes || 180;
      break;
    case 'topic':
      questions = await pickQuestions(config, count);
      name = name || `Topic Mock (${count} Qs)`;
      durationMinutes = durationMinutes || Math.ceil(count * 3);
      break;
    case 'subject':
      questions = await pickQuestions(config, count);
      name = name || `Subject Mock (${count} Qs)`;
      durationMinutes = durationMinutes || Math.ceil(count * 3);
      break;
    case 'year':
      questions = await pickQuestions(config, count);
      name = name || `Year ${config.years?.[0] || ''} Mock`.trim();
      durationMinutes = durationMinutes || Math.ceil(count * 3);
      break;
    default:
      questions = await pickQuestions(config, count);
      name = name || `Custom Mock (${count} Qs)`;
      durationMinutes = durationMinutes || Math.ceil(count * 3);
  }

  const maxScore = questions.reduce((s, q) => s + (q.marks || 2), 0);

  return {
    name,
    type,
    config: {
      subjects: config.subjects || [],
      topics: config.topics || [],
      years: config.years || [],
      difficulties: config.difficulties || [],
      count: questions.length,
      durationMinutes,
    },
    questions,
    maxScore,
  };
}

module.exports = { generateMock, pickQuestions, generateFullLengthMock };
