// Mobile dashboard toolbar — Refresh, Customize, Widgets, Planner
import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Settings, LayoutGrid, CalendarDays } from 'lucide-react';

const MobileToolbar = memo(function MobileToolbar({ onRefresh, refreshing, onCustomize, onWidgets }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[11px] font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.6)',
        }}
        aria-label="Refresh dashboard"
      >
        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        <span>Refresh</span>
      </button>
      <button
        onClick={onCustomize}
        className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[11px] font-semibold transition-all active:scale-[0.97]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.6)',
        }}
        aria-label="Customize dashboard"
      >
        <Settings size={13} />
        <span>Customize</span>
      </button>
      <button
        onClick={onWidgets}
        className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[11px] font-semibold transition-all active:scale-[0.97]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.6)',
        }}
        aria-label="Toggle widgets"
      >
        <LayoutGrid size={13} />
        <span>Widgets</span>
      </button>
      <Link
        to="/planner"
        className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[11px] font-semibold transition-all active:scale-[0.97]"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))',
          border: '1px solid rgba(139,92,246,0.2)',
          color: '#A78BFA',
        }}
        aria-label="Open planner"
      >
        <CalendarDays size={13} />
        <span>Planner</span>
      </Link>
    </div>
  );
});

export default MobileToolbar;
