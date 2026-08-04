/**
 * src/utils/formatters.ts
 * Small, pure formatting helpers. No business logic here — just presentation.
 */

/** Formats a number with Indian digit grouping, e.g. 12345 -> "12,345" */
export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

/** Formats an inclusive numeric range, e.g. (315, 954) -> "315–954" */
export function formatRange(low: number, high: number): string {
  return `${formatIndianNumber(low)}\u2013${formatIndianNumber(high)}`;
}

/** Formats a percentage integer, e.g. 80 -> "80%" */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Formats a rupee amount already expressed in lakhs, e.g. (1.8) -> "₹1.8L".
 * Kept explicit (rather than always dividing) because source data in the
 * fixture already provides lakh-scale figures.
 */
export function formatLakhs(value: number): string {
  const trimmed = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `Rs. ${trimmed}L`;
}

/** Safe display for nullable table fields. */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '\u2014';
  return String(value);
}

/** Formats a Date into "17 July 2026" style used across the report header/meta. */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Formats a Date into the compact "17 Jul 2026" style used in page headers. */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
