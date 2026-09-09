import { useDiagnostics } from '../context/DiagnosticsContext';

const GRADE_COLOR = { excellent: '#10B981', good: '#06B6D4', fair: '#F59E0B', poor: '#EF4444', unknown: '#64748B' };
const GRADE_LABEL = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', unknown: 'Unknown' };

function ScoreRing({ score, grade }) {
  const r = 48; const c = 2 * Math.PI * r; const off = c - (Math.min(100, Math.max(0, score || 0)) / 100) * c;
  const color = GRADE_COLOR[grade] || GRADE_COLOR.unknown;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 900ms ease-out' }} />
      </svg>
      <div className="text-center">
        <div className="text-3xl font-black font-mono" style={{ color }}>{Number.isFinite(score) ? score : '—'}</div>
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{GRADE_LABEL[grade] || 'Unknown'}</div>
      </div>
    </div>
  );
}

function ServiceCard({ test }) {
  const color = GRADE_COLOR[test.grade] || GRADE_COLOR.unknown;
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${color}14`, border: `1px solid ${color}30`, color }}>{test.icon}</span>
        <span className="text-xs font-semibold text-white">{test.label}</span>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: `${color}12`, border: `1px solid ${color}22`, color }}>{GRADE_LABEL[test.grade] || test.status}</span>
      </div>
      <div className="text-xs font-mono font-bold" style={{ color }}>{test.value || '—'}</div>
      <div className="text-[11px] text-text3 mt-1 leading-relaxed">{test.detail}</div>
      {test.timestamp && <div className="text-[10px] text-white/20 mt-1">{new Date(test.timestamp).toLocaleTimeString()}</div>}
    </div>
  );
}

export default function ConnectionDiagnosticsPage() {
  const { state, results, progress, currentTest, startDiagnostics, retryFailed, openDiagnostics } = useDiagnostics();
  const running = state === 'running';

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">GateNexa Connection Center</h1>
        <p className="text-sm text-text3 mt-0.5">Check your connection, services and device.</p>
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: 'linear-gradient(180deg, rgba(15,18,32,0.9), rgba(10,14,26,0.9))', border: '1px solid rgba(139,92,246,0.14)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ScoreRing score={results?.score} grade={results?.grade || 'unknown'} />
          <div className="flex-1 text-center md:text-left">
            <div className="text-sm font-bold text-white">{results ? `Status: ${GRADE_LABEL[results.grade]}` : running ? 'Running checks…' : 'Not yet checked'}</div>
            <p className="text-xs text-text3 mt-1 max-w-lg">{results ? (results.grade==='excellent' ? 'All systems healthy — GateNexa is ready.' : results.grade==='good' ? 'Minor issues — most features will work.' : results.grade==='fair' ? 'Some services degraded — check recommendations.' : results.grade==='poor' ? 'Several checks failed — see details below.' : 'Results incomplete.') : 'Run diagnostics to measure internet, API latency, backend and device readiness.'}</p>
            {running && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress*100}%`, background: 'linear-gradient(90deg, #7C3AED, #4F46E5)' }} />
                </div>
                <div className="text-[11px] text-text3 mt-1">{currentTest ? `Checking ${currentTest}…` : `${Math.round(progress*100)}%`} </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button onClick={() => startDiagnostics()} disabled={running} className="px-6 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>{running ? 'Running…' : results ? 'Run Diagnostics' : 'Run Diagnostics'}</button>
            {results && (results.grade==='poor' || results.grade==='fair') && <button onClick={retryFailed} disabled={running} className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 disabled:opacity-50">Retry Failed Checks</button>}
            <button onClick={openDiagnostics} className="px-6 py-2.5 rounded-xl text-xs font-medium bg-white/[0.06] border border-white/[0.08] text-white/80">Open as Modal</button>
          </div>
        </div>
      </div>

      {results ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {results.results.map(t => <ServiceCard key={t.id} test={t} />)}
          </div>
          {results.recommendations?.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-2">Recommendations</div>
              <ul className="space-y-2">
                {results.recommendations.map((r,i) => <li key={i} className="text-xs text-text2 flex gap-2"><span className="text-violet-400">•</span><span>{r}</span></li>)}
              </ul>
            </div>
          )}
          <div className="text-[11px] text-text3 mt-4">Last checked: {new Date(results.timestamp).toLocaleString()} · {results.results.filter(r=>r.status==='passed').length}/{results.results.length} passed</div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_,i) => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }} />)}
        </div>
      )}
    </div>
  );
}
