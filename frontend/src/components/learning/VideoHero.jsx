import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, Eye, Clock3, Star, BadgeCheck } from 'lucide-react';
import LazyYouTubePlayer from './LazyYouTubePlayer';
import { safeChannelName } from '../../utils/channelName';
import { useYoutubeThumbnail } from '../../hooks/useYoutubeThumbnail';

// Large cinematic 16:9 featured player with frosted-glass play button,
// soft blurred backdrop derived from the thumbnail, and premium metadata.
export default function VideoHero({ video, onPlay, onSelect }) {
  const [showPlayer, setShowPlayer] = useState(false);
  const videoId = video?.youtubeId || video?.youtubeUrl?.match(/(?:v=|\/)([\w-]{11})/)?.[1];
  const { src: thumbnail, onError: onThumbError, exhausted: thumbExhausted } = useYoutubeThumbnail(videoId, video?.thumbnail);
  const views = video?.viewCount || video?.views || 0;
  const timeAgo = video?.createdAt ? Math.floor((Date.now() - new Date(video.createdAt).getTime()) / 86400000) : null;
  const channelName = safeChannelName(video?.channel);

  if (!video || !videoId) return null;

  return (
    <section className="relative rounded-3xl overflow-hidden group" aria-label="Featured video">
      {/* Ambient glow + blur backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {thumbnail && (
          <img
            src={thumbnail}
            alt=""
            aria-hidden
            className="w-full h-full object-cover scale-125 blur-3xl opacity-45 lh-breathe"
            onError={(e) => { e.currentTarget.style.opacity = '0'; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090F] via-[#09090F]/55 to-[#09090F]/25" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full lh-conic-glow opacity-60" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#8B5CF6]/14 blur-3xl lh-breathe" />
        {/* Floating particles */}
        <span className="lh-particle w-2 h-2 bg-[#A78BFA]/70" style={{ left: '12%', top: '65%', '--lh-duration': '10s', '--lh-dx': '40px', '--lh-dy': '-90px' }} />
        <span className="lh-particle w-1.5 h-1.5 bg-[#22D3EE]/60" style={{ left: '82%', top: '40%', '--lh-duration': '13s', '--lh-delay': '2s', '--lh-dx': '-50px', '--lh-dy': '-70px' }} />
        <span className="lh-particle w-1 h-1 bg-white/40" style={{ left: '55%', top: '78%', '--lh-duration': '8s', '--lh-delay': '4s', '--lh-dx': '20px', '--lh-dy': '-120px' }} />
      </div>

      <div className="relative flex flex-col md:flex-row items-center gap-6 p-5 md:p-8">
        {/* Video surface */}
        <div className="relative w-full md:w-[58%] shrink-0 rounded-2xl overflow-hidden bg-black/60 border border-white/10"
          style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 50px -18px rgba(139,92,246,0.5)' }}>
          {showPlayer ? (
            <LazyYouTubePlayer videoId={videoId} title={video?.title} />
          ) : (
            <button
              onClick={() => { setShowPlayer(true); onPlay?.(video); }}
              className="relative w-full aspect-video block cursor-pointer"
              aria-label={`Play ${video?.title || 'featured video'}`}
            >
              {thumbnail && (
                <img
                  src={thumbnail}
                  alt=""
                  className="w-full h-full object-cover lh-thumb"
                  loading="eager"
                  onError={onThumbError}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              {/* AI badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg lh-glass text-white">
                <Sparkles className="w-3 h-3 text-[#A78BFA]" />
                AI Recommended
              </div>
              {/* Glass play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className="lh-glass w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center cursor-pointer"
                >
                  <Play className="w-8 h-8 sm:w-9 sm:h-9 text-white ml-1 fill-white" />
                </motion.div>
              </div>
              {/* Duration placeholder hidden — duration not in data */}
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Pick
            </span>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-text3 border border-white/10">
              {video?.category || 'Video'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white leading-snug mb-2 line-clamp-2">
            {video?.title || 'Untitled'}
          </h1>

          {channelName ? (
            <div className="flex items-center gap-2 mb-3 text-sm text-text2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(34,211,238,0.25))', color: '#C4B5FD' }}>
                {channelName[0]}
              </span>
              <span className="font-semibold text-white">{channelName}</span>
              <BadgeCheck className="w-4 h-4 text-[#22D3EE]" />
            </div>
          ) : (
            <div className="text-xs text-text3/50 italic mb-3">Unknown Creator</div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-text3/70">
            {views > 0 && (
              <span className="lh-chip"><Eye className="w-3 h-3" /> {views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views}</span>
            )}
            {timeAgo !== null && (
              <span className="lh-chip"><Clock3 className="w-3 h-3" /> {timeAgo === 0 ? 'Today' : `${timeAgo}d ago`}</span>
            )}
            {video?.difficulty && (
              <span className="lh-chip"><Star className="w-3 h-3" /> {video.difficulty}</span>
            )}
          </div>

          {video?.description && (
            <p className="mt-3 text-sm text-text3/70 leading-relaxed line-clamp-2 break-word">{video.description}</p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => { setShowPlayer(true); onPlay?.(video); }}
              className="lh-glass flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            >
              <Play className="w-4 h-4 fill-white" /> Watch Now
            </button>
            <button
              onClick={() => onSelect?.(video)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-text2 border border-white/10 hover:bg-white/[0.05] hover:text-white transition-all"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
