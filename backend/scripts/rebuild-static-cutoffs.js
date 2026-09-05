/**
 * Regenerate static fallback files (cse-cutoffs.json / cse-cutoffs-v2.json) from the live DB.
 * - Cutoff values come ONLY from non-placeholder CcmtCutoff rows (score-styled, opening >= closing).
 * - College skeleton (college_id/name/type/nirf/state) + metadata (placements, fees) preserved
 *   from the existing static file where available.
 * - Programs with no DB data get empty cutoffs (removes fabricated 0.8x openings).
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
const mongoose = require('mongoose');
const CcmtCutoff = require('../src/models/CcmtCutoff');
const { validateCutoffRecord, hasFabricatedOpening } = require('../src/utils/cutoffValidation');

const DATA_DIR = path.join(__dirname, '../data');
const OUT_FILES = ['cse-cutoffs.json', 'cse-cutoffs-v2.json'];

const CAT_KEY = { 'General': 'GEN', 'EWS': 'EWS', 'OBC-NCL': 'OBC-NCL', 'SC': 'SC', 'ST': 'ST', 'PwD': 'PWD', 'PWD': 'PWD' };

function normName(s) {
  return (s || '').toString().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function normProgram(s) {
  return normName(s).replace(/^mtech\s*/, '');
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const rows = await CcmtCutoff.find({ dataStatus: { $ne: 'placeholder' } }).lean();
  console.log(`DB non-placeholder rows: ${rows.length}`);

  // Group by institute -> program
  const groups = new Map();
  for (const r of rows) {
    const iKey = normName(r.institute);
    if (!groups.has(iKey)) groups.set(iKey, new Map());
    const pKey = normProgram(r.program);
    if (!groups.get(iKey).has(pKey)) groups.get(iKey).set(pKey, []);
    groups.get(iKey).get(pKey).push(r);
  }

  // Read existing skeleton (metadata preserved)
  const existingPath = path.join(DATA_DIR, 'cse-cutoffs.json');
  let existing = [];
  if (fs.existsSync(existingPath)) existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  const existingByName = new Map(existing.map(c => [normName(c.college_name), c]));

  const built = [];
  const usedInstituteKeys = new Set();

  // 1) Colleges that exist in skeleton AND have DB data: fill cutoffs, keep metadata
  for (const [iKey, progMap] of groups) {
    const skeleton = existingByName.get(iKey);
    const college = skeleton ? JSON.parse(JSON.stringify(skeleton)) : {
      college_id: 'db-' + iKey.replace(/[^a-z0-9]+/g, '-').slice(0, 30),
      college_name: (skeleton?.college_name) || rows.find(r => normName(r.institute) === iKey)?.institute || iKey,
      college_short_name: (skeleton?.college_short_name) || '',
      college_type: skeleton?.college_type || rows.find(r => normName(r.institute) === iKey)?.instituteType || 'Other',
      nirf_rank: null, state: '', programs: [],
    };
    usedInstituteKeys.add(iKey);

    const programs = [];
    for (const [pKey, progRows] of progMap) {
      // Reuse skeleton program metadata (name, placement, fees) when program matches
      let prog = (skeleton?.programs || []).find(p => normProgram(p.program_name) === pKey);
      if (!prog) prog = (skeleton?.programs || []).find(p => normProgram(p.program_name).includes(pKey) || pKey.includes(normProgram(p.program_name)));
      prog = prog ? JSON.parse(JSON.stringify(prog)) : {
        program_name: progRows[0].program, gate_paper: 'CS',
        specialization: progRows[0].specialization || '', cutoffs: [], seats: null, duration: '2 Years', fees: null, placement: {},
      };
      prog.cutoffs = [];

      // Group rows into {year, round, CAT:{opening,closing}}
      const cutoffMap = new Map();
      for (const r of progRows) {
        const key = `${r.year}|${r.round}`;
        if (!cutoffMap.has(key)) cutoffMap.set(key, { year: r.year, round: r.round });
        const entry = cutoffMap.get(key);
        const catKey = CAT_KEY[r.category];
        if (catKey) entry[catKey] = { opening: r.openingScore, closing: r.closingScore };
      }
      prog.cutoffs = [...cutoffMap.values()].sort((a, b) => a.year - b.year || a.round - b.round);
      programs.push(prog);
    }

    // Keep skeleton programs that had no DB data (cutoffs emptied below)
    for (const sp of skeleton?.programs || []) {
      if (!programs.some(p => normProgram(p.program_name) === normProgram(sp.program_name))) {
        const copy = JSON.parse(JSON.stringify(sp));
        copy.cutoffs = [];
        programs.push(copy);
      }
    }

    college.programs = programs;
    built.push(college);
  }

  // 2) Skeleton colleges with NO DB rows: keep as-is but clear any fabricated cutoffs
  for (const c of existing) {
    const iKey = normName(c.college_name);
    if (usedInstituteKeys.has(iKey)) continue;
    const copy = JSON.parse(JSON.stringify(c));
    for (const p of copy.programs || []) p.cutoffs = [];
    built.push(copy);
  }

  // Stats
  const totalProgrammes = built.reduce((s, c) => s + (c.programs?.length || 0), 0);
  const withCutoffs = built.filter(c => c.programs?.some(p => (p.cutoffs || []).length > 0));
  const counts = {};
  built.forEach(c => counts[c.college_type] = (counts[c.college_type] || 0) + 1);
  console.log(`Built colleges: ${built.length} (with cutoffs: ${withCutoffs.length}), programmes: ${totalProgrammes}, by type: ${JSON.stringify(counts)}`);

  // Inversion check + fabricated opening detection
  let inv = 0, over = 0, cells = 0, fabricated = 0;
  for (const c of built) for (const p of c.programs || []) for (const cd of p.cutoffs || []) {
    for (const [k, v] of Object.entries(cd)) {
      if (k === 'year' || k === 'round') continue;
      cells++;
      if (typeof v?.opening === 'number' && typeof v?.closing === 'number') {
        if (v.opening < v.closing) inv++;
        if (v.closing > 1000) over++;
        if (Math.abs(v.opening / v.closing - 0.8) < 0.01) fabricated++;
      }
    }
  }
  console.log(`cutoff cells: ${cells} | open<close (inverted): ${inv} | close>1000: ${over} | fabricated 0.8x openings: ${fabricated}`);

  for (const f of OUT_FILES) {
    fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(built, null, 2));
    console.log(`Written ${f}`);
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
