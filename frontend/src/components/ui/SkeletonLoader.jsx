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
      <div className={`glass-card p-5 space-y-3 ${className}`}>
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

export function SkeletonDashboard({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonWidget key={i} variant="stat" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function SkeletonSubjectGrid({ count = 11, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = '' }) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <div className="p-4 border-b border-border">
        <div className="h-4 w-32 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
      </div>
      <div className="divide-y divide-border">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 animate-shimmer" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
              <div className="h-3 w-1/2 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
            </div>
            <div className="w-16 h-6 rounded-full bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChat({ className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-[70%] ${i % 2 === 0 ? 'mr-auto' : 'ml-auto'}`}>
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 animate-shimmer mb-1" />
            <div className="h-12 rounded-2xl bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonQuiz({ className = '' }) {
  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="h-4 w-full bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer mb-4" />
      <div className="h-4 w-3/4 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer mb-6" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 animate-shimmer" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
      <SkeletonDashboard />
    </div>
  );
}

export function SkeletonSubjectPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-32 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
      <SkeletonSubjectGrid />
    </div>
  );
}

export function SkeletonTopicPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 animate-shimmer" />
        <div className="h-8 w-48 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonWidget variant="stat" />
      </div>
    </div>
  );
}

export function SkeletonMockTest() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-64 bg-gradient-to-r from-bg-3 via-bg-2 to-bg-3 rounded animate-shimmer" />
      <SkeletonTable rows={8} />
    </div>
  );
}