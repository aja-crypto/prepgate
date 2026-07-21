import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomSheet({ open, onClose, title, children, maxHeight = '80vh' }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full md:max-w-lg rounded-t-3xl md:rounded-3xl bg-bg-2 border border-white/10 overflow-y-auto"
            style={{ maxHeight }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-bg-2/95 backdrop-blur-md border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto md:hidden absolute left-1/2 -translate-x-1/2 top-2" />
                {title && <h3 className="text-sm font-bold text-white">{title}</h3>}
              </div>
              <button onClick={onClose} aria-label="Close"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-text3 hover:text-white hover:bg-white/[0.06] transition-all">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="p-5 safe-area-bottom">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
