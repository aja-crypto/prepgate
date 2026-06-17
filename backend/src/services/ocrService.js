// OCR service — extracts text from PDF pages using Mistral OCR or Gemini OCR
// Falls back to mock data when no API key is configured

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

function isMistralConfigured() {
  return !!MISTRAL_API_KEY;
}

function isGeminiConfigured() {
  return !!GEMINI_API_KEY;
}

// ─── Mistral OCR ────────────────────────────────────────────
async function callMistralOcr(pdfUrl) {
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: { type: 'document_url', document_url: pdfUrl },
      include_image_base64: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral OCR failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const pages = (data.pages || []).map((p, i) => ({
    pageNumber: i + 1,
    markdown: p.markdown || '',
    images: (p.images || []).map(img => img.base64 || ''),
  }));

  return pages;
}

// ─── Gemini OCR ──────────────────────────────────────────────
async function callGeminiOcr(pdfBase64) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Extract all text from this PDF page by page. Preserve the exact question numbering, options (A, B, C, D), answer key markings, and marks. Return the content as markdown with page breaks clearly marked as "--- PAGE X ---".' },
            { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } },
          ],
        }],
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini OCR failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const pageBlocks = text.split(/--- PAGE \d+ ---/).filter(Boolean);
  return pageBlocks.map((block, i) => ({
    pageNumber: i + 1,
    markdown: block.trim(),
    images: [],
  }));
}

// ─── Mock OCR (for development) ─────────────────────────────
function getMockOcrPages() {
  return [
    {
      pageNumber: 1,
      markdown: `1. Consider the following statements about B+ trees:
(A) B+ trees allow duplicate keys
(B) B+ trees store data pointers in internal nodes
(C) B+ trees have better cache performance than BST
(D) B+ trees are always balanced

2. Which of the following is/are true about normalization?
(A) 3NF is always in BCNF
(B) BCNF is stricter than 3NF
(C) Every relation in 3NF has no partial dependencies
(D) 2NF eliminates transitive dependencies`,
      images: [],
    },
    {
      pageNumber: 2,
      markdown: `3. Consider the relation R(A,B,C,D) with FD set F = {AB → C, C → D, D → A}. The number of candidate keys for R is ____.

4. In a database with timestamp-based concurrency control, which of the following is correct?
(A) Timestamps must be unique
(B) Older transactions always get priority
(C) Read operations never cause rollback
(D) Write operations always succeed

Answer Key:
1: C
2: B, C
3: 2
4: A`,
      images: [],
    },
  ];
}

// ─── Main entry ─────────────────────────────────────────────
async function extractTextFromPdf(pdfUrl) {
  if (isMistralConfigured()) {
    console.log('[OCR] Using Mistral OCR');
    return callMistralOcr(pdfUrl);
  }
  if (isGeminiConfigured()) {
    console.log('[OCR] Using Gemini OCR');
    // For gemini we'd need the base64 — caller should pass it
    const base64 = pdfUrl; // caller may pass base64 as fallback
    return callGeminiOcr(base64);
  }
  console.log('[OCR] No OCR API key configured, using mock data');
  return getMockOcrPages();
}

module.exports = { extractTextFromPdf, isMistralConfigured, isGeminiConfigured };
