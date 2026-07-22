import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { INSIGHT_CARDS } from '../data/insightCards';
import { COMMUNITY_INSIGHTS } from '../data/communityInsights';
import { STRATEGY_INSIGHTS } from '../data/strategyInsights';
import { SUCCESS_PRINCIPLES } from '../data/successBlueprint';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const CARD_DETAILS = {
  'highest-closing-scores': {
    icon: '📈',
    sections: [
      { title: 'IIT Bombay', content: 'CSE: AIR 14 (Score ~860), AI: AIR 11 (Score ~925), DS: AIR 12 (Score ~852)' },
      { title: 'IIT Delhi', content: 'CSE: AIR 19 (Score ~800), CyberSec: AIR 40 (Score ~710), MI & DS: AIR 38 (Score ~720)' },
      { title: 'IIT Madras', content: 'CSE: AIR 7 (Score ~881), DS: AIR 11 (Score ~843)' },
      { title: 'IIT Kanpur', content: 'CSE: AIR 33 (Score ~740)' },
      { title: 'IIT Kharagpur', content: 'CSE: AIR 28 (Score ~772), Signal Proc: AIR 73 (Score ~588), VLSI: AIR 39 (Score ~717)' },
      { title: 'IIT Roorkee', content: 'CSE: AIR 36 (Score ~712), AI: AIR 41 (Score ~683), DS: AIR 41 (Score ~683)' },
      { title: 'IIT (ISM) Dhanbad', content: 'AI & DS: AIR 41 (Score ~685)' },
      { title: 'IIT Patna', content: 'CSE: AIR 80 (Score ~580)' },
      { title: 'IIT Ropar', content: 'AI: AIR 43 (Score ~678)' },
      { title: 'NIT Trend', content: 'Top NITs accept scores in the 500-650 range for CSE, with placements averaging ₹6-20L.' },
    ],
    source: 'CCMT 2025 cutoff dataset',
  },
};

export default function InsightDetailPage() {
  const { slug } = useParams();
  const card = INSIGHT_CARDS.find(c => slugify(c.title) === slug);
  const detail = CARD_DETAILS[slug];
  const community = COMMUNITY_INSIGHTS.find(c => slugify(c.q || c.title || '') === slug);
  const strategy = STRATEGY_INSIGHTS.find(s => slugify(s.title) === slug);
  const principle = SUCCESS_PRINCIPLES.find(p => slugify(p.title) === slug);

  if (!card && !detail && !community && !strategy && !principle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-4 opacity-40">📄</span>
        <h1 className="text-lg font-bold text-white">Insight not found</h1>
        <Link to="/insights" className="text-xs text-purple-400 mt-2 hover:text-purple-300 transition-colors">← Back to Insights</Link>
      </div>
    );
  }

  const title = card?.title || community?.q || strategy?.title || principle?.title || 'Untitled';
  const icon = card?.icon || '📄';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/insights" className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors mb-6">
        ← Back to Insights
      </Link>

      <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.04))', border: '1px solid rgba(139,92,246,0.12)' }}>
        <span className="text-3xl mb-3 block">{icon}</span>
        <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>
        {card?.desc && <p className="text-sm text-text3/70 mt-2">{card.desc}</p>}
      </div>

      {detail?.sections && (
        <div className="space-y-3">
          {detail.sections.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
              <p className="text-xs text-text3/70 leading-relaxed">{s.content}</p>
            </motion.div>
          ))}
          {detail.source && <p className="text-[10px] text-text3/40 mt-4">Source: {detail.source}</p>}
        </div>
      )}

      {community && (
        <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm text-text2/80 leading-relaxed">{community.a}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {(community.tags || []).map(t => <span key={t} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#C4B5FD' }}>#{t}</span>)}
          </div>
          {community.source && <p className="text-[10px] text-text3/40 mt-3">Source: {community.source}</p>}
        </div>
      )}

      {strategy && (
        <div className="space-y-4">
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
        <div className="space-y-3">
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
          {(principle.tags || []).map(t => <span key={t} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#C4B5FD' }}>#{t}</span>)}
        </div>
      )}
    </motion.div>
  );
}
