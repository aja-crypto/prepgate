// src/pages/MocksPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { useProgress } from '../context/ProgressContext';
import AirPredictor from '../components/gate/AirPredictor';
import MockTestBuilder from '../components/mock/MockTestBuilder';
import MockTestRunner from '../components/mock/MockTestRunner';
import { api, mockSessionService, getApiErrorMessage } from '../services/api';
import { silentCatch } from '../utils/errorHandler';
import { predictAIR } from '../utils/gateUtils';

Chart.register(...registerables);

const TABS = ['Interactive Mocks', 'Score Tracker'];

const HowItWorks = () => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left mb-4 px-4 py-3 rounded-xl border border-purple-500/30 bg-purple-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-purple-400">📊 How Mock Tests Work</span>
          <span className="text-gray-400 text-xs">{expanded ? 'Hide' : 'Show'}</span>
        </div>
      </button>
      {expanded && (
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Take Full-Length Mock</div>
            <p className="text-gray-400">Experience real GATE exam conditions</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Analyze Mistakes</div>
            <p className="text-gray-400">Review your mistakes and learn from them</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">View Subject-wise Score</div>
            <p className="text-gray-400">See your performance per subject</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Improve Weak Topics</div>
            <p className="text-gray-400">Focus on areas that need more attention</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function MocksPage() {
  const location = useLocation();
  const { mocks, updateMocks } = useProgress();
  const [tab, setTab] = useState('Interactive Mocks');
  const [activeSession, setActiveSession] = useState(location.state?.sessionId || null);
  const [pastSessions, setPastSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', score: '', rank: '', notes: '' });
  const chartRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    mockSessionService.getAll().then((r) => setPastSessions(r.data.data || [])).catch(silentCatch('Load past sessions'));
  }, [activeSession]);

  useEffect(() => {
    api.get('/mocks').then(r => {
      const backend = r.data.data || [];
      if (backend.length > mocks.length) updateMocks(backend);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!chartRef.current || tab !== 'Score Tracker') return;
    if (chartInst.current) chartInst.current.destroy();
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: mocks.map((t) => t.name.split(' ').slice(-2).join(' ')),
        datasets: [{
          data: mocks.map((t) => t.score),
          borderColor: '#4f8dff',
          backgroundColor: '#4f8dff20',
          tension: 0.4,
          pointBackgroundColor: '#4f8dff',
          pointRadius: 4,
          fill: true,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 30, max: 80, grid: { color: '#ffffff08' }, ticks: { color: '#636b82', font: { size: 10 } } },
          x: { grid: { color: '#ffffff05' }, ticks: { color: '#636b82', font: { size: 9 } } },
        },
      },
    });
    return () => chartInst.current?.destroy();
  }, [mocks, tab]);

  const addTest = () => {
    if (!form.name || !form.score) return;
    const t = {
      name: form.name,
      score: parseFloat(form.score),
      rank: parseInt(form.rank) || null,
      notes: form.notes,
    };
    api.post('/mocks', t).then(r => {
      if (r.data.data) updateMocks((ts) => [...ts, r.data.data]);
    }).catch(() => {
      t.id = Date.now();
      t.date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      updateMocks((ts) => [...ts, t]);
    });
    setForm({ name: '', score: '', rank: '', notes: '' });
    setShowModal(false);
  };

  const best = mocks.length ? Math.max(...mocks.map((t) => t.score)) : 0;
  const avg = mocks.length ? (mocks.reduce((s, t) => s + t.score, 0) / mocks.length).toFixed(1) : 0;
  const latestPred = mocks.length ? predictAIR(mocks[mocks.length - 1].score) : null;

  return (
    <div>
      <HowItWorks />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">Mock Tests</h1>
          <p className="text-sm text-text3 mt-0.5">Take PYQ-based mocks or track external scores</p>
        </div>
        {tab === 'Score Tracker' && (
          <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">+ Add Test</button>
        )}
      </div>

      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-4 py-2 rounded-lg border transition-all ${tab === t ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Interactive Mocks' && (
        <div>
          {activeSession ? (
            <MockTestRunner
              sessionId={activeSession}
              onComplete={() => setActiveSession(null)}
              onCancel={() => setActiveSession(null)}
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <MockTestBuilder onStart={(id) => setActiveSession(id)} />
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text mb-3">Recent Mocks</h3>
                {pastSessions.length ? pastSessions.slice(0, 8).map((s) => (
                  <div key={s._id} className="flex items-center justify-between bg-bg-2 border border-border rounded-lg p-3 mb-2 text-sm">
                    <div>
                      <div className="text-text">{s.name}</div>
                      <div className="text-[10px] text-text3 capitalize">{s.type} · {s.status}</div>
                    </div>
                    {s.status === 'completed' ? (
                      <span className="text-xs font-mono text-primary">{s.score}/{s.maxScore}</span>
                    ) : (
                      <button type="button" onClick={() => setActiveSession(s._id)} className="text-[10px] text-primary hover:underline">Resume</button>
                    )}
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.15)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-primary">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text mb-2">No Mock Scores Yet</h3>
                    <p className="text-sm text-text3 max-w-xs leading-relaxed mb-6">Track your external mock test scores and see your progress over time.</p>
                    <span className="text-sm bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-5 py-2 rounded-lg font-medium opacity-60 cursor-not-allowed">Add Your First Score</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Score Tracker' && <div className="grid md:grid-cols-2 gap-4 mb-5">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Score Trend</div>
          <div className="relative h-48"><canvas ref={chartRef} /></div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-4">Performance Overview</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Best Score', v: best, c: '#06d6a0' },
              { label: 'Avg Score', v: avg, c: '#4f8dff' },
              { label: 'Tests Taken', v: mocks.length, c: '#ff9f43' },
              { label: 'Est. AIR', v: latestPred ? `~${latestPred.air.toLocaleString()}` : '—', c: '#a855f7' },
            ].map((s) => (
              <div key={s.label} className="bg-bg-2 border border-border rounded-lg p-3 text-center">
                <div className="text-xl font-bold font-mono" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[10px] text-text3 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {tab === 'Score Tracker' && <div className="mb-5">
        <AirPredictor />
      </div>}

      {tab === 'Score Tracker' && <div className="bg-surface border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['#', 'Test Name', 'Date', 'Score', 'Rank', 'Est. AIR', 'Notes'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-text3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mocks.map((t, i) => {
              const cls = t.score >= 60 ? 'bg-green-500/10 text-green-400 border-green-500/20' : t.score >= 50 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
              const pred = predictAIR(t.score);
              return (
                <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-text3 text-xs">#{i + 1}</td>
                  <td className="px-4 py-3 text-text font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-text3">{t.date}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold font-mono px-2 py-1 rounded border ${cls}`}>{t.score}</span></td>
                  <td className="px-4 py-3 text-text3">{t.rank || '—'}</td>
                  <td className="px-4 py-3 text-text3 font-mono text-xs">~{pred.air.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text3 text-xs">{t.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-5"><h3 className="font-semibold text-text">🎯 Add Mock Test</h3><button onClick={() => setShowModal(false)} className="text-text3 hover:text-text">✕</button></div>
            <div className="space-y-3">
              {[{ label: 'Test Name', key: 'name', ph: 'e.g. MADE Easy Full Length Test 9' }, { label: 'Score (out of 100)', key: 'score', ph: 'e.g. 58.5' }, { label: 'Rank (optional)', key: 'rank', ph: 'e.g. 342' }, { label: 'Notes', key: 'notes', ph: 'What to improve?' }].map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">{f.label}</label>
                  <input value={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60" />
                </div>
              ))}
              <button onClick={addTest} className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 mt-1">Save Test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
