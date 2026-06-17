import { useFocus } from '../../context/FocusContext';

export default function FocusStatsCard() {
  const { sessionsCompleted, dailyStreak, getTodayFocus } = useFocus();
  const today = getTodayFocus();
  const hours = today?.hours || 0;
  const mins = Math.round(hours * 60);

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
          <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
        </div>
        <div>
          <div className="text-xs font-semibold text-text">Focus Session</div>
          <div className="text-[10px] text-text3">Today's focus time</div>
        </div>
        {dailyStreak > 0 && (
          <div className="ml-auto text-[10px] font-medium text-orange-400 flex items-center gap-0.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
            {dailyStreak}d
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-bold text-text">{mins}</span>
        <span className="text-xs text-text3">min</span>
        <span className="text-xs text-text3 mx-1">·</span>
        <span className="text-lg font-semibold text-text">{sessionsCompleted}</span>
        <span className="text-xs text-text3">sessions</span>
      </div>

      {/* Mini bar showing 0-120+ min scale */}
      <div className="h-1.5 rounded-full bg-bg-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, (mins / 120) * 100)}%`,
            background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text3 mt-1">
        <span>0</span>
        <span>1h</span>
        <span>2h+</span>
      </div>
    </div>
  );
}
