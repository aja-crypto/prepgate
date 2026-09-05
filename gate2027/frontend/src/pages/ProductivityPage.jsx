// Productivity hub: Pomodoro, focus mode, journal, task checklist
import { useState, useEffect, useRef } from 'react';
import { useProgress } from '../context/ProgressContext';

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ProductivityPage() {
  const { productivity, updateProductivity } = useProgress();
  const [pomoSecs, setPomoSecs] = useState(POMODORO_WORK);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoPhase, setPomoPhase] = useState('work');
  const [journalText, setJournalText] = useState('');
  const [newTask, setNewTask] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!pomoRunning) return;
    intervalRef.current = setInterval(() => {
      setPomoSecs((s) => {
        if (s <= 1) {
          if (pomoPhase === 'work') {
            setPomoPhase('break');
            updateProductivity((p) => ({ ...p, pomodoroSessions: (p.pomodoroSessions || 0) + 1 }));
            return POMODORO_BREAK;
          }
          setPomoPhase('work');
          return POMODORO_WORK;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [pomoRunning, pomoPhase, updateProductivity]);

  const [distractionFree, setDistractionFree] = useState(false);

  const toggleFocus = () => {
    updateProductivity((p) => ({ ...p, focusModeEnabled: !p.focusModeEnabled }));
  };

  const toggleDistractionFree = () => {
    setDistractionFree((d) => !d);
    if (!distractionFree) setPomoRunning(true);
  };

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

  if (distractionFree) {
    return (
      <div className="fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center">
        <div className="text-[10px] text-text3 uppercase tracking-widest mb-4">Distraction-Free Study Mode</div>
        <div className="text-7xl font-bold font-mono text-primary mb-6">{formatTime(pomoSecs)}</div>
        <div className="text-sm text-text3 mb-8">{pomoPhase === 'work' ? 'Focus session' : 'Break time'}</div>
        <div className="flex gap-3">
          <button onClick={() => setPomoRunning(!pomoRunning)} className="bg-primary text-white px-8 py-3 rounded-lg font-semibold">{pomoRunning ? 'Pause' : 'Start'}</button>
          <button onClick={toggleDistractionFree} className="bg-bg-2 border border-border text-text2 px-6 py-3 rounded-lg">Exit</button>
        </div>
      </div>
    );
  }

  return (
    <div className={productivity.focusModeEnabled ? 'focus-mode-active' : ''}>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-text">Productivity Hub</h1>
          <p className="text-sm text-text3 mt-0.5">Pomodoro timer, focus mode, daily journal & task checklist</p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleDistractionFree} className="text-xs px-4 py-2 rounded-lg border bg-bg-2 border-border text-text3 hover:border-white/15">🧘 Distraction-Free</button>
          <button
            onClick={toggleFocus}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${
              productivity.focusModeEnabled ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3 hover:border-white/15'
            }`}
          >
            {productivity.focusModeEnabled ? '🎯 Focus ON' : 'Focus Mode'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {/* Pomodoro */}
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <div className="text-[10px] text-text3 uppercase tracking-wider mb-2">
            {pomoPhase === 'work' ? '🍅 Focus Session' : '☕ Break Time'}
          </div>
          <div className="text-5xl font-bold font-mono text-primary mb-4">{formatTime(pomoSecs)}</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setPomoRunning(!pomoRunning)}
              className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90"
            >
              {pomoRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => { setPomoRunning(false); setPomoSecs(pomoPhase === 'work' ? POMODORO_WORK : POMODORO_BREAK); }}
              className="bg-bg-2 border border-border text-text2 text-sm px-4 py-2.5 rounded-lg hover:border-white/15"
            >
              Reset
            </button>
          </div>
          <div className="text-[10px] text-text3 mt-3">Sessions today: {productivity.pomodoroSessions || 0}</div>
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
