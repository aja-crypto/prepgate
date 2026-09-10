import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDiagnostics } from '../../context/DiagnosticsContext';

const GRADE_COLORS = { excellent: '#10B981', good: '#06B6D4', fair: '#F59E0B', poor: '#EF4444', unknown: '#64748B' };
const GRADE_LABELS = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', unknown: 'Unknown' };
const STATUS_ICONS = { passed: '✓', failed: '✗', degraded: '⚠', unknown: '?' };

function ScoreRing({ score }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const safeScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  const offset = circumference - (safeScore / 100) * circumference;
  const color = score >= 90 ? GRADE_COLORS.excellent : score >= 70 ? GRADE_COLORS.good : score >= 45 ? GRADE_COLORS.fair : GRADE_COLORS.poor;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </svg>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}>
        <span className="text-xl font-black font-mono" style={{ color }}>{Number.isFinite(score) ? score : '—'}</span>
      </motion.div>
    </div>
  );
}

function TestRow({ test, index }) {
  if (!test) return null;
  const isRunning = test.status === 'running';
  const color = GRADE_COLORS[test.grade] || GRADE_COLORS.unknown;
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-sm w-5 text-center shrink-0">{test.icon || '🔍'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-white">{test.label}</span>
          {test.status && test.status !== 'running' && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}66` }} />
          )}
        </div>
        {test.detail && <div className="text-[10px] text-white/40 mt-0.5 truncate">{test.detail}</div>}
      </div>
      <div className="text-right shrink-0">
        {isRunning ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-3.5 h-3.5 rounded-full border-[1.5px] border-purple-400 border-t-transparent" />
        ) : test.status === 'passed' ? (
          <span className="text-[10px] font-mono font-bold" style={{ color }}>{GRADE_LABELS[test.grade]}</span>
        ) : test.status === 'degraded' ? (
          <span className="text-[10px] text-amber-400 font-medium">Degraded</span>
        ) : test.status === 'failed' ? (
          <span className="text-[10px] text-red-400 font-medium">Failed</span>
        ) : (
          <span className="text-[10px] text-white/30 font-medium">—</span>
        )}
      </div>
    </motion.div>
  );
}

export default function DiagnosticsModal() {
  const { showModal, closeDiagnostics, running, results, progress, error, startDiagnostics } = useDiagnostics();
  const navigate = useNavigate();

  useEffect(() => {
    if (showModal && !results && !running && !error) {
      startDiagnostics();
    }
  }, [showModal, results, running, error, startDiagnostics]);

  const handleOpenPage = useCallback(() => {
    closeDiagnostics();
    navigate('/connection-diagnostics');
  }, [closeDiagnostics, navigate]);

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)' }}
          onClick={closeDiagnostics}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0C0E1A', border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 0 60px rgba(139,92,246,0.08)' }}>

            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))' }}>🩺</div>
                <div>
                  <h2 className="text-sm font-bold text-white">Connection Diagnostics</h2>
                  <p className="text-[10px] text-white/40">GateNexa System Check</p>
                </div>
              </div>
              <button onClick={closeDiagnostics} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all text-xs">✕</button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Loading state */}
              {!results && !error && (
                <div className="flex flex-col items-center py-5 gap-3">
                  <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.08))', border: '1px solid rgba(139,92,246,0.12)' }}>
                    🔍
                  </motion.div>
                  <p className="text-xs font-medium text-white">Running diagnostics…</p>
                  <p className="text-[10px] text-white/40 -mt-0.5">Testing connection, backend, and device</p>
                  <div className="w-full max-w-xs">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)' }}
                        initial={{ width: '0%' }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.3 }} />
                    </div>
                    <div className="text-[10px] text-white/30 text-center mt-1">{Math.round(progress * 100)}%</div>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="flex flex-col items-center py-5 gap-2.5">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-xs font-medium text-red-400">Diagnostics failed</p>
                  <p className="text-[10px] text-white/40 text-center">{error}</p>
                  <button onClick={startDiagnostics} className="px-4 py-2 rounded-lg text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>Retry</button>
                </div>
              )}

              {/* Results */}
              {results && (
                <>
                  <div className="flex items-center gap-4 justify-center py-3">
                    <ScoreRing score={results.score} />
                    <div>
                      <div className="text-xs font-bold text-white">Connection Score</div>
                      <div className="text-[11px] mt-0.5" style={{ color: GRADE_COLORS[results.grade] }}>{GRADE_LABELS[results.grade]}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{results.results.filter(r => r.status === 'passed' || r.status === 'degraded').length}/{results.results.length} checks passed</div>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-52 overflow-y-auto scroll-container pr-1">
                    {results.results.map((test, i) => (
                      <TestRow key={test.id} test={test} index={i} />
                    ))}
                  </div>

                  {results.recommendations.length > 0 && (
                    <div className="rounded-lg p-3" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.08)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">Recommendations</div>
                      <ul className="space-y-1">
                        {results.recommendations.map((rec, i) => (
                          <li key={i} className="text-[11px] text-white/60 flex items-start gap-1.5">
                            <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleOpenPage}
                      className="flex-1 py-2 rounded-lg text-[11px] font-medium bg-white/[0.05] border border-white/[0.08] text-white/70">
                      Open Full Page
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={startDiagnostics}
                      className="flex-1 py-2 rounded-lg text-[11px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                      Run Again
                    </motion.button>
                  </div>
                </>
              )}

              <div className="text-[9px] text-center text-white/15">
                GateNexa Diagnostics — No data is sent externally
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
