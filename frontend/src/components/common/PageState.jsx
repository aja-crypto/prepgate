export function PageSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 bg-surface border border-border rounded-xl" />
      ))}
    </div>
  );
}

export function InlineError({ message, onRetry }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 text-center">
      <p className="text-sm text-text2 mb-3">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn-primary text-xs px-4 py-2 rounded-lg">Retry</button>}
    </div>
  );
}

export function EmptyState({ message }) {
  return <div className="text-center py-12 text-sm text-text3">{message}</div>;
}
