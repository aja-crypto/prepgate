import { useEffect } from 'react';
import { PageSkeleton } from './PageState';
import { emitConnectionEvent } from '../../utils/connectionEvents';

export default function RouteLoadingFallback() {
  useEffect(() => {
    const t = setTimeout(() => { try { emitConnectionEvent({ type: 'slow_chunk' }); } catch {} }, 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="animate-fade-in">
      <div className="h-7 w-48 bg-surface border border-border rounded-lg mb-2 animate-pulse" />
      <div className="h-4 w-64 bg-surface border border-border rounded mb-6 animate-pulse" />
      <PageSkeleton rows={4} />
    </div>
  );
}
