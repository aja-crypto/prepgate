// Mobile widget visibility customizer — bottom sheet
import { useDashboard } from '../../context/DashboardContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';

export default function MobileWidgetCustomizer({ open, onClose }) {
  const { mobileWidgets, toggleMobileWidget, resetMobileLayout, getWidgetMeta } = useDashboard();

  if (!open) return null;

  const sorted = [...mobileWidgets].sort((a, b) => a.order - b.order);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md bg-surface border-t border-border rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text">Mobile Widgets</h3>
                <p className="text-xs text-text3 mt-0.5">Show or hide widgets on mobile</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-2 text-text3" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {sorted.map((w) => {
                const meta = getWidgetMeta(w.id);
                return (
                  <label
                    key={w.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-2/50 px-4 py-3 cursor-pointer hover:bg-hover transition-colors"
                  >
                    <div>
                      <div className="text-sm text-text">{meta?.label || w.id}</div>
                      <div className="text-[10px] text-text3 capitalize">{meta?.category}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={w.visible}
                      onChange={() => toggleMobileWidget(w.id)}
                      className="w-4 h-4 accent-[var(--color-primary)] rounded"
                    />
                  </label>
                );
              })}
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <button onClick={resetMobileLayout} className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1.5">
                <RotateCcw size={14} />
                Reset
              </button>
              <button onClick={onClose} className="btn-primary flex-1 text-xs">Done</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
