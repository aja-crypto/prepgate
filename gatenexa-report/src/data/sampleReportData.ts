/**
 * src/data/sampleReportData.ts
 *
 * Sample fixture matching the reference PDF's "GATE Aspirant" report
 * (Prediction ID GTX-26-4A0AF6). This is the ONLY file in the project that
 * contains literal report values — every component/page reads exclusively
 * from the `ReportData` shape, so swapping in a real API response is a
 * drop-in replacement for this file.
 */
import { ReportData, ProgrammeRow } from '../types/report.types';
import { tierFromPercent, TABLE_LEGEND_DEFINITIONS } from '../utils/chanceUtils';
import { formatRange, formatPercent } from '../utils/formatters';

// ---- IIT programme rows (top 25 shown in reference; 43 total eligible) ----
const iitRowsRaw: Array<[string, string, number, number | null, string | null, string | null]> = [
  ['IIT Patna', 'CSE', 80, 580, '\u20B91.8L', '\u20B920L'],
  ['IIT Kharagpur', 'Signal Proc. & ML', 73, 588, '\u20B92.1L', '\u20B930L'],
  ['IIT Dharwad', 'CSE', 69, 600, '\u20B91.7L', '\u20B917L'],
  ['IIT Bhilai', 'DS & AI', 68, 610, '\u20B91.7L', '\u20B917L'],
  ['IIT Bhilai', 'CSE', 65, 614, '\u20B91.7L', '\u20B917L'],
  ['IIT Goa', 'CSE', 64, 618, '\u20B91.6L', '\u20B919L'],
  ['IIT Tirupati', 'CSE', 58, 655, '\u20B91.8L', '\u20B918L'],
  ['IIT Ropar', 'AI', 43, 678, '\u20B91.9L', '\u20B921L'],
  ['IIT Roorkee', 'AI', 41, 683, '\u20B92.1L', '\u20B926L'],
  ['IIT Roorkee', 'DS', 41, 683, '\u20B92.1L', '\u20B926L'],
  ['IIT (ISM) Dhanbad', 'AI & DS', 41, 685, null, null],
  ['IIT Delhi', 'CyberSec', 40, 710, '\u20B92.3L', '\u20B933L'],
  ['IIT Mandi', 'CSE', 40, 689, '\u20B91.9L', '\u20B919L'],
  ['IIT Palakkad', 'CSE', 40, 689, '\u20B91.8L', '\u20B918L'],
  ['IIT Kharagpur', 'VLSI & Nanoelectronics', 39, 717, '\u20B92.1L', '\u20B930L'],
  ['IIT Delhi', 'Machine Intelligence & DS', 38, 720, '\u20B92.3L', '\u20B933L'],
  ['IIT Roorkee', 'CSE', 36, 712, '\u20B92.1L', '\u20B926L'],
  ['IIT Kanpur', 'CSE', 33, 740, '\u20B92.1L', '\u20B930L'],
  ['IIT Kharagpur', 'CSE', 28, 772, '\u20B92.1L', '\u20B930L'],
  ['IIT Delhi', 'CSE', 19, 800, '\u20B92.3L', '\u20B933L'],
  ['IIT Bombay', 'CSE', 14, 860, '\u20B92.4L', '\u20B935L'],
  ['IIT Bombay', 'Comp. & DS', 12, 852, '\u20B92.4L', '\u20B935L'],
  ['IIT Bombay', 'AI', 11, 925, '\u20B92.4L', '\u20B935L'],
  ['IIT Madras', 'DS', 11, 843, '\u20B92.2L', '\u20B933L'],
  ['IIT Madras', 'CSE', 7, 881, '\u20B92.2L', '\u20B933L'],
];

function buildRows(
  raw: Array<[string, string, number, number | null, string | null, string | null]>
): ProgrammeRow[] {
  return raw.map(([institute, programme, chancePct, cutoff, fees, avgPackage], idx) => ({
    rank: idx + 1,
    institute,
    programme,
    chancePct,
    tier: tierFromPercent(chancePct, TABLE_LEGEND_DEFINITIONS),
    cutoff,
    fees,
    avgPackage,
  }));
}

// ---- NIT / IIIT / GFTI programme rows (top 10 shown; 113 total eligible) ----
const nitRowsRaw: Array<[string, string, number, number | null, string | null, string | null]> = [
  ['NIT Meghalaya', 'CSE', 98, 506, '\u20B90.9L', '\u20B96L'],
  ['NIT Puducherry', 'CSE', 98, 510, '\u20B91.0L', '\u20B97L'],
  ['NIT Manipur', 'CSE', 98, 364, '\u20B90.8L', '\u20B95L'],
  ['NIT Arunachal Pradesh', 'CSE', 98, 504, '\u20B90.8L', '\u20B94L'],
  ['NIT Nagaland', 'CSE', 97, 500, '\u20B90.8L', '\u20B95L'],
  ['IISc Bangalore', 'Comp. & DS', 27, 790, '\u20B92.5L', '\u20B940L'],
  ['IISc Bangalore', 'Robotics & Autonomous Systems', 21, 801, '\u20B92.5L', '\u20B940L'],
  ['IISc Bangalore', 'Microelect. & VLSI', 11, 928, '\u20B92.5L', '\u20B940L'],
  ['IISc Bangalore', 'AI', 10, 861, '\u20B92.5L', '\u20B940L'],
  ['IISc Bangalore', 'Network & Info. Security', 10, 881, '\u20B92.5L', '\u20B940L'],
];

export const sampleReportData: ReportData = {
  meta: {
    organisationName: 'GateNexa AI',
    reportTitle: 'M.Tech Admission Intelligence Report',
    database: 'CCMT 2025',
    predictionId: 'GTX-26-4A0AF6',
    generatedDate: '17 July 2026',
    reportVersion: '2.0',
    websiteUrl: 'gatenexa.ai',
  },

  candidate: {
    displayName: 'GATE Aspirant',
    qualified: true,
    gateScore: 660,
    predictedAirLow: 315,
    predictedAirHigh: 954,
    eligibleProgrammesCount: 222,
    percentileLabel: 'top 99.7% of the cohort',
    confidencePct: 80,
  },

  executiveSummaryText:
    'Score 660 places the candidate at predicted AIR 315\u2013954 (top 99.7% of the cohort) \u2014 qualifying for 156 programmes across 43 IITs and 113 NIT / IIIT / GFTI / IISc options, at 80% model confidence.',

  headlineKpis: [
    { id: 'score', label: 'Gate Score', value: '660', emphasis: 'default' },
    { id: 'air', label: 'Predicted AIR', value: formatRange(315, 954), emphasis: 'default' },
    { id: 'qualified', label: 'Qualified', value: 'YES', emphasis: 'success' },
    { id: 'confidence', label: 'Confidence', value: formatPercent(80), emphasis: 'default' },
    { id: 'eligible', label: 'Eligible Programmes', value: '156', emphasis: 'brand' },
  ],

  coverKpis: [
    { id: 'score', label: 'Gate Score', value: '660' },
    { id: 'air', label: 'Predicted AIR', value: formatRange(315, 954) },
    { id: 'eligible', label: 'Eligible Programmes', value: '222' },
  ],

  eligibilityBreakdown: [
    { tier: 'safe', label: 'Safe', count: 75, rangeLabel: '85%+ chance' },
    { tier: 'high', label: 'High', count: 18, rangeLabel: '65\u201384% chance' },
    { tier: 'moderate', label: 'Moderate', count: 31, rangeLabel: '35\u201364% chance' },
    { tier: 'ambitious', label: 'Ambitious', count: 21, rangeLabel: '15\u201334% chance' },
    { tier: 'dream', label: 'Dream', count: 11, rangeLabel: '<15% chance' },
  ],

  instituteTypeCounts: [
    { type: 'IIT', count: 43 },
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
    subtitle: 'All 43 IIT programmes you qualify for under CCMT 2025, ranked by admission chance.',
    totalEligible: 43,
    rows: buildRows(iitRowsRaw),
    remainingCount: 43 - iitRowsRaw.length,
    csvNote: 'available in the full CSV export.',
  },

  nitIiitTable: {
    sectionNumber: 5,
    title: 'NIT / IIIT / GFTI Programmes',
    subtitle: 'Top-ranked picks among your 113 eligible NIT, IISc, IIIT and GFTI programmes, ranked by admission chance.',
    totalEligible: 113,
    rows: buildRows(nitRowsRaw),
    remainingCount: 113 - nitRowsRaw.length,
    csvNote: 'available in the full CSV export.',
  },

  counsellingSummary: [
    { id: 'safe', value: 78, label: 'Safe choices (\u226580%)' },
    { id: 'target', value: 21, label: 'Target choices (60\u201379%)' },
    { id: 'dream', value: 43, label: 'Dream choices (<40%)' },
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
