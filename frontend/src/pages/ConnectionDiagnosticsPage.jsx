import { useEffect, useCallback } from 'react';
import { useDiagnostics } from '../context/DiagnosticsContext';
import { useNavigate } from 'react-router-dom';

const GRADE_COLOR = { excellent: '#10B981', good: '#06B6D4', fair: '#F59E0B', poor: '#EF4444', unknown: '#64748B' };
const GRADE_LABEL = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', unknown: 'Unknown' };
const STATUS_LABEL = { passed: 'Passed', failed: 'Failed', degraded: 'Degraded', unknown: 'Unknown' };

function ScoreRing({ score, grade }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const safeScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  const off = c - (safeScore / 100) * c;
  const color = GRADE_COLOR[grade] || GRADE_COLOR.unknown;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 900ms ease-out' }} />
      </svg>
      <div className="text-center">
        <div className="text-2xl font-black font-mono" style={{ color }}>{Number.isFinite(score) ? score : '—'}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{GRADE_LABEL[grade] || 'Unknown'}</div>
      </div>
    </div>
  );
}

function ServiceCard({ test }) {
  const color = GRADE_COLOR[test.grade] || GRADE_COLOR.unknown;
  return (
    <div className="rounded-xl p-4 transition-colors" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: `${color}14`, border: `1px solid ${color}30` }}>{test.icon}</span>
        <span className="text-xs font-semibold text-white flex-1">{test.label}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: `${color}12`, border: `1px solid ${color}22`, color }}>{STATUS_LABEL[test.status] || test.status}</span>
      </div>
      <div className="text-sm font-mono font-bold mb-1" style={{ color }}>{test.value || '—'}</div>
      <div className="text-[11px] text-white/50 leading-relaxed">{test.detail}</div>
      {test.note && <div className="text-[10px] text-white/30 mt-1 italic">{test.note}</div>}
    </div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, #7C3AED, #4F46E5)' }} />
    </div>
  );
}

export default function ConnectionDiagnosticsPage() {
  const { state, running, results, progress, error, startDiagnostics, retryDiagnostics, cancelDiagnostics } = useDiagnostics();
  const navigate = useNavigate();

  const handleRun = useCallback(() => {
    startDiagnostics();
  }, [startDiagnostics]);

  const handleRetry = useCallback(() => {
    retryDiagnostics();
  }, [retryDiagnostics]);

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all text-sm">←</button>
          <h1 className="text-xl font-bold text-white">GateNexa Connection Center</h1>
        </div>
        <p className="text-sm text-white/50 ml-11">Check your connection, services and device.</p>
      </div>

      {/* Overall Status Card */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'linear-gradient(180deg, rgba(15,18,32,0.9), rgba(10,14,26,0.9))', border: '1px solid rgba(139,92,246,0.14)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ScoreRing score={results?.score} grade={results?.grade || 'unknown'} />
          <div className="flex-1 text-center md:text-left">
            <div className="text-sm font-bold text-white">
              {running ? 'Running checks…' : results ? `Status: ${GRADE_LABEL[results.grade]}` : error ? 'Diagnostics failed' : 'Not yet checked'}
            </div>
            <p className="text-xs text-white/50 mt-1 max-w-lg">
              {results
                ? results.grade === 'excellent' ? 'All systems healthy — GateNexa is ready.'
                : results.grade === 'good' ? 'Minor issues detected — most features will work normally.'
                : results.grade === 'fair' ? 'Some services degraded — check recommendations below.'
                : 'Several checks failed — see details below.'
                : error ? error
                : 'Run diagnostics to measure internet, API latency, backend and device readiness.'}
            </p>
            {running && (
              <div className="mt-3 space-y-1">
                <ProgressBar progress={progress} />
                <div className="text-[11px] text-white/40">{Math.round(progress * 100)}% complete</div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            {running ? (
              <button onClick={cancelDiagnostics} className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-white/[0.08] border border-white/[0.1]">Cancel</button>
            ) : (
              <button onClick={handleRun} className="px-6 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>
                {results ? 'Run Diagnostics' : 'Run Diagnostics'}
              </button>
            )}
            {results && (results.grade === 'poor' || results.grade === 'fair') && !running && (
              <button onClick={handleRetry} className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">Retry Failed</button>
            )}
          </div>
        </div>
      </div>

      {/* Service Grid */}
      {results ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {results.results.map(t => <ServiceCard key={t.id} test={t} />)}
          </div>

          {/* Recommendations */}
          {results.recommendations?.length > 0 && (
            <div className="rounded-xl p-5 mb-4" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-2">Recommendations</div>
              <ul className="space-y-2">
                {results.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-white/70 flex gap-2">
                    <span className="text-violet-400 shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[11px] text-white/30">
            Last checked: {new Date(results.timestamp).toLocaleString()} · {results.results.filter(r => r.status === 'passed').length}/{results.results.length} passed
          </div>
        </>
      ) : !running ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEST_PLACEHOLDERS.map((t, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-white/[0.04]">{t.icon}</span>
                <span className="text-xs font-semibold text-white/40">{t.label}</span>
              </div>
              <div className="text-sm font-mono text-white/20">—</div>
              <div className="text-[11px] text-white/20 mt-1">Not yet checked</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEST_PLACEHOLDERS.map((t, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-lg bg-white/[0.04]" />
                <span className="h-3 w-20 rounded bg-white/[0.04]" />
              </div>
              <div className="h-4 w-16 rounded bg-white/[0.04] mb-1" />
              <div className="h-3 w-full rounded bg-white/[0.03]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TEST_PLACEHOLDERS = [
  { icon: '📶', label: 'Internet Latency' },
  { icon: '⚡', label: 'GateNexa API' },
  { icon: '🖥️', label: 'Backend Health' },
  { icon: '🗄️', label: 'Database' },
  { icon: '🤖', label: 'AI Services' },
  { icon: '🎬', label: 'Video Readiness' },
  { icon: '🌐', label: 'Browser' },
  { icon: '📱', label: 'Device' },
  { icon: '📄', label: 'PDF / Reports' },
];
