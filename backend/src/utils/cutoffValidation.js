/**
 * Cutoff Data Validation Utility
 * 
 * Enforces invariants for cutoff records entering the system:
 * 1. openingScore must be null or between 0 and 1000
 * 2. closingScore must be null or between 0 and 1000
 * 3. If both exist: openingScore >= closingScore
 * 4. placeholder records must never enter prediction opportunities
 * 5. fabricated openingScore values must never be generated
 * 6. prediction responses must never expose placeholder rows
 * 7. static fallback JSON must never contain fabricated values
 */

const VALID_CATEGORIES = ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'];
const VALID_DATA_STATUSES = ['verified', 'fallback', 'placeholder', 'estimated'];
const VALID_SOURCES = ['official', 'ccmt', 'coap', 'admin'];

/**
 * Validate a single cutoff record. Returns { valid: boolean, errors: string[] }.
 * Does NOT repair invalid records — flags them instead.
 */
function validateCutoffRecord(record) {
  const errors = [];

  if (record.openingScore != null) {
    if (typeof record.openingScore !== 'number' || isNaN(record.openingScore)) {
      errors.push('openingScore must be a number or null');
    } else {
      if (record.openingScore < 0) errors.push('openingScore must be >= 0');
      if (record.openingScore > 1000) errors.push('openingScore must be <= 1000');
    }
  }

  if (record.closingScore != null) {
    if (typeof record.closingScore !== 'number' || isNaN(record.closingScore)) {
      errors.push('closingScore must be a number');
    } else {
      if (record.closingScore < 0) errors.push('closingScore must be >= 0');
      if (record.closingScore > 1000) errors.push('closingScore must be <= 1000');
    }
  }

  if (record.openingScore != null && record.closingScore != null) {
    if (record.openingScore < record.closingScore) {
      errors.push(`openingScore (${record.openingScore}) must be >= closingScore (${record.closingScore})`);
    }
  }

  if (record.category && !VALID_CATEGORIES.includes(record.category)) {
    errors.push(`Invalid category: ${record.category}`);
  }

  if (record.dataStatus && !VALID_DATA_STATUSES.includes(record.dataStatus)) {
    errors.push(`Invalid dataStatus: ${record.dataStatus}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if a record should be excluded from prediction opportunities.
 * Placeholder records must never enter prediction responses.
 */
function isExcludedFromPredictions(record) {
  return record.dataStatus === 'placeholder';
}

/**
 * Filter an array of cutoff records to only those safe for prediction display.
 * Excludes placeholder rows and records with validation errors.
 */
function filterForPredictions(records) {
  return records.filter(r => {
    if (isExcludedFromPredictions(r)) return false;
    const { valid } = validateCutoffRecord(r);
    return valid;
  });
}

/**
 * Check if a record has fabricated openingScore (heuristic: exactly 0.8 * closingScore).
 * This is a detection helper, not a repair mechanism.
 */
function hasFabricatedOpening(record) {
  if (record.openingScore == null || record.closingScore == null) return false;
  if (record.openingScore <= 0 || record.closingScore <= 0) return false;
  const ratio = record.openingScore / record.closingScore;
  return Math.abs(ratio - 0.8) < 0.01;
}

/**
 * Validate a batch of cutoff records. Returns summary with counts and error details.
 */
function validateCutoffBatch(records) {
  let valid = 0;
  let invalid = 0;
  let placeholder = 0;
  const allErrors = [];

  for (const record of records) {
    if (record.dataStatus === 'placeholder') {
      placeholder++;
      continue;
    }
    const result = validateCutoffRecord(record);
    if (result.valid) {
      valid++;
    } else {
      invalid++;
      allErrors.push({ record: `${record.institute}|${record.program}|${record.category}|${record.year}R${record.round}`, errors: result.errors });
    }
  }

  return { total: records.length, valid, invalid, placeholder, errors: allErrors };
}

module.exports = {
  validateCutoffRecord,
  isExcludedFromPredictions,
  filterForPredictions,
  hasFabricatedOpening,
  validateCutoffBatch,
  VALID_CATEGORIES,
  VALID_DATA_STATUSES,
};
