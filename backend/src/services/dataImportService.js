const CcmtCutoff = require('../models/CcmtCutoff');
const CoapCutoff = require('../models/CoapCutoff');
const SeatMatrix = require('../models/SeatMatrix');
const BranchStatistics = require('../models/BranchStatistics');
const GateStatistics = require('../models/GateStatistics');
const GateMarksScore = require('../models/GateMarksScore');
const GateScoreRank = require('../models/GateScoreRank');
const GateRankPercentile = require('../models/GateRankPercentile');
const GateCutoff = require('../models/GateCutoff');
const GateRankData = require('../models/GateRankData');
const GateScoreData = require('../models/GateScoreData');
const PsuRequirement = require('../models/PsuRequirement');
const PsuRecruitment = require('../models/PsuRecruitment');
const CollegeProgram = require('../models/CollegeProgram');

// ─── Type Detection ───────────────────────────────────────────────

function detectDatasetType(data) {
  if (!Array.isArray(data) || data.length === 0) return 'unknown';
  const sample = data[0];
  const keys = Object.keys(sample || {}).map(k => k.toLowerCase());

  // CCMT Cutoff detection
  if ((keys.some(k => k.includes('institute') || k.includes('college'))) &&
      (keys.some(k => k.includes('program') || k.includes('branch') || k.includes('course'))) &&
      (keys.some(k => k.includes('closing') || k.includes('cutoff') || k.includes('score'))) &&
      (keys.some(k => k.includes('category') || k.includes('caste')))) {
    return 'ccmt_cutoff';
  }

  // COAP Cutoff detection
  if ((keys.some(k => k.includes('institute') || k.includes('college'))) &&
      (keys.some(k => k.includes('offer') || k.includes('round'))) &&
      (keys.some(k => k.includes('closing') || k.includes('cutoff')))) {
    return 'coap_cutoff';
  }

  // Seat Matrix detection
  if ((keys.some(k => k.includes('institute') || k.includes('college'))) &&
      (keys.some(k => k.includes('seat') || k.includes('total') || k.includes('capacity'))) &&
      (keys.some(k => k.includes('program') || k.includes('branch')))) {
    return 'seat_matrix';
  }

  // Gate Marks→Score
  if (keys.some(k => k.includes('marks')) && keys.some(k => k.includes('score')) &&
      (keys.some(k => k.includes('year') || k.includes('paper')))) {
    return 'gate_marks_score';
  }

  // Gate Score→Rank
  if ((keys.some(k => k.includes('score') || k.includes('gate_score'))) && keys.some(k => k.includes('rank'))) {
    return 'gate_score_rank';
  }

  // Gate Rank→Percentile
  if (keys.some(k => k.includes('rank')) && keys.some(k => k.includes('percentile'))) {
    return 'gate_rank_percentile';
  }

  // Gate Statistics
  if (keys.some(k => k.includes('candidate') || k.includes('appeared') || k.includes('registered'))) {
    return 'gate_statistics';
  }

  // Gate Cutoff
  if ((keys.some(k => k.includes('qualifying') || k.includes('cutoff'))) && keys.some(k => k.includes('category'))) {
    return 'gate_cutoff';
  }

  // Gate Rank Data
  if (keys.some(k => k.includes('marks')) && keys.some(k => k.includes('rank')) && !keys.some(k => k.includes('percentile'))) {
    return 'gate_rank_data';
  }

  // Gate Score Data
  if (keys.some(k => k.includes('score')) && keys.some(k => k.includes('rank')) && !keys.some(k => k.includes('marks'))) {
    return 'gate_score_data';
  }

  // PSU Requirement
  if ((keys.some(k => k.includes('psu') || k.includes('recruitment'))) ||
      (keys.some(k => k.includes('cutoff')) && keys.some(k => k.includes('name')))) {
    return 'psu_requirement';
  }

  // Branch Statistics
  if (keys.some(k => k.includes('branch')) &&
      (keys.some(k => k.includes('avg') || k.includes('average')))) {
    return 'branch_statistics';
  }

  // College Program
  if ((keys.some(k => k.includes('name') || k.includes('college') || k.includes('institute'))) &&
      (keys.some(k => k.includes('type') || k.includes('nirf')))) {
    return 'college_program';
  }

  return 'unknown';
}

// ─── Validation ───────────────────────────────────────────────────

function validateDataset(type, data) {
  const errors = [];
  const warnings = [];

  data.forEach((row, i) => {
    const r = row;
    if (!r || typeof r !== 'object') {
      errors.push({ row: i, message: 'Invalid row format' });
      return;
    }

    switch (type) {
      case 'ccmt_cutoff':
        if (!r.institute && !r.college) errors.push({ row: i, message: 'Missing institute/college name' });
        if (!r.year && !r.Year) errors.push({ row: i, message: 'Missing year' });
        if (r.closingScore == null && r.ClosingScore == null && r.closing_rank == null) errors.push({ row: i, message: 'Missing closing score/rank' });
        if (!r.category && !r.Category) errors.push({ row: i, message: 'Missing category' });
        if (!r.program && !r.Program && !r.branch) errors.push({ row: i, message: 'Missing program/branch' });
        break;
      case 'gate_marks_score':
        if (r.marks == null) errors.push({ row: i, message: 'Missing marks' });
        if (r.score == null) errors.push({ row: i, message: 'Missing score' });
        break;
      case 'gate_score_rank':
        if (r.score == null) errors.push({ row: i, message: 'Missing score' });
        if (r.rank == null) errors.push({ row: i, message: 'Missing rank' });
        break;
      case 'seat_matrix':
        if (!r.institute && !r.college) errors.push({ row: i, message: 'Missing institute/college' });
        if (r.totalSeats == null && r.total_seats == null) warnings.push({ row: i, message: 'No total seats value' });
        break;
      case 'gate_cutoff':
        if (!r.category && !r.Category) errors.push({ row: i, message: 'Missing category' });
        if (r.qualifyingMarks == null && r.qualifying_marks == null) errors.push({ row: i, message: 'Missing qualifying marks' });
        break;
      default:
        if (Object.keys(r).length === 0) errors.push({ row: i, message: 'Empty row' });
    }
  });

  return { errors, warnings, valid: errors.length === 0, totalRows: data.length, errorCount: errors.length, warningCount: warnings.length };
}

// ─── Normalize Column Names ──────────────────────────────────────

const COLUMN_MAP = {
  'college': 'institute', 'college_name': 'institute', 'college name': 'institute',
  'institute_name': 'institute', 'institute name': 'institute', 'university': 'institute',
  'program': 'program', 'Program': 'program', 'branch': 'program', 'course': 'program',
  'specialization': 'specialization', 'Specialization': 'specialization',
  'category': 'category', 'Category': 'category', 'caste': 'category', 'Caste': 'category',
  'year': 'year', 'Year': 'year', 'YEAR': 'year',
  'round': 'round', 'Round': 'round',
  'closing_score': 'closingScore', 'closing score': 'closingScore',
  'closing_rank': 'closingRank', 'closing rank': 'closingRank',
  'opening_score': 'openingScore', 'opening score': 'openingScore',
  'opening_rank': 'openingRank', 'opening rank': 'openingRank',
  'total_seats': 'totalSeats', 'total seats': 'totalSeats', 'seats': 'totalSeats',
  'institute_type': 'instituteType', 'institute type': 'instituteType',
  'qualifying_marks': 'qualifyingMarks', 'qualifying marks': 'qualifyingMarks',
  'qualifying_percentile': 'qualifyingPercentile',
  'quota': 'quota', 'Quota': 'quota',
  'state': 'state', 'State': 'state',
  'marks': 'marks', 'Marks': 'marks',
  'score': 'score', 'Score': 'score',
  'rank': 'rank', 'Rank': 'rank',
  'percentile': 'percentile', 'Percentile': 'percentile',
  'total_candidates': 'totalCandidates',
  'cutoff_score': 'cutoffScore', 'cutoff score': 'cutoffScore',
  'cutoff_rank': 'cutoffRank',
  'total_posts': 'totalPosts',
  'offer_round': 'offerRound', 'round_no': 'offerRound',
  'avg_score': 'avgScore', 'average_score': 'avgScore',
  'median_score': 'medianScore',
  'vacancy': 'vacancy', 'vacancy_rate': 'vacancyRate',
};

function normalizeRow(row, year) {
  const normalized = {};
  for (const [key, val] of Object.entries(row)) {
    const mapped = COLUMN_MAP[key.trim()] || key;
    normalized[mapped] = val;
  }
  if (year && !normalized.year) normalized.year = year;
  return normalized;
}

// ─── Import Dispatcher ────────────────────────────────────────────

async function importDataset(type, data, options = {}) {
  const validation = validateDataset(type, data);
  if (!validation.valid && !options.force) {
    return { success: false, ...validation };
  }

  const year = options.year || null;
  const paper = options.paper || 'CS';

  let inserted = 0;
  let errors = [];

  try {
    switch (type) {
      case 'ccmt_cutoff': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            institute: n.institute || n.college || '',
            instituteType: n.instituteType || n.institute_type || 'Other',
            program: n.program || '',
            specialization: n.specialization || '',
            category: n.category || 'General',
            round: parseInt(n.round) || 1,
            openingScore: parseFloat(n.openingScore) || null,
            closingScore: parseFloat(n.closingScore) || null,
            openingRank: parseInt(n.openingRank) || null,
            closingRank: parseInt(n.closingRank) || null,
            seats: parseInt(n.totalSeats) || parseInt(n.seats) || null,
            quota: n.quota || 'AI',
            state: n.state || '',
            source: 'admin',
          };
        }).filter(d => d.institute && d.program && d.closingScore);
        if (docs.length > 0) {
          await CcmtCutoff.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'coap_cutoff': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            institute: n.institute || '',
            instituteType: n.instituteType || 'Other',
            program: n.program || '',
            specialization: n.specialization || '',
            category: n.category || 'General',
            offerRound: parseInt(n.offerRound) || 1,
            openingScore: parseFloat(n.openingScore) || null,
            closingScore: parseFloat(n.closingScore) || null,
            seats: parseInt(n.seats) || null,
            filledSeats: parseInt(n.filledSeats) || null,
            vacancy: parseInt(n.vacancy) || null,
            source: 'admin',
          };
        }).filter(d => d.institute && d.closingScore);
        if (docs.length > 0) {
          await CoapCutoff.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'seat_matrix': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            institute: n.institute || '',
            instituteType: n.instituteType || 'Other',
            program: n.program || '',
            specialization: n.specialization || '',
            totalSeats: parseInt(n.totalSeats) || 0,
            seatsByCategory: {
              General: parseInt(n.General) || parseInt(n.general) || 0,
              EWS: parseInt(n.EWS) || parseInt(n.ews) || 0,
              'OBC-NCL': parseInt(n['OBC-NCL']) || parseInt(n.obc_ncl) || parseInt(n.obc) || 0,
              SC: parseInt(n.SC) || parseInt(n.sc) || 0,
              ST: parseInt(n.ST) || parseInt(n.st) || 0,
              PwD: parseInt(n.PwD) || parseInt(n.pwd) || 0,
            },
            source: 'admin',
          };
        }).filter(d => d.institute && d.program);
        if (docs.length > 0) {
          await SeatMatrix.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'gate_marks_score': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            paper: paper,
            marks: parseFloat(n.marks),
            score: parseFloat(n.score),
            source: 'admin',
          };
        }).filter(d => d.marks != null && d.score != null);
        if (docs.length > 0) {
          await GateMarksScore.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'gate_score_rank': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            paper: paper,
            score: parseFloat(n.score),
            rank: parseInt(n.rank),
            source: 'admin',
          };
        }).filter(d => d.score != null && d.rank != null);
        if (docs.length > 0) {
          await GateScoreRank.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'gate_rank_percentile': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            paper: paper,
            rank: parseInt(n.rank),
            percentile: parseFloat(n.percentile),
            source: 'admin',
          };
        }).filter(d => d.rank != null && d.percentile != null);
        if (docs.length > 0) {
          await GateRankPercentile.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'gate_statistics': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            paper: paper,
            totalCandidates: parseInt(n.totalCandidates) || null,
            totalRegistered: parseInt(n.totalRegistered) || null,
            totalAppeared: parseInt(n.totalAppeared) || null,
            meanMarks: parseFloat(n.meanMarks) || null,
            medianMarks: parseFloat(n.medianMarks) || null,
            stdDev: parseFloat(n.stdDev) || null,
            highestMarks: parseFloat(n.highestMarks) || null,
            qualifyingMarks: parseFloat(n.qualifyingMarks) || null,
            qualifyingPercentile: parseFloat(n.qualifyingPercentile) || null,
            source: 'admin',
          };
        }).filter(d => d.year);
        if (docs.length > 0) {
          await GateStatistics.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'gate_cutoff': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            paper: paper,
            category: n.category || 'General',
            qualifyingMarks: parseFloat(n.qualifyingMarks) || null,
            qualifyingPercentile: parseFloat(n.qualifyingPercentile) || null,
            totalCandidates: parseInt(n.totalCandidates) || null,
            source: 'admin',
          };
        }).filter(d => d.qualifyingMarks != null);
        if (docs.length > 0) {
          await GateCutoff.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'gate_rank_data': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            paper: paper,
            marks: parseFloat(n.marks),
            rank: parseInt(n.rank),
            percentile: parseFloat(n.percentile) || null,
            totalCandidates: parseInt(n.totalCandidates) || null,
            source: 'admin',
          };
        }).filter(d => d.marks != null && d.rank != null);
        if (docs.length > 0) {
          await GateRankData.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'gate_score_data': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            paper: paper,
            score: parseFloat(n.score),
            rank: parseInt(n.rank),
            percentile: parseFloat(n.percentile) || null,
            source: 'admin',
          };
        }).filter(d => d.score != null && d.rank != null);
        if (docs.length > 0) {
          await GateScoreData.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'psu_requirement': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            name: n.name || n.psu || '',
            shortName: n.shortName || n.short_name || '',
            type: 'PSU',
            year: parseInt(n.year) || year,
            paper: paper,
            category: n.category || 'General',
            cutoffScore: parseFloat(n.cutoffScore) || null,
            cutoffRank: parseInt(n.cutoffRank) || null,
            totalPosts: parseInt(n.totalPosts) || parseInt(n.posts) || null,
            discipline: n.discipline || '',
            location: n.location || '',
            source: 'admin',
          };
        }).filter(d => d.name && d.cutoffScore);
        if (docs.length > 0) {
          await PsuRequirement.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'branch_statistics': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            year: parseInt(n.year) || year,
            branch: n.branch || n.program || n.name || '',
            category: n.category || 'General',
            avgScore: parseFloat(n.avgScore) || null,
            medianScore: parseFloat(n.medianScore) || null,
            minScore: parseFloat(n.minScore) || null,
            maxScore: parseFloat(n.maxScore) || null,
            totalSeats: parseInt(n.totalSeats) || null,
            filledSeats: parseInt(n.filledSeats) || null,
            vacancyRate: parseFloat(n.vacancyRate) || null,
            source: 'admin',
          };
        }).filter(d => d.branch);
        if (docs.length > 0) {
          await BranchStatistics.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      case 'college_program': {
        const docs = data.map(r => {
          const n = normalizeRow(r, year);
          return {
            name: n.name || n.college || n.institute || '',
            shortName: n.shortName || n.short_name || '',
            type: n.type || n.instituteType || 'Other',
            location: n.location || '',
            state: n.state || '',
            website: n.website || '',
            nirfRanking: parseInt(n.nirfRanking) || parseInt(n.nirf_ranking) || null,
            isActive: true,
          };
        }).filter(d => d.name && d.type);
        if (docs.length > 0) {
          await CollegeProgram.insertMany(docs, { ordered: false });
          inserted = docs.length;
        }
        break;
      }

      default:
        return { success: false, message: `Unknown dataset type: ${type}`, valid: false };
    }
  } catch (e) {
    errors.push({ message: e.message });
  }

  return { success: true, valid: true, inserted, errors, totalRows: data.length };
}

// ─── Preview dataset ──────────────────────────────────────────────

function previewDataset(type, data) {
  const validation = validateDataset(type, data);
  return {
    type,
    totalRows: data.length,
    sample: data.slice(0, 5),
    ...validation,
    columns: data.length > 0 ? Object.keys(data[0]) : [],
  };
}

module.exports = { detectDatasetType, validateDataset, importDataset, previewDataset, normalizeRow };
