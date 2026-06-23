import { useState, useRef } from 'react';

const SUBJECT_CODES = ['APT', 'MA', 'DL', 'CO', 'DS', 'AL', 'OS', 'DBMS', 'CN', 'TOC', 'CD'];

function parseQuestions(text) {
  const blocks = text.split(/(?=^(?:\d+[.])|Q[.:]|Question\s*\d+[:.])/m).filter(b => b.trim());
  const parsed = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    let question = '';
    const options = ['', '', '', ''];
    let correctAnswer = -1;
    let explanation = '';
    let subject = '';
    let topic = '';
    let difficulty = 'medium';

    let stage = 'question';
    let optIdx = 0;

    for (const line of lines) {
      const subjectMatch = line.match(/^(?:Subject|Sub)[:\s]+(.+)/i);
      if (subjectMatch) {
        const val = subjectMatch[1].trim().toUpperCase();
        subject = SUBJECT_CODES.find(s => val.includes(s)) || '';
        continue;
      }

      const topicMatch = line.match(/^(?:Topic|Chapter)[:\s]+(.+)/i);
      if (topicMatch) { topic = topicMatch[1].trim(); continue; }

      const diffMatch = line.match(/^(?:Difficulty|Diff|Level)[:\s]+(.+)/i);
      if (diffMatch) {
        const d = diffMatch[1].trim().toLowerCase();
        if (d.includes('easy')) difficulty = 'easy';
        else if (d.includes('hard')) difficulty = 'hard';
        else difficulty = 'medium';
        continue;
      }

      const explMatch = line.match(/^(?:Explanation|Exp|Solution|Sol)[:\s]+(.+)/i);
      if (explMatch) { explanation = explMatch[1].trim(); continue; }

      // Option lines: A) ..., A. ..., (A) ..., 1) ..., etc.
      const optMatch = line.match(/^(?:\(?([A-Da-d1-4])\)?[.)\]:]\s*)(.*)/);
      if (optMatch) {
        const label = optMatch[1].toUpperCase();
        const text = optMatch[2].replace(/[✓✔✗✘✕✖*]\s*$/, '').trim();
        const isCorrect = /[✓✔✗✘]/.test(optMatch[2]) || optMatch[2].endsWith('*');
        const idx = label >= '1' && label <= '4' ? parseInt(label) - 1 : label.charCodeAt(0) - 65;
        if (idx >= 0 && idx < 4) {
          options[idx] = text;
          if (isCorrect) correctAnswer = idx;
        }
        continue;
      }

      // Correct answer line: Answer: B, Correct: B, Ans: B
      const ansMatch = line.match(/^(?:Answer|Correct|Ans|Right)[:\s]+\(?([A-Da-d1-4])\)?/i);
      if (ansMatch) {
        const label = ansMatch[1].toUpperCase();
        const idx = label >= '1' && label <= '4' ? parseInt(label) - 1 : label.charCodeAt(0) - 65;
        if (idx >= 0 && idx < 4) correctAnswer = idx;
        continue;
      }

      // If still in question stage, append to question
      if (stage === 'question') {
        const qPrefix = line.replace(/^(?:\d+[.])|Q[.:]|Question\s*\d+[:.]\s*/i, '').trim();
        question += (question ? ' ' : '') + (qPrefix || line);
        // If line looks like it has options, switch stage
        if (/^\(?[A-Da-d1-4]\)?[.)\]:]/.test(line)) stage = 'options';
      } else if (stage === 'options' && !/^Explanation|Exp|Solution|Sol|Subject|Topic|Difficulty|Answer|Correct|Ans/i.test(line)) {
        stage = 'post';
      }
    }

    if (question && options.some(o => o)) {
      parsed.push({
        question: question.replace(/^(Q[.:]\s*|Question\s*\d+[:.]\s*)/i, '').trim(),
        options: options.map(o => o || `Option ${options.indexOf(o) + 1}`),
        correctAnswer: correctAnswer >= 0 ? correctAnswer : 0,
        explanation,
        subject: subject || 'APT',
        topic,
        difficulty,
      });
    }
  }
  return parsed;
}

export default function BulkImporter({ onImport, onClose }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState([]);
  const [diagrams, setDiagrams] = useState([]);
  const fileRef = useRef(null);

  const handleParse = () => {
    const parsed = parseQuestions(text);
    setPreview(parsed);
  };

  const handleImport = () => {
    onImport(preview, diagrams);
  };

  const handleDiagramUpload = (e) => {
    const files = Array.from(e.target.files);
    setDiagrams(prev => [...prev, ...files.map(f => ({
      file: f,
      name: f.name,
      url: URL.createObjectURL(f),
    }))]);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-5">
          <div>
            <h3 className="font-semibold text-text">Smart Bulk Question Importer</h3>
            <p className="text-[10px] text-text3 mt-1">Paste questions with options. Supports Q/A, Explanation, Subject, Topic, Difficulty metadata.</p>
          </div>
          <button onClick={onClose} className="text-text3 hover:text-text text-lg">✕</button>
        </div>

        <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
          <p className="text-[10px] text-primary font-semibold mb-1">Supported Format</p>
          <pre className="text-[9px] text-text3 font-mono leading-relaxed whitespace-pre-wrap">
{`1. What is the time complexity of binary search?
A) O(n)
B) O(log n) ✓
C) O(n²)
D) O(2ⁿ)
Explanation: Binary search halves search space each iteration.
Subject: AL
Topic: Searching
Difficulty: easy

Q: Which sorting is O(n log n) worst-case?
A) Bubble sort
B) Quick sort
C) Merge sort ✓
D) Insertion sort
Answer: C`}
          </pre>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={10}
          className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text font-mono resize-none mb-3"
          placeholder="Paste your questions here..."
        />

        {/* Diagram upload */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => fileRef.current?.click()} className="text-[10px] px-3 py-1.5 rounded-lg border border-border bg-bg-2 text-text2 hover:border-primary/30">
            + Attach Diagrams
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleDiagramUpload} className="hidden" />
          {diagrams.length > 0 && (
            <div className="flex gap-1">
              {diagrams.map((d, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                  📎 {d.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={handleParse} disabled={!text.trim()} className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-30" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
            Parse Questions
          </button>
          <button onClick={handleImport} disabled={preview.length === 0} className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-primary to-secondary text-white disabled:opacity-30">
            Import {preview.length} Questions
          </button>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-text3 font-semibold uppercase tracking-wider">Preview ({preview.length} questions)</p>
            {preview.map((q, i) => (
              <div key={i} className="p-3 rounded-xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>{q.subject}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{
                    background: q.difficulty === 'hard' ? 'rgba(239,68,68,0.1)' : q.difficulty === 'easy' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                    color: q.difficulty === 'hard' ? '#EF4444' : q.difficulty === 'easy' ? '#34D399' : '#FBBF24',
                  }}>{q.difficulty}</span>
                  {q.topic && <span className="text-[9px] text-text3">{q.topic}</span>}
                </div>
                <p className="text-xs text-text font-medium mb-1">{q.question}</p>
                <div className="flex flex-wrap gap-1.5">
                  {q.options.map((opt, oi) => (
                    <span key={oi} className={`text-[9px] px-2 py-0.5 rounded ${oi === q.correctAnswer ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-bg-2 text-text3 border border-border'}`}>
                      {oi === q.correctAnswer && '✓ '}{String.fromCharCode(65 + oi)}) {opt}
                    </span>
                  ))}
                </div>
                {q.explanation && <p className="text-[9px] text-text3 mt-1 italic">{q.explanation.substring(0, 100)}{q.explanation.length > 100 ? '...' : ''}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
