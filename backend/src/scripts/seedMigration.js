const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CollegeCutoff = require('../models/CollegeCutoff');
const CcmtCutoff = require('../models/CcmtCutoff');
const GateMarksScore = require('../models/GateMarksScore');
const GateScoreRank = require('../models/GateScoreRank');
const GateRankPercentile = require('../models/GateRankPercentile');
const GateStatistics = require('../models/GateStatistics');
const SeatMatrix = require('../models/SeatMatrix');
const BranchStatistics = require('../models/BranchStatistics');

const ROUND_MAP = {
  'Round 1': 1, 'Round 2': 2, 'Round 3': 3,
  'Special Round 1': 4, 'Special Round 2': 5,
};

function parseRound(r) {
  if (typeof r === 'number') return r;
  return ROUND_MAP[r] || parseInt(r) || 1;
}

const TYPE_MAP = { IIT: 'IIT', NIT: 'NIT', IIIT: 'IIIT', GFTI: 'GFTI' };

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Migrate CollegeCutoff -> CcmtCutoff
    console.log('\n--- Step 1: Migrating CollegeCutoff → CcmtCutoff ---');
    const collegeCutoffs = await CollegeCutoff.find({ source: 'ccmt' }).lean();
    console.log(`Found ${collegeCutoffs.length} CollegeCutoff records with source=ccmt`);

    if (collegeCutoffs.length > 0) {
      await CcmtCutoff.deleteMany({ source: 'ccmt' });

      const ccmtDocs = collegeCutoffs.map(c => ({
        year: c.year,
        institute: c.collegeName,
        instituteType: TYPE_MAP[c.collegeType] || 'Other',
        program: c.program,
        specialization: c.specialization || '',
        category: c.category,
        round: parseRound(c.round),
        openingScore: c.openingScore,
        closingScore: c.closingScore,
        state: c.state || '',
        quota: 'AI',
        source: 'ccmt',
      }));

      const BATCH = 500;
      let inserted = 0;
      for (let i = 0; i < ccmtDocs.length; i += BATCH) {
        await CcmtCutoff.insertMany(ccmtDocs.slice(i, i + BATCH), { ordered: false });
        inserted += Math.min(BATCH, ccmtDocs.length - i);
      }
      console.log(`Seeded ${inserted} CcmtCutoff records`);
    }

    // 2. Seed GateMarksScore (marks → normalized score, 0-100 scale)
    console.log('\n--- Step 2: Seeding GateMarksScore ---');
    await GateMarksScore.deleteMany({});
    const marksScoreData = [];
    for (let year = 2019; year <= 2025; year++) {
      for (let m = 0; m <= 100; m += 5) {
        const score = Math.round((m / 100) * 1000);
        marksScoreData.push({ year, paper: 'CS', marks: m, score, source: 'estimated' });
      }
    }
    await GateMarksScore.insertMany(marksScoreData, { ordered: false });
    console.log(`Seeded ${marksScoreData.length} GateMarksScore records`);

    // 3. Seed GateScoreRank (score → rank)
    console.log('\n--- Step 3: Seeding GateScoreRank ---');
    await GateScoreRank.deleteMany({});
    const scoreRankPoints = [
      { score: 1000, rank: 1 }, { score: 950, rank: 2 }, { score: 900, rank: 5 },
      { score: 850, rank: 10 }, { score: 800, rank: 20 }, { score: 750, rank: 40 },
      { score: 700, rank: 80 }, { score: 650, rank: 150 }, { score: 600, rank: 300 },
      { score: 550, rank: 500 }, { score: 500, rank: 800 }, { score: 450, rank: 1300 },
      { score: 400, rank: 2000 }, { score: 350, rank: 3500 }, { score: 300, rank: 5500 },
      { score: 250, rank: 8000 }, { score: 200, rank: 12000 }, { score: 150, rank: 20000 },
      { score: 100, rank: 35000 }, { score: 50, rank: 60000 }, { score: 0, rank: 100000 },
    ];
    const scoreRankDocs = [];
    for (let year = 2019; year <= 2025; year++) {
      const factor = 0.85 + Math.random() * 0.3;
      scoreRankPoints.forEach(p => {
        scoreRankDocs.push({
          year, paper: 'CS',
          score: p.score,
          rank: Math.round(p.rank * factor),
          source: 'estimated',
        });
      });
    }
    await GateScoreRank.insertMany(scoreRankDocs, { ordered: false });
    console.log(`Seeded ${scoreRankDocs.length} GateScoreRank records`);

    // 4. Seed GateRankPercentile (rank → percentile)
    console.log('\n--- Step 4: Seeding GateRankPercentile ---');
    await GateRankPercentile.deleteMany({});
    const rankPercentilePoints = [
      { rank: 1, percentile: 100 }, { rank: 5, percentile: 99.99 }, { rank: 10, percentile: 99.98 },
      { rank: 50, percentile: 99.95 }, { rank: 100, percentile: 99.9 }, { rank: 500, percentile: 99.5 },
      { rank: 1000, percentile: 99.0 }, { rank: 2000, percentile: 98.0 }, { rank: 5000, percentile: 95.0 },
      { rank: 10000, percentile: 90.0 }, { rank: 20000, percentile: 80.0 }, { rank: 50000, percentile: 60.0 },
      { rank: 100000, percentile: 30.0 }, { rank: 150000, percentile: 5.0 },
    ];
    const rpDocs = [];
    for (let year = 2019; year <= 2025; year++) {
      rankPercentilePoints.forEach(p => {
        rpDocs.push({ year, paper: 'CS', rank: p.rank, percentile: p.percentile, source: 'estimated' });
      });
    }
    await GateRankPercentile.insertMany(rpDocs, { ordered: false });
    console.log(`Seeded ${rpDocs.length} GateRankPercentile records`);

    // 5. Seed GateStatistics
    console.log('\n--- Step 5: Seeding GateStatistics ---');
    await GateStatistics.deleteMany({});
    const statsData = [
      { year: 2025, paper: 'CS', totalCandidates: 150000, qualifyingMarks: 27.8, qualifyingPercentile: 85.0, meanMarks: 35.5, stdDev: 15.2 },
      { year: 2024, paper: 'CS', totalCandidates: 145000, qualifyingMarks: 27.6, qualifyingPercentile: 84.5, meanMarks: 34.8, stdDev: 14.9 },
      { year: 2023, paper: 'CS', totalCandidates: 140000, qualifyingMarks: 32.5, qualifyingPercentile: 82.0, meanMarks: 38.2, stdDev: 16.1 },
      { year: 2022, paper: 'CS', totalCandidates: 135000, qualifyingMarks: 27.7, qualifyingPercentile: 83.5, meanMarks: 33.5, stdDev: 14.5 },
      { year: 2021, paper: 'CS', totalCandidates: 130000, qualifyingMarks: 25.8, qualifyingPercentile: 84.0, meanMarks: 32.0, stdDev: 13.8 },
    ];
    await GateStatistics.insertMany(statsData, { ordered: false });
    console.log(`Seeded ${statsData.length} GateStatistics records`);

    // 6. Seed BranchStatistics
    console.log('\n--- Step 6: Seeding BranchStatistics ---');
    await BranchStatistics.deleteMany({});
    const branches = [
      { branch: 'Computer Science and Engineering', category: 'General', avgScore: 680, minScore: 450, maxScore: 815, totalSeats: 1200 },
      { branch: 'Information Technology', category: 'General', avgScore: 620, minScore: 400, maxScore: 750, totalSeats: 600 },
      { branch: 'Electronics and Communication Engineering', category: 'General', avgScore: 580, minScore: 350, maxScore: 720, totalSeats: 800 },
      { branch: 'Data Science', category: 'General', avgScore: 650, minScore: 420, maxScore: 780, totalSeats: 300 },
      { branch: 'Artificial Intelligence', category: 'General', avgScore: 670, minScore: 430, maxScore: 790, totalSeats: 250 },
    ];
    const bsDocs = [];
    for (let year = 2023; year <= 2025; year++) {
      branches.forEach(b => {
        bsDocs.push({ ...b, year, source: 'estimated' });
      });
    }
    await BranchStatistics.insertMany(bsDocs, { ordered: false });
    console.log(`Seeded ${bsDocs.length} BranchStatistics records`);

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

migrate();
