// Skeleton loaders for async content
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="space-y-3">
        <div className="h-4 w-3/4 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
        <div className="h-8 w-1/2 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
        <div className="h-3 w-5/6 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonWidget({ variant = 'default', className = '' }) {
  if (variant === 'stat') {
    return (
      <div className={`glass-card flex items-center gap-4 p-5 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 animate-shimmer" />
        <div className="space-y-1">
          <div className="h-6 w-16 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
          <div className="h-3 w-24 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
          <div className="h-3 w-32 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="glass-card p-5 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 animate-shimmer" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
              <div className="h-3 w-5/6 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <SkeletonCard className={className} />;
}

export function SkeletonInline({ width = 'w-20', height = 'h-4', className = '' }) {
  return (
    <div className={`${width} ${height} ${className} bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer`} />
  );
}