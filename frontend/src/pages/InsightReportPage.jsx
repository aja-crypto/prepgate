import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, TrendingDown, Minus, Calendar, Eye, Share, Bookmark, Download, ArrowLeft, ArrowRight, Sparkles, Target, BarChart3, Brain, Home, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

function HeroSection({ insight }) {
  const h = insight.hero || {};
  return (
    <div className="relative rounded-2xl overflow-hidden p-6 sm:p-10 mb-8" style={{
      background: h.backgroundGradient?.length === 2
        ? `linear-gradient(135deg, ${h.backgroundGradient[0]}, ${h.backgroundGradient[1]})`
        : 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(34,211,238,0.08))',
      border: '1px solid rgba(139,92,246,0.12)',
    }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-3xl">{insight.icon || '📊'}</span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: `${insight.color}15`, color: insight.color, border: `1px solid ${insight.color}25` }}>{insight.type}</span>
          {h.aiConfidence > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Sparkles size={10} /> AI Confidence {h.aiConfidence}%
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">{h.title || insight.title}</h1>
        {h.subtitle && <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-3xl">{h.subtitle}</p>}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] text-slate-500">
          {h.lastUpdated && <span className="flex items-center gap-1"><Calendar size={11} /> Updated {new Date(h.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
          {insight.views > 0 && <span className="flex items-center gap-1"><Eye size={11} /> {insight.views.toLocaleString()} views</span>}
        </div>
      </div>
    </div>
  );
}

function KPICard({ kpi, index }) {
  const trendIcon = kpi.trend === 'up' ? <TrendingUp size={12} className="text-green-400" /> : kpi.trend === 'down' ? <TrendingDown size={12} className="text-red-400" /> : <Minus size={12} className="text-slate-500" />;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(18,24,40,0.7)', border: '1px solid rgba(139,92,246,0.08)', backdropFilter: 'blur(12px)' }}>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{kpi.label}</div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white font-mono tracking-tight">{kpi.prefix}{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}{kpi.suffix}</span>
        {kpi.trend && <span className="mb-1">{trendIcon}</span>}
        {kpi.changePercent != null && <span className={`text-[10px] font-semibold ${kpi.trend === 'up' ? 'text-green-400' : kpi.trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>{kpi.changePercent > 0 ? '+' : ''}{kpi.changePercent}%</span>}
      </div>
      {kpi.rank != null && kpi.total != null && (
        <div className="flex items-center gap-2 text-[10px] text-slate-500"><Target size={10} /> Rank {kpi.rank} of {kpi.total}</div>
      )}
      {kpi.changePercent != null && (
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(139,92,246,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ background: kpi.color || '#8B5CF6', width: `${Math.min(100, Math.abs(kpi.changePercent || 0) * 3)}%` }} />
        </div>
      )}
    </motion.div>
  );
}

function ChartBlock({ viz }) {
  const maxVal = Math.max(...(Array.isArray(viz.data) ? viz.data.map((d) => typeof d === 'number' ? d : (d.value || 0)) : [1]));
  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(18,24,40,0.7)', border: '1px solid rgba(139,92,246,0.08)', backdropFilter: 'blur(12px)' }}>
      {viz.title && <h4 className="text-sm font-bold text-white mb-4">{viz.title}</h4>}
      <div className="flex items-end gap-2 h-40">
        {(Array.isArray(viz.data) ? viz.data : []).map((d, i) => {
          const v = typeof d === 'number' ? d : (d.value || 0);
          const label = typeof d === 'object' ? d.label : '';
          const color = typeof d === 'object' ? (d.color || '#8B5CF6') : '#8B5CF6';
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] text-slate-500">{v}</span>
              <motion.div className="w-full rounded-t-md" style={{ background: color, maxWidth: 40, margin: '0 auto' }}
                initial={{ height: 0 }} animate={{ height: `${(v / maxVal) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} />
              {label && <span className="text-[8px] text-slate-600 truncate w-full text-center">{label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineBlock({ viz }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(18,24,40,0.7)', border: '1px solid rgba(139,92,246,0.08)', backdropFilter: 'blur(12px)' }}>
      {viz.title && <h4 className="text-sm font-bold text-white mb-4">{viz.title}</h4>}
      <div className="relative">
        <div className="absolute left-[13px] top-2 bottom-2 w-[2px] rounded-full" style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.3), rgba(34,211,238,0.1))' }} />
        {(Array.isArray(viz.data) ? viz.data : []).map((d, i) => (
          <div key={i} className="relative pl-9 pb-5 last:pb-0 group">
            <div className="absolute left-[6px] top-1 w-[16px] h-[16px] rounded-full border-2" style={{ borderColor: d.color || '#8B5CF6', background: 'rgba(10,15,44,0.9)' }}>
              <div className="absolute inset-[3px] rounded-full" style={{ background: d.color || '#8B5CF6' }} />
            </div>
            <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">{d.label}</div>
            {d.subtitle && <div className="text-[10px] text-slate-500 mt-0.5">{d.subtitle}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBlock({ viz }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(18,24,40,0.7)', border: '1px solid rgba(139,92,246,0.08)', backdropFilter: 'blur(12px)' }}>
      {viz.title && <h4 className="text-sm font-bold text-white mb-4">{viz.title}</h4>}
      {(Array.isArray(viz.data) ? viz.data : []).map((d, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex justify-between text-[11px] mb-1"><span className="text-slate-400">{d.label}</span><span className="text-white font-mono">{d.value}{d.suffix || '%'}</span></div>
          <div className="h-2.5 rounded-full" style={{ background: 'rgba(139,92,246,0.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: d.color || 'linear-gradient(90deg, #8B5CF6, #6D28D9)', width: `${Math.min(100, d.value || 0)}%`, boxShadow: '0 0 8px rgba(139,92,246,0.3)' }}
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, d.value || 0)}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableBlock({ viz }) {
  const data = Array.isArray(viz.data) ? viz.data : [];
  const cols = viz.config?.columns || (data[0] ? Object.keys(data[0]).filter((k) => !k.startsWith('_')) : []);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(18,24,40,0.7)', border: '1px solid rgba(139,92,246,0.08)' }}>
      {viz.title && <h4 className="text-sm font-bold text-white px-5 pt-4 mb-2">{viz.title}</h4>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/[0.04]">
            <tr>{cols.map((c) => (<th key={c} className="px-5 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{c}</th>))}</tr>
          </thead>
          <tbody>
            {data.map((row, i) => (<tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">{cols.map((c) => (<td key={c} className="px-5 py-2.5 text-slate-300">{row[c]}</td>))}</tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Visualizer({ viz }) {
  switch (viz.type) {
    case 'chart': return <ChartBlock viz={viz} />;
    case 'timeline': return <TimelineBlock viz={viz} />;
    case 'heatmap':
    case 'progress': return <ProgressBlock viz={viz} />;
    case 'table':
    case 'comparison': return <TableBlock viz={viz} />;
    default: return null;
  }
}

function RecommendationCard({ rec, index }) {
  const priorityColors = { critical: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#EF4444' }, high: { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', text: '#F97316' }, medium: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', text: '#F59E0B' }, low: { bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.2)', text: '#22D3EE' } };
  const p = priorityColors[rec.priority] || priorityColors.medium;
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: p.bg, border: `1px solid ${p.border}` }}>
      <span className="text-lg mt-0.5">{rec.icon || '💡'}</span>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white">{rec.title}</h4>
        {rec.description && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{rec.description}</p>}
        {rec.action && rec.actionUrl && (
          <Link to={rec.actionUrl} className="inline-flex items-center gap-1 text-[10px] font-semibold mt-2 hover:underline" style={{ color: p.text }}>{rec.action} →</Link>
        )}
      </div>
      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: p.border, color: p.text }}>{rec.priority}</span>
    </motion.div>
  );
}

export default function InsightReportPage() {
  const { slug } = useParams();
  const [insight, setInsight] = useState(null);
  const [allInsights, setAllInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/insights/' + slug),
      api.get('/insights'),
    ]).then(([insRes, listRes]) => {
      setInsight(insRes.data.data);
      setAllInsights(listRes.data.data || []);
      setLoading(false);
    }).catch((e) => {
      setError(e.response?.data?.message || 'Insight not found');
      setLoading(false);
    });
  }, [slug]);

  const currentIdx = allInsights.findIndex((i) => i.slug === slug);
  const prevInsight = currentIdx > 0 ? allInsights[currentIdx - 1] : null;
  const nextInsight = currentIdx < allInsights.length - 1 ? allInsights[currentIdx + 1] : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-spin" style={{ background: 'rgba(139,92,246,0.1)' }}><Loader2 size={24} className="text-purple-400" /></div>
        <p className="text-sm text-slate-400">Loading AI Intelligence Report...</p>
      </div>
    </div>
  );

  if (error || !insight) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <Brain size={28} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Insight Not Found</h2>
        <p className="text-sm text-slate-400 mb-4">{error || 'The requested insight could not be loaded.'}</p>
        <Link to="/learning-hub/intelligence" className="text-sm font-semibold text-purple-400 hover:text-purple-300">← Back to Intelligence Hub</Link>
      </div>
    </div>
  );

  const hasKpis = insight.kpis?.length > 0;
  const hasViz = insight.visualizations?.length > 0;
  const hasRecs = insight.recommendations?.length > 0;
  const hasRelated = insight.relatedInsights?.length > 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-4 flex-wrap">
        <Link to="/" className="hover:text-purple-400 transition-colors"><Home size={11} className="inline" /></Link>
        <ChevronRight size={10} />
        <Link to="/learning-hub" className="hover:text-purple-400 transition-colors">Learning Hub</Link>
        <ChevronRight size={10} />
        <Link to="/learning-hub/intelligence" className="hover:text-purple-400 transition-colors">Intelligence Hub</Link>
        <ChevronRight size={10} />
        <span className="text-slate-400">{insight.title}</span>
      </div>

      {/* Prev / Next Tabs */}
      <div className="flex items-center justify-between mb-6">
        {prevInsight ? (
          <Link to={`/learning-hub/intelligence/${prevInsight.slug}`} className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-purple-400 transition-colors group">
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> <span className="hidden sm:inline">{prevInsight.title}</span><span className="sm:hidden">Previous</span>
          </Link>
        ) : <div />}
        <Link to="/learning-hub/intelligence" className="text-[10px] px-3 py-1 rounded-lg text-slate-500 hover:text-purple-400 border border-white/[0.04] hover:border-purple-500/20 transition-all">
          All Insights
        </Link>
        {nextInsight ? (
          <Link to={`/learning-hub/intelligence/${nextInsight.slug}`} className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-purple-400 transition-colors group text-right">
            <span className="hidden sm:inline">{nextInsight.title}</span><span className="sm:hidden">Next</span> <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : <div />}
      </div>

      <HeroSection insight={insight} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <button className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-400"><Bookmark size={12} /> Bookmark</button>
        <button className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-400"><Share size={12} /> Share</button>
        <button className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-400"><Download size={12} /> Download</button>
      </div>

      {/* AI Executive Summary */}
      {insight.summary && (
        <div className="rounded-2xl p-6 mb-8" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(34,211,238,0.04))', border: '1px solid rgba(139,92,246,0.1)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Brain size={14} className="text-purple-400" />
            </div>
            <h2 className="text-sm font-bold text-white">AI Executive Summary</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{insight.summary}</p>
        </div>
      )}

      {/* KPI Cards */}
      {hasKpis && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-purple-400" /> Key Performance Indicators</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {insight.kpis.map((kpi, i) => (<KPICard key={i} kpi={kpi} index={i} />))}
          </div>
        </div>
      )}

      {/* Visualizations */}
      {hasViz && (
        <div className="mb-8">
          <div className="grid sm:grid-cols-2 gap-4">
            {insight.visualizations.map((viz, i) => (
              <div key={i} className={viz.type === 'table' || viz.type === 'comparison' ? 'sm:col-span-2' : ''}>
                <Visualizer viz={viz} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {hasRecs && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Target size={14} className="text-amber-400" /> AI Recommendations</h2>
          <div className="space-y-2">
            {insight.recommendations.map((rec, i) => (<RecommendationCard key={i} rec={rec} index={i} />))}
          </div>
        </div>
      )}

      {/* Bottom Prev/Next Navigation */}
      <div className="border-t border-white/[0.04] pt-6 mb-8">
        <div className="flex items-center justify-between gap-4">
          {prevInsight ? (
            <Link to={`/learning-hub/intelligence/${prevInsight.slug}`} className="flex-1 rounded-xl p-4 transition-all hover:-translate-y-0.5 group" style={{ background: 'rgba(18,24,40,0.5)', border: '1px solid rgba(139,92,246,0.08)' }}>
              <div className="text-[9px] text-slate-500 mb-1 flex items-center gap-1"><ArrowLeft size={10} /> Previous</div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">{prevInsight.title}</div>
            </Link>
          ) : <div className="flex-1" />}
          {nextInsight ? (
            <Link to={`/learning-hub/intelligence/${nextInsight.slug}`} className="flex-1 rounded-xl p-4 transition-all hover:-translate-y-0.5 group text-right" style={{ background: 'rgba(18,24,40,0.5)', border: '1px solid rgba(139,92,246,0.08)' }}>
              <div className="text-[9px] text-slate-500 mb-1 flex items-center gap-1 justify-end">Next <ArrowRight size={10} /></div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">{nextInsight.title}</div>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </div>
    </div>
  );
}
