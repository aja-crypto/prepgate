import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import INSIGHT_TOPICS, { getTopicBySlug, TOPIC_ACCENTS } from '../data/insightTopics';
import InsightPage from '../components/insights/InsightPage';
import { predictorService } from '../services/api';

const UI_CATEGORY_TO_DB = { 'General': 'General', 'OBC': 'OBC-NCL', 'EWS': 'EWS', 'SC': 'SC', 'ST': 'ST', 'PwD': 'PwD' };

function shortInstitute(name = '') {
  return name
    .replace('Indian Institute of Technology', 'IIT')
    .replace('National Institute of Technology', 'NIT')
    .replace('Indian Institute of Science', 'IISc')
    .replace(/^Indian Institute of Information Technology/, 'IIIT');
}

// Build the "Highest Closing Scores" topic entirely from the live verified CCMT source.
// If no verified data is available, returns a topic with fabricated sections removed and
// a clear non-fabricated notice instead of invented numbers.
function buildHighestClosingTopic(base, rows, categoryUi, isLoading) {
  const topic = { ...base };
  if (!rows || rows.length === 0) {
    return {
      ...topic,
      stat_cards: [],
      rankings: [],
      visual_cards: [],
      charts: [],
      tier_scores: [],
      dataNotice: isLoading
        ? 'Loading verified closing-score data…'
        : 'Verified closing-score data is currently unavailable. Use the Opportunity Predictor for live, DB-backed estimates.',
    };
  }
  const top = rows.slice(0, 10);
  const ranked = top.map((r, i) => ({
    rank: i + 1,
    institute: shortInstitute(r.institute),
    programme: r.program,
    closing_score_est: r.closingScore,
    closing_score_confidence: r.dataStatus === 'verified' ? 'official' : 'estimated',
    category: r.category,
    year: r.year,
    round: r.round,
  }));
  const statCards = [
    { id: 'live_highest', label: 'Highest verified closing', value: top[0].closingScore, unit: 'score', confidence: top[0].dataStatus === 'verified' ? 'official' : 'estimated' },
    { id: 'live_count', label: 'Verified programmes shown', value: rows.length, unit: 'rows', confidence: 'official' },
    { id: 'live_year', label: 'Data year', value: top[0].year || '—', unit: '', confidence: 'official' },
    { id: 'qualifying_general', label: 'Qualifying mark (General)', value: 30, unit: 'score', confidence: 'official' },
  ];
  return {
    ...topic,
    stat_cards: statCards,
    rankings: ranked,
    visual_cards: top.slice(0, 5).map((r, i) => ({
      rank: i + 1,
      institute: shortInstitute(r.institute),
      expected_score: `${r.closingScore}+`,
      difficulty: r.closingScore > 800 ? 'extreme' : r.closingScore > 700 ? 'high' : 'moderate',
      competition_stars: r.closingScore > 800 ? 5 : r.closingScore > 700 ? 4 : 3,
    })),
    tier_scores: top.map(r => ({ label: shortInstitute(r.institute), high: r.closingScore })),
    charts: [
      { type: 'horizontal_bar', id: 'live_tier_comparison', reason: `Verified closing scores (${categoryUi}) — top IIT programmes`, data_ref: 'tier_scores' },
    ],
    dataNotice: null,
  };
}

function DesktopSidebar({ topics, activeId, onSelect, userScore, setUserScore, userCategory, setUserCategory }) {
  return (
    <div className="w-[260px] shrink-0 space-y-4">
      <div className="rounded-xl p-4 sticky top-4" style={{ background: '#1A1A19', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎯</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text3">Your Score</span>
        </div>
        <input
          type="number"
          placeholder="Enter GATE score"
          value={userScore || ''}
          onChange={e => setUserScore(Number(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-text3/40 focus:outline-none focus:border-primary/50 transition-colors"
        />
        <div className="relative mt-2">
          <select
            value={userCategory}
            onChange={e => setUserCategory(e.target.value)}
            className="w-full appearance-none px-3 py-2 rounded-lg text-sm text-white border cursor-pointer focus:outline-none focus:border-primary/50 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <option value="General" className="bg-[#1A1A19]">General</option>
            <option value="OBC" className="bg-[#1A1A19]">OBC</option>
            <option value="EWS" className="bg-[#1A1A19]">EWS</option>
            <option value="SC" className="bg-[#1A1A19]">SC</option>
            <option value="ST" className="bg-[#1A1A19]">ST</option>
            <option value="PwD" className="bg-[#1A1A19]">PwD</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text3/50 pointer-events-none text-[10px]">▼</span>
        </div>
        {userScore > 0 && (
          <div className="mt-3 pt-3 text-center" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div className="text-2xl font-bold tabular-nums" style={{ color: TOPIC_ACCENTS[activeId] || '#8B5CF6' }}>
              {userScore}
            </div>
            <div className="text-[9px] text-text3/50">{userCategory}</div>
          </div>
        )}
      </div>

      <nav className="space-y-0.5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-text3/50 px-3 mb-2">Topics</div>
        {topics.map(t => (
          <button
            key={t.topic_id}
            onClick={() => onSelect(t.topic_id)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-[12px]"
            style={{
              background: activeId === t.topic_id ? `${t.accent}15` : 'transparent',
              color: activeId === t.topic_id ? t.accent : 'rgba(255,255,255,0.6)',
              borderLeft: activeId === t.topic_id ? `2px solid ${t.accent}` : '2px solid transparent'
            }}
          >
            <span className="text-sm">{t.hero.icon}</span>
            <span className="truncate">{t.hero.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function MobileTopicSheet({ topics, activeId, onSelect, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl md:hidden"
            style={{ background: '#1A1A19', border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            <div className="sticky top-0 pt-3 pb-2 px-4" style={{ background: '#1A1A19' }}>
              <div className="w-8 h-1 rounded-full bg-white/[0.15] mx-auto mb-3" />
              <div className="text-[10px] font-bold uppercase tracking-wider text-text3/50">Browse Insights</div>
            </div>
            <div className="px-2 pb-4 space-y-0.5">
              {topics.map(t => (
                <button
                  key={t.topic_id}
                  onClick={() => { onSelect(t.topic_id); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-[13px]"
                  style={{
                    background: activeId === t.topic_id ? `${t.accent}15` : 'transparent',
                    color: activeId === t.topic_id ? t.accent : 'rgba(255,255,255,0.6)'
                  }}
                >
                  <span className="text-lg">{t.hero.icon}</span>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{t.hero.title}</div>
                    <div className="text-[10px] text-text3/50 truncate">{t.hero.takeaway}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function InsightsHub() {
  const [activeId, setActiveId] = useState('highest-closing-scores');
  const [userScore, setUserScore] = useState(0);
  const [userCategory, setUserCategory] = useState('General');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [categories] = useState(INSIGHT_TOPICS);
  const [liveCutoffs, setLiveCutoffs] = useState(null);
  const [cutoffLoading, setCutoffLoading] = useState(false);

  const dbCategory = UI_CATEGORY_TO_DB[userCategory] || 'General';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setCutoffLoading(true);
      try {
        const res = await predictorService.getTopClosingScores({ category: dbCategory, instituteType: 'IIT', limit: 15 });
        if (!cancelled) setLiveCutoffs(res?.data?.data || null);
      } catch {
        if (!cancelled) setLiveCutoffs(null);
      } finally {
        if (!cancelled) setCutoffLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [dbCategory]);

  const activeTopic = (() => {
    const base = getTopicBySlug(activeId);
    if (!base) return null;
    if (base.topic_id === 'highest-closing-scores') {
      return buildHighestClosingTopic(base, cutoffLoading ? null : liveCutoffs, userCategory, cutoffLoading);
    }
    return base;
  })();
  const accent = activeTopic?.accent || '#8B5CF6';

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: '#0B0B0B' }}>
      {/* Top tab bar for tablet */}
      <div className="md:hidden overflow-x-auto sticky top-0 z-30 py-2 px-4" style={{ background: '#0B0B0B', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1">
          {categories.map(t => (
            <button
              key={t.topic_id}
              onClick={() => setActiveId(t.topic_id)}
              className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap"
              style={{
                background: activeId === t.topic_id ? `${t.accent}15` : 'rgba(255,255,255,0.03)',
                color: activeId === t.topic_id ? t.accent : 'rgba(255,255,255,0.5)',
                border: activeId === t.topic_id ? `0.5px solid ${t.accent}30` : '0.5px solid rgba(255,255,255,0.06)'
              }}
            >
              <span>{t.hero.icon}</span>
              <span className="hidden sm:inline">{t.hero.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <div className="hidden md:block">
            <DesktopSidebar
              topics={categories}
              activeId={activeId}
              onSelect={setActiveId}
              userScore={userScore}
              setUserScore={setUserScore}
              userCategory={userCategory}
              setUserCategory={setUserCategory}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {activeTopic ? (
              <InsightPage topic={activeTopic} userScore={userScore} accent={accent} />
            ) : (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="text-4xl mb-4 opacity-40">📊</div>
                <p className="text-sm text-text3/60">Select a topic from the sidebar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet trigger */}
      <button
        onClick={() => setMobileSheetOpen(true)}
        className="fixed bottom-6 right-6 z-30 md:hidden w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xl"
        style={{ background: accent, color: '#fff' }}
      >
        📊
      </button>

      <MobileTopicSheet
        topics={categories}
        activeId={activeId}
        onSelect={setActiveId}
        isOpen={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
      />

      {/* Score input for mobile */}
      {userScore === 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-30 md:hidden">
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: '#1A1A19', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <input
              type="number"
              placeholder="Enter your GATE score"
              value={userScore || ''}
              onChange={e => setUserScore(Number(e.target.value) || 0)}
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-text3/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}
