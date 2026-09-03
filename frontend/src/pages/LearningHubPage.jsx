import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useAuthData } from '../context/AuthContext';
import LazyYouTubePlayer from '../components/learning/LazyYouTubePlayer';
import { TABS, ROADMAP_FILTERS, SUBJECT_FILTERS, STORY_FILTERS, MOTIVATION_FILTERS, RESOURCE_FILTERS, VIDEO_FILTERS } from '../data/filters';
import { learningHubVideoService, learningHubDataService, api } from '../services/api';
import InsightsDashboard from '../components/gate/InsightsDashboard';
import { useTrackLearningHub } from '../hooks/useAiMentorTracking';
import { useYoutubeThumbnail } from '../hooks/useYoutubeThumbnail';
import { getContinueWatching, getCompletedCount, getInProgressCount, getLessonStatus, getProgress, WATCH_EVENT, markCompleted } from '../lib/watchProgress';
import { SUBJECT_RESOURCES } from '../data/subjectResources';

function SubjectResourcesTable({ subjectResources = [] }) {
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
        {(subjectResources || []).map((item, index) => (
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

function useReducedMotion() {
  const mq = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)');
  return mq?.matches ?? false;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return isMobile;
}

function VideoSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'linear-gradient(180deg, rgba(23,29,48,0.72), rgba(15,17,25,0.94))', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(14px)', boxShadow: '0 6px 24px rgba(0,0,0,0.28)' }}>
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

const CATEGORY_STYLES = {
  'Success Stories': { accent: '#F59E0B', badge: '🏆 Topper', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  'Roadmaps': { accent: '#3B82F6', badge: '🗺️ Roadmap', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  'Subject Resources': { accent: '#10B981', badge: '📚 Lecture', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  'Motivation': { accent: '#F97316', badge: '🔥 Motivation', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)' },
  'Resources': { accent: '#8B5CF6', badge: '📄 Resource', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
  'Insights': { accent: '#06B6D4', badge: '💡 Insight', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)' },
};

// Channels that are manually verified as legitimate GATE education creators.
const VERIFIED_CHANNELS = new Set([
  'Rahuram Chandrakumar',
  'Curious Bytes',
  'GO Classes for GATE CS, DA',
  'GO Classes',
  'Anjali Chauhan',
  'GATE Wallah',
  'PW GATE',
  'Gate Smashers',
  'Unacademy GATE',
  'GeeksforGeeks',
  'Physics Wallah - Alakh Pandey',
  'Gate Lectures by Ravindrababu Ravula',
]);

const isVerifiedChannel = (name) => !!(name && name !== 'Unknown' && VERIFIED_CHANNELS.has(name.trim()));

const ResourceCard = memo(function ResourceCard({ item, onClick, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const id = item._id || item.id;
  const [isBookmarked, setIsBookmarked] = useState(() => { try { return JSON.parse(localStorage.getItem('lh_bookmarks') || '[]').includes(id); } catch { return false; } });
  const [isFavorited, setIsFavorited] = useState(() => { try { return JSON.parse(localStorage.getItem('lh_favorites') || '[]').includes(id); } catch { return false; } });
  const videoId = item.youtubeId || item.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1];
  const { src: thumbnail, onError: onThumbError, exhausted: thumbExhausted } = useYoutubeThumbnail(videoId, item.thumbnail);
  const cat = CATEGORY_STYLES[item.category] || CATEGORY_STYLES['Resources'];
  const isVideo = !!videoId;
  const timeAgo = item.createdAt ? Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86400000) : null;
  const views = item.viewCount || item.views;

  const toggleBookmark = (e) => {
    e.stopPropagation();
    const ids = JSON.parse(localStorage.getItem('lh_bookmarks') || '[]');
    const idx = ids.indexOf(id);
    if (idx === -1) ids.push(id); else ids.splice(idx, 1);
    localStorage.setItem('lh_bookmarks', JSON.stringify(ids));
    setIsBookmarked(idx === -1);
  };

  const toggleFavorite = (e) => {
    e.stopPropagation();
    const ids = JSON.parse(localStorage.getItem('lh_favorites') || '[]');
    const idx = ids.indexOf(id);
    if (idx === -1) ids.push(id); else ids.splice(idx, 1);
    localStorage.setItem('lh_favorites', JSON.stringify(ids));
    setIsFavorited(idx === -1);
  };

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.03 }}
      onClick={() => onClick(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(item); } }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title || 'resource'}`}
      className="rounded-2xl overflow-hidden cursor-pointer group relative anim-gpu flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      style={{
        background: 'linear-gradient(180deg, rgba(23,29,48,0.72), rgba(15,17,25,0.94))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
      whileHover={{
        y: -4,
        boxShadow: `0 16px 44px rgba(0,0,0,0.5), 0 0 26px ${cat.accent}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{ boxShadow: `inset 0 0 0 1px ${cat.border}, 0 0 36px ${cat.bg}` }}
        />
      )}

      {/* Hover top light sheen */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none z-[5]"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ background: `linear-gradient(180deg, ${cat.accent}14, transparent)` }}
      />

      {/* Thumbnail */}
      {videoId ? (
        <div className="relative aspect-[16/7] sm:aspect-video bg-black/40 overflow-hidden content-visibility-auto">
          {thumbExhausted || !thumbnail ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${cat.accent}18, #0F1119)` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg" style={{ background: cat.accent + '25' }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" style={{ color: cat.accent }}><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
              </div>
              <span className="text-[9px] font-medium opacity-50" style={{ color: cat.accent }}>Click to watch</span>
            </div>
          ) : (
            <motion.img
              src={thumbnail}
              srcSet={videoId ? `${thumbnail} 1280w` : undefined}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              alt={item.title || ''}
              className="w-full h-full object-cover"
              style={{ transform: isHovered ? 'scale(1.025)' : 'scale(1)' }}
              transition={{ duration: 0.25 }}
              onError={onThumbError}
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ background: isHovered ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0)' }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.35)'
              }}
              animate={{
                scale: isHovered ? 1.12 : 1,
                background: isHovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
                boxShadow: isHovered
                  ? `0 4px 22px rgba(0,0,0,0.4), 0 0 26px ${cat.accent}55`
                  : '0 4px 18px rgba(0,0,0,0.35)'
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 16 }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex gap-1.5 z-20">
            {item.featured && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm" style={{ background: cat.accent + '99', color: 'white' }}>⭐ Featured</span>
            )}
          </div>

          {/* Duration overlay */}
          {item.duration && (
            <div className="absolute bottom-2 right-2 z-20">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 text-white/90 backdrop-blur-sm">{item.duration}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative aspect-video flex items-center justify-center content-visibility-auto" onClick={onClick}
          style={{ background: `linear-gradient(135deg, ${cat.accent}15, #0F1119)` }}>
          <span className="text-5xl opacity-30">{cat.badge[0]}</span>
          {item.featured && (
            <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm" style={{ background: cat.accent + '99', color: 'white' }}>⭐ Featured</span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1">
        {/* Category badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.accent }}>
            {cat.badge}
          </span>
          {timeAgo !== null && timeAgo <= 30 && (
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">New</span>
          )}
        </div>

        {/* Title */}
        <div className="text-sm font-bold text-white mb-1 sm:mb-2 leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors break-word">
          {item.title || 'Untitled'}
        </div>

        {/* Channel - only show if channel name exists and is not "Unknown" */}
        {item.channel && item.channel !== 'Unknown' && item.channel.trim() ? (
          <div className="flex items-center gap-1.5 mb-2 text-[10px] text-text3/60">
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
              style={{ background: cat.accent + '30', color: cat.accent }}>
              {item.channel[0]}
            </span>
            <span className="truncate min-w-0">{item.channel}</span>
            {isVerifiedChannel(item.channel) && (
              <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-px rounded text-[8px] font-bold text-cyan-300"
                style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)' }}
                title="Verified creator">
                ✓ Verified
              </span>
            )}
          </div>
        ) : item.channel === 'Unknown' || (item.youtubeId && !item.channel) ? (
          <div className="flex items-center gap-1.5 mb-2 text-[10px] text-text3/40">
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 bg-white/[0.05]">?</span>
            Unknown Creator
          </div>
        ) : null}

        {/* Meta row */}
        <div className="flex items-center gap-2.5 text-[10px] text-text3/50 mb-2 sm:mb-3 flex-wrap">
          {views > 0 && (
            <span className="flex items-center gap-1">👁 {views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views}</span>
          )}
          {timeAgo !== null && (
            <span className="flex items-center gap-1">📅 {timeAgo === 0 ? 'Today' : timeAgo === 1 ? '1d ago' : timeAgo < 30 ? `${timeAgo}d ago` : timeAgo < 365 ? `${Math.floor(timeAgo / 30)}mo ago` : `${Math.floor(timeAgo / 365)}y ago`}</span>
          )}
          {item.difficulty && (
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${item.difficulty === 'beginner' ? 'bg-green-500/15 text-green-400' : item.difficulty === 'intermediate' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>{item.difficulty}</span>
          )}
        </div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {item.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-text3/50">#{tag}</span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/[0.06]">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              if (id) {
                import('../services/api').then(m => m.api.patch(`/learning-hub/videos/${id}/view`).catch(() => {}));
              }
              onClick(item);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 rounded-xl transition-all"
            style={{ background: cat.accent + '18', color: cat.accent }}
            whileHover={{ background: cat.accent + '30' }}
            whileTap={{ scale: 0.95 }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M8 5v14l11-7z" /></svg>
            Watch Now
          </motion.button>
          <motion.button
            onClick={toggleBookmark}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: isBookmarked ? '#F59E0B' : 'rgba(255,255,255,0.25)' }}
            whileHover={{ background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.9 }}
          >
            {isBookmarked ? '🔖' : '🔖'}
          </motion.button>
          <motion.button
            onClick={toggleFavorite}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: isFavorited ? '#EF4444' : 'rgba(255,255,255,0.25)' }}
            whileHover={{ background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.9 }}
          >
            {isFavorited ? '❤️' : '🤍'}
          </motion.button>
          <motion.button
            onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(window.location.origin + '/learning-hub'); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-text3/30 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            whileHover={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            whileTap={{ scale: 0.9 }}
          >
            📤
          </motion.button>
        </div>
      </div>

      {/* Bottom glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        animate={{
          background: isHovered
            ? `linear-gradient(90deg, transparent, ${cat.accent}66, transparent)`
            : 'linear-gradient(90deg, transparent, transparent, transparent)'
        }}
      />
    </motion.div>
  );
});



function FilterBar({ categories, active, onChange, label = 'Filter' }) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeItem = categories.find(c => c.id === active);

  if (!isMobile) {
    return (
      <div className="flex flex-nowrap gap-1 p-1 rounded-2xl mb-5 overflow-x-auto px-2"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {categories.map(item => (
          <motion.button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="relative flex items-center gap-1.5 text-[11px] px-3.5 py-2 rounded-xl font-medium transition-all whitespace-nowrap button-n-doubletap shrink-0"
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

  return (
    <>
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 text-[12px] font-bold px-4 py-2.5 rounded-xl transition-all button-n-doubletap touch-target"
          style={{
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#C4B5FD',
          }}
          aria-haspopup="dialog"
        >
          🎛 {label}
          {active !== 'all' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-white">
              {activeItem?.label || active}
            </span>
          )}
        </button>
        {active !== 'all' && (
          <button
            onClick={() => onChange('all')}
            className="text-[11px] px-3 py-2 rounded-xl text-text3/70 hover:text-white transition-colors"
          >
            ✕ Clear
          </button>
        )}
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-end justify-center"
            onClick={() => setSheetOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[80vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(180deg, #171d30, #0f1119)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderBottom: 'none',
                boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
              }}
              role="dialog"
              aria-label={`${label} options`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">{label}</h3>
                <button onClick={() => setSheetOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all" aria-label="Close filters">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(item => {
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onChange(item.id); setSheetOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-left transition-all button-n-doubletap touch-target"
                      style={{
                        background: isActive ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                        border: '1px solid ' + (isActive ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'),
                        color: isActive ? '#C4B5FD' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      <span>{item.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {isActive && <span className="text-purple-300">✓</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SearchResults({ query, videos, subjectResources, onOpenVideo, onApplySubject, onClearSearch }) {
  const q = query.toLowerCase();

  const matchedVideos = useMemo(() => {
    return (videos || []).filter(item =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.channel || '').toLowerCase().includes(q) ||
      (item.subject || '').toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }, [videos, q]);

  const matchedResources = useMemo(() => {
    return (subjectResources || []).filter(item =>
      (item.subject || '').toLowerCase().includes(q) ||
      (item.faculty || '').toLowerCase().includes(q)
    );
  }, [subjectResources, q]);

  const relatedTopics = useMemo(() => {
    const topics = new Map();
    (videos || []).forEach(v => {
      if ((v.subject || '').toLowerCase().includes(q)) topics.set(v.subject, { kind: 'subject', label: v.subject });
      (v.tags || []).forEach(t => {
        if (t.toLowerCase().includes(q)) topics.set(t, { kind: 'tag', label: t });
      });
    });
    return [...topics.values()].slice(0, 12);
  }, [videos, q]);

  const total = matchedVideos.length + matchedResources.length;

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(180deg, rgba(23,29,48,0.75), rgba(15,17,25,0.9))', border: '1px solid rgba(139,92,246,0.16)', backdropFilter: 'blur(14px)' }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-bold text-white">
          Results for “{query}”
          <span className="ml-2 text-[10px] font-medium text-text3/60">{total} match{total === 1 ? '' : 'es'}</span>
        </h2>
        <button onClick={onClearSearch} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.05] text-text3 hover:text-white transition-colors">✕ Clear search</button>
      </div>

      {total === 0 && relatedTopics.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="text-4xl mb-3 opacity-40">🔎</div>
          <p className="text-sm text-text3/70 font-medium">No results for “{query}”</p>
          <p className="text-xs text-text3/40 mt-1">Try a different keyword — search by subject, topic, or channel.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {matchedVideos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs">🎬</span>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-text3">Videos</h3>
                <span className="text-[10px] text-text3/50">{matchedVideos.length}</span>
              </div>
              <div className="space-y-2">
                {matchedVideos.slice(0, 8).map(v => {
                  const vid = v.youtubeId || v.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1];
                  const st = getLessonStatus(vid);
                  return (
                    <button
                      key={v._id || v.id || vid}
                      onClick={() => onOpenVideo(v)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-purple-500/[0.08] border border-transparent hover:border-purple-500/20"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-purple-300"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-white truncate">{v.title || 'Untitled'}</div>
                        <div className="text-[10px] text-text3/60 truncate">
                          {[v.subject, v.channel].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {v.duration && <span className="text-[9px] text-text3/50 shrink-0">{v.duration}</span>}
                      {st === 'completed' ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 shrink-0">✓ Done</span>
                      ) : st === 'in-progress' ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 shrink-0">▶ {Math.round((getProgress(vid)?.pct || 0) * 100)}%</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-text3/50 shrink-0">{v.category || 'Video'}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {matchedResources.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs">📚</span>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-text3">Notes · PYQs · Practice</h3>
                <span className="text-[10px] text-text3/50">{matchedResources.length}</span>
              </div>
              <div className="space-y-2">
                {matchedResources.slice(0, 6).map(r => (
                  <div key={r.subject || r.faculty} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-lg shrink-0">{r.icon || '📄'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-white truncate">{r.subject}</div>
                      <div className="text-[10px] text-text3/60 truncate">{r.faculty || 'Study resource'}</div>
                    </div>
                    {r.playlistUrl ? (
                      <a href={r.playlistUrl} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors shrink-0">
                        Open →
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {relatedTopics.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs">🏷️</span>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-text3">Related Topics</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedTopics.map(t => (
                  <button
                    key={t.label}
                    onClick={() => onApplySubject(t)}
                    className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-white/[0.05] text-text3 hover:text-white hover:bg-white/[0.09] border border-white/[0.08] transition-all"
                  >
                    #{t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchBar({ onSearch, value, onChange }) {  const inputRef = useRef(null);

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
        style={{
          background: 'linear-gradient(180deg, rgba(23,29,48,0.75), rgba(15,17,25,0.85))',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}>
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

function ResourceModal({ selected, setSelected, canAccessPremium, videos = [], subjectResources = [] }) {
  const [activePanel, setActivePanel] = useState('overview');
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [copied, setCopied] = useState(false);
  const [marked, setMarked] = useState(false);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const videoId = selected?.youtubeId || selected?.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1];
  const isVideoResource = !!videoId;

  const related = useMemo(() => {
    if (!selected) return [];
    const sameSubject = (videos || []).filter(v =>
      v.subject && selected.subject && v.subject.toLowerCase() === selected.subject.toLowerCase() &&
      (v._id || v.id) !== (selected._id || selected.id)
    );
    const sameCat = (videos || []).filter(v =>
      v.category && selected.category && v.category === selected.category &&
      (v._id || v.id) !== (selected._id || selected.id)
    );
    const seen = new Set();
    return [...sameSubject, ...sameCat].filter(v => {
      const k = v._id || v.id;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 6);
  }, [selected, videos]);

  const subjectRes = (subjectResources || []).find(r =>
    r.subject && selected?.subject && r.subject.toLowerCase() === selected.subject.toLowerCase()
  );

  const subjectVideos = useMemo(() => {
    if (!selected?.subject) return [];
    return (videos || []).filter(v => v.subject && v.subject.toLowerCase() === selected.subject.toLowerCase()).slice(0, 4);
  }, [selected, videos]);

  const handleShare = useCallback(() => {
    navigator.clipboard?.writeText(window.location.origin + '/learning-hub');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const handleMarkCompleted = useCallback(() => {
    if (!videoId) return;
    markCompleted(videoId, { title: selected?.title, subject: selected?.subject });
    setMarked(true);
  }, [videoId, selected?.title, selected?.subject]);

  const completed = getLessonStatus(videoId) === 'completed' || marked;

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

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSelected]);

  // Focus the modal panel on open and trap Tab focus inside it.
  // Exclude iframe from focusable elements to prevent mobile browsers from
  // forcibly scrolling focused iframes into view (jumps to top/off-screen).
  useEffect(() => {
    if (!selected) return;
    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelectorAll('button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) focusable[0].focus({ preventScroll: true });
    }
    const onTab = (e) => {
      if (e.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll('button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (focusable.length === 0) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus({ preventScroll: true }); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus({ preventScroll: true }); }
    };
    document.addEventListener('keydown', onTab);
    return () => document.removeEventListener('keydown', onTab);
  }, [selected]);

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
      role="dialog"
      aria-modal="true"
      aria-label={selected.title || 'Resource'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      style={{ background: 'rgba(5,8,18,0.72)', backdropFilter: 'blur(16px)' }}
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(23,29,48,0.95), #0F1119)',
          border: '1px solid rgba(139,92,246,0.2)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 80px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}
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
            <button onClick={() => { const ids = JSON.parse(localStorage.getItem('lh_bookmarks') || '[]'); const id = selected?._id || selected?.id; const idx = ids.indexOf(id); if (idx === -1) ids.push(id); else ids.splice(idx, 1); localStorage.setItem('lh_bookmarks', JSON.stringify(ids)); }} className="w-8 h-8 rounded-xl flex items-center justify-center text-text3/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm touch-target-sm button-n-doubletap" aria-label="Bookmark">🔖</button>
            <button onClick={handleShare} className="w-8 h-8 rounded-xl flex items-center justify-center text-text3/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm touch-target-sm button-n-doubletap" aria-label="Share">{copied ? '✅' : '📤'}</button>
            <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-text3/60 hover:text-white hover:bg-white/[0.06] transition-all text-lg touch-target-sm button-n-doubletap" aria-label="Close">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scroll-container">
          {videoId && (
            <div className="aspect-video bg-black anim-gpu">
              <LazyYouTubePlayer videoId={videoId} title={selected.title} autoPlay />
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
                <button
                  onClick={handleMarkCompleted}
                  disabled={!isVideoResource || completed}
                  className={`w-full py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 button-n-doubletap touch-target ${completed ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30'}`}
                >
                  {completed ? '✅ Completed' : isVideoResource ? '✅ Mark as Completed' : 'Not a video lesson'}
                </button>
                {completed && <p className="text-[11px] text-green-400/70 text-center">Progress saved — it will sync across your devices.</p>}
              </div>
            )}
            {activePanel === 'notes' && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-text3">Lecture Notes</h4>
                {subjectVideos.length === 0 ? (
                  <div className="text-sm text-text3/60 text-center py-8">No notes available for this resource yet.</div>
                ) : (
                  <div className="space-y-2">
                    {subjectVideos.map(v => (
                      <button key={v._id || v.id} onClick={() => { setSelected(null); }} disabled
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left opacity-80" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-base">📝</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-white truncate">{v.title}</div>
                          <div className="text-[10px] text-text3/60">{v.channel}</div>
                        </div>
                        <span className="text-[10px] text-text3/40">In video player</span>
                      </button>
                    ))}
                  </div>
                )}
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-text3 mt-2">Short Notes & Guides</h4>
                <div className="rounded-xl p-3 text-[11px] text-text3/70 leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  📖 Open a lesson and use <span className="text-purple-300">Resources → Notes</span> inside the video player for concise, topic-wise notes for this subject.
                </div>
              </div>
            )}
            {activePanel === 'resources' && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-text3 mb-1">Notes · PYQs · Practice</h4>
                {subjectRes ? (
                  <a href={subjectRes.playlistUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-purple-500/[0.06]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xl shrink-0">📺</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-white">{subjectRes.subject} — {subjectRes.faculty}</div>
                      <div className="text-[10px] text-text3/60">Complete lecture playlist for this subject</div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">Open →</span>
                  </a>
                ) : (
                  <div className="rounded-xl p-3 text-[11px] text-text3/70" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    No linked resources for “{selected.subject || 'this resource'}” yet.
                  </div>
                )}
                {subjectVideos.length > 0 && (
                  <>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text3 pt-2 mb-1">Video lessons in this subject</h4>
                    {subjectVideos.map(v => (
                      <button key={v._id || v.id} onClick={() => { setSelected(v); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-purple-500/[0.06]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-base shrink-0">🎬</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold text-white truncate">{v.title}</div>
                          <div className="text-[10px] text-text3/60">{v.channel}</div>
                        </div>
                        <span className="text-[10px] text-primary shrink-0">Watch →</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
            {activePanel === 'related' && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-text3 mb-1">Continue Learning</h4>
                {related.length === 0 ? (
                  <div className="text-sm text-text3/60 text-center py-8">No related content found yet.</div>
                ) : (
                  related.map(v => (
                    <button key={v._id || v.id} onClick={() => { setSelected(v); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-purple-500/[0.06]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-purple-300"><path d="M8 5v14l11-7z" /></svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-white truncate">{v.title}</div>
                        <div className="text-[10px] text-text3/60 truncate">{[v.subject, v.channel].filter(Boolean).join(' · ')}</div>
                      </div>
                      {v.duration && <span className="text-[10px] text-text3/50 shrink-0">{v.duration}</span>}
                    </button>
                  ))
                )}
              </div>
            )}
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

function Sidebar({ videos, onOpenVideo }) {
  const recommended = [
    { name: 'Rahuram Chandrakumar', desc: 'Most inspiring GATE success stories & motivation', icon: '🔥' },
    { name: 'Curious Bytes', desc: 'Strategic roadmaps & exam planning', icon: '📐' },
    { name: 'GO Classes for GATE CS, DA', desc: 'Top ranker preparation approaches', icon: '🏆' },
    { name: 'Anjali Chauhan', desc: 'Personal guidance from a GATE topper', icon: '👩‍🎓' },
    { name: 'Gate Smashers', desc: 'Topper interviews & interview prep', icon: '💬' },
    { name: 'Ravindrababu Ravula', desc: 'Deep subject resources & concept clarity', icon: '📖' },
  ];

  const [continueWatching, setContinueWatching] = useState(() => getContinueWatching(4));
  const [completedCount, setCompletedCount] = useState(() => getCompletedCount());
  const [inProgressCount, setInProgressCount] = useState(() => getInProgressCount());

  useEffect(() => {
    const refresh = () => {
      setContinueWatching(getContinueWatching(4));
      setCompletedCount(getCompletedCount());
      setInProgressCount(getInProgressCount());
    };
    window.addEventListener(WATCH_EVENT, refresh);
    return () => window.removeEventListener(WATCH_EVENT, refresh);
  }, []);

  const resolveVideo = (p) => {
    const vid = p.videoId;
    return (videos || []).find(v => (v.youtubeId || v.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1]) === vid) || null;
  };

  return (
    <div className="space-y-3 sticky top-4">
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.03))', border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📚</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text3">Continue Learning</span>
        </div>
        {continueWatching.length === 0 ? (
          <div className="rounded-xl p-3 text-[10px] text-text3/60" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            Start watching a video and it will appear here to resume later.
          </div>
        ) : (
          <div className="space-y-2">
            {continueWatching.map(p => {
              const v = resolveVideo(p);
              return (
                <div key={p.videoId} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[11px] font-semibold text-white truncate">{p.subject || v?.subject || 'Lesson'}</div>
                  <div className="text-[10px] text-text3/70 truncate">{p.title || v?.title || 'Untitled video'}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((p.pct || 0) * 100)}%`, background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)' }} />
                    </div>
                    <span className="text-[9px] text-text3/50">{Math.round((p.pct || 0) * 100)}%</span>
                  </div>
                  <button
                    onClick={() => onOpenVideo(v || p)}
                    className="mt-2.5 w-full py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold hover:bg-primary/20 transition-all"
                  >
                    Resume →
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {(completedCount > 0 || inProgressCount > 0) && (
          <div className="flex items-center gap-2 mt-3 text-[9px] text-text3/60">
            <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{completedCount} completed</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">{inProgressCount} in progress</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(180deg, rgba(23,29,48,0.72), rgba(15,17,25,0.94))', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(14px)', boxShadow: '0 8px 28px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎯</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text3">Today's Goal</span>
        </div>
        <div className="text-[11px] text-text3/70">Complete {Math.max(1, completedCount + 1)} videos today</div>
        <div className="text-sm font-bold text-white mt-0.5">{completedCount} completed · {inProgressCount} in progress</div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(180deg, rgba(23,29,48,0.72), rgba(15,17,25,0.94))', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(14px)', boxShadow: '0 8px 28px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">⭐</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text3">Recommended Channels</span>
        </div>
        <div className="space-y-2">
          {recommended.map(r => (
            <div key={r.name} className="flex items-start gap-2 rounded-xl p-2 transition-colors hover:bg-white/[0.03]">
              <span className="text-sm mt-0.5">{r.icon}</span>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-white truncate">{r.name}</div>
                <div className="text-[9px] text-text3/60 leading-snug">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const DEMO_VIDEOS = [
  { _id: 'd1', title: 'GATE CSE 2027 Complete Roadmap', youtubeId: 'dQw4w9WgXcQ', channel: 'GATE Wallah', subject: 'General', category: 'Roadmaps', views: 15230, tags: ['roadmap', 'strategy', 'gate 2027'] },
  { _id: 'd2', title: 'Data Structures - Arrays & Linked Lists', youtubeId: 'dQw4w9WgXcQ', channel: 'Gate Smashers', subject: 'Data Structures', category: 'Subject Resources', views: 8920, tags: ['arrays', 'linked list', 'dsa'] },
  { _id: 'd3', title: 'Operating System - Process Scheduling', youtubeId: 'dQw4w9WgXcQ', channel: 'GO Classes', subject: 'Operating Systems', category: 'Subject Resources', views: 6540, tags: ['scheduling', 'os', 'process'] },
  { _id: 'd4', title: 'AIR 12 - How I Prepared for GATE', youtubeId: 'dQw4w9WgXcQ', channel: 'Curious Bytes', subject: 'General', category: 'Success Stories', views: 23400, tags: ['topper', 'strategy', 'air 12'] },
  { _id: 'd5', title: 'DBMS - Normalization Complete Lecture', youtubeId: 'dQw4w9WgXcQ', channel: 'Ravindra Babu Ravula', subject: 'DBMS', category: 'Subject Resources', views: 11200, tags: ['normalization', 'dbms', 'functional dependency'] },
  { _id: 'd6', title: 'Daily Motivation - Stay Consistent', youtubeId: 'dQw4w9WgXcQ', channel: 'GATE Wallah', subject: 'General', category: 'Motivation', views: 5600, tags: ['motivation', 'consistency'] },
  { _id: 'd7', title: 'Computer Networks - TCP/IP Deep Dive', youtubeId: 'dQw4w9WgXcQ', channel: 'Unacademy GATE', subject: 'Computer Networks', category: 'Subject Resources', views: 7800, tags: ['tcp', 'ip', 'networking'] },
  { _id: 'd8', title: 'Algorithms - Sorting Comparison', youtubeId: 'dQw4w9WgXcQ', channel: 'GeeksforGeeks', subject: 'Algorithms', category: 'Subject Resources', views: 9100, tags: ['sorting', 'algorithms', 'complexity'] },
  { _id: 'd9', title: 'GATE Prep Resources & PDFs', youtubeId: 'dQw4w9WgXcQ', channel: 'PW GATE', subject: 'General', category: 'Resources', views: 4300, tags: ['resources', 'pdf', 'notes'] },
  { _id: 'd10', title: 'Theory of Computation - Finite Automata', youtubeId: 'dQw4w9WgXcQ', channel: 'GO Classes', subject: 'TOC', category: 'Subject Resources', views: 5900, tags: ['automata', 'toc', 'dfa'] },
];

const DEMO_EDITOR_PICKS = [
  { _id: 'ep1', title: 'Best GATE CSE Roadmap 2027', youtubeId: 'dQw4w9WgXcQ', channel: 'GATE Wallah', subject: 'General', category: 'Roadmaps' },
  { _id: 'ep2', title: 'Must-Watch: DSA Crash Course', youtubeId: 'dQw4w9WgXcQ', channel: 'Gate Smashers', subject: 'Data Structures', category: 'Subject Resources' },
];

export default function LearningHubPage() {
  const { user, isPremium } = useAuthData();
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState('videos');
  const [roadmapFilter, setRoadmapFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [storyFilter, setStoryFilter] = useState('all');
  const [motivationFilter, setMotivationFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [videoSort, setVideoSort] = useState('all');
  const [channelFilter, setChannelFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [subjectResources, setSubjectResources] = useState([]);
  const [editorPicks, setEditorPicks] = useState([]);
  const lhTracking = useTrackLearningHub();
  const prevSelected = useRef(null);
  const savedScrollY = useRef(0);

  const openResource = useCallback((item) => {
    savedScrollY.current = window.scrollY;
    if (item.youtubeId || item.youtubeUrl) {
      if (item.type === 'video' || item.youtubeId) {
        lhTracking.trackVideoWatched(item);
      }
      if (item.resourceType === 'notes') lhTracking.trackNotesOpened(item.subject);
      if (item.resourceType === 'pdf' || item.type === 'resource') lhTracking.trackPdfOpened(item.subject);
    }
    setSelectedItem(item);
  }, [lhTracking]);

  useEffect(() => {
    if (selectedItem === null && prevSelected.current !== null) {
      const y = savedScrollY.current;
      prevSelected.current = null;
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
    }
  }, [selectedItem]);

  const handleApplySubject = useCallback((topic) => {
    setSearchQuery('');
    if (topic.kind === 'subject') {
      setSubjectFilter(topic.label);
      setActiveTab('subjects');
    } else {
      setVideoSort('all');
      setActiveTab('videos');
    }
    setSelectedItem(null);
  }, []);

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  useEffect(() => {
    if (selectedItem && selectedItem !== prevSelected.current) {
      prevSelected.current = selectedItem;
      if (selectedItem.type === 'video' || selectedItem.youtubeId) {
        lhTracking.trackVideoWatched(selectedItem);
      }
      if (selectedItem.resourceType === 'notes') lhTracking.trackNotesOpened(selectedItem.subject);
      if (selectedItem.resourceType === 'pdf' || selectedItem.type === 'resource') lhTracking.trackPdfOpened(selectedItem.subject);
    }
  }, [selectedItem]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const videoData = await learningHubVideoService.list({ limit: 200 }).then(r => r.data?.data || []);
      setVideos(videoData);
      
      const [picksRes] = await Promise.all([
        learningHubDataService.getEditorPicks().catch(() => ({ data: { data: [] } })),
      ]);
      setSubjectResources(SUBJECT_RESOURCES);
      setEditorPicks(picksRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load learning hub videos:', err);
      setVideos(DEMO_VIDEOS);
      setSubjectResources(SUBJECT_RESOURCES);
      setEditorPicks(DEMO_EDITOR_PICKS);
      setLoadError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const byCategory = useCallback((category) => {
    if (!category) return videos;
    return videos.filter(v => v.category === category);
  }, [videos]);

  const channelData = useMemo(() => {
    const map = {};
    videos.forEach(v => {
      const ch = v.channel;
      if (!ch || ch === 'Unknown') return;
      if (!map[ch]) { map[ch] = { name: ch, count: 0, subjects: new Set(), categories: new Set(), totalViews: 0 }; }
      map[ch].count++;
      if (v.subject) map[ch].subjects.add(v.subject);
      if (v.category) map[ch].categories.add(v.category);
      map[ch].totalViews += v.viewCount || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [videos]);

  const filteredVideos = useMemo(() => {
    let items = videos;
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      items = items.filter(item =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.channel || '').toLowerCase().includes(q) ||
        (item.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (channelFilter) {
      items = items.filter(item => item.channel === channelFilter);
    }
    const bookmarkedIds = JSON.parse(localStorage.getItem('lh_bookmarks') || '[]');
    const favoriteIds = JSON.parse(localStorage.getItem('lh_favorites') || '[]');
    if (videoSort === 'Recently Added') items = [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    else if (videoSort === 'Trending') items = [...items].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    else if (videoSort === 'Recommended') items = items.filter(item => item.featured);
    else if (videoSort === 'Bookmarked') items = items.filter(item => bookmarkedIds.includes(item._id || item.id));
    else if (videoSort === 'Favorites') items = items.filter(item => favoriteIds.includes(item._id || item.id));
    return items;
  }, [videos, debouncedQuery, videoSort, channelFilter]);

  const matchTag = (item, filterId) => {
    const words = filterId.replace(/-/g, ' ').toLowerCase().split(' ').filter(Boolean);
    if (words.length === 0) return true;
    return item.tags?.some(t => {
      const tag = t.toLowerCase();
      return words.some(w => tag.includes(w));
    });
  };

  const filteredRoadmaps = useMemo(() => {
    let items = videos.filter(v => v.category === 'Roadmaps');
    if (roadmapFilter !== 'all') items = items.filter(item => matchTag(item, roadmapFilter));
    if (debouncedQuery) items = items.filter(item =>
      (item.title || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.tags || []).some(t => t.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );
    return items;
  }, [videos, roadmapFilter, debouncedQuery]);

  const filteredSubjects = useMemo(() => {
    let items = videos.filter(v => v.category === 'Subject Resources');
    if (subjectFilter !== 'all') items = items.filter(item => matchTag(item, subjectFilter));
    if (debouncedQuery) items = items.filter(item =>
      (item.title || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.tags || []).some(t => t.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );
    return items;
  }, [videos, subjectFilter, debouncedQuery]);

  const filteredStories = useMemo(() => {
    let items = videos.filter(v => v.category === 'Success Stories');
    if (storyFilter !== 'all') items = items.filter(item => matchTag(item, storyFilter));
    if (debouncedQuery) items = items.filter(item =>
      (item.title || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.tags || []).some(t => t.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );
    return items;
  }, [videos, storyFilter, debouncedQuery]);

  const filteredAcademy = useMemo(() => {
    let items = videos.filter(v => v.category === 'Motivation');
    if (motivationFilter !== 'all') items = items.filter(item => matchTag(item, motivationFilter));
    if (debouncedQuery) items = items.filter(item =>
      (item.title || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.tags || []).some(t => t.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );
    return items;
  }, [videos, motivationFilter, debouncedQuery]);

  const filteredResources = useMemo(() => {
    let items = videos.filter(v => v.category === 'Resources');
    if (resourceFilter !== 'all') items = items.filter(item => matchTag(item, resourceFilter));
    if (debouncedQuery) items = items.filter(item =>
      (item.title || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (item.tags || []).some(t => t.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );
    return items;
  }, [videos, resourceFilter, debouncedQuery]);

  const videoCards = useMemo(() => filteredVideos.map(item => ({ ...item, type: 'video', resourceType: 'video' })), [filteredVideos]);

  const stats = useMemo(() => {
    // Real data — bookmarks count + focus session history, never fake numbers
    let saved = 0;
    try { saved = JSON.parse(localStorage.getItem('lh_bookmarks') || '[]').length; } catch {}
    let totalSeconds = 0;
    const studyDays = new Set();
    try {
      const history = JSON.parse(localStorage.getItem('gatenexa_focus_history') || '[]');
      for (const h of history) {
        totalSeconds += h.duration || 0;
        if (h.date) studyDays.add(new Date(h.date).toDateString());
      }
    } catch {}
    // Consecutive-day streak (allows today or yesterday as the anchor)
    const daySet = new Set(studyDays);
    let streak = 0;
    let cursor = new Date();
    const hasToday = daySet.has(cursor.toDateString());
    if (!hasToday) cursor.setDate(cursor.getDate() - 1);
    while (daySet.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return {
      streak,
      resourcesCompleted: videos.length,
      hoursLearned: Math.round((totalSeconds / 3600) * 10) / 10,
      saved,
    };
  }, [videos.length]);

  return (
    <div className="relative pb-28 sm:pb-0">
      {/* Page-local ambient glow layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.55), transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(ellipse, rgba(34,211,238,0.4), transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.45), transparent 70%)', filter: 'blur(90px)' }} />
      </div>

      <AnimatePresence>
        {selectedItem && (
          <ResourceModal key={selectedItem._id || selectedItem.id} selected={selectedItem} setSelected={setSelectedItem} canAccessPremium={isPremium} videos={videos} subjectResources={subjectResources} />
        )}
      </AnimatePresence>

      <div className="relative max-w-6xl mx-auto px-4 py-6 space-y-6">
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
              <button
                onClick={() => {
                  setActiveTab('videos');
                  setSelectedItem(null);
                  const el = document.querySelector('#learning-content');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
              >
                📚 Continue Learning
              </button>
            </div>
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </motion.div>

        {/* Main content */}
        <div id="learning-content" className="grid md:grid-cols-4 gap-6 scroll-mt-24">
          <div className="md:col-span-3 space-y-5 min-w-0">
            {/* Editor's Picks */}
            {editorPicks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(34,211,238,0.04), rgba(15,17,25,0.7))', border: '1px solid rgba(139,92,246,0.16)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 34px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">⭐</span>
                <h2 className="text-sm font-bold text-white">Editor's Picks</h2>
                <span className="text-[10px] text-text3/50">Recommended This Week</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {editorPicks.map(pick => (
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
            )}

            {/* Featured Channels */}
            {channelData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{ background: 'linear-gradient(180deg, rgba(23,29,48,0.72), rgba(15,17,25,0.94))', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(14px)', boxShadow: '0 8px 28px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">📺</span>
                  <h2 className="text-sm font-bold text-white">Featured Channels</h2>
                  <span className="text-[10px] text-text3/50">Top content creators</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {channelData.slice(0, 10).map(ch => {
                    const subjects = [...ch.subjects].slice(0, 2).join(', ');
                    return (
                      <motion.button
                        key={ch.name}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setChannelFilter(channelFilter === ch.name ? null : ch.name)}
                        className="flex items-center gap-2.5 shrink-0 rounded-xl px-3 py-2.5 transition-all touch-target"
                        style={{
                          background: channelFilter === ch.name ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                          border: '1px solid ' + (channelFilter === ch.name ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.06)')
                        }}
                      >
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2))', color: '#C4B5FD' }}>
                          {ch.name[0]}
                        </span>
                        <div className="text-left min-w-0">
                          <div className="text-[11px] font-semibold text-white truncate max-w-[120px]">{ch.name}</div>
                          <div className="text-[9px] text-text3/50">{ch.count} video{ch.count > 1 ? 's' : ''}{subjects ? ' · ' + subjects : ''}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Channel filter indicator */}
            {channelFilter && (
              <div className="flex items-center gap-2 px-1 py-1">
                <span className="text-[11px] text-text3/70">Showing videos from:</span>
                <span className="text-[11px] font-semibold text-primary">{channelFilter}</span>
                <button onClick={() => setChannelFilter(null)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.05] text-text3 hover:text-white transition-colors">✕ Clear</button>
              </div>
            )}

            {/* Tab bar */}
            <div>
              <div className="flex flex-nowrap gap-1 p-1 rounded-2xl mb-5 overflow-x-auto px-2"
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

            </div>

            {/* Content panels */}
            <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => <VideoSkeleton key={i} />)}
                </div>
              ) : debouncedQuery ? (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <SearchResults
                    query={debouncedQuery}
                    videos={videos}
                    subjectResources={subjectResources}
                    onOpenVideo={openResource}
                    onApplySubject={handleApplySubject}
                    onClearSearch={clearSearch}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'videos' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <div className="flex flex-nowrap gap-1 overflow-x-auto flex-1 min-w-0 px-2 pb-1">
                          {VIDEO_FILTERS.map(item => (
                            <motion.button
                              key={item.id}
                              onClick={() => setVideoSort(item.id)}
                              className="relative flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap button-n-doubletap shrink-0"
                              style={{ color: videoSort === item.id ? '#C4B5FD' : 'rgba(255,255,255,0.4)' }}
                            >
                              {videoSort === item.id && (
                                <motion.div layoutId="videoSortActive" className="absolute inset-0 rounded-xl"
                                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                              )}
                              <span className="relative z-10">{item.icon} {item.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      {loadError ? (
                        <div className="flex flex-col items-center py-16 text-center">
                          <div className="text-4xl mb-4 opacity-40">⚠️</div>
                          <p className="text-sm text-text3/60 font-medium">{loadError}</p>
                          <button
                            onClick={fetchData}
                            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all hover:opacity-90"
                            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}
                          >
                            ↻ Retry
                          </button>
                        </div>
                      ) : filteredVideos.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl mb-4 opacity-40">🎬</motion.div>
                          <p className="text-sm text-text3/60 font-medium">No videos yet</p>
                          <p className="text-xs text-text3/40 mt-1">Videos will appear here once added by admin</p>
                        </div>
                       ) : (
                        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 content-visibility-auto">
                          {videoCards.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={openResource} />
                          ))}
                        </motion.div>
                      )}
                     </div>
                  )}

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
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 content-visibility-auto">
                          {filteredRoadmaps.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={openResource} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeTab === 'subjects' && (
                    <div>
                      <FilterBar categories={SUBJECT_FILTERS} active={subjectFilter} onChange={setSubjectFilter} />
                      {filteredSubjects.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl mb-4 opacity-40">📚</motion.div>
                          <p className="text-sm text-text3/60 font-medium">No subject resources yet</p>
                        </div>
                       ) : (
                        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 content-visibility-auto">
                          {filteredSubjects.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={openResource} />
                          ))}
                        </motion.div>
                      )}
                      <div className="mt-8">
                        <h3 className="text-sm font-bold text-white mb-3">Recommended Educators by Subject</h3>
                        <SubjectResourcesTable subjectResources={subjectResources} />
                      </div>
                    </div>
                  )}

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
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 content-visibility-auto">
                          {filteredStories.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={openResource} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeTab === 'academy' && (
                    <div>
                      <FilterBar categories={MOTIVATION_FILTERS} active={motivationFilter} onChange={setMotivationFilter} />
                      {filteredAcademy.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                          <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl mb-4 opacity-40">🔥</motion.div>
                          <p className="text-sm text-text3/60 font-medium">No motivation content yet</p>
                        </div>
                      ) : (
                        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 content-visibility-auto">
                          {filteredAcademy.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={openResource} />
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
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 content-visibility-auto">
                          {filteredResources.map(item => (
                            <ResourceCard key={item._id || item.id} item={item} onClick={openResource} />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeTab === 'insights' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm">💡</span>
                        <h3 className="text-sm font-bold text-white">GATE Data Insights</h3>
                        <span className="text-[10px] text-text3/50">2025-26 Reference Data</span>
                      </div>
                      <InsightsDashboard />
                      <div className="mt-4 text-center">
                        <Link to="/insights" className="inline-flex items-center gap-1 text-[11px] font-bold px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                          View All Insights →
                        </Link>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
            </MotionConfig>
          </div>

          {/* Sidebar */}
          <div className="hidden md:block md:col-span-1">
            <Sidebar videos={videos} onOpenVideo={openResource} />
          </div>
        </div>
      </div>
    </div>
  );
}

