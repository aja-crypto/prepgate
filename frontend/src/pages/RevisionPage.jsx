// Revision calendar with spaced repetition tracking
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { REVISION_STEPS, getNextRevisionDate, getNextRevisionStage, getRevisionStageMeta, getRevisionStatus, computeRevisionPriority } from '../utils/gateUtils';
import toast from 'react-hot-toast';

const SUBJECT_WEIGHT = {
  'Operating Systems': 9, 'DBMS': 8, 'Computer Networks': 8.5,
  'Computer Organization': 8.5, 'Theory of Computation': 8,
  'Algorithms': 7.5, 'Programming & Data Structures': 11.5,
  'Engineering Mathematics': 12.5, 'Digital Logic': 5,
  'Compiler Design': 5, 'General Aptitude': 15,
};

const STATUS_STYLE = {
  missed: 'bg-red-500/10 border-red-500/25 text-red-400',
  today: 'bg-orange-500/10 border-orange-500/25 text-orange-400',
  upcoming: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
  done: 'bg-green-500/10 border-green-500/25 text-green-400',
};

const HowItWorks = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left mb-4 px-4 py-3 rounded-xl border border-purple-500/30 bg-purple-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-purple-400">🔄 How Revision Works</span>
          <span className="text-gray-400 text-xs">{expanded ? 'Hide' : 'Show'}</span>
        </div>
      </button>
      {expanded && (
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Complete Topic</div>
            <p className="text-gray-400">Learn and complete a topic first</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Mark Revision Done</div>
            <p className="text-gray-400">Mark topics as revised when you review them</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">System Schedules Next Revision</div>
            <p className="text-gray-400">Our smart system schedules the next review</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-purple-400 font-bold mb-2">Track Retention</div>
            <p className="text-gray-400">Monitor your long-term retention of topics</p>
          </div>
        </div>
      )}
    </div>
  );
};

const AddRevisionForm = ({ onAdd }) => {
  const [show, setShow] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [subject, setSubject] = useState('');
  const subjects = Object.keys(SUBJECT_WEIGHT);
  const handleSubmit = () => {
    if (!topicName.trim() || !subject.trim()) return;
    onAdd(topicName.trim(), subject);
    setTopicName('');
    setSubject('');
    setShow(false);
  };
  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="w-full mb-6 px-4 py-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-sm text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
        + Add Revision Manually
      </button>
    );
  }
  return (
    <div className="mb-6 bg-surface border border-primary/20 rounded-xl p-4">
      <div className="text-sm font-semibold text-text mb-3">Add Revision Entry</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Topic name (e.g., Deadlocks)"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          className="text-sm bg-bg-2 border border-border rounded-lg px-3 py-2 text-text placeholder:text-text3 focus:outline-none focus:border-primary/40"
        />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="text-sm bg-bg-2 border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-primary/40"
        >
          <option value="">Select subject</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="flex-1 text-sm bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg hover:bg-primary/15">Schedule</button>
          <button onClick={() => setShow(false)} className="text-sm bg-bg-2 border border-border text-text3 px-4 py-2 rounded-lg hover:border-white/10">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default function RevisionPage() {
  const { revisionSchedule, updateRevision } = useProgress();

  const grouped = useMemo(() => {
    const missed = [], today = [], upcoming = [], done = [];
    const todayKey = new Date().toISOString().slice(0, 10);
    revisionSchedule.forEach((r) => {
      const status = r.status === 'done' ? 'done' : getRevisionStatus(r.dueDate);
      const weight = SUBJECT_WEIGHT[r.subject] || 5;
      const priorityScore = computeRevisionPriority({ ...r, subject: r.subject }, todayKey);
      const item = { ...r, status, weight, priorityScore };
      if (status === 'missed') missed.push(item);
      else if (status === 'today') today.push(item);
      else if (status === 'done') done.push(item);
      else upcoming.push(item);
    });
    const sortByPriority = (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0);
    missed.sort(sortByPriority);
    today.sort(sortByPriority);
    upcoming.sort(sortByPriority);
    return { missed, today, upcoming, done };
  }, [revisionSchedule]);

  const markReviewed = (id) => {
    updateRevision((schedule) =>
      schedule.map((r) => {
        if (r.id !== id) return r;
        const today = new Date().toISOString().slice(0, 10);
        const currentStage = r.stage || REVISION_STEPS.find((step) => step.intervalDays === r.interval)?.stage || 1;
        const nextStage = getNextRevisionStage(currentStage);
        if (!nextStage) {
          return {
            ...r,
            stage: currentStage,
            lastReviewed: today,
            status: 'done',
          };
        }
        return {
          ...r,
          stage: nextStage.stage,
          lastReviewed: today,
          dueDate: getNextRevisionDate(today, nextStage.intervalDays),
          interval: nextStage.intervalDays,
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
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text">{r.topicName}</div>
                <div className="text-[11px] text-text3">
                  {r.subject} · {getRevisionStageMeta(r.stage || REVISION_STEPS.find((step) => step.intervalDays === r.interval)?.stage || 1).label} → {r.interval || getRevisionStageMeta(r.stage).intervalDays} Days · Due {r.dueDate}
                </div>
                {r.weight >= 8 && <span className="text-[8px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 mt-1 inline-block">HIGH WEIGHTAGE ({r.weight} marks)</span>}
                {r.priorityScore >= 40 && <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 mt-1 inline-block ml-1">🔴 HIGH PRIORITY</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] px-2 py-1 rounded border capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                <Link to="/topics" className="text-[10px] px-2 py-1.5 rounded-lg border bg-bg-2 border-border text-text3 hover:border-white/15">Study</Link>
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
      <HowItWorks />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Revision Calendar</h1>
        <p className="text-sm text-text3 mt-0.5">Spaced repetition — track missed, upcoming & completed revisions</p>
      </div>

      {(grouped.missed.length > 0 || grouped.today.length > 0) && (
        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <div className="text-sm font-bold text-text mb-2">
            {grouped.missed.length > 0 ? `⚠️ ${grouped.missed.length} Forgotten Topic${grouped.missed.length > 1 ? 's' : ''}` : '📌 Revisions Due Today'}
          </div>
          <p className="text-xs text-text3 mb-3">
            {grouped.missed.length > 0
              ? 'These topics have missed their revision window. Revise them now to avoid losing retention.'
              : `You have ${grouped.today.length} revision${grouped.today.length > 1 ? 's' : ''} due today. Keep your streak going!`}
          </p>
          <div className="flex flex-wrap gap-2">
            {[...grouped.missed.slice(0, 4), ...grouped.today.slice(0, 4)].slice(0, 5).map((r) => (
              <span key={r.id} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-text2">
                {r.topicName} <span className="text-text3">({r.subject.split(' ').pop()})</span>
              </span>
            ))}
          </div>
        </div>
      )}

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

      <AddRevisionForm onAdd={(topicName, subject) => {
        const today = new Date().toISOString().slice(0, 10);
        const firstStep = REVISION_STEPS[0];
        const newEntry = {
          id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          topicName,
          subject,
          dueDate: getNextRevisionDate(today, firstStep.intervalDays),
          status: 'upcoming',
          stage: firstStep.stage,
          interval: firstStep.intervalDays,
          lastReviewed: today,
          source: 'manual',
        };
        updateRevision((prev) => [...prev, newEntry]);
        toast.success(`📅 Revision scheduled for ${topicName}`);
      }} />

      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="text-sm font-semibold text-text mb-3">GATE Revision Ladder</div>
        <div className="grid sm:grid-cols-4 gap-2">
          {REVISION_STEPS.map((step) => (
            <div key={step.stage} className="bg-bg-2 border border-border rounded-lg p-3 text-center">
              <div className="text-xs font-bold text-primary">{step.label}</div>
              <div className="text-[10px] text-text3 mt-1">After {step.intervalDays} days</div>
            </div>
          ))}
        </div>
      </div>

      <Section title="Missed Revisions" items={grouped.missed} icon="⚠️" />
      <Section title="Due Today" items={grouped.today} icon="📌" />
      <Section title="Upcoming Revisions" items={grouped.upcoming} icon="📅" />
      <Section title="Recently Completed" items={grouped.done} icon="✅" />
    </div>
  );
}
