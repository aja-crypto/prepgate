// Trending topics and subject study leaderboard
export default function TrendingPanel({ trending = {} }) {
  const leaderboard = trending.subject_leaderboard || [];
  const topics = trending.trending_topics || [];
  const maxHours = Math.max(...leaderboard.map((s) => s.hours || 0), 1);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-sm font-semibold text-text mb-1">🔥 Trending Among Aspirants</div>
      <div className="text-[11px] text-text3 mb-4">Live leaderboard · Hot topics this week</div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Subject leaderboard */}
        <div>
          <div className="text-xs font-semibold text-text2 mb-2">Most Studied Subjects</div>
          <div className="space-y-1.5">
            {leaderboard.slice(0, 6).map((s, i) => (
              <div key={s.subject} className="flex items-center gap-2">
                <span className="text-[10px] text-text3 w-4 font-mono">{i + 1}</span>
                <span className="text-[11px] text-text2 w-28 truncate">{s.subject}</span>
                <div className="flex-1 h-1.5 bg-bg-2 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500/60 rounded-full" style={{ width: `${(s.hours / maxHours) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-text3 w-10 text-right">{s.hours}h</span>
              </div>
            ))}
            {!leaderboard.length && <div className="text-[10px] text-text3">No study data yet</div>}
          </div>
        </div>

        {/* Trending topics */}
        <div>
          <div className="text-xs font-semibold text-text2 mb-2">Hot Topics</div>
          <div className="space-y-1.5">
            {topics.slice(0, 6).map((t, i) => (
              <div key={t.topic} className="flex items-center gap-2 bg-bg-2 rounded-lg px-2.5 py-1.5">
                <span className="text-sm">{t.trend === 'rising' ? '📈' : '📊'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-text truncate">{t.topic}</div>
                  <div className="text-[10px] text-text3">{t.subject}</div>
                </div>
                <span className="text-[10px] font-mono text-primary">{t.score}</span>
              </div>
            ))}
            {!topics.length && <div className="text-[10px] text-text3">Trending data updates every 4 hours</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
