import { ReportData, ProgrammeRow } from './types/report.types';
import { sampleReportData } from './data/sampleReportData';

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function adaptPredictionResult(result: Record<string, any>, compareList?: any[], choiceOrder?: any[]): ReportData {
  const data = deepCopy(sampleReportData);

  const score = result?.predictedScore ?? result?.score ?? result?.gateScore ?? data.candidate.gateScore;
  const rank = result?.predictedRank ?? result?.rank ?? data.candidate.predictedAirLow;
  const confidence = result?.confidence ?? result?.confidencePct ?? data.candidate.confidencePct;
  const percentile = result?.predictedPercentile ?? result?.percentile ?? null;
  const opps: any[] = result?.opportunities || [];
  const eligibleCount = opps.length || (data.candidate.eligibleProgrammesCount ?? 0);

  data.candidate = {
    ...data.candidate,
    displayName: result?.candidateName || result?.name || data.candidate.displayName,
    gateScore: score,
    predictedAirLow: rank,
    predictedAirHigh: rank,
    confidencePct: confidence,
    percentileLabel: percentile != null ? `top ${100 - percentile}% of the cohort` : data.candidate.percentileLabel,
    eligibleProgrammesCount: eligibleCount,
  };

  // coverKpis — CoverPage.tsx:219 reads from here
  data.coverKpis = [
    { id: 'score', label: 'Gate Score', value: String(score) },
    { id: 'air', label: 'Predicted AIR', value: `~${rank}` },
    { id: 'eligible', label: 'Eligible Prog.', value: String(eligibleCount) },
  ];

  // headlineKpis — ExecutiveSummaryPage.tsx:98 reads from here
  data.headlineKpis = [
    { id: 'score', label: 'Gate Score', value: String(score), emphasis: 'default' },
    { id: 'air', label: 'Predicted AIR', value: `~${rank}`, emphasis: 'default' },
    { id: 'qualified', label: 'Qualified', value: score >= 25 ? 'YES' : 'MARGINAL', emphasis: score >= 25 ? 'success' : 'default' },
    { id: 'confidence', label: 'Confidence', value: `${confidence}%`, emphasis: 'default' },
    { id: 'eligible', label: 'Eligible Prog.', value: String(eligibleCount), emphasis: 'brand' },
  ];

  data.executiveSummaryText =
    `Score ${score} places the candidate at predicted AIR ~${rank} (top ${percentile != null ? 100 - percentile : 'xx'}% of the cohort) — qualifying for ${eligibleCount} programmes across IITs, NITs, IIITs, and GFTI institutes, at ${confidence}% model confidence.`;

  if (opps.length > 0) {
    const dream = opps.filter((o: any) => (o.probability ?? 0) < 15);
    const ambitious = opps.filter((o: any) => { const p = o.probability ?? 0; return p >= 15 && p < 35; });
    const moderate = opps.filter((o: any) => { const p = o.probability ?? 0; return p >= 35 && p < 65; });
    const h = opps.filter((o: any) => { const p = o.probability ?? 0; return p >= 65 && p < 85; });
    const s = opps.filter((o: any) => (o.probability ?? 0) >= 85);

    data.eligibilityBreakdown = [
      { tier: 'safe', label: 'Safe', count: s.length, rangeLabel: '85%+ chance' },
      { tier: 'high', label: 'High', count: h.length, rangeLabel: '65\u201384% chance' },
      { tier: 'moderate', label: 'Moderate', count: moderate.length, rangeLabel: '35\u201364% chance' },
      { tier: 'ambitious', label: 'Ambitious', count: ambitious.length, rangeLabel: '15\u201334% chance' },
      { tier: 'dream', label: 'Dream', count: dream.length, rangeLabel: '<15% chance' },
    ];

    const typeCounts: Record<string, number> = {};
    for (const o of opps) {
      const t = (o.collegeType || 'Other').toUpperCase();
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    data.instituteTypeCounts = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

    data.counsellingSummary = [
      { id: 'safe', value: s.length, label: 'Safe Options (85%+)' },
      { id: 'high', value: h.length, label: 'High Chance (65-84%)' },
      { id: 'moderate', value: moderate.length, label: 'Moderate Chance (35-64%)' },
      { id: 'ambitious', value: ambitious.length + dream.length, label: 'Ambitious / Dream' },
    ];

    function toRow(o: any, rk: number): ProgrammeRow {
      const prob = o.probability ?? o.chance ?? 0;
      return {
        rank: rk,
        institute: o.college || o.institute || '-',
        programme: o.program || o.programme || '-',
        chancePct: prob,
        tier: prob >= 85 ? 'safe' : prob >= 65 ? 'high' : prob >= 35 ? 'moderate' : 'ambitious',
        cutoff: o.cutoff ?? null,
        fees: o.fees ? `\u20B9${o.fees / 100000}L` : null,
        avgPackage: o.avgPlacement || o.avgPackage ? `\u20B9${(o.avgPlacement || o.avgPackage)}L` : null,
      };
    }

    const iitRows = opps.filter((o: any) => (o.collegeType || '').toUpperCase() === 'IIT').slice(0, 25);
    const otherRows = opps.filter((o: any) => (o.collegeType || '').toUpperCase() !== 'IIT').slice(0, 10);

    data.iitTable = {
      ...data.iitTable,
      totalEligible: opps.filter((o: any) => (o.collegeType || '').toUpperCase() === 'IIT').length,
      rows: iitRows.map((o, i) => toRow(o, i + 1)),
      remainingCount: Math.max(0, opps.filter((o: any) => (o.collegeType || '').toUpperCase() === 'IIT').length - 25),
    };

    data.nitIiitTable = {
      ...data.nitIiitTable,
      totalEligible: opps.filter((o: any) => (o.collegeType || '').toUpperCase() !== 'IIT').length,
      rows: otherRows.map((o, i) => toRow(o, i + 1)),
      remainingCount: Math.max(0, opps.filter((o: any) => (o.collegeType || '').toUpperCase() !== 'IIT').length - 10),
    };
  } else {
    data.iitTable.rows = [];
    data.iitTable.totalEligible = 0;
    data.nitIiitTable.rows = [];
    data.nitIiitTable.totalEligible = 0;
  }

  return data;
}
