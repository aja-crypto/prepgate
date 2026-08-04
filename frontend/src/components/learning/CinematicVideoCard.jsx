import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Eye, Clock3, Star, Sparkles, Bookmark, Heart, Share2, CheckCircle2, Pin, FileText, Flame, GraduationCap, Zap, RefreshCw } from 'lucide-react';
import { safeChannelName } from '../../utils/channelName';
import { useYoutubeThumbnail } from '../../hooks/useYoutubeThumbnail';

const BADGE_STYLES = {
  trending: { label: 'Trending', icon: Flame, bg: 'rgba(249,115,22,0.92)', color: '#fff' },
  aiPick: { label: 'AI Pick', icon: Sparkles, bg: 'rgba(139,92,246,0.92)', color: '#fff' },
  weightage: { label: 'Weightage', icon: GraduationCap, bg: 'rgba(245,158,11,0.92)', color: '#fff' },
  mustWatch: { label: 'Must Watch', icon: Star, bg: 'rgba(6,182,212,0.92)', color: '#fff' },
  new: { label: 'New', icon: Zap, bg: 'rgba(34,197,94,0.92)', color: '#fff' },
  revision: { label: 'Revision', icon: RefreshCw, bg: 'rgba(59,130,246,0.92)', color: '#fff' },
};

// Cinematic Netflix-style card: 24px radius, hover zoom, hover preview
// overlay, progress ring, colored badges, rich meta, inline actions.
export default function CinematicVideoCard({
  item, onClick, index = 0, accent = '#8B5CF6', progress, badges = [],
  savedIds, completedIds, pinnedIds, onToggle, onNotes, onShare,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const id = item._id || item.id;
  const saved = savedIds?.includes(id) ?? false;
  const completed = completedIds?.includes(id) ?? false;
  const pinned = pinnedIds?.includes(id) ?? false;

  const videoId = item.youtubeId || item.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1];
  const { src: thumbnail, onError: onThumbError, exhausted: thumbExhausted } = useYoutubeThumbnail(videoId, item.thumbnail);
  const views = item.viewCount || item.views || 0;
  const timeAgo = item.createdAt ? Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86400000) : null;
  const pct = progress != null ? Math.max(0, Math.min(100, progress)) : null;
  const channelName = safeChannelName(item.channel);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.03 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="lh-card cursor-pointer group flex flex-col shrink-0 snap-start"
      style={{
        width: 'min(260px, 78vw)',
        background: 'rgba(18,24,40,0.55)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(14px)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black/40 overflow-hidden" onClick={onClick}>
        {videoId ? (
          thumbExhausted || !thumbnail ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}22, #0F1119)` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: accent + '30' }}>
                <Play className="w-5 h-5" style={{ color: accent, fill: accent }} />
              </div>
            </div>
          ) : (
            <img src={thumbnail} alt={item.title || ''} loading="lazy" decoding="async"
              className="w-full h-full object-cover lh-thumb"
              onError={onThumbError} />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}15, #0F1119)` }}>
            <Play className="w-8 h-8 opacity-30" style={{ color: accent }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Badges (left column) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {badges.map((b, i) => {
            const st = BADGE_STYLES[b];
            if (!st) return null;
            const Icon = st.icon;
            return (
              <span key={i} className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: st.bg, color: st.color, backdropFilter: 'blur(8px)' }}>
                <Icon className="w-2.5 h-2.5" /> {st.label}
              </span>
            );
          })}
        </div>

        {/* Play button (appears on hover) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="lh-glass w-14 h-14 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-white ml-0.5 fill-white" />
          </div>
        </div>

        {/* Progress ring bottom-right */}
        {pct != null && pct > 0 && (
          <div className="absolute bottom-2 right-2 z-10 w-7 h-7">
            <svg viewBox="0 0 36 36" className="w-7 h-7 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 15} strokeDashoffset={2 * Math.PI * 15 * (1 - pct / 100)} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">{Math.round(pct)}%</span>
          </div>
        )}

        {/* Hover preview overlay: description + watch */}
        {isHovered && (
          <div className="absolute inset-x-0 bottom-0 p-3 z-10">
            {item.description && (
              <p className="text-[11px] text-white/80 leading-snug line-clamp-2 mb-2">{item.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-white lh-glass px-2.5 py-1 rounded-lg">
                <Play className="w-3 h-3 fill-white" /> Watch
              </span>
              {views > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-white/80"><Eye className="w-3 h-3" /> {views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1" onClick={onClick}>
        <div className="text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[#C4B5FD] transition-colors break-word">
          {item.title || 'Untitled'}
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-text3/70">
          {channelName ? (
            <>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                style={{ background: accent + '28', color: accent }}>{channelName[0]}</span>
              <span className="truncate">{channelName}</span>
            </>
          ) : (
            <span className="text-[10px] text-text3/40 italic">Unknown Creator</span>
          )}
        </div>

        {/* Meta chips */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {views > 0 && <span className="lh-chip !text-[9px]"><Eye className="w-2.5 h-2.5" /> {views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views}</span>}
          <span className="lh-chip !text-[9px]"><Clock3 className="w-2.5 h-2.5" /> {timeAgo != null ? (timeAgo === 0 ? 'Today' : `${timeAgo}d`) : '—'}</span>
          {item.difficulty && <span className="lh-chip !text-[9px]"><Star className="w-2.5 h-2.5" /> {item.difficulty.slice(0, 4)}</span>}
        </div>

        {/* Action row */}
        <div className="mt-auto pt-2 flex items-center gap-1 border-t border-white/[0.06] mt-2">
          <button onClick={(e) => { e.stopPropagation(); onToggle?.(id, 'saved'); }} aria-label="Save"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.08]"
            style={{ color: saved ? '#F59E0B' : 'rgba(255,255,255,0.3)' }}>
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-amber-400' : ''}`} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggle?.(id, 'completed'); }} aria-label="Mark complete"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.08]"
            style={{ color: completed ? '#22C55E' : 'rgba(255,255,255,0.3)' }}>
            <CheckCircle2 className={`w-3.5 h-3.5 ${completed ? 'fill-green-500 text-white' : ''}`} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggle?.(id, 'pinned'); }} aria-label="Pin"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.08]"
            style={{ color: pinned ? '#22D3EE' : 'rgba(255,255,255,0.3)' }}>
            <Pin className={`w-3.5 h-3.5 ${pinned ? 'fill-cyan-400' : ''}`} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNotes?.(item); }} aria-label="Notes"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.08] text-[rgba(255,255,255,0.3)] hover:text-white">
            <FileText className="w-3.5 h-3.5" />
          </button>
          <span className="flex-1" />
          <button onClick={(e) => { e.stopPropagation(); onShare?.(item); }} aria-label="Share"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.08] text-[rgba(255,255,255,0.3)] hover:text-white">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
