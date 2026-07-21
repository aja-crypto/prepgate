import { useState } from 'react';

const TYPE_ICONS = {
  video: '▶', playlist: '▶', pdf: '📄', note: '📝',
  quiz: '✏️', pyq: '📋', formula: '∑', short_note: '📌',
};
const TYPE_COLORS = {
  video: 'from-purple-600/40 to-purple-900/20',
  playlist: 'from-blue-600/40 to-blue-900/20',
  pdf: 'from-amber-600/40 to-amber-900/20',
  note: 'from-emerald-600/40 to-emerald-900/20',
  quiz: 'from-rose-600/40 to-rose-900/20',
  pyq: 'from-cyan-600/40 to-cyan-900/20',
  formula: 'from-violet-600/40 to-violet-900/20',
};

export default function ResourceCard({ resource, onContinue }) {
  const { type, title, subject, topic, duration, difficulty, thumbnail, progress, author, updatedAt } = resource;
  const [imgError, setImgError] = useState(false);

  const pct = progress || 0;
  const diffColor = difficulty === 'easy' ? 'text-green-400' : difficulty === 'medium' ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="group relative bg-gray-900/80 rounded-xl overflow-hidden transition-all duration-300 hover:bg-gray-900 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer" style={{ border: '1px solid rgba(139,92,246,0.1)' }}>
      <div className={`relative h-28 bg-gradient-to-br ${TYPE_COLORS[type] || 'from-gray-700/40 to-gray-900/40'} flex items-center justify-center`}>
        {thumbnail && !imgError ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="text-3xl opacity-50">{TYPE_ICONS[type] || '📁'}</span>
        )}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-medium text-gray-300 uppercase tracking-wider">{type}</div>
        {pct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)' }} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-200 leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">{title}</h3>
        {subject && <p className="text-[11px] text-gray-500 mt-1">{subject}{topic ? ` › ${topic}` : ''}</p>}
        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
          {duration && <span>{duration}</span>}
          {difficulty && <span className={diffColor}>{difficulty}</span>}
          {author && <span className="ml-auto truncate">{author}</span>}
        </div>
        {updatedAt && <p className="text-[10px] text-gray-600 mt-1">Updated {new Date(updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
        {pct > 0 && <p className="text-[10px] text-purple-400 mt-1">{pct}% complete</p>}
        <button onClick={onContinue} className="mt-2 w-full py-1.5 text-xs font-medium rounded-lg bg-purple-600/10 text-purple-300 hover:bg-purple-600/20 transition-colors">
          {pct > 0 ? 'Continue' : 'Start'}
        </button>
      </div>
    </div>
  );
}
