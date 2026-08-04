import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListOrdered, Target, MapPin, Filter, RotateCcw, Loader2, X, DollarSign, Download, ChevronDown, ChevronUp, GraduationCap, TrendingUp, ShieldCheck, Sparkles, Lightbulb } from 'lucide-react';

const CHANCE_BANDS = [
  { max: 100, min: 95, label: 'Extremely High', color: '#16A34A', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.3)' },
  { max: 95, min: 80, label: 'High', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  { max: 80, min: 60, label: 'Moderate', color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)' },
  { max: 60, min: 40, label: 'Low', color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
  { max: 40, min: 0, label: 'Very Low', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
];

const COLLEGE_TYPE_STYLES = {
  IIT: { color: '#A855F7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' },
  NIT: { color: '#06B6D4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)' },
  IIIT: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
  GFTI: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
};

const SORT_OPTIONS = [
  { value: 'probability', label: 'Admission Probability', icon: TrendingUp },
  { value: 'matchScore', label: 'Match Score', icon: Target },
  { value: 'placement', label: 'Placement (High to Low)', icon: DollarSign },
  { value: 'fees', label: 'Fees (Low to High)', icon: DollarSign },
  { value: 'name', label: 'College Name', icon: ListOrdered },
];

const INDIAN_STATES = ['', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'];

function getChanceConfig(probability) {
  return CHANCE_BANDS.find(b => probability >= b.min && probability <= b.max) || CHANCE_BANDS[4];
}

function formatLPA(val) {
  if (val == null) return '\u2014';
  if (val >= 100) return `\u20B9${(val / 100).toFixed(1)} Cr`;
  return `\u20B9${val} LPA`;
}

function getGroupLabel(prob) {
  if (prob >= 80) return { label: 'Dream', icon: Sparkles, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' };
  if (prob >= 50) return { label: 'Target', icon: Target, color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' };
  return { label: 'Safe', icon: ShieldCheck, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)' };
}

export default function ChoiceFillingAssistant({ opportunities, predictorService, onClose, score, onOrderGenerated }) {
  const [preferredState, setPreferredState] = useState('');
  const [collegeType, setCollegeType] = useState('Any');
  const [orderedList, setOrderedList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('probability');
  const [showExplanation, setShowExplanation] = useState(false);
  const [viewMode, setViewMode] = useState('flat');
  const [notified, setNotified] = useState(false);

  const hasEligible = opportunities && opportunities.length > 0;

  useEffect(() => {
    if (hasEligible && !orderedList && !loading) {
      autoGenerate();
    }
  }, [hasEligible]);

  useEffect(() => {
    if (!orderedList) return;
    const sorted = [...orderedList].sort(getSortFn(sortBy));
    setOrderedList(sorted);
  }, [sortBy]);

  useEffect(() => {
    if (orderedList && !notified) {
      setNotified(true);
      if (onOrderGenerated) onOrderGenerated(orderedList);
    }
  }, [orderedList, notified, onOrderGenerated]);

  function getSortFn(key) {
    switch (key) {
      case 'matchScore': return (a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0);
      case 'placement': return (a, b) => (b.avgPlacement ?? 0) - (a.avgPlacement ?? 0);
      case 'fees': return (a, b) => (a.fees ?? Infinity) - (b.fees ?? Infinity);
      case 'name': return (a, b) => (a.college || '').localeCompare(b.college || '');
      default: {
        const BLOCK_PRIORITY = { dream_elite: 0, high_chance_iit: 1, safe_nit: 2, backup: 3 };
        return (a, b) => {
          const pa = BLOCK_PRIORITY[a.collegeBlock] ?? 99;
          const pb = BLOCK_PRIORITY[b.collegeBlock] ?? 99;
          if (pa !== pb) return pa - pb;
          return (b.probability ?? 0) - (a.probability ?? 0);
        };
      }
    }
  }

  function autoGenerate() {
    const BLOCK_PRIORITY = { dream_elite: 0, high_chance_iit: 1, safe_nit: 2, backup: 3 };
    const sorted = [...(opportunities || [])].sort((a, b) => {
      const pa = BLOCK_PRIORITY[a.collegeBlock] ?? 99;
      const pb = BLOCK_PRIORITY[b.collegeBlock] ?? 99;
      if (pa !== pb) return pa - pb;
      return (b.probability ?? 0) - (a.probability ?? 0);
    });
    setOrderedList(sorted);
  }

  const handleGenerate = async () => {
    if (!opportunities || opportunities.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await predictorService.choiceOrder({
        opportunities,
        preferredState: preferredState || undefined,
        collegeType: collegeType === 'Any' ? undefined : collegeType,
      });
      const list = res.data.data || res.data.orderedList || [];
      setOrderedList(list.sort(getSortFn(sortBy)));
    } catch (e) {
      const fallback = [...(opportunities || [])].sort((a, b) => {
        const BLOCK_PRIORITY = { dream_elite: 0, high_chance_iit: 1, safe_nit: 2, backup: 3 };
        const pa = BLOCK_PRIORITY[a.collegeBlock] ?? 99;
        const pb = BLOCK_PRIORITY[b.collegeBlock] ?? 99;
        if (pa !== pb) return pa - pb;
        return (b.probability || 0) - (a.probability || 0);
      });
      setOrderedList(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreferredState('');
    setCollegeType('Any');
    setError(null);
    autoGenerate();
  };

  const handleDownload = () => {
    if (!orderedList || orderedList.length === 0) return;
    const header = 'Rank,College,Program,College Type,Location,Admission Probability,Match Score,Avg Placement (LPA),Fees';
    const rows = orderedList.map((item, i) =>
      `${i + 1},"${item.college}","${item.program}","${item.collegeType || ''}","${item.location || ''}",${item.probability ?? ''},${item.matchScore ?? ''},${item.avgPlacement ?? ''},${item.fees ?? ''}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `choice-list-${score || 'gate'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const topRecommendation = orderedList && orderedList.length > 0 ? orderedList[0] : null;
  const grouped = useMemo(() => {
    if (!orderedList) return null;
    return {
      dream: orderedList.filter(i => (i.probability ?? 0) >= 80),
      target: orderedList.filter(i => { const p = i.probability ?? 0; return p >= 50 && p < 80; }),
      safe: orderedList.filter(i => (i.probability ?? 0) < 50),
    };
  }, [orderedList]);

  if (!hasEligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 max-w-4xl mx-auto"
        style={{ background: 'rgba(18,24,40,0.6)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))' }}>
              <ListOrdered size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">CCMT Choice Filling Assistant</h2>
              <p className="text-[11px] text-slate-500">Recommended preference order based on your score and admission probability</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Lightbulb size={32} className="text-purple-400/60" />
          </div>
          <p className="text-sm font-medium text-white mb-2">No Eligible Colleges Found</p>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Your expected score of <strong className="text-white">{score ?? 'N/A'}</strong> does not meet the qualifying cutoff for any college in our database. Try increasing your target score, selecting a different category, or choosing an alternate paper.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="rounded-lg px-3 py-2 text-[10px] text-slate-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-purple-400 font-semibold">Suggestion 1:</span> Retake GATE with a higher target
            </div>
            <div className="rounded-lg px-3 py-2 text-[10px] text-slate-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-purple-400 font-semibold">Suggestion 2:</span> Check reserved category eligibility
            </div>
            <div className="rounded-lg px-3 py-2 text-[10px] text-slate-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-purple-400 font-semibold">Suggestion 3:</span> Explore PSUs and private institutes
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden max-w-4xl mx-auto"
      style={{ background: 'rgba(18,24,40,0.6)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))' }}>
              <ListOrdered size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{'\uD83C\uDFAF'} CCMT Choice Filling Assistant</h2>
              <p className="text-[11px] text-slate-500">Recommended preference order based on your score and admission probability</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Top recommendation card */}
        {topRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 mb-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }} />
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-purple-400" />
              <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">Top Recommendation</span>
            </div>
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{topRecommendation.college}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ color: COLLEGE_TYPE_STYLES[topRecommendation.collegeType]?.color || '#94A3B8', background: COLLEGE_TYPE_STYLES[topRecommendation.collegeType]?.bg || 'rgba(148,163,184,0.1)', border: `1px solid ${COLLEGE_TYPE_STYLES[topRecommendation.collegeType]?.border || 'rgba(148,163,184,0.2)'}` }}>
                    {topRecommendation.collegeType}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{topRecommendation.program}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-[9px] text-slate-500 uppercase">Admission Confidence</div>
                  <div className="text-sm font-bold font-mono" style={{ color: getChanceConfig(topRecommendation.probability).color }}>{topRecommendation.probability ?? '--'}%</div>
                </div>
                {topRecommendation.matchScore != null && (
                  <div className="text-right">
                    <div className="text-[9px] text-slate-500 uppercase">Match Score</div>
                    <div className="text-sm font-bold font-mono text-cyan-400">{topRecommendation.matchScore}%</div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Ranked #1 due to the highest admission probability{topRecommendation.matchScore != null ? ` and strongest overall match score` : ''} among all eligible choices for your profile.
            </p>
          </motion.div>
        )}

        {/* Metric cards row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">GATE Score</div>
            <div className="text-lg font-bold font-mono text-white">{score ?? '\u2014'}</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Total Eligible</div>
            <div className="text-lg font-bold font-mono text-white">{orderedList?.length ?? opportunities.length}</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Top Preference</div>
            <div className="text-xs font-bold text-white truncate">{topRecommendation?.college || 'Highest probability choice'}</div>
          </div>
        </div>

        {/* Controls row: filters, sort, view, download */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex-1 min-w-[140px]">
            <select
              value={preferredState}
              onChange={e => setPreferredState(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none appearance-none cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <option value="" className="bg-slate-900">All States</option>
              {INDIAN_STATES.filter(Boolean).map(s => (
                <option key={s} value={s} className="bg-slate-900">{s}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[100px]">
            <select
              value={collegeType}
              onChange={e => setCollegeType(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none appearance-none cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {['Any', 'IIT', 'NIT', 'IIIT', 'GFTI'].map(t => (
                <option key={t} value={t} className="bg-slate-900">{t === 'Any' ? 'Any Type' : t}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[100px]">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none appearance-none cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode(viewMode === 'flat' ? 'grouped' : 'flat')}
              className="px-3 py-2 rounded-xl text-[10px] font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: viewMode === 'grouped' ? '#A855F7' : '#94A3B8' }}
            >
              {viewMode === 'grouped' ? 'Flat View' : 'Grouped View'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl text-[10px] font-medium text-slate-400 hover:text-white transition-all flex items-center gap-1"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Download size={12} /> CSV
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-[10px] font-bold text-white flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
            >
              <Filter size={12} />
              {loading ? 'Generating...' : 'Reorder'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-[10px] text-slate-500 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <RotateCcw size={12} />
            </motion.button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                <Loader2 size={28} className="text-purple-400" />
              </motion.div>
              <span className="text-xs text-slate-400">Generating your optimized preference order...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl p-3 mb-4 text-xs text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </div>
        )}

        {orderedList && !loading && (
          <>
            <div className="rounded-xl p-3 mb-3 flex items-start gap-2" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
              <MapPin size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-300/80 leading-relaxed">
                This order is generated based on admission probability, <strong>not a guarantee</strong>. Always verify with official CCMT/COAP guidelines. Higher rank &ne; better fit — consider placement, fees, and location.
              </p>
            </div>

            {viewMode === 'grouped' && grouped && (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {grouped.dream.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-green-400" />
                      <span className="text-[11px] font-bold text-green-300 uppercase tracking-wider">Dream ({grouped.dream.length})</span>
                      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(34,197,94,0.3), transparent)' }} />
                    </div>
                    {grouped.dream.map((item, idx) => renderItem(item, idx))}
                  </div>
                )}
                {grouped.target.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={14} className="text-yellow-400" />
                      <span className="text-[11px] font-bold text-yellow-300 uppercase tracking-wider">Target ({grouped.target.length})</span>
                      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(234,179,8,0.3), transparent)' }} />
                    </div>
                    {grouped.target.map((item, idx) => renderItem(item, idx))}
                  </div>
                )}
                {grouped.safe.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck size={14} className="text-cyan-400" />
                      <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">Safe ({grouped.safe.length})</span>
                      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(6,182,212,0.3), transparent)' }} />
                    </div>
                    {grouped.safe.map((item, idx) => renderItem(item, idx))}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'flat' && (
              <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
                {Array.isArray(orderedList) && orderedList.map((item, index) => {
                  const chanceCfg = getChanceConfig(item.probability);
                  const typeStyle = COLLEGE_TYPE_STYLES[item.collegeType] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
                  const isTop10 = index < 10;
                  const isSectionStart = index === 0 || index === 10;

                  return (
                    <div key={item.college + item.program + index}>
                      {isSectionStart && index === 10 && (
                        <div className="flex items-center gap-2 pt-4 pb-2">
                          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.3), transparent)' }} />
                          <span className="text-[9px] text-purple-300/60 uppercase tracking-widest font-semibold">Remaining Options (11–{orderedList.length})</span>
                          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(139,92,246,0.3), transparent)' }} />
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.015, 0.5) }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.02]"
                        style={{
                          border: isTop10 ? '1px solid rgba(139,92,246,0.12)' : '1px solid rgba(255,255,255,0.04)',
                          background: isTop10 ? 'rgba(139,92,246,0.03)' : 'transparent',
                        }}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold font-mono ${isTop10 ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : ''}`} style={!isTop10 ? { background: chanceCfg.bg, color: chanceCfg.color, border: `1px solid ${chanceCfg.border}` } : {}}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-white truncate">{item.college}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium" style={{ color: typeStyle.color, background: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}>
                              {item.collegeType}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 truncate">{item.program}</span>
                            {item.location && (
                              <span className="text-[9px] text-slate-600 flex items-center gap-0.5 shrink-0">
                                <MapPin size={8} /> {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {item.matchScore != null && (
                            <span className="text-[9px] font-mono text-cyan-500/80 flex items-center gap-0.5">
                              <Target size={8} /> {item.matchScore}
                            </span>
                          )}
                          {item.avgPlacement != null && (
                            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5">
                              <DollarSign size={8} /> {formatLPA(item.avgPlacement)}
                            </span>
                          )}
                          <div className="text-[11px] font-bold font-mono w-10 text-right" style={{ color: chanceCfg.color }}>{item.probability ?? '\u2014'}%</div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Why this order? */}
            <div className="mt-4">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-all"
              >
                <Lightbulb size={12} />
                Why this order?
                {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl p-3 mt-2 text-[10px] text-slate-400 leading-relaxed space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p><strong className="text-slate-300">Primary sort:</strong> Admission probability (descending) — higher probability colleges are ranked first.</p>
                      <p><strong className="text-slate-300">Probability calculation:</strong> Based on your score vs. historical closing scores, adjusted for category reservation, seat availability, counselling round, and year-over-year trends.</p>
                      <p><strong className="text-slate-300">Dream (≥80%):</strong> Strong chance of admission. Prioritize these for your top preferences.</p>
                      <p><strong className="text-slate-300">Target (50–80%):</strong> Competitive but realistic. Include 3–5 of these as core choices.</p>
                      <p><strong className="text-slate-300">Safe (&lt;50%):</strong> Lower probability. Include 1–2 as backup options.</p>
                      <p className="text-slate-500 mt-1">Always verify with official CCMT/COAP counselling guidelines before finalizing.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );

  function renderItem(item, idx) {
    const group = getGroupLabel(item.probability);
    const typeStyle = COLLEGE_TYPE_STYLES[item.collegeType] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
    const globalIndex = orderedList.indexOf(item);
    return (
      <motion.div
        key={item.college + item.program + idx}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(idx * 0.02, 0.4) }}
        className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-white/[0.02]"
        style={{ border: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold font-mono" style={{ background: group.bg, color: group.color, border: `1px solid ${group.border}` }}>
          {globalIndex + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-white truncate">{item.college}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium" style={{ color: typeStyle.color, background: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}>
              {item.collegeType}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-400 truncate">{item.program}</span>
            {item.location && (
              <span className="text-[9px] text-slate-600 flex items-center gap-0.5 shrink-0">
                <MapPin size={8} /> {item.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {item.matchScore != null && (
            <span className="text-[9px] font-mono text-cyan-500/80 flex items-center gap-0.5"><Target size={8} /> {item.matchScore}</span>
          )}
          {item.avgPlacement != null && (
            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5"><DollarSign size={8} /> {formatLPA(item.avgPlacement)}</span>
          )}
          <div className="text-[11px] font-bold font-mono w-10 text-right" style={{ color: group.color }}>{item.probability ?? '\u2014'}%</div>
        </div>
      </motion.div>
    );
  }
}
