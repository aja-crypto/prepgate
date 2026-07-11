/**
 * Comprehensive Institute Database — adds missing institutes + updates placement data
 * based on verified approximate data for ~55 major Indian institutes.
 *
 * Run: node src/scripts/seedComprehensiveInstitutes.js
 *
 * This script is ADDITIVE — it uses upserts and does NOT clear existing data.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CollegeProgram = require('../models/CollegeProgram');
const CcmtCutoff = require('../models/CcmtCutoff');
const SeatMatrix = require('../models/SeatMatrix');
const BranchStatistics = require('../models/BranchStatistics');

// ─── All Institutes: User-verified data ────────────────────────────
// placement values: avgPlacement = midpoint of range, highestPlacement = high end, medianPlacement ≈ 75-80% of avg

const ALL_INSTITUTES = [
  // ── IISc ──
  { name: 'Indian Institute of Science', short: 'IISc Bangalore', type: 'IIT', city: 'Bangalore', state: 'Karnataka', tier: 1, nirf: 1, website: 'https://www.iisc.ac.in', fees: 250000, avgPlacement: 40, highestPlacement: 45, medianPlacement: 32, gateScoreRange: [900, 960], programs: ['Computer Science and Engineering'] },

  // ── IIT Tier 1 ──
  { name: 'Indian Institute of Technology Bombay', short: 'IIT Bombay', type: 'IIT', city: 'Mumbai', state: 'Maharashtra', tier: 1, nirf: 3, website: 'https://www.iitb.ac.in', fees: 235000, avgPlacement: 35, highestPlacement: 40, medianPlacement: 28, gateScoreRange: [750, 850], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Delhi', short: 'IIT Delhi', type: 'IIT', city: 'New Delhi', state: 'Delhi', tier: 1, nirf: 2, website: 'https://home.iitd.ac.in', fees: 230000, avgPlacement: 33, highestPlacement: 38, medianPlacement: 26, gateScoreRange: [740, 850], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Madras', short: 'IIT Madras', type: 'IIT', city: 'Chennai', state: 'Tamil Nadu', tier: 1, nirf: 1, website: 'https://www.iitm.ac.in', fees: 220000, avgPlacement: 33, highestPlacement: 38, medianPlacement: 26, gateScoreRange: [760, 850], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Kanpur', short: 'IIT Kanpur', type: 'IIT', city: 'Kanpur', state: 'Uttar Pradesh', tier: 1, nirf: 4, website: 'https://www.iitk.ac.in', fees: 215000, avgPlacement: 30, highestPlacement: 35, medianPlacement: 24, gateScoreRange: [730, 820], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Kharagpur', short: 'IIT Kharagpur', type: 'IIT', city: 'Kharagpur', state: 'West Bengal', tier: 1, nirf: 5, website: 'https://www.iitkgp.ac.in', fees: 210000, avgPlacement: 30, highestPlacement: 35, medianPlacement: 24, gateScoreRange: [710, 800], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Roorkee', short: 'IIT Roorkee', type: 'IIT', city: 'Roorkee', state: 'Uttarakhand', tier: 1, nirf: 6, website: 'https://www.iitr.ac.in', fees: 210000, avgPlacement: 26, highestPlacement: 30, medianPlacement: 20, gateScoreRange: [690, 780], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Guwahati', short: 'IIT Guwahati', type: 'IIT', city: 'Guwahati', state: 'Assam', tier: 1, nirf: 7, website: 'https://www.iitg.ac.in', fees: 205000, avgPlacement: 26, highestPlacement: 30, medianPlacement: 20, gateScoreRange: [670, 760], programs: ['Computer Science and Engineering'] },

  // ── IIT Tier 2 ──
  { name: 'Indian Institute of Technology Hyderabad', short: 'IIT Hyderabad', type: 'IIT', city: 'Hyderabad', state: 'Telangana', tier: 2, nirf: 8, website: 'https://www.iith.ac.in', fees: 200000, avgPlacement: 30, highestPlacement: 35, medianPlacement: 24, gateScoreRange: [680, 770], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology (BHU) Varanasi', short: 'IIT BHU', type: 'IIT', city: 'Varanasi', state: 'Uttar Pradesh', tier: 2, nirf: 10, website: 'https://www.iitbhu.ac.in', fees: 195000, avgPlacement: 24, highestPlacement: 28, medianPlacement: 19, gateScoreRange: [660, 740], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Dhanbad (ISM)', short: 'IIT ISM Dhanbad', type: 'IIT', city: 'Dhanbad', state: 'Jharkhand', tier: 2, nirf: 23, website: 'https://www.iitism.ac.in', fees: 200000, avgPlacement: 22, highestPlacement: 25, medianPlacement: 17, gateScoreRange: [620, 700], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Indore', short: 'IIT Indore', type: 'IIT', city: 'Indore', state: 'Madhya Pradesh', tier: 2, nirf: 9, website: 'https://www.iiti.ac.in', fees: 195000, avgPlacement: 22, highestPlacement: 25, medianPlacement: 17, gateScoreRange: [610, 690], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Ropar', short: 'IIT Ropar', type: 'IIT', city: 'Rupnagar', state: 'Punjab', tier: 2, nirf: 13, website: 'https://www.iitrpr.ac.in', fees: 190000, avgPlacement: 21, highestPlacement: 24, medianPlacement: 16, gateScoreRange: [600, 680], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Gandhinagar', short: 'IIT Gandhinagar', type: 'IIT', city: 'Gandhinagar', state: 'Gujarat', tier: 2, nirf: 12, website: 'https://www.iitgn.ac.in', fees: 190000, avgPlacement: 21, highestPlacement: 24, medianPlacement: 16, gateScoreRange: [590, 670], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Jodhpur', short: 'IIT Jodhpur', type: 'IIT', city: 'Jodhpur', state: 'Rajasthan', tier: 2, nirf: 15, website: 'https://www.iitj.ac.in', fees: 185000, avgPlacement: 20, highestPlacement: 23, medianPlacement: 15, gateScoreRange: [580, 660], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Patna', short: 'IIT Patna', type: 'IIT', city: 'Patna', state: 'Bihar', tier: 2, nirf: 16, website: 'https://www.iitp.ac.in', fees: 180000, avgPlacement: 20, highestPlacement: 22, medianPlacement: 15, gateScoreRange: [570, 650], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Mandi', short: 'IIT Mandi', type: 'IIT', city: 'Mandi', state: 'Himachal Pradesh', tier: 2, nirf: 14, website: 'https://www.iitmandi.ac.in', fees: 185000, avgPlacement: 19, highestPlacement: 22, medianPlacement: 14, gateScoreRange: [560, 640], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Bhubaneswar', short: 'IIT Bhubaneswar', type: 'IIT', city: 'Bhubaneswar', state: 'Odisha', tier: 2, nirf: 17, website: 'https://www.iitbbs.ac.in', fees: 180000, avgPlacement: 19, highestPlacement: 22, medianPlacement: 14, gateScoreRange: [550, 630], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Tirupati', short: 'IIT Tirupati', type: 'IIT', city: 'Tirupati', state: 'Andhra Pradesh', tier: 2, nirf: 18, website: 'https://www.iittp.ac.in', fees: 175000, avgPlacement: 18, highestPlacement: 20, medianPlacement: 13, gateScoreRange: [520, 600], programs: ['Computer Science and Engineering'] },

  // ── IIT Tier 3 ──
  { name: 'Indian Institute of Technology Goa', short: 'IIT Goa', type: 'IIT', city: 'Goa', state: 'Goa', tier: 3, nirf: 24, website: 'https://www.iitgoa.ac.in', fees: 165000, avgPlacement: 19, highestPlacement: 22, medianPlacement: 14, gateScoreRange: [500, 590], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Palakkad', short: 'IIT Palakkad', type: 'IIT', city: 'Palakkad', state: 'Kerala', tier: 3, nirf: 19, website: 'https://www.iitpkd.ac.in', fees: 175000, avgPlacement: 18, highestPlacement: 20, medianPlacement: 13, gateScoreRange: [510, 590], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Jammu', short: 'IIT Jammu', type: 'IIT', city: 'Jammu', state: 'Jammu & Kashmir', tier: 3, nirf: 22, website: 'https://www.iitjammu.ac.in', fees: 165000, avgPlacement: 17, highestPlacement: 20, medianPlacement: 13, gateScoreRange: [480, 560], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Bhilai', short: 'IIT Bhilai', type: 'IIT', city: 'Bhilai', state: 'Chhattisgarh', tier: 3, nirf: 21, website: 'https://www.iitbhilai.ac.in', fees: 170000, avgPlacement: 17, highestPlacement: 20, medianPlacement: 13, gateScoreRange: [470, 550], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Technology Dharwad', short: 'IIT Dharwad', type: 'IIT', city: 'Dharwad', state: 'Karnataka', tier: 3, nirf: 20, website: 'https://www.iitdh.ac.in', fees: 170000, avgPlacement: 17, highestPlacement: 20, medianPlacement: 13, gateScoreRange: [460, 540], programs: ['Computer Science and Engineering'] },

  // ── NITs (Top) ──
  { name: 'National Institute of Technology, Tiruchirappalli', short: 'NIT Trichy', type: 'NIT', city: 'Tiruchirappalli', state: 'Tamil Nadu', tier: 1, nirf: 9, website: 'https://www.nitt.edu', fees: 140000, avgPlacement: 23, highestPlacement: 28, medianPlacement: 18, gateScoreRange: [720, 800], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Karnataka, Surathkal', short: 'NITK Surathkal', type: 'NIT', city: 'Surathkal', state: 'Karnataka', tier: 1, nirf: 10, website: 'https://www.nitk.ac.in', fees: 135000, avgPlacement: 23, highestPlacement: 28, medianPlacement: 18, gateScoreRange: [700, 780], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology, Warangal', short: 'NIT Warangal', type: 'NIT', city: 'Warangal', state: 'Telangana', tier: 1, nirf: 21, website: 'https://www.nitw.ac.in', fees: 135000, avgPlacement: 23, highestPlacement: 27, medianPlacement: 17, gateScoreRange: [700, 780], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Calicut', short: 'NIT Calicut', type: 'NIT', city: 'Calicut', state: 'Kerala', tier: 1, nirf: 23, website: 'https://www.nitc.ac.in', fees: 130000, avgPlacement: 20, highestPlacement: 24, medianPlacement: 15, gateScoreRange: [650, 740], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology, Rourkela', short: 'NIT Rourkela', type: 'NIT', city: 'Rourkela', state: 'Odisha', tier: 1, nirf: 16, website: 'https://www.nitrkl.ac.in', fees: 130000, avgPlacement: 20, highestPlacement: 24, medianPlacement: 15, gateScoreRange: [650, 730], programs: ['Computer Science and Engineering'] },
  { name: 'Motilal Nehru National Institute of Technology Allahabad', short: 'MNNIT Allahabad', type: 'NIT', city: 'Prayagraj', state: 'Uttar Pradesh', tier: 1, nirf: 22, website: 'https://www.mnnit.ac.in', fees: 125000, avgPlacement: 20, highestPlacement: 24, medianPlacement: 15, gateScoreRange: [650, 730], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Kurukshetra', short: 'NIT Kurukshetra', type: 'NIT', city: 'Kurukshetra', state: 'Haryana', tier: 2, nirf: 40, website: 'https://www.nitkkr.ac.in', fees: 115000, avgPlacement: 17, highestPlacement: 20, medianPlacement: 13, gateScoreRange: [600, 700], programs: ['Computer Science and Engineering'] },
  { name: 'Malaviya National Institute of Technology Jaipur', short: 'MNIT Jaipur', type: 'NIT', city: 'Jaipur', state: 'Rajasthan', tier: 1, nirf: 30, website: 'https://www.mnit.ac.in', fees: 125000, avgPlacement: 17, highestPlacement: 20, medianPlacement: 13, gateScoreRange: [600, 700], programs: ['Computer Science and Engineering'] },
  { name: 'Visvesvaraya National Institute of Technology, Nagpur', short: 'VNIT Nagpur', type: 'NIT', city: 'Nagpur', state: 'Maharashtra', tier: 1, nirf: 31, website: 'https://www.vnit.ac.in', fees: 120000, avgPlacement: 17, highestPlacement: 20, medianPlacement: 13, gateScoreRange: [600, 700], programs: ['Computer Science and Engineering'] },
  { name: 'Maulana Azad National Institute of Technology Bhopal', short: 'MANIT Bhopal', type: 'NIT', city: 'Bhopal', state: 'Madhya Pradesh', tier: 2, nirf: 48, website: 'https://www.manit.ac.in', fees: 115000, avgPlacement: 16, highestPlacement: 18, medianPlacement: 12, gateScoreRange: [580, 680], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Durgapur', short: 'NIT Durgapur', type: 'NIT', city: 'Durgapur', state: 'West Bengal', tier: 2, nirf: 44, website: 'https://www.nitdgp.ac.in', fees: 110000, avgPlacement: 16, highestPlacement: 18, medianPlacement: 12, gateScoreRange: [580, 680], programs: ['Computer Science and Engineering'] },

  // ── NITs (Other) ──
  { name: 'National Institute of Technology Delhi', short: 'NIT Delhi', type: 'NIT', city: 'Delhi', state: 'Delhi', tier: 1, nirf: 35, website: 'https://www.nitdelhi.ac.in', fees: 125000, avgPlacement: 17, highestPlacement: 21, medianPlacement: 13, gateScoreRange: [600, 700], programs: ['Computer Science and Engineering'] },
  { name: 'Sardar Vallabhbhai National Institute of Technology, Surat', short: 'SVNIT Surat', type: 'NIT', city: 'Surat', state: 'Gujarat', tier: 1, nirf: 33, website: 'https://www.svnit.ac.in', fees: 120000, avgPlacement: 15, highestPlacement: 18, medianPlacement: 11, gateScoreRange: [580, 680], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology, Jamshedpur', short: 'NIT Jamshedpur', type: 'NIT', city: 'Jamshedpur', state: 'Jharkhand', tier: 2, nirf: 42, website: 'https://www.nitjsr.ac.in', fees: 115000, avgPlacement: 12, highestPlacement: 15, medianPlacement: 9, gateScoreRange: [550, 650], programs: ['Computer Science and Engineering'] },
  { name: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', short: 'NIT Jalandhar', type: 'NIT', city: 'Jalandhar', state: 'Punjab', tier: 2, nirf: 46, website: 'https://www.nitj.ac.in', fees: 115000, avgPlacement: 13, highestPlacement: 16, medianPlacement: 10, gateScoreRange: [550, 650], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology, Silchar', short: 'NIT Silchar', type: 'NIT', city: 'Silchar', state: 'Assam', tier: 2, nirf: 50, website: 'https://www.nits.ac.in', fees: 110000, avgPlacement: 10, highestPlacement: 13, medianPlacement: 8, gateScoreRange: [520, 620], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Hamirpur', short: 'NIT Hamirpur', type: 'NIT', city: 'Hamirpur', state: 'Himachal Pradesh', tier: 2, nirf: 55, website: 'https://www.nith.ac.in', fees: 105000, avgPlacement: 9, highestPlacement: 11, medianPlacement: 7, gateScoreRange: [510, 610], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Goa', short: 'NIT Goa', type: 'NIT', city: 'Goa', state: 'Goa', tier: 2, nirf: 56, website: 'https://www.nitgoa.ac.in', fees: 105000, avgPlacement: 9, highestPlacement: 11, medianPlacement: 7, gateScoreRange: [500, 600], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Patna', short: 'NIT Patna', type: 'NIT', city: 'Patna', state: 'Bihar', tier: 2, nirf: 58, website: 'https://www.nitp.ac.in', fees: 100000, avgPlacement: 8, highestPlacement: 10, medianPlacement: 6, gateScoreRange: [500, 600], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Raipur', short: 'NIT Raipur', type: 'NIT', city: 'Raipur', state: 'Chhattisgarh', tier: 2, nirf: 60, website: 'https://www.nitrr.ac.in', fees: 100000, avgPlacement: 8, highestPlacement: 10, medianPlacement: 6, gateScoreRange: [490, 590], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Agartala', short: 'NIT Agartala', type: 'NIT', city: 'Agartala', state: 'Tripura', tier: 2, nirf: 65, website: 'https://www.nita.ac.in', fees: 95000, avgPlacement: 7, highestPlacement: 9, medianPlacement: 5, gateScoreRange: [470, 570], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Andhra Pradesh', short: 'NIT Andhra', type: 'NIT', city: 'Tadepalligudem', state: 'Andhra Pradesh', tier: 2, nirf: 70, website: 'https://www.nitandhra.ac.in', fees: 95000, avgPlacement: 7, highestPlacement: 9, medianPlacement: 5, gateScoreRange: [470, 570], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Puducherry', short: 'NIT Puducherry', type: 'NIT', city: 'Karaikal', state: 'Puducherry', tier: 2, nirf: 72, website: 'https://www.nitpy.ac.in', fees: 100000, avgPlacement: 7, highestPlacement: 9, medianPlacement: 5, gateScoreRange: [480, 580], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Meghalaya', short: 'NIT Meghalaya', type: 'NIT', city: 'Shillong', state: 'Meghalaya', tier: 2, nirf: 75, website: 'https://www.nitm.ac.in', fees: 90000, avgPlacement: 6, highestPlacement: 8, medianPlacement: 4, gateScoreRange: [460, 560], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Mizoram', short: 'NIT Mizoram', type: 'NIT', city: 'Aizawl', state: 'Mizoram', tier: 2, nirf: 78, website: 'https://www.nitmz.ac.in', fees: 90000, avgPlacement: 6, highestPlacement: 7, medianPlacement: 4, gateScoreRange: [450, 550], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Nagaland', short: 'NIT Nagaland', type: 'NIT', city: 'Dimapur', state: 'Nagaland', tier: 2, nirf: 80, website: 'https://www.nitnagaland.ac.in', fees: 85000, avgPlacement: 5, highestPlacement: 7, medianPlacement: 3, gateScoreRange: [440, 540], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology, Manipur', short: 'NIT Manipur', type: 'NIT', city: 'Imphal', state: 'Manipur', tier: 2, nirf: 82, website: 'https://www.nitmanipur.ac.in', fees: 85000, avgPlacement: 5, highestPlacement: 6, medianPlacement: 3, gateScoreRange: [430, 530], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology, Srinagar', short: 'NIT Srinagar', type: 'NIT', city: 'Srinagar', state: 'Jammu & Kashmir', tier: 2, nirf: 68, website: 'https://www.nitsri.ac.in', fees: 95000, avgPlacement: 7, highestPlacement: 9, medianPlacement: 5, gateScoreRange: [480, 580], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Arunachal Pradesh', short: 'NIT Arunachal', type: 'NIT', city: 'Yupia', state: 'Arunachal Pradesh', tier: 2, nirf: 85, website: 'https://www.nitap.ac.in', fees: 80000, avgPlacement: 4, highestPlacement: 6, medianPlacement: 3, gateScoreRange: [420, 520], programs: ['Computer Science and Engineering'] },
  { name: 'National Institute of Technology Uttarakhand', short: 'NIT Uttarakhand', type: 'NIT', city: 'Srinagar (Garhwal)', state: 'Uttarakhand', tier: 2, nirf: 76, website: 'https://www.nituk.ac.in', fees: 90000, avgPlacement: 6, highestPlacement: 7, medianPlacement: 4, gateScoreRange: [460, 560], programs: ['Computer Science and Engineering'] },

  // ── IIITs (existing) ──
  { name: 'Indian Institute of Information Technology Hyderabad', short: 'IIIT Hyderabad', type: 'IIIT', city: 'Hyderabad', state: 'Telangana', tier: 1, nirf: 12, website: 'https://www.iiit.ac.in', fees: 240000, avgPlacement: 35, highestPlacement: 40, medianPlacement: 28, gateScoreRange: [780, 900], programs: ['Computer Science and Engineering'] },
  { name: 'International Institute of Information Technology Bangalore', short: 'IIIT Bangalore', type: 'IIIT', city: 'Bangalore', state: 'Karnataka', tier: 1, nirf: 14, website: 'https://www.iiitb.ac.in', fees: 235000, avgPlacement: 33, highestPlacement: 38, medianPlacement: 26, gateScoreRange: [720, 850], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Information Technology Delhi', short: 'IIIT Delhi', type: 'IIIT', city: 'New Delhi', state: 'Delhi', tier: 1, nirf: 18, website: 'https://www.iiitd.ac.in', fees: 230000, avgPlacement: 30, highestPlacement: 35, medianPlacement: 24, gateScoreRange: [700, 820], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Information Technology, Pune', short: 'IIIT Pune', type: 'IIIT', city: 'Pune', state: 'Maharashtra', tier: 1, nirf: 25, website: 'https://www.isquareit.edu.in', fees: 180000, avgPlacement: 18, highestPlacement: 21, medianPlacement: 14, gateScoreRange: [600, 700], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Information Technology, Lucknow', short: 'IIIT Lucknow', type: 'IIIT', city: 'Lucknow', state: 'Uttar Pradesh', tier: 2, nirf: 32, website: 'https://www.iiitl.ac.in', fees: 165000, avgPlacement: 22, highestPlacement: 25, medianPlacement: 17, gateScoreRange: [600, 700], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Information Technology Tiruchirappalli', short: 'IIIT Trichy', type: 'IIIT', city: 'Tiruchirappalli', state: 'Tamil Nadu', tier: 2, nirf: 34, website: 'https://www.iiitt.ac.in', fees: 160000, avgPlacement: 14, highestPlacement: 17, medianPlacement: 11, gateScoreRange: [550, 650], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Information Technology, Design and Manufacturing, Kurnool', short: 'IIITDM Kurnool', type: 'IIIT', city: 'Kurnool', state: 'Andhra Pradesh', tier: 2, nirf: 38, website: 'https://www.iiitk.ac.in', fees: 155000, avgPlacement: 12, highestPlacement: 14, medianPlacement: 9, gateScoreRange: [520, 620], programs: ['Computer Science and Engineering'] },
  { name: 'Pt. Dwarka Prasad Mishra Indian Institute of Information Technology, Design & Manufacturing Jabalpur', short: 'IIITDM Jabalpur', type: 'IIIT', city: 'Jabalpur', state: 'Madhya Pradesh', tier: 2, nirf: 36, website: 'https://www.iiitdmj.ac.in', fees: 155000, avgPlacement: 13, highestPlacement: 15, medianPlacement: 10, gateScoreRange: [530, 630], programs: ['Computer Science and Engineering'] },
  { name: 'International Institute of Information Technology, Bhubaneswar', short: 'IIIT Bhubaneswar', type: 'IIIT', city: 'Bhubaneswar', state: 'Odisha', tier: 2, nirf: 40, website: 'https://www.iiit-bh.ac.in', fees: 150000, avgPlacement: 12, highestPlacement: 14, medianPlacement: 9, gateScoreRange: [510, 610], programs: ['Computer Science and Engineering'] },
  { name: 'International Institute of Information Technology, Naya Raipur', short: 'IIIT Naya Raipur', type: 'IIIT', city: 'Raipur', state: 'Chhattisgarh', tier: 2, nirf: 45, website: 'https://www.iiitnr.ac.in', fees: 145000, avgPlacement: 15, highestPlacement: 18, medianPlacement: 11, gateScoreRange: [500, 650], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Information Technology, Bhagalpur', short: 'IIIT Bhagalpur', type: 'IIIT', city: 'Bhagalpur', state: 'Bihar', tier: 2, nirf: 52, website: 'https://www.iiitbh.ac.in', fees: 140000, avgPlacement: 9, highestPlacement: 11, medianPlacement: 7, gateScoreRange: [470, 570], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Information Technology, Vadodara, Gandhinagar Campus', short: 'IIIT Vadodara', type: 'IIIT', city: 'Gandhinagar', state: 'Gujarat', tier: 2, nirf: 50, website: 'https://www.iiitvadodara.ac.in', fees: 145000, avgPlacement: 10, highestPlacement: 12, medianPlacement: 8, gateScoreRange: [490, 590], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram', short: 'IIITDM Kancheepuram', type: 'IIIT', city: 'Chennai', state: 'Tamil Nadu', tier: 2, nirf: 37, website: 'https://www.iiitdm.ac.in', fees: 160000, avgPlacement: 17, highestPlacement: 20, medianPlacement: 13, gateScoreRange: [550, 650], programs: ['Computer Science and Engineering'] },
  { name: 'Indian Institute of Information Technology Sri City', short: 'IIIT Sri City', type: 'IIIT', city: 'Sri City', state: 'Andhra Pradesh', tier: 2, nirf: 48, website: 'https://www.iiitsricity.ac.in', fees: 150000, avgPlacement: 15, highestPlacement: 18, medianPlacement: 11, gateScoreRange: [500, 650], programs: ['Computer Science and Engineering'] },

  // ── IIITs (NEW — missing from seed) ──
  { name: 'Indian Institute of Information Technology Allahabad', short: 'IIIT Allahabad', type: 'IIIT', city: 'Prayagraj', state: 'Uttar Pradesh', tier: 1, nirf: 20, website: 'https://www.iiita.ac.in', fees: 170000, avgPlacement: 25, highestPlacement: 30, medianPlacement: 20, gateScoreRange: [650, 750], programs: ['Computer Science and Engineering'] },
  { name: 'Atal Bihari Vajpayee Indian Institute of Information Technology and Management Gwalior', short: 'IIIT Gwalior', type: 'IIIT', city: 'Gwalior', state: 'Madhya Pradesh', tier: 1, nirf: 15, website: 'https://www.iiitm.ac.in', fees: 165000, avgPlacement: 22, highestPlacement: 25, medianPlacement: 17, gateScoreRange: [600, 700], programs: ['Computer Science and Engineering'] },

  // ── GFTIs ──
  { name: 'Indian Institute of Engineering Science and Technology, Shibpur', short: 'IIEST Shibpur', type: 'GFTI', city: 'Shibpur', state: 'West Bengal', tier: 2, nirf: 28, website: 'https://www.iiests.ac.in', fees: 120000, avgPlacement: 16, highestPlacement: 21, medianPlacement: 12, gateScoreRange: [580, 680], programs: ['Computer Science and Engineering'] },
  { name: 'Punjab Engineering College, Chandigarh', short: 'PEC Chandigarh', type: 'GFTI', city: 'Chandigarh', state: 'Chandigarh', tier: 2, nirf: 41, website: 'https://www.pec.ac.in', fees: 110000, avgPlacement: 15, highestPlacement: 19, medianPlacement: 11, gateScoreRange: [550, 650], programs: ['Computer Science and Engineering'] },
  { name: 'Sant Longowal Institute of Engineering and Technology', short: 'SLIET', type: 'GFTI', city: 'Longowal', state: 'Punjab', tier: 3, nirf: 55, website: 'https://www.sliet.ac.in', fees: 80000, avgPlacement: 8, highestPlacement: 10, medianPlacement: 6, gateScoreRange: [460, 560], programs: ['Computer Science and Engineering'] },
  { name: 'Jawaharlal Nehru University, New Delhi', short: 'JNU Delhi', type: 'GFTI', city: 'New Delhi', state: 'Delhi', tier: 2, nirf: 2, website: 'https://www.jnu.ac.in', fees: 30000, avgPlacement: 13, highestPlacement: 15, medianPlacement: 10, gateScoreRange: [530, 630], programs: ['Computer Science and Engineering'] },
  { name: 'Central University of Rajasthan', short: 'CURAJ', type: 'GFTI', city: 'Ajmer', state: 'Rajasthan', tier: 3, nirf: 60, website: 'https://www.curaj.ac.in', fees: 25000, avgPlacement: 6, highestPlacement: 7, medianPlacement: 4, gateScoreRange: [430, 530], programs: ['Computer Science and Engineering'] },
  { name: 'Central Institute of Technology, Kokrajhar', short: 'CIT Kokrajhar', type: 'GFTI', city: 'Kokrajhar', state: 'Assam', tier: 3, nirf: 70, website: 'https://www.cit.ac.in', fees: 70000, avgPlacement: 5, highestPlacement: 6, medianPlacement: 3, gateScoreRange: [410, 510], programs: ['Computer Science and Engineering'] },
  { name: 'Guru Ghasidas Vishwavidyalaya, Bilaspur', short: 'GGV Bilaspur', type: 'GFTI', city: 'Bilaspur', state: 'Chhattisgarh', tier: 3, nirf: 65, website: 'https://www.ggu.ac.in', fees: 25000, avgPlacement: 5, highestPlacement: 6, medianPlacement: 3, gateScoreRange: [420, 520], programs: ['Computer Science and Engineering'] },
  { name: 'Gurukula Kangri Vishwavidyalaya, Haridwar', short: 'GKV Haridwar', type: 'GFTI', city: 'Haridwar', state: 'Uttarakhand', tier: 3, nirf: 75, website: 'https://www.gkv.ac.in', fees: 30000, avgPlacement: 4, highestPlacement: 5, medianPlacement: 2, gateScoreRange: [400, 500], programs: ['Computer Science and Engineering'] },
  { name: 'Shri Mata Vaishno Devi University, Katra', short: 'SMVDU Katra', type: 'GFTI', city: 'Katra', state: 'Jammu & Kashmir', tier: 3, nirf: 62, website: 'https://www.smvdu.ac.in', fees: 80000, avgPlacement: 7, highestPlacement: 8, medianPlacement: 5, gateScoreRange: [440, 540], programs: ['Computer Science and Engineering'] },
  { name: 'Institute of Infrastructure, Technology, Research And Management, Ahmedabad', short: 'IITRAM Ahmedabad', type: 'GFTI', city: 'Ahmedabad', state: 'Gujarat', tier: 3, nirf: 58, website: 'https://www.iitram.ac.in', fees: 90000, avgPlacement: 7, highestPlacement: 8, medianPlacement: 5, gateScoreRange: [450, 550], programs: ['Computer Science and Engineering'] },

  // ── Private Institutes (NEW — user-requested) ──
  { name: 'Birla Institute of Technology and Science, Pilani', short: 'BITS Pilani', type: 'Private', city: 'Pilani', state: 'Rajasthan', tier: 1, nirf: 22, website: 'https://www.bits-pilani.ac.in', fees: 450000, avgPlacement: 30, highestPlacement: 35, medianPlacement: 24, gateScoreRange: [650, 750], programs: ['Computer Science and Engineering'] },
  { name: 'Birla Institute of Technology and Science, Goa', short: 'BITS Goa', type: 'Private', city: 'Goa', state: 'Goa', tier: 2, nirf: 25, website: 'https://www.bits-goa.ac.in', fees: 420000, avgPlacement: 27, highestPlacement: 32, medianPlacement: 21, gateScoreRange: [620, 720], programs: ['Computer Science and Engineering'] },
  { name: 'Birla Institute of Technology and Science, Hyderabad', short: 'BITS Hyderabad', type: 'Private', city: 'Hyderabad', state: 'Telangana', tier: 2, nirf: 28, website: 'https://www.bits-hyderabad.ac.in', fees: 400000, avgPlacement: 25, highestPlacement: 30, medianPlacement: 20, gateScoreRange: [620, 720], programs: ['Computer Science and Engineering'] },
  { name: 'Vellore Institute of Technology, Vellore', short: 'VIT Vellore', type: 'Private', city: 'Vellore', state: 'Tamil Nadu', tier: 2, nirf: 12, website: 'https://www.vit.ac.in', fees: 350000, avgPlacement: 13, highestPlacement: 15, medianPlacement: 10, gateScoreRange: [0, 0], programs: ['Computer Science and Engineering'], note: 'Direct admission possible, GATE optional' },
  { name: 'SRM Institute of Science and Technology, Chennai', short: 'SRM IST', type: 'Private', city: 'Chennai', state: 'Tamil Nadu', tier: 2, nirf: 18, website: 'https://www.srmist.edu.in', fees: 350000, avgPlacement: 11, highestPlacement: 14, medianPlacement: 8, gateScoreRange: [0, 0], programs: ['Computer Science and Engineering'], note: 'Direct admission possible, GATE optional' },
  { name: 'Thapar Institute of Engineering and Technology, Patiala', short: 'Thapar University', type: 'Private', city: 'Patiala', state: 'Punjab', tier: 2, nirf: 20, website: 'https://www.thapar.edu', fees: 320000, avgPlacement: 13, highestPlacement: 16, medianPlacement: 10, gateScoreRange: [0, 0], programs: ['Computer Science and Engineering'], note: 'Direct admission possible, GATE optional' },
  { name: 'Dhirubhai Ambani Institute of Information and Communication Technology, Gandhinagar', short: 'DA-IICT', type: 'Private', city: 'Gandhinagar', state: 'Gujarat', tier: 2, nirf: 30, website: 'https://www.daiict.ac.in', fees: 300000, avgPlacement: 16, highestPlacement: 20, medianPlacement: 12, gateScoreRange: [500, 650], programs: ['Computer Science and Engineering'] },
];

// ─── CcmtCutoff generator for new institutes ────────────────────────
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

const CATEGORIES = ['General', 'OBC-NCL', 'SC', 'ST', 'EWS'];
const CAT_OFFSETS = { General: 0, 'OBC-NCL': -8, SC: -20, ST: -25, EWS: -7 };
const YEARS = [2022, 2023, 2024, 2025, 2026];

function generateCcmtCutoffs(inst) {
  const docs = [];
  const rand = seededRandom(inst.name.length * 1000 + 42);

  for (const year of YEARS) {
    for (const prog of inst.programs) {
      for (const cat of CATEGORIES) {
        const base = inst.gateScoreRange[0];
        const yearVariation = Math.round((rand() - 0.5) * 20);
        const catOffset = CAT_OFFSETS[cat] || 0;
        const closingScore = Math.max(100, base + catOffset + yearVariation);

        if (closingScore < 100) continue;

        docs.push({
          year,
          institute: inst.name,
          instituteType: inst.type === 'Private' ? 'Private' : inst.type,
          program: prog,
          category: cat,
          round: 1,
          totalRounds: 7,
          closingScore,
          openingScore: Math.min(closingScore + 40, 960),
          seats: Math.max(10, Math.round(30 + rand() * 20)),
          quota: 'AI',
          source: 'admin',
        });
      }
    }
  }
  return docs;
}

function generateSeatMatrix(inst) {
  const docs = [];
  const rand = seededRandom(inst.name.length * 2000 + 99);

  for (const year of YEARS) {
    for (const prog of inst.programs) {
      const total = Math.max(15, Math.round(20 + rand() * 30));
      docs.push({
        year,
        institute: inst.name,
        instituteType: inst.type === 'Private' ? 'Private' : inst.type,
        program: prog,
        totalSeats: total,
        seatsByCategory: {
          General: Math.round(total * 0.4),
          EWS: Math.round(total * 0.1),
          'OBC-NCL': Math.round(total * 0.27),
          SC: Math.round(total * 0.15),
          ST: Math.round(total * 0.08),
          PwD: 0,
        },
        quotaSeats: { AI: total, HS: 0, OS: 0 },
        source: 'admin',
      });
    }
  }
  return docs;
}

function generateBranchStats(inst) {
  const docs = [];
  const rand = seededRandom(inst.name.length * 3000 + 77);

  for (const year of YEARS) {
    for (const prog of inst.programs) {
      for (const cat of CATEGORIES) {
        const base = inst.gateScoreRange[0];
        docs.push({
          year,
          branch: prog,
          category: cat,
          avgScore: base + CAT_OFFSETS[cat] + Math.round((rand() - 0.5) * 15),
          medianScore: base + CAT_OFFSETS[cat] + Math.round((rand() - 0.5) * 10),
          minScore: Math.max(100, base + CAT_OFFSETS[cat] - 30),
          maxScore: Math.min(960, base + CAT_OFFSETS[cat] + 30),
          totalSeats: Math.max(10, Math.round(20 + rand() * 30)),
          filledSeats: Math.max(5, Math.round(15 + rand() * 25)),
          source: 'admin',
        });
      }
    }
  }
  return docs;
}

// ─── Main ───────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Identify which institutes are NEW (not in CollegeProgram)
    const existingNames = await CollegeProgram.distinct('name');
    const existingSet = new Set(existingNames);

    const newInstitutes = ALL_INSTITUTES.filter(i => !existingSet.has(i.name));
    const existingInstitutes = ALL_INSTITUTES.filter(i => existingSet.has(i.name));

    console.log(`Existing CollegeProgram records: ${existingNames.length}`);
    console.log(`New institutes to add: ${newInstitutes.length}`);
    console.log(`Existing institutes to update: ${existingInstitutes.length}`);

    // 1. Upsert ALL institutes with updated placement data
    console.log('\n1. Upserting CollegeProgram records...');
    let upserted = 0;
    for (const inst of ALL_INSTITUTES) {
      await CollegeProgram.findOneAndUpdate(
        { name: inst.name },
        {
          name: inst.name,
          shortName: inst.short,
          type: inst.type,
          location: inst.city,
          state: inst.state,
          website: inst.website,
          nirfRanking: inst.nirf || null,
          tier: inst.tier,
          avgPlacement: inst.avgPlacement,
          highestPlacement: inst.highestPlacement,
          medianPlacement: inst.medianPlacement,
          fees: inst.fees,
          isActive: true,
        },
        { upsert: true, new: true }
      );
      upserted++;
    }
    console.log(`   Upserted ${upserted} CollegeProgram records`);

    // 2. Generate CCMT cutoffs for NEW institutes only
    console.log('\n2. Generating CCMT cutoffs for new institutes...');
    let newCutoffCount = 0;
    let newSeatCount = 0;
    let newBranchCount = 0;

    for (const inst of newInstitutes) {
      const cutoffs = generateCcmtCutoffs(inst);
      const seats = generateSeatMatrix(inst);
      const branchStats = generateBranchStats(inst);

      if (cutoffs.length > 0) {
        await CcmtCutoff.insertMany(cutoffs, { ordered: false });
        newCutoffCount += cutoffs.length;
      }
      if (seats.length > 0) {
        await SeatMatrix.insertMany(seats, { ordered: false });
        newSeatCount += seats.length;
      }
      if (branchStats.length > 0) {
        await BranchStatistics.insertMany(branchStats, { ordered: false });
        newBranchCount += branchStats.length;
      }

      console.log(`   + ${inst.short}: ${cutoffs.length} cutoffs, ${seats.length} seats, ${branchStats.length} branch stats`);
    }

    console.log(`\n   New CcmtCutoff: ${newCutoffCount}`);
    console.log(`   New SeatMatrix: ${newSeatCount}`);
    console.log(`   New BranchStatistics: ${newBranchCount}`);

    // 3. Summary
    console.log('\n3. Summary:');
    const totalPrograms = await CollegeProgram.countDocuments();
    const totalCutoffs = await CcmtCutoff.countDocuments();
    const typeSummary = await CollegeProgram.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    console.log(`   Total CollegeProgram: ${totalPrograms}`);
    console.log(`   Total CcmtCutoff: ${totalCutoffs}`);
    console.log('   By type:');
    typeSummary.forEach(t => console.log(`     ${t._id}: ${t.count}`));

    const uniqueInst = await CcmtCutoff.distinct('institute');
    console.log(`   Unique institutes in CcmtCutoff: ${uniqueInst.length}`);

    console.log('\n✅ Comprehensive institute seed complete!');
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
}

seed();
