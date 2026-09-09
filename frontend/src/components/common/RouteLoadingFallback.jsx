export default function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] p-4 lg:p-6 flex items-start justify-center">
      <div className="w-full max-w-5xl space-y-4" role="status" aria-label="Loading page">
        <div className="h-8 w-48 rounded-lg bg-white/[0.06] animate-pulse" />
        <div className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(index => (
            <div key={index} className="h-32 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
