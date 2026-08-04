import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderChart } from './Charts';

function InsightHero({ hero, accent }) {
  const tierStyles = {
    extreme: { bg: '#EF444420', border: '#EF444440', color: '#EF4444' },
    moderate: { bg: '#14B8A620', border: '#14B8A640', color: '#14B8A6' },
    high: { bg: '#F59E0B20', border: '#F59E0B40', color: '#F59E0B' },
    positive: { bg: '#10B98120', border: '#10B98140', color: '#10B981' },
    mixed: { bg: '#8B5CF620', border: '#8B5CF640', color: '#8B5CF6' },
    neutral: { bg: '#9CA3AF20', border: '#9CA3AF40', color: '#9CA3AF' }
  };
  const badgeStyle = tierStyles[hero.badge.tier] || tierStyles.neutral;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${accent}12, transparent)`, border: `1px solid ${accent}20` }}>
      <div className="flex items-start gap-4">
        <span className="text-3xl">{hero.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-white">{hero.title}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`, color: badgeStyle.color }}>
              {hero.badge.label}
            </span>
          </div>
          <p className="text-sm text-text3/70 mb-2">{hero.subtitle}</p>
          <p className="text-[13px] font-medium" style={{ color: accent }}>
            <span className="mr-1">💡</span>{hero.takeaway}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function QuickStatsRow({ cards }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {cards.map((card, i) => (
        <motion.div key={card.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="rounded-xl p-3"
          style={{ background: '#1A1A19', border: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] text-text3/50 uppercase tracking-wider mb-1 truncate">{card.label}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-white tabular-nums">
              {typeof card.value === 'number' && card.value > 999 ? card.value.toLocaleString() : card.value}
            </span>
            {card.unit && <span className="text-[10px] text-text3/50">{card.unit}</span>}
            <span className={`text-[9px] ml-auto ${card.confidence === 'official' ? 'text-[#10B981]/60' : 'text-text3/40'}`}
              title={card.confidence === 'official' ? 'Official data' : 'Estimated from historical data'}>
              {card.confidence === 'official' ? '✓' : '≈'}
            </span>
          </div>
          {card.delta && (
            <div className={`text-[9px] mt-0.5 flex items-center gap-0.5 ${card.delta.direction === 'up' ? 'text-[#10B981]/70' : 'text-[#EF4444]/70'}`}>
              <span>{card.delta.direction === 'up' ? '↑' : '↓'}</span>
              <span>{card.delta.value}{card.unit} {card.delta.period}</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function RankingTable({ rankings, accent, userScore }) {
  const columns = Object.keys(rankings[0] || {}).filter(k => {
    const v = rankings[0][k];
    return typeof v !== 'object' && !k.endsWith('_confidence') && k !== 'confidence';
  });
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '0.5px solid rgba(255,255,255,0.06)' }}>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wider text-text3/70" style={{ background: '#1A1A19' }}>
            {columns.map(col => (
              <th key={col} className="px-3 py-2.5 whitespace-nowrap">{col.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rankings.map((row, i) => (
            <motion.tr key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="text-[12px] group hover:bg-white/[0.02] transition-colors"
              style={{
                borderTop: '0.5px solid rgba(255,255,255,0.04)',
                background: userScore && row.closing_score_est && Math.abs(row.closing_score_est - userScore) < 30 ? `${accent}15` : 'transparent',
                boxShadow: userScore && row.closing_score_est && Math.abs(row.closing_score_est - userScore) < 30 ? `inset 2px 0 0 ${accent}` : 'none'
              }}>
              {columns.map(col => {
                const val = row[col];
                if (col === 'confidence') {
                  return (
                    <td key={col} className="px-3 py-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${val === 'official' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-yellow-500/15 text-yellow-400'}`}>
                        {val === 'official' ? 'Official' : '≈ Est.'}
                      </span>
                    </td>
                  );
                }
                return <td key={col} className="px-3 py-2 whitespace-nowrap text-text">{val ?? '—'}</td>;
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisualCardGrid({ cards, accent }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {cards.map((card, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-xl p-3"
          style={{ background: '#1A1A19', border: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-semibold text-white truncate">{card.institute || card.specialization || card.category || card.round}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${accent}20`, color: accent }}>#{card.rank}</span>
          </div>
          <div className="space-y-1 text-[11px] text-text3/70">
            {card.expected_score && <div>🎯 Expected: <span className="font-semibold text-white">{card.expected_score}</span></div>}
            {card.roi && <div>💰 ROI: <span className="font-semibold text-white">{card.roi}</span></div>}
            {card.seats && <div>💺 Seats: <span className="font-semibold text-white">{card.seats}</span></div>}
            {card.registrations && <div>📈 Registrations: <span className="font-semibold text-white">{card.registrations.toLocaleString()}</span></div>}
            {card.growth && <div>📊 Growth: <span className="font-semibold text-white">{card.growth}</span></div>}
            {card.competition_stars && (
              <div className="flex items-center gap-1">
                <span className="text-text3/50">Competition:</span>
                <span className="text-[#F59E0B]">{'★'.repeat(card.competition_stars)}{'☆'.repeat(5 - card.competition_stars)}</span>
              </div>
            )}
            {card.competitiveness && <div className="text-[#F59E0B]">{card.competitiveness}</div>}
            {card.dates && <div>📅 {card.dates}</div>}
            {card.action && <div className="text-[#8B5CF6]">{card.action}</div>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AnalysisPanel({ analysis }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
        style={{ background: '#1A1A19', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <span className="text-sm font-semibold text-white">📝 Full Analysis</span>
        <span className={`text-[10px] transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="pt-3 space-y-4">
              {analysis.sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-[13px] font-bold text-white mb-1">{section.title}</h3>
                  <p className="text-[12px] text-text3/70 leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExpandableSectionList({ expandables }) {
  const [openId, setOpenId] = useState(null);
  return (
    <div className="space-y-1">
      {expandables.map(ex => (
        <div key={ex.id} className="rounded-xl overflow-hidden" style={{ background: '#1A1A19', border: '0.5px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setOpenId(openId === ex.id ? null : ex.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left">
            <span className="text-[12px] font-medium text-white">{ex.title}</span>
            <span className={`text-[10px] transition-transform ${openId === ex.id ? 'rotate-180' : ''}`}>▼</span>
          </button>
          <AnimatePresence>
            {openId === ex.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <p className="px-4 pb-3 text-[12px] text-text3/70 leading-relaxed">{ex.body}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function AIRecommendationCard({ recommendations, userScore, accent }) {
  if (!recommendations?.buckets) return null;
  const currentBucket = recommendations.buckets.find(b => userScore >= b.range[0] && userScore <= b.range[1]) || null;
  const topChoice = recommendations.buckets.find(b => b.range[1] >= 800) || recommendations.buckets[0];

  return (
    <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${accent}12, transparent)`, border: `1px solid ${accent}25` }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <span className="text-sm font-bold text-white">AI Recommendation</span>
        {userScore > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${accent}20`, color: accent }}>
            Score: {userScore}
          </span>
        )}
      </div>
      {userScore > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-text3/70">Your tier:</span>
            <span className="text-[12px] font-bold" style={{ color: currentBucket?.color || accent }}>
              {currentBucket?.label || 'Check options below'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(currentBucket?.colleges || topChoice?.colleges || []).map((c, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-full" style={{ background: `${accent}15`, color: accent, border: `0.5px solid ${accent}30` }}>
                {c}
              </span>
            ))}
          </div>
          <div className="mt-3 pt-2" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div className="flex gap-2">
              {recommendations.buckets.map((b, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className="h-1 rounded-full mb-1" style={{ background: userScore >= b.range[0] && userScore <= b.range[1] ? (b.color || accent) : 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[8px] text-text3/50">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-text3/60">Enter your GATE score in the sidebar to see personalized recommendations</p>
      )}
    </div>
  );
}

function ConfidenceFooter({ topic, accent }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#1A1A19', border: '0.5px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold text-white">📋 Data Confidence</span>
      </div>
      <div className="space-y-1 text-[11px]">
        {topic.sources?.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${s.confidence === 'official' ? 'bg-[#10B981]' : 'bg-yellow-500'}`} />
            <span className="text-text3/70">{s.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${s.confidence === 'official' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-yellow-500/15 text-yellow-400'}`}>
              {s.confidence === 'official' ? 'Official' : 'Estimated'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 text-[10px] text-text3/40" style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
        <p>● Official — GATE qualifying marks, score formula, exam timeline (GATE 2026 official website)</p>
        <p>● Estimated — admission cutoffs, closing ranks, packages (derived from COAP/CCMT round data, institute placement reports, NIRF). Figures vary ±5-10% year to year.</p>
        <p className="mt-1">Sources: GATE official · COAP · CCMT · NIRF · AISHE · Institute placement reports</p>
        {topic.last_verified && <p className="mt-1">Last verified: {topic.last_verified}</p>}
      </div>
    </div>
  );
}

export default function InsightPage({ topic, userScore, accent }) {
  return (
    <div className="space-y-4">
      <InsightHero hero={topic.hero} accent={accent} />
      <QuickStatsRow cards={topic.stat_cards} />

      {topic.charts?.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: '#1A1A19', border: '0.5px solid rgba(255,255,255,0.06)' }}>
          <div className={`grid ${topic.charts.length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
            {topic.charts.map((chart, i) => (
              <div key={chart.id}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-text3/50 mb-2">{chart.reason}</h3>
                {renderChart(chart, topic, accent)}
              </div>
            ))}
          </div>
        </div>
      )}

      {topic.rankings?.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-white mb-2">🏅 Rankings</h3>
          <RankingTable rankings={topic.rankings} accent={accent} userScore={userScore} />
        </div>
      )}

      {topic.visual_cards?.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-white mb-2">⭐ Top Picks</h3>
          <VisualCardGrid cards={topic.visual_cards} accent={accent} />
        </div>
      )}

      {topic.analysis && <AnalysisPanel analysis={topic.analysis} />}

      {topic.expandables?.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-white mb-2">📖 Learn More</h3>
          <ExpandableSectionList expandables={topic.expandables} />
        </div>
      )}

      {topic.ai_recommendations && (
        <AIRecommendationCard recommendations={topic.ai_recommendations} userScore={userScore} accent={accent} />
      )}

      {topic.tables?.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-white mb-2">📊 Data Tables</h3>
          <DataTablesBlock tables={topic.tables} accent={accent} />
        </div>
      )}

      <ConfidenceFooter topic={topic} accent={accent} />
    </div>
  );
}

function DataTablesBlock({ tables, accent }) {
  if (!tables?.length) return null;
  return (
    <div className="space-y-3">
      {tables.map((table, ti) => (
        <div key={ti} className="overflow-x-auto rounded-xl" style={{ border: '0.5px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-text3/70" style={{ background: '#1A1A19' }}>
                {table.columns.map(col => <th key={col} className="px-3 py-2 whitespace-nowrap">{col.replace(/_/g, ' ')}</th>)}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} className="text-[12px] text-text" style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
                  {table.columns.map(col => <td key={col} className="px-3 py-2 whitespace-nowrap">{row[col] ?? '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
