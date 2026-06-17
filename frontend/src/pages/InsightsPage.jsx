import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SuccessBlueprintCard from '../components/gate/SuccessBlueprintCard';
import StrategyInsightCard from '../components/gate/StrategyInsightCard';
import QandACard from '../components/gate/QandACard';
import DSAConceptCard from '../components/gate/DSAConceptCard';
import RoadmapCard from '../components/gate/RoadmapCard';
import AIRRoadmapCard from '../components/gate/AIRRoadmapCard';
import { SUCCESS_PRINCIPLES, STUDY_BLUEPRINT } from '../data/successBlueprint';
import { STRATEGY_INSIGHTS } from '../data/strategyInsights';
import { GATE_FAQ } from '../data/gateFAQ';
import { COMMUNITY_INSIGHTS, COMMUNITY_CATEGORIES } from '../data/communityInsights';
import { DSA_CONCEPTS } from '../data/dsaRealLife';
import { ROADMAP_PHASES, AIR_ROADMAPS, TOP_RANKER_PRINCIPLES } from '../data/successRoadmap';

export default function InsightsPage() {
  const [tab, setTab] = useState('blueprint');
  const [search, setSearch] = useState('');

  const filteredPrinciples = useMemo(() => {
    if (!search.trim()) return SUCCESS_PRINCIPLES;
    const q = search.toLowerCase();
    return SUCCESS_PRINCIPLES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-xs text-primary hover:opacity-80 inline-flex items-center gap-1 mb-2">
          ← Back to Home
        </Link>
        <h1 className="text-xl font-bold text-text">GATE 2027 Insights</h1>
        <p className="text-sm text-text3 mt-0.5">Curated strategies, topper advice, and success principles — all in one place.</p>
      </div>

      <div className="flex gap-1 flex-wrap mb-5">
        {[
          { key: 'blueprint', label: `Success Blueprint (${SUCCESS_PRINCIPLES.length})` },
          { key: 'qa', label: `Q&A (${GATE_FAQ.length})` },
          { key: 'community', label: `Community (${COMMUNITY_INSIGHTS.length})` },
          { key: 'strategies', label: `Strategy Insights (${STRATEGY_INSIGHTS.length})` },
          { key: 'dsa', label: `Real-Life DSA (${DSA_CONCEPTS.length})` },
          { key: 'roadmap', label: `Roadmap (${ROADMAP_PHASES.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`text-xs px-4 py-2 rounded-lg border whitespace-nowrap transition-all ${
              tab === t.key
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-bg-2 border-border text-text3'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Search insights..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text3 focus:outline-none focus:border-primary/30"
        />
      </div>

      {tab === 'blueprint' && (
        <div>
          {/* Daily Blueprint Card */}
          <div
            className="rounded-xl p-5 mb-5"
            style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📅</span>
              <span className="text-sm font-bold text-text">{STUDY_BLUEPRINT.title}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {STUDY_BLUEPRINT.schedule.map((s) => (
                <div key={s.activity} className="bg-bg-2 border border-border rounded-lg p-3 text-center">
                  <div className="text-lg font-bold font-mono text-text">{s.hours}h</div>
                  <div className="text-[9px] text-text3 uppercase mt-0.5">{s.activity}</div>
                </div>
              ))}
            </div>
            <div className="text-center text-xs font-bold" style={{ color: '#34D399' }}>
              Total: {STUDY_BLUEPRINT.totalHours} Hours Daily
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {filteredPrinciples.map((p) => (
              <SuccessBlueprintCard key={p.id} principle={p} />
            ))}
          </div>
          {filteredPrinciples.length === 0 && (
            <div className="text-center py-12 text-sm text-text3">No principles match your search.</div>
          )}
        </div>
      )}

      {tab === 'community' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-5">
            {COMMUNITY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSearch(cat === search ? '' : cat)}
                className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                  search === cat ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {COMMUNITY_INSIGHTS.filter((item) => {
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return (
                item.q.toLowerCase().includes(q) ||
                item.a.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q) ||
                item.tags.some((t) => t.toLowerCase().includes(q))
              );
            }).map((item) => (
              <div
                key={item.id}
                className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
              >
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(236,72,153,0.1)', color: '#F472B6' }}>
                  {item.category}
                </span>
                <h3 className="text-xs font-semibold text-text mt-2 leading-relaxed">{item.q}</h3>
                <p className="text-[11px] text-text2 mt-1.5 leading-relaxed">{item.a}</p>
                <span className="text-[8px] text-text3 mt-2 block">— {item.source}</span>
              </div>
            ))}
          </div>
          {(COMMUNITY_INSIGHTS.filter((item) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
              item.q.toLowerCase().includes(q) ||
              item.a.toLowerCase().includes(q) ||
              item.category.toLowerCase().includes(q) ||
              item.tags.some((t) => t.toLowerCase().includes(q))
            );
          }).length === 0) && (
            <div className="text-center py-12 text-sm text-text3">No community insights match.</div>
          )}
        </div>
      )}

      {tab === 'qa' && (
        <div>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredPrinciples.length === SUCCESS_PRINCIPLES.length
              ? GATE_FAQ.map((item) => <QandACard key={item.id} item={item} />)
              : GATE_FAQ.filter((item) => {
                  const q = search.toLowerCase();
                  return (
                    item.q.toLowerCase().includes(q) ||
                    item.a.toLowerCase().includes(q) ||
                    item.tags.some((t) => t.toLowerCase().includes(q))
                  );
                }).map((item) => <QandACard key={item.id} item={item} />)}
          </div>
          {(filteredPrinciples.length !== SUCCESS_PRINCIPLES.length
            ? GATE_FAQ.filter((item) => {
                const q = search.toLowerCase();
                return (
                  item.q.toLowerCase().includes(q) ||
                  item.a.toLowerCase().includes(q) ||
                  item.tags.some((t) => t.toLowerCase().includes(q))
                );
              })
            : GATE_FAQ
          ).length === 0 && (
            <div className="text-center py-12 text-sm text-text3">No Q&A matches your search.</div>
          )}
        </div>
      )}

      {tab === 'strategies' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {STRATEGY_INSIGHTS.map((insight) => (
            <StrategyInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {tab === 'dsa' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-5">
            {DSA_CONCEPTS.map((c) => (
              <span
                key={c.id}
                className="text-[10px] px-3 py-1.5 rounded-full"
                style={{ background: `${c.color}10`, border: `1px solid ${c.color}20`, color: c.color }}
              >
                {c.icon} {c.title}
              </span>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {DSA_CONCEPTS.map((c) => (
              <DSAConceptCard key={c.id} concept={c} />
            ))}
          </div>
        </div>
      )}

      {tab === 'roadmap' && (
        <div>
          <div
            className="rounded-xl p-5 mb-5"
            style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🏆</span>
              <span className="text-xs font-bold text-text">Top Ranker Principles</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {TOP_RANKER_PRINCIPLES.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] text-yellow-400 font-bold mt-0.5">{i + 1}.</span>
                  <span className="text-[11px] text-text2">{p}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {AIR_ROADMAPS.map((r) => (
              <AIRRoadmapCard key={r.rank} roadmap={r} />
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {ROADMAP_PHASES.map((phase) => (
              <RoadmapCard key={phase.id} phase={phase} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
