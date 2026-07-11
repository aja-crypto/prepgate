const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CcmtCutoff = require('../models/CcmtCutoff');
const SeatMatrix = require('../models/SeatMatrix');
const BranchStatistics = require('../models/BranchStatistics');
const CollegeProgram = require('../models/CollegeProgram');

const CATEGORIES = ['General', 'OBC-NCL', 'SC', 'ST', 'EWS'];
const CAT_OFFSETS = { General: 0, 'OBC-NCL': -8, SC: -20, ST: -25, EWS: -7 };
const PROGRAMS = ['Computer Science and Engineering', 'Electronics and Communication Engineering', 'Data Science and Artificial Intelligence', 'Information Technology'];
const PROGRAM_BASE = { 'Computer Science and Engineering': 1.0, 'Electronics and Communication Engineering': 0.85, 'Data Science and Artificial Intelligence': 0.95, 'Information Technology': 0.9 };

const TIER1_IITS = [
  { name: 'Indian Institute of Technology Madras', short: 'IIT Madras', city: 'Chennai', state: 'Tamil Nadu', tier: 1, nirf: 1, website: 'https://www.iitm.ac.in', baseClosing: 850, fees: 220000, avgPlacement: 28, highestPlacement: 72, medianPlacement: 22 },
  { name: 'Indian Institute of Technology Delhi', short: 'IIT Delhi', city: 'New Delhi', state: 'Delhi', tier: 1, nirf: 2, website: 'https://home.iitd.ac.in', baseClosing: 840, fees: 230000, avgPlacement: 30, highestPlacement: 80, medianPlacement: 24 },
  { name: 'Indian Institute of Technology Bombay', short: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra', tier: 1, nirf: 3, website: 'https://www.iitb.ac.in', baseClosing: 845, fees: 235000, avgPlacement: 32, highestPlacement: 85, medianPlacement: 25 },
  { name: 'Indian Institute of Technology Kanpur', short: 'IIT Kanpur', city: 'Kanpur', state: 'Uttar Pradesh', tier: 1, nirf: 4, website: 'https://www.iitk.ac.in', baseClosing: 820, fees: 215000, avgPlacement: 27, highestPlacement: 68, medianPlacement: 21 },
  { name: 'Indian Institute of Technology Kharagpur', short: 'IIT Kharagpur', city: 'Kharagpur', state: 'West Bengal', tier: 1, nirf: 5, website: 'https://www.iitkgp.ac.in', baseClosing: 810, fees: 210000, avgPlacement: 26, highestPlacement: 65, medianPlacement: 20 },
  { name: 'Indian Institute of Technology Roorkee', short: 'IIT Roorkee', city: 'Roorkee', state: 'Uttarakhand', tier: 1, nirf: 6, website: 'https://www.iitr.ac.in', baseClosing: 800, fees: 210000, avgPlacement: 25, highestPlacement: 62, medianPlacement: 19 },
  { name: 'Indian Institute of Technology Guwahati', short: 'IIT Guwahati', city: 'Guwahati', state: 'Assam', tier: 1, nirf: 7, website: 'https://www.iitg.ac.in', baseClosing: 795, fees: 205000, avgPlacement: 24, highestPlacement: 60, medianPlacement: 18 },
];

const TIER2_IITS = [
  { name: 'Indian Institute of Technology Hyderabad', short: 'IIT Hyderabad', city: 'Hyderabad', state: 'Telangana', tier: 2, nirf: 8, website: 'https://www.iith.ac.in', baseClosing: 780, fees: 200000, avgPlacement: 23, highestPlacement: 58, medianPlacement: 17 },
  { name: 'Indian Institute of Technology Indore', short: 'IIT Indore', city: 'Indore', state: 'Madhya Pradesh', tier: 2, nirf: 9, website: 'https://www.iiti.ac.in', baseClosing: 760, fees: 195000, avgPlacement: 21, highestPlacement: 55, medianPlacement: 16 },
  { name: 'Indian Institute of Technology (BHU) Varanasi', short: 'IIT BHU', city: 'Varanasi', state: 'Uttar Pradesh', tier: 2, nirf: 10, website: 'https://www.iitbhu.ac.in', baseClosing: 770, fees: 195000, avgPlacement: 22, highestPlacement: 50, medianPlacement: 16 },
  { name: 'Indian Institute of Technology Gandhinagar', short: 'IIT Gandhinagar', city: 'Gandhinagar', state: 'Gujarat', tier: 2, nirf: 12, website: 'https://www.iitgn.ac.in', baseClosing: 750, fees: 190000, avgPlacement: 20, highestPlacement: 52, medianPlacement: 15 },
  { name: 'Indian Institute of Technology Ropar', short: 'IIT Ropar', city: 'Rupnagar', state: 'Punjab', tier: 2, nirf: 13, website: 'https://www.iitrpr.ac.in', baseClosing: 740, fees: 190000, avgPlacement: 19, highestPlacement: 48, medianPlacement: 14 },
  { name: 'Indian Institute of Technology Mandi', short: 'IIT Mandi', city: 'Mandi', state: 'Himachal Pradesh', tier: 2, nirf: 14, website: 'https://www.iitmandi.ac.in', baseClosing: 730, fees: 185000, avgPlacement: 18, highestPlacement: 45, medianPlacement: 13 },
  { name: 'Indian Institute of Technology Jodhpur', short: 'IIT Jodhpur', city: 'Jodhpur', state: 'Rajasthan', tier: 2, nirf: 15, website: 'https://www.iitj.ac.in', baseClosing: 720, fees: 185000, avgPlacement: 17, highestPlacement: 42, medianPlacement: 13 },
  { name: 'Indian Institute of Technology Patna', short: 'IIT Patna', city: 'Patna', state: 'Bihar', tier: 2, nirf: 16, website: 'https://www.iitp.ac.in', baseClosing: 710, fees: 180000, avgPlacement: 16, highestPlacement: 40, medianPlacement: 12 },
  { name: 'Indian Institute of Technology Bhubaneswar', short: 'IIT Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha', tier: 2, nirf: 17, website: 'https://www.iitbbs.ac.in', baseClosing: 700, fees: 180000, avgPlacement: 15, highestPlacement: 38, medianPlacement: 11 },
  { name: 'Indian Institute of Technology Tirupati', short: 'IIT Tirupati', city: 'Tirupati', state: 'Andhra Pradesh', tier: 2, nirf: 18, website: 'https://www.iittp.ac.in', baseClosing: 690, fees: 175000, avgPlacement: 14, highestPlacement: 35, medianPlacement: 10 },
  { name: 'Indian Institute of Technology Palakkad', short: 'IIT Palakkad', city: 'Palakkad', state: 'Kerala', tier: 3, nirf: 19, website: 'https://www.iitpkd.ac.in', baseClosing: 680, fees: 175000, avgPlacement: 13, highestPlacement: 33, medianPlacement: 9 },
  { name: 'Indian Institute of Technology Dharwad', short: 'IIT Dharwad', city: 'Dharwad', state: 'Karnataka', tier: 3, nirf: 20, website: 'https://www.iitdh.ac.in', baseClosing: 670, fees: 170000, avgPlacement: 12, highestPlacement: 30, medianPlacement: 9 },
  { name: 'Indian Institute of Technology Bhilai', short: 'IIT Bhilai', city: 'Bhilai', state: 'Chhattisgarh', tier: 3, nirf: 21, website: 'https://www.iitbhilai.ac.in', baseClosing: 660, fees: 170000, avgPlacement: 11, highestPlacement: 28, medianPlacement: 8 },
  { name: 'Indian Institute of Technology Jammu', short: 'IIT Jammu', city: 'Jammu', state: 'Jammu & Kashmir', tier: 3, nirf: 22, website: 'https://www.iitjammu.ac.in', baseClosing: 650, fees: 165000, avgPlacement: 10, highestPlacement: 25, medianPlacement: 7 },
  { name: 'Indian Institute of Technology Dhanbad (ISM)', short: 'IIT ISM Dhanbad', city: 'Dhanbad', state: 'Jharkhand', tier: 3, nirf: 23, website: 'https://www.iitism.ac.in', baseClosing: 760, fees: 200000, avgPlacement: 22, highestPlacement: 55, medianPlacement: 16 },
  { name: 'Indian Institute of Technology Goa', short: 'IIT Goa', city: 'Goa', state: 'Goa', tier: 3, nirf: 24, website: 'https://www.iitgoa.ac.in', baseClosing: 640, fees: 165000, avgPlacement: 10, highestPlacement: 24, medianPlacement: 7 },
  { name: 'Indian Institute of Science', short: 'IISc Bangalore', city: 'Bangalore', state: 'Karnataka', tier: 1, nirf: 1, website: 'https://www.iisc.ac.in', baseClosing: 880, fees: 250000, avgPlacement: 35, highestPlacement: 90, medianPlacement: 28 },
];

const ALL_IITS = [...TIER1_IITS, ...TIER2_IITS];

const TOP_NITS = [
  { name: 'National Institute of Technology, Tiruchirappalli', short: 'NIT Trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu', tier: 1, nirf: 9, website: 'https://www.nitt.edu', baseClosing: 770, fees: 140000, avgPlacement: 22, highestPlacement: 55, medianPlacement: 16 },
  { name: 'National Institute of Technology, Warangal', short: 'NIT Warangal', city: 'Warangal', state: 'Telangana', tier: 1, nirf: 21, website: 'https://www.nitw.ac.in', baseClosing: 760, fees: 135000, avgPlacement: 21, highestPlacement: 52, medianPlacement: 15 },
  { name: 'National Institute of Technology Karnataka, Surathkal', short: 'NITK Surathkal', city: 'Surathkal', state: 'Karnataka', tier: 1, nirf: 10, website: 'https://www.nitk.ac.in', baseClosing: 755, fees: 135000, avgPlacement: 21, highestPlacement: 50, medianPlacement: 15 },
  { name: 'National Institute of Technology Calicut', short: 'NIT Calicut', city: 'Calicut', state: 'Kerala', tier: 1, nirf: 23, website: 'https://www.nitc.ac.in', baseClosing: 740, fees: 130000, avgPlacement: 19, highestPlacement: 48, medianPlacement: 14 },
  { name: 'National Institute of Technology, Rourkela', short: 'NIT Rourkela', city: 'Rourkela', state: 'Odisha', tier: 1, nirf: 16, website: 'https://www.nitrkl.ac.in', baseClosing: 730, fees: 130000, avgPlacement: 18, highestPlacement: 45, medianPlacement: 13 },
  { name: 'Motilal Nehru National Institute of Technology Allahabad', short: 'MNNIT Allahabad', city: 'Prayagraj', state: 'Uttar Pradesh', tier: 1, nirf: 22, website: 'https://www.mnnit.ac.in', baseClosing: 720, fees: 125000, avgPlacement: 17, highestPlacement: 42, medianPlacement: 12 },
  { name: 'Malaviya National Institute of Technology Jaipur', short: 'MNIT Jaipur', city: 'Jaipur', state: 'Rajasthan', tier: 1, nirf: 30, website: 'https://www.mnit.ac.in', baseClosing: 710, fees: 125000, avgPlacement: 16, highestPlacement: 40, medianPlacement: 12 },
  { name: 'Visvesvaraya National Institute of Technology, Nagpur', short: 'VNIT Nagpur', city: 'Nagpur', state: 'Maharashtra', tier: 1, nirf: 31, website: 'https://www.vnit.ac.in', baseClosing: 700, fees: 120000, avgPlacement: 15, highestPlacement: 38, medianPlacement: 11 },
  { name: 'National Institute of Technology Delhi', short: 'NIT Delhi', city: 'Delhi', state: 'Delhi', tier: 1, nirf: 35, website: 'https://www.nitdelhi.ac.in', baseClosing: 690, fees: 125000, avgPlacement: 16, highestPlacement: 42, medianPlacement: 12 },
  { name: 'Sardar Vallabhbhai National Institute of Technology, Surat', short: 'SVNIT Surat', city: 'Surat', state: 'Gujarat', tier: 1, nirf: 33, website: 'https://www.svnit.ac.in', baseClosing: 685, fees: 120000, avgPlacement: 14, highestPlacement: 36, medianPlacement: 10 },
];

const OTHER_NITS = [
  { name: 'National Institute of Technology Kurukshetra', short: 'NIT Kurukshetra', city: 'Kurukshetra', state: 'Haryana', tier: 2, nirf: 40, website: 'https://www.nitkkr.ac.in', baseClosing: 660, fees: 115000, avgPlacement: 12, highestPlacement: 32, medianPlacement: 9 },
  { name: 'National Institute of Technology, Jamshedpur', short: 'NIT Jamshedpur', city: 'Jamshedpur', state: 'Jharkhand', tier: 2, nirf: 42, website: 'https://www.nitjsr.ac.in', baseClosing: 650, fees: 115000, avgPlacement: 11, highestPlacement: 30, medianPlacement: 8 },
  { name: 'National Institute of Technology Durgapur', short: 'NIT Durgapur', city: 'Durgapur', state: 'West Bengal', tier: 2, nirf: 44, website: 'https://www.nitdgp.ac.in', baseClosing: 640, fees: 110000, avgPlacement: 10, highestPlacement: 28, medianPlacement: 8 },
  { name: 'National Institute of Technology, Silchar', short: 'NIT Silchar', city: 'Silchar', state: 'Assam', tier: 2, nirf: 50, website: 'https://www.nits.ac.in', baseClosing: 620, fees: 110000, avgPlacement: 9, highestPlacement: 25, medianPlacement: 7 },
  { name: 'National Institute of Technology Hamirpur', short: 'NIT Hamirpur', city: 'Hamirpur', state: 'Himachal Pradesh', tier: 2, nirf: 55, website: 'https://www.nith.ac.in', baseClosing: 610, fees: 105000, avgPlacement: 8, highestPlacement: 22, medianPlacement: 6 },
  { name: 'National Institute of Technology Goa', short: 'NIT Goa', city: 'Goa', state: 'Goa', tier: 2, nirf: 56, website: 'https://www.nitgoa.ac.in', baseClosing: 600, fees: 105000, avgPlacement: 8, highestPlacement: 21, medianPlacement: 6 },
  { name: 'National Institute of Technology Patna', short: 'NIT Patna', city: 'Patna', state: 'Bihar', tier: 2, nirf: 58, website: 'https://www.nitp.ac.in', baseClosing: 590, fees: 100000, avgPlacement: 7, highestPlacement: 20, medianPlacement: 5 },
  { name: 'National Institute of Technology Raipur', short: 'NIT Raipur', city: 'Raipur', state: 'Chhattisgarh', tier: 2, nirf: 60, website: 'https://www.nitrr.ac.in', baseClosing: 580, fees: 100000, avgPlacement: 7, highestPlacement: 19, medianPlacement: 5 },
  { name: 'National Institute of Technology Agartala', short: 'NIT Agartala', city: 'Agartala', state: 'Tripura', tier: 2, nirf: 65, website: 'https://www.nita.ac.in', baseClosing: 560, fees: 95000, avgPlacement: 6, highestPlacement: 17, medianPlacement: 4 },
  { name: 'Dr. B R Ambedkar National Institute of Technology, Jalandhar', short: 'NIT Jalandhar', city: 'Jalandhar', state: 'Punjab', tier: 2, nirf: 46, website: 'https://www.nitj.ac.in', baseClosing: 650, fees: 115000, avgPlacement: 12, highestPlacement: 31, medianPlacement: 9 },
  { name: 'National Institute of Technology Andhra Pradesh', short: 'NIT Andhra', city: 'Tadepalligudem', state: 'Andhra Pradesh', tier: 2, nirf: 70, website: 'https://www.nitandhra.ac.in', baseClosing: 570, fees: 95000, avgPlacement: 6, highestPlacement: 16, medianPlacement: 4 },
  { name: 'National Institute of Technology Puducherry', short: 'NIT Puducherry', city: 'Karaikal', state: 'Puducherry', tier: 2, nirf: 72, website: 'https://www.nitpy.ac.in', baseClosing: 590, fees: 100000, avgPlacement: 6, highestPlacement: 18, medianPlacement: 5 },
  { name: 'National Institute of Technology Meghalaya', short: 'NIT Meghalaya', city: 'Shillong', state: 'Meghalaya', tier: 2, nirf: 75, website: 'https://www.nitm.ac.in', baseClosing: 550, fees: 90000, avgPlacement: 5, highestPlacement: 15, medianPlacement: 4 },
  { name: 'National Institute of Technology Mizoram', short: 'NIT Mizoram', city: 'Aizawl', state: 'Mizoram', tier: 2, nirf: 78, website: 'https://www.nitmz.ac.in', baseClosing: 540, fees: 90000, avgPlacement: 5, highestPlacement: 14, medianPlacement: 3 },
  { name: 'National Institute of Technology Nagaland', short: 'NIT Nagaland', city: 'Dimapur', state: 'Nagaland', tier: 2, nirf: 80, website: 'https://www.nitnagaland.ac.in', baseClosing: 530, fees: 85000, avgPlacement: 4, highestPlacement: 13, medianPlacement: 3 },
  { name: 'National Institute of Technology, Manipur', short: 'NIT Manipur', city: 'Imphal', state: 'Manipur', tier: 2, nirf: 82, website: 'https://www.nitmanipur.ac.in', baseClosing: 520, fees: 85000, avgPlacement: 4, highestPlacement: 12, medianPlacement: 3 },
  { name: 'National Institute of Technology, Srinagar', short: 'NIT Srinagar', city: 'Srinagar', state: 'Jammu & Kashmir', tier: 2, nirf: 68, website: 'https://www.nitsri.ac.in', baseClosing: 570, fees: 95000, avgPlacement: 6, highestPlacement: 17, medianPlacement: 4 },
  { name: 'National Institute of Technology Arunachal Pradesh', short: 'NIT Arunachal', city: 'Yupia', state: 'Arunachal Pradesh', tier: 2, nirf: 85, website: 'https://www.nitap.ac.in', baseClosing: 510, fees: 80000, avgPlacement: 3, highestPlacement: 11, medianPlacement: 2 },
  { name: 'National Institute of Technology Uttarakhand', short: 'NIT Uttarakhand', city: 'Srinagar (Garhwal)', state: 'Uttarakhand', tier: 2, nirf: 76, website: 'https://www.nituk.ac.in', baseClosing: 555, fees: 90000, avgPlacement: 5, highestPlacement: 14, medianPlacement: 4 },
  { name: 'Maulana Azad National Institute of Technology Bhopal', short: 'MANIT Bhopal', city: 'Bhopal', state: 'Madhya Pradesh', tier: 2, nirf: 48, website: 'https://www.manit.ac.in', baseClosing: 670, fees: 115000, avgPlacement: 13, highestPlacement: 35, medianPlacement: 10 },
];

const IIITS = [
  { name: 'Indian Institute of Information Technology Hyderabad', short: 'IIIT Hyderabad', city: 'Hyderabad', state: 'Telangana', tier: 1, nirf: 12, website: 'https://www.iiit.ac.in', baseClosing: 780, fees: 240000, avgPlacement: 28, highestPlacement: 72, medianPlacement: 20 },
  { name: 'International Institute of Information Technology Bangalore', short: 'IIIT Bangalore', city: 'Bangalore', state: 'Karnataka', tier: 1, nirf: 14, website: 'https://www.iiitb.ac.in', baseClosing: 760, fees: 235000, avgPlacement: 27, highestPlacement: 68, medianPlacement: 19 },
  { name: 'Indian Institute of Information Technology Delhi', short: 'IIIT Delhi', city: 'New Delhi', state: 'Delhi', tier: 1, nirf: 18, website: 'https://www.iiitd.ac.in', baseClosing: 750, fees: 230000, avgPlacement: 26, highestPlacement: 65, medianPlacement: 18 },
  { name: 'Indian Institute of Information Technology, Pune', short: 'IIIT Pune', city: 'Pune', state: 'Maharashtra', tier: 1, nirf: 25, website: 'https://www.isquareit.edu.in', baseClosing: 700, fees: 180000, avgPlacement: 17, highestPlacement: 42, medianPlacement: 12 },
  { name: 'Indian Institute of Information Technology, Lucknow', short: 'IIIT Lucknow', city: 'Lucknow', state: 'Uttar Pradesh', tier: 2, nirf: 32, website: 'https://www.iiitl.ac.in', baseClosing: 660, fees: 165000, avgPlacement: 14, highestPlacement: 35, medianPlacement: 10 },
  { name: 'Indian Institute of Information Technology Tiruchirappalli', short: 'IIIT Trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu', tier: 2, nirf: 34, website: 'https://www.iiitt.ac.in', baseClosing: 650, fees: 160000, avgPlacement: 13, highestPlacement: 33, medianPlacement: 9 },
  { name: 'Indian Institute of Information Technology, Design and Manufacturing, Kurnool', short: 'IIITDM Kurnool', city: 'Kurnool', state: 'Andhra Pradesh', tier: 2, nirf: 38, website: 'https://www.iiitk.ac.in', baseClosing: 620, fees: 155000, avgPlacement: 11, highestPlacement: 28, medianPlacement: 8 },
  { name: 'Pt. Dwarka Prasad Mishra Indian Institute of Information Technology, Design & Manufacturing Jabalpur', short: 'IIITDM Jabalpur', city: 'Jabalpur', state: 'Madhya Pradesh', tier: 2, nirf: 36, website: 'https://www.iiitdmj.ac.in', baseClosing: 630, fees: 155000, avgPlacement: 12, highestPlacement: 30, medianPlacement: 8 },
  { name: 'International Institute of Information Technology, Bhubaneswar', short: 'IIIT Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha', tier: 2, nirf: 40, website: 'https://www.iiit-bh.ac.in', baseClosing: 610, fees: 150000, avgPlacement: 11, highestPlacement: 28, medianPlacement: 8 },
  { name: 'International Institute of Information Technology, Naya Raipur', short: 'IIIT Naya Raipur', city: 'Raipur', state: 'Chhattisgarh', tier: 2, nirf: 45, website: 'https://www.iiitnr.ac.in', baseClosing: 590, fees: 145000, avgPlacement: 10, highestPlacement: 25, medianPlacement: 7 },
  { name: 'Indian Institute of Information Technology, Bhagalpur', short: 'IIIT Bhagalpur', city: 'Bhagalpur', state: 'Bihar', tier: 2, nirf: 52, website: 'https://www.iiitbh.ac.in', baseClosing: 560, fees: 140000, avgPlacement: 8, highestPlacement: 20, medianPlacement: 6 },
  { name: 'Indian Institute of Information Technology, Vadodara, Gandhinagar Campus', short: 'IIIT Vadodara', city: 'Gandhinagar', state: 'Gujarat', tier: 2, nirf: 50, website: 'https://www.iiitvadodara.ac.in', baseClosing: 580, fees: 145000, avgPlacement: 9, highestPlacement: 22, medianPlacement: 7 },
  { name: 'Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram', short: 'IIITDM Kancheepuram', city: 'Chennai', state: 'Tamil Nadu', tier: 2, nirf: 37, website: 'https://www.iiitdm.ac.in', baseClosing: 640, fees: 160000, avgPlacement: 13, highestPlacement: 32, medianPlacement: 9 },
  { name: 'Indian Institute of Information Technology Sri City', short: 'IIIT Sri City', city: 'Sri City', state: 'Andhra Pradesh', tier: 2, nirf: 48, website: 'https://www.iiitsricity.ac.in', baseClosing: 600, fees: 150000, avgPlacement: 10, highestPlacement: 26, medianPlacement: 7 },
];

const GFTIS = [
  { name: 'Indian Institute of Engineering Science and Technology, Shibpur', short: 'IIEST Shibpur', city: 'Shibpur', state: 'West Bengal', tier: 2, nirf: 28, website: 'https://www.iiests.ac.in', baseClosing: 680, fees: 120000, avgPlacement: 16, highestPlacement: 42, medianPlacement: 12 },
  { name: 'Punjab Engineering College, Chandigarh', short: 'PEC Chandigarh', city: 'Chandigarh', state: 'Chandigarh', tier: 2, nirf: 41, website: 'https://www.pec.ac.in', baseClosing: 650, fees: 110000, avgPlacement: 14, highestPlacement: 38, medianPlacement: 10 },
  { name: 'Sant Longowal Institute of Engineering and Technology', short: 'SLIET', city: 'Longowal', state: 'Punjab', tier: 3, nirf: 55, website: 'https://www.sliet.ac.in', baseClosing: 550, fees: 80000, avgPlacement: 7, highestPlacement: 20, medianPlacement: 5 },
  { name: 'Jawaharlal Nehru University, New Delhi', short: 'JNU Delhi', city: 'New Delhi', state: 'Delhi', tier: 2, nirf: 2, website: 'https://www.jnu.ac.in', baseClosing: 630, fees: 30000, avgPlacement: 12, highestPlacement: 30, medianPlacement: 8 },
  { name: 'Central University of Rajasthan', short: 'CURAJ', city: 'Ajmer', state: 'Rajasthan', tier: 3, nirf: 60, website: 'https://www.curaj.ac.in', baseClosing: 520, fees: 25000, avgPlacement: 5, highestPlacement: 14, medianPlacement: 3 },
  { name: 'Central Institute of Technology, Kokrajhar', short: 'CIT Kokrajhar', city: 'Kokrajhar', state: 'Assam', tier: 3, nirf: 70, website: 'https://www.cit.ac.in', baseClosing: 500, fees: 70000, avgPlacement: 4, highestPlacement: 12, medianPlacement: 3 },
  { name: 'Guru Ghasidas Vishwavidyalaya, Bilaspur', short: 'GGV Bilaspur', city: 'Bilaspur', state: 'Chhattisgarh', tier: 3, nirf: 65, website: 'https://www.ggu.ac.in', baseClosing: 510, fees: 25000, avgPlacement: 4, highestPlacement: 11, medianPlacement: 3 },
  { name: 'Gurukula Kangri Vishwavidyalaya, Haridwar', short: 'GKV Haridwar', city: 'Haridwar', state: 'Uttarakhand', tier: 3, nirf: 75, website: 'https://www.gkv.ac.in', baseClosing: 490, fees: 30000, avgPlacement: 3, highestPlacement: 10, medianPlacement: 2 },
  { name: 'Shri Mata Vaishno Devi University, Katra', short: 'SMVDU Katra', city: 'Katra', state: 'Jammu & Kashmir', tier: 3, nirf: 62, website: 'https://www.smvdu.ac.in', baseClosing: 530, fees: 80000, avgPlacement: 6, highestPlacement: 16, medianPlacement: 4 },
  { name: 'Institute of Infrastructure, Technology, Research And Management, Ahmedabad', short: 'IITRAM Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', tier: 3, nirf: 58, website: 'https://www.iitram.ac.in', baseClosing: 540, fees: 90000, avgPlacement: 6, highestPlacement: 18, medianPlacement: 4 },
];

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Clear existing data
    await CcmtCutoff.deleteMany({});
    console.log('Cleared CcmtCutoff');

    const allInstitutes = [
      ...ALL_IITS.map(i => ({ ...i, group: 'IIT' })),
      ...TOP_NITS.map(i => ({ ...i, group: 'NIT' })),
      ...OTHER_NITS.map(i => ({ ...i, group: 'NIT' })),
      ...IIITS.map(i => ({ ...i, group: 'IIIT' })),
      ...GFTIS.map(i => ({ ...i, group: 'GFTI' })),
    ];

    const years = [2022, 2023, 2024, 2025, 2026];
    const ccmtDocs = [];
    const seatDocs = [];
    const branchStatsDocs = [];

    for (const inst of allInstitutes) {
      const rand = seededRandom(inst.name.length * 1000 + 42);

      for (const year of years) {
        for (const prog of PROGRAMS) {
          const progFactor = PROGRAM_BASE[prog] || 1.0;
          const yearVariation = (2026 - year) * 12;
          const randomFactor = 0.92 + rand() * 0.16;

          for (const cat of CATEGORIES) {
            const catOffset = CAT_OFFSETS[cat] || 0;
            const baseClose = inst.baseClosing * progFactor * randomFactor - yearVariation;
            const closingScore = Math.round(baseClose + catOffset * 5);
            const openingScore = Math.round(closingScore + 15 + rand() * 30);

            if (closingScore < 100) continue;

            const instType = inst.group === 'IIT' ? 'IIT' : inst.group === 'NIT' ? 'NIT' : inst.group === 'IIIT' ? 'IIIT' : 'GFTI';

            ccmtDocs.push({
              year,
              institute: inst.name,
              instituteType: instType,
              program: prog,
              specialization: '',
              category: cat,
              round: 1,
              openingScore,
              closingScore,
              state: inst.state,
              quota: 'AI',
              source: 'admin',
            });
          }
        }
      }

      // Seat matrix (one per year)
      for (const year of years) {
        for (const prog of PROGRAMS.slice(0, 2)) {
          seatDocs.push({
            year,
            institute: inst.name,
            instituteType: inst.group === 'IIT' ? 'IIT' : inst.group === 'NIT' ? 'NIT' : inst.group === 'IIIT' ? 'IIIT' : 'GFTI',
            program: prog,
            totalSeats: inst.group === 'IIT' ? Math.round(20 + rand() * 30) : inst.group === 'NIT' ? Math.round(25 + rand() * 35) : inst.group === 'IIIT' ? Math.round(15 + rand() * 25) : Math.round(20 + rand() * 20),
            source: 'estimated',
          });
        }
      }

      // Branch statistics (one per year)
      for (const year of years) {
        for (const prog of PROGRAMS.slice(0, 2)) {
          for (const cat of CATEGORIES) {
            branchStatsDocs.push({
              year,
              institute: inst.name,
              branch: prog,
              category: cat,
              avgScore: Math.round(inst.baseClosing * (PROGRAM_BASE[prog] || 1.0) - (2026 - year) * 10 + (CAT_OFFSETS[cat] || 0) * 3),
              minScore: Math.round(inst.baseClosing * (PROGRAM_BASE[prog] || 1.0) - (2026 - year) * 15 + (CAT_OFFSETS[cat] || 0) * 3 - 30),
              maxScore: Math.round(inst.baseClosing * (PROGRAM_BASE[prog] || 1.0) - (2026 - year) * 8 + (CAT_OFFSETS[cat] || 0) * 3 + 30),
              totalSeats: inst.group === 'IIT' ? Math.round(20 + rand() * 30) : Math.round(25 + rand() * 35),
              source: 'estimated',
            });
          }
        }
      }
    }

    // Batch insert CcmtCutoff
    const BATCH = 500;
    for (let i = 0; i < ccmtDocs.length; i += BATCH) {
      await CcmtCutoff.insertMany(ccmtDocs.slice(i, i + BATCH), { ordered: false });
    }
    console.log(`Seeded ${ccmtDocs.length} CcmtCutoff records`);

    // Batch insert seat matrix
    await SeatMatrix.deleteMany({});
    for (let i = 0; i < seatDocs.length; i += BATCH) {
      await SeatMatrix.insertMany(seatDocs.slice(i, i + BATCH), { ordered: false });
    }
    console.log(`Seeded ${seatDocs.length} SeatMatrix records`);

    // Batch insert branch statistics
    await BranchStatistics.deleteMany({});
    for (let i = 0; i < branchStatsDocs.length; i += BATCH) {
      await BranchStatistics.insertMany(branchStatsDocs.slice(i, i + BATCH), { ordered: false });
    }
    console.log(`Seeded ${branchStatsDocs.length} BranchStatistics records`);

    // Upsert CollegeProgram with placement data
    console.log('\nUpserting CollegeProgram data...');
    for (const inst of allInstitutes) {
      await CollegeProgram.findOneAndUpdate(
        { name: inst.name },
        {
          name: inst.name,
          shortName: inst.short,
          type: inst.group === 'IIT' ? 'IIT' : inst.group === 'NIT' ? 'NIT' : inst.group === 'IIIT' ? 'IIIT' : 'GFTI',
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
    }
    const collegeCount = await CollegeProgram.countDocuments();
    console.log(`Upserted ${collegeCount} CollegeProgram records`);

    // Summary
    const typeSummary = await CcmtCutoff.aggregate([{ $group: { _id: '$instituteType', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    console.log('\nBy Institute Type:');
    typeSummary.forEach(t => console.log(`  ${t._id}: ${t.count}`));

    const catSummary = await CcmtCutoff.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    console.log('\nBy Category:');
    catSummary.forEach(c => console.log(`  ${c._id}: ${c.count}`));

    const yearSummary = await CcmtCutoff.aggregate([{ $group: { _id: '$year', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    console.log('\nBy Year:');
    yearSummary.forEach(y => console.log(`  ${y._id}: ${y.count}`));

    const uniqueInst = await CcmtCutoff.distinct('institute');
    console.log(`\nUnique institutes: ${uniqueInst.length}`);
    console.log(`\n✅ Full institute seed complete!`);
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
}

seed();
