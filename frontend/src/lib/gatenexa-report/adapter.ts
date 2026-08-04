import { ReportData, ProgrammeRow } from './types/report.types';
import { sampleReportData } from './data/sampleReportData';
import { tierFromPercent, TIER_DEFINITIONS } from './utils/chanceUtils';

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function adaptPredictionResult(result: Record<string, any>, compareList?: any[], choiceOrder?: any[]): ReportData {
  const data = deepCopy(sampleReportData);

  // --- Normalize gateScore: canonical scale is 0-1000 (matches backend prediction engine & fallback).
  // If a caller still provides a raw 0-100 value, treat it as marks and expand to 0-1000.
  let rawScore = result?.predictedScore ?? result?.score ?? result?.gateScore ?? data.candidate.gateScore;
  if (result?.scoreScale === '0-100' || (rawScore != null && rawScore <= 100 && (result?.scoreUnit === 'marks' || result?.scale === '0-100'))) {
    rawScore = Math.round(rawScore * 10);
  }
  const score = rawScore;

  // --- Compute AIR range from single rank or range ---
  const rawRank = result?.predictedRank ?? result?.rank ?? null;
  const rawAirLow = result?.airRange?.low ?? result?.predictedAirLow ?? result?.airLow ?? rawRank;
  const rawAirHigh = result?.airRange?.high ?? result?.predictedAirHigh ?? result?.airHigh ?? rawRank;
  let airLow = rawAirLow ?? data.candidate.predictedAirLow;
  let airHigh = rawAirHigh ?? data.candidate.predictedAirHigh;
  // If both ends are identical and we got a single rank, compute a ±30% band
  if (airLow === airHigh && rawRank != null) {
    const spread = Math.max(50, Math.round(rawRank * 0.3));
    airLow = Math.max(1, rawRank - spread);
    airHigh = rawRank + spread;
  }

  const confidence = result?.confidenceScore ?? result?.confidence ?? result?.confidencePct ?? data.candidate.confidencePct;
  const percentile = result?.predictedPercentile ?? result?.percentile ?? null;
  const opps: any[] = result?.opportunities || [];

  // --- Compute eligible counts from actual data ---
  const iitOpps = opps.filter((o: any) => (o.collegeType || '').toUpperCase() === 'IIT');
  const nonIitOpps = opps.filter((o: any) => (o.collegeType || '').toUpperCase() !== 'IIT');
  const iitCount = iitOpps.length;
  const nonIitCount = nonIitOpps.length;
  const totalEligible = iitCount + nonIitCount;

  data.candidate = {
    ...data.candidate,
    displayName: result?.candidateName || result?.name || data.candidate.displayName,
    gateScore: score,
    predictedAirLow: airLow,
    predictedAirHigh: airHigh,
    confidencePct: confidence,
    percentileLabel: percentile != null ? `top ${(100 - percentile).toFixed(1)}% of the cohort` : data.candidate.percentileLabel,
    eligibleProgrammesCount: totalEligible > 0 ? totalEligible : data.candidate.eligibleProgrammesCount,
  };

  const eligibleDisplay = String(data.candidate.eligibleProgrammesCount);

  // coverKpis — single source
  data.coverKpis = [
    { id: 'score', label: 'Gate Score', value: String(score) },
    { id: 'air', label: 'Predicted AIR', value: `${airLow}\u2013${airHigh}` },
    { id: 'eligible', label: 'Eligible Prog.', value: eligibleDisplay },
  ];

  // headlineKpis — same values
  data.headlineKpis = [
    { id: 'score', label: 'Gate Score', value: String(score), emphasis: 'default' },
    { id: 'air', label: 'Predicted AIR', value: `${airLow}\u2013${airHigh}`, emphasis: 'default' },
    { id: 'qualified', label: 'Qualified', value: score >= 250 ? 'YES' : 'MARGINAL', emphasis: score >= 250 ? 'success' : 'default' },
    { id: 'confidence', label: 'Confidence', value: `${confidence}%`, emphasis: 'default' },
    { id: 'eligible', label: 'Eligible Programmes', value: eligibleDisplay, emphasis: 'brand' },
  ];

  data.executiveSummaryText =
    `Score ${score} places the candidate at predicted AIR ${airLow}\u2013${airHigh} (top ${percentile != null ? (100 - percentile).toFixed(1) : 'xx'}% of the cohort) \u2014 qualifying for ${eligibleDisplay} programmes across IITs, NITs, IIITs, and GFTI institutes, at ${confidence}% model confidence.`;

  if (opps.length > 0) {
    // --- Eligibility Breakdown: bucket by canonical thresholds ---
    const dream = opps.filter((o: any) => (o.probability ?? 0) < 15);
    const ambitious = opps.filter((o: any) => { const p = o.probability ?? 0; return p >= 15 && p < 35; });
    const moderate = opps.filter((o: any) => { const p = o.probability ?? 0; return p >= 35 && p < 55; });
    const high = opps.filter((o: any) => { const p = o.probability ?? 0; return p >= 55 && p < 65; });
    const safe = opps.filter((o: any) => (o.probability ?? 0) >= 65);

    data.eligibilityBreakdown = [
      { tier: 'safe', label: 'Safe', count: safe.length, rangeLabel: '65%+ chance' },
      { tier: 'high', label: 'High', count: high.length, rangeLabel: '55\u201364% chance' },
      { tier: 'moderate', label: 'Moderate', count: moderate.length, rangeLabel: '35\u201354% chance' },
      { tier: 'ambitious', label: 'Ambitious', count: ambitious.length, rangeLabel: '15\u201334% chance' },
      { tier: 'dream', label: 'Dream', count: dream.length, rangeLabel: '<15% chance' },
    ];

    // --- Counselling Summary: same 5 tiers ---
    data.counsellingSummary = [
      { id: 'safe', value: safe.length, label: `Safe Options (65%+)` },
      { id: 'high', value: high.length, label: 'High Chance (55-64%)' },
      { id: 'moderate', value: moderate.length, label: 'Moderate Chance (35-54%)' },
      { id: 'ambitious', value: ambitious.length, label: 'Ambitious (15-34%)' },
      { id: 'dream', value: dream.length, label: 'Dream (<15%)' },
    ];

    // --- Institute type counts ---
    const typeCounts: Record<string, number> = {};
    for (const o of opps) {
      const t = (o.collegeType || 'Other').toUpperCase();
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    data.instituteTypeCounts = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

    function toRow(o: any, rk: number): ProgrammeRow {
      const prob = o.probability ?? o.chance ?? 0;
      return {
        rank: rk,
        institute: o.college || o.institute || '-',
        programme: o.program || o.programme || '-',
        chancePct: prob,
        tier: tierFromPercent(prob, TIER_DEFINITIONS),
        cutoff: o.cutoff ?? null,
        fees: o.fees ? `Rs. ${o.fees / 100000}L` : null,
        avgPackage: o.avgPlacement || o.avgPackage ? `Rs. ${(o.avgPlacement || o.avgPackage)}L` : null,
      };
    }

    const iitRows = iitOpps.slice(0, 25);
    const otherRows = nonIitOpps.slice(0, 10);

    data.iitTable = {
      ...data.iitTable,
      totalEligible: iitCount,
      rows: iitRows.map((o, i) => toRow(o, i + 1)),
      remainingCount: Math.max(0, iitCount - 25),
    };

    data.nitIiitTable = {
      ...data.nitIiitTable,
      totalEligible: nonIitCount,
      rows: otherRows.map((o, i) => toRow(o, i + 1)),
      remainingCount: Math.max(0, nonIitCount - 10),
    };
  } else {
    data.iitTable.rows = [];
    data.iitTable.totalEligible = 0;
    data.nitIiitTable.rows = [];
    data.nitIiitTable.totalEligible = 0;
  }

  return data;
}
