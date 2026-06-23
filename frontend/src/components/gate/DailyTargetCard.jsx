// Daily study target tracker with progress ring
import { useState } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { getDailyTargetProgress, todayKey, updateStreak } from '../../utils/gateUtils';

function ProgressRing({ pct, size = 80, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-bg-3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f8dff" />
          <stop offset="100%" stopColor="#06d6a0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DailyTargetCard({ compact = false }) {
  const { gateFeatures, updateGateFeatures } = useProgress();
  const gf = gateFeatures || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(gf.dailyTarget || { hours: 8, topicsToComplete: 5 });

  const progress = getDailyTargetProgress(gf.dailyTarget, gf.todayProgress);

  const saveTarget = () => {
    updateGateFeatures((gf) => ({ ...gf, dailyTarget: { ...form } }));
    setEditing(false);
  };

  const logHours = (delta) => {
    const key = todayKey();
    updateGateFeatures((gf) => {
      const tp = gf.todayProgress.date === key ? gf.todayProgress : { hours: 0, topicsCompleted: 0, date: key };
      const newHours = Math.max(0, tp.hours + delta);
      const streak = updateStreak(gf.streak, newHours);
      return {
        ...gf,
        todayProgress: { ...tp, hours: newHours, date: key },
        streak,
      };
    });
  };

  const logTopic = () => {
    const key = todayKey();
    updateGateFeatures((gf) => {
      const tp = gf.todayProgress.date === key ? gf.todayProgress : { hours: 0, topicsCompleted: 0, date: key };
      return {
        ...gf,
        todayProgress: { ...tp, topicsCompleted: tp.topicsCompleted + 1, date: key },
      };
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <ProgressRing pct={progress.overall} size={56} stroke={5} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono text-primary">{progress.overall}%</span>
        </div>
        <div>
          <div className="text-xs text-text2">{progress.hours}/{gf.dailyTarget?.hours || 8}h · {progress.topicsCompleted}/{gf.dailyTarget?.topicsToComplete || 5} topics</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text">🎯 Daily Target</div>
          <div className="text-[11px] text-text3 mt-0.5">Track today&apos;s study goals</div>
        </div>
        <button onClick={() => { setForm(gf.dailyTarget || { hours: 8, topicsToComplete: 5 }); setEditing(!editing); }} className="text-[11px] text-primary hover:underline">
          {editing ? 'Cancel' : 'Edit targets'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-text3 uppercase tracking-wider">Hours</label>
              <input type="number" min="1" max="16" value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: +e.target.value }))}
                className="w-full mt-1 bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/60" />
            </div>
            <div>
              <label className="text-[10px] text-text3 uppercase tracking-wider">Topics</label>
              <input type="number" min="1" max="20" value={form.topicsToComplete} onChange={(e) => setForm((f) => ({ ...f, topicsToComplete: +e.target.value }))}
                className="w-full mt-1 bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/60" />
            </div>
          </div>
          <button onClick={saveTarget} className="w-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90">Save Targets</button>
        </div>
      ) : (
        <div className="flex items-center gap-5 mb-4">
          <div className="relative flex-shrink-0">
            <ProgressRing pct={progress.overall} />
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold font-mono text-primary">{progress.overall}%</span>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-text2">Study Hours</span><span className="font-mono text-text3">{progress.hours}/{gf.dailyTarget?.hours || 8}h</span></div>
              <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress.hoursPct}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-text2">Topics Done</span><span className="font-mono text-text3">{progress.topicsCompleted}/{gf.dailyTarget?.topicsToComplete || 5}</span></div>
              <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress.topicsPct}%` }} /></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => logHours(0.5)} className="flex-1 text-xs bg-bg-2 border border-border rounded-lg py-2 text-text2 hover:border-white/15">+0.5h</button>
        <button onClick={() => logHours(1)} className="flex-1 text-xs bg-bg-2 border border-border rounded-lg py-2 text-text2 hover:border-white/15">+1h</button>
        <button onClick={logTopic} className="flex-1 text-xs bg-primary/10 border border-primary/20 rounded-lg py-2 text-primary hover:bg-primary/15">+1 Topic</button>
      </div>
    </div>
  );
}
