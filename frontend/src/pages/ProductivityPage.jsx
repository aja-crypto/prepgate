import { useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { useFocus } from '../context/FocusContext';

export default function ProductivityPage() {
  const { productivity, updateProductivity } = useProgress();
  const {
    isActive, timeRemaining, mode, sessionsCompleted, dailyStreak,
    sessionDuration, DURATIONS, formatTime, startSession, selectDuration,
  } = useFocus();
  const [journalText, setJournalText] = useState('');
  const [newTask, setNewTask] = useState('');

  const addJournal = () => {
    if (!journalText.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    updateProductivity((p) => ({
      ...p,
      journal: [{ id: Date.now(), date: today, content: journalText.trim(), mood: 'good' }, ...p.journal],
    }));
    setJournalText('');
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    updateProductivity((p) => ({
      ...p,
      tasks: [...p.tasks, { id: Date.now(), text: newTask.trim(), done: false, priority: 'medium' }],
    }));
    setNewTask('');
  };

  const toggleTask = (id) => {
    updateProductivity((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  };

  const PRIORITY_COLOR = { high: 'text-red-400', medium: 'text-orange-400', low: 'text-text3' };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-text">Productivity Hub</h1>
          <p className="text-sm text-text3 mt-0.5">Focus sessions, daily journal & task checklist</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text3">
          {dailyStreak > 0 && <span className="text-orange-400 font-medium">{dailyStreak}d streak</span>}
          <span>{sessionsCompleted} sessions today</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {/* Focus Session Info */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 text-center">
          <div className="text-[10px] text-text3 uppercase tracking-wider mb-2">
            {isActive ? (mode === 'work' ? 'Focus Session' : 'Break Time') : 'Focus Timer'}
          </div>
          <div className={`font-bold font-mono text-primary mb-4 ${isActive ? 'text-5xl' : 'text-4xl'}`}>
            {isActive ? formatTime(timeRemaining) : formatTime(sessionDuration)}
          </div>
          {!isActive && (
            <>
              <div className="flex gap-2 justify-center mb-3 flex-wrap">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => selectDuration(d.value)}
                    className={`text-[10px] px-2 py-1 rounded border ${
                      sessionDuration === d.value ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-text3 hover:border-primary/30'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => startSession(sessionDuration, null)}
                className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90"
              >
                Start Focus Session
              </button>
            </>
          )}
          {isActive && (
            <div className="text-xs text-text3 mt-2">
              Session running — use the floating widget to control
            </div>
          )}
          <div className="text-[10px] text-text3 mt-3">Sessions today: {sessionsCompleted}</div>
          {dailyStreak > 0 && <div className="text-[10px] text-orange-400 mt-0.5">Focus streak: {dailyStreak} days</div>}
        </div>

        {/* Task Checklist */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-sm font-semibold text-text mb-3">Task Checklist</div>
          <div className="flex gap-2 mb-3">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a study task..."
              className="flex-1 bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/60"
            />
            <button onClick={addTask} className="bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-2 rounded-lg hover:bg-primary/15">Add</button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {productivity.tasks.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer group">
                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="accent-primary" />
                <span className={`flex-1 ${t.done ? 'line-through text-text3' : 'text-text'}`}>{t.text}</span>
                <span className={`text-[10px] capitalize ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Journal */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-sm font-semibold text-text mb-3">Daily Journal</div>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="How was your study session today? What did you learn?"
          rows={3}
          className="w-full bg-bg-2 border border-border rounded-lg px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/60 resize-none mb-3"
        />
        <button onClick={addJournal} className="text-xs bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg hover:bg-primary/15 mb-4">
          Save Entry
        </button>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {productivity.journal.map((j) => (
            <div key={j.id} className="bg-bg-2 border border-border rounded-lg p-3">
              <div className="text-[10px] text-text3 mb-1">{j.date}</div>
              <div className="text-sm text-text2 leading-relaxed">{j.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
