import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, CheckCircle2, ZoomIn } from 'lucide-react';
import { MISTAKE_TYPE_MAP } from '../../data/mistakeTypes';
import { useState } from 'react';

export default function MistakeDetailModal({ entry, open, onClose, onDelete, onReview }) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!entry) return null;
  const mt = MISTAKE_TYPE_MAP[entry.mistakeType] || MISTAKE_TYPE_MAP.concept_mistake;

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(entry._id);
    setDeleting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(6,7,10,0.75)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: '#0D1017', border: '1px solid rgba(255,255,255,0.04)' }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold" style={{ color: '#fff' }}>Mistake Details</h2>
                  {entry._id?.startsWith('demo-') && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold" style={{ background: 'rgba(124,92,255,0.12)', color: '#7C5CFF' }}>Demo</span>
                  )}
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.04] transition-all" style={{ color: '#6F7685' }}><X size={16} /></button>
              </div>

              {/* Image */}
              {entry.questionImage && (
                <div className="relative group cursor-pointer" onClick={() => setShowFullscreen(true)}>
                  <div className="max-h-72 overflow-hidden" style={{ background: '#06070A' }}>
                    <img src={entry.questionImage} alt="" className="w-full h-64 object-contain" />
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                      <ZoomIn size={14} />
                    </span>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Subject + Type + Status */}
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ color: '#7C5CFF', background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.12)' }}>
                    {entry.subject}
                  </span>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ color: mt.color, background: `${mt.color}15`, border: `1px solid ${mt.color}25` }}>
                    <span>{mt.emoji}</span> {mt.label}
                  </span>
                  {entry.resolved && (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ color: '#00B894', background: 'rgba(0,184,148,0.1)', border: '1px solid rgba(0,184,148,0.2)' }}>
                      <CheckCircle2 size={12} /> Reviewed
                    </span>
                  )}
                </div>

                {/* Topic */}
                {entry.topic && (
                  <div>
                    <p className="text-[10px] font-medium" style={{ color: '#6F7685' }}>Topic</p>
                    <p className="text-sm mt-0.5 font-medium" style={{ color: '#A5ADBB' }}>{entry.topic}</p>
                  </div>
                )}

                {/* Divider */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

                {/* Mistake */}
                <div>
                  <p className="text-[10px] font-medium" style={{ color: '#6F7685' }}>What went wrong?</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{entry.learning || '—'}</p>
                </div>

                {/* Correct concept */}
                {entry.reason && (
                  <div className="rounded-xl p-3.5" style={{ background: 'rgba(0,184,148,0.04)', border: '1px solid rgba(0,184,148,0.08)' }}>
                    <p className="text-[10px] font-medium mb-1" style={{ color: '#00B894' }}>Correct Concept</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{entry.reason}</p>
                  </div>
                )}

                {/* Date */}
                <p className="text-[10px]" style={{ color: 'rgba(111,118,133,0.4)' }}>
                  {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-2">
                {!entry._id?.startsWith('demo-') && !entry.resolved && (
                  <button onClick={() => { onReview(entry._id); onClose(); }}
                    className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: 'rgba(0,184,148,0.08)', color: '#00B894', border: '1px solid rgba(0,184,148,0.12)' }}>
                    <CheckCircle2 size={13} /> Mark Reviewed
                  </button>
                )}
                {!entry._id?.startsWith('demo-') && (
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: 'rgba(255,107,107,0.08)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.12)' }}>
                    <Trash2 size={13} /> {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)', color: '#6F7685', border: '1px solid rgba(255,255,255,0.04)' }}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Fullscreen image */}
          {showFullscreen && entry.questionImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-8" style={{ background: 'rgba(0,0,0,0.92)' }}
              onClick={() => setShowFullscreen(false)}>
              <button onClick={() => setShowFullscreen(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10" style={{ color: '#fff' }}>
                <X size={20} />
              </button>
              <img src={entry.questionImage} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}