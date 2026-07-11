const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GateYear = require('../models/GateYear');
const GateCutoff = require('../models/GateCutoff');
const GateRankData = require('../models/GateRankData');
const GateScoreData = require('../models/GateScoreData');
const CollegeProgram = require('../models/CollegeProgram');
const CollegeCutoff = require('../models/CollegeCutoff');
const PsuRequirement = require('../models/PsuRequirement');

const GATE_CUTOFFS = [
  { year: 2025, category: 'General', qualifyingMarks: 27.8 },
  { year: 2025, category: 'OBC-NCL', qualifyingMarks: 25.0 },
  { year: 2025, category: 'SC', qualifyingMarks: 18.5 },
  { year: 2025, category: 'ST', qualifyingMarks: 18.5 },
  { year: 2025, category: 'EWS', qualifyingMarks: 25.0 },
  { year: 2024, category: 'General', qualifyingMarks: 27.6 },
  { year: 2024, category: 'OBC-NCL', qualifyingMarks: 24.8 },
  { year: 2024, category: 'SC', qualifyingMarks: 18.4 },
  { year: 2024, category: 'ST', qualifyingMarks: 18.4 },
  { year: 2024, category: 'EWS', qualifyingMarks: 24.8 },
  { year: 2023, category: 'General', qualifyingMarks: 32.5 },
  { year: 2023, category: 'OBC-NCL', qualifyingMarks: 29.2 },
  { year: 2023, category: 'SC', qualifyingMarks: 21.6 },
  { year: 2023, category: 'ST', qualifyingMarks: 21.6 },
  { year: 2023, category: 'EWS', qualifyingMarks: 29.2 },
  { year: 2022, category: 'General', qualifyingMarks: 27.7 },
  { year: 2022, category: 'OBC-NCL', qualifyingMarks: 24.9 },
  { year: 2022, category: 'SC', qualifyingMarks: 18.4 },
  { year: 2022, category: 'ST', qualifyingMarks: 18.4 },
  { year: 2022, category: 'EWS', qualifyingMarks: 24.9 },
  { year: 2021, category: 'General', qualifyingMarks: 25.8 },
  { year: 2021, category: 'OBC-NCL', qualifyingMarks: 23.2 },
  { year: 2021, category: 'SC', qualifyingMarks: 17.2 },
  { year: 2021, category: 'ST', qualifyingMarks: 17.2 },
  { year: 2021, category: 'EWS', qualifyingMarks: 23.2 },
  { year: 2020, category: 'General', qualifyingMarks: 28.5 },
  { year: 2020, category: 'OBC-NCL', qualifyingMarks: 25.6 },
  { year: 2020, category: 'SC', qualifyingMarks: 19.0 },
  { year: 2020, category: 'ST', qualifyingMarks: 19.0 },
  { year: 2020, category: 'EWS', qualifyingMarks: 25.6 },
  { year: 2019, category: 'General', qualifyingMarks: 29.5 },
  { year: 2019, category: 'OBC-NCL', qualifyingMarks: 26.5 },
  { year: 2019, category: 'SC', qualifyingMarks: 19.7 },
  { year: 2019, category: 'ST', qualifyingMarks: 19.7 },
  { year: 2019, category: 'EWS', qualifyingMarks: 26.5 },
];

function generateRankData(year) {
  const data = [];
  const points = [
    { marks: 100, rank: 1 }, { marks: 90, rank: 10 }, { marks: 80, rank: 40 },
    { marks: 70, rank: 120 }, { marks: 65, rank: 200 }, { marks: 60, rank: 350 },
    { marks: 55, rank: 600 }, { marks: 50, rank: 1000 }, { marks: 45, rank: 1700 },
    { marks: 40, rank: 2800 }, { marks: 35, rank: 4500 }, { marks: 30, rank: 7000 },
    { marks: 28, rank: 8500 }, { marks: 25, rank: 11000 }, { marks: 20, rank: 17000 },
    { marks: 15, rank: 26000 }, { marks: 10, rank: 40000 }, { marks: 5, rank: 60000 },
  ];
  const factor = 0.85 + Math.random() * 0.3;
  points.forEach(p => {
    data.push({
      year, paper: 'CS',
      marks: p.marks,
      rank: Math.round(p.rank * factor),
      source: 'estimated',
    });
  });
  return data;
}

function generateScoreData(year) {
  const data = [];
  const points = [
    { score: 900, rank: 1 }, { score: 800, rank: 10 }, { score: 700, rank: 50 },
    { score: 650, rank: 100 }, { score: 600, rank: 200 }, { score: 550, rank: 400 },
    { score: 500, rank: 700 }, { score: 450, rank: 1200 }, { score: 400, rank: 2000 },
    { score: 350, rank: 3500 }, { score: 300, rank: 6000 }, { score: 250, rank: 10000 },
    { score: 200, rank: 17000 }, { score: 150, rank: 28000 }, { score: 100, rank: 45000 },
  ];
  const factor = 0.85 + Math.random() * 0.3;
  points.forEach(p => {
    data.push({
      year, paper: 'CS',
      score: p.score,
      rank: Math.round(p.rank * factor),
      source: 'estimated',
    });
  });
  return data;
}

const MAJOR_COLLEGES = [
  { name: 'Indian Institute of Technology Bombay', shortName: 'IIT Bombay', type: 'IIT', location: 'Mumbai', state: 'Maharashtra', nirfRanking: 1 },
  { name: 'Indian Institute of Technology Delhi', shortName: 'IIT Delhi', type: 'IIT', location: 'New Delhi', state: 'Delhi', nirfRanking: 2 },
  { name: 'Indian Institute of Technology Madras', shortName: 'IIT Madras', type: 'IIT', location: 'Chennai', state: 'Tamil Nadu', nirfRanking: 3 },
  { name: 'Indian Institute of Technology Kanpur', shortName: 'IIT Kanpur', type: 'IIT', location: 'Kanpur', state: 'Uttar Pradesh', nirfRanking: 4 },
  { name: 'Indian Institute of Technology Kharagpur', shortName: 'IIT Kharagpur', type: 'IIT', location: 'Kharagpur', state: 'West Bengal', nirfRanking: 5 },
  { name: 'Indian Institute of Technology Roorkee', shortName: 'IIT Roorkee', type: 'IIT', location: 'Roorkee', state: 'Uttarakhand', nirfRanking: 7 },
  { name: 'Indian Institute of Technology Guwahati', shortName: 'IIT Guwahati', type: 'IIT', location: 'Guwahati', state: 'Assam', nirfRanking: 8 },
  { name: 'Indian Institute of Technology Hyderabad', shortName: 'IIT Hyderabad', type: 'IIT', location: 'Hyderabad', state: 'Telangana', nirfRanking: 9 },
  { name: 'Indian Institute of Technology Indore', shortName: 'IIT Indore', type: 'IIT', location: 'Indore', state: 'Madhya Pradesh', nirfRanking: 14 },
  { name: 'Indian Institute of Technology Varanasi', shortName: 'IIT BHU', type: 'IIT', location: 'Varanasi', state: 'Uttar Pradesh', nirfRanking: 11 },
  { name: 'National Institute of Technology Tiruchirappalli', shortName: 'NIT Trichy', type: 'NIT', location: 'Tiruchirappalli', state: 'Tamil Nadu', nirfRanking: 9 },
  { name: 'National Institute of Technology Karnataka', shortName: 'NITK Surathkal', type: 'NIT', location: 'Surathkal', state: 'Karnataka', nirfRanking: 10 },
  { name: 'National Institute of Technology Warangal', shortName: 'NIT Warangal', type: 'NIT', location: 'Warangal', state: 'Telangana', nirfRanking: 21 },
  { name: 'National Institute of Technology Calicut', shortName: 'NIT Calicut', type: 'NIT', location: 'Calicut', state: 'Kerala', nirfRanking: 23 },
  { name: 'National Institute of Technology Rourkela', shortName: 'NIT Rourkela', type: 'NIT', location: 'Rourkela', state: 'Odisha', nirfRanking: 16 },
  { name: 'National Institute of Technology Kurukshetra', shortName: 'NIT Kurukshetra', type: 'NIT', location: 'Kurukshetra', state: 'Haryana', nirfRanking: 30 },
  { name: 'National Institute of Technology Allahabad', shortName: 'NIT Allahabad', type: 'NIT', location: 'Prayagraj', state: 'Uttar Pradesh', nirfRanking: 22 },
  { name: 'Indian Institute of Information Technology Hyderabad', shortName: 'IIIT Hyderabad', type: 'IIIT', location: 'Hyderabad', state: 'Telangana', nirfRanking: 12 },
  { name: 'Indian Institute of Information Technology Allahabad', shortName: 'IIIT Allahabad', type: 'IIIT', location: 'Prayagraj', state: 'Uttar Pradesh', nirfRanking: 25 },
  { name: 'Indian Institute of Information Technology Delhi', shortName: 'IIIT Delhi', type: 'IIIT', location: 'New Delhi', state: 'Delhi', nirfRanking: 18 },
  { name: 'Birla Institute of Technology and Science', shortName: 'BITS Pilani', type: 'GFTI', location: 'Pilani', state: 'Rajasthan', nirfRanking: 20 },
  { name: 'National Institute of Electronics and Information Technology', shortName: 'NIELIT', type: 'GFTI', location: 'New Delhi', state: 'Delhi', nirfRanking: null },
  { name: 'Indian Statistical Institute', shortName: 'ISI Kolkata', type: 'Research Institute', location: 'Kolkata', state: 'West Bengal', nirfRanking: null },
];

const MTECH_PROGRAMS = [
  'Computer Science and Engineering', 'Information Technology',
  'Data Science', 'Artificial Intelligence', 'Machine Learning',
  'Computer Science (Specialization in AI)', 'Computer Science (Specialization in Data Engineering)',
];

const PSU_DATA = [
  { name: 'Bharat Heavy Electricals Limited', shortName: 'BHEL', year: 2025, category: 'General', cutoffScore: 500, totalPosts: 40, discipline: 'Computer Science', location: 'Pan India' },
  { name: 'Power Grid Corporation of India', shortName: 'PGCIL', year: 2025, category: 'General', cutoffScore: 550, totalPosts: 30, discipline: 'Computer Science', location: 'Pan India' },
  { name: 'Oil and Natural Gas Corporation', shortName: 'ONGC', year: 2025, category: 'General', cutoffScore: 480, totalPosts: 25, discipline: 'Computer Science', location: 'Pan India' },
  { name: 'National Thermal Power Corporation', shortName: 'NTPC', year: 2025, category: 'General', cutoffScore: 470, totalPosts: 20, discipline: 'IT', location: 'Pan India' },
  { name: 'Hindustan Aeronautics Limited', shortName: 'HAL', year: 2025, category: 'General', cutoffScore: 450, totalPosts: 15, discipline: 'Computer Science', location: 'Bangalore' },
  { name: 'Bharat Electronics Limited', shortName: 'BEL', year: 2025, category: 'General', cutoffScore: 520, totalPosts: 20, discipline: 'Computer Science', location: 'Bangalore' },
  { name: 'Indian Oil Corporation', shortName: 'IOCL', year: 2025, category: 'General', cutoffScore: 460, totalPosts: 10, discipline: 'IT', location: 'Pan India' },
];

function generateCollegeCutoffs(colleges, year) {
  const cutoffs = [];
  const categories = ['General', 'OBC-NCL', 'SC', 'ST', 'EWS'];
  const catOffsets = { 'General': 0, 'OBC-NCL': -8, 'SC': -20, 'ST': -25, 'EWS': -7 };

  colleges.forEach(college => {
    MTECH_PROGRAMS.slice(0, 3).forEach(program => {
      categories.forEach(cat => {
        let baseCutoff;
        if (college.type === 'IIT') baseCutoff = 600 + Math.random() * 200;
        else if (college.type === 'NIT') baseCutoff = 450 + Math.random() * 150;
        else if (college.type === 'IIIT') baseCutoff = 400 + Math.random() * 150;
        else baseCutoff = 300 + Math.random() * 200;

        const yearDiff = 2025 - year;
        const yearDecay = yearDiff * 15;

        cutoffs.push({
          collegeName: college.name,
          collegeType: college.type,
          program,
          category: cat,
          admissionType: 'M.Tech',
          year,
          closingScore: Math.round((baseCutoff + catOffsets[cat] - yearDecay) * 10) / 10,
          state: college.state,
          source: 'admin',
        });
      });
    });
  });
  return cutoffs;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Seeding GATE years...');
    for (let year = 2019; year <= 2025; year++) {
      await GateYear.findOneAndUpdate(
        { year },
        { year, paper: 'CS', paperName: 'Computer Science & Information Technology', isPublished: true, isActive: year >= 2023 },
        { upsert: true, new: true }
      );
    }

    console.log('Seeding cutoffs...');
    await GateCutoff.deleteMany({});
    await GateCutoff.insertMany(GATE_CUTOFFS);

    console.log('Seeding rank data...');
    await GateRankData.deleteMany({});
    for (let year = 2019; year <= 2025; year++) {
      await GateRankData.insertMany(generateRankData(year));
    }

    console.log('Seeding score data...');
    await GateScoreData.deleteMany({});
    for (let year = 2019; year <= 2025; year++) {
      await GateScoreData.insertMany(generateScoreData(year));
    }

    console.log('Seeding colleges...');
    await CollegeProgram.deleteMany({});
    const savedColleges = await CollegeProgram.insertMany(MAJOR_COLLEGES);
    console.log(`  Seeded ${savedColleges.length} colleges`);

    console.log('Seeding college cutoffs...');
    await CollegeCutoff.deleteMany({});
    let totalCutoffs = 0;
    for (let year = 2022; year <= 2025; year++) {
      const cutoffs = generateCollegeCutoffs(MAJOR_COLLEGES, year);
      await CollegeCutoff.insertMany(cutoffs);
      totalCutoffs += cutoffs.length;
    }
    console.log(`  Seeded ${totalCutoffs} college cutoffs`);

    console.log('Seeding PSU data...');
    await PsuRequirement.deleteMany({});
    await PsuRequirement.insertMany(PSU_DATA);

    console.log('Seed completed successfully!');
    console.log(`  Years: 2019-2025 (7 years)`);
    console.log(`  Cutoffs: ${GATE_CUTOFFS.length}`);
    console.log(`  Rank entries: ~${7 * 18}`);
    console.log(`  Score entries: ~${7 * 15}`);
    console.log(`  Colleges: ${MAJOR_COLLEGES.length}`);
    console.log(`  College cutoffs: ${totalCutoffs}`);
    console.log(`  PSUs: ${PSU_DATA.length}`);

    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
}

seed();
