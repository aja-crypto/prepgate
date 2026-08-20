/**
 * Build CCMT Database from Excel/CSV sources
 * 
 * !! IMPORTANT: This script reads from Excel/CSV source files.
 * !! Opening scores are NOT derivable from closing scores — leave as null.
 * !! NEVER fabricate opening scores by multiplying closing scores by any factor.
 * !!
 * !! This script produces cse-cutoffs-v2.json which is a static fallback.
 * !! The authoritative data lives in the MongoDB CcmtCutoff collection.
 * !! Production predictions use the MongoDB collection, not this static file.
 * 
 * Run: node scripts/build-ccmt-database.js (legacy — not part of production workflow)
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data', 'ccmt_extracted');

// --- Read 15 NITs Excel ---
const nitFile = path.join(dataDir, 'GateNexa_CSE_Cutoffs_Batch1_15NITs.xlsx');
const nitWb = XLSX.readFile(nitFile);
const nitRows = XLSX.utils.sheet_to_json(nitWb.Sheets[nitWb.SheetNames[0]], { header: 1 });

// --- Read Tier1 NITs Excel ---
const tier1File = path.join(dataDir, 'GateNexa_CSE_Cutoffs_Batch1_Tier1_NITs.xlsx');
const tier1Wb = XLSX.readFile(tier1File);
const tier1Rows = XLSX.utils.sheet_to_json(tier1Wb.Sheets[tier1Wb.SheetNames[0]], { header: 1 });

// --- Read IIIT CSV ---
const iiitFile = path.join(dataDir, 'GateNexa_IIIT_Scope_Verification.csv');
const csvContent = fs.readFileSync(iiitFile, 'utf-8');
const csvLines = csvContent.trim().split('\n');
const csvRows = csvLines.slice(1).map(l => {
  const vals = [];
  let inQuote = false, current = '';
  for (let ch of l) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { vals.push(current.trim()); current = ''; }
    else current += ch;
  }
  vals.push(current.trim());
  return vals;
});

// --- Helpers ---
function normalizeName(n) {
  return n?.toString().trim().replace(/,$/, '').replace(/\s+/g, ' ');
}

const allColleges = [];
const nameMap = new Map();

function addCollege(col) {
  const key = normalizeName(col.college_name).toLowerCase();
  if (nameMap.has(key)) {
    const idx = nameMap.get(key);
    if (col.programs) {
      for (const newProg of col.programs) {
        let found = false;
        for (const existProg of allColleges[idx].programs) {
          if (existProg.program_name === newProg.program_name) {
            existProg.cutoffs.push(...newProg.cutoffs);
            found = true; break;
          }
        }
        if (!found) allColleges[idx].programs.push(newProg);
      }
    }
    return;
  }
  nameMap.set(key, allColleges.length);
  allColleges.push(col);
}

// --- Process 15 NITs ---
for (let i = 1; i < nitRows.length; i++) {
  const r = nitRows[i];
  if (!r[1]) continue;
  const collegeName = normalizeName(r[1]);
  const state = normalizeName(r[2] || '');
  const nirfRank = parseInt(r[4]) || null;
  const program = normalizeName(r[5] || 'Computer Science and Engineering');
  const closingGen = parseInt(r[8]) || null;
  const closingOBC = parseInt(r[9]) || null;
  const closingSC = parseInt(r[10]) || null;
  const closingST = parseInt(r[11]) || null;
  const closingEWS = parseInt(r[12]) || null;

  const cutoffs = [];
  if (closingGen) {
    // NOTE: opening scores are NOT derivable from closing scores (no fabrication).
    // Only verified opening values belong here; leave opening null otherwise.
    const entry = { year: 2025, round: 1 };
    entry['GEN'] = { opening: null, closing: closingGen };
    if (closingOBC) entry['OBC-NCL'] = { opening: null, closing: closingOBC };
    if (closingSC) entry['SC'] = { opening: null, closing: closingSC };
    if (closingST) entry['ST'] = { opening: null, closing: closingST };
    if (closingEWS) entry['EWS'] = { opening: null, closing: closingEWS };
    cutoffs.push(entry);
  }

  const shortParts = collegeName.replace('National Institute of Technology', 'NIT').trim();
  const collegeId = 'nit-' + collegeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').substring(0, 30);

  addCollege({
    college_id: collegeId,
    college_name: collegeName,
    college_short_name: shortParts,
    college_type: 'NIT',
    nirf_rank: nirfRank,
    state: state,
    programs: [{
      program_name: 'M.Tech ' + program,
      gate_paper: 'CS',
      specialization: 'CSE',
      cutoffs: cutoffs,
      seats: null,
      duration: '2 Years',
      fees: null,
      placement: {},
    }],
  });
}

// --- Process IIITs ---
for (const row of csvRows) {
  const collegeName = normalizeName(row[0]);
  if (!collegeName || collegeName.length < 3) continue;
  const state = normalizeName(row[2] || '');

  const collegeId = 'iiit-' + collegeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').substring(0, 30);

  addCollege({
    college_id: collegeId,
    college_name: collegeName,
    college_short_name: collegeName.replace('International Institute of Information Technology', 'IIIT'),
    college_type: 'IIIT',
    nirf_rank: null,
    state: state,
    programs: [{
      program_name: 'M.Tech Computer Science and Engineering',
      gate_paper: 'CS',
      specialization: 'CSE',
      cutoffs: [],
      seats: null,
      duration: '2 Years',
      fees: null,
      placement: {},
    }],
  });
}

// --- Merge with existing cse-cutoffs.json (preserve IIT data, placements, fees) ---
const existingFile = path.join(__dirname, '..', 'data', 'cse-cutoffs.json');
if (fs.existsSync(existingFile)) {
  const existing = JSON.parse(fs.readFileSync(existingFile, 'utf-8'));
  existing.forEach(c => {
    const key = c.college_name.toLowerCase();
    if (nameMap.has(key)) {
      const idx = nameMap.get(key);
      allColleges[idx].programs.forEach(prog => {
        const match = (c.programs || []).find(p => p.program_name === prog.program_name);
        if (match) {
          prog.fees = prog.fees || match.fees;
          prog.placement = match.placement || prog.placement;
          prog.seats = prog.seats || match.seats;
        }
      });
    } else {
      // Add existing college not in new data (IITs, IISc)
      addCollege(c);
    }
  });
} else {
  console.log('WARNING: No existing cse-cutoffs.json to merge from');
}

// --- Stats ---
const totalProgrammes = allColleges.reduce((s, c) => s + (c.programs?.length || 0), 0);
const counts = {};
allColleges.forEach(c => counts[c.college_type] = (counts[c.college_type] || 0) + 1);
const withCutoffs = allColleges.filter(c => c.programs?.some(p => (p.cutoffs || []).length > 0));
const withPlacements = allColleges.filter(c => c.programs?.some(p => p.placement?.average));

console.log('=== Build Complete ===');
console.log(`Institutes: ${allColleges.length}`);
console.log(`Programmes: ${totalProgrammes}`);
console.log(`By type: ${JSON.stringify(counts)}`);
console.log(`With cutoff data: ${withCutoffs.length}`);
console.log(`With placement data: ${withPlacements.length}`);

// --- Write ---
const outputPath = path.join(__dirname, '..', 'data', 'cse-cutoffs-v2.json');
fs.writeFileSync(outputPath, JSON.stringify(allColleges, null, 2));
console.log(`Written to ${outputPath}`);
