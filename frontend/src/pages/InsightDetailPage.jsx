import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { INSIGHT_CARDS } from '../data/insightCards';
import { insightsService } from '../services/api';
import InsightVisualCard from '../components/gate/InsightVisualCard';
import { COMMUNITY_INSIGHTS } from '../data/communityInsights';
import { STRATEGY_INSIGHTS } from '../data/strategyInsights';
import { SUCCESS_PRINCIPLES } from '../data/successBlueprint';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function InsightDetailPage() {
  const { slug } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const card = INSIGHT_CARDS.find(c => slugify(c.title) === slug);
  const community = COMMUNITY_INSIGHTS.find(c => slugify(c.q || c.title || '') === slug);
  const strategy = STRATEGY_INSIGHTS.find(s => slugify(s.title) === slug);
  const principle = SUCCESS_PRINCIPLES.find(p => slugify(p.title) === slug);

  useEffect(() => {
    insightsService.getBySlug(slug)
      .then(r => setTopic(r.data?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const title = topic?.title || card?.title || community?.q || strategy?.title || principle?.title || 'Untitled';
  const icon = card?.icon || '📄';
  const isInsightTopic = topic && card;

  if (!loading && !topic && !card && !community && !strategy && !principle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-4 opacity-40">📄</span>
        <h1 className="text-lg font-bold text-white">Insight not found</h1>
        <Link to="/insights" className="text-xs text-purple-400 mt-2 hover:text-purple-300 transition-colors">← Back to Insights</Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/insights" className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors mb-6">
        ← Back to Insights
      </Link>

      {isInsightTopic && (
        <>
          <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.04))', border: '1px solid rgba(139,92,246,0.12)' }}>
            <span className="text-3xl mb-3 block">{icon}</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>
            {card?.desc && <p className="text-sm text-text3/70 mt-2">{card.desc}</p>}
          </div>

          <InsightVisualCard topic={{ ...topic, title, icon }} />

          {topic.content && (
            <div className="mt-6 rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Full Analysis</h3>
              <div className="text-[11px] text-text2/80 leading-relaxed whitespace-pre-line">
                {topic.content}
              </div>
            </div>
          )}
        </>
      )}

      {!isInsightTopic && topic && (
        <>
          <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.04))', border: '1px solid rgba(139,92,246,0.12)' }}>
            <span className="text-3xl mb-3 block">{icon}</span>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>
            {card?.desc && <p className="text-sm text-text3/70 mt-2">{card.desc}</p>}
          </div>
          {topic.content && (
            <div className="rounded-xl p-4 text-xs text-text2/80 leading-relaxed whitespace-pre-line" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {topic.content}
            </div>
          )}
        </>
      )}

      {community && (
        <div className="mt-6 rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm text-text2/80 leading-relaxed">{community.a}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {(community.tags || []).map(t => <span key={t} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#C4B5FD' }}>#{t}</span>)}
          </div>
          {community.source && <p className="text-[10px] text-text3/40 mt-3">Source: {community.source}</p>}
        </div>
      )}

      {strategy && (
        <div className="mt-6 space-y-4">
          {strategy.phases?.map((phase, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold text-white">{phase.name}</h3>
              {phase.duration && <span className="text-[10px] text-purple-400">{phase.duration}</span>}
              <ul className="mt-2 space-y-1">
                {(phase.points || []).map((p, j) => (
                  <li key={j} className="text-xs text-text2/80 flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      )}

      {principle && (
        <div className="mt-6 space-y-3">
          {principle.summary && <p className="text-sm text-text2/80 leading-relaxed rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>{principle.summary}</p>}
          {(principle.details || []).map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-text2/80">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>{d}</span>
            </div>
          ))}
          {principle.gatenexaTip && (
            <div className="rounded-xl p-4 mt-3" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
              <span className="text-[10px] font-bold text-purple-400">💡 GateNexa Tip: </span>
              <span className="text-xs text-text2/80">{principle.gatenexaTip}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
