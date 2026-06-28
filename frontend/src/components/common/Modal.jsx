// src/components/common/Modal.jsx
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className={`bg-surface border border-white/10 rounded-2xl p-4 md:p-6 w-full ${maxWidth} animate-fade-in max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-text">{title}</h3>
            <button onClick={onClose} className="text-text3 hover:text-text transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 min-w-[44px] min-h-[44px] md:min-w-[32px] md:min-h-[32px]">✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
