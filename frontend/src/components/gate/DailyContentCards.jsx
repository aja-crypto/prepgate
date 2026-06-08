// Daily theory, question, formula, and PYQ cards
const TYPE_CONFIG = {
  theory: { icon: '📖', label: 'Theory of the Day', color: '#4f8dff' },
  question: { icon: '❓', label: 'Question of the Day', color: '#ff9f43' },
  formula: { icon: '📐', label: 'Formula of the Day', color: '#06d6a0' },
  pyq: { icon: '📝', label: 'PYQ of the Day', color: '#a855f7' },
};

export default function DailyContentCards({ dailyContent = [] }) {
  const ordered = ['theory', 'question', 'formula', 'pyq']
    .map((type) => dailyContent.find((d) => d.type === type))
    .filter(Boolean);

  if (!ordered.length) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-sm font-semibold text-text mb-2">☀️ Daily Content</div>
        <p className="text-xs text-text3">Daily content generates at midnight. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-sm font-semibold text-text mb-1">☀️ Daily GATE Content</div>
      <div className="text-[11px] text-text3 mb-4">Refreshes every day · Based on syllabus & PYQ trends</div>
      <div className="grid md:grid-cols-2 gap-3">
        {ordered.map((item) => {
          const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.theory;
          return (
            <div key={item.type} className="bg-bg-2 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{cfg.icon}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
              <div className="text-sm font-medium text-text">{item.title}</div>
              <div className="text-[10px] text-text3 mt-0.5">{item.subject} · {item.topic}</div>
              <div className="text-xs text-text2 mt-2 leading-relaxed">{item.content}</div>
              {item.explanation && (
                <div className="text-[11px] text-green-400/80 mt-2 border-t border-border pt-2">{item.explanation}</div>
              )}
              {item.metadata?.year && (
                <div className="text-[10px] text-text3 mt-1">GATE {item.metadata.year} · {item.metadata.difficulty}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
