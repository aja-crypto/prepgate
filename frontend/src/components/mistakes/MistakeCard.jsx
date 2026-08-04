import { motion } from 'framer-motion';
import { Eye, Trash2, CheckCircle2, BookOpen } from 'lucide-react';
import { MISTAKE_TYPE_MAP } from '../../data/mistakeTypes';

const SUBJECT_GRADIENTS = {
  'Operating Systems': ['#1a1a2e', '#16213e', '#0f3460'],
  'DBMS': ['#2d1b3e', '#1a1a2e', '#3d1b4e'],
  'Computer Networks': ['#1a2e2e', '#1b3e3e', '#0f3434'],
  'Algorithms': ['#2e1a1a', '#3e1b1b', '#4e1c1c'],
  'Data Structures': ['#1e2e1a', '#2e3e1b', '#3e4e1c'],
  'Theory of Computation': ['#2e1a2e', '#3e1b3e', '#4e1c4e'],
  'Compiler Design': ['#1a2e1e', '#1b3e2d', '#0f3420'],
  'Digital Logic': ['#2e2e1a', '#3e3e1b', '#4e4e1c'],
  'Computer Organization': ['#1a1a2e', '#1e1e3e', '#12124e'],
  'Engineering Mathematics': ['#1e2e2e', '#1b3e3e', '#123434'],
  'General Aptitude': ['#2e1e1e', '#3e1e1e', '#4e1e1e'],
};

function getSubjectGradient(subject) {
  const g = SUBJECT_GRADIENTS[subject];
  if (g) return `linear-gradient(135deg, ${g[0]}, ${g[1]}, ${g[2]})`;
  return 'linear-gradient(135deg, #1a1a2e, #16213e)';
}

export default function MistakeCard({ entry, onView, onDelete, onReview, index = 0 }) {
  const mt = MISTAKE_TYPE_MAP[entry.mistakeType] || MISTAKE_TYPE_MAP.concept_mistake;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={() => onView(entry)}
      className="group cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 flex flex-col h-full"
      style={{
        background: 'rgba(18,22,33,0.7)',
        border: '1px solid rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      }}
    >
      {/* Image / Gradient area — 60% of card */}
      <div className="relative flex-shrink-0" style={{ minHeight: '200px', paddingBottom: '60%' }}>
        {entry.questionImage ? (
          <img src={entry.questionImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: getSubjectGradient(entry.subject) }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <BookOpen size={24} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <p className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{entry.subject}</p>
            {entry.topic && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{entry.topic}</p>}
          </div>
        )}
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
          {entry._id?.startsWith('demo-') && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider" style={{ background: 'rgba(124,92,255,0.25)', color: '#7C5CFF', backdropFilter: 'blur(6px)' }}>
              Demo
            </span>
          )}
          {entry.resolved && (
            <span className="ml-auto px-2 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1" style={{ background: 'rgba(0,184,148,0.25)', color: '#00B894', backdropFilter: 'blur(6px)' }}>
              <CheckCircle2 size={10} /> Reviewed
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        {/* Subject + Type badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ color: '#7C5CFF', background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.12)' }}>
            {entry.subject}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 flex-shrink-0" style={{ color: mt.color, background: `${mt.color}15`, border: `1px solid ${mt.color}25` }}>
            <span>{mt.emoji}</span> {mt.label}
          </span>
        </div>

        {/* Topic */}
        {entry.topic && (
          <p className="text-[11px] font-medium" style={{ color: '#A5ADBB' }}>{entry.topic}</p>
        )}

        {/* Mistake preview */}
        <p className="text-xs leading-relaxed line-clamp-2 flex-1" style={{ color: 'rgba(165,173,187,0.7)' }}>
          {entry.learning || 'No description'}
        </p>

        {/* Bottom: Date + Actions */}
        <div className="flex items-center justify-between pt-1 mt-auto flex-shrink-0">
          <span className="text-[10px]" style={{ color: 'rgba(111,118,133,0.5)' }}>
            {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button onClick={(e) => { e.stopPropagation(); onView(entry); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]" style={{ color: '#6F7685' }}>
              <Eye size={12} />
            </button>
            {!entry.resolved && (
              <button onClick={(e) => { e.stopPropagation(); onReview(entry._id); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]" style={{ color: '#00B894' }}>
                <CheckCircle2 size={12} />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete(entry._id); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]" style={{ color: '#FF6B6B' }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}