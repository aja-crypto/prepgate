import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingUp, DollarSign, Star, ExternalLink, ChevronDown, ChevronUp, Award, GraduationCap, ArrowUp, Target } from 'lucide-react';

const CHANCE_BANDS = [
  { max: 100, min: 90, label: 'Very Safe', color: '#16A34A', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.3)', icon: '🟢' },
  { max: 89, min: 70, label: 'Likely', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', icon: '🔵' },
  { max: 69, min: 40, label: 'Competitive', color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)', icon: '🟡' },
  { max: 39, min: 15, label: 'Ambitious', color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', icon: '🟠' },
  { max: 14, min: 0, label: 'Dream', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: '🔴' },
];

const COLLEGE_TYPE_STYLES = {
  IIT: { color: '#A855F7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' },
  NIT: { color: '#06B6D4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)' },
  IIIT: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
  GFTI: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
};

const TIER_CONFIG = {
  1: { label: 'Tier 1', icon: '🏆', color: '#FFD700' },
  2: { label: 'Tier 2', icon: '🥈', color: '#C0C0C0' },
  3: { label: 'Tier 3', icon: '🥉', color: '#CD7F32' },
};

// 5-tier path colors (Priority 8)
const PATH_COLORS = {
  'Very High Chance': { color: '#16A34A', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.3)' },
  'High Chance': { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  'Good Chance': { color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)' },
  'Competitive': { color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
  'Dream': { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
};

function getChanceConfig(probability) {
  return CHANCE_BANDS.find(b => probability >= b.min && probability <= b.max) || CHANCE_BANDS[4];
}

function Stars({ rating, max = 5, size = 12 }) {
  if (rating == null) return null;
  const filled = Math.round(rating);
  return (
    <span className="inline-flex gap-0.5" style={{ fontSize: size }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < filled ? 'text-amber-400' : 'text-slate-600'}>{i < filled ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

function TrendIndicator({ trend }) {
  if (!trend) return null;
  const isUp = trend.direction === 'Rising';
  const isDown = trend.direction === 'Falling';
  const color = isUp ? '#F97316' : isDown ? '#22C55E' : '#94A3B8';
  const label = isUp ? '↑ Rising' : isDown ? '↓ Falling' : '→ Stable';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono" style={{ color }}>
      <TrendingUp size={10} className={isDown ? 'rotate-180' : ''} />
      {label} · Avg: {trend.avgClosing}
    </span>
  );
}

function formatLPA(val) {
  if (val == null) return '—';
  if (val >= 100) return `₹${(val / 100).toFixed(1)} Cr`;
  return `₹${val} LPA`;
}

function formatFees(val) {
  if (val == null) return '—';
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

export default function EnhancedCollegeCard({ opportunity: opp, onCompare, inCompareList }) {
  const [expanded, setExpanded] = useState(false);
  const [showFullCurriculum, setShowFullCurriculum] = useState(false);
  const [showMatchBreakdown, setShowMatchBreakdown] = useState(false);

  const chanceCfg = getChanceConfig(opp.probability);
  const typeStyle = COLLEGE_TYPE_STYLES[opp.collegeType] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
  const tierCfg = TIER_CONFIG[opp.tier] || { label: 'Emerging', icon: '⭐', color: '#94A3B8' };
  const borderColor = chanceCfg.border;

  // Calculate derived values
  const calcROI = opp.roiScore ?? (opp.avgPlacement && opp.fees ? Math.min(10, Math.round((opp.avgPlacement * 100000) / (opp.fees || 1) * 2)) : null);
  const calcTotalCost = opp.totalCost ?? (opp.fees ? (opp.hostelFee ? opp.fees + opp.hostelFee : opp.fees * 2) : null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 hover:border-white/15 transition-all"
      style={{ background: 'rgba(18,24,40,0.5)', border: `1px solid ${expanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white leading-tight" title={opp.college}>{opp.college}</h3>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ color: typeStyle.color, background: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}>
              {opp.collegeType}
            </span>
            {opp.tier && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-0.5" style={{ color: tierCfg.color, background: `${tierCfg.color}15`, border: `1px solid ${tierCfg.color}25` }}>
              {tierCfg.icon} {tierCfg.label}
            </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-slate-400 truncate">{opp.program}{opp.specialization ? ` - ${opp.specialization}` : ''}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin size={10} />
              {opp.location}{opp.state ? `, ${opp.state}` : ''}
            </span>
            {opp.closingScore != null && (
              <span className="font-mono">Closing: {opp.closingScore}</span>
            )}
            {opp.openingScore != null && (
              <span className="font-mono">Opening: {opp.openingScore}</span>
            )}
            {opp.year && <span className="text-slate-600">{opp.year} R-{opp.round || '1'}</span>}
          </div>
        </div>
        <div className="shrink-0 ml-2 min-w-[100px]">
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowMatchBreakdown(!showMatchBreakdown)}
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: chanceCfg.color, background: chanceCfg.bg, border: `1px solid ${chanceCfg.border}` }}
            >
              {chanceCfg.icon} {chanceCfg.label} {opp.probability}%
            </button>
            <div className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, opp.probability)}%`, background: chanceCfg.color }} />
            </div>
          </div>
        </div>
      </div>

      {/* Match Score Breakdown */}
      <AnimatePresence>
        {showMatchBreakdown && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mb-3 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <div className="col-span-2 text-[10px] text-purple-400 font-semibold mb-1">Match Score Breakdown</div>
              <div><span className="text-slate-500">Your Score:</span> <span className="text-white font-mono">{opp.predictedScore || opp.gateScore || '—'}</span></div>
              <div><span className="text-slate-500">Closing Score:</span> <span className="text-white font-mono">{opp.closingScore || '—'}</span></div>
              <div><span className="text-slate-500">Opening Score:</span> <span className="text-white font-mono">{opp.openingScore || '—'}</span></div>
              <div><span className="text-slate-500">Difference:</span> <span className={`font-mono ${opp.closingScore && (opp.predictedScore ?? 0) >= opp.closingScore ? 'text-green-400' : 'text-orange-400'}`}>
                {opp.closingScore ? (opp.predictedScore ?? opp.gateScore ?? 0) >= opp.closingScore ? `+${(opp.predictedScore ?? 0) - opp.closingScore}` : `${(opp.predictedScore ?? 0) - opp.closingScore}` : '—'}
              </span></div>
              <div><span className="text-slate-500">Category:</span> <span className="text-slate-300">{opp.category || 'General'}</span></div>
              <div><span className="text-slate-500">Confidence:</span> <span className="font-medium" style={{ color: opp.probability >= 80 ? '#22C55E' : opp.probability >= 60 ? '#EAB308' : '#F97316' }}>
                {opp.probability >= 80 ? 'High' : opp.probability >= 60 ? 'Medium' : 'Moderate'}
              </span></div>
              <div className="col-span-2 mt-1 pt-1.5 border-t border-white/5 text-[9px] text-slate-500 flex flex-wrap gap-x-4 gap-y-0.5">
                <span>✓ Historical Cutoffs</span>
                <span>✓ Seat Trends</span>
                <span>✓ Score Margin</span>
                <span>✓ Past Admissions</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Why This College? — always visible */}
      {opp.whyExplanation?.whyMatched && (
        <div className="mb-2 text-[10px] text-slate-400 leading-relaxed italic">
          "{opp.whyExplanation.whyMatched}"
        </div>
      )}
      
      {/* Trust badges */}
      <div className="flex items-center gap-2 mb-2 text-[8px] text-slate-600">
        <span className="px-1.5 py-0.5 rounded bg-green-500/8 text-green-400/70 border border-green-500/10">Verified Data</span>
        <span className="px-1.5 py-0.5 rounded bg-cyan-500/8 text-cyan-400/70 border border-cyan-500/10">CCMT/COAP</span>
        {opp.whyExplanation?.trendDirection && (
          <span className="px-1.5 py-0.5 rounded" style={{ background: opp.whyExplanation.trendDirection === 'Falling' ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.08)', color: opp.whyExplanation.trendDirection === 'Falling' ? '#22C55E' : '#F97316', border: '1px solid ' + (opp.whyExplanation.trendDirection === 'Falling' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)') }}>
            Trend: {opp.whyExplanation.trendDirection}
          </span>
        )}
      </div>

      {/* Match Score & Stats — responsive wrap */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px]">
        <span className={`px-2 py-0.5 rounded font-mono font-semibold whitespace-nowrap ${(opp.matchScore || opp.probability) >= 80 ? 'text-green-400 bg-green-500/10' : (opp.matchScore || opp.probability) >= 60 ? 'text-yellow-400 bg-yellow-500/10' : (opp.matchScore || opp.probability) >= 40 ? 'text-orange-400 bg-orange-500/10' : 'text-red-400 bg-red-500/10'}`}>
          Match: {opp.matchScore || opp.probability}/100
        </span>
        {opp.whyExplanation?.latestCutoff?.closingScore && (
          <span className="text-slate-500 whitespace-nowrap">
            Closing: <span className="text-white font-mono">{opp.whyExplanation.latestCutoff.closingScore}</span>
          </span>
        )}
        {opp.avgPlacement && <span className="text-slate-500 whitespace-nowrap">Avg: <span className="text-white font-mono">₹{opp.avgPlacement}L</span></span>}
        {opp.fees && <span className="text-slate-500 whitespace-nowrap">Fees: <span className="text-white font-mono">₹{(opp.fees/100000).toFixed(1)}L</span></span>}
        {opp.roiScore && <span className="text-slate-500 whitespace-nowrap">ROI: <span className="text-white font-mono">{opp.roiScore}/10</span></span>}
      </div>

      <div className="grid grid-cols-12 gap-3 mb-3">
      {((opp.previousClosingScores || []).length > 0 || opp.trend) && (
        <div className="col-span-12 sm:col-span-5">
          <div className="text-[9px] text-slate-500 uppercase mb-1 font-semibold">Cutoff Trend</div>
          <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-slate-500">Year</span>
              <span className="text-[9px] text-slate-500">Score</span>
            </div>
            {(opp.previousClosingScores || []).length > 0 ? (
              <div className="space-y-0.5">
                {opp.previousClosingScores.slice(-5).reverse().map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">{s.year}</span>
                    <span className="text-white/80 font-semibold">{s.closingScore}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {opp.trend && (
              <div className="mt-1.5 pt-1.5 border-t border-white/5">
                <TrendIndicator trend={opp.trend} />
              </div>
            )}
          </div>
        </div>
      )}
        <div className="col-span-12 sm:col-span-4">
          <div className="text-[9px] text-slate-500 uppercase mb-1 font-semibold">Placements</div>
          <div className="rounded-lg p-2 space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            {[
              { label: 'Average', value: formatLPA(opp.avgPlacement) },
              { label: 'Highest', value: formatLPA(opp.highestPlacement) },
              { label: 'Placed', value: opp.placementPercentage != null ? `${opp.placementPercentage}%` : '—' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">{item.label}</span>
                <span className="text-[11px] font-mono font-semibold text-white/80">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 sm:col-span-3">
          <div className="text-[9px] text-slate-500 uppercase mb-1 font-semibold">Fees & ROI</div>
          <div className="rounded-lg p-2 space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            {[
              { label: 'Tuition', value: formatFees(opp.fees), icon: null },
              { label: 'Total Cost', value: formatFees(calcTotalCost), icon: DollarSign },
              { label: 'ROI Score', value: calcROI != null ? `${calcROI}/10` : '—', icon: TrendingUp },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[9px] text-slate-500">
                  {item.icon && <item.icon size={9} />}
                  {item.label}
                </span>
                <span className="text-[11px] font-mono font-semibold text-white/80">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {[
          { label: 'Academics', value: opp.academicsRating },
          { label: 'Placements', value: opp.placementsRating },
          { label: 'Research', value: opp.researchRating },
          { label: 'Campus', value: opp.campusRating },
          { label: 'ROI', value: opp.roiRating },
        ].filter(r => r.value != null).map((rating, i) => (
          <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[9px] text-slate-500">{rating.label}</span>
            <Stars rating={rating.value} size={10} />
          </div>
        ))}
      </div>

      {/* Priority 9: Tags */}
      {opp.tags && opp.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {opp.tags.map((tag, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{
              color: tag.color || '#94A3B8',
              background: tag.bg || 'rgba(148,163,184,0.1)',
              border: `1px solid ${tag.color ? tag.color + '30' : 'rgba(148,163,184,0.2)'}`
            }}>
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Priority 9: Available Categories */}
      {opp.availableCategories && opp.availableCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <span className="text-[9px] text-slate-500 mr-1">Categories:</span>
          {opp.availableCategories.map((cat, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full text-slate-300" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
              {cat}
            </span>
          ))}
        </div>
      )}

      {opp.whyExplanation && (
        <div className="mb-3 rounded-lg p-3 space-y-2" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
          <div className="text-[9px] text-purple-400/70 uppercase font-semibold tracking-wider">Why This College?</div>
          <div className="text-[11px] text-slate-300 leading-relaxed">{opp.whyExplanation.whyMatched}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            {opp.whyExplanation.categoryUsed && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Category:</span>
                <span className="text-slate-300 font-medium">{opp.whyExplanation.categoryUsed}</span>
              </div>
            )}
            {opp.whyExplanation.latestCutoff && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Cutoff:</span>
                <span className="text-slate-300 font-mono">{opp.whyExplanation.latestCutoff.closingScore} ({opp.whyExplanation.latestCutoff.year})</span>
              </div>
            )}
            {opp.whyExplanation.trendDirection && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Trend:</span>
                <span className="font-mono" style={{ color: opp.whyExplanation.trendDirection === 'Rising' ? '#F97316' : opp.whyExplanation.trendDirection === 'Falling' ? '#22C55E' : '#94A3B8' }}>
                  {opp.whyExplanation.trendDirection === 'Rising' ? '↑' : opp.whyExplanation.trendDirection === 'Falling' ? '↓' : '→'} {opp.whyExplanation.trendDirection}
                </span>
              </div>
            )}
            {opp.whyExplanation.competitionLevel && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Competition:</span>
                <span className="text-slate-300">{opp.whyExplanation.competitionLevel}</span>
              </div>
            )}
            {opp.whyExplanation.confidenceLevel && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Confidence:</span>
                <span className="font-medium" style={{ color: opp.probability >= 80 ? '#22C55E' : opp.probability >= 60 ? '#EAB308' : opp.probability >= 40 ? '#F97316' : '#EF4444' }}>
                  {opp.whyExplanation.confidenceLevel}
                </span>
              </div>
            )}
            {opp.whyExplanation.placementSummary && (
              <div className="flex items-center gap-1.5 col-span-2">
                <span className="text-slate-500">Placement:</span>
                <span className="text-slate-300">{opp.whyExplanation.placementSummary}</span>
              </div>
            )}
            {opp.whyExplanation.feeSummary && (
              <div className="flex items-center gap-1.5 col-span-2">
                <span className="text-slate-500">Fees:</span>
                <span className="text-slate-300">{opp.whyExplanation.feeSummary}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {opp.improvementSuggestion && (
        <div className="mb-3 rounded-lg p-3" style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.1)' }}>
          <div className="text-[9px] text-amber-400/70 uppercase font-semibold tracking-wider mb-2 flex items-center gap-1.5">
            <Target size={10} /> How to Improve Your Chances
          </div>
          <div className="space-y-1.5">
            {opp.improvementSuggestion.to90 && (
              <div className="text-[11px] text-slate-300 flex items-start gap-2">
                <ArrowUp size={11} className="text-amber-400 mt-0.5 shrink-0" />
                <span>To reach <strong className="text-white">90% probability</strong>, improve your score by <strong className="text-amber-400">~{opp.improvementSuggestion.to90.marksNeeded} marks</strong></span>
              </div>
            )}
            {opp.improvementSuggestion.to70 && opp.improvementSuggestion.to70.marksNeeded > 0 && (
              <div className="text-[11px] text-slate-400 flex items-start gap-2">
                <ArrowUp size={11} className="text-slate-500 mt-0.5 shrink-0" />
                <span>To reach <strong className="text-white">70% probability</strong>, improve by <strong className="text-amber-400">~{opp.improvementSuggestion.to70.marksNeeded} marks</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => onCompare?.(opp)}
          className={`text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all ${inCompareList ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 border border-white/10 hover:text-white hover:border-white/20'}`}
        >
          {inCompareList ? '✓ Comparing' : '+ Compare'}
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all text-slate-400 border border-white/10 hover:text-white hover:border-white/20 flex items-center gap-1"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Less' : 'Details'}
        </button>
        {opp.website && (
          <a
            href={opp.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all text-slate-400 border border-white/10 hover:text-white hover:border-white/20 flex items-center gap-1"
          >
            <ExternalLink size={10} />
            Website
          </a>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
              {/* Ratings */}
              {(opp.academicsRating || opp.placementsRating || opp.researchRating || opp.roiRating) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {opp.academicsRating && (
                    <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
                      <div className="text-[10px] font-bold text-purple-300">Academics</div>
                      <div className="text-[11px]">{'★'.repeat(Math.max(0, Math.min(5, Math.floor(opp.academicsRating/2))))}{'☆'.repeat(Math.max(0, 5-Math.min(5, Math.floor(opp.academicsRating/2))))}</div>
                    </div>
                  )}
                  {opp.placementsRating && (
                    <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)' }}>
                      <div className="text-[10px] font-bold text-green-300">Placements</div>
                      <div className="text-[11px]">{'★'.repeat(Math.max(0, Math.min(5, Math.floor(opp.placementsRating/2))))}{'☆'.repeat(Math.max(0, 5-Math.min(5, Math.floor(opp.placementsRating/2))))}</div>
                    </div>
                  )}
                  {opp.researchRating && (
                    <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.1)' }}>
                      <div className="text-[10px] font-bold text-cyan-300">Research</div>
                      <div className="text-[11px]">{'★'.repeat(Math.max(0, Math.min(5, Math.floor(opp.researchRating/2))))}{'☆'.repeat(Math.max(0, 5-Math.min(5, Math.floor(opp.researchRating/2))))}</div>
                    </div>
                  )}
                  {opp.roiRating && (
                    <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.1)' }}>
                      <div className="text-[10px] font-bold text-yellow-300">ROI</div>
                      <div className="text-[11px]">{'★'.repeat(Math.max(0, Math.min(5, Math.floor(opp.roiRating/2))))}{'☆'.repeat(Math.max(0, 5-Math.min(5, Math.floor(opp.roiRating/2))))}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Duration', value: opp.duration ? `${opp.duration} years` : '—', icon: GraduationCap },
                  { label: 'Intake', value: opp.intake || '—', icon: Award },
                  { label: 'Seats', value: opp.seats || opp.intake || '—' },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    {item.icon && <item.icon size={12} className="mx-auto mb-0.5 text-slate-500" />}
                    <div className="text-[11px] font-mono font-semibold text-white/80">{item.value}</div>
                    <div className="text-[8px] text-slate-500 uppercase">{item.label}</div>
                  </div>
                ))}
              </div>

              {opp.curriculum && (
                <div>
                  <div className="text-[9px] text-slate-500 uppercase mb-1 font-semibold">Curriculum</div>
                  <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {showFullCurriculum || opp.curriculum.length <= 100 ? opp.curriculum : `${opp.curriculum.slice(0, 100)}...`}
                    </p>
                    {opp.curriculum.length > 100 && (
                      <button onClick={() => setShowFullCurriculum(!showFullCurriculum)} className="text-[10px] text-purple-400/60 hover:text-purple-400 mt-1">
                        {showFullCurriculum ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {opp.researchAreas && opp.researchAreas.length > 0 && (
                <div>
                  <div className="text-[9px] text-slate-500 uppercase mb-1 font-semibold">Research Areas</div>
                  <div className="flex flex-wrap gap-1">
                    {opp.researchAreas.map((area, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {opp.acceptedPapers && opp.acceptedPapers.length > 0 && (
                <div>
                  <div className="text-[9px] text-slate-500 uppercase mb-1 font-semibold">Accepted Papers</div>
                  <div className="flex flex-wrap gap-1">
                    {opp.acceptedPapers.map((paper, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded-full text-slate-400" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
                        {paper}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
