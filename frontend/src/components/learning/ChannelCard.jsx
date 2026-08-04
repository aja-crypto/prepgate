import { motion } from 'framer-motion';
import { Video, Eye, Star, BadgeCheck, ArrowRight, Sparkles } from 'lucide-react';

// Richer channel card: logo/avatar, video count, total views, best subject,
// AI confidence derived from how well the channel matches user's weak topics.
export default function ChannelCard({ channel, onSelect, confidence }) {
  if (!channel || !channel.name) return null;
  const initial = channel.name[0]?.toUpperCase() || '?';
  const bestSubject = channel.bestSubject;
  const conf = confidence != null ? Math.round(confidence) : null;

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(channel.name)}
      className="lh-card flex flex-col items-center text-center p-4 w-44 shrink-0"
      style={{ background: 'rgba(18,24,40,0.55)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(14px)' }}
    >
      {/* Logo */}
      <div className="relative mb-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black"
          style={{
            background: `linear-gradient(135deg, ${channel.color || '#8B5CF6'}40, rgba(34,211,238,0.25))`,
            color: channel.color || '#C4B5FD',
            border: '1px solid ' + (channel.color || '#8B5CF6') + '45',
            boxShadow: `0 8px 30px -8px ${channel.color || '#8B5CF6'}50`,
          }}>
          {initial}
        </div>
        {conf != null && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full lh-glass flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
          </div>
        )}
      </div>

      <div className="text-sm font-bold text-white truncate w-full">{channel.name}</div>

      {/* Best subject */}
      {bestSubject && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/25">
          <Star className="w-2.5 h-2.5" /> Best: {bestSubject}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 mt-2 text-[10px] text-text3/70">
        <span className="lh-chip !text-[9px]"><Video className="w-2.5 h-2.5" /> {channel.count}</span>
        <span className="lh-chip !text-[9px]"><Eye className="w-2.5 h-2.5" /> {channel.totalViews >= 1000 ? `${(channel.totalViews / 1000).toFixed(1)}K` : channel.totalViews}</span>
      </div>

      {/* AI confidence bar */}
      {conf != null && (
        <div className="w-full mt-2.5">
          <div className="flex items-center justify-between text-[8px] text-text3/60 mb-1">
            <span>AI confidence</span>
            <span className="font-bold text-[#A78BFA]">{conf}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] transition-all duration-500"
              style={{ width: `${conf}%` }} />
          </div>
        </div>
      )}

      <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#A78BFA]">
        Explore <ArrowRight className="w-2.5 h-2.5" />
      </span>
    </motion.button>
  );
}
