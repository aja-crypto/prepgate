import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';

const MISSION_POOLS = {
  study: [
    { id: 'study-1', label: 'Study 1 hour', xp: 20, icon: '📚', check: (h) => h >= 1 },
    { id: 'study-2', label: 'Study 2 hours', xp: 30, icon: '📚', check: (h) => h >= 2 },
    { id: 'study-3', label: 'Study 3 hours', xp: 50, icon: '📚', check: (h) => h >= 3 },
  ],
  pyq: [
    { id: 'pyq-1', label: 'Solve 5 PYQs', xp: 15, icon: '📝', check: (c) => c >= 5 },
    { id: 'pyq-2', label: 'Solve 10 PYQs', xp: 25, icon: '📝', check: (c) => c >= 10 },
    { id: 'pyq-3', label: 'Solve 20 PYQs', xp: 40, icon: '📝', check: (c) => c >= 20 },
  ],
  mock: [
    { id: 'mock-1', label: 'Take a mock test', xp: 35, icon: '🎯', check: (c) => c >= 1 },
    { id: 'mock-2', label: 'Score >60% in mock', xp: 50, icon: '🎯', check: (c) => c >= 1 },
  ],
  revision: [
    { id: 'rev-1', label: 'Revise 1 topic', xp: 15, icon: '🔄', check: (c) => c >= 1 },
    { id: 'rev-2', label: 'Revise 3 topics', xp: 30, icon: '🔄', check: (c) => c >= 3 },
  ],
  focus: [
    { id: 'focus-1', label: 'Complete 1 focus session', xp: 20, icon: '🧘', check: (c) => c >= 1 },
    { id: 'focus-2', label: 'Complete 3 focus sessions', xp: 40, icon: '🧘', check: (c) => c >= 3 },
  ],
};

const STORAGE_KEY = 'gatenexa_daily_missions';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadMissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.date !== getTodayKey()) return null;
    return data;
  } catch {
    return null;
  }
}

function saveMissions(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, date: getTodayKey() }));
  } catch {}
}

function pickMissions(count = 3) {
  const pools = Object.values(MISSION_POOLS).flat();
  const shuffled = [...pools].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((m) => ({
    ...m,
    done: false,
  }));
}

export default function DailyMissions({ todayHours, pyqsSolved, mocksTaken, topicsRevised, focusSessions }) {
  const [missions, setMissions] = useState(() => {
    const saved = loadMissions();
    return saved?.missions || pickMissions();
  });
  const [showAll, setShowAll] = useState(false);
  const [justCompleted, setJustCompleted] = useState(null);

  useEffect(() => {
    saveMissions({ missions });
  }, [missions]);

  const toggleMission = (id) => {
    setMissions((prev) => {
      const next = prev.map((m) => {
        if (m.id === id && !m.done) {
          setJustCompleted(m);
          setTimeout(() => setJustCompleted(null), 2000);
          return { ...m, done: true };
        }
        return m;
      });
      return next;
    });
  };

  const completedCount = missions.filter((m) => m.done).length;
  const totalXp = missions.filter((m) => m.done).reduce((s, m) => s + m.xp, 0);
  const displayMissions = showAll ? missions : missions.slice(0, 3);

  return (
    <GlassCard className="p-5 relative overflow-hidden" hover>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <span>🎯</span> Daily Missions
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text3">{completedCount}/3</span>
          {totalXp > 0 && (
            <span className="text-[10px] text-primary font-semibold">+{totalXp} XP</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {displayMissions.map((mission) => (
          <motion.button
            key={mission.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => toggleMission(mission.id)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
              mission.done
                ? 'bg-success/10 border border-success/20 opacity-60'
                : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-primary/20'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
              mission.done ? 'bg-success/20' : 'bg-primary/10'
            }`}>
              {mission.done ? '✅' : mission.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium ${mission.done ? 'text-text3 line-through' : 'text-text'}`}>
                {mission.label}
              </div>
              <div className="text-[9px] text-text3">+{mission.xp} XP</div>
            </div>
            {!mission.done && (
              <div className="w-4 h-4 rounded-full border-2 border-white/[0.15] shrink-0" />
            )}
          </motion.button>
        ))}
        {!showAll && missions.length > 3 && (
          <button onClick={() => setShowAll(true)}
            className="w-full text-[10px] text-primary/60 hover:text-primary py-1 transition-colors">
            Show all ({missions.length} missions)
          </button>
        )}
      </div>

      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute bottom-2 right-3 text-[10px] text-success font-semibold"
          >
            +{justCompleted.xp} XP
          </motion.div>
        )}
      </AnimatePresence>

      {completedCount === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-center"
        >
          <span className="text-[10px] font-semibold text-amber-400">🎉 All missions complete! +{totalXp} XP earned today</span>
        </motion.div>
      )}
    </GlassCard>
  );
}
