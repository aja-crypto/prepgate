// Reusable mobile UI components
import { useRef, useState, useCallback } from 'react';

/**
 * MobileScrollableTabs - Horizontally scrollable tab/filter row
 * - Never increases document width
 * - Allows horizontal swipe
 * - Hides scrollbar
 * - Maintains touch targets
 */
export function MobileScrollableTabs({ children, className = '', gap = 'gap-2' }) {
  const ref = useRef(null);
  
  return (
    <div 
      ref={ref}
      className={`flex ${gap} overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-hide ${className}`}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {children}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/**
 * MobileFilterChip - Individual filter button for use in MobileScrollableTabs
 */
export function MobileFilterChip({ active, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 snap-start px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all min-h-[36px] ${
        active 
          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
          : 'text-slate-500 border border-white/5 hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * MobileBottomSheet - Proper bottom sheet with backdrop
 */
export function MobileBottomSheet({ open, onClose, children, title }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[10001] md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0c0c1d] border-t border-white/10 rounded-t-2xl max-h-[85vh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-[#0c0c1d]">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>
        
        {title && (
          <div className="px-5 pb-3 sticky top-4 bg-[#0c0c1d]">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
}

/**
 * MobileActionRow - Consistent action row for settings/menus
 */
export function MobileActionRow({ icon, label, onClick, rightElement, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors duration-150 min-h-[48px] ${className}`}
    >
      <span className="w-5 text-center text-base">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {rightElement}
    </button>
  );
}
