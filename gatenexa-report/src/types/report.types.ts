/**
 * src/types/report.types.ts
 * Canonical data contract for the GateNexa AI Admission Intelligence Report.
 * All pages/components consume this shape — no page hardcodes business data.
 */

export type ChanceTier = 'safe' | 'high' | 'moderate' | 'ambitious' | 'dream';

export interface Candidate {
  displayName: string;
  qualified: boolean;
  gateScore: number;
  predictedAirLow: number;
  predictedAirHigh: number;
  eligibleProgrammesCount: number;
  percentileLabel: string; // e.g. "top 99.7% of the cohort"
  confidencePct: number; // model confidence, e.g. 80
}

export interface ReportMeta {
  organisationName: string;
  reportTitle: string; // "M.Tech Admission Intelligence Report"
  database: string; // "CCMT 2025"
  predictionId: string;
  generatedDate: string; // human formatted
  reportVersion: string;
  websiteUrl: string;
}

export interface KPIStat {
  id: string;
  label: string;
  value: string;
  emphasis?: 'default' | 'brand' | 'success';
}

export interface EligibilityTier {
  tier: ChanceTier;
  label: string;
  count: number;
  rangeLabel: string; // "85%+ chance"
}

export interface InstituteTypeCount {
  type: string; // "IIT", "IISc", "NIT" ...
  count: number;
}

export interface DataSourceStatus {
  name: string;
  available: boolean;
}

export interface ProgrammeRow {
  rank: number;
  institute: string;
  programme: string;
  chancePct: number;
  tier: ChanceTier;
  cutoff: number | null;
  fees: string | null; // pre-formatted, e.g. "₹1.8L"
  avgPackage: string | null; // pre-formatted, e.g. "₹20L"
}

export interface ProgrammeTable {
  sectionNumber: number;
  title: string;
  subtitle: string;
  totalEligible: number;
  rows: ProgrammeRow[];
  remainingCount: number; // rows not shown inline, referenced via CSV note
  csvNote: string;
}

export interface CounsellingSummaryStat {
  id: string;
  value: number;
  label: string;
}

export interface CounsellingStep {
  rangeLabel: string; // "1–10"
  title: string;
  description: string;
}

export interface ReportData {
  meta: ReportMeta;
  candidate: Candidate;
  executiveSummaryText: string;
  headlineKpis: KPIStat[];
  coverKpis: KPIStat[];
  eligibilityBreakdown: EligibilityTier[];
  instituteTypeCounts: InstituteTypeCount[];
  dataSources: DataSourceStatus[];
  howToReadTitle: string;
  howToReadText: string;
  iitTable: ProgrammeTable;
  nitIiitTable: ProgrammeTable;
  counsellingSummary: CounsellingSummaryStat[];
  counsellingSteps: CounsellingStep[];
  disclaimer: string;
  thankYouNote: string;
}
