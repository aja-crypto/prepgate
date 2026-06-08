// Topic weightage, marks distribution, and frequent topics analysis
export default function TopicAnalysisPanel({ analyses = {} }) {
  const weightage = analyses.weightage?.data || [];
  const marksDist = analyses.marks_distribution?.data || [];
  const frequent = analyses.frequent_topics?.data || [];
  const repeated = analyses.repeated_questions?.data || [];
  const important = analyses.important_topics?.data || [];

  const maxMarks = Math.max(...marksDist.map((m) => m.marks || 0), 1);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-sm font-semibold text-text mb-1">📊 GATE Analysis (2010–2024)</div>
      <div className="text-[11px] text-text3 mb-4">Topic weightage · Marks distribution · Repeated questions</div>

      {/* Marks distribution */}
      {marksDist.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-text2 mb-2">Subject-wise Marks Distribution</div>
          <div className="space-y-1.5">
            {marksDist.map((m) => (
              <div key={m.subject} className="flex items-center gap-2">
                <span className="text-[10px] text-text3 w-36 truncate">{m.subject}</span>
                <div className="flex-1 h-2 bg-bg-2 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${(m.marks / maxMarks) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-text2 w-12 text-right">{m.marks}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top weightage topics */}
      {weightage.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-text2 mb-2">High Weightage Topics</div>
          <div className="flex flex-wrap gap-1.5">
            {weightage.slice(0, 2).flatMap((s) =>
              (s.data || []).slice(0, 3).map((t) => (
                <span key={`${s.subject}-${t.topic}`} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                  {t.topic} ({t.weight}%)
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Frequent & repeated */}
      <div className="grid md:grid-cols-2 gap-3">
        {frequent.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-text2 mb-2">Most Asked Topics</div>
            <div className="space-y-1">
              {frequent.slice(0, 5).map((t) => (
                <div key={t.topic} className="flex justify-between text-[11px] bg-bg-2 rounded px-2 py-1">
                  <span className="text-text2 truncate">{t.topic}</span>
                  <span className="text-text3 font-mono shrink-0 ml-2">{t.frequency}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {repeated.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-text2 mb-2">Repeated Questions</div>
            <div className="space-y-1">
              {repeated.slice(0, 5).map((t) => (
                <div key={t.topic} className="flex justify-between text-[11px] bg-bg-2 rounded px-2 py-1">
                  <span className="text-text2 truncate">{t.topic}</span>
                  <span className="text-orange-400 font-mono shrink-0 ml-2">{t.timesRepeated}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Important topics trend */}
      {important.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs font-semibold text-text2 mb-2">Trending Important Topics</div>
          <div className="flex flex-wrap gap-1.5">
            {important.slice(0, 6).map((t) => (
              <span
                key={t.topic}
                className={`text-[10px] px-2 py-1 rounded-full border ${
                  t.trend === 'rising' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-bg-2 text-text3 border-border'
                }`}
              >
                {t.trend === 'rising' ? '↑' : '→'} {t.topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
