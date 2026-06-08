// Revision calendar with spaced repetition tracking
import { useMemo } from 'react';
import { useProgress } from '../context/ProgressContext';
import { getNextRevisionDate, getRevisionStatus } from '../utils/gateUtils';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  missed: 'bg-red-500/10 border-red-500/25 text-red-400',
  today: 'bg-orange-500/10 border-orange-500/25 text-orange-400',
  upcoming: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
  done: 'bg-green-500/10 border-green-500/25 text-green-400',
};

export default function RevisionPage() {
  const { revisionSchedule, updateRevision } = useProgress();

  const grouped = useMemo(() => {
    const missed = [], today = [], upcoming = [], done = [];
    revisionSchedule.forEach((r) => {
      const status = r.status === 'done' ? 'done' : getRevisionStatus(r.dueDate);
      const item = { ...r, status };
      if (status === 'missed') missed.push(item);
      else if (status === 'today') today.push(item);
      else if (status === 'done') done.push(item);
      else upcoming.push(item);
    });
    return { missed, today, upcoming, done };
  }, [revisionSchedule]);

  const markReviewed = (id) => {
    updateRevision((schedule) =>
      schedule.map((r) => {
        if (r.id !== id) return r;
        const today = new Date().toISOString().slice(0, 10);
        const nextInterval = Math.min(r.interval * 2, 60);
        return {
          ...r,
          lastReviewed: today,
          dueDate: getNextRevisionDate(today, nextInterval),
          interval: nextInterval,
          status: 'upcoming',
        };
      })
    );
    toast.success('Revision marked complete — next review scheduled');
  };

  const Section = ({ title, items, icon }) => (
    <div className="mb-5">
      <div className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
        <span className="text-[10px] text-text3 font-normal">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-text3 bg-bg-2 border border-border rounded-lg p-4 text-center">None</div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-text">{r.topicName}</div>
                <div className="text-[11px] text-text3">{r.subject} · Due {r.dueDate} · Every {r.interval}d</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] px-2 py-1 rounded border capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                {r.status !== 'done' && (
                  <button onClick={() => markReviewed(r.id)} className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/15">
                    ✓ Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Revision Calendar</h1>
        <p className="text-sm text-text3 mt-0.5">Spaced repetition — track missed, upcoming & completed revisions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Missed', count: grouped.missed.length, color: '#ff6b6b' },
          { label: 'Due Today', count: grouped.today.length, color: '#ff9f43' },
          { label: 'Upcoming', count: grouped.upcoming.length, color: '#4f8dff' },
          { label: 'Completed', count: grouped.done.length, color: '#06d6a0' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.count}</div>
            <div className="text-[10px] text-text3 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <Section title="Missed Revisions" items={grouped.missed} icon="⚠️" />
      <Section title="Due Today" items={grouped.today} icon="📌" />
      <Section title="Upcoming Revisions" items={grouped.upcoming} icon="📅" />
      <Section title="Recently Completed" items={grouped.done} icon="✅" />
    </div>
  );
}
