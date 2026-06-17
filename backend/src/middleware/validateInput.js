const VALID_SUBJECTS = ['AL', 'DS', 'DB', 'OS', 'CN', 'CO', 'TOC', 'CD', 'DL', 'EM', 'APT'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_TEST_TYPES = ['subject', 'topic', 'full-length'];
const VALID_MISTAKE_CATS = ['concept_error', 'formula_error', 'silly_mistake', 'time_pressure', 'guess'];

function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pick(obj, keys) {
  const result = {};
  if (!obj || typeof obj !== 'object') return result;
  keys.forEach(k => {
    if (obj[k] !== undefined) result[k] = obj[k];
  });
  return result;
}

function sanitizeString(val) {
  if (typeof val !== 'string') return val;
  return val.trim().replace(/[<>]/g, '');
}

function validateFields(fields) {
  return (req, res, next) => {
    const errors = [];
    fields.forEach(({ name, type, required, min, max, pattern, in: inList }) => {
      const val = req.body[name];
      if (required && (val === undefined || val === null || val === '')) {
        errors.push(`${name} is required`);
        return;
      }
      if (val === undefined || val === null) return;
      if (type === 'string' && typeof val !== 'string') errors.push(`${name} must be a string`);
      if (type === 'number' && (typeof val !== 'number' || Number.isNaN(val))) errors.push(`${name} must be a number`);
      if (type === 'string' && min !== undefined && val.length < min) errors.push(`${name} must be at least ${min} characters`);
      if (type === 'string' && max !== undefined && val.length > max) errors.push(`${name} must be at most ${max} characters`);
      if (pattern && !pattern.test(val)) errors.push(`${name} has invalid format`);
      if (inList && !inList.includes(val)) errors.push(`${name} must be one of: ${inList.join(', ')}`);
    });
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('; ') });
    }
    next();
  };
}

module.exports = { pick, sanitizeString, escapeRegex, validateFields, VALID_SUBJECTS, VALID_DIFFICULTIES, VALID_TEST_TYPES, VALID_MISTAKE_CATS };
