// Gamification: XP, levels, achievement badges
import { BADGE_DEFINITIONS } from '../../data/defaults';
import { getXpProgress } from '../../utils/gateUtils';

export default function GamificationPanel({ gamification }) {
  const xp = getXpProgress(gamification?.xp || 0);
  const earned = new Set(gamification?.badges || []);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text">Achievements</div>
          <div className="text-[10px] text-text3">XP · Levels · Badges</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold font-mono text-primary">Lv.{xp.level}</div>
          <div className="text-[10px] text-text3">{gamification?.xp ?? 0} XP</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-text3 mb-1">
          <span>Level Progress</span>
          <span>{xp.current}/{xp.max} XP</span>
        </div>
        <div className="h-2 bg-bg-2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all" style={{ width: `${xp.pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BADGE_DEFINITIONS.map((badge) => {
          const unlocked = earned.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`rounded-lg p-3 border text-center transition-all ${
                unlocked
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-bg-2 border-border opacity-50 grayscale'
              }`}
              title={badge.desc}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <div className="text-[10px] font-medium text-text leading-tight">{badge.name}</div>
              {unlocked && gamification?.badgeDates?.[badge.id] && (
                <div className="text-[9px] text-text3 mt-0.5">{gamification.badgeDates[badge.id]}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
