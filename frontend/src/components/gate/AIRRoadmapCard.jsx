export default function AIRRoadmapCard({ roadmap }) {
  const { rank, icon, color, description, stats } = roadmap;

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: `rgba(255,255,255,0.03)`, border: `1px solid rgba(255,255,255,0.06)` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          {icon}
        </div>
        <div>
          <span className="text-sm font-bold text-white">{rank}</span>
          <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(stats).map(([key, val]) => (
          <div key={key} className="rounded-xl p-3 text-center" style={{ background: `${color}06`, border: `1px solid ${color}12` }}>
            <div className="text-xs font-bold text-white">{val}</div>
            <div className="text-[9px] text-gray-500 uppercase mt-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
