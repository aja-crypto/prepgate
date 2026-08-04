/**
 * Data cleaning script — normalizes institute names in MongoDB.
 * Run once. Safe to re-run (idempotent).
 */
require('../src/config/loadEnv');
const mongoose = require('mongoose');
const CcmtCutoff = require('../src/models/CcmtCutoff');

const FIXES = [
  // Canonical: no comma before city
  { from: 'National Institute of Technology, Tiruchirappalli', to: 'National Institute of Technology Tiruchirappalli' },
  { from: 'National Institute of Technology, Warangal', to: 'National Institute of Technology Warangal' },
  { from: 'Sardar Vallabhbhai National Institute of Technology, Surat', to: 'Sardar Vallabhbhai National Institute of Technology Surat' },
  { from: 'Visvesvaraya National Institute of Technology, Nagpur', to: 'Visvesvaraya National Institute of Technology Nagpur' },
  { from: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', to: 'Dr. B R Ambedkar National Institute of Technology Jalandhar' },
  { from: 'National Institute of Technology, Rourkela', to: 'National Institute of Technology Rourkela' },
  // Also fix 'Dr.' variant to canonical form
  { from: 'Dr. B R Ambedkar National Institute of Technology Jalandhar', to: 'Dr. B R Ambedkar National Institute of Technology Jalandhar' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  // === Fix 1: Normalize duplicate NIT names ===
  console.log('=== Normalizing Institute Names ===');
  let totalFixed = 0;
  for (const { from, to } of FIXES) {
    const result = await CcmtCutoff.updateMany({ institute: from }, { $set: { institute: to } });
    if (result.modifiedCount > 0) {
      console.log(`  "${from}" → "${to}" : ${result.modifiedCount} records fixed`);
      totalFixed += result.modifiedCount;
    } else {
      console.log(`  "${from}" : already fixed (0 modified)`);
    }
  }
  console.log(`  Total: ${totalFixed} records normalized\n`);

  // === Fix 2: "Computer Science" as institute ===
  console.log('=== Fixing "Computer Science" Entry ===');
  const bad = await CcmtCutoff.findOne({ institute: 'Computer Science' });
  if (bad) {
    console.log(`  Found: ${bad.institute} | ${bad.program} | closing=${bad.closingScore} | type=${bad.instituteType}`);
    // Search for the real institute: closing=730, program contains "Computer Science"
    const candidates = await CcmtCutoff.find({
      institute: { $ne: 'Computer Science' },
      $or: [
        { closingScore: bad.closingScore },
        { program: { $regex: /Computer Science/i } }
      ]
    }).lean();

    // Find best match: same closing score or same program
    let bestMatch = candidates.find(c => c.closingScore === bad.closingScore);
    if (!bestMatch) bestMatch = candidates.find(c => c.program === bad.program);
    if (!bestMatch && candidates.length > 0) bestMatch = candidates[0];

    if (bestMatch) {
      console.log(`  Best match: ${bestMatch.institute} | ${bestMatch.program} | close=${bestMatch.closingScore}`);
      const result = await CcmtCutoff.updateOne(
        { _id: bad._id },
        { $set: { institute: bestMatch.institute, instituteType: bestMatch.instituteType } }
      );
      console.log(`  Fixed: ${result.modifiedCount} record → ${bestMatch.institute}`);
    } else {
      // Fallback: set to Unknown and flag
      console.log(`  No match found. Setting institute to "Unknown (was: Computer Science)"`);
      await CcmtCutoff.updateOne(
        { _id: bad._id },
        { $set: { institute: 'Unknown Institute (data error)', instituteType: 'Other' } }
      );
    }
  } else {
    console.log(`  Already fixed (no record found)`);
  }

  // === Fix 3: Verify ===
  console.log('\n=== Post-fix Verification ===');
  const remainingDupes = await CcmtCutoff.aggregate([
    { $group: {
      _id: { $toLower: { $replaceAll: { input: { $replaceAll: { input: '$institute', find: ',', replacement: '' } }, find: '  ', replacement: ' ' } } },
      names: { $addToSet: '$institute' },
      count: { $sum: 1 }
    }},
    { $match: { 'names.1': { $exists: true } } }
  ]);
  if (remainingDupes.length === 0) {
    console.log('  No remaining duplicate institute names. Clean!');
  } else {
    console.log('  Remaining duplicates:');
    remainingDupes.forEach(d => console.log(`    ${d.names.join(' | ')} : ${d.count}`));
  }

  const stillBad = await CcmtCutoff.findOne({ institute: 'Computer Science' });
  console.log(`  "Computer Science" as institute: ${stillBad ? 'STILL EXISTS' : 'FIXED'}`);

  await mongoose.disconnect();
  console.log('\nDone.');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
