// Study resources: YouTube, NPTEL, notes, textbooks, practice links
import { useState } from 'react';
import { useProgress } from '../context/ProgressContext';

const TYPE_META = {
  youtube: { icon: '▶️', label: 'YouTube', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  nptel: { icon: '🎓', label: 'NPTEL', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  notes: { icon: '📄', label: 'Notes PDF', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  textbook: { icon: '📚', label: 'Textbook', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  gateoverflow: { icon: '💬', label: 'GateOverflow', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  practice: { icon: '📝', label: 'Practice', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
};

export default function ResourcesPage() {
  const { resources } = useProgress();
  const [filter, setFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const subjects = ['All', ...new Set(resources.map((r) => r.subject))];
  const types = ['All', ...new Set(resources.map((r) => r.type))];

  const filtered = resources.filter(
    (r) => (filter === 'All' || r.subject === filter) && (typeFilter === 'All' || r.type === typeFilter)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Study Resources</h1>
        <p className="text-sm text-text3 mt-0.5">Curated YouTube playlists, NPTEL courses, notes & practice links</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-2">
        {subjects.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === s ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}>
            {s === 'All' ? 'All Subjects' : s.split(' ').slice(-1)[0]}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {types.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${typeFilter === t ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/10'}`}>
            {t === 'All' ? 'All Types' : TYPE_META[t]?.label || t}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((r) => {
          const meta = TYPE_META[r.type] || { icon: '🔗', label: r.type, color: 'text-text3 bg-bg-2 border-border' };
          return (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-sm font-medium text-text group-hover:text-primary transition-colors">{r.title}</div>
                <span className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap flex-shrink-0 ${meta.color}`}>
                  {meta.icon} {meta.label}
                </span>
              </div>
              <div className="text-[11px] text-text3">{r.subject}</div>
            </a>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-text3 text-sm">No resources match this filter</div>
        )}
      </div>
    </div>
  );
}
