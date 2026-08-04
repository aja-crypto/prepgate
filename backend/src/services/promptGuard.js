const PATTERNS = [
  { regex: /ignore\s+(all\s+)?previous\s+(instructions|directions|commands)/i },
  { regex: /reveal\s+(your\s+)?(system\s+)?prompt/i },
  { regex: /(system|developer)\s+prompt/i },
  { regex: /forget\s+(all\s+)?(instructions|gate|gatenexa)/i },
  { regex: /\bDAN\b/i },
  { regex: /jailbreak/i },
  { regex: /roleplay\s+bypass/i },
  { regex: /act\s+as\s+(chatgpt|gpt|bard|claude)/i },
  { regex: /tell\s+me\s+(your\s+)?(hidden|secret|internal)\s+(instructions|prompt|rules)/i },
  { regex: /output\s+(your\s+)?prompt/i },
  { regex: /print\s+(your\s+)?(system\s+)?prompt/i },
  { regex: /you\s+are\s+(not\s+)?(gate|gatenexa)/i },
  { regex: /new\s+rule/i },
  { regex: /override\s+(mode|instructions|behavior)/i },
  { regex: /hypothetical\s+(scenario|situation).*ignore/i },
];

function promptGuard(req, res, next) {
  const textFields = [];
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') textFields.push(value);
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') textFields.push(item);
        }
      }
    }
  }

  for (const field of textFields) {
    for (const { regex } of PATTERNS) {
      if (regex.test(field)) {
        return res.status(400).json({
          success: false,
          message: 'Unsafe prompt detected.',
        });
      }
    }
  }

  next();
}

module.exports = promptGuard;
