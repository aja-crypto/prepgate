import { ChanceTier } from '../types/report.types';
import { tierColors, TierColorSet } from '../theme/colors';

export interface TierDefinition {
  tier: ChanceTier;
  label: string;
  rangeLabel: string;
  min: number;
}

/** Canonical threshold table — single source of truth used everywhere in the report. */
export const TIER_DEFINITIONS: TierDefinition[] = [
  { tier: 'safe', label: 'Safe', rangeLabel: '65%+ chance', min: 65 },
  { tier: 'high', label: 'High', rangeLabel: '55\u201364% chance', min: 55 },
  { tier: 'moderate', label: 'Moderate', rangeLabel: '35\u201354% chance', min: 35 },
  { tier: 'ambitious', label: 'Ambitious', rangeLabel: '15\u201334% chance', min: 15 },
  { tier: 'dream', label: 'Dream', rangeLabel: '<15% chance', min: 0 },
];

/** Same as TIER_DEFINITIONS — table pages use the same thresholds, with compact labels. */
export const TABLE_LEGEND_DEFINITIONS: TierDefinition[] = [
  { tier: 'safe', label: 'Safe', rangeLabel: '65%+', min: 65 },
  { tier: 'high', label: 'High', rangeLabel: '55\u201364%', min: 55 },
  { tier: 'moderate', label: 'Moderate', rangeLabel: '35\u201354%', min: 35 },
  { tier: 'ambitious', label: 'Ambitious', rangeLabel: '15\u201334%', min: 15 },
  { tier: 'dream', label: 'Dream', rangeLabel: '<15%', min: 0 },
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
