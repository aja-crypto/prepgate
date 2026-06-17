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

function TextbookCard({ resource }) {
  const googleBooksUrl = `https://books.google.com/books?q=${encodeURIComponent(`${resource.title} ${resource.author || ''}`.trim())}`;
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-medium text-text">{resource.title}</div>
        <span className="text-[10px] px-2 py-1 rounded border whitespace-nowrap shrink-0 text-purple-400 bg-purple-500/10 border-purple-500/20">
          📚 Textbook
        </span>
      </div>
      <div className="text-xs text-text3 mb-1">{resource.author} — {resource.edition}</div>
      <div className="text-xs text-text3 mb-1">{resource.publisher}</div>
      {resource.description && (
        <div className="text-xs text-text2 mt-2 leading-relaxed">{resource.description}</div>
      )}
      <div className="flex gap-2 mt-3">
        {resource.url && (
          <a href={resource.url} target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors"
          >
            Open Books
          </a>
        )}
        <a
          href={googleBooksUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-text2 bg-bg-2 hover:bg-bg-3 px-3 py-1.5 rounded-lg border border-border transition-colors"
        >
          Search
        </a>
      </div>
    </div>
  );
}

function ResourceCard({ resource, meta }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-all group block"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-medium text-text group-hover:text-primary transition-colors">{resource.title}</div>
        <span className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap shrink-0 ${meta.color}`}>
          {meta.icon} {meta.label}
        </span>
      </div>
      <div className="text-[11px] text-text3">{resource.subject}</div>
    </a>
  );
}

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
        <p className="text-sm text-text3 mt-0.5">Curated YouTube playlists, NPTEL courses, textbooks & practice links</p>
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
          if (r.type === 'textbook') {
            return <TextbookCard key={r.id} resource={r} />;
          }
          return <ResourceCard key={r.id} resource={r} meta={meta} />;
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-text3 text-sm">No resources match this filter</div>
        )}
      </div>
    </div>
  );
}
