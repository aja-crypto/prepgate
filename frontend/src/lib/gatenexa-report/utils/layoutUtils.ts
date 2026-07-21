/**
 * src/utils/layoutUtils.ts
 * Helpers for splitting long programme lists into a "shown" slice plus a
 * remainder count — keeps the IIT/NIT table pages at a fixed row budget so
 * the report holds its 5-page footprint regardless of how many eligible
 * programmes a candidate has.
 */
import { ProgrammeRow } from '../types/report.types';

export interface SlicedRows {
  shown: ProgrammeRow[];
  remaining: number;
}

/**
 * Returns the top `maxRows` rows (already expected to be pre-sorted by
 * chance descending) and the count of rows omitted from the inline table.
 */
export function sliceRowsForPage(rows: ProgrammeRow[], maxRows: number): SlicedRows {
  const shown = rows.slice(0, maxRows);
  const remaining = Math.max(rows.length - shown.length, 0);
  return { shown, remaining };
}

/**
 * Column width plan (in points) for the programme tables. Intentionally
 * sums to slightly less than layout.contentWidth (527pt) — the table is
 * left-aligned inside the content area rather than stretched edge-to-edge,
 * matching the reference PDF's proportions.
 */
export const PROGRAMME_TABLE_COLUMNS = {
  rank: 20,
  institute: 118,
  programme: 148,
  chance: 58,
  cutoff: 50,
  fees: 50,
  avgPackage: 55,
} as const;
