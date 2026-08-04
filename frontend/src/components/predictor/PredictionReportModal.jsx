import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, TrendingUp, Award, MapPin, Target, ListOrdered, DollarSign, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { generatePredictionReport } from '../../utils/pdfReportGenerator';
import { useAuth } from '../../context/AuthContext';

const TIER_ICON = { 1: '\uD83C\uDFC6', 2: '\uD83E\uDD48', 3: '\uD83E\uDD49' };

function ChanceBadge({ prob }) {
  if (prob >= 95) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">{'\uD83D\uDFE2'} Extremely High</span>;
  if (prob >= 80) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{'\uD83D\uDFE2'} High</span>;
  if (prob >= 60) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">{'\uD83D\uDFE1'} Moderate</span>;
  if (prob >= 40) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">{'\uD83D\uDFE0'} Low</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">{'\uD83D\uDD34'} Very Low</span>;
}

function Stars({ rating }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return <span className="text-[11px]">{'\u2605'.repeat(full)}{half ? '\u2BEF' : ''}{'\u2606'.repeat(5 - full - (half ? 1 : 0))}</span>;
}

export default function PredictionReportModal({ isOpen, onClose, result, compareList, choiceOrder }) {
  const reportRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();

  const opps = result?.opportunities || [];
  const dream = opps.filter(o => o.path === 'Dream');
  const target = opps.filter(o => o.path === 'Target');
  const safe = opps.filter(o => o.path === 'Safe');

  const candName = user?.name?.trim() || result.candidateName || 'GATE Aspirant';
  const predId = result.historyId ? result.historyId.toString().slice(-6).toUpperCase() : 'N/A';

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await generatePredictionReport({
        result,
        compareList,
        choiceOrder,
        predId,
        candName,
      });
    } catch (e) {
      console.error('PDF generation failed:', e);
      toast.error('Failed to generate PDF: ' + (e.message || e));
    }
    setGenerating(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: 'rgba(12,18,34,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <FileText size={20} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Admission Report</h2>
                  <p className="text-[11px] text-slate-500">Personalized M.Tech counselling report</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50">
                  {generating ? <span className="animate-spin inline-block w-3 h-3 border-2 border-purple-300 border-t-transparent rounded-full" /> : <Download size={14} />}
                  {generating ? 'Generating...' : 'Download PDF'}
                </button>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Report Preview */}
            <div ref={reportRef} className="space-y-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {/* Score Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'GATE Score', value: result.predictedScore, icon: Award, color: '#8B5CF6' },
                  { label: 'AIR', value: result.airRange ? `${result.airRange.low}-${result.airRange.high}` : (result.predictedRank ?? '—'), icon: Target, color: '#06B6D4' },
                  { label: 'Percentile', value: `${result.predictedPercentile}%`, icon: TrendingUp, color: '#22C55E' },
                  { label: 'Confidence', value: result.confidence, icon: Star, color: '#EAB308' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl p-3 text-center" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                    <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
                    <div className="text-lg font-bold text-white font-mono">{s.value ?? '\u2014'}</div>
                    <div className="text-[9px] text-slate-500 uppercase">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} className="text-purple-400" />
                  <span className="text-xs font-semibold text-white">Opportunities Summary</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div><span className="text-red-400">{'\uD83D\uDD34'} Dream:</span> <span className="text-white font-mono">{dream.length}</span></div>
                  <div><span className="text-orange-400">{'\uD83D\uDFE0'} Target:</span> <span className="text-white font-mono">{target.length}</span></div>
                  <div><span className="text-green-400">{'\uD83D\uDFE2'} Safe:</span> <span className="text-white font-mono">{safe.length}</span></div>
                  <div><span className="text-slate-400">{'\uD83C\uDFDB\uFE0F'} Total:</span> <span className="text-white font-mono">{opps.length}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['IIT', 'NIT', 'IIIT', 'GFTI'].map(type => {
                    const count = opps.filter(o => o.collegeType === type).length;
                    if (!count) return null;
                    return <span key={type} className="px-2 py-0.5 rounded text-[9px] font-medium bg-white/5 text-slate-300">{type}: {count}</span>;
                  })}
                </div>
              </div>

              {/* Top 10 */}
              <div>
                <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <ListOrdered size={14} className="text-cyan-400" /> Top 10 Recommendations
                </h3>
                <div className="space-y-2">
                  {opps.slice(0, 10).map((o, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">{o.college}</div>
                          <div className="text-[10px] text-slate-500">{o.program}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px]">{TIER_ICON[o.tier] || `T${o.tier}`}</span>
                        <ChanceBadge prob={o.probability} />
                        {o.avgPlacement && <span className="text-[10px] text-slate-400">{'\u20B9'}{o.avgPlacement}L</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* College Details */}
              {compareList && compareList.length >= 2 && (
                <div>
                  <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                    <DollarSign size={14} className="text-yellow-400" /> Colleges Compared
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {compareList.slice(0, 4).map((o, i) => (
                      <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="text-xs font-semibold text-white mb-2">{o.college}</div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                          <span>Placement: <span className="text-white">{'\u20B9'}{o.avgPlacement}L</span></span>
                          <span>Highest: <span className="text-white">{'\u20B9'}{o.highestPlacement}L</span></span>
                          <span>Place %: <span className="text-white">{o.placementPercentage}%</span></span>
                          <span>Fees: <span className="text-white">{'\u20B9'}{(o.fees / 100000).toFixed(1)}L</span></span>
                          <span>ROI: <span className="text-white">{o.roiScore}</span></span>
                          <span>Rating: <span className="text-white"><Stars rating={o.academicsRating} /></span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)' }}>
                  <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                    <Award size={14} className="text-cyan-400" /> Counselling Tips
                  </h3>
                  <ul className="space-y-1">
                    {result.recommendations.slice(0, 6).map((rec, i) => (
                      <li key={i} className="text-[11px] text-slate-400 flex items-start gap-2">
                        <span className="text-cyan-400 mt-0.5">{'\u2022'}</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-[9px] text-slate-600 pt-2 border-t border-white/5">
                Generated by GateNexa | Data: CCMT historical cutoffs (2022-2026) | {new Date().toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
