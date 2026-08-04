import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, SlidersHorizontal, ArrowUpDown, BookOpen, Sparkles } from 'lucide-react';
import { mistakeService } from '../services/api';
import toast from 'react-hot-toast';
import MistakeCard from '../components/mistakes/MistakeCard';
import RecordMistakeModal from '../components/mistakes/RecordMistakeModal';
import MistakeDetailModal from '../components/mistakes/MistakeDetailModal';
import { SUBJECTS, SORT_OPTIONS, MISTAKE_TYPES } from '../data/mistakeTypes';
import { DEMO_MISTAKES } from '../data/demoMistakes';

export default function MistakeNotebookPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [demoCards, setDemoCards] = useState(() => {
    const saved = localStorage.getItem('mistake_demo_dismissed');
    return saved ? JSON.parse(saved) : DEMO_MISTAKES;
  });

  const fetchData = useCallback(async () => {
    try {
      const r = await mistakeService.getAll({ limit: 100 });
      const data = r.data?.data || [];
      setEntries(data);
      if (data.length > 0) setDemoCards([]);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sorted = useMemo(() => {
    let r = entries.length > 0 ? entries : demoCards;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(e => (e.subject||'').toLowerCase().includes(q) || (e.topic||'').toLowerCase().includes(q) || (e.learning||'').toLowerCase().includes(q));
    }
    if (filterSubject !== 'All') r = r.filter(e => e.subject === filterSubject);
    if (filterType !== 'All') r = r.filter(e => e.mistakeType === filterType);
    if (sortBy === 'newest') r = [...r].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'oldest') r = [...r].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === 'subject') r = [...r].sort((a, b) => (a.subject||'').localeCompare(b.subject||''));
    else if (sortBy === 'type') r = [...r].sort((a, b) => (a.mistakeType||'').localeCompare(b.mistakeType||''));
    return r;
  }, [entries, demoCards, search, filterSubject, filterType, sortBy]);

  const handleSave = async ({ subject, topic, mistakeType, mistake, correctConcept, image }) => {
    const opt = {
      _id: 'temp-'+Date.now(), subject, topic, mistakeType: mistakeType || 'concept_mistake',
      learning: mistake, reason: correctConcept, questionImage: image,
      questionText: `${subject} — ${topic||''}`,
      createdAt: new Date().toISOString(), resolved: false,
    };
    setEntries(prev => [opt, ...prev]);
    if (demoCards.length > 0) { setDemoCards([]); localStorage.setItem('mistake_demo_dismissed', JSON.stringify([])); }
    try {
      const r = await mistakeService.create({ subject, topic, mistakeType: mistakeType || 'concept_mistake', mistake, correctConcept, questionImage: image, questionText: `${subject} — ${topic||''}` });
      setEntries(prev => prev.map(e => e._id === opt._id ? (r.data?.data || r.data) : e));
      toast.success('Saved!');
    } catch {
      setEntries(prev => prev.filter(e => e._id !== opt._id));
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (id.startsWith('demo-')) {
      setDemoCards(prev => { const next = prev.filter(e => e._id !== id); localStorage.setItem('mistake_demo_dismissed', JSON.stringify(next)); return next; });
      toast.success('Demo card removed');
      return;
    }
    const prev = entries;
    setEntries(prev => prev.filter(e => e._id !== id));
    try { await mistakeService.delete(id); toast.success('Deleted'); }
    catch { setEntries(prev); toast.error('Failed to delete'); }
  };

  const handleReview = async (id) => {
    if (id.startsWith('demo-')) return;
    setEntries(prev => prev.map(e => e._id === id ? { ...e, resolved: true } : e));
    try { await mistakeService.update(id, { resolved: true }); toast.success('Marked as reviewed'); }
    catch { setEntries(prev => prev.map(e => e._id === id ? { ...e, resolved: false } : e)); }
  };

  const hasEntries = entries.length > 0 || demoCards.length > 0;

  return (
    <div className="min-h-screen" style={{ background: '#06070A' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,92,255,0.1)' }}>
                <BookOpen size={18} style={{ color: '#7C5CFF' }} />
              </div>
              <div>
                <h1 className="text-lg font-semibold" style={{ color: '#fff' }}>Mistake Notebook</h1>
                <p className="text-[11px] mt-0.5" style={{ color: '#6F7685' }}>Capture your mistakes. Learn once. Never repeat them.</p>
              </div>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7C5CFF, #6A4CE0)', color: '#fff', boxShadow: '0 4px 20px rgba(124,92,255,0.25)' }}>
            <Plus size={16} /> Record Mistake
          </motion.button>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#6F7685' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject, topic, or description..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#fff' }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-medium transition-all"
            style={{ background: showFilters ? 'rgba(124,92,255,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${showFilters ? 'rgba(124,92,255,0.15)' : 'rgba(255,255,255,0.04)'}`, color: showFilters ? '#7C5CFF' : '#6F7685' }}>
            <SlidersHorizontal size={13} /> Filters
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] outline-none transition-all appearance-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#A5ADBB' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4">
              <div className="flex flex-wrap gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#6F7685' }}>Subject</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['All', ...SUBJECTS].map(s => (
                      <button key={s} onClick={() => setFilterSubject(s)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                        style={{ background: filterSubject === s ? 'rgba(124,92,255,0.1)' : 'rgba(255,255,255,0.02)', color: filterSubject === s ? '#7C5CFF' : '#6F7685', border: `1px solid ${filterSubject === s ? 'rgba(124,92,255,0.2)' : 'rgba(255,255,255,0.04)'}` }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#6F7685' }}>Mistake Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button key="All" onClick={() => setFilterType('All')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                      style={{ background: filterType === 'All' ? 'rgba(124,92,255,0.1)' : 'rgba(255,255,255,0.02)', color: filterType === 'All' ? '#7C5CFF' : '#6F7685', border: `1px solid ${filterType === 'All' ? 'rgba(124,92,255,0.2)' : 'rgba(255,255,255,0.04)'}` }}>All</button>
                    {MISTAKE_TYPES.map(mt => (
                      <button key={mt.value} onClick={() => setFilterType(filterType === mt.value ? 'All' : mt.value)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1"
                        style={{ background: filterType === mt.value ? `${mt.color}15` : 'rgba(255,255,255,0.02)', color: filterType === mt.value ? mt.color : '#6F7685', border: `1px solid ${filterType === mt.value ? `${mt.color}30` : 'rgba(255,255,255,0.04)'}` }}>
                        <span>{mt.emoji}</span> {mt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(124,92,255,0.3)', borderTopColor: '#7C5CFF' }} />
          </div>
        ) : sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-28 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(124,92,255,0.06)' }}>
              <BookOpen size={28} style={{ color: 'rgba(124,92,255,0.2)' }} />
            </div>
            <p className="text-base font-semibold" style={{ color: '#fff' }}>No mistakes recorded yet</p>
            <p className="text-xs mt-1.5 max-w-sm" style={{ color: '#6F7685' }}>
              Every mistake you save today becomes one less mistake in the GATE exam.
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(true)}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7C5CFF, #6A4CE0)', color: '#fff', boxShadow: '0 4px 20px rgba(124,92,255,0.25)' }}>
              <Plus size={16} /> Record Mistake
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Count */}
            <p className="text-[11px] mb-4" style={{ color: '#6F7685' }}>
              {entries.length > 0 ? `${entries.length} mistake${entries.length !== 1 ? 's' : ''} recorded` : 'Demo cards — record your own mistake to get started'}
            </p>

            {/* Card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sorted.map((entry, i) => (
                <div key={entry._id} className="flex">
                  <MistakeCard entry={entry} index={i}
                    onView={setSelectedEntry}
                    onDelete={handleDelete}
                    onReview={handleReview} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Record Mistake Modal */}
      <RecordMistakeModal open={showForm} onClose={() => setShowForm(false)} onSave={handleSave} />

      {/* Detail Modal */}
      <MistakeDetailModal entry={selectedEntry} open={!!selectedEntry} onClose={() => setSelectedEntry(null)}
        onDelete={handleDelete} onReview={handleReview} />
    </div>
  );
}