import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceService } from '../services/api';

const AVAILABLE_SUBJECTS = [
  'Operating Systems',
  'Programming & Data Structures',
  'Computer Organization',
  'Discrete Mathematics',
];

const COMING_SOON_SUBJECTS = [
  'Algorithms', 'Computer Networks', 'DBMS', 'Theory of Computation',
  'Compiler Design', 'Digital Logic', 'Engineering Mathematics', 'General Aptitude',
];

const TOPPER_RESOURCES = [
  { label: '📚 AIR 1 Short Notes', desc: 'Concise topper-curated revision notes', to: '/short-notes', color: '#8B5CF6' },
  { label: '📝 Revision Notes', desc: 'Flagged topics needing review', to: '/revision', color: '#F59E0B' },
  { label: '⭐ Formula Sheets', desc: 'Quick-reference formula collection', to: '/formulas', color: '#06B6D4' },
  { label: '🚀 Final Revision Mode', desc: 'One-click access to all short notes', to: '/final-revision', color: '#22C55E' },
];

export default function NotesPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(() => localStorage.getItem('gatenexa_disclaimer_dismissed') !== 'true');

  useEffect(() => {
    async function load() {
      try {
        const [subjRes, idxRes] = await Promise.all([
          resourceService.getSubjects(),
          resourceService.getIndex(),
        ]);
        setSubjects(subjRes.data?.data || []);
        setResources(idxRes.data?.data || []);
      } catch (e) {
        console.error('Failed to load resources:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    resources.forEach(r => {
      if (!map[r.subject]) map[r.subject] = [];
      map[r.subject].push(r);
    });
    return map;
  }, [resources]);

  const subjectCount = (s) => (grouped[s] || []).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">📚 Resources</h1>
          <p className="text-sm text-text3">AI-indexed GATE preparation materials — managed by the platform.</p>
        </div>
      </div>

      {showDisclaimer && (
        <div className="rounded-2xl p-5 relative" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(239,68,68,0.08))', border: '1px solid rgba(251,146,60,0.3)', boxShadow: '0 0 24px -4px rgba(251,146,60,0.12)' }}>
          <button onClick={() => { setShowDisclaimer(false); localStorage.setItem('gatenexa_disclaimer_dismissed', 'true'); }} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">⚖️</span>
            <div>
              <h3 className="text-sm font-bold text-orange-300 mb-1">Disclaimer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The PDF notes here are from public Telegram channels for <strong>personal educational use only</strong>.
                We do not claim ownership. For copyright-safe content, use <strong>Short Notes</strong> below.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(34,211,238,0.04))', border: '1px solid rgba(139,92,246,0.1)' }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🏆</span>
          <h2 className="text-sm font-bold text-white">Topper Notes & Short Notes</h2>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-semibold">Safe to Distribute</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TOPPER_RESOURCES.map(item => (
            <button key={item.label} onClick={() => navigate(item.to)}
              className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] group"
              style={{ background: `${item.color}08`, border: `1px solid ${item.color}15` }}
            >
              <div className="text-lg mb-1.5">{item.label.split(' ')[0]}</div>
              <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">{item.label.replace(/^[^\s]+\s/, '')}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="hidden lg:block space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text3 mb-4 px-1">Available Now</h3>
          {AVAILABLE_SUBJECTS.filter(s => subjects.includes(s)).map(s => (
            <button key={s} onClick={() => setExpandedSubject(expandedSubject === s ? null : s)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${expandedSubject === s ? 'bg-primary/15 text-primary font-bold border border-primary/20' : 'text-text2 hover:bg-surface border border-transparent'}`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 text-purple-400"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
              <span className="flex-1 truncate">{s}</span>
              <span className="text-[10px] text-purple-400 font-semibold">{subjectCount(s)}</span>
            </button>
          ))}
          <h3 className="text-xs font-bold uppercase tracking-widest text-text3 mb-3 mt-6 px-1">Coming Soon</h3>
          {COMING_SOON_SUBJECTS.map(s => (
            <div key={s} className="w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 text-slate-600 cursor-not-allowed">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" /></svg>
              <span className="flex-1 truncate">{s}</span>
              <span className="text-[9px] text-slate-600">Soon</span>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4 animate-pulse">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface border border-border rounded-2xl" />)}
            </div>
          ) : expandedSubject ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setExpandedSubject(null)} className="p-2 rounded-lg hover:bg-white/5 text-text3">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                <div>
                  <h2 className="text-lg font-bold text-text">{expandedSubject}</h2>
                  <p className="text-xs text-text3">{subjectCount(expandedSubject)} resources</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {(grouped[expandedSubject] || []).map(r => (
                  <button key={r.id} onClick={() => window.open(resourceService.fileUrl(r.filePath), '_blank')}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.01] group"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">{r.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{r.topic} · {(r.size / 1024).toFixed(0)}KB</div>
                    </div>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-600 group-hover:text-purple-400 shrink-0">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-text mb-4">Available Subjects</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {AVAILABLE_SUBJECTS.filter(s => subjects.includes(s)).map((s, si) => {
                  const count = subjectCount(s);
                  const colors = ['#8B5CF6','#22D3EE','#F97316','#22C55E'];
                  const color = colors[si % colors.length];
                  return (
                    <button key={s} onClick={() => setExpandedSubject(s)}
                      className="flex items-center gap-4 p-5 rounded-2xl text-left transition-all hover:scale-[1.01] group relative overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6" style={{ color }}><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{s}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{count} file{count !== 1 ? 's' : ''}</div>
                      </div>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-600 group-hover:text-purple-400 shrink-0">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  );
                })}
              </div>

              <h2 className="text-lg font-bold text-text mt-10 mb-4">More Subjects Coming Soon</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {COMING_SOON_SUBJECTS.map(s => (
                  <div key={s} className="flex items-center gap-4 p-4 rounded-2xl opacity-50 cursor-not-allowed" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-600"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" /></svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-600">{s}</div>
                      <div className="text-[10px] text-slate-700">Coming soon</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
