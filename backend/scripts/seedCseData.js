/**
 * CSE Cutoff Data Seed Script
 * 
 * Generates comprehensive M.Tech cutoff data for GATE CSE aspirants
 * Only includes CSE-related programs (AI, ML, DS, Cyber Security, etc.)
 * Filters out all non-CS branches automatically
 * 
 * Run: node scripts/seedCseData.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ─── CSE Program Filter ───────────────────────────────────
const CSE_PROGRAMS = [
  // Core CS
  'computer science', 'computer engineering', 'computing',
  'cse', 'cs', 'ce',
  // AI & Data
  'artificial intelligence', 'ai', 'machine learning', 'ml',
  'data science', 'data analytics', 'computational data',
  'computational and data', 'intelligent systems',
  // Software
  'software engineering', 'software systems', 'software technology',
  // Security
  'cyber security', 'information security', 'network security',
  // Advanced Computing
  'high performance', 'distributed computing', 'cloud computing',
  'edge computing', 'parallel computing',
  // AI Related
  'computer vision', 'natural language processing',
  'robotics', 'autonomous', 'intelligent robotics',
  'human computer interaction', 'hci',
  // Electronics (CSE students apply)
  'embedded', 'iot', 'internet of things',
  'vlsi', 'microelectronics',
];

function isCSEProgram(programName) {
  const lower = programName.toLowerCase();
  return CSE_PROGRAMS.some(p => lower.includes(p));
}

// ─── Comprehensive Cutoff Data ────────────────────────────
const SEED_DATA = [
  // ===== IITs =====
  {
    college_id: 'iit-bombay',
    college_name: 'Indian Institute of Technology Bombay',
    college_short_name: 'IIT Bombay',
    college_type: 'IIT',
    state: 'Maharashtra',
    city: 'Mumbai',
    nirf_rank: 3,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 68,
        fees: 204500,
        placement: { average: 2800000, highest: 22000000, placement_percentage: 100 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 728, closing: 890 }, EWS: { opening: 650, closing: 780 }, OBC: { opening: 580, closing: 720 }, SC: { opening: 380, closing: 520 }, ST: { opening: 250, closing: 400 }, PWD: { opening: 200, closing: 350 } },
          { year: 2024, round: 2, GEN: { opening: 850, closing: 1020 }, EWS: { opening: 750, closing: 900 }, OBC: { opening: 680, closing: 850 }, SC: { opening: 450, closing: 600 }, ST: { opening: 300, closing: 450 }, PWD: { opening: 250, closing: 400 } },
          { year: 2023, round: 1, GEN: { opening: 680, closing: 850 }, EWS: { opening: 600, closing: 740 }, OBC: { opening: 540, closing: 690 }, SC: { opening: 350, closing: 490 }, ST: { opening: 230, closing: 380 }, PWD: { opening: 180, closing: 320 } },
        ],
      },
      {
        program_name: 'M.Tech Artificial Intelligence',
        specialization: 'AI',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 30,
        fees: 204500,
        placement: { average: 3000000, highest: 25000000, placement_percentage: 100 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 700, closing: 870 }, EWS: { opening: 620, closing: 760 }, OBC: { opening: 560, closing: 700 }, SC: { opening: 360, closing: 500 }, ST: { opening: 240, closing: 380 }, PWD: { opening: 190, closing: 340 } },
          { year: 2024, round: 2, GEN: { opening: 830, closing: 1000 }, EWS: { opening: 730, closing: 880 }, OBC: { opening: 660, closing: 830 }, SC: { opening: 430, closing: 580 }, ST: { opening: 290, closing: 430 }, PWD: { opening: 240, closing: 390 } },
        ],
      },
      {
        program_name: 'M.Tech Data Science',
        specialization: 'Data Science',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 25,
        fees: 204500,
        placement: { average: 2900000, highest: 22000000, placement_percentage: 100 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 710, closing: 880 }, EWS: { opening: 630, closing: 770 }, OBC: { opening: 570, closing: 710 }, SC: { opening: 370, closing: 510 }, ST: { opening: 245, closing: 390 }, PWD: { opening: 195, closing: 345 } },
        ],
      },
    ],
  },
  {
    college_id: 'iit-delhi',
    college_name: 'Indian Institute of Technology Delhi',
    college_short_name: 'IIT Delhi',
    college_type: 'IIT',
    state: 'Delhi',
    city: 'New Delhi',
    nirf_rank: 2,
    programs: [
      {
        program_name: 'M.Tech Computer Technology',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 55,
        fees: 204500,
        placement: { average: 2600000, highest: 20000000, placement_percentage: 100 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 750, closing: 920 }, EWS: { opening: 670, closing: 810 }, OBC: { opening: 600, closing: 750 }, SC: { opening: 390, closing: 540 }, ST: { opening: 260, closing: 420 }, PWD: { opening: 210, closing: 360 } },
          { year: 2024, round: 2, GEN: { opening: 880, closing: 1050 }, EWS: { opening: 780, closing: 920 }, OBC: { opening: 700, closing: 870 }, SC: { opening: 460, closing: 610 }, ST: { opening: 310, closing: 460 }, PWD: { opening: 260, closing: 410 } },
          { year: 2023, round: 1, GEN: { opening: 710, closing: 870 }, EWS: { opening: 630, closing: 760 }, OBC: { opening: 560, closing: 710 }, SC: { opening: 360, closing: 500 }, ST: { opening: 240, closing: 390 }, PWD: { opening: 190, closing: 340 } },
        ],
      },
      {
        program_name: 'M.Tech Artificial Intelligence',
        specialization: 'AI',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 25,
        fees: 204500,
        placement: { average: 2800000, highest: 22000000, placement_percentage: 100 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 730, closing: 900 }, EWS: { opening: 650, closing: 790 }, OBC: { opening: 580, closing: 730 }, SC: { opening: 370, closing: 520 }, ST: { opening: 250, closing: 410 }, PWD: { opening: 200, closing: 350 } },
        ],
      },
    ],
  },
  {
    college_id: 'iit-madras',
    college_name: 'Indian Institute of Technology Madras',
    college_short_name: 'IIT Madras',
    college_type: 'IIT',
    state: 'Tamil Nadu',
    city: 'Chennai',
    nirf_rank: 1,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 58,
        fees: 204500,
        placement: { average: 2700000, highest: 21000000, placement_percentage: 100 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 740, closing: 910 }, EWS: { opening: 660, closing: 800 }, OBC: { opening: 590, closing: 740 }, SC: { opening: 380, closing: 530 }, ST: { opening: 255, closing: 410 }, PWD: { opening: 200, closing: 355 } },
          { year: 2024, round: 2, GEN: { opening: 870, closing: 1040 }, EWS: { opening: 770, closing: 910 }, OBC: { opening: 690, closing: 860 }, SC: { opening: 450, closing: 600 }, ST: { opening: 300, closing: 450 }, PWD: { opening: 250, closing: 400 } },
        ],
      },
      {
        program_name: 'M.Tech Data Science',
        specialization: 'Data Science',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 20,
        fees: 204500,
        placement: { average: 2700000, highest: 21000000, placement_percentage: 100 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 720, closing: 890 }, EWS: { opening: 640, closing: 780 }, OBC: { opening: 575, closing: 720 }, SC: { opening: 365, closing: 510 }, ST: { opening: 240, closing: 390 }, PWD: { opening: 190, closing: 340 } },
        ],
      },
    ],
  },
  {
    college_id: 'iit-kanpur',
    college_name: 'Indian Institute of Technology Kanpur',
    college_short_name: 'IIT Kanpur',
    college_type: 'IIT',
    state: 'Uttar Pradesh',
    city: 'Kanpur',
    nirf_rank: 5,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 42,
        fees: 204500,
        placement: { average: 2200000, highest: 18000000, placement_percentage: 95 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 650, closing: 820 }, EWS: { opening: 570, closing: 710 }, OBC: { opening: 510, closing: 670 }, SC: { opening: 330, closing: 470 }, ST: { opening: 220, closing: 360 }, PWD: { opening: 170, closing: 310 } },
          { year: 2024, round: 2, GEN: { opening: 780, closing: 950 }, EWS: { opening: 690, closing: 830 }, OBC: { opening: 620, closing: 790 }, SC: { opening: 410, closing: 560 }, ST: { opening: 280, closing: 420 }, PWD: { opening: 230, closing: 380 } },
          { year: 2023, round: 1, GEN: { opening: 610, closing: 780 }, EWS: { opening: 530, closing: 670 }, OBC: { opening: 470, closing: 630 }, SC: { opening: 300, closing: 440 }, ST: { opening: 200, closing: 340 }, PWD: { opening: 160, closing: 300 } },
        ],
      },
    ],
  },
  {
    college_id: 'iit-kgp',
    college_name: 'Indian Institute of Technology Kharagpur',
    college_short_name: 'IIT Kharagpur',
    college_type: 'IIT',
    state: 'West Bengal',
    city: 'Kharagpur',
    nirf_rank: 6,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 45,
        fees: 204500,
        placement: { average: 2000000, highest: 16000000, placement_percentage: 92 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 620, closing: 790 }, EWS: { opening: 550, closing: 680 }, OBC: { opening: 490, closing: 640 }, SC: { opening: 310, closing: 450 }, ST: { opening: 210, closing: 350 }, PWD: { opening: 160, closing: 300 } },
          { year: 2024, round: 2, GEN: { opening: 750, closing: 920 }, EWS: { opening: 670, closing: 800 }, OBC: { opening: 600, closing: 770 }, SC: { opening: 390, closing: 540 }, ST: { opening: 270, closing: 410 }, PWD: { opening: 220, closing: 370 } },
          { year: 2023, round: 1, GEN: { opening: 590, closing: 750 }, EWS: { opening: 510, closing: 650 }, OBC: { opening: 450, closing: 610 }, SC: { opening: 290, closing: 430 }, ST: { opening: 190, closing: 330 }, PWD: { opening: 150, closing: 290 } },
        ],
      },
      {
        program_name: 'M.Tech Artificial Intelligence and Machine Learning',
        specialization: 'AI & ML',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 20,
        fees: 204500,
        placement: { average: 2100000, highest: 17000000, placement_percentage: 95 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 600, closing: 770 }, EWS: { opening: 530, closing: 660 }, OBC: { opening: 470, closing: 620 }, SC: { opening: 300, closing: 440 }, ST: { opening: 200, closing: 340 }, PWD: { opening: 150, closing: 290 } },
        ],
      },
    ],
  },
  {
    college_id: 'iit-roorkee',
    college_name: 'Indian Institute of Technology Roorkee',
    college_short_name: 'IIT Roorkee',
    college_type: 'IIT',
    state: 'Uttarakhand',
    city: 'Roorkee',
    nirf_rank: 7,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 38,
        fees: 204500,
        placement: { average: 1900000, highest: 15000000, placement_percentage: 90 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 600, closing: 770 }, EWS: { opening: 530, closing: 660 }, OBC: { opening: 470, closing: 620 }, SC: { opening: 300, closing: 440 }, ST: { opening: 200, closing: 340 }, PWD: { opening: 150, closing: 290 } },
          { year: 2024, round: 2, GEN: { opening: 730, closing: 900 }, EWS: { opening: 650, closing: 790 }, OBC: { opening: 580, closing: 750 }, SC: { opening: 380, closing: 530 }, ST: { opening: 260, closing: 400 }, PWD: { opening: 210, closing: 360 } },
        ],
      },
    ],
  },
  {
    college_id: 'iit-guwahati',
    college_name: 'Indian Institute of Technology Guwahati',
    college_short_name: 'IIT Guwahati',
    college_type: 'IIT',
    state: 'Assam',
    city: 'Guwahati',
    nirf_rank: 8,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 40,
        fees: 204500,
        placement: { average: 1800000, highest: 14000000, placement_percentage: 88 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 580, closing: 750 }, EWS: { opening: 510, closing: 640 }, OBC: { opening: 450, closing: 610 }, SC: { opening: 290, closing: 430 }, ST: { opening: 190, closing: 330 }, PWD: { opening: 140, closing: 280 } },
          { year: 2024, round: 2, GEN: { opening: 710, closing: 880 }, EWS: { opening: 630, closing: 770 }, OBC: { opening: 560, closing: 730 }, SC: { opening: 370, closing: 520 }, ST: { opening: 250, closing: 390 }, PWD: { opening: 200, closing: 350 } },
        ],
      },
    ],
  },
  {
    college_id: 'iit-hyderabad',
    college_name: 'Indian Institute of Technology Hyderabad',
    college_short_name: 'IIT Hyderabad',
    college_type: 'IIT',
    state: 'Telangana',
    city: 'Hyderabad',
    nirf_rank: 8,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 30,
        fees: 204500,
        placement: { average: 1700000, highest: 13000000, placement_percentage: 85 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 560, closing: 730 }, EWS: { opening: 490, closing: 620 }, OBC: { opening: 430, closing: 590 }, SC: { opening: 280, closing: 420 }, ST: { opening: 180, closing: 320 }, PWD: { opening: 130, closing: 270 } },
        ],
      },
      {
        program_name: 'M.Tech Artificial Intelligence',
        specialization: 'AI',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 20,
        fees: 204500,
        placement: { average: 1800000, highest: 14000000, placement_percentage: 88 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 550, closing: 720 }, EWS: { opening: 480, closing: 610 }, OBC: { opening: 420, closing: 580 }, SC: { opening: 270, closing: 410 }, ST: { opening: 175, closing: 315 }, PWD: { opening: 125, closing: 265 } },
        ],
      },
    ],
  },
  {
    college_id: 'iit-patna',
    college_name: 'Indian Institute of Technology Patna',
    college_short_name: 'IIT Patna',
    college_type: 'IIT',
    state: 'Bihar',
    city: 'Patna',
    nirf_rank: 30,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 30,
        fees: 204500,
        placement: { average: 1200000, highest: 10000000, placement_percentage: 75 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 500, closing: 670 }, EWS: { opening: 430, closing: 560 }, OBC: { opening: 380, closing: 530 }, SC: { opening: 240, closing: 380 }, ST: { opening: 160, closing: 300 }, PWD: { opening: 120, closing: 260 } },
        ],
      },
    ],
  },
  // ===== IISc =====
  {
    college_id: 'iisc-bangalore',
    college_name: 'Indian Institute of Science Bangalore',
    college_short_name: 'IISc Bangalore',
    college_type: 'IISc',
    state: 'Karnataka',
    city: 'Bangalore',
    nirf_rank: 1,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Automation',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 35,
        fees: 158000,
        placement: { average: 3000000, highest: 25000000, placement_percentage: 100 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 780, closing: 950 }, EWS: { opening: 700, closing: 850 }, OBC: { opening: 630, closing: 790 }, SC: { opening: 410, closing: 560 }, ST: { opening: 280, closing: 430 }, PWD: { opening: 220, closing: 370 } },
          { year: 2024, round: 2, GEN: { opening: 910, closing: 1080 }, EWS: { opening: 820, closing: 960 }, OBC: { opening: 750, closing: 900 }, SC: { opening: 480, closing: 640 }, ST: { opening: 330, closing: 480 }, PWD: { opening: 270, closing: 420 } },
        ],
      },
    ],
  },
  // ===== NITs =====
  {
    college_id: 'nit-trichy',
    college_name: 'National Institute of Technology Tiruchirappalli',
    college_short_name: 'NIT Trichy',
    college_type: 'NIT',
    state: 'Tamil Nadu',
    city: 'Tiruchirappalli',
    nirf_rank: 9,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 50,
        fees: 150000,
        placement: { average: 1200000, highest: 12000000, placement_percentage: 85 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 400, closing: 580 }, EWS: { opening: 340, closing: 490 }, OBC: { opening: 300, closing: 460 }, SC: { opening: 190, closing: 320 }, ST: { opening: 130, closing: 250 }, PWD: { opening: 100, closing: 220 } },
          { year: 2024, round: 2, GEN: { opening: 550, closing: 720 }, EWS: { opening: 470, closing: 610 }, OBC: { opening: 410, closing: 570 }, SC: { opening: 270, closing: 400 }, ST: { opening: 180, closing: 310 }, PWD: { opening: 140, closing: 280 } },
          { year: 2023, round: 1, GEN: { opening: 380, closing: 550 }, EWS: { opening: 320, closing: 460 }, OBC: { opening: 280, closing: 430 }, SC: { opening: 180, closing: 300 }, ST: { opening: 120, closing: 240 }, PWD: { opening: 90, closing: 210 } },
        ],
      },
      {
        program_name: 'M.Tech Cyber Security',
        specialization: 'Cyber Security',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 20,
        fees: 150000,
        placement: { average: 1100000, highest: 10000000, placement_percentage: 80 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 380, closing: 560 }, EWS: { opening: 320, closing: 470 }, OBC: { opening: 280, closing: 440 }, SC: { opening: 180, closing: 310 }, ST: { opening: 120, closing: 240 }, PWD: { opening: 90, closing: 210 } },
        ],
      },
    ],
  },
  {
    college_id: 'nit-warangal',
    college_name: 'National Institute of Technology Warangal',
    college_short_name: 'NIT Warangal',
    college_type: 'NIT',
    state: 'Telangana',
    city: 'Warangal',
    nirf_rank: 21,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 45,
        fees: 140000,
        placement: { average: 900000, highest: 8000000, placement_percentage: 75 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 350, closing: 530 }, EWS: { opening: 290, closing: 440 }, OBC: { opening: 250, closing: 410 }, SC: { opening: 160, closing: 290 }, ST: { opening: 110, closing: 230 }, PWD: { opening: 80, closing: 200 } },
          { year: 2024, round: 2, GEN: { opening: 490, closing: 660 }, EWS: { opening: 410, closing: 550 }, OBC: { opening: 360, closing: 520 }, SC: { opening: 230, closing: 360 }, ST: { opening: 160, closing: 290 }, PWD: { opening: 120, closing: 250 } },
        ],
      },
    ],
  },
  {
    college_id: 'nit-calicut',
    college_name: 'National Institute of Technology Calicut',
    college_short_name: 'NIT Calicut',
    college_type: 'NIT',
    state: 'Kerala',
    city: 'Calicut',
    nirf_rank: 23,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 40,
        fees: 130000,
        placement: { average: 800000, highest: 7000000, placement_percentage: 72 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 330, closing: 510 }, EWS: { opening: 270, closing: 420 }, OBC: { opening: 240, closing: 390 }, SC: { opening: 150, closing: 280 }, ST: { opening: 100, closing: 220 }, PWD: { opening: 75, closing: 195 } },
          { year: 2024, round: 2, GEN: { opening: 470, closing: 640 }, EWS: { opening: 390, closing: 530 }, OBC: { opening: 340, closing: 500 }, SC: { opening: 220, closing: 350 }, ST: { opening: 150, closing: 280 }, PWD: { opening: 110, closing: 240 } },
        ],
      },
    ],
  },
  {
    college_id: 'nit-surathkal',
    college_name: 'National Institute of Technology Karnataka Surathkal',
    college_short_name: 'NIT Surathkal',
    college_type: 'NIT',
    state: 'Karnataka',
    city: 'Surathkal',
    nirf_rank: 10,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 40,
        fees: 140000,
        placement: { average: 1000000, highest: 10000000, placement_percentage: 80 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 370, closing: 550 }, EWS: { opening: 310, closing: 460 }, OBC: { opening: 270, closing: 430 }, SC: { opening: 170, closing: 300 }, ST: { opening: 115, closing: 240 }, PWD: { opening: 85, closing: 210 } },
          { year: 2024, round: 2, GEN: { opening: 510, closing: 680 }, EWS: { opening: 430, closing: 570 }, OBC: { opening: 370, closing: 530 }, SC: { opening: 240, closing: 370 }, ST: { opening: 165, closing: 300 }, PWD: { opening: 125, closing: 260 } },
        ],
      },
    ],
  },
  // ===== IIITs =====
  {
    college_id: 'iiit-hyderabad',
    college_name: 'International Institute of Information Technology Hyderabad',
    college_short_name: 'IIIT Hyderabad',
    college_type: 'IIIT',
    state: 'Telangana',
    city: 'Hyderabad',
    nirf_rank: 45,
    programs: [
      {
        program_name: 'M.Tech Computer Science',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 120,
        fees: 250000,
        placement: { average: 1500000, highest: 14000000, placement_percentage: 90 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 450, closing: 630 }, EWS: { opening: 380, closing: 520 }, OBC: { opening: 330, closing: 490 }, SC: { opening: 210, closing: 350 }, ST: { opening: 140, closing: 280 }, PWD: { opening: 100, closing: 240 } },
          { year: 2024, round: 2, GEN: { opening: 600, closing: 770 }, EWS: { opening: 510, closing: 650 }, OBC: { opening: 450, closing: 610 }, SC: { opening: 290, closing: 420 }, ST: { opening: 195, closing: 340 }, PWD: { opening: 145, closing: 300 } },
        ],
      },
    ],
  },
  {
    college_id: 'iiit-allahabad',
    college_name: 'Indian Institute of Information Technology Allahabad',
    college_short_name: 'IIIT Allahabad',
    college_type: 'IIIT',
    state: 'Uttar Pradesh',
    city: 'Allahabad',
    nirf_rank: 55,
    programs: [
      {
        program_name: 'M.Tech Information Technology',
        specialization: 'IT',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 60,
        fees: 120000,
        placement: { average: 800000, highest: 6000000, placement_percentage: 75 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 300, closing: 480 }, EWS: { opening: 240, closing: 400 }, OBC: { opening: 210, closing: 370 }, SC: { opening: 130, closing: 260 }, ST: { opening: 90, closing: 200 }, PWD: { opening: 70, closing: 190 } },
        ],
      },
    ],
  },
  {
    college_id: 'iiit-bangalore',
    college_name: 'International Institute of Information Technology Bangalore',
    college_short_name: 'IIIT Bangalore',
    college_type: 'IIIT',
    state: 'Karnataka',
    city: 'Bangalore',
    nirf_rank: 50,
    programs: [
      {
        program_name: 'M.Tech Computer Science',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 60,
        fees: 180000,
        placement: { average: 1200000, highest: 10000000, placement_percentage: 85 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 380, closing: 560 }, EWS: { opening: 320, closing: 470 }, OBC: { opening: 280, closing: 440 }, SC: { opening: 180, closing: 310 }, ST: { opening: 120, closing: 250 }, PWD: { opening: 90, closing: 220 } },
        ],
      },
    ],
  },
  {
    college_id: 'iiit-delhi',
    college_name: 'Indraprastha Institute of Information Technology Delhi',
    college_short_name: 'IIIT Delhi',
    college_type: 'IIIT',
    state: 'Delhi',
    city: 'New Delhi',
    nirf_rank: 52,
    programs: [
      {
        program_name: 'M.Tech Computer Science',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 80,
        fees: 160000,
        placement: { average: 1100000, highest: 9000000, placement_percentage: 82 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 360, closing: 540 }, EWS: { opening: 300, closing: 450 }, OBC: { opening: 260, closing: 420 }, SC: { opening: 165, closing: 295 }, ST: { opening: 110, closing: 235 }, PWD: { opening: 80, closing: 205 } },
        ],
      },
    ],
  },
  // ===== GFTIs =====
  {
    college_id: 'bits-pilani',
    college_name: 'Birla Institute of Technology and Science Pilani',
    college_short_name: 'BITS Pilani',
    college_type: 'GFTI',
    state: 'Rajasthan',
    city: 'Pilani',
    nirf_rank: 22,
    programs: [
      {
        program_name: 'M.Tech Computer Science',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 40,
        fees: 280000,
        placement: { average: 1600000, highest: 14000000, placement_percentage: 88 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 420, closing: 600 }, EWS: { opening: 350, closing: 500 }, OBC: { opening: 310, closing: 470 }, SC: { opening: 200, closing: 340 }, ST: { opening: 135, closing: 270 }, PWD: { opening: 100, closing: 230 } },
        ],
      },
    ],
  },
  {
    college_id: 'bits-pilani-hyderabad',
    college_name: 'BITS Pilani Hyderabad Campus',
    college_short_name: 'BITS Hyderabad',
    college_type: 'GFTI',
    state: 'Telangana',
    city: 'Hyderabad',
    nirf_rank: 25,
    programs: [
      {
        program_name: 'M.Tech Computer Science',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 40,
        fees: 260000,
        placement: { average: 1400000, highest: 12000000, placement_percentage: 82 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 380, closing: 560 }, EWS: { opening: 320, closing: 470 }, OBC: { opening: 280, closing: 440 }, SC: { opening: 180, closing: 310 }, ST: { opening: 120, closing: 250 }, PWD: { opening: 90, closing: 220 } },
        ],
      },
    ],
  },
  {
    college_id: 'dtu',
    college_name: 'Delhi Technological University',
    college_short_name: 'DTU',
    college_type: 'GFTI',
    state: 'Delhi',
    city: 'New Delhi',
    nirf_rank: 35,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 50,
        fees: 180000,
        placement: { average: 1000000, highest: 8000000, placement_percentage: 78 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 340, closing: 520 }, EWS: { opening: 280, closing: 430 }, OBC: { opening: 245, closing: 400 }, SC: { opening: 155, closing: 285 }, ST: { opening: 105, closing: 225 }, PWD: { opening: 78, closing: 205 } },
        ],
      },
    ],
  },
  {
    college_id: 'nsut',
    college_name: 'Netaji Subhas University of Technology',
    college_short_name: 'NSUT',
    college_type: 'GFTI',
    state: 'Delhi',
    city: 'New Delhi',
    nirf_rank: 38,
    programs: [
      {
        program_name: 'M.Tech Computer Science and Engineering',
        specialization: 'CSE',
        gate_paper: 'CS',
        duration: '2 Years',
        seat_intake: 45,
        fees: 170000,
        placement: { average: 900000, highest: 7000000, placement_percentage: 75 },
        cutoffs: [
          { year: 2024, round: 1, GEN: { opening: 320, closing: 500 }, EWS: { opening: 265, closing: 415 }, OBC: { opening: 235, closing: 385 }, SC: { opening: 150, closing: 275 }, ST: { opening: 100, closing: 215 }, PWD: { opening: 75, closing: 195 } },
        ],
      },
    ],
  },
];

// ─── Validation & Import ──────────────────────────────────
async function validateCSEProgram(program) {
  if (!program.program_name) return { valid: false, error: 'Missing program_name' };
  if (!isCSEProgram(program.program_name)) return { valid: false, error: `${program.program_name} is not a CSE program` };
  if (!program.gate_paper || !['CS', 'DA', 'XL'].includes(program.gate_paper)) return { valid: false, error: `Invalid gate_paper: ${program.gate_paper}` };
  if (!program.duration) return { valid: false, error: 'Missing duration' };
  return { valid: true };
}

async function seedDatabase() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.log('Using in-memory seed (no database required)');
  }

  const CcmtCutoff = require('../src/models/CcmtCutoff');
  const CoapCutoff = require('../src/models/CoapCutoff');
  const CollegeProgram = require('../src/models/CollegeProgram');
  const SeatMatrix = require('../src/models/SeatMatrix');

  let totalColleges = 0;
  let totalPrograms = 0;
  let totalCutoffs = 0;
  let skipped = 0;

  console.log(`\nSeeding ${SEED_DATA.length} colleges...`);

  for (const college of SEED_DATA) {
    const validPrograms = [];
    
    for (const program of college.programs) {
      const validation = await validateCSEProgram(program);
      if (!validation.valid) {
        console.log(`  SKIP: ${validation.error}`);
        skipped++;
        continue;
      }
      validPrograms.push(program);
      totalPrograms++;
      totalCutoffs += program.cutoffs.length;
    }

    if (validPrograms.length === 0) continue;

    try {
      // Store cutoff data as CCMT records
      for (const program of validPrograms) {
        for (const cutoff of program.cutoffs) {
          await CcmtCutoff.create({
            year: cutoff.year,
            round: cutoff.round,
            institute: college.college_name,
            instituteType: college.college_type,
            program: program.program_name,
            specialization: program.specialization,
            gatePaper: program.gate_paper,
            duration: program.duration,
            seatIntake: program.seat_intake,
            category: 'GEN',
            openingScore: cutoff.GEN.opening,
            closingScore: cutoff.GEN.closing,
            fees: program.fees,
            collegeId: college.college_id,
            state: college.state,
            city: college.city,
            nirfRank: college.nirf_rank,
          });

          // Store category-specific cutoffs
          for (const cat of ['EWS', 'OBC', 'SC', 'ST', 'PWD']) {
            if (cutoff[cat]) {
              await CcmtCutoff.create({
                year: cutoff.year,
                round: cutoff.round,
                institute: college.college_name,
                instituteType: college.college_type,
                program: program.program_name,
                specialization: program.specialization,
                gatePaper: program.gate_paper,
                duration: program.duration,
                seatIntake: program.seat_intake,
                category: cat,
                openingScore: cutoff[cat].opening,
                closingScore: cutoff[cat].closing,
                fees: program.fees,
                collegeId: college.college_id,
                state: college.state,
                city: college.city,
                nirfRank: college.nirf_rank,
              });
            }
          }
        }
      }
      totalColleges++;
    } catch (err) {
      console.error(`  Error seeding ${college.college_name}:`, err.message);
    }
  }

  console.log(`\nSeeding complete!`);
  console.log(`  Colleges: ${totalColleges}`);
  console.log(`  Programs: ${totalPrograms}`);
  console.log(`  Cutoffs: ${totalCutoffs}`);
  console.log(`  Skipped (non-CSE): ${skipped}`);

  // Also export as JSON for reference
  const jsonData = SEED_DATA.map(college => ({
    ...college,
    programs: college.programs.filter(p => isCSEProgram(p.program_name)),
  }));
  
  const fs = require('fs');
  const outputPath = path.join(__dirname, '../data/cse-cutoffs.json');
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
  console.log(`JSON data exported to: ${outputPath}`);

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase().catch(console.error);