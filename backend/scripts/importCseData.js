/**
 * Import CSE Cutoff Data
 * 
 * Usage: node scripts/importCseData.js
 * 
 * Input format: JSON with college data
 * Example:
 * {
 *   "college": "IIT Madras",
 *   "college_type": "IIT",
 *   "year": 2025,
 *   "programs": [...]
 * }
 * 
 * Categories mapped to model enum:
 *   GEN -> General
 *   EWS -> EWS
 *   OBC_NCL -> OBC-NCL
 *   SC -> SC
 *   ST -> ST
 *   GEN_PWD -> PwD
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CATEGORY_MAP = {
  'GEN': 'General',
  'OPEN': 'General',
  'EWS': 'EWS',
  'GEN_EWS': 'EWS',
  'OBC': 'OBC-NCL',
  'OBC_NCL': 'OBC-NCL',
  'SC': 'SC',
  'ST': 'ST',
  'GEN_PWD': 'PwD',
  'PWD': 'PwD',
  'WQ': 'General',
  'KM': 'General',
};

const CSE_PROGRAMS = [
  'computer science', 'computer engineering', 'computing',
  'cse', 'cs', 'ce',
  'artificial intelligence', 'ai', 'machine learning', 'ml',
  'data science', 'data analytics', 'computational data',
  'software engineering', 'software systems', 'software technology',
  'cyber security', 'information security', 'network security',
  'high performance', 'distributed computing', 'cloud computing',
  'edge computing', 'parallel computing',
  'computer vision', 'natural language processing',
  'robotics', 'autonomous', 'intelligent robotics',
  'human computer interaction', 'hci',
  'embedded', 'iot', 'internet of things',
  'vlsi', 'microelectronics',
];

function isCSEProgram(programName) {
  const lower = programName.toLowerCase();
  return CSE_PROGRAMS.some(p => lower.includes(p));
}

function getSeedData() {
  return [
    // ===== IIT Madras =====
    {
      college: 'Indian Institute of Technology Madras',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 881, EWS: 770, OBC_NCL: 802, SC: 585, ST: 564, GEN_PWD: 443 } },
        { program_name: 'Data Science', gate_paper: 'DA', cutoff: { GEN: 866, EWS: 768, OBC_NCL: 768, SC: 690, ST: 553, GEN_PWD: 537 } },
      ]
    },
    // ===== IISc Bangalore =====
    {
      college: 'Indian Institute of Science',
      college_type: 'IISc',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Automation', gate_paper: 'CS', cutoff: { GEN: '903-1000', OBC_NCL: '830-901', SC: '724-872', ST: '575-737', EWS: '843-880', PWD: '431-784' } },
        { program_name: 'Artificial Intelligence', gate_paper: 'CS', cutoff: { GEN: '946-946', OBC_NCL: '835-876', SC: '764-850', EWS: '827-850' } },
        { program_name: 'Computational and Data Science', gate_paper: 'CS', cutoff: { GEN: '860-960', OBC_NCL: '806-923', SC: '579-735', EWS: '744-784' } },
        { program_name: 'Network and Information Security', gate_paper: 'CS', cutoff: { GEN: '806-881', OBC_NCL: '756-787', EWS: '761', SC: '731-772', ST: '459-536' } },
        { program_name: 'Robotics and Autonomous Systems', gate_paper: 'CS', cutoff: { GEN: '763-801', OBC_NCL: '674-708', EWS: '705', SC: '573-622' } },
        { program_name: 'Microelectronics and VLSI Design', gate_paper: 'CS', cutoff: { GEN: '850-928', OBC_NCL: '764-795', SC: '708-776', ST: '653-667' } },
      ]
    },
    // ===== IIT Guwahati =====
    {
      college: 'Indian Institute of Technology Guwahati',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: '876-918', OBC_NCL: '813-840', EWS: '827-856', SC: '724-820', ST: '622-737' } },
        { program_name: 'Artificial Intelligence', gate_paper: 'CS', cutoff: { GEN: '905-948', OBC_NCL: '897-897', SC: '842-842', ST: '629-629', EWS: '880' } },
        { program_name: 'Network and Information Security', gate_paper: 'CS', cutoff: { GEN: '806-881', OBC_NCL: '756-787', EWS: '761-761', SC: '731-772', ST: '459-536' } },
        { program_name: 'Microelectronics and VLSI', gate_paper: 'CS', cutoff: { GEN: '850-928', OBC_NCL: '764-795', SC: '708-776', ST: '653-667' } },
        { program_name: 'Robotics and Intelligent System Engineering', gate_paper: 'CS', cutoff: { GEN: '763-801', OBC_NCL: '674-708', EWS: '705-705', SC: '573-622' } },
      ]
    },
    // ===== IIT Hyderabad =====
    {
      college: 'Indian Institute of Technology Hyderabad',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 781, EWS: 757, OBC_NCL: 711, SC: 598, ST: 473, GEN_PWD: 343 } },
        { program_name: 'Artificial Intelligence', gate_paper: 'CS', cutoff: { GEN: 764, EWS: 747, OBC_NCL: 708, SC: 589, ST: 436, GEN_PWD: 317 } },
      ]
    },
    // ===== IIT Kharagpur =====
    {
      college: 'Indian Institute of Technology Kharagpur',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 772, OBC_NCL: 714, GEN_EWS: 752, SC: 589, ST: 456 } },
        { program_name: 'Signal Processing and Machine Learning', gate_paper: 'CS', cutoff: { GEN: 588, OBC_NCL: 563, SC: 582, ST: 358 } },
        { program_name: 'VLSI and Nanoelectronics', gate_paper: 'CS', cutoff: { GEN: 717, OBC_NCL: 655, GEN_EWS: 635, SC: 475, ST: 432 } },
      ]
    },
    // ===== IIT Patna =====
    {
      college: 'Indian Institute of Technology Patna',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 580, OBC_NCL: 520, SC: 380, ST: 280 } },
      ]
    },
    // ===== IIT Bombay =====
    {
      college: 'Indian Institute of Technology Bombay',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 860, EWS: 820, OBC_NCL: 800, SC: 650, ST: 600 } },
        { program_name: 'Artificial Intelligence', gate_paper: 'CS', cutoff: { GEN: 925, EWS: 703, OBC_NCL: 825, SC: 668, ST: 639 } },
        { program_name: 'Computational and Data Science', gate_paper: 'CS', cutoff: { GEN: 852, EWS: 744, OBC_NCL: 769 } },
      ]
    },
    // ===== IIT Delhi =====
    {
      college: 'Indian Institute of Technology Delhi',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 800, EWS: 800, OBC_NCL: 720, SC: 550, ST: 550 } },
        { program_name: 'Machine Intelligence and Data Science', gate_paper: 'CS', cutoff: { GEN: 720, EWS: 686, OBC_NCL: 641, SC: 472, ST: 303 } },
        { program_name: 'Cyber Security', gate_paper: 'CS', cutoff: { GEN: 710, EWS: 700, OBC_NCL: 675, SC: 500, ST: 500 } },
      ]
    },
    // ===== IIT Kanpur =====
    {
      college: 'Indian Institute of Technology Kanpur',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 740, OBC_NCL: 660, EWS: 660, SC: 470, ST: 470 } },
      ]
    },
    // ===== IIT Gandhinagar =====
    {
      college: 'Indian Institute of Technology Gandhinagar',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 747, EWS: 752, OBC_NCL: 693, SC: 531, ST: 456 } },
        { program_name: 'Artificial Intelligence', gate_paper: 'CS', cutoff: { GEN: 721, EWS: 693, OBC_NCL: 647, SC: 522, ST: 393 } },
      ]
    },
    // ===== IIT (ISM) Dhanbad =====
    {
      college: 'Indian Institute of Technology (ISM) Dhanbad',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 711, EWS: 701, OBC_NCL: 689, SC: 535, ST: 430 } },
        { program_name: 'Artificial Intelligence and Data Science', gate_paper: 'CS', cutoff: { GEN: 685, EWS: 664, OBC_NCL: 632, SC: 483, ST: 390 } },
      ]
    },
    // ===== IIT Ropar =====
    {
      college: 'Indian Institute of Technology Ropar',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 701, EWS: 664, OBC_NCL: 647, SC: 510, ST: 393 } },
        { program_name: 'Artificial Intelligence', gate_paper: 'CS', cutoff: { GEN: 678, EWS: 655, OBC_NCL: 638, SC: 485, ST: 375 } },
      ]
    },
    // ===== IIT Tirupati =====
    {
      college: 'Indian Institute of Technology Tirupati',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 655, EWS: 605, OBC_NCL: 575, SC: 481, ST: 334 } },
      ]
    },
    // ===== IIT Palakkad =====
    {
      college: 'Indian Institute of Technology Palakkad',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 689 } },
      ]
    },
    // ===== IIT Goa =====
    {
      college: 'Indian Institute of Technology Goa',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 618, EWS: 622, OBC_NCL: 622, SC: 546 } },
      ]
    },
    // ===== IIT Dharwad =====
    {
      college: 'Indian Institute of Technology Dharwad',
      college_type: 'IIT',
      year: 2025,
      programs: [
        { program_name: 'Computer Science and Engineering', gate_paper: 'CS', cutoff: { GEN: 600, OBC_NCL: 540, SC: 400, ST: 400 } },
      ]
    },
  ];
}

async function importData() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    return;
  }

  const CcmtCutoff = require('../src/models/CcmtCutoff');
  const seedData = getSeedData();

  let totalImported = 0;
  let skipped = 0;

  for (const collegeData of seedData) {
    console.log(`\nProcessing: ${collegeData.college} (${collegeData.year})`);
    
    for (const program of collegeData.programs) {
      if (!isCSEProgram(program.program_name)) {
        console.log(`  SKIP: ${program.program_name} (not CSE)`);
        skipped++;
        continue;
      }

      console.log(`  Program: ${program.program_name} (${program.program_code})`);

      // Create cutoff entry for each category
      for (const [rawCat, cutoffVal] of Object.entries(program.cutoff)) {
        const category = CATEGORY_MAP[rawCat];
        if (!category) {
          console.log(`  WARN: Unknown category ${rawCat}`);
          continue;
        }

        // Parse value: could be number (781) or range string ("903-1000")
        let openingScore = null;
        let closingScore = null;
        
        if (typeof cutoffVal === 'string' && cutoffVal.includes('-')) {
          const [low, high] = cutoffVal.split('-').map(Number);
          openingScore = low;
          closingScore = high;
        } else if (typeof cutoffVal === 'number') {
          openingScore = cutoffVal;
          closingScore = cutoffVal;
        } else if (typeof cutoffVal === 'string') {
          const num = parseInt(cutoffVal);
          openingScore = num;
          closingScore = num;
        }

        if (!closingScore || isNaN(closingScore)) {
          console.log(`  WARN: Invalid cutoff for ${rawCat}: ${cutoffVal}`);
          continue;
        }

        try {
          await CcmtCutoff.create({
            year: collegeData.year,
            round: collegeData.round || 1,
            institute: collegeData.college,
            instituteType: collegeData.college_type,
            program: program.program_name,
            programCode: program.program_code || '',
            specialization: program.gate_paper || '',
            category: category,
            openingScore: openingScore,
            closingScore: closingScore,
            quota: 'AI',
            source: 'admin',
            verified: true,
          });
          totalImported++;
          console.log(`    ${category}: ${openingScore || '—'}-${closingScore} ✓`);
        } catch (err) {
          console.log(`    ${category}: ERROR - ${err.message}`);
        }
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Import complete!`);
  console.log(`  Total imported: ${totalImported}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`${'='.repeat(50)}`);

  await mongoose.disconnect();
}

importData().catch(console.error);
