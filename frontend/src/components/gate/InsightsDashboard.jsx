import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { INSIGHT_CARDS } from '../../data/insightCards';
import { insightsService } from '../../services/api';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function InsightsDashboard() {
  const [topicData, setTopicData] = useState({});

  useEffect(() => {
    insightsService.list().then(r => {
      const map = {};
      (r.data?.data || []).forEach(t => { map[t.title] = t; });
      setTopicData(map);
    }).catch(() => {});
  }, []);

  const cards = INSIGHT_CARDS.map((card, i) => {
    const data = topicData[card.title];
    const summary = data?.summary || card.desc;
    return (
      <motion.div
        key={card.title}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04 }}
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{card.icon}</span>
            <div>
              <h3 className="text-sm font-bold text-white">{card.title}</h3>
              <p className="text-[11px] text-text3/60 mt-0.5 leading-relaxed">{summary}</p>
            </div>
          </div>
          <Link
            to={card.link}
            className="inline-flex items-center self-start gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all mt-auto"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#C4B5FD' }}
          >
            View Details →
          </Link>
        </div>
      </motion.div>
    );
  });

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards}
      </div>
      <div className="mt-4 rounded-xl p-3 text-[10px] text-text3/50 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        Data reflects 2025-26 admission cycle. GATE 2027 figures will be available after results (~March 2027).
      </div>
    </div>
  );
}
