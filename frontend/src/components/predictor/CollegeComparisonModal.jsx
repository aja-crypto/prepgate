import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, TrendingUp, DollarSign, Star, Award, BookOpen } from 'lucide-react';

const COLLEGE_TYPE_STYLES = {
  IIT: { color: '#A855F7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' },
  NIT: { color: '#06B6D4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)' },
  IIIT: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
  GFTI: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
};

const TIER_CONFIG = {
  1: { label: 'Tier 1', color: '#FFD700' },
  2: { label: 'Tier 2', color: '#C0C0C0' },
  3: { label: 'Tier 3', color: '#CD7F32' },
};

function formatLPA(val) {
  if (val == null) return '—';
  if (val >= 100) return `₹${(val / 100).toFixed(1)}L`;
  return `₹${val} LPA`;
}

function formatFees(val) {
  if (val == null) return '—';
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

function Stars({ rating, max = 5, size = 12 }) {
  if (rating == null) return '—';
  const filled = Math.round(rating);
  return (
    <span className="inline-flex gap-0.5" style={{ fontSize: size }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < filled ? 'text-amber-400' : 'text-slate-600'}>{i < filled ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

function isBestValue(key, college, colleges) {
  const val = college[key];
  if (val == null) return false;
  const numericKeys = ['avgPlacement', 'highestPlacement', 'medianPlacement', 'placementPercentage', 'roiScore', 'roiRating', 'academicsRating', 'placementsRating', 'researchRating', 'campusRating', 'nirfRanking'];
  const lowestKeys = ['fees', 'hostelFee', 'totalCost'];
  if (numericKeys.includes(key)) {
    return val === Math.max(...colleges.map(c => c[key]).filter(v => v != null));
  }
  if (lowestKeys.includes(key)) {
    return val === Math.min(...colleges.map(c => c[key]).filter(v => v != null));
  }
  return false;
}

function BestHighlight({ children, isBest }) {
  if (!isBest) return children;
  return (
    <span className="relative inline-block">
      <span className="absolute inset-0 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 8px rgba(34,197,94,0.15)' }} />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

function TagList({ items, variant = 'default' }) {
  if (!items || items.length === 0) return <span className="text-slate-600 text-[10px]">—</span>;
  const style = variant === 'research'
    ? { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)', color: '#A78BFA' }
    : variant === 'recruiter'
    ? { bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.15)', color: '#67E8F9' }
    : { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', color: '#94A3B8' };
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color }}>
          {item}
        </span>
      ))}
    </div>
  );
}

function ValueCell({ children, isBest, className = '' }) {
  return (
    <div className={`px-3 py-2 ${className}`}>
      <BestHighlight isBest={isBest}>
        <span className="text-[12px] text-white/90 font-medium">{children}</span>
      </BestHighlight>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {Icon && <Icon size={14} className="text-purple-400 shrink-0" />}
      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</span>
    </div>
  );
}

const ROW_DEFS = [
  {
    key: 'general',
    label: 'General',
    icon: Award,
    rows: [
      { label: 'Type', render: (c, _) => {
        const s = COLLEGE_TYPE_STYLES[c.collegeType] || { color: '#94A3B8' };
        return <span className="text-[11px] font-semibold" style={{ color: s.color }}>{c.collegeType || '—'}</span>;
      }, bestKey: null },
      { label: 'Tier', render: (c, _) => {
        const t = TIER_CONFIG[c.tier] || { label: '—', color: '#94A3B8' };
        return <span className="text-[11px]" style={{ color: t.color }}>{t.label}</span>;
      }, bestKey: null },
      { label: 'NIRF', render: (c, _) => c.nirfRanking != null ? <span className="text-[11px] font-mono">{c.nirfRanking}</span> : '—', bestKey: 'nirfRanking' },
      { label: 'Location', render: (c, _) => (
        <span className="flex items-center gap-1 text-[11px]">
          <MapPin size={10} className="text-slate-500 shrink-0" />
          {c.location}{c.state ? `, ${c.state}` : ''}
        </span>
      ), bestKey: null },
    ],
  },
  {
    key: 'placements',
    label: 'Placements',
    icon: TrendingUp,
    rows: [
      { label: 'Avg Package', render: (c, _) => formatLPA(c.avgPlacement), bestKey: 'avgPlacement' },
      { label: 'Highest', render: (c, _) => formatLPA(c.highestPlacement), bestKey: 'highestPlacement' },
      { label: 'Median', render: (c, _) => formatLPA(c.medianPlacement), bestKey: 'medianPlacement' },
      { label: 'Placement %', render: (c, _) => c.placementPercentage != null ? `${c.placementPercentage}%` : '—', bestKey: 'placementPercentage' },
      { label: 'Top Recruiters', render: (c, _) => <TagList items={c.topRecruiters} variant="recruiter" />, bestKey: null },
    ],
  },
  {
    key: 'fees',
    label: 'Fees & ROI',
    icon: DollarSign,
    rows: [
      { label: 'Tuition Fee', render: (c, _) => formatFees(c.fees), bestKey: 'fees' },
      { label: 'Hostel Fee', render: (c, _) => formatFees(c.hostelFee), bestKey: 'hostelFee' },
      { label: 'Total 2-Year', render: (c, _) => formatFees(c.totalCost), bestKey: 'totalCost' },
      { label: 'ROI Score', render: (c, _) => c.roiScore != null ? <span className="font-semibold">{c.roiScore}/10</span> : '—', bestKey: 'roiScore' },
    ],
  },
  {
    key: 'program',
    label: 'Program',
    icon: BookOpen,
    rows: [
      { label: 'Duration', render: (c, _) => c.duration ? `${c.duration} years` : '—', bestKey: null },
      { label: 'Intake', render: (c, _) => c.intake ?? '—', bestKey: null },
      { label: 'Accepted Papers', render: (c, _) => <TagList items={c.acceptedPapers} />, bestKey: null },
    ],
  },
  {
    key: 'research',
    label: 'Research Areas',
    icon: Star,
    rows: [
      { label: 'Areas', render: (c, _) => <TagList items={c.researchAreas} variant="research" />, bestKey: null },
    ],
  },
  {
    key: 'ratings',
    label: 'Ratings',
    icon: Star,
    rows: [
      { label: 'Academics', render: (c, _) => <Stars rating={c.academicsRating} size={13} />, bestKey: 'academicsRating' },
      { label: 'Placements', render: (c, _) => <Stars rating={c.placementsRating} size={13} />, bestKey: 'placementsRating' },
      { label: 'Research', render: (c, _) => <Stars rating={c.researchRating} size={13} />, bestKey: 'researchRating' },
      { label: 'Campus', render: (c, _) => <Stars rating={c.campusRating} size={13} />, bestKey: 'campusRating' },
      { label: 'ROI', render: (c, _) => <Stars rating={c.roiRating} size={13} />, bestKey: 'roiRating' },
    ],
  },
];

function MobileComparison({ colleges }) {
  return (
    <div className="space-y-4 md:hidden">
      {ROW_DEFS.map((section) => (
        <div key={section.key} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <SectionHeader icon={section.icon} label={section.label} />
          <div className="divide-y" style={{ borderBottom: 'none' }}>
            {section.rows.map((row) => (
              <div key={row.label} className="px-3 py-2.5">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">{row.label}</div>
                <div className="space-y-2">
                  {colleges.map((college, ci) => (
                    <div key={ci} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12 shrink-0 truncate font-mono">{college.shortName || college.name}</span>
                      <BestHighlight isBest={row.bestKey && isBestValue(row.bestKey, college, colleges)}>
                        <span className="text-[12px] text-white/90">{row.render(college, ci)}</span>
                      </BestHighlight>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DesktopComparison({ colleges }) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full min-w-[600px] border-separate" style={{ borderSpacing: '0 2px' }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[130px] w-[130px] px-3 py-3 text-left" style={{ background: 'rgba(15,23,42,0.95)' }}>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Metric</span>
            </th>
            {colleges.map((college, ci) => (
              <th key={ci} className="px-3 py-3 text-left min-w-[160px]">
                <div className="text-sm font-bold text-white">{college.shortName || college.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {college.collegeType && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ ...COLLEGE_TYPE_STYLES[college.collegeType], border: `1px solid ${(COLLEGE_TYPE_STYLES[college.collegeType] || {}).border || 'rgba(255,255,255,0.1)'}` }}>
                      {college.collegeType}
                    </span>
                  )}
                  {college.tier && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ color: (TIER_CONFIG[college.tier] || {}).color || '#94A3B8', background: `${(TIER_CONFIG[college.tier] || { color: '#94A3B8' }).color}15`, border: `1px solid ${(TIER_CONFIG[college.tier] || { color: '#94A3B8' }).color}25` }}>
                      {TIER_CONFIG[college.tier]?.label || `Tier ${college.tier}`}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROW_DEFS.map((section) => (
            <>
              <tr key={`${section.key}-header`}>
                <td colSpan={colleges.length + 1} className="px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <SectionHeader icon={section.icon} label={section.label} />
                </td>
              </tr>
              {section.rows.map((row) => (
                <tr key={`${section.key}-${row.label}`} className="group">
                  <td className="sticky left-0 z-10 px-3 py-2.5 text-[10px] text-slate-400 font-medium" style={{ background: 'rgba(15,23,42,0.95)' }}>
                    {row.label}
                  </td>
                  {colleges.map((college, ci) => (
                    <td key={ci} className="px-3 py-2.5">
                      <BestHighlight isBest={row.bestKey && isBestValue(row.bestKey, college, colleges)}>
                        <span className="text-[12px] text-white/90">{row.render(college, ci)}</span>
                      </BestHighlight>
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CollegeComparisonModal({ isOpen, onClose, colleges = [] }) {
  const validColleges = useMemo(() => colleges.filter(Boolean), [colleges]);

  return (
    <AnimatePresence>
      {isOpen && validColleges.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
          style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-6xl mx-auto my-4 md:my-8 px-3 md:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center justify-between px-4 md:px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-purple-400" />
                  <h2 className="text-lg font-bold text-white">College Comparison</h2>
                  <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-0.5 rounded-full">
                    {validColleges.length} college{validColleges.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 md:px-6 py-4">
                <MobileComparison colleges={validColleges} />
                <DesktopComparison colleges={validColleges} />
              </div>

              <div className="px-4 md:px-6 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[9px] text-slate-600 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'rgba(34,197,94,0.5)', boxShadow: '0 0 4px rgba(34,197,94,0.3)' }} />
                  Green glow = best value in category
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
