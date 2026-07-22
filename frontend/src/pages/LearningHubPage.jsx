import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import EmbeddedYouTubePlayer from '../components/learning/EmbeddedYouTubePlayer';
import { SUBJECT_RESOURCES } from '../data/subjectResources';
import { INSIGHT_CARDS } from '../data/insightCards';
import { EDITOR_PICKS } from '../data/editorsPicks';
import { TABS, ROADMAP_FILTERS, STORY_FILTERS, RESOURCE_FILTERS, SORT_OPTIONS } from '../data/filters';

function VideoSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="aspect-video bg-white/[0.03]" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-white/[0.05] rounded w-3/4" />
        <div className="h-2 bg-white/[0.03] rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-4 bg-white/[0.04] rounded-full w-16" />
          <div className="h-4 bg-white/[0.04] rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ item, onClick, index }) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoId = item.youtubeId || item.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1];
  const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : item.thumbnail;

  if (!videoId && !item.thumbnail) return null;

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer group relative content-visibility-auto anim-gpu"
      style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
      whileHover={{ y: -4, scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
    >
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(139,92,246,0.25), 0 0 30px rgba(139,92,246,0.08)' }}
        />
      )}

      {videoId ? (
        <div className="relative aspect-video bg-black/40 overflow-hidden content-visibility-auto">
          {imgError ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-gray-900/60">
              <span className="text-4xl opacity-30">{item.icon || item.type?.[0] || '📹'}</span>
            </div>
          ) : (
            <motion.img
              src={thumbnail}
              alt={item.title || ''}
              className="w-full h-full object-cover"
              style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
              transition={{ duration: 0.5 }}
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ background: isHovered ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0)' }}
          >
            <motion.div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'rgba(139,92,246,0.85)' }}
              animate={{ scale: isHovered ? 1.1 : 1, boxShadow: isHovered ? '0 0 30px rgba(139,92,246,0.4)' : '0 0 0px rgba(139,92,246,0)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>
          </motion.div>

          {item.difficulty && (
            <div className="absolute top-2 left-2 flex gap-1.5 z-20">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm ${item.difficulty === 'beginner' ? 'bg-green-500/60 text-white' : item.difficulty === 'intermediate' ? 'bg-yellow-500/60 text-white' : 'bg-red-500/60 text-white'}`}>
                {item.difficulty}
              </span>
              {item.isFeatured && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/70 text-white backdrop-blur-sm">⭐ Featured</span>
              )}
            </div>
          )}
          {item.duration && (
            <div className="absolute bottom-2 right-2 z-20">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white/90 backdrop-blur-sm">{item.duration}</span>
            </div>
          )}
        </div>
      ) : item.thumbnail ? (
        <div className="relative aspect-video bg-black/40 content-visibility-auto">
          <motion.img src={item.thumbnail} alt={item.title || ''} className="w-full h-full object-cover"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
            transition={{ duration: 0.5 }}
            onError={e => { e.target.style.display = 'none' }}
            loading="lazy" decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-purple-900/10 to-gray-900/30">
          <span className="text-5xl opacity-20">{item.icon || '📹'}</span>
        </div>
      )}

      <div className="p-4">
        <div className="text-sm font-bold text-white mb-1 leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors break-word">
          {item.title || 'Untitled'}
        </div>
        {item.description && (
          <p className="text-[11px] text-text3/70 mb-3 line-clamp-2 leading-relaxed break-word">{item.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {item.channel && (
            <span className="text-[9px] text-text3/50 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-purple-500/30 inline-block" />
              {item.channel}
            </span>
          )}
          {item.resourceType && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">{item.resourceType}</span>
          )}
          {videoId && (
            <span className="text-[9px] text-text3/40 ml-auto flex items-center gap-1">
              📹 {isHovered ? 'Watch' : 'Video'}
            </span>
          )}
        </div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0"
        animate={{
          background: isHovered
            ? 'linear-gradient(90deg, rgba(139,92,246,0), rgba(139,92,246,0.4), rgba(139,92,246,0))'
            : 'linear-gradient(90deg, rgba(139,92,246,0), rgba(139,92,246,0), rgba(139,92,246,0))'
        }}
      />
    </motion.div>
  );
}

function SubjectResourcesTable() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <div className="rounded-2xl overflow-hidden table-responsive" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-[1fr,1fr,auto,auto] text-[10px] font-bold uppercase tracking-wider text-text3/70 px-4 py-3 min-w-[400px]"
          style={{ background: 'rgba(139,92,246,0.06)' }}>
          <span>Subject</span>
          <span>Faculty</span>
          <span className="px-2">Playlist</span>
          <span className="w-10 text-center">More</span>
        </div>
        {SUBJECT_RESOURCES.map((item, index) => (
          <motion.div
            key={item.subject}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="grid grid-cols-[1fr,1fr,auto,auto] items-center px-4 py-3 transition-colors hover:bg-white/[0.02] text-xs"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span className="text-text font-medium flex items-center gap-1.5">
              <span className="text-sm">{item.icon}</span>
              <span>{item.subject}</span>
            </span>
            <span className="text-text2">{item.faculty}</span>
            <span className="px-2">
              <a href={item.playlistUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors whitespace-nowrap">
                ▶ Playlist
              </a>
            </span>
            <span className="flex justify-center w-10">
              <button onClick={() => { setSelectedSubject(item); setShowDrawer(true); }}
                className="text-[10px] px-1.5 py-1 rounded-lg text-text3 hover:text-primary/70 transition-colors">ℹ️</button>
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 rounded-xl p-3 text-[11px] text-text3/70"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        💡 Choose educators whose teaching style suits you rather than chasing every resource.
      </div>

      <AnimatePresence>
        {showDrawer && selectedSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
            onClick={() => setShowDrawer(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gray-950 h-full overflow-y-auto p-6 shadow-2xl"
              style={{ borderLeft: '1px solid rgba(139,92,246,0.15)' }}
            >
              <button onClick={() => setShowDrawer(false)} className="absolute top-4 right-4 text-text3 hover:text-white text-lg">✕</button>
              <div className="text-3xl mb-3">{selectedSubject.icon}</div>
              <h2 className="text-lg font-bold text-white mb-1">{selectedSubject.subject}</h2>
              <p className="text-xs text-text3 mb-6">Subject Resource</p>
              <div className="space-y-4">
                {[
                  { icon: '👨‍🏫', label: 'Faculty', value: selectedSubject.faculty },
                  { icon: '📺', label: 'Platform', value: selectedSubject.platform },
                  { icon: '🌐', label: 'Language', value: selectedSubject.language },
                  { icon: '⏱️', label: 'Duration', value: selectedSubject.duration },
                  { icon: '🔄', label: 'Updated', value: selectedSubject.updated },
                  { icon: '📊', label: 'Difficulty', value: selectedSubject.difficulty },
                  { icon: '📖', label: 'Book', value: selectedSubject.book },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-sm mt-0.5">{item.icon}</span>
                    <div>
                      <div className="text-[10px] font-medium text-text3 uppercase tracking-wider">{item.label}</div>
                      <div className="text-sm text-white mt-0.5">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2">
                <a href={selectedSubject.playlistUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full text-xs font-medium px-4 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                  ▶ Open Playlist
                </a>
                <button className="flex items-center gap-2 w-full text-xs font-medium px-4 py-2.5 rounded-xl bg-bg-2 text-text2 border border-border hover:border-white/20 transition-colors">
                  📝 Notes
                </button>
                <button className="flex items-center gap-2 w-full text-xs font-medium px-4 py-2.5 rounded-xl bg-bg-2 text-text2 border border-border hover:border-white/20 transition-colors">
                  📄 PDFs
                </button>
                <button className="flex items-center gap-2 w-full text-xs font-medium px-4 py-2.5 rounded-xl bg-bg-2 text-text2 border border-border hover:border-white/20 transition-colors">
                  🤖 Ask AI Mentor
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function InsightCard({ card, index }) {
  return (
    <Link to={card.link} className="block">
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0 }
        }}
        className="rounded-2xl p-5 group relative overflow-hidden"
        style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
        whileHover={{ y: -3, transition: { type: 'spring', stiffness: 300 } }}
      >
        <div className="text-3xl mb-3">{card.icon}</div>
        <div className="text-sm font-bold text-white mb-1.5 group-hover:text-purple-300 transition-colors">{card.title}</div>
        <p className="text-[11px] text-text3/70 leading-relaxed">{card.desc}</p>
        <div className="mt-3 text-[10px] text-primary/60 group-hover:text-primary transition-colors flex items-center gap-1">
          Explore <span className="text-xs">→</span>
        </div>
      </motion.div>
    </Link>
  );
}

function FilterBar({ categories, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl mb-5 overflow-x-auto"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {categories.map(item => (
        <motion.button
          key={item.id}
          onClick={() => onChange(item.id)}
          className="relative flex items-center gap-1.5 text-[11px] px-3.5 py-2 rounded-xl font-medium transition-all whitespace-nowrap button-n-doubletap"
          style={{ color: active === item.id ? '#C4B5FD' : 'rgba(255,255,255,0.4)' }}
        >
          {active === item.id && (
            <motion.div
              layoutId="catActive"
              className="absolute inset-0 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{item.icon} {item.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

function SearchBar({ onSearch, value, onChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative group">
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ boxShadow: '0 0 20px rgba(139,92,246,0.08)' }} />
      <div className="relative flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all"
        style={{ background: 'rgba(18,24,40,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-text3/50 text-sm">🔍</span>
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search resources, subjects, channels..."
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-text3/40 focus:outline-none"
        />
        <div className="flex items-center gap-2 text-[10px] text-text3/40">
          {value && (
            <button onClick={() => onChange('')} className="hover:text-white transition-colors">✕</button>
          )}
          <kbd className="px-1.5 py-0.5 rounded border border-white/10 text-text3/40"
            style={{ background: 'rgba(255,255,255,0.03)' }}>⌘K</kbd>
        </div>
      </div>
    </div>
  );
}

function ResourceModal({ selected, setSelected, canAccessPremium }) {
  const [activePanel, setActivePanel] = useState('overview');
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const videoId = selected?.youtubeId || selected?.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = useCallback(async () => {
    const q = query.trim();
    if (!q || isAsking) return;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setIsAsking(true);
    try {
      const res = await api.post('/ai/coach', {
        message: q,
        context: `The user is viewing a resource titled "${selected?.title}".`
      });
      const text = res.data?.data?.text || "I'm here to help with your GATE preparation!";
      setMessages(prev => [...prev, { role: 'coach', text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'coach', text: 'I\'m here to help with your GATE preparation! What would you like to know about this topic?' }]);
    }
    setIsAsking(false);
  }, [query, isAsking, selected?.title]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }, [handleAsk]);

  if (!selected) return null;

  const panels = [
    { id: 'overview', label: 'Overview', icon: 'ℹ️' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'resources', label: 'Resources', icon: '📄' },
    { id: 'related', label: 'Related', icon: '🔗' },
    { id: 'ai', label: 'AI Mentor', icon: '🤖' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setSelected(null)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: '#0F1119', border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 0 60px rgba(139,92,246,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-sm">
              {selected.type === 'roadmap' ? '🗺️' : selected.type === 'success_story' ? '🚀' : selected.type === 'academy' ? '🔥' : '📄'}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                {selected.type?.replace('_', ' ') || 'Resource'}
              </span>
              <h2 className="text-sm font-bold text-white break-word fluid-sm">{selected.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-text3/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm touch-target-sm button-n-doubletap" aria-label="Bookmark">🔖</button>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-text3/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm touch-target-sm button-n-doubletap" aria-label="Share">📤</button>
            <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-text3/60 hover:text-white hover:bg-white/[0.06] transition-all text-lg touch-target-sm button-n-doubletap" aria-label="Close">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scroll-container">
          {videoId && (
            <div className="aspect-video bg-black anim-gpu">
              <EmbeddedYouTubePlayer videoId={videoId} title={selected.title} autoPlay />
            </div>
          )}

          {/* Panel tabs */}
          <div className="flex gap-1 px-6 py-3 border-b border-white/[0.06] overflow-x-auto scroll-container-x gpu-layer"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            {panels.map(panel => (
              <motion.button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className="relative flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap"
                style={{ color: activePanel === panel.id ? '#C4B5FD' : 'rgba(255,255,255,0.4)' }}
              >
                {activePanel === panel.id && (
                  <motion.div
                    layoutId="modalPanel"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(139,92,246,0.12)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{panel.icon} {panel.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="p-6">
            {activePanel === 'overview' && (
              <div className="space-y-4">
                <p className="text-sm text-text2/80 leading-relaxed break-word">{selected.description || 'No description available.'}</p>
                <div className="flex flex-wrap gap-2">
                  {selected.difficulty && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400">{selected.difficulty}</span>}
                  {selected.category && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400">{selected.category}</span>}
                  {(selected.tags || []).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] text-text3/60">#{tag}</span>
                  ))}
                </div>
                <button className="w-full py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 button-n-doubletap touch-target">
                  ✅ Mark as Completed
                </button>
              </div>
            )}
            {activePanel === 'notes' && <div className="text-sm text-text3/60 text-center py-12">Notes coming soon</div>}
            {activePanel === 'resources' && <div className="text-sm text-text3/60 text-center py-12">Resources panel</div>}
            {activePanel === 'related' && <div className="text-sm text-text3/60 text-center py-12">Related content</div>}
            {activePanel === 'ai' && (
              <div className="rounded-2xl flex flex-col" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div className="flex-1 overflow-y-auto max-h-[240px] p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-2">🤖</div>
                      <p className="text-xs text-text3/70">Ask a question about this topic</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed break-word ${msg.role === 'user' ? 'bg-purple-500/20 text-purple-200' : 'bg-white/[0.04] text-text2/90'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isAsking && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl px-4 py-2.5 text-xs bg-white/[0.04] text-text3/60 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-white/[0.06]">
                  <div className="flex gap-2">
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask anything..."
                      className="flex-1 bg-bg-2 border border-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder:text-text3/40"
                    />
                    <button onClick={handleAsk} disabled={isAsking}
                      className="px-4 py-2.5 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 disabled:opacity-50 transition-all button-n-doubletap">
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {selected.isPremium && !canAccessPremium && (
          <div className="px-6 py-3 border-t border-yellow-500/20" style={{ background: 'rgba(245,158,11,0.06)' }}>
            <p className="text-xs text-yellow-400 text-center">⭐ Premium content — refer 2 friends to unlock</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Sidebar({ searchQuery, resources }) {
  return (
    <div className="space-y-3 sticky top-4">
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.03))', border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📚</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text3">Continue Learning</span>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[11px] font-semibold text-white">Operating Systems</div>
          <div className="text-[10px] text-text3/70">Deadlock - Banker's Algorithm</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 rounded-full bg-white/[0.06]"><div className="h-full rounded-full w-1/3 bg-purple-500" /></div>
            <span className="text-[9px] text-text3/50">30%</span>
          </div>
          <button className="mt-2.5 w-full py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold hover:bg-primary/20 transition-all">Resume →</button>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎯</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text3">Today's Goal</span>
        </div>
        <div className="text-[11px] text-text3/70">Complete 1 video in</div>
        <div className="text-sm font-bold text-white mt-0.5">Process Synchronization</div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'rgba(18,24,40,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🤖</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text3">AI Suggestion</span>
        </div>
        <p className="text-[11px] text-text3/70 leading-relaxed">
          Because you studied Operating Systems yesterday, watch <span className="text-primary">Process Synchronization</span> next.
        </p>
        <button className="mt-2.5 w-full py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold hover:bg-primary/20 transition-all">Continue →</button>
      </div>
    </div>
  );
}

export default function LearningHubPage() {
  const { user, isPremium } = useAuth();
  const [activeTab, setActiveTab] = useState('roadmap');
  const [roadmapFilter, setRoadmapFilter] = useState('all');
  const [storyFilter, setStoryFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [roadmaps, setRoadmaps] = useState([]);
  const [stories, setStories] = useState([]);
  const [academy, setAcademy] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roadmapData, storyData, academyData, resourceData] = await Promise.all([
        api.get('/learning/roadmap').then(r => r.data?.data || []),
        api.get('/learning/success_story').then(r => r.data?.data || []),
        api.get('/learning/academy').then(r => r.data?.data || []),
        api.get('/learning/resource').then(r => r.data?.data || []),
      ]);
      setRoadmaps(roadmapData);
      setStories(storyData);
      setAcademy(academyData);
      setResources(resourceData);
    } catch {
      // Data will be empty if API fails
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allItems = useMemo(() => [
    ...roadmaps.map(item => ({ ...item, _type: 'roadmap' })),
    ...stories.map(item => ({ ...item, _type: 'success_story' })),
    ...academy.map(item => ({ ...item, _type: 'academy' })),
    ...resources.map(item => ({ ...item, _type: 'resource' })),
  ], [roadmaps, stories, academy, resources]);

  const applySort = useCallback((items) => {
    if (sortBy === 'All') return items;
    if (sortBy === 'Recommended') return items.filter(item => item.isFeatured);
    if (sortBy === 'Recently Added') return [...items].sort((a, b) => new Date(b.createdAt || b.uploadDate || 0) - new Date(a.createdAt || a.uploadDate || 0));
    if (sortBy === 'Trending') return [...items].sort((a, b) => (b.views || 0) - (a.views || 0));
    if (sortBy === 'Most Viewed') return [...items].sort((a, b) => (b.views || 0) - (a.views || 0));
    if (sortBy === 'Bookmarks') return items.filter(item => item.isBookmarked);
    if (sortBy === 'Completed') return items.filter(item => item.isCompleted);
    return items;
  }, [sortBy]);

  const filteredRoadmaps = useMemo(() => {
    let items = roadmaps;
    if (roadmapFilter !== 'all') items = items.filter(item => item.category === roadmapFilter);
    if (searchQuery) items = items.filter(item =>
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return applySort(items);
  }, [roadmaps, roadmapFilter, searchQuery, applySort]);

  const filteredStories = useMemo(() => {
    let items = stories;
    if (storyFilter !== 'all') items = items.filter(item => item.category === storyFilter);
    if (searchQuery) items = items.filter(item =>
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return applySort(items);
  }, [stories, storyFilter, searchQuery, applySort]);

  const filteredResources = useMemo(() => {
    let items = resources;
    if (resourceFilter !== 'all') items = items.filter(item => item.category === resourceFilter);
    if (searchQuery) items = items.filter(item =>
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return applySort(items);
  }, [resources, resourceFilter, searchQuery, applySort]);

  const stats = useMemo(() => ({
    streak: 7,
    resourcesCompleted: roadmaps.length + stories.length + academy.length + resources.length,
    hoursLearned: 42,
    saved: 12,
  }), [roadmaps.length, stories.length, academy.length, resources.length]);

  return (
    <div className="pb-28 sm:pb-0">
      <AnimatePresence>
        {selectedItem && (
          <ResourceModal selected={selectedItem} setSelected={setSelectedItem} canAccessPremium={isPremium} />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="gpu-layer">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight fluid-2xl">Learning Hub</h1>
              <p className="text-sm text-text3/70 mt-0.5 break-word">
                Curated resources with purpose, selected for your GATE journey.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-center">
                  <div className="text-sm font-black text-white">{stats.streak}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-text3">Streak</div>
                </div>
                <div className="w-px h-6 bg-white/[0.06]" />
                <div className="text-center">
                  <div className="text-sm font-black text-white">{stats.hoursLearned}h</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-text3">Learned</div>
                </div>
                <div className="w-px h-6 bg-white/[0.06]" />
                <div className="text-center">
                  <div className="text-sm font-black text-white">{stats.saved}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-text3">Saved</div>
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-1.5">
                📚 Continue Learning
              </button>
            </div>
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </motion.div>

        {/* Main content */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-3 space-y-5">
            {/* Editor's Picks */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.03))', border: '1px solid rgba(139,92,246,0.12)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">⭐</span>
                <h2 className="text-sm font-bold text-white">Editor's Picks</h2>
                <span className="text-[10px] text-text3/50">Recommended This Week</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {EDITOR_PICKS.map(pick => (
                  <motion.button
                    key={pick.id}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (pick.type === 'insight') { window.open('/insights', '_self'); return; }
                      setActiveTab(pick.type);
                      setSelectedItem(null);
                    }}
                    className="rounded-xl p-3 text-center transition-all group relative overflow-hidden button-n-doubletap touch-target"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="text-lg mb-1">{pick.icon}</div>
                    <div className="text-[9px] font-bold text-primary/80 mb-0.5">{pick.title}</div>
                    <div className="text-[9px] text-text3/60 line-clamp-2 leading-snug">{pick.label}</div>
                    <motion.div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ boxShadow: `inset 0 0 0 1px ${pick.color}30, 0 0 20px ${pick.color}10` }}
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Tab bar */}
            <div>
              <div className="flex gap-1 p-1 rounded-2xl mb-5 overflow-x-auto"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {TABS.map(tab => (
                  <motion.button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSelectedItem(null); }}
                    className="relative flex items-center gap-1.5 shrink-0 text-xs px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap button-n-doubletap touch-target"
                    style={{ color: activeTab === tab.id ? '#C4B5FD' : 'rgba(255,255,255,0.4)' }}
                  >
                    {activeTab === tab.id && (
                      <motion.div layoutId="activeTab" className="absolute inset-0 rounded-xl"
                        style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </span>
                  </motion.button>
                ))}
              </div>

              {!searchQuery && (
                <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
                  {SORT_OPTIONS.map(option => (
                    <button key={option} onClick={() => setSortBy(option)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all whitespace-nowrap button-n-doubletap touch-target ${sortBy === option ? 'bg-white/[0.08] text-white' : 'text-text3/50 hover:text-text3/70'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content panels */}
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => <VideoSkeleton key={i} />)}
                </div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'roadmap' && (
                    <div>
                      <FilterBar categories={ROADMAP_FILTERS} active={roadmapFilter} onChange={setRoadmapFilter} />
                      {filteredRoadmaps.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl mb-4 opacity-40">🗺️</motion.div>
                          <p className="text-sm text-text3/60 font-medium">No roadmaps found</p>
                          <p className="text-xs text-text3/40 mt-1">{searchQuery ? 'Try a different search' : 'Check back later for new roadmaps'}</p>
                        </div>
                      ) : (
                        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-visibility-auto">
                          {filteredRoadmaps.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={() => setSelectedItem(item)} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeTab === 'subjects' && <SubjectResourcesTable />}

                  {activeTab === 'success_story' && (
                    <div>
                      <FilterBar categories={STORY_FILTERS} active={storyFilter} onChange={setStoryFilter} />
                      {filteredStories.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl mb-4 opacity-40">🚀</motion.div>
                          <p className="text-sm text-text3/60 font-medium">No stories yet</p>
                        </div>
                      ) : (
                        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-visibility-auto">
                          {filteredStories.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={() => setSelectedItem(item)} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeTab === 'academy' && (
                    <div>
                      {academy.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl mb-4 opacity-40">🔥</motion.div>
                          <p className="text-sm text-text3/60 font-medium">No motivation content yet</p>
                        </div>
                      ) : (
                        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-visibility-auto">
                          {academy.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={() => setSelectedItem(item)} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeTab === 'resource' && (
                    <div>
                      <FilterBar categories={RESOURCE_FILTERS} active={resourceFilter} onChange={setResourceFilter} />
                      {filteredResources.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl mb-4 opacity-40">📄</motion.div>
                          <p className="text-sm text-text3/60 font-medium">No resources found</p>
                        </div>
                      ) : (
                        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-visibility-auto">
                          {filteredResources.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={() => setSelectedItem(item)} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeTab === 'insights' && (
                    <div>
                      <p className="text-[11px] text-text3/70 mb-4">
                        Data-driven insights from our database — explore trends, ranks, placements, and counselling information.
                      </p>
                      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {INSIGHT_CARDS.map((card, index) => (
                          <InsightCard key={card.title} card={card} index={index} />
                        ))}
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="hidden md:block md:col-span-1">
            <Sidebar searchQuery={searchQuery} resources={allItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
