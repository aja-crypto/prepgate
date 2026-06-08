// Latest study materials and placement resources
export default function ResourcesFeed({ studyMaterials = [], placementResources = [] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-sm font-semibold text-text mb-1">📚 Latest Resources</div>
      <div className="text-[11px] text-text3 mb-4">Study materials · Placement prep</div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-text2 mb-2">Study Materials</div>
          <div className="space-y-1.5">
            {studyMaterials.slice(0, 4).map((r, i) => (
              <a key={r._id || i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-bg-2 border border-border rounded-lg p-2.5 hover:border-primary/20 transition-colors">
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded">{r.category}</span>
                <span className="text-xs text-text truncate flex-1">{r.title}</span>
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-text2 mb-2">Placement Prep</div>
          <div className="space-y-1.5">
            {placementResources.slice(0, 4).map((r, i) => (
              <a key={r._id || i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-bg-2 border border-border rounded-lg p-2.5 hover:border-primary/20 transition-colors">
                <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">{r.category}</span>
                <span className="text-xs text-text truncate flex-1">{r.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
