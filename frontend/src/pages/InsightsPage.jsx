import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SuccessBlueprintCard from '../components/gate/SuccessBlueprintCard';
import StrategyInsightCard from '../components/gate/StrategyInsightCard';
import QandACard from '../components/gate/QandACard';
import DSAConceptCard from '../components/gate/DSAConceptCard';
import RoadmapCard from '../components/gate/RoadmapCard';
import AIRRoadmapCard from '../components/gate/AIRRoadmapCard';
import SubjectInsightCard from '../components/gate/SubjectInsightCard';
import HighROITable from '../components/gate/HighROITable';
import MistakePatternCard from '../components/gate/MistakePatternCard';
import { SUCCESS_PRINCIPLES, STUDY_BLUEPRINT } from '../data/successBlueprint';
import { STRATEGY_INSIGHTS } from '../data/strategyInsights';
import { GATE_FAQ } from '../data/gateFAQ';
import { COMMUNITY_INSIGHTS, COMMUNITY_CATEGORIES } from '../data/communityInsights';
import { DSA_CONCEPTS } from '../data/dsaRealLife';
import { ROADMAP_PHASES, AIR_ROADMAPS, TOP_RANKER_PRINCIPLES } from '../data/successRoadmap';
import { GATE_SUBJECTS } from '../data/gateSubjectsData';
import { HIGH_ROI_TOPICS, SUBJECT_FILTERS, PRIORITY_FILTERS, DIFFICULTY_FILTERS } from '../data/highRoiTopicsData';
import { MISTAKE_CATEGORIES } from '../data/mistakePatternsData';

export default function InsightsPage() {
  const [tab, setTab] = useState('blueprint');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState({});

  const toggleShowAll = (key) => setShowAll(prev => ({ ...prev, [key]: !prev[key] }));
  const INITIAL_LIMIT = 10;

  const TABS = [
    { key: 'blueprint', label: `Success Blueprint (${SUCCESS_PRINCIPLES.length})` },
    { key: 'qa', label: `Q&A (${GATE_FAQ.length})` },
    { key: 'subjects', label: `Subjects (${GATE_SUBJECTS.length})` },
    { key: 'high-roi', label: 'High ROI Topics' },
    { key: 'mistakes', label: 'Mistake Patterns' },
    { key: 'strategies', label: `Strategy Insights (${STRATEGY_INSIGHTS.length})` },
    { key: 'community', label: `Community (${COMMUNITY_INSIGHTS.length})` },
    { key: 'dsa', label: `DSA (${DSA_CONCEPTS.length})` },
    { key: 'roadmap', label: `Roadmap (${ROADMAP_PHASES.length})` },
  ];

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

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return GATE_SUBJECTS;
    const q = search.toLowerCase();
    return GATE_SUBJECTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.highRoiTopics.some((t) => t.toLowerCase().includes(q)) ||
        s.keyInsight.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredMistakes = useMemo(() => {
    if (!search.trim()) return MISTAKE_CATEGORIES;
    const q = search.toLowerCase();
    return MISTAKE_CATEGORIES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.commonPatterns.some((p) => p.pattern.toLowerCase().includes(q))
    );
  }, [search]);

  const filteredStrategies = useMemo(() => {
    if (!search.trim()) return STRATEGY_INSIGHTS;
    const q = search.toLowerCase();
    return STRATEGY_INSIGHTS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary?.toLowerCase().includes(q) ||
        s.phases?.some((p) => p.toLowerCase().includes(q)) ||
        s.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-xs text-primary hover:opacity-80 inline-flex items-center gap-1 mb-2">
          ΓåÉ Back to Home
        </Link>
        <h1 className="text-xl font-bold text-text">GATE 2027 Insights</h1>
        <p className="text-sm text-text3 mt-0.5">Curated strategies, topper advice, subject insights, and success principles ΓÇö powered by 8 expert sources.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap mb-5">
        {TABS.map((t) => (
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

      {/* Global Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search insights, questions, subjects, mistakes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text3 focus:outline-none focus:border-primary/30"
        />
      </div>

      {/* Tab: Success Blueprint */}
      {tab === 'blueprint' && (
        <div>
          <div
            className="rounded-xl p-5 mb-5"
            style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">≡ƒôà</span>
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

      {/* Tab: Q&A */}
      {tab === 'qa' && (
        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(() => {
              const allCats = [...new Set(GATE_FAQ.flatMap(item => item.tags || []))].sort();
              return ['All', ...allCats].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSearch(cat === 'All' ? '' : cat)}
                  className={`text-[9px] px-2.5 py-1 rounded-full border transition-all ${
                    (cat === 'All' && !search) || search === cat ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'
                  }`}
                >
                  {cat === 'All' ? 'All' : cat}
                </button>
              ));
            })()}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {GATE_FAQ.filter((item) => {
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return (
                item.q.toLowerCase().includes(q) ||
                item.a.toLowerCase().includes(q) ||
                (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
              );
            }).slice(0, showAll.qa ? undefined : INITIAL_LIMIT).map((item) => (
              <QandACard key={item.id} item={item} />
            ))}
          </div>
          {!showAll.qa && GATE_FAQ.length > INITIAL_LIMIT && (
            <div className="text-center mt-4">
              <button onClick={() => toggleShowAll('qa')} className="text-xs px-5 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-medium">
                View More Q&A ({GATE_FAQ.length - INITIAL_LIMIT} more)
              </button>
            </div>
          )}
          {GATE_FAQ.length === 0 && (
            <div className="text-center py-12 text-sm text-text3">No Q&A available yet.</div>
          )}
        </div>
      )}

      {/* Tab: Subjects */}
      {tab === 'subjects' && (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {GATE_SUBJECTS.map((s) => (
              <span
                key={s.id}
                className="text-[9px] px-2.5 py-1 rounded-full"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}20`, color: s.color }}
              >
                {s.icon} {s.name}
              </span>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredSubjects.slice(0, showAll.subjects ? undefined : INITIAL_LIMIT).map((s) => (
              <SubjectInsightCard key={s.id} subject={s} />
            ))}
          </div>
          {!showAll.subjects && filteredSubjects.length > INITIAL_LIMIT && (
            <div className="text-center mt-4">
              <button onClick={() => toggleShowAll('subjects')} className="text-xs px-5 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-medium">
                View More Subjects ({filteredSubjects.length - INITIAL_LIMIT} more)
              </button>
            </div>
          )}
          {filteredSubjects.length === 0 && (
            <div className="text-center py-12 text-sm text-text3">No subjects match your search.</div>
          )}
        </div>
      )}

      {/* Tab: High ROI Topics */}
      {tab === 'high-roi' && (
        <div>
          <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
            <p className="text-[11px] text-text2 leading-relaxed">
              <span className="font-bold text-text">32 topics ranked by ROI</span> across all GATE CSE subjects.
              Sorted by marks-per-hour efficiency based on historical question frequency and difficulty.
              Focus on <span style={{ color: '#EF4444' }}>Critical</span> priority topics first.
            </p>
          </div>
          <HighROITable
            topics={HIGH_ROI_TOPICS}
            subjectFilters={SUBJECT_FILTERS}
            priorityFilters={PRIORITY_FILTERS}
            difficultyFilters={DIFFICULTY_FILTERS}
          />
        </div>
      )}

      {/* Tab: Mistake Patterns */}
      {tab === 'mistakes' && (
        <div>
          <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
            <p className="text-[11px] text-text2 leading-relaxed">
              <span className="font-bold text-text">6 mistake categories</span> with symptoms, prevention strategies, and recovery plans.
              Tracking and eliminating mistakes is the <span className="text-text font-bold">single highest-impact activity</span> for rank improvement.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredMistakes.map((m) => (
              <MistakePatternCard key={m.id} category={m} />
            ))}
          </div>
          {filteredMistakes.length === 0 && (
            <div className="text-center py-12 text-sm text-text3">No mistake patterns match your search.</div>
          )}
        </div>
      )}

      {/* Tab: Community */}
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
            }).slice(0, showAll.community ? undefined : INITIAL_LIMIT).map((item) => (
              <div
                key={item.id}
                className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
              >
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(236,72,153,0.1)', color: '#F472B6' }}>
                  {item.category}
                </span>
                <h3 className="text-xs font-semibold text-text mt-2 leading-relaxed">{item.q}</h3>
                <p className="text-[11px] text-text2 mt-1.5 leading-relaxed">{item.a}</p>
                <span className="text-[8px] text-text3 mt-2 block">ΓÇö {item.source}</span>
              </div>
            ))}
          </div>
          {!showAll.community && COMMUNITY_INSIGHTS.filter((item) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
              item.q.toLowerCase().includes(q) ||
              item.a.toLowerCase().includes(q) ||
              item.category.toLowerCase().includes(q) ||
              item.tags.some((t) => t.toLowerCase().includes(q))
            );
          }).length > INITIAL_LIMIT && (
            <div className="text-center mt-4">
              <button onClick={() => toggleShowAll('community')} className="text-xs px-5 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-medium">
                View More Insights
              </button>
            </div>
          )}
          {(COMMUNITY_INSIGHTS.length === 0) && (
            <div className="text-center py-12 text-sm text-text3">No community insights available.</div>
          )}
        </div>
      )}

      {/* Tab: Strategy Insights */}
      {tab === 'strategies' && (
        <div>
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredStrategies.slice(0, showAll.strategies ? undefined : INITIAL_LIMIT).map((insight) => (
              <StrategyInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
          {!showAll.strategies && filteredStrategies.length > INITIAL_LIMIT && (
            <div className="text-center mt-4">
              <button onClick={() => toggleShowAll('strategies')} className="text-xs px-5 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-medium">
                View More Strategies ({filteredStrategies.length - INITIAL_LIMIT} more)
              </button>
            </div>
          )}
          {filteredStrategies.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-text3">No strategies match your search.</div>
          )}
        </div>
      )}

      {/* Tab: DSA */}
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
            {DSA_CONCEPTS.slice(0, showAll.dsa ? undefined : INITIAL_LIMIT).map((c) => (
              <DSAConceptCard key={c.id} concept={c} />
            ))}
          </div>
          {!showAll.dsa && DSA_CONCEPTS.length > INITIAL_LIMIT && (
            <div className="text-center mt-4">
              <button onClick={() => toggleShowAll('dsa')} className="text-xs px-5 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-medium">
                View More DSA Concepts ({DSA_CONCEPTS.length - INITIAL_LIMIT} more)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Roadmap */}
      {tab === 'roadmap' && (
        <div>
          <div
            className="rounded-xl p-5 mb-5"
            style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">≡ƒÅå</span>
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
            {(showAll.roadmap ? ROADMAP_PHASES : ROADMAP_PHASES.slice(0, 7)).map((phase) => (
              <RoadmapCard key={phase.id} phase={phase} />
            ))}
          </div>
          {!showAll.roadmap && ROADMAP_PHASES.length > 7 && (
            <div className="text-center mt-4">
              <button onClick={() => toggleShowAll('roadmap')} className="text-xs px-5 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-medium">
                View More Roadmaps ({ROADMAP_PHASES.length - 7} more)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
