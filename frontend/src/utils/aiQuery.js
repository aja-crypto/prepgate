// Lightweight natural-language intent parser for the Learning Hub search.
// Understands queries like "Show OS videos", "DBMS revision",
// "Compiler PYQs", "Best TOC lectures", "Videos under 30 minutes".

import { SUBJECT_WEIGHTAGE } from './gateUtils';

const SUBJECT_ALIASES = {
  'operating system': 'Operating Systems',
  'operating systems': 'Operating Systems',
  os: 'Operating Systems',
  'computer network': 'Computer Networks',
  'computer networks': 'Computer Networks',
  cn: 'Computer Networks',
  dbms: 'DBMS',
  database: 'DBMS',
  'computer organization': 'Computer Organization',
  coa: 'Computer Organization',
  'theory of computation': 'Theory of Computation',
  toc: 'Theory of Computation',
  automata: 'Theory of Computation',
  'compiler design': 'Compiler Design',
  compiler: 'Compiler Design',
  algorithm: 'Algorithms',
  algorithms: 'Algorithms',
  ds: 'Programming & Data Structures',
  'data structure': 'Programming & Data Structures',
  'data structures': 'Programming & Data Structures',
  programming: 'Programming & Data Structures',
  'engineering mathematics': 'Engineering Mathematics',
  maths: 'Engineering Mathematics',
  mathematics: 'Engineering Mathematics',
  math: 'Engineering Mathematics',
  'digital logic': 'Digital Logic',
  aptitude: 'General Aptitude',
  'general aptitude': 'General Aptitude',
};

const TYPE_KEYWORDS = {
  revision: ['revision', 'revise', 'review', 'one shot', 'oneshot', 'maha'],
  pyq: ['pyq', 'previous year', 'practice questions', 'questions'],
  mock: ['mock', 'test series', 'mock test'],
  roadmap: ['roadmap', 'strategy', 'plan', 'schedule', 'preparation'],
  story: ['topper', 'air 1', 'success story', 'interview', 'journey'],
  motivation: ['motivation', 'inspiring', 'discipline', 'consistency'],
  notes: ['notes', 'short notes', 'summary'],
  lecture: ['lecture', 'tutorial', 'classes', 'course', 'series'],
};

/** Parse a query string into structured intents (subject, type, action). */
export function parseAiQuery(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return { subject: null, type: null, raw: q };

  let subject = null;
  let bestLen = 0;
  for (const [alias, canonical] of Object.entries(SUBJECT_ALIASES)) {
    // match alias as a whole word or prefix-with-boundary
    if (new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i').test(q) && alias.length > bestLen) {
      subject = canonical;
      bestLen = alias.length;
    }
  }

  let type = null;
  for (const [t, kws] of Object.entries(TYPE_KEYWORDS)) {
    if (kws.some((k) => new RegExp(`(^|\\s)${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i').test(q))) {
      type = t;
      break;
    }
  }

  // "videos" alone → no type (any video)
  const isVideoQuery = /\b(videos?|watch)\b/.test(q);

  // duration intent: "under 30 minutes"
  let durationMax = null;
  const dur = q.match(/under\s+(\d+)\s*(min|minutes|mins)/);
  if (dur) durationMax = parseInt(dur[1], 10);

  return { subject, type, isVideoQuery, durationMax, raw: q };
}

/** Build a human-readable summary of the parsed intent. */
export function describeAiQuery(parsed) {
  const parts = [];
  if (parsed.subject) parts.push(parsed.subject);
  if (parsed.type === 'revision') parts.push('revision');
  if (parsed.type === 'pyq') parts.push('PYQs');
  if (parsed.type === 'mock') parts.push('mock tests');
  if (parsed.type === 'roadmap') parts.push('roadmaps');
  if (parsed.type === 'story') parts.push('success stories');
  if (parsed.type === 'motivation') parts.push('motivation');
  if (parsed.type === 'notes') parts.push('notes');
  if (parsed.type === 'lecture') parts.push('lectures');
  if (parsed.durationMax) parts.push(`under ${parsed.durationMax} min`);
  return parts.length ? parts.join(' · ') : 'All content';
}

export function weightageOf(subject) {
  return SUBJECT_WEIGHTAGE[subject] ?? null;
}
