import { PageSkeleton } from './PageState';

export default function RouteLoadingFallback() {
  return (
    <div className="animate-fade-in">
      <div className="h-7 w-48 bg-surface border border-border rounded-lg mb-2 animate-pulse" />
      <div className="h-4 w-64 bg-surface border border-border rounded mb-6 animate-pulse" />
      <PageSkeleton rows={4} />
    </div>
  );
}
