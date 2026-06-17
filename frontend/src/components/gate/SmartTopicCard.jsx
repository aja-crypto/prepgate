import { useNavigate } from 'react-router-dom';

const COLOR_MAP = {
  completed: 'border-l-green-500 bg-green-500/5',
  'revision-due': 'border-l-yellow-500 bg-yellow-500/5',
  'in-progress': 'border-l-blue-500 bg-blue-500/5',
  'not-started': 'border-l-red-500 bg-red-500/5',
};

const PROGRESS_COLORS = {
  completed: 'from-green-500 to-emerald-400',
  'revision-due': 'from-yellow-500 to-amber-400',
  'in-progress': 'from-blue-500 to-indigo-400',
  'not-started': 'from-red-500 to-rose-400',
};

function computeStatus(progress) {
  if (!progress) return 'not-started';
  const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
  const done = tasks.filter((t) => progress[t]).length;
  if (done === tasks.length) return 'completed';
  if (done > 0) return 'in-progress';
  return 'not-started';
}

function computeProgressPct(progress) {
  if (!progress) return 0;
  const tasks = ['lecture', 'notes', 'revision1', 'revision2', 'revision3', 'revision4', 'pyqs', 'topicTest'];
  const done = tasks.filter((t) => progress[t]).length;
  return Math.round((done / tasks.length) * 100);
}

function getDaysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

export default function SmartTopicCard({ topic, onClick }) {
  const navigate = useNavigate();
  const progress = topic.progress || {};
  const pct = computeProgressPct(progress);
  const status = computeStatus(progress);
  const isRevisionDue = status === 'completed' && topic.lastRevised && getDaysSince(topic.lastRevised) >= 7;
  const effectiveStatus = isRevisionDue ? 'revision-due' : status;
  const daysSinceRev = getDaysSince(topic.lastRevised);

  return (
    <div
      onClick={() => navigate(`/learn/topic/${topic._id || topic.id}`)}
      className={`relative bg-surface border border-border rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 border-l-4 ${COLOR_MAP[effectiveStatus]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold ${status === 'completed' ? 'text-green-400' : 'text-text'}`}>
              {topic.name}
            </h3>
            {topic.priority === 'High' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary font-bold uppercase tracking-wider">High</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-text3">
            <span>{topic.subject?.name || topic.subject}</span>
            {topic.difficulty && <span className={`capitalize ${topic.difficulty === 'easy' ? 'text-green-400' : topic.difficulty === 'hard' ? 'text-red-400' : 'text-orange-400'}`}>· {topic.difficulty}</span>}
            <span>· ~{topic.weightage || 0}% weightage</span>
            {topic.pyqFrequency && <span>· {topic.pyqFrequency}</span>}
          </div>
        </div>

        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-bg-3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none"
              strokeWidth="3" strokeLinecap="round"
              stroke="url(#grad-${topic._id || topic.id})"
              strokeDasharray={`${pct} ${100 - pct}`}
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id={`grad-${topic._id || topic.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className="stop1" />
                <stop offset="100%" className="stop2" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold font-mono text-text">
            {pct}%
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1">
        {[
          { key: 'lecture', label: '🎥' },
          { key: 'notes', label: '📝' },
          { key: 'pyqs', label: '📚' },
          { key: 'topicTest', label: '🧪' },
        ].map(({ key, label }) => (
          <div
            key={key}
            className={`text-center text-xs py-1 rounded ${progress[key] ? 'bg-green-500/15 text-green-400' : 'bg-bg-2 text-text3 opacity-50'}`}
            title={key}
          >
            {progress[key] ? `${label} ✓` : label}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((n) => {
            const done = progress[`revision${n}`];
            return (
              <span
                key={n}
                className={`text-[9px] px-1.5 py-0.5 rounded ${done ? 'bg-green-500/15 text-green-400' : 'bg-bg-2 text-text3'}`}
                title={`Revision ${n}`}
              >
                R{n}
              </span>
            );
          })}
        </div>
        {effectiveStatus === 'revision-due' && (
          <span className="text-[9px] text-yellow-400 font-semibold animate-pulse">
            ↻ {daysSinceRev}d since revision
          </span>
        )}
      </div>

      {effectiveStatus === 'revision-due' && (
        <div className="mt-2 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-[9px] text-yellow-400 text-center">Revision overdue — review now</p>
        </div>
      )}

      <style>{`
        .stop1 { stop-color: var(--color-primary); }
        .stop2 { stop-color: var(--color-secondary); }
      `}</style>
    </div>
  );
}
