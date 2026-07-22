import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagnostics } from '../../context/DiagnosticsContext';

const GRADE_COLORS = { excellent: '#22C55E', good: '#06B6D4', fair: '#F59E0B', poor: '#EF4444' };
const GRADE_LABELS = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor' };
const STATUS_ICONS = { passed: '✓', failed: '✗', degraded: '⚠' };

function ScoreRing({ score }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? GRADE_COLORS.excellent : score >= 70 ? GRADE_COLORS.good : score >= 45 ? GRADE_COLORS.fair : GRADE_COLORS.poor;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}>
        <span className="text-2xl font-black font-mono" style={{ color }}>{score}</span>
      </motion.div>
    </div>
  );
}

function StatusDot({ grade }) {
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: GRADE_COLORS[grade] || '#666', boxShadow: `0 0 6px ${GRADE_COLORS[grade]}66` }} />;
}

function TestRow({ test, index }) {
  if (!test) return null;
  const isRunning = test.status === 'running';
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-base w-6 text-center shrink-0">{test.icon || '🔍'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white">{test.label}</span>
          {test.status && test.status !== 'running' && <StatusDot grade={test.grade} />}
        </div>
        {test.detail && <div className="text-[10px] text-text3/60 mt-0.5 truncate">{test.detail}</div>}
      </div>
      <div className="text-right shrink-0">
        {isRunning ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent" />
        ) : test.status === 'passed' ? (
          <span className="text-[10px] font-mono font-bold" style={{ color: GRADE_COLORS[test.grade] }}>{GRADE_LABELS[test.grade]}</span>
        ) : test.status === 'degraded' ? (
          <span className="text-[10px] text-yellow-400 font-medium">Degraded</span>
        ) : (
          <span className="text-[10px] text-red-400 font-medium">Failed</span>
        )}
      </div>
    </motion.div>
  );
}

function ProgressBar({ progress, running }) {
  return (
    <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)' }}
        initial={{ width: '0%' }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
      {running && <motion.div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}
        animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} />}
    </div>
  );
}

export default function DiagnosticsModal() {
  const { showModal, closeDiagnostics, running, results, progress, error, startDiagnostics } = useDiagnostics();

  useEffect(() => {
    if (showModal && !results && !running && !error) {
      startDiagnostics();
    }
  }, [showModal, results, running, error, startDiagnostics]);

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)' }}
          onClick={closeDiagnostics}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }} onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: '#0C0E1A', border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 0 60px rgba(139,92,246,0.08)' }}>

            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))' }}>🩺</div>
                <div>
                  <h2 className="text-sm font-bold text-white">Connection Diagnostics</h2>
                  <p className="text-[10px] text-text3/60">GateNexa System Check</p>
                </div>
              </div>
              <button onClick={closeDiagnostics} className="w-8 h-8 rounded-xl flex items-center justify-center text-text3/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {!results && !error && (
                <div className="flex flex-col items-center py-6 gap-4">
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.08))', border: '1px solid rgba(139,92,246,0.15)' }}>
                    🔍
                  </motion.div>
                  <p className="text-sm font-medium text-white">Running diagnostics...</p>
                  <p className="text-xs text-text3/60 -mt-1">Testing connection, backend, and device capabilities</p>
                  <ProgressBar progress={progress} running={running} />
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center py-6 gap-3">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-sm font-medium text-red-400">Diagnostics failed</p>
                  <p className="text-xs text-text3/60 text-center">{error}</p>
                  <button onClick={startDiagnostics}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                    Retry
                  </button>
                </div>
              )}

              {results && (
                <>
                  <div className="flex items-center gap-5 justify-center py-4">
                    <ScoreRing score={results.score} />
                    <div>
                      <div className="text-sm font-bold text-white">Connection Score</div>
                      <div className="text-[11px] mt-0.5" style={{ color: GRADE_COLORS[results.grade] }}>
                        {GRADE_LABELS[results.grade]}
                      </div>
                      <div className="text-[10px] text-text3/60 mt-1">{results.results.filter(r => r.status === 'passed' || r.status === 'degraded').length}/{results.results.length} tests passed</div>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-60 overflow-y-auto scroll-container pr-1">
                    {results.results.map((test, i) => (
                      <TestRow key={test.id} test={test} index={i} />
                    ))}
                  </div>

                  {results.recommendations.length > 0 && (
                    <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">Recommendations</div>
                      <ul className="space-y-1.5">
                        {results.recommendations.map((rec, i) => (
                          <li key={i} className="text-[11px] text-text2/80 flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={closeDiagnostics}
                      className="flex-1 py-2.5 rounded-xl text-xs font-medium"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                      Close
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={startDiagnostics}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                      Run Again
                    </motion.button>
                  </div>
                </>
              )}

              <div className="text-[9px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                GateNexa Diagnostics v1.0 — No data is sent externally
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
