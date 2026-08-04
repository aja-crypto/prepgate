// Creator attribution safety: only show verified, real channel names.
// "verify handle", empty, placeholder, and mojibake names are hidden as
// "Unknown Creator" so we never misattribute content.

const UNVERIFIED_MARKERS = [
  'verify handle', 'unknown', '?', '\uFFFD', 'verify',
];

/** Return a safe display name, or null to hide the creator entirely. */
export function safeChannelName(channel) {
  if (!channel) return null;
  const c = String(channel).trim();
  if (!c) return null;
  if (c.length < 2) return null;
  const low = c.toLowerCase();
  if (UNVERIFIED_MARKERS.some((m) => low.includes(m))) return null;
  // Reject strings full of replacement chars / question marks
  const weird = (c.match(/[\uFFFD?]/g) || []).length;
  if (weird >= 2) return null;
  if (low.includes('\uFFFD')) return null;
  return c;
}

/** Human label used when the creator cannot be confirmed. */
export const UNKNOWN_CREATOR = 'Unknown Creator';

/** True when the video's channel is unverified and should be hidden. */
export function isUnverifiedChannel(channel) {
  return safeChannelName(channel) === null;
}
