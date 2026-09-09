import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDiagnostics } from '../../context/DiagnosticsContext';

const GRADE_COLOR = { excellent: '#10B981', good: '#06B6D4', fair: '#F59E0B', poor: '#EF4444', unknown: '#64748B' };
const GRADE_LABEL = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', unknown: 'Unknown' };
const STATUS_DOT = { passed: 'bg-emerald-500', degraded: 'bg-amber-500', failed: 'bg-red-500', unknown: 'bg-slate-500', running: 'bg-purple-500 animate-pulse' };

function ScoreRing({ score, grade }) {
  const r = 42; const c = 2 * Math.PI * r; const off = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  const color = GRADE_COLOR[grade] || GRADE_COLOR.unknown;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 900ms ease-out' }} />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-black font-mono" style={{ color }}>{Number.isFinite(score) ? score : '—'}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{GRADE_LABEL[grade] || 'Unknown'}</div>
      </div>
    </div>
  );
}

function TestRow({ test }) {
  const gradeColor = GRADE_COLOR[test.grade] || GRADE_COLOR.unknown;
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: `${gradeColor}15`, border: `1px solid ${gradeColor}30`, color: gradeColor }}>{test.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white truncate">{test.label}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[test.status] || 'bg-slate-500'}`} />
        </div>
        <div className="text-[11px] text-text3 truncate">{test.detail}</div>
      </div>
      <div className="text-right shrink-0 min-w-[72px]">
        <div className="text-xs font-mono font-bold" style={{ color: gradeColor }}>{test.value || '—'}</div>
        <div className="text-[10px] uppercase tracking-wide" style={{ color: gradeColor }}>{GRADE_LABEL[test.grade] || test.status}</div>
      </div>
    </div>
  );
}

export default function DiagnosticsModal() {
  const { showModal, closeDiagnostics, state, results, progress, error, currentTest, startDiagnostics, retryFailed } = useDiagnostics();
  const running = state === 'running';

  useEffect(() => {
    if (showModal && state === 'idle' && !results && !running) startDiagnostics();
  }, [showModal, state, results, running, startDiagnostics]);

  useEffect(() => {
    if (!showModal) return;
    const onEsc = (e) => { if (e.key === 'Escape') closeDiagnostics(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [showModal, closeDiagnostics]);

  if (!showModal) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(14px)' }} onClick={closeDiagnostics}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: 'linear-gradient(180deg, #0f1220 0%, #0a0e1a 100%)', border: '1px solid rgba(139,92,246,0.18)', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.08)' }}>
        <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.12))', border: '1px solid rgba(124,58,237,0.18)' }}>◍</div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">GateNexa Connection Center</h2>
              <p className="text-[11px] text-text3">Connection, services and device check</p>
            </div>
          </div>
          <button onClick={closeDiagnostics} aria-label="Close" className="w-8 h-8 rounded-xl flex items-center justify-center text-text3 hover:text-white hover:bg-white/[0.06] transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {state === 'running' && !results && (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(6,182,212,0.08))', border: '1px solid rgba(124,58,237,0.16)' }}>
                <span className="w-5 h-5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin block" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Running diagnostics…</p>
                <p className="text-xs text-text3 mt-1">{currentTest ? `Checking ${currentTest}` : 'Testing connection, backend and device' } · {Math.round(progress*100)}%</p>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress*100}%`, background: 'linear-gradient(90deg, #7C3AED, #4F46E5)' }} />
              </div>
            </div>
          )}

          {state === 'failed' && !results && error && (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">⚠</div>
              <p className="text-sm font-semibold text-red-400">Diagnostics failed</p>
              <p className="text-xs text-text3 mt-1">{error}</p>
              <button onClick={() => startDiagnostics()} className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>Retry</button>
            </div>
          )}

          {results && (
            <>
              <div className="flex items-center gap-5 justify-center py-2">
                <ScoreRing score={results.score} grade={results.grade} />
                <div>
                  <div className="text-sm font-bold text-white">Overall Score</div>
                  <div className="text-xs mt-0.5 font-semibold" style={{ color: GRADE_COLOR[results.grade] }}>{GRADE_LABEL[results.grade]} · {results.results.filter(r => r.status==='passed').length}/{results.results.length} passed</div>
                  <div className="text-[11px] text-text3 mt-1 max-w-[220px]">{results.grade==='excellent' ? 'All systems healthy' : results.grade==='good' ? 'Minor issues detected' : results.grade==='fair' ? 'Some services degraded' : results.grade==='poor' ? 'Several checks failed' : 'Results incomplete'}</div>
                </div>
              </div>

              <div className="grid gap-2 max-h-[42vh] overflow-y-auto pr-1">
                {results.results.map(t => <TestRow key={t.id} test={t} />)}
              </div>

              {results.recommendations?.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">Recommendations</div>
                  <ul className="space-y-1.5">
                    {results.recommendations.map((r,i) => (
                      <li key={i} className="text-[11px] text-text2 flex gap-2"><span className="text-violet-400">•</span><span>{r}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={closeDiagnostics} className="flex-1 py-3 rounded-xl text-xs font-semibold bg-white/[0.06] border border-white/[0.08] text-white/80 hover:bg-white/[0.08]">Close</button>
                <button onClick={() => startDiagnostics()} className="flex-1 py-3 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>Run Again</button>
                {(results.grade==='poor' || results.grade==='fair') && <button onClick={retryFailed} className="flex-1 py-3 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">Retry Failed</button>}
              </div>
            </>
          )}

          {state === 'idle' && !results && !running && (
            <div className="text-center py-6">
              <p className="text-sm text-white font-medium">Ready to check your connection</p>
              <p className="text-xs text-text3 mt-1">Run a quick test of internet, GateNexa API and device</p>
              <button onClick={() => startDiagnostics()} className="mt-4 px-6 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>Run Diagnostics</button>
            </div>
          )}
        </div>

        <div className="px-6 py-3 text-center text-[10px] text-white/20 border-t border-white/[0.04] shrink-0">GateNexa Diagnostics · No data sent externally</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
