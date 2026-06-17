import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { getRevisionStatus } from '../../utils/gateUtils';

const STATUS_STYLE = {
  missed: 'bg-red-500/10 border-red-500/20 text-red-400',
  today: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  upcoming: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  done: 'bg-green-500/10 border-green-500/20 text-green-400',
};

const STATUS_LABEL = {
  missed: 'Overdue',
  today: 'Due Today',
  upcoming: 'Scheduled',
  done: 'Completed',
};

export default function RevisionScheduler({ limit = 20 }) {
  const navigate = useNavigate();
  const { revisionSchedule: schedule, updateRevision } = useProgress();
  const [view, setView] = useState('all');

  const items = useMemo(() => {
    const entries = (schedule || []).map((item) => ({
      ...item,
      status: item.status === 'done' ? 'done' : getRevisionStatus(item.dueDate),
    }));
    entries.sort((a, b) => {
      const order = { missed: 0, today: 1, upcoming: 2, done: 3 };
      return order[a.status] - order[b.status];
    });
    return entries;
  }, [schedule]);

  const filtered = view === 'all' ? items : items.filter((i) => i.status === view);

  const counts = useMemo(() => {
    const c = { missed: 0, today: 0, upcoming: 0, done: 0 };
    items.forEach((i) => { c[i.status]++; });
    return c;
  }, [items]);

  if (!items.length) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 text-center">
        <p className="text-sm text-text3">No revision schedule yet.</p>
        <p className="text-xs text-text3 mt-1">Complete a topic to schedule revisions automatically.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold text-text">Revision Schedule</div>
          <div className="text-[10px] text-text3 mt-0.5">Spaced repetition · {items.length} scheduled</div>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap mb-4">
        {[
          { key: 'all', label: 'All', count: items.length },
          { key: 'missed', label: 'Overdue', count: counts.missed },
          { key: 'today', label: 'Today', count: counts.today },
          { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
          { key: 'done', label: 'Done', count: counts.done },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${view === key ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filtered.slice(0, limit).map((item) => (
          <div
            key={item.id || `${item.topicName}-${item.dueDate}`}
            onClick={() => item.topicId && navigate(`/learn/topic/${item.topicId}`)}
            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all hover:opacity-90 ${STATUS_STYLE[item.status] || 'bg-bg-2 border-border text-text3'}`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{item.topicName}</div>
              <div className="text-[9px] opacity-70 mt-0.5">
                {item.subject} · Revision {item.stage || '?'}
                {item.dueDate && ` · Due: ${new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
              </div>
            </div>
            <span className="text-[9px] font-semibold uppercase shrink-0 ml-2">{STATUS_LABEL[item.status] || item.status}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-6 text-xs text-text3">No items in this filter</div>
        )}
      </div>

      {filtered.length > limit && (
        <p className="text-[10px] text-text3 text-center mt-3">+{filtered.length - limit} more</p>
      )}
    </div>
  );
}
