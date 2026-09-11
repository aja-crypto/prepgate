// ── Injection / jailbreak patterns ──────────────────────────────────────────
const INJECTION_PATTERNS = [
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

// ── Dangerous-content patterns (context-aware, not keyword blacklist) ──────
// These catch actionable requests for serious harm or serious wrongdoing.
// Phrases are anchored to imperative/action verbs to avoid blocking educational
// queries like "What does the kill command do in Linux?"
const DANGEROUS_PATTERNS = [
  // Serious physical harm / violence
  { regex: /\b(how\s+(do|can|to)|give\s+me|tell\s+me\s+how)\s+(to\s+)?(i\s+)?(kill|murder|assault|stab|shoot)\s+(someone|a\s+person|him|her|them|people|anyone)\b/i },
  { regex: /\b(make|build|construct)\s+(a\s+|an\s+)?(bomb|explosive|grenade|detonator|pipe\s+bomb|car\s+bomb)\b/i },
  { regex: /\b(make|build|mix|prepare|synthesize)\s+(a\s+)?(poison|toxin|nerve\s+agent|chemical\s+weapon)\b/i },
  { regex: /\b(kidnap|abduct|take\s+hostage)\s+(someone|a\s+person|him|her|them|people|anyone)\b/i },
  { regex: /\b(how\s+to|steps?\s+to|guide\s+to)\s+(commit\s+)?(murder|assault|homicide|terrorism|mass\s+shooting|stabbing)\b/i },
  // Weapons / dangerous materials
  { regex: /\b(make|build|construct|3d\s*print|manufacture)\s+(a\s+)?(gun|firearm|rifle|pistol|silencer|suppressor|auto.?matic\s+weapon)\b/i },
  // Serious crime
  { regex: /\b(how\s+to|steps?\s+to|guide\s+to)\s+(commit\s+)?(fraud|embezzlement|money\s+laundering|identity\s+theft)\b/i },
  // Self-harm
  { regex: /\b(suicide\s+method|ways?\s+to\s+kill\s+myself|how\s+(do|can|to)\s+end\s+my\s+life)\b/i },
];

// ── Response sanitization: strip provider/model leaks ───────────────────────
// If the AI accidentally reveals internal details, replace with a safe fallback.
const LEAK_PATTERNS = [
  /\b(I\s+am\s+(?:a\s+)?(?:model\s+)?(?:called\s+)?(?:named\s+)?)(GPT[-‐‑]?\d[\w.]*|ChatGPT|OpenAI|Gemini|Claude|Anthropic|Llama|Qwen|DashScope|Nemotron|BERT|PaLM|Mistral)\b/gi,
  /\b(I\s+(?:was\s+)?(?:trained|developed|built|created)\s+(?:by|using|on)\s+)(OpenAI|Google|Anthropic|Meta|Alibaba|NVIDIA|DashScope|Aliyun)\b/gi,
  /\b(My\s+(?:model|underlying\s+model|AI\s+model)\s+(?:is|name\s+is|called)\s+(?:is\s+)?)(GPT[-‐‑]?\d[\w.]*|ChatGPT|Gemini|Claude|Llama|Qwen|Nemotron)\b/gi,
  /\b(powered\s+by|runs?\s+on|uses?)\s+(GPT[-‐‑]?\d[\w.]*|ChatGPT|Gemini|Claude|OpenAI|OpenRouter|DashScope|Aliyun|NVIDIA|Anthropic|Google|Meta)\b/gi,
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
    for (const { regex } of INJECTION_PATTERNS) {
      if (regex.test(field)) {
        return res.status(400).json({
          success: false,
          message: 'Unsafe prompt detected.',
        });
      }
    }
    for (const { regex } of DANGEROUS_PATTERNS) {
      if (regex.test(field)) {
        return res.status(400).json({
          success: false,
          message: 'I can\'t help with that. I\'m here to help with GATE 2027 preparation and GateNexa.',
        });
      }
    }
  }

  next();
}

// Strip provider/model name leaks from AI-generated text (server-side output protection).
// Scoped to identity/provider disclosure — does NOT touch normal educational content.
function sanitizeResponse(text) {
  if (!text || typeof text !== 'string') return text;
  let safe = text;
  for (const re of LEAK_PATTERNS) {
    safe = safe.replace(re, '$1Nexa AI');
  }
  return safe;
}

module.exports = promptGuard;
module.exports.sanitizeResponse = sanitizeResponse;
