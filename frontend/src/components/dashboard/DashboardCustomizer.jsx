// Dashboard widget visibility & layout customizer
import { useDashboard } from '../../context/DashboardContext';
import GlassCard from '../ui/GlassCard';

export default function DashboardCustomizer({ open, onClose }) {
  const { widgets, toggleWidget, resetLayout, getWidgetMeta } = useDashboard();

  if (!open) return null;

  const sorted = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative w-full max-w-md animate-slide-up max-h-[80vh] overflow-hidden flex flex-col" padding="p-0" hover={false}>
        <div className="p-5 border-b border-border">
          <h3 className="text-base font-semibold text-text">Customize Dashboard</h3>
          <p className="text-xs text-text3 mt-0.5">Toggle widgets and drag sections to rearrange</p>
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
                  onChange={() => toggleWidget(w.id)}
                  className="w-4 h-4 accent-[var(--color-primary)] rounded"
                />
              </label>
            );
          })}
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <button onClick={resetLayout} className="btn-ghost flex-1 text-xs">Reset layout</button>
          <button onClick={onClose} className="btn-primary flex-1 text-xs">Done</button>
        </div>
      </GlassCard>
    </div>
  );
}
