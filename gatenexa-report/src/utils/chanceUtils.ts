/**
 * src/utils/chanceUtils.ts
 * Central logic for mapping an admission-chance percentage to a tier,
 * its display label, and its color set. Used by ChanceBadge, table rows,
 * and the eligibility-breakdown cards so the thresholds are defined once.
 */
import { ChanceTier } from '../types/report.types';
import { tierColors, TierColorSet } from '../theme/colors';

export interface TierDefinition {
  tier: ChanceTier;
  label: string;
  rangeLabel: string;
  min: number; // inclusive lower bound, percent
}

/** Threshold table, ordered highest-to-lowest. Matches the reference report legend. */
export const TIER_DEFINITIONS: TierDefinition[] = [
  { tier: 'safe', label: 'Safe', rangeLabel: '85%+ chance', min: 85 },
  { tier: 'high', label: 'High', rangeLabel: '65\u201384% chance', min: 65 },
  { tier: 'moderate', label: 'Moderate', rangeLabel: '35\u201364% chance', min: 35 },
  { tier: 'ambitious', label: 'Ambitious', rangeLabel: '15\u201334% chance', min: 15 },
  { tier: 'dream', label: 'Dream', rangeLabel: '<15% chance', min: 0 },
];

/** Table-legend variant used on IIT / NIT programme tables (coarser bands). */
export const TABLE_LEGEND_DEFINITIONS: TierDefinition[] = [
  { tier: 'safe', label: 'Safe', rangeLabel: '65%+', min: 65 },
  { tier: 'high', label: 'High', rangeLabel: '55\u201364%', min: 55 },
  { tier: 'moderate', label: 'Moderate', rangeLabel: '25\u201354%', min: 25 },
  { tier: 'ambitious', label: 'Ambitious', rangeLabel: '<25%', min: 0 },
];

export function tierFromPercent(pct: number, definitions: TierDefinition[] = TIER_DEFINITIONS): ChanceTier {
  for (const def of definitions) {
    if (pct >= def.min) return def.tier;
  }
  return definitions[definitions.length - 1].tier;
}

export function colorsForTier(tier: ChanceTier): TierColorSet {
  return tierColors[tier];
}

export function labelForTier(tier: ChanceTier): string {
  const found = TIER_DEFINITIONS.find((d) => d.tier === tier);
  return found ? found.label : tier;
}
