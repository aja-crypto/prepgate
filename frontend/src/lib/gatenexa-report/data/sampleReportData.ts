import { ReportData, ProgrammeRow } from '../types/report.types';
import { tierFromPercent, TIER_DEFINITIONS } from '../utils/chanceUtils';
import { formatRange, formatPercent } from '../utils/formatters';

// ---- IIT programme rows (43 total eligible) ----
const iitRowsRaw: Array<[string, string, number, number | null, string | null, string | null]> = [
  ['IIT Patna', 'CSE', 80, 580, 'Rs. 1.8L', 'Rs. 20L'],
  ['IIT Kharagpur', 'Signal Proc. & ML', 73, 588, 'Rs. 2.1L', 'Rs. 30L'],
  ['IIT Dharwad', 'CSE', 69, 600, 'Rs. 1.7L', 'Rs. 17L'],
  ['IIT Bhilai', 'DS & AI', 68, 610, 'Rs. 1.7L', 'Rs. 17L'],
  ['IIT Bhilai', 'CSE', 65, 614, 'Rs. 1.7L', 'Rs. 17L'],
  ['IIT Goa', 'CSE', 64, 618, 'Rs. 1.6L', 'Rs. 19L'],
  ['IIT Tirupati', 'CSE', 58, 655, 'Rs. 1.8L', 'Rs. 18L'],
  ['IIT Ropar', 'AI', 43, 678, 'Rs. 1.9L', 'Rs. 21L'],
  ['IIT Roorkee', 'AI', 41, 683, 'Rs. 2.1L', 'Rs. 26L'],
  ['IIT Roorkee', 'DS', 41, 683, 'Rs. 2.1L', 'Rs. 26L'],
  ['IIT (ISM) Dhanbad', 'AI & DS', 41, 685, null, null],
  ['IIT Delhi', 'CyberSec', 40, 710, 'Rs. 2.3L', 'Rs. 33L'],
  ['IIT Mandi', 'CSE', 40, 689, 'Rs. 1.9L', 'Rs. 19L'],
  ['IIT Palakkad', 'CSE', 40, 689, 'Rs. 1.8L', 'Rs. 18L'],
  ['IIT Kharagpur', 'VLSI & Nanoelectronics', 39, 717, 'Rs. 2.1L', 'Rs. 30L'],
  ['IIT Delhi', 'Machine Intelligence & DS', 38, 720, 'Rs. 2.3L', 'Rs. 33L'],
  ['IIT Roorkee', 'CSE', 36, 712, 'Rs. 2.1L', 'Rs. 26L'],
  ['IIT Kanpur', 'CSE', 33, 740, 'Rs. 2.1L', 'Rs. 30L'],
  ['IIT Kharagpur', 'CSE', 28, 772, 'Rs. 2.1L', 'Rs. 30L'],
  ['IIT Delhi', 'CSE', 19, 800, 'Rs. 2.3L', 'Rs. 33L'],
  ['IIT Bombay', 'CSE', 14, 860, 'Rs. 2.4L', 'Rs. 35L'],
  ['IIT Bombay', 'Comp. & DS', 12, 852, 'Rs. 2.4L', 'Rs. 35L'],
  ['IIT Bombay', 'AI', 11, 925, 'Rs. 2.4L', 'Rs. 35L'],
  ['IIT Madras', 'DS', 11, 843, 'Rs. 2.2L', 'Rs. 33L'],
  ['IIT Madras', 'CSE', 7, 881, 'Rs. 2.2L', 'Rs. 33L'],
];

function buildRows(
  raw: Array<[string, string, number, number | null, string | null, string | null]>
): ProgrammeRow[] {
  return raw.map(([institute, programme, chancePct, cutoff, fees, avgPackage], idx) => ({
    rank: idx + 1,
    institute,
    programme,
    chancePct,
    tier: tierFromPercent(chancePct, TIER_DEFINITIONS),
    cutoff,
    fees,
    avgPackage,
  }));
}

// ---- NIT / IIIT / GFTI programme rows (113 total eligible) ----
const nitRowsRaw: Array<[string, string, number, number | null, string | null, string | null]> = [
  ['NIT Meghalaya', 'CSE', 98, 506, 'Rs. 0.9L', 'Rs. 6L'],
  ['NIT Puducherry', 'CSE', 98, 510, 'Rs. 1.0L', 'Rs. 7L'],
  ['NIT Manipur', 'CSE', 98, 364, 'Rs. 0.8L', 'Rs. 5L'],
  ['NIT Arunachal Pradesh', 'CSE', 98, 504, 'Rs. 0.8L', 'Rs. 4L'],
  ['NIT Nagaland', 'CSE', 97, 500, 'Rs. 0.8L', 'Rs. 5L'],
  ['IISc Bangalore', 'Comp. & DS', 27, 790, 'Rs. 2.5L', 'Rs. 40L'],
  ['IISc Bangalore', 'Robotics & Autonomous Systems', 21, 801, 'Rs. 2.5L', 'Rs. 40L'],
  ['IISc Bangalore', 'Microelect. & VLSI', 11, 928, 'Rs. 2.5L', 'Rs. 40L'],
  ['IISc Bangalore', 'AI', 10, 861, 'Rs. 2.5L', 'Rs. 40L'],
  ['IISc Bangalore', 'Network & Info. Security', 10, 881, 'Rs. 2.5L', 'Rs. 40L'],
];

const IIT_COUNT = 43;
const NON_IIT_COUNT = 113;
const TOTAL_ELIGIBLE = IIT_COUNT + NON_IIT_COUNT; // 156

export const sampleReportData: ReportData = {
  meta: {
    organisationName: 'GateNexa AI',
    reportTitle: 'M.Tech Admission Intelligence Report',
    database: 'CCMT 2025',
    predictionId: 'GTX-26-4A0AF6',
    generatedDate: '17 July 2026',
    reportVersion: '2.0',
    websiteUrl: 'gatenexa.vercel.app',
  },

  candidate: {
    displayName: 'GATE Aspirant',
    qualified: true,
    gateScore: 660,
    predictedAirLow: 315,
    predictedAirHigh: 954,
    eligibleProgrammesCount: TOTAL_ELIGIBLE,
    percentileLabel: 'top 99.7% of the cohort',
    confidencePct: 80,
  },

  executiveSummaryText:
    `Score 660 places the candidate at predicted AIR 315\u2013954 (top 99.7% of the cohort) \u2014 qualifying for ${TOTAL_ELIGIBLE} programmes across ${IIT_COUNT} IITs and ${NON_IIT_COUNT} NIT / IIIT / GFTI / IISc options, at 80% model confidence.`,

  headlineKpis: [
    { id: 'score', label: 'Gate Score', value: '660', emphasis: 'default' },
    { id: 'air', label: 'Predicted AIR', value: formatRange(315, 954), emphasis: 'default' },
    { id: 'qualified', label: 'Qualified', value: 'YES', emphasis: 'success' },
    { id: 'confidence', label: 'Confidence', value: formatPercent(80), emphasis: 'default' },
    { id: 'eligible', label: 'Eligible Programmes', value: String(TOTAL_ELIGIBLE), emphasis: 'brand' },
  ],

  coverKpis: [
    { id: 'score', label: 'Gate Score', value: '660' },
    { id: 'air', label: 'Predicted AIR', value: formatRange(315, 954) },
    { id: 'eligible', label: 'Eligible Programmes', value: String(TOTAL_ELIGIBLE) },
  ],

  eligibilityBreakdown: [
    { tier: 'safe', label: 'Safe', count: 75, rangeLabel: '65%+ chance' },
    { tier: 'high', label: 'High', count: 18, rangeLabel: '55\u201364% chance' },
    { tier: 'moderate', label: 'Moderate', count: 31, rangeLabel: '35\u201354% chance' },
    { tier: 'ambitious', label: 'Ambitious', count: 21, rangeLabel: '15\u201334% chance' },
    { tier: 'dream', label: 'Dream', count: 11, rangeLabel: '<15% chance' },
  ],

  instituteTypeCounts: [
    { type: 'IIT', count: IIT_COUNT },
    { type: 'IISc', count: 5 },
    { type: 'NIT', count: 64 },
    { type: 'IIIT', count: 17 },
    { type: 'GFTI', count: 6 },
    { type: 'IIEST', count: 2 },
    { type: 'Other', count: 19 },
  ],

  dataSources: [
    { name: 'Historical Cutoffs', available: true },
    { name: 'Seat Matrix', available: true },
    { name: 'Category Matching', available: true },
    { name: 'Score vs Cutoff', available: true },
    { name: 'Multi-Year Trends', available: false },
  ],

  howToReadTitle: 'How to Read This Report',
  howToReadText:
    'Chance percentages are model estimates from CCMT 2025 cutoff and seat data, not guarantees. Treat Safe and High tiers as reliable anchors, and Ambitious / Dream tiers as upside options to include in choice filling. Always cross-verify against official CCMT / COAP cutoffs before locking your list.',

  iitTable: {
    sectionNumber: 4,
    title: 'IIT Programmes',
    subtitle: `All ${IIT_COUNT} IIT programmes you qualify for under CCMT 2025, ranked by admission chance.`,
    totalEligible: IIT_COUNT,
    rows: buildRows(iitRowsRaw),
    remainingCount: IIT_COUNT - iitRowsRaw.length,
    csvNote: 'available in the full CSV export.',
  },

  nitIiitTable: {
    sectionNumber: 5,
    title: 'NIT / IIIT / GFTI Programmes',
    subtitle: `Top-ranked picks among your ${NON_IIT_COUNT} eligible NIT, IISc, IIIT and GFTI programmes, ranked by admission chance.`,
    totalEligible: NON_IIT_COUNT,
    rows: buildRows(nitRowsRaw),
    remainingCount: NON_IIT_COUNT - nitRowsRaw.length,
    csvNote: 'available in the full CSV export.',
  },

  counsellingSummary: [
    { id: 'safe', value: 75, label: 'Safe Options (65%+)' },
    { id: 'high', value: 18, label: 'High Chance (55-64%)' },
    { id: 'moderate', value: 31, label: 'Moderate Chance (35-54%)' },
    { id: 'ambitious', value: 21, label: 'Ambitious (15-34%)' },
    { id: 'dream', value: 11, label: 'Dream (<15%)' },
  ],

  counsellingSteps: [
    {
      rangeLabel: '1\u201310',
      title: 'Dream IITs',
      description: 'Top-tier, aspirational picks \u2014 worth the reach given upside.',
    },
    {
      rangeLabel: '11\u201320',
      title: 'Strong IITs',
      description: 'Mid-tier, realistically achievable at your predicted AIR.',
    },
    {
      rangeLabel: '21\u201330',
      title: 'Tier-1 NITs',
      description: 'Top NITs and IISc programmes \u2014 solid, well-ranked options.',
    },
    {
      rangeLabel: '31\u201340',
      title: 'Safe NITs',
      description: 'Reliable backups with very high admission probability.',
    },
    {
      rangeLabel: '41\u201350',
      title: 'IIITs & GFTIs',
      description: 'Specialized institutes to round out your final list.',
    },
  ],

  disclaimer:
    'This report is generated from the CCMT 2025 historical cutoff dataset using a predictive model; it does not use multi-year trend data and chance percentages are estimates, not guarantees of admission. Always verify final cutoffs and seat availability against the official CCMT / COAP portals before submitting your choices.',

  thankYouNote: 'Thank you for using GateNexa AI',
};
