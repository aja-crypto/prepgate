/**
 * Institute Classification — Single Source of Truth
 *
 * Product definition of institute tiers for the predictor.
 * Used by:
 *   - predictionEngine.js (institute difficulty factors)
 *   - predictor.js (collegeBlock assignment)
 *   - OpportunityPredictorPage.jsx (display grouping)
 *
 * Tiers:
 *   elite  = World-class, hardest to get. IISc + old IITs (Bombay/Delhi/Madras/Kanpur/Kharagpur/Roorkee)
 *   top    = Excellent IITs, very competitive. Hyderabad, Guwahati, BHU, Indore, etc.
 *   strong = Well-established IITs. Patna, Ropar, Mandi, Jodhpur, Bhubaneswar, Dhanbad, etc.
 *   new    = Newer IITs. Tirupati, Dharwad, Palakkad, Bhilai, Jammu, Goa.
 *
 * Rules:
 *   - Do NOT hardcode classification in multiple components
 *   - Do NOT call every IIT "elite"
 *   - Classification depends on institute reputation, not student probability
 */

const INSTITUTE_CLASSIFICATION = {
  // ─── IISc ──────────────────────────────────────────────────────
  'Indian Institute of Science': 'elite',

  // ─── Elite IITs (old, world-class) ─────────────────────────────
  'Indian Institute of Technology Bombay': 'elite',
  'Indian Institute of Technology Delhi': 'elite',
  'Indian Institute of Technology Madras': 'elite',
  'Indian Institute of Technology Kanpur': 'elite',
  'Indian Institute of Technology Kharagpur': 'elite',
  'Indian Institute of Technology Roorkee': 'elite',

  // ─── Top IITs (excellent, very competitive) ────────────────────
  'Indian Institute of Technology Hyderabad': 'top',
  'Indian Institute of Technology Guwahati': 'top',
  'Indian Institute of Technology BHU Varanasi': 'top',
  'Indian Institute of Technology Indore': 'top',

  // ─── Strong IITs (well-established) ────────────────────────────
  'Indian Institute of Technology (ISM) Dhanbad': 'strong',
  'Indian Institute of Technology Gandhinagar': 'strong',
  'Indian Institute of Technology Ropar': 'strong',
  'Indian Institute of Technology Bhubaneswar': 'strong',
  'Indian Institute of Technology Mandi': 'strong',
  'Indian Institute of Technology Patna': 'strong',
  'Indian Institute of Technology Jodhpur': 'strong',

  // ─── Newer IITs ────────────────────────────────────────────────
  'Indian Institute of Technology Tirupati': 'new',
  'Indian Institute of Technology Dharwad': 'new',
  'Indian Institute of Technology Palakkad': 'new',
  'Indian Institute of Technology Bhilai': 'new',
  'Indian Institute of Technology Jammu': 'new',
  'Indian Institute of Technology Goa': 'new',

  // ─── NITs (top tier) ──────────────────────────────────────────
  'National Institute of Technology Tiruchirappalli': 'top',
  'National Institute of Technology Karnataka Surathkal': 'top',
  'National Institute of Technology Warangal': 'top',
  'National Institute of Technology Calicut': 'top',
};

/**
 * Get institute tier
 * @param {string} instituteName
 * @returns {'elite'|'top'|'strong'|'new'|'standard'}
 */
function getInstituteTier(instituteName) {
  if (!instituteName) return 'standard';
  return INSTITUTE_CLASSIFICATION[instituteName] || 'standard';
}

/**
 * Check if institute is elite (for UI block assignment)
 * Elite = IISc + old IITs (Bombay/Delhi/Madras/Kanpur/Kharagpur/Roorkee)
 */
function isEliteInstitute(instituteName) {
  return getInstituteTier(instituteName) === 'elite';
}

/**
 * Get collegeBlock for UI grouping
 * Rules:
 *   - Elite institutes → dream_elite (always, regardless of probability)
 *   - Top/strong IITs with probability >= 40 → high_chance_iit
 *   - Top/strong IITs with probability < 40 → backup (aspirational)
 *   - NITs with probability >= 70 → safe_nit
 *   - Everything else → backup
 */
function getCollegeBlock(c) {
  const inst = c.institute || '';
  const tier = getInstituteTier(inst);
  const prob = c.probability || 0;

  // Elite institutes always go to dream_elite
  if (tier === 'elite') return 'dream_elite';

  // Top/strong IITs with decent probability → high_chance_iit
  if (inst.includes('Indian Institute of Technology') && (tier === 'top' || tier === 'strong') && prob >= 40) {
    return 'high_chance_iit';
  }

  // NITs with high probability → safe_nit
  if (inst.includes('National Institute of Technology') && prob >= 70) {
    return 'safe_nit';
  }

  // Everything else (including new IITs, low-probability IITs, IIITs, GFTIs)
  return 'backup';
}

module.exports = {
  INSTITUTE_CLASSIFICATION,
  getInstituteTier,
  isEliteInstitute,
  getCollegeBlock,
};
