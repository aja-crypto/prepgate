import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useProgress } from '../../context/ProgressContext';
import GlassCard from '../ui/GlassCard';

export default function NotesHubWidget() {
  const [resources, setResources] = useState([]);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [resourceFilter, setResourceFilter] = useState('all');
  const { notes } = useProgress();

  useEffect(() => {
    api.get('/cms/featured-resources?limit=6').then(r => {
      const data = r.data?.data || [];
      if (data.length) setResources(data);
    }).catch(e => console.warn('[NotesHubWidget] resources fetch failed', e?.message));
  }, []);

  useEffect(() => {
    api.get('/cms/featured-content').then(r => {
      const data = r.data?.data || [];
      if (data.length) setFeaturedContent(data);
    }).catch(e => console.warn('[NotesHubWidget] content fetch failed', e?.message));
  }, []);

  const safeNotes = notes || [];
  const filtered = resourceFilter === 'all' ? resources : resources.filter(r => r.resourceType === resourceFilter);

  const types = [
    { id: 'all', label: 'All' },
    { id: 'notes', label: 'Notes' },
    { id: 'formula_sheet', label: 'Formulas' },
    { id: 'short_notes', label: 'Short Notes' },
  ];

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(34,211,238,0.15))',
        }}>
          📝
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Notes Hub</h3>
          <p className="text-[10px] text-gray-400">Featured resources & content</p>
        </div>
      </div>

      {/* Resource type filter */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {types.map(t => (
          <button key={t.id} onClick={() => setResourceFilter(t.id)}
            className={`text-[10px] px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
              resourceFilter === t.id
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            style={resourceFilter === t.id ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.2)' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Featured Resources */}
      {filtered.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Featured Resources</p>
          <div className="grid grid-cols-2 gap-2">
            {filtered.slice(0, 4).map((r, i) => (
              <Link key={r._id || r.id || i} to={r.url || '/study-hub'} className="p-2.5 rounded-lg transition-all hover:-translate-y-0.5" style={{ background: 'rgba(52,211,153,0.03)', border: '1px solid rgba(52,211,153,0.08)' }}>
                <p className="text-xs font-medium text-white truncate">{r.title}</p>
                <p className="text-[9px] text-gray-400 mt-0.5 truncate">{r.description}</p>
                {r.resourceType && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded mt-1.5 inline-block" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>
                    {r.resourceType.replace('_', ' ')}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Content */}
      {featuredContent.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Featured Content</p>
          <div className="space-y-1.5">
            {featuredContent.slice(0, 4).map((fc, i) => (
              <Link key={fc._id || fc.id || i} to={fc.link || '/study-hub'} className="flex items-center gap-2.5 p-2 rounded-lg transition-all hover:bg-white/[0.02]" style={{ border: '1px solid rgba(167,139,250,0.06)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0" style={{ background: 'rgba(167,139,250,0.1)' }}>
                  📌
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{fc.title}</p>
                  <p className="text-[9px] text-gray-400 truncate">{fc.description || fc.contentType}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* User's recent notes */}
      {safeNotes.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Your Notes ({safeNotes.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {safeNotes.slice(0, 5).map((n, i) => (
              <Link key={n.id || n._id || i} to="/study-hub" className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.08)', color: '#A78BFA' }}>
                {n.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link to="/study-hub" className="text-[10px] font-medium" style={{ color: '#34D399' }}>Open Notes Hub →</Link>
        <Link to="/formulas" className="text-[10px] font-medium" style={{ color: '#22D3EE' }}>Formula Sheets →</Link>
      </div>
    </GlassCard>
  );
}
