import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// ─── Static curated data ──────────────────────────────────────

const SUBJECT_RESOURCES = [
  { subject: 'C Programming', educator: 'Amit Khurana', icon: '⚡' },
  { subject: 'Data Structures', educator: 'Amit Khurana', icon: '🗃️' },
  { subject: 'Algorithms', educator: 'Abdul Bari / GO Classes', icon: '⚙️' },
  { subject: 'DBMS', educator: 'GO Classes + Amit Khurana', icon: '🗄️' },
  { subject: 'Operating Systems', educator: 'Vishwadeep Gothi', icon: '🖥️' },
  { subject: 'Computer Networks', educator: 'Ankit Dolya', icon: '🌐' },
  { subject: 'Theory of Computation', educator: 'GO Classes', icon: '🔤' },
  { subject: 'Digital Logic', educator: 'GO Classes', icon: '🔌' },
  { subject: 'Computer Architecture', educator: 'Vishwadeep Gothi', icon: '🏗️' },
  { subject: 'Engineering Mathematics', educator: 'GO Classes', icon: '📐' },
  { subject: 'Aptitude', educator: 'GO Classes', icon: '🧠' },
];

const INSIGHT_CARDS = [
  { title: 'Highest Closing Scores', desc: 'View the highest GATE scores accepted at top IITs, NITs, and IISc across programmes.', icon: '📈', link: '/insights' },
  { title: 'Safest IIT Programmes', desc: 'Discover programmes with the lowest closing ranks — your best shot at an IIT.', icon: '🎯', link: '/insights' },
  { title: 'Top NIT Placements', desc: 'Compare placement packages across NITs to find the best return on investment.', icon: '🏆', link: '/insights' },
  { title: 'Best ROI Colleges', desc: 'Which colleges offer the best combination of low fees and high placements?', icon: '💰', link: '/insights' },
  { title: 'Category Trends', desc: 'Analyze opening and closing rank trends across categories for past 3 years.', icon: '📊', link: '/insights' },
  { title: 'AI & Data Science Demand', desc: 'See which specializations in AI/DS are seeing the highest demand and lowest ranks.', icon: '🤖', link: '/insights' },
  { title: 'Most Competitive Specializations', desc: 'Identify specializations with the toughest competition based on closing ranks.', icon: '📚', link: '/insights' },
  { title: 'Counselling Timeline', desc: 'Complete timeline of CCMT, COAP, and institute-specific counselling processes.', icon: '📅', link: '/insights' },
];

const EDITOR_PICKS = [
  { id: 'ep1', type: 'roadmap', title: 'Best Roadmap', label: 'Complete Roadmap for GATE CSE' },
  { id: 'ep2', type: 'roadmap', title: 'Best Strategy', label: '6-Month Action Plan by GO Classes' },
  { id: 'ep3', type: 'academy', title: 'Best Motivation', label: 'How I Stayed Consistent for One Year' },
  { id: 'ep4', type: 'success_story', title: 'Best Success Story', label: 'Self Study: YouTube + PYQs Only' },
  { id: 'ep5', type: 'resource', title: 'Best Resource', label: 'GateOverflow — PYQ Community' },
  { id: 'ep6', type: 'insight', title: 'Insight of the Week', label: 'Highest Closing Scores Analysis' },
];

const TABS = [
  { id: 'roadmap', label: 'Roadmaps', icon: '🗺️', desc: 'Curated roadmaps for every phase of preparation' },
  { id: 'subjects', label: 'Subject Resources', icon: '📚', desc: 'Recommended educators per subject' },
  { id: 'success_story', label: 'Success Stories', icon: '🚀', desc: 'Real journeys of GATE toppers' },
  { id: 'academy', label: 'Motivation', icon: '🔥', desc: 'Preparation-focused content that keeps you going' },
  { id: 'resource', label: 'Resources', icon: '📄', desc: 'Official links, practice tools, and notes' },
  { id: 'insights', label: 'Insights', icon: '💡', desc: 'Data-driven analysis of GATE admissions' },
];

const ROADMAP_CATEGORIES = [
  { id: 'beginner', label: 'Beginner', icon: '🌱' },
  { id: '6-month', label: '6-Month Strategy', icon: '📅' },
  { id: 'last-60-days', label: 'Last 60 Days', icon: '⏰' },
  { id: 'working-professional', label: 'Working Professional', icon: '💼' },
];

const STORY_CATEGORIES = [
  { id: 'air-top-10', label: 'AIR Top 10', icon: '🏆' },
  { id: 'self-study', label: 'Self Study', icon: '📖' },
  { id: 'working-professional', label: 'Working Professional', icon: '💼' },
  { id: 'second-attempt', label: 'Second Attempt', icon: '🔄' },
  { id: 'average-cgpa', label: 'Average CGPA → IIT', icon: '⭐' },
];

const RESOURCE_CATEGORIES = [
  { id: 'official', label: 'Official', icon: '🏛️' },
  { id: 'practice', label: 'Practice', icon: '✏️' },
  { id: 'notes', label: 'Notes', icon: '📝' },
];

function YoutubeEmbed({ url }) {
  if (!url) return null;
  const id = url.match(/(?:v=|\/)([\w-]{11})/)?.[1];
  if (!id) return null;
  return (
    <div className="aspect-video rounded-xl overflow-hidden bg-black/30" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
      <iframe src={`https://www.youtube.com/embed/${id}`} title="YouTube" allowFullScreen
        className="w-full h-full" style={{ border: 0 }} loading="lazy" />
    </div>
  );
}

function ContentCard({ item, onClick }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
      {item.youtubeUrl && <div className="mb-3"><YoutubeEmbed url={item.youtubeUrl} /></div>}
      {item.youtubeId && !item.youtubeUrl && (
        <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-black/30">
          <img src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`} alt=""
            className="w-full h-full object-cover" />
        </div>
      )}
      <div className="text-xs font-semibold text-white mb-1 leading-snug">{item.title}</div>
      {item.description && <p className="text-[11px] text-text3/80 mb-2 line-clamp-2">{item.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        {item.difficulty && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
            item.difficulty === 'beginner' ? 'bg-green-500/10 text-green-400' :
            item.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-red-500/10 text-red-400'}`}>
            {item.difficulty}
          </span>
        )}
        {item.resourceType && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
            {item.resourceType}
          </span>
        )}
        {item.isFeatured && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">⭐ Featured</span>}
      </div>
    </motion.div>
  );
}

function SubjectTable() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="grid grid-cols-2 text-[10px] font-bold uppercase tracking-wider text-text3/70 px-4 py-2.5"
        style={{ background: 'rgba(139,92,246,0.06)' }}>
        <span>Subject</span>
        <span>Recommended Educator</span>
      </div>
      {SUBJECT_RESOURCES.map((s, i) => (
        <div key={s.subject}
          className="grid grid-cols-2 items-center px-4 py-2.5 transition-colors hover:bg-white/[0.02] text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span className="text-text font-medium">{s.icon} {s.subject}</span>
          <span className="text-text2">{s.educator}</span>
        </div>
      ))}
    </div>
  );
}

function InsightCard({ card }) {
  return (
    <a href={card.link}
      className="rounded-2xl p-4 transition-all hover:scale-[1.02] block"
      style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
      <div className="text-2xl mb-2">{card.icon}</div>
      <div className="text-xs font-semibold text-white mb-1">{card.title}</div>
      <p className="text-[11px] text-text3/80">{card.desc}</p>
    </a>
  );
}

function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {categories.map((c) => (
        <button key={c.id} onClick={() => onChange(c.id)}
          className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full transition-all"
          style={{
            background: active === c.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${active === c.id ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: active === c.id ? '#C4B5FD' : 'rgba(255,255,255,0.5)',
          }}>
          {c.icon} {c.label}
        </button>
      ))}
    </div>
  );
}

const fetchWithAuth = async (url) => {
  try {
    const res = await api.get(url);
    return res.data?.data || [];
  } catch { return []; }
};

export default function LearningHubPage() {
  const { isPremium } = useAuth();
  const [tab, setTab] = useState('roadmap');
  const [roadmapCat, setRoadmapCat] = useState('beginner');
  const [storyCat, setStoryCat] = useState('air-top-10');
  const [resourceCat, setResourceCat] = useState('official');
  const [roadmaps, setRoadmaps] = useState([]);
  const [stories, setStories] = useState([]);
  const [motivation, setMotivation] = useState([]);
  const [resources, setResources] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [r, s, m, res] = await Promise.all([
      fetchWithAuth('/learning/roadmap'),
      fetchWithAuth('/learning/success_story'),
      fetchWithAuth('/learning/academy'),
      fetchWithAuth('/learning/resource'),
    ]);
    setRoadmaps(r);
    setStories(s);
    setMotivation(m);
    setResources(res);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredRoadmaps = roadmaps.filter(i => {
    if (roadmapCat === 'beginner') return i.category === 'beginner' || !i.category;
    return i.category === roadmapCat;
  });
  const filteredStories = stories.filter(i => i.category === storyCat);
  const filteredResources = resources.filter(i => {
    if (resourceCat === 'official') return i.category === 'official';
    if (resourceCat === 'practice') return i.category === 'practice';
    return i.category === 'notes';
  });

  const grid = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3";

  return (
    <div className="max-w-6xl mx-auto px-3 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">GateNexa Learning Hub</h1>
        <p className="text-sm text-text3/70 mt-1">Curated resources with purpose. Every video, link, and insight selected for your GATE journey.</p>
      </div>

      {/* Editor's Picks */}
      <div className="mb-6 rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.04))', border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">⭐</span>
          <h2 className="text-sm font-bold text-white">Editor's Picks</h2>
          <span className="text-[10px] text-text3/60">Recommended This Week</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {EDITOR_PICKS.map((ep) => (
            <div key={ep.id}
              onClick={() => {
                if (ep.type === 'insight') window.open('/insights', '_self');
                else { setTab(ep.type); setSelected(null); }
              }}
              className="rounded-xl p-2.5 text-center cursor-pointer transition-all hover:bg-white/[0.04]"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] font-semibold text-primary/80 mb-0.5">{ep.title}</div>
              <div className="text-[10px] text-text3/70 line-clamp-2">{ep.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
            className="flex items-center gap-1.5 shrink-0 text-xs px-3.5 py-2 rounded-xl transition-all font-medium"
            style={{
              background: tab === t.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${tab === t.id ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: tab === t.id ? '#C4B5FD' : 'rgba(255,255,255,0.5)',
            }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab description */}
      {TABS.find(t => t.id === tab) && (
        <p className="text-[11px] text-text3/60 mb-4">{TABS.find(t => t.id === tab).desc}</p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6' }} />
        </div>
      )}

      {/* ─── CONTENT ─── */}
      {!loading && <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

          {/* ── Roadmaps ── */}
          {tab === 'roadmap' && (
            <div>
              <CategoryFilter categories={ROADMAP_CATEGORIES} active={roadmapCat} onChange={setRoadmapCat} />
              {filteredRoadmaps.length === 0 ? (
                <div className="text-center py-12 text-text3/60 text-sm">No roadmaps in this category yet.</div>
              ) : (
                <div className={grid}>
                  {filteredRoadmaps.map((item) => (
                    <ContentCard key={item._id || item.id} item={item} onClick={() => setSelected(item)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Subject Resources ── */}
          {tab === 'subjects' && (
            <div>
              <p className="text-[11px] text-text3/70 mb-3">Curated educator recommendations per subject based on GATE community consensus and topper reviews.</p>
              <SubjectTable />
              <div className="mt-4 rounded-xl p-3 text-[11px] text-text3/70"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                💡 This combination closely matches what experienced GATE aspirants recommend in community discussions. Choose educators whose teaching style suits you rather than chasing every resource.
              </div>
            </div>
          )}

          {/* ── Success Stories ── */}
          {tab === 'success_story' && (
            <div>
              <CategoryFilter categories={STORY_CATEGORIES} active={storyCat} onChange={setStoryCat} />
              {filteredStories.length === 0 ? (
                <div className="text-center py-12 text-text3/60 text-sm">No success stories in this category yet.</div>
              ) : (
                <div className={grid}>
                  {filteredStories.map((item) => (
                    <ContentCard key={item._id || item.id} item={item} onClick={() => setSelected(item)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Motivation ── */}
          {tab === 'academy' && (
            <div>
              {motivation.length === 0 ? (
                <div className="text-center py-12 text-text3/60 text-sm">No motivation content yet.</div>
              ) : (
                <div className={grid}>
                  {motivation.map((item) => (
                    <ContentCard key={item._id || item.id} item={item} onClick={() => setSelected(item)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Resources ── */}
          {tab === 'resource' && (
            <div>
              <CategoryFilter categories={RESOURCE_CATEGORIES} active={resourceCat} onChange={setResourceCat} />
              {filteredResources.length === 0 ? (
                <div className="text-center py-12 text-text3/60 text-sm">No resources in this category yet.</div>
              ) : (
                <div className={grid}>
                  {filteredResources.map((item) => (
                    <ContentCard key={item._id || item.id} item={item} onClick={() => setSelected(item)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Insights ── */}
          {tab === 'insights' && (
            <div>
              <p className="text-[11px] text-text3/70 mb-3">Data-driven insights from our database — explore trends, ranks, placements, and counselling information.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {INSIGHT_CARDS.map((card) => (
                  <InsightCard key={card.title} card={card} />
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
              style={{ background: '#0F1119', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{selected.type === 'roadmap' ? '🗺️' : selected.type === 'success_story' ? '🚀' : selected.type === 'academy' ? '🔥' : '📄'}</span>
                  <span className="text-[10px] font-medium text-primary/70 uppercase tracking-wider">{selected.type.replace('_', ' ')}</span>
                </div>
                <button onClick={() => setSelected(null)} className="text-text3 hover:text-white transition-colors text-lg">&times;</button>
              </div>
              {selected.youtubeUrl && <div className="mb-4"><YoutubeEmbed url={selected.youtubeUrl} /></div>}
              <h2 className="text-base font-bold text-white mb-2">{selected.title}</h2>
              {selected.description && <p className="text-sm text-text3/80 mb-3">{selected.description}</p>}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selected.difficulty && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">{selected.difficulty}</span>
                )}
                {selected.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">{selected.category}</span>
                )}
                {(selected.tags || []).map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>#{t}</span>
                ))}
              </div>
              {selected.isPremium && !isPremium && (
                <div className="rounded-xl p-3 text-center text-xs text-yellow-400 mb-3"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  ⭐ Premium content — refer 2 friends to unlock
                </div>
              )}
              {!isPremium && (
                <a href="/referral"
                  className="block w-full text-center text-xs font-semibold py-2.5 rounded-xl bg-primary/15 border border-primary/25 text-primary hover:bg-primary/20 transition-all mt-2">
                  🎁 Invite Friends to Unlock Premium
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
