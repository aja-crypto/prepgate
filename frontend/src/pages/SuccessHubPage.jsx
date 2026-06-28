import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../design/tokens';
import { GATE_FACTS, FACT_CATEGORIES, getDailyFact } from '../data/gateFacts';
import {
  TOPPER_ADVICE,
  HIGH_SCORING_AREAS,
  PAREto_PRINCIPLE,
  COMMON_MISTAKES,
  DAILY_FORMULA,
  AI_MENTOR_MESSAGES,
} from '../data/successHub';
import { DSA_CONCEPTS } from '../data/dsaRealLife';
import { ROADMAP_PHASES, AIR_ROADMAPS, TOP_RANKER_PRINCIPLES } from '../data/successRoadmap';
import DSAConceptCard from '../components/gate/DSAConceptCard';
import RoadmapCard from '../components/gate/RoadmapCard';

const SECTIONS = [
  { key: 'roadmap', label: 'Roadmap', icon: '🗺️' },
  { key: 'advice', label: 'Topper Advice', icon: '🏆' },
  { key: 'highscoring', label: 'High Scoring', icon: '🎯' },
  { key: 'dsa', label: 'DSA in Real Life', icon: '🧠' },
  { key: 'mistakes', label: 'Common Mistakes', icon: '🚨' },
  { key: 'formula', label: 'Daily Formula', icon: '💡' },
  { key: 'facts', label: 'GATE Facts', icon: '🧐' },
  { key: 'ai', label: 'AI Mentor', icon: '🤖' },
];

function SectionBadge({ label, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
        active
          ? 'bg-primary/15 border-primary/30 text-primary'
          : 'text-gray-400 border-transparent hover:border-gray-700 hover:text-gray-300'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function AccordionSection({ title, icon, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="text-sm font-bold text-white flex items-center gap-2">
          <span>{icon}</span> {title}
        </span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function SuccessHubPage() {
  const [section, setSection] = useState('roadmap');
  const [factFilter, setFactFilter] = useState('All');
  const [aiMsgIndex, setAiMsgIndex] = useState(
    new Date().getDate() % AI_MENTOR_MESSAGES.length
  );

  const filteredFacts = factFilter === 'All'
    ? GATE_FACTS
    : GATE_FACTS.filter((f) => f.category === factFilter);

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden">
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>
            <svg viewBox="0 0 32 32" fill="none" className="w-4 h-4"><path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span className="text-sm font-bold text-white">{BRAND.name}</span>
        </Link>
        <Link to="/" className="text-xs text-gray-400 hover:text-white px-3 py-2 transition-colors">← Back</Link>
      </nav>

      <div className="px-6 pb-16 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#A78BFA' }}>
            🚀 GATE 2027 Success Hub
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3">Your Complete Success Hub</h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Roadmaps, topper advice, DSA in real life, daily formula, GATE facts, and AI mentor messages — 
            everything you need to crack GATE 2027 in one place.
          </p>
        </div>

        {/* Section Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SECTIONS.map((s) => (
            <SectionBadge
              key={s.key}
              icon={s.icon}
              label={s.label}
              active={section === s.key}
              onClick={() => setSection(s.key)}
            />
          ))}
        </div>

        {/* Fact of the Day — always visible */}
        <div className="mb-8 p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-400">Fact of the Day</span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">
            <span className="text-base mr-2">{getDailyFact().icon}</span>
            {getDailyFact().fact}
          </p>
          <span className="text-[10px] text-gray-500 mt-1.5 block">{getDailyFact().category}</span>
        </div>

        {/* === ROADMAP === */}
        {section === 'roadmap' && (
          <div className="space-y-6">
            {/* AIR Targets */}
            <div>
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span>🎯</span> Choose Your AIR Target
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {AIR_ROADMAPS.map((r) => (
                  <div key={r.rank} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{r.icon}</span>
                      <span className="text-sm font-bold text-white">{r.rank}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-3">{r.description}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(r.stats).map(([k, v]) => (
                        <div key={k} className="text-center p-2 rounded-lg" style={{ background: `${r.color}08`, border: `1px solid ${r.color}15` }}>
                          <div className="text-[11px] font-bold text-white">{v}</div>
                          <div className="text-[8px] text-gray-500 uppercase">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Ranker Principles */}
            <AccordionSection title="Top Ranker Principles" icon="🏆" defaultOpen>
              <div className="grid sm:grid-cols-2 gap-2">
                {TOP_RANKER_PRINCIPLES.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-[10px] text-yellow-400 font-bold mt-0.5">{i + 1}.</span>
                    <span className="text-[11px] text-gray-400">{p}</span>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* Monthly Phases */}
            <div>
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span>📅</span> Month-by-Month Strategy
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {ROADMAP_PHASES.map((phase) => (
                  <RoadmapCard key={phase.id} phase={phase} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === TOPPER ADVICE === */}
        {section === 'advice' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">The most repeated advice from GATE toppers and successful rankers.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {TOPPER_ADVICE.map((a) => (
                <div key={a.id} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${a.color}15`, border: `1px solid ${a.color}30` }}>
                      {a.icon}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white mb-1">{a.title}</h3>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{a.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* High Scoring Area */}
            <div className="mt-8">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span>🎯</span> High Scoring Areas
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {HIGH_SCORING_AREAS.map((a) => (
                  <div key={a.subject} className="rounded-2xl p-4 text-center" style={{ background: `${a.color}08`, border: `1px solid ${a.color}20` }}>
                    <span className="text-2xl mb-2 block">{a.icon}</span>
                    <div className="text-xl font-bold text-white">{a.marks}</div>
                    <div className="text-xs text-gray-400">Marks</div>
                    <div className="text-xs font-semibold text-white mt-1">{a.subject}</div>
                    <p className="text-[10px] text-gray-500 mt-2">{a.recommendation}</p>
                  </div>
                ))}
              </div>
              <div className="text-center text-sm font-bold text-white mb-2">
                Total: <span className="text-yellow-400">28 Marks</span>
              </div>
              <p className="text-center text-[10px] text-gray-500">Daily Recommendation: 45 Minutes Minimum</p>
            </div>

            {/* Pareto */}
            <div className="mt-6 p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <span>🔥</span> {PAREto_PRINCIPLE.title}
              </h3>
              <p className="text-[11px] text-gray-400 mb-3">{PAREto_PRINCIPLE.description}</p>
              <div className="space-y-1.5">
                {PAREto_PRINCIPLE.tips.map((t) => (
                  <div key={t} className="flex items-start gap-2">
                    <span className="text-[10px] mt-0.5" style={{ color: '#F59E0B' }}>→</span>
                    <span className="text-[11px] text-gray-400">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === DSA IN REAL LIFE === */}
        {section === 'dsa' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">
              Stop memorizing definitions. Understand data structures through real-world systems you use every day.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {DSA_CONCEPTS.map((c) => (
                <DSAConceptCard key={c.id} concept={c} />
              ))}
            </div>
          </div>
        )}

        {/* === COMMON MISTAKES === */}
        {section === 'mistakes' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">Avoid these common pitfalls that cost students their rank.</p>
            {COMMON_MISTAKES.map((m) => (
              <div key={m.mistake} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-lg">{m.icon}</span>
                <span className="text-xs text-gray-300 flex-1">{m.mistake}</span>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: m.severity === 'Critical' ? 'rgba(239,68,68,0.15)' : m.severity === 'High' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                    color: m.severity === 'Critical' ? '#F87171' : m.severity === 'High' ? '#FBBF24' : '#818CF8',
                  }}
                >
                  {m.severity}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* === DAILY FORMULA === */}
        {section === 'formula' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-1">Study = Theory + PYQ + Revision</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {DAILY_FORMULA.blocks.map((b) => (
                <div key={b.label} className="rounded-2xl p-4 text-center" style={{ background: `${b.color}08`, border: `1px solid ${b.color}20` }}>
                  <span className="text-2xl mb-2 block">{b.icon}</span>
                  <div className="text-xl font-bold text-white">{b.hours}h</div>
                  <div className="text-[10px] text-gray-400 uppercase mt-1">{b.label}</div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-white">Total: 7 Hours / Day</span>
              <p className="text-[10px] text-gray-500 mt-1">Adjust based on your target and current progress</p>
            </div>

            {/* GateNexa Promise */}
            <div className="mt-8 p-4 rounded-2xl" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <span>📜</span> GateNexa Promise
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                GateNexa does not claim ownership of all educational resources. Resources are collected and organized 
                from various publicly available educational sources to help aspirants save time and study efficiently. 
                Wherever possible, credit will be given to the original creators, websites, and educators. If any 
                creator wishes to modify attribution or remove content, they can contact us and we will review the 
                request promptly.
              </p>
            </div>

            {/* Final Message */}
            <div className="p-5 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.04))', border: '1px solid rgba(124,58,237,0.12)' }}>
              <p className="text-sm font-bold text-white mb-2">❤️ See You At IIT, NIT, IIIT, IISc, PSU, or Your Dream College Soon.</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Stay Consistent. Trust The Process. Keep Revising. Keep Solving PYQs.
              </p>
              <p className="text-[11px] text-gray-500 mt-2">GateNexa Will Handle The Organization. 🚀</p>
            </div>
          </div>
        )}

        {/* === GATE FACTS === */}
        {section === 'facts' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {FACT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFactFilter(cat)}
                  className={`text-[10px] px-3 py-1.5 rounded-full border transition-all ${
                    factFilter === cat
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'bg-transparent border-gray-700 text-gray-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredFacts.map((f) => (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-base flex-shrink-0 mt-0.5">{f.icon}</span>
                  <div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">{f.fact}</p>
                    <span className="text-[9px] text-gray-500 mt-1 block">{f.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === AI MENTOR MESSAGES === */}
        {section === 'ai' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">Personalized messages GateNexa's AI Mentor might send you based on your progress.</p>
            <div className="space-y-2">
              {AI_MENTOR_MESSAGES.map((msg, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    background: i === aiMsgIndex ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === aiMsgIndex ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">🤖</span>
                  <div>
                    <p className="text-[11px]" style={{ color: i === aiMsgIndex ? '#C4B5FD' : '#9CA3AF' }}>
                      {msg}
                    </p>
                    <span className="text-[9px] text-gray-600 mt-1 block">AI Mentor · {i === aiMsgIndex ? 'Today' : 'Previous'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

