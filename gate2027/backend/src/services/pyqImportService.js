// Legal PYQ import — admins supply their own licensed content via CSV/JSON
const Subject = require('../models/Subject');
const { Topic, PYQ } = require('../models');

const IMPORT_FIELDS = [
  'title', 'subjectCode', 'subjectName', 'topicName', 'year', 'difficulty',
  'marks', 'questionType', 'questionText', 'optionA', 'optionB', 'optionC', 'optionD',
  'correctAnswer', 'explanation', 'tags', 'source', 'paperSet', 'imageUrl',
];

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

function buildOptions(row) {
  const keys = ['a', 'b', 'c', 'd'];
  const options = [];
  keys.forEach((k) => {
    const val = row[`option${k.toUpperCase()}`] || row[`option${k}`];
    if (val) options.push({ key: k.toUpperCase(), text: String(val).trim() });
  });
  return options;
}

function parseCorrectAnswer(raw, questionType) {
  if (!raw && raw !== 0) return null;
  const str = String(raw).trim();
  if (questionType === 'MSQ') {
    return str.split(/[,;|]/).map((s) => s.trim().toUpperCase()).filter(Boolean);
  }
  if (questionType === 'NAT') return parseFloat(str);
  return str.toUpperCase();
}

function normalizeRow(row) {
  const get = (...keys) => {
    for (const k of keys) {
      const val = row[k] ?? row[k?.toLowerCase?.()];
      if (val !== undefined && val !== '') return val;
    }
    return '';
  };

  const questionType = (get('questionType', 'questiontype') || 'MCQ').toUpperCase();
  const difficulty = (get('difficulty') || 'medium').toLowerCase();

  return {
    title: get('title'),
    subjectCode: get('subjectCode', 'subjectcode', 'code'),
    subjectName: get('subjectName', 'subjectname', 'subject'),
    topicName: get('topicName', 'topicname', 'topic'),
    year: parseInt(get('year'), 10),
    difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
    marks: parseInt(get('marks'), 10) || 2,
    questionType: ['MCQ', 'MSQ', 'NAT'].includes(questionType) ? questionType : 'MCQ',
    questionText: get('questionText', 'questiontext', 'question'),
    options: buildOptions(row),
    correctAnswer: parseCorrectAnswer(get('correctAnswer', 'correctanswer', 'answer'), questionType),
    explanation: get('explanation', 'solution'),
    tags: get('tags') ? String(get('tags')).split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : [],
    source: get('source') || 'Admin Import',
    paperSet: get('paperSet', 'paperset') || '',
    imageUrl: get('imageUrl', 'imageurl') || '',
  };
}

async function loadSubjectTopicMaps() {
  const subjects = await Subject.find({ isActive: { $ne: false } });
  const topics = await Topic.find().populate('subject', 'code name');
  const subjectByCode = {};
  const subjectByName = {};
  subjects.forEach((s) => {
    subjectByCode[s.code.toUpperCase()] = s;
    subjectByName[s.name.toLowerCase()] = s;
  });
  const topicByKey = {};
  topics.forEach((t) => {
    const code = t.subject?.code?.toUpperCase() || '';
    topicByKey[`${code}::${t.name.toLowerCase()}`] = t;
    topicByKey[t.name.toLowerCase()] = t;
  });
  return { subjectByCode, subjectByName, topicByKey };
}

function resolveRefs(row, maps) {
  const errors = [];
  let subject = null;
  if (row.subjectCode) subject = maps.subjectByCode[row.subjectCode.toUpperCase()];
  if (!subject && row.subjectName) subject = maps.subjectByName[row.subjectName.toLowerCase()];
  if (!subject) errors.push(`Subject not found: ${row.subjectCode || row.subjectName}`);

  let topic = null;
  if (row.topicName && subject) {
    topic = maps.topicByKey[`${subject.code}::${row.topicName.toLowerCase()}`]
      || maps.topicByKey[row.topicName.toLowerCase()];
    if (!topic) errors.push(`Topic not found: ${row.topicName} (subject ${subject.code})`);
  }

  if (!row.title) errors.push('Title is required');
  if (!row.year || row.year < 1990 || row.year > 2030) errors.push(`Invalid year: ${row.year}`);

  return { subject, topic, errors };
}

async function validateRows(rows, { dryRun = true } = {}) {
  const maps = await loadSubjectTopicMaps();
  const results = rows.map((raw, index) => {
    const row = normalizeRow(raw);
    const { subject, topic, errors } = resolveRefs(row, maps);
    return { index, row, subject, topic, errors, valid: errors.length === 0 };
  });
  const valid = results.filter((r) => r.valid);
  const invalid = results.filter((r) => !r.valid);
  return { valid, invalid, dryRun, total: rows.length };
}

async function importRows(rows, { upsert = false } = {}) {
  const maps = await loadSubjectTopicMaps();
  const inserted = [];
  const skipped = [];
  const failed = [];

  for (let i = 0; i < rows.length; i++) {
    const row = normalizeRow(rows[i]);
    const { subject, topic, errors } = resolveRefs(row, maps);
    if (errors.length) {
      failed.push({ index: i, errors, title: row.title });
      continue;
    }

    const doc = {
      title: row.title,
      subject: subject._id,
      topic: topic?._id,
      year: row.year,
      difficulty: row.difficulty,
      marks: [1, 2].includes(row.marks) ? row.marks : 2,
      questionType: row.questionType,
      questionText: row.questionText,
      options: row.options,
      correctAnswer: row.correctAnswer,
      explanation: row.explanation,
      tags: row.tags,
      source: row.source,
      paperSet: row.paperSet,
      imageUrl: row.imageUrl,
      isActive: true,
    };

    if (upsert) {
      const existing = await PYQ.findOne({ title: row.title, year: row.year, subject: subject._id });
      if (existing) {
        Object.assign(existing, doc);
        await existing.save();
        inserted.push({ index: i, id: existing._id, action: 'updated' });
        continue;
      }
    }

    const created = await PYQ.create(doc);
    inserted.push({ index: i, id: created._id, action: 'created' });
  }

  return { inserted, skipped, failed, total: rows.length };
}

function getImportTemplate() {
  return {
    description: 'Import template for GATE CSE PYQs. Add only content you have legal rights to use.',
    format: 'JSON array or CSV with headers below',
    csvHeaders: IMPORT_FIELDS,
    example: [{
      title: 'Sample: Process Scheduling — FCFS',
      subjectCode: 'OS',
      topicName: 'CPU Scheduling',
      year: 2022,
      difficulty: 'medium',
      marks: 2,
      questionType: 'MCQ',
      questionText: 'In FCFS scheduling, which property holds for non-preemptive systems?',
      optionA: 'Shortest job first',
      optionB: 'Convoy effect may occur',
      optionC: 'Starvation is impossible for I/O bound jobs',
      optionD: 'Priority inversion always happens',
      correctAnswer: 'B',
      explanation: 'FCFS can cause the convoy effect when a long CPU-bound process blocks shorter jobs.',
      tags: 'scheduling,fcfs',
      source: 'Original sample — replace with licensed content',
    }],
    notes: [
      'subjectCode must match seeded subject codes (OS, DS, CN, etc.)',
      'topicName must match an existing topic under that subject',
      'correctAnswer: single letter for MCQ, comma-separated for MSQ (e.g. A,C), number for NAT',
      'Do not scrape copyrighted content — import only legally obtained PYQs',
    ],
  };
}

module.exports = {
  IMPORT_FIELDS,
  parseCsv,
  normalizeRow,
  validateRows,
  importRows,
  getImportTemplate,
  checkAnswer(pyq, selected) {
    if (selected === null || selected === undefined || selected === '') return 'skipped';
    const correct = pyq.correctAnswer;
    if (pyq.questionType === 'MSQ') {
      const sel = Array.isArray(selected) ? selected.map((s) => String(s).toUpperCase()).sort() : [];
      const cor = Array.isArray(correct) ? correct.map((s) => String(s).toUpperCase()).sort() : [];
      return JSON.stringify(sel) === JSON.stringify(cor) ? 'correct' : 'incorrect';
    }
    if (pyq.questionType === 'NAT') {
      const sel = parseFloat(selected);
      const cor = parseFloat(correct);
      if (Number.isNaN(sel) || Number.isNaN(cor)) return 'incorrect';
      return Math.abs(sel - cor) < 0.01 ? 'correct' : 'incorrect';
    }
    return String(selected).toUpperCase() === String(correct).toUpperCase() ? 'correct' : 'incorrect';
  },
};
