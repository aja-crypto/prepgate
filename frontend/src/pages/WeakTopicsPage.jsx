import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { detectWeakTopics } from '../utils/gateUtils';
import NeuralBackground from '../components/common/NeuralBackground';

const SUBJECTS = ['All', 'Mathematics', 'Digital Logic', 'Computer Organization', 'Programming & DS', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', 'TOC', 'Compiler Design'];

export default function WeakTopicsPage() {
  const { topics, pyqs, mocks, studyStats } = useProgress();
  const subjects = studyStats?.subjects || [];
  const [filter, setFilter] = useState('All');

  const weakTopics = useMemo(
    () => detectWeakTopics(topics || [], pyqs || [], mocks || [], subjects),
    [topics, pyqs, mocks, subjects]
  );

  const filtered = filter === 'All' ? weakTopics : weakTopics.filter(t => t.subject === filter);
  const weakCount = filtered.filter(t => t.score < 50).length;
  const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((s, t) => s + t.score, 0) / filtered.length) : 0;

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] relative">
      <NeuralBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Dashboard</Link>
          <div className="flex-1" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#F43F5E' }}>
            Weak Topic Detector
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Weak Topics', value: weakCount, color: '#F43F5E' },
            { label: 'Average Score', value: `${avgScore}%`, color: '#6366F1' },
            { label: 'Subjects Affected', value: [...new Set(weakTopics.map(t => t.subject))].length, color: '#F59E0B' },
            { label: 'Critical (Score < 50)', value: weakTopics.filter(t => t.score < 50).length, color: '#F97316' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {SUBJECTS.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: filter === s ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filter === s ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: filter === s ? '#A78BFA' : '#9CA3AF',
              }}
            >{s}</button>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">Detected Weak Areas</h2>
          {filtered.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-gray-400">No weak topics detected. Keep up the good work!</p>
            </div>
          ) : (
            filtered.map((t, i) => (
              <div key={i} className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${t.color}15`, color: t.color }}>{t.type}</span>
                      <span className="text-[9px] text-gray-500">{t.reason}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{t.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{t.recommendation}</p>
                  </div>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="relative w-12 h-12">
                      <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke={t.color} strokeWidth="3"
                          strokeDasharray={`${2 * Math.PI * 15}`}
                          strokeDashoffset={`${2 * Math.PI * 15 * (1 - t.score / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: t.color }}>{t.score}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {weakCount > 0 && (
          <div className="mt-6 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(124,58,237,0.04))', border: '1px solid rgba(244,63,94,0.12)' }}>
            <h3 className="text-xs font-bold text-white mb-2">Recommended Action Plan</h3>
            <ol className="space-y-1.5">
              <li className="text-[10px] text-gray-400 flex items-start gap-2"><span className="text-primary">1.</span> Focus on <strong className="text-white">Critical</strong> topics first (score &lt; 40%) — they cost you the most marks.</li>
              <li className="text-[10px] text-gray-400 flex items-start gap-2"><span className="text-primary">2.</span> Spend <strong className="text-white">2 hours daily</strong> on weak areas until scores reach 70%+.</li>
              <li className="text-[10px] text-gray-400 flex items-start gap-2"><span className="text-primary">3.</span> Solve <strong className="text-white">10+ PYQs</strong> per weak topic after revising concepts.</li>
              <li className="text-[10px] text-gray-400 flex items-start gap-2"><span className="text-primary">4.</span> Re-test with a <strong className="text-white">subject-wise mock</strong> after 5 days of focused practice.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
