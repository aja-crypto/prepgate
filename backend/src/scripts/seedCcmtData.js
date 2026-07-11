const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CollegeCutoff = require('../models/CollegeCutoff');
const CollegeProgram = require('../models/CollegeProgram');

// ─── REAL CCMT DATA (parsed from official sources) ────────────────
// Source: CCMT 2026 Round 1, Special Round 1 & 2, CCMT 2025 Round 3
// Format: { institute, program, category, openingScore, closingScore, round, year }

const CCMT_DATA = [
  // ═══ CCMT 2026 Round 1 — CSE ═══
  { institute: 'Central Institute of Technology, Kokrajhar', program: 'Computer Science and Engineering', category: 'General', openingScore: 469, closingScore: 469, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology, Jamshedpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 663, closingScore: 631, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology, Srinagar', program: 'Computer Science and Engineering', category: 'General', openingScore: 578, closingScore: 524, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology, Tiruchirappalli', program: 'Computer Science and Engineering', category: 'General', openingScore: 815, closingScore: 782, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology, Warangal', program: 'Computer Science and Engineering', category: 'General', openingScore: 811, closingScore: 766, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Durgapur', program: 'Computer Science and Engineering', category: 'General', openingScore: 710, closingScore: 621, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology, Manipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 548, closingScore: 495, round: 'Round 1', year: 2026 },
  { institute: 'Jawaharlal Nehru University, New Delhi', program: 'Computer Science and Engineering', category: 'General', openingScore: 647, closingScore: 592, round: 'Round 1', year: 2026 },
  { institute: 'Central University of Rajasthan', program: 'Computer Science and Engineering', category: 'General', openingScore: 536, closingScore: 461, round: 'Round 1', year: 2026 },
  { institute: 'Indian Institute of Information Technology, Pune', program: 'Computer Science and Engineering', category: 'General', openingScore: 637, closingScore: 593, round: 'Round 1', year: 2026 },
  { institute: 'Indian Institute of Engineering Science and Technology, Shibpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 734, closingScore: 598, round: 'Round 1', year: 2026 },
  { institute: 'Sant Longowal Institute of Engineering and Technology', program: 'Computer Science and Engineering', category: 'General', openingScore: 484, closingScore: 450, round: 'Round 1', year: 2026 },
  { institute: 'Indian Institute of Information Technology Tiruchirappalli', program: 'Computer Science and Engineering', category: 'General', openingScore: 675, closingScore: 594, round: 'Round 1', year: 2026 },
  { institute: 'International Institute of Information Technology, Bhubaneswar', program: 'Computer Science and Engineering', category: 'General', openingScore: 569, closingScore: 522, round: 'Round 1', year: 2026 },
  { institute: 'Sardar Vallabhbhai National Institute of Technology, Surat', program: 'Computer Science and Engineering', category: 'General', openingScore: 698, closingScore: 632, round: 'Round 1', year: 2026 },
  { institute: 'International Institute of Information Technology, Naya Raipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 561, closingScore: 535, round: 'Round 1', year: 2026 },
  { institute: 'Guru Ghasidas Vishwavidyalaya, Bilaspur', program: 'Computer Science and Engineering', category: 'General', openingScore: 465, closingScore: 430, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Hamirpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 670, closingScore: 585, round: 'Round 1', year: 2026 },
  { institute: 'Gurukula Kangri Vishwavidyalaya, Haridwar', program: 'Computer Science and Engineering', category: 'General', openingScore: 464, closingScore: 426, round: 'Round 1', year: 2026 },
  { institute: 'Indian Institute of Information Technology, Design and Manufacturing, Kurnool', program: 'Computer Science and Engineering', category: 'General', openingScore: 644, closingScore: 520, round: 'Round 1', year: 2026 },
  { institute: 'Punjab Engineering College, Chandigarh', program: 'Computer Science and Engineering', category: 'General', openingScore: 643, closingScore: 529, round: 'Round 1', year: 2026 },
  { institute: 'Visvesvaraya National Institute of Technology, Nagpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 679, closingScore: 648, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Goa', program: 'Computer Science and Engineering', category: 'General', openingScore: 651, closingScore: 590, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Puducherry', program: 'Computer Science and Engineering', category: 'General', openingScore: 665, closingScore: 579, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Raipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 605, closingScore: 564, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology, Silchar', program: 'Computer Science and Engineering', category: 'General', openingScore: 641, closingScore: 575, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Nagaland', program: 'Computer Science and Engineering', category: 'General', openingScore: 526, closingScore: 500, round: 'Round 1', year: 2026 },
  { institute: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', program: 'Computer Science and Engineering', category: 'General', openingScore: 651, closingScore: 606, round: 'Round 1', year: 2026 },
  { institute: 'Malaviya National Institute of Technology Jaipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 704, closingScore: 670, round: 'Round 1', year: 2026 },
  { institute: 'Motilal Nehru National Institute of Technology Allahabad', program: 'Computer Science and Engineering', category: 'General', openingScore: 742, closingScore: 705, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Karnataka, Surathkal', program: 'Computer Science and Engineering', category: 'General', openingScore: 791, closingScore: 761, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Meghalaya', program: 'Computer Science and Engineering', category: 'General', openingScore: 536, closingScore: 506, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Arunachal Pradesh', program: 'Computer Science and Engineering', category: 'General', openingScore: 568, closingScore: 504, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Mizoram', program: 'Computer Science and Engineering', category: 'General', openingScore: 499, closingScore: 491, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Calicut', program: 'Computer Science and Engineering', category: 'General', openingScore: 735, closingScore: 714, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Delhi', program: 'Computer Science and Engineering', category: 'General', openingScore: 686, closingScore: 649, round: 'Round 1', year: 2026 },

  // ═══ CCMT 2026 Round 1 — ECE ═══
  { institute: 'Sant Longowal Institute of Engineering and Technology', program: 'Electronics and Communication Engineering', category: 'General', openingScore: 358, closingScore: 353, round: 'Round 1', year: 2026 },
  { institute: 'Jawaharlal Nehru University, New Delhi', program: 'Electronics and Communication Engineering', category: 'General', openingScore: 487, closingScore: 459, round: 'Round 1', year: 2026 },
  { institute: 'Indian Institute of Information Technology, Pune', program: 'Electronics and Communication Engineering', category: 'General', openingScore: 516, closingScore: 471, round: 'Round 1', year: 2026 },
  { institute: 'Shri Mata Vaishno Devi University, Katra', program: 'Electronics and Communication Engineering', category: 'General', openingScore: 398, closingScore: 357, round: 'Round 1', year: 2026 },
  { institute: 'International Institute of Information Technology, Naya Raipur', program: 'Electronics and Communication Engineering', category: 'General', openingScore: 414, closingScore: 376, round: 'Round 1', year: 2026 },
  { institute: 'Guru Ghasidas Vishwavidyalaya, Bilaspur', program: 'Electronics and Communication Engineering', category: 'General', openingScore: 467, closingScore: 467, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Delhi', program: 'Electronics and Communication Engineering', category: 'General', openingScore: 564, closingScore: 532, round: 'Round 1', year: 2026 },
  { institute: 'Malaviya National Institute of Technology Jaipur', program: 'Electronics and Communication Engineering', category: 'General', openingScore: 544, closingScore: 499, round: 'Round 1', year: 2026 },

  // ═══ CCMT 2026 Round 1 — Electrical Engineering ═══
  { institute: 'Punjab Engineering College, Chandigarh', program: 'Electrical Engineering', category: 'General', openingScore: 425, closingScore: 353, round: 'Round 1', year: 2026 },
  { institute: 'Institute of Infrastructure, Technology, Research And Management, Ahmedabad', program: 'Electrical Engineering', category: 'General', openingScore: 354, closingScore: 354, round: 'Round 1', year: 2026 },

  // ═══ CCMT 2026 Round 1 — VLSI Design ═══
  { institute: 'Sant Longowal Institute of Engineering and Technology', program: 'VLSI Design', category: 'General', openingScore: 426, closingScore: 361, round: 'Round 1', year: 2026 },
  { institute: 'Indian Institute of Engineering Science and Technology, Shibpur', program: 'VLSI Design', category: 'General', openingScore: 585, closingScore: 499, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Puducherry', program: 'VLSI Design', category: 'General', openingScore: 564, closingScore: 495, round: 'Round 1', year: 2026 },
  { institute: 'Visvesvaraya National Institute of Technology, Nagpur', program: 'VLSI Design', category: 'General', openingScore: 670, closingScore: 597, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Karnataka, Surathkal', program: 'VLSI Design', category: 'General', openingScore: 824, closingScore: 751, round: 'Round 1', year: 2026 },
  { institute: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', program: 'VLSI Design', category: 'General', openingScore: 633, closingScore: 572, round: 'Round 1', year: 2026 },
  { institute: 'Malaviya National Institute of Technology Jaipur', program: 'VLSI Design', category: 'General', openingScore: 645, closingScore: 641, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Agartala', program: 'VLSI Design', category: 'General', openingScore: 655, closingScore: 491, round: 'Round 1', year: 2026 },

  // ═══ CCMT 2026 Round 1 — Data Science ═══
  { institute: 'National Institute of Technology, Silchar', program: 'Data Science and Engineering', category: 'General', openingScore: 590, closingScore: 556, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Patna', program: 'Data Science and Engineering', category: 'General', openingScore: 641, closingScore: 557, round: 'Round 1', year: 2026 },
  { institute: 'National Institute of Technology Agartala', program: 'Data Science and Engineering', category: 'General', openingScore: 531, closingScore: 514, round: 'Round 1', year: 2026 },
  { institute: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', program: 'Data Science and Engineering', category: 'General', openingScore: 598, closingScore: 577, round: 'Round 1', year: 2026 },

  // ═══ CCMT 2026 Special Round 2 — CSE ═══
  { institute: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', program: 'Computer Science and Engineering', category: 'General', openingScore: 544, closingScore: 542, round: 'Special Round 2', year: 2026 },
  { institute: 'International Institute of Information Technology, Bhubaneswar', program: 'Computer Science and Engineering', category: 'General', openingScore: 430, closingScore: 424, round: 'Special Round 2', year: 2026 },
  { institute: 'International Institute of Information Technology, Naya Raipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 456, closingScore: 440, round: 'Special Round 2', year: 2026 },
  { institute: 'Punjab Engineering College, Chandigarh', program: 'Computer Science and Engineering', category: 'General', openingScore: 444, closingScore: 433, round: 'Special Round 2', year: 2026 },
  { institute: 'Indian Institute of Information Technology, Design and Manufacturing, Kurnool', program: 'Computer Science and Engineering', category: 'General', openingScore: 423, closingScore: 410, round: 'Special Round 2', year: 2026 },
  { institute: 'Indian Institute of Information Technology, Pune', program: 'Computer Science and Engineering', category: 'General', openingScore: 542, closingScore: 536, round: 'Special Round 2', year: 2026 },
  { institute: 'Indian Institute of Information Technology Tiruchirappalli', program: 'Computer Science and Engineering', category: 'General', openingScore: 446, closingScore: 427, round: 'Special Round 2', year: 2026 },
  { institute: 'Indian Institute of Engineering Science and Technology, Shibpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 535, closingScore: 522, round: 'Special Round 2', year: 2026 },
  { institute: 'Sardar Vallabhbhai National Institute of Technology, Surat', program: 'Computer Science and Engineering', category: 'General', openingScore: 592, closingScore: 585, round: 'Special Round 2', year: 2026 },
  { institute: 'Visvesvaraya National Institute of Technology, Nagpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 605, closingScore: 602, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology, Warangal', program: 'Computer Science and Engineering', category: 'General', openingScore: 735, closingScore: 734, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology, Tiruchirappalli', program: 'Computer Science and Engineering', category: 'General', openingScore: 744, closingScore: 739, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology, Srinagar', program: 'Computer Science and Engineering', category: 'General', openingScore: 446, closingScore: 425, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Mizoram', program: 'Computer Science and Engineering', category: 'General', openingScore: 367, closingScore: 367, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology, Silchar', program: 'Computer Science and Engineering', category: 'General', openingScore: 527, closingScore: 526, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology, Manipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 364, closingScore: 364, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Arunachal Pradesh', program: 'Computer Science and Engineering', category: 'General', openingScore: 389, closingScore: 389, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology, Jamshedpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 589, closingScore: 589, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Nagaland', program: 'Computer Science and Engineering', category: 'General', openingScore: 381, closingScore: 377, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Puducherry', program: 'Computer Science and Engineering', category: 'General', openingScore: 510, closingScore: 510, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Karnataka, Surathkal', program: 'Computer Science and Engineering', category: 'General', openingScore: 722, closingScore: 722, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Meghalaya', program: 'Computer Science and Engineering', category: 'General', openingScore: 436, closingScore: 430, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Hamirpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 539, closingScore: 539, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Durgapur', program: 'Computer Science and Engineering', category: 'General', openingScore: 572, closingScore: 562, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Goa', program: 'Computer Science and Engineering', category: 'General', openingScore: 506, closingScore: 503, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Calicut', program: 'Computer Science and Engineering', category: 'General', openingScore: 672, closingScore: 656, round: 'Special Round 2', year: 2026 },
  { institute: 'National Institute of Technology Delhi', program: 'Computer Science and Engineering', category: 'General', openingScore: 621, closingScore: 621, round: 'Special Round 2', year: 2026 },
  { institute: 'Motilal Nehru National Institute of Technology Allahabad', program: 'Computer Science and Engineering', category: 'General', openingScore: 658, closingScore: 656, round: 'Special Round 2', year: 2026 },

  // ═══ CCMT 2025 Special Round 1 — CSE ═══
  { institute: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', program: 'Computer Science and Engineering', category: 'General', openingScore: 557, closingScore: 548, round: 'Special Round 1', year: 2025 },
  { institute: 'Jawaharlal Nehru University, New Delhi', program: 'Computer Science and Engineering', category: 'General', openingScore: 557, closingScore: 509, round: 'Special Round 1', year: 2025 },
  { institute: 'Guru Ghasidas Vishwavidyalaya, Bilaspur', program: 'Computer Science and Engineering', category: 'General', openingScore: 408, closingScore: 353, round: 'Special Round 1', year: 2025 },
  { institute: 'International Institute of Information Technology, Bhubaneswar', program: 'Computer Science and Engineering', category: 'General', openingScore: 552, closingScore: 435, round: 'Special Round 1', year: 2025 },
  { institute: 'Central Institute of Technology, Kokrajhar', program: 'Computer Science and Engineering', category: 'General', openingScore: 393, closingScore: 393, round: 'Special Round 1', year: 2025 },
  { institute: 'Central University of Rajasthan', program: 'Computer Science and Engineering', category: 'General', openingScore: 417, closingScore: 379, round: 'Special Round 1', year: 2025 },
  { institute: 'International Institute of Information Technology, Naya Raipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 477, closingScore: 466, round: 'Special Round 1', year: 2025 },
  { institute: 'Punjab Engineering College, Chandigarh', program: 'Computer Science and Engineering', category: 'General', openingScore: 514, closingScore: 448, round: 'Special Round 1', year: 2025 },
  { institute: 'Indian Institute of Information Technology, Pune', program: 'Computer Science and Engineering', category: 'General', openingScore: 582, closingScore: 548, round: 'Special Round 1', year: 2025 },
  { institute: 'Sant Longowal Institute of Engineering and Technology', program: 'Computer Science and Engineering', category: 'General', openingScore: 390, closingScore: 360, round: 'Special Round 1', year: 2025 },
  { institute: 'Indian Institute of Information Technology, Design and Manufacturing, Kurnool', program: 'Computer Science and Engineering', category: 'General', openingScore: 445, closingScore: 426, round: 'Special Round 1', year: 2025 },
  { institute: 'Indian Institute of Information Technology Tiruchirappalli', program: 'Computer Science and Engineering', category: 'General', openingScore: 710, closingScore: 468, round: 'Special Round 1', year: 2025 },
  { institute: 'Indian Institute of Engineering Science and Technology, Shibpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 556, closingScore: 543, round: 'Special Round 1', year: 2025 },
  { institute: 'Visvesvaraya National Institute of Technology, Nagpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 627, closingScore: 606, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology, Warangal', program: 'Computer Science and Engineering', category: 'General', openingScore: 744, closingScore: 735, round: 'Special Round 1', year: 2025 },
  { institute: 'Sardar Vallabhbhai National Institute of Technology, Surat', program: 'Computer Science and Engineering', category: 'General', openingScore: 622, closingScore: 593, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology, Tiruchirappalli', program: 'Computer Science and Engineering', category: 'General', openingScore: 760, closingScore: 747, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology, Silchar', program: 'Computer Science and Engineering', category: 'General', openingScore: 622, closingScore: 531, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology, Srinagar', program: 'Computer Science and Engineering', category: 'General', openingScore: 477, closingScore: 452, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Mizoram', program: 'Computer Science and Engineering', category: 'General', openingScore: 390, closingScore: 373, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology, Jamshedpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 602, closingScore: 592, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology, Manipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 433, closingScore: 374, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Arunachal Pradesh', program: 'Computer Science and Engineering', category: 'General', openingScore: 453, closingScore: 400, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Nagaland', program: 'Computer Science and Engineering', category: 'General', openingScore: 403, closingScore: 385, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Puducherry', program: 'Computer Science and Engineering', category: 'General', openingScore: 602, closingScore: 560, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Meghalaya', program: 'Computer Science and Engineering', category: 'General', openingScore: 468, closingScore: 443, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Karnataka, Surathkal', program: 'Computer Science and Engineering', category: 'General', openingScore: 735, closingScore: 724, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Hamirpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 562, closingScore: 539, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Durgapur', program: 'Computer Science and Engineering', category: 'General', openingScore: 602, closingScore: 572, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Goa', program: 'Computer Science and Engineering', category: 'General', openingScore: 555, closingScore: 519, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Delhi', program: 'Computer Science and Engineering', category: 'General', openingScore: 643, closingScore: 631, round: 'Special Round 1', year: 2025 },
  { institute: 'Motilal Nehru National Institute of Technology Allahabad', program: 'Computer Science and Engineering', category: 'General', openingScore: 689, closingScore: 660, round: 'Special Round 1', year: 2025 },
  { institute: 'National Institute of Technology Calicut', program: 'Computer Science and Engineering', category: 'General', openingScore: 697, closingScore: 672, round: 'Special Round 1', year: 2025 },
  { institute: 'Malaviya National Institute of Technology Jaipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 714, closingScore: 639, round: 'Special Round 1', year: 2025 },

  // ═══ CCMT 2025 Round 3 — CSE + Specializations ═══
  { institute: 'National Institute of Technology Calicut', program: 'Computer Science & Engineering (Information Security)', category: 'General', openingScore: 688, closingScore: 685, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Karnataka, Surathkal', program: 'Computer Science & Engineering (Information Security)', category: 'General', openingScore: 724, closingScore: 722, round: 'Round 3', year: 2025 },
  { institute: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', program: 'Computer Science and Engineering', category: 'General', openingScore: 572, closingScore: 565, round: 'Round 3', year: 2025 },
  { institute: 'Jawaharlal Nehru University, New Delhi', program: 'Computer Science and Engineering', category: 'General', openingScore: 559, closingScore: 559, round: 'Round 3', year: 2025 },
  { institute: 'Central University of Rajasthan', program: 'Computer Science and Engineering', category: 'General', openingScore: 427, closingScore: 414, round: 'Round 3', year: 2025 },
  { institute: 'Guru Ghasidas Vishwavidyalaya, Bilaspur', program: 'Computer Science and Engineering', category: 'General', openingScore: 385, closingScore: 371, round: 'Round 3', year: 2025 },
  { institute: 'International Institute of Information Technology, Bhubaneswar', program: 'Computer Science and Engineering', category: 'General', openingScore: 481, closingScore: 477, round: 'Round 3', year: 2025 },
  { institute: 'Central Institute of Technology, Kokrajhar', program: 'Computer Science and Engineering', category: 'General', openingScore: 443, closingScore: 443, round: 'Round 3', year: 2025 },
  { institute: 'International Institute of Information Technology, Naya Raipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 493, closingScore: 493, round: 'Round 3', year: 2025 },
  { institute: 'Punjab Engineering College, Chandigarh', program: 'Computer Science and Engineering', category: 'General', openingScore: 476, closingScore: 466, round: 'Round 3', year: 2025 },
  { institute: 'Indian Institute of Information Technology, Pune', program: 'Computer Science and Engineering', category: 'General', openingScore: 560, closingScore: 555, round: 'Round 3', year: 2025 },
  { institute: 'Sant Longowal Institute of Engineering and Technology', program: 'Computer Science and Engineering', category: 'General', openingScore: 398, closingScore: 371, round: 'Round 3', year: 2025 },
  { institute: 'Indian Institute of Information Technology Tiruchirappalli', program: 'Computer Science and Engineering', category: 'General', openingScore: 523, closingScore: 498, round: 'Round 3', year: 2025 },
  { institute: 'Indian Institute of Information Technology, Design and Manufacturing, Kurnool', program: 'Computer Science and Engineering', category: 'General', openingScore: 469, closingScore: 456, round: 'Round 3', year: 2025 },
  { institute: 'Indian Institute of Engineering Science and Technology, Shibpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 581, closingScore: 577, round: 'Round 3', year: 2025 },
  { institute: 'Visvesvaraya National Institute of Technology, Nagpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 645, closingScore: 639, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology, Warangal', program: 'Computer Science and Engineering', category: 'General', openingScore: 754, closingScore: 752, round: 'Round 3', year: 2025 },
  { institute: 'Sardar Vallabhbhai National Institute of Technology, Surat', program: 'Computer Science and Engineering', category: 'General', openingScore: 622, closingScore: 618, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology, Srinagar', program: 'Computer Science and Engineering', category: 'General', openingScore: 493, closingScore: 493, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology, Tiruchirappalli', program: 'Computer Science and Engineering', category: 'General', openingScore: 764, closingScore: 761, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Mizoram', program: 'Computer Science and Engineering', category: 'General', openingScore: 446, closingScore: 445, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology, Silchar', program: 'Computer Science and Engineering', category: 'General', openingScore: 585, closingScore: 569, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology, Manipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 450, closingScore: 436, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Arunachal Pradesh', program: 'Computer Science and Engineering', category: 'General', openingScore: 452, closingScore: 448, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology, Jamshedpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 602, closingScore: 602, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Nagaland', program: 'Computer Science and Engineering', category: 'General', openingScore: 456, closingScore: 450, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Meghalaya', program: 'Computer Science and Engineering', category: 'General', openingScore: 468, closingScore: 453, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Hamirpur', program: 'Computer Science and Engineering', category: 'General', openingScore: 564, closingScore: 564, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Karnataka, Surathkal', program: 'Computer Science and Engineering', category: 'General', openingScore: 752, closingScore: 743, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Goa', program: 'Computer Science and Engineering', category: 'General', openingScore: 562, closingScore: 556, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Delhi', program: 'Computer Science and Engineering', category: 'General', openingScore: 645, closingScore: 635, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Durgapur', program: 'Computer Science and Engineering', category: 'General', openingScore: 608, closingScore: 597, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Calicut', program: 'Computer Science and Engineering', category: 'General', openingScore: 714, closingScore: 706, round: 'Round 3', year: 2025 },
  { institute: 'Malaviya National Institute of Technology Jaipur', program: 'Computer Science and Engineering', category: 'General', openingScore: 657, closingScore: 652, round: 'Round 3', year: 2025 },
  { institute: 'Motilal Nehru National Institute of Technology Allahabad', program: 'Computer Science and Engineering', category: 'General', openingScore: 688, closingScore: 678, round: 'Round 3', year: 2025 },

  // ═══ CCMT 2025 Round 3 — AI/DS/Specializations ═══
  { institute: 'National Institute of Technology Durgapur', program: 'Artificial Intelligence & Data Science', category: 'General', openingScore: 595, closingScore: 595, round: 'Round 3', year: 2025 },
  { institute: 'Indian Institute of Information Technology, Design and Manufacturing, Kurnool', program: 'Artificial Intelligence & Data Science', category: 'General', openingScore: 467, closingScore: 448, round: 'Round 3', year: 2025 },
  { institute: 'Indian Institute of Information Technology, Bhagalpur', program: 'Artificial Intelligence & Data Science', category: 'General', openingScore: 479, closingScore: 479, round: 'Round 3', year: 2025 },
  { institute: 'Pt. Dwarka Prasad Mishra Indian Institute of Information Technology, Design & Manufacturing Jabalpur', program: 'Artificial Intelligence and Machine Learning', category: 'General', openingScore: 519, closingScore: 514, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Uttarakhand', program: 'Artificial Intelligence and Machine Learning', category: 'General', openingScore: 506, closingScore: 498, round: 'Round 3', year: 2025 },
  { institute: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', program: 'Artificial Intelligence', category: 'General', openingScore: 564, closingScore: 556, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology, Silchar', program: 'Artificial Intelligence', category: 'General', openingScore: 542, closingScore: 539, round: 'Round 3', year: 2025 },
  { institute: 'Indian Institute of Information Technology, Vadodara, Gandhinagar Campus', program: 'Artificial Intelligence', category: 'General', openingScore: 506, closingScore: 495, round: 'Round 3', year: 2025 },
  { institute: 'Maulana Azad National Institute of Technology Bhopal', program: 'Artificial Intelligence', category: 'General', openingScore: 606, closingScore: 606, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Agartala', program: 'Artificial Intelligence', category: 'General', openingScore: 499, closingScore: 481, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Delhi', program: 'Computer Science & Engineering (Analytics)', category: 'General', openingScore: 628, closingScore: 622, round: 'Round 3', year: 2025 },
  { institute: 'Maulana Azad National Institute of Technology Bhopal', program: 'Advanced Computing', category: 'General', openingScore: 552, closingScore: 532, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology, Rourkela', program: 'Computer Science', category: 'General', openingScore: 714, closingScore: 710, round: 'Round 3', year: 2025 },
  { institute: 'Indian Institute of Information Technology, Lucknow', program: 'Computer Science', category: 'General', openingScore: 580, closingScore: 572, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Agartala', program: 'Cyber Security', category: 'General', openingScore: 468, closingScore: 456, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Patna', program: 'Cyber Security', category: 'General', openingScore: 535, closingScore: 523, round: 'Round 3', year: 2025 },
  { institute: 'National Institute of Technology Patna', program: 'Data Science and Engineering', category: 'General', openingScore: 641, closingScore: 557, round: 'Round 3', year: 2025 },
];

// ─── Institute → Type mapping ────────────────────────────────────────
function classifyInstitute(name) {
  const n = name.toLowerCase();
  if (n.includes('indian institute of technology') || n.startsWith('iit ')) return 'IIT';
  if (n.includes('national institute of technology') || n.startsWith('nit ')) return 'NIT';
  if (n.includes('indian institute of information technology') || n.startsWith('iiit ')) return 'IIIT';
  if (n.includes('pilani') || n.includes('bits')) return 'GFTI';
  return 'GFTI'; // Central universities, engineering colleges = GFTI
}

function classifyState(name) {
  const n = name.toLowerCase();
  const stateMap = {
    'tamil nadu': ['tiruchirappalli', 'chennai', 'madras', 'calicut', 'manipur'],
    'telangana': ['warangal', 'hyderabad'],
    'karnataka': ['surathkal', 'karnataka'],
    'maharashtra': ['nagpur', 'pune', 'bombay'],
    'delhi': ['delhi', 'new delhi'],
    'uttar pradesh': ['allahabad', 'kanpur', 'lucknow', 'varanasi'],
    'rajasthan': ['jaipur', 'jodhpur', 'pilani', 'kota'],
    'west bengal': ['kharagpur', 'kolkata', 'shibpur'],
    'gujarat': ['surat', 'ahmedabad', 'vadodara'],
    'haryana': ['kurukshetra', 'jalandhar'],
    'kerala': ['calicut', 'kozhikode'],
    'odisha': ['rourkela', 'bhubaneswar'],
    'assam': ['guwahati', 'silchar'],
    'jharkhand': ['jamshedpur'],
    'punjab': ['jalandhar', 'chandigarh'],
    'madhya pradesh': ['bhopal', 'jabalpur', 'indore'],
    'uttarakhand': ['haridwar', 'roorkee', 'uttarakhand'],
    'himachal pradesh': ['hamirpur'],
    'goa': ['goa'],
    'puducherry': ['puducherry'],
    'sikkim': ['sikkim'],
    'tripura': ['agartala', 'tripura'],
    'meghalaya': ['meghalaya', 'shillong'],
    'manipur': ['manipur', 'imphal'],
    'nagaland': ['nagaland'],
    'mizoram': ['mizoram'],
    'arunachal pradesh': ['arunachal'],
    'bihar': ['patna', 'bhagalpur'],
    'chhattisgarh': ['bilaspur', 'raipur'],
  };

  for (const [state, keywords] of Object.entries(stateMap)) {
    if (keywords.some(kw => n.includes(kw))) return state;
  }
  return '';
}

// ─── Seed function ────────────────────────────────────────────────
async function seedCcmtData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing CCMT data
    const deleted = await CollegeCutoff.deleteMany({ source: 'ccmt' });
    console.log(`Cleared ${deleted.deletedCount} existing CCMT records`);

    // Transform CCMT data into CollegeCutoff format
    const records = CCMT_DATA.map(item => ({
      collegeName: item.institute,
      collegeType: classifyInstitute(item.institute),
      program: item.program,
      category: item.category,
      admissionType: 'M.Tech',
      year: item.year,
      openingScore: item.openingScore,
      closingScore: item.closingScore,
      round: item.round,
      state: classifyState(item.institute),
      source: 'ccmt',
    }));

    // Batch insert (MongoDB limit: 100k per insertMany)
    const BATCH_SIZE = 500;
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await CollegeCutoff.insertMany(batch, { ordered: false }).catch(err => {
        console.warn(`Batch ${Math.floor(i / BATCH_SIZE)}: ${err.insertedDocs?.length || 0} inserted, ${err.writeErrors?.length || 0} errors`);
      });
      inserted += batch.length;
      process.stdout.write(`\r  Inserted ${Math.min(inserted, records.length)}/${records.length} records...`);
    }

    console.log(`\n  Total CCMT records seeded: ${records.length}`);

    // Summary by year and round
    const summary = {};
    records.forEach(r => {
      const key = `${r.year} ${r.round}`;
      summary[key] = (summary[key] || 0) + 1;
    });
    console.log('\nBreakdown:');
    Object.entries(summary).sort().forEach(([key, count]) => {
      console.log(`  ${key}: ${count} entries`);
    });

    // Summary by institute type
    const typeSummary = {};
    records.forEach(r => {
      typeSummary[r.collegeType] = (typeSummary[r.collegeType] || 0) + 1;
    });
    console.log('\nBy Institute Type:');
    Object.entries(typeSummary).sort().forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // Unique institutes
    const uniqueInstitutes = [...new Set(records.map(r => r.collegeName))];
    console.log(`\nUnique institutes: ${uniqueInstitutes.length}`);

    // Unique programs
    const uniquePrograms = [...new Set(records.map(r => r.program))];
    console.log(`Unique programs: ${uniquePrograms.length}`);

    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
}

seedCcmtData();
