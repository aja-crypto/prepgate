import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TYPE_META = {
  youtube: { icon: '\u25B6\uFE0F', label: 'YouTube', color: 'text-red-400' },
  nptel: { icon: '\uD83C\uDF93', label: 'NPTEL', color: 'text-blue-400' },
  notes: { icon: '\uD83D\uDCC4', label: 'Notes PDF', color: 'text-green-400' },
  textbook: { icon: '\uD83D\uDCDA', label: 'Textbook', color: 'text-purple-400' },
  gateoverflow: { icon: '\uD83D\uDCAC', label: 'GateOverflow', color: 'text-orange-400' },
  practice: { icon: '\uD83D\uDCDD', label: 'Practice', color: 'text-cyan-400' },
};

function ResourceCard({ resource, meta }) {
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer"
      className="block rounded-2xl p-4 transition-all hover:-translate-y-0.5 group"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.08)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">{resource.title || resource.name}</div>
        <span className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap shrink-0 ${meta?.color || 'text-slate-400'}`}
          style={{ background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.2)' }}>
          {meta?.icon || '\uD83D\uDD17'} {meta?.label || 'Resource'}
        </span>
      </div>
      <div className="text-xs text-slate-500">{resource.subject}</div>
    </a>
  );
}

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/cms/featured-resources?limit=50')
      .then(r => r.json())
      .then(d => { setResources(d.data || []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  const subjects = ['All', ...new Set(resources.map(r => r.subject))];
  const types = ['All', ...new Set(resources.map(r => r.type || r.resourceType))];

  const filtered = resources.filter(
    r => (filter === 'All' || r.subject === filter) &&
         (typeFilter === 'All' || (r.type || r.resourceType) === typeFilter)
  );

  const displayResources = showAll ? filtered : filtered.slice(0, 12);
  const hiddenCount = Math.max(0, filtered.length - displayResources.length);

  return (
    <div className="min-h-screen" style={{ background: '#070B1A' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link to="/" className="text-xs text-purple-400 hover:text-purple-300 mb-6 inline-block transition-colors">{'\u2190'} Back to Home</Link>
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Study Resources</h1>
          <p className="text-sm text-slate-400">Curated YouTube playlists, NPTEL courses, textbooks & practice links</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading resources...</div>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap mb-2">
              {subjects.map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-all"
                  style={filter === s
                    ? { background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#C4B5FD' }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                  {s === 'All' ? 'All Subjects' : s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {types.map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className="text-xs px-3 py-1.5 rounded-lg border capitalize transition-all"
                  style={typeFilter === t
                    ? { background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#C4B5FD' }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                  {t === 'All' ? 'All Types' : TYPE_META[t]?.label || t}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {displayResources.map(r => (
                <ResourceCard key={r._id || r.id} resource={r} meta={TYPE_META[r.type || r.resourceType]} />
              ))}
              {displayResources.length === 0 && (
                <div className="col-span-2 text-center py-16 text-slate-400 text-sm">No resources match this filter</div>
              )}
            </div>
            {hiddenCount > 0 && !showAll && (
              <div className="text-center mt-4">
                <button onClick={() => setShowAll(true)}
                  className="text-xs px-5 py-2 rounded-lg font-medium transition-all"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                  View More Resources ({hiddenCount} hidden)
                </button>
              </div>
            )}
            {showAll && hiddenCount > 0 && (
              <div className="text-center mt-4">
                <button onClick={() => setShowAll(false)}
                  className="text-xs px-5 py-2 rounded-lg font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                  Show Less
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
