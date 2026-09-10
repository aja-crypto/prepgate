export default function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] p-4 lg:p-6 flex items-start justify-center">
      <div className="w-full max-w-5xl space-y-5" role="status" aria-label="Loading page">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg border-2 border-primary/30 border-t-primary animate-spin" />
          <div className="h-7 w-56 rounded-lg bg-white/[0.08] animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-9 w-24 rounded-xl bg-white/[0.06] animate-pulse" />
          ))}
        </div>
        <div className="h-12 rounded-2xl bg-white/[0.05] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(index => (
            <div key={index} className="rounded-2xl overflow-hidden bg-white/[0.04] animate-pulse">
              <div className="aspect-video bg-white/[0.06]" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-white/[0.08] rounded w-3/4" />
                <div className="h-2 bg-white/[0.05] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
