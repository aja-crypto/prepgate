import { useState, useCallback } from 'react';

const IMAGE_URL = '/images/pro iocn.png';

function formatName(name) {
  if (!name) return 'User';
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const BADGE_CONFIG = {
  owner: { icon: '👑', label: 'OWNER', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  super_admin: { icon: '🛡️', label: 'ADMIN', className: 'bg-red-500/15 text-red-400 border-red-500/25' },
  admin: { icon: '🛡️', label: 'ADMIN', className: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
};

export default function NexaPersona({ user, size = 40, showBadge = false, animate = true }) {
  const [ripple, setRipple] = useState(false);
  const badge = BADGE_CONFIG[user?.role];
  const formattedName = formatName(user?.name);

  const handleClick = useCallback(() => {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
  }, []);

  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
    border: '2px solid rgba(139,92,246,0.5)',
    boxShadow: ripple
      ? '0 0 12px rgba(139,92,246,0.5), 0 0 24px rgba(139,92,246,0.3)'
      : '0 0 8px rgba(139,92,246,0.3), 0 0 16px rgba(139,92,246,0.15)',
    transition: 'transform 250ms ease, box-shadow 250ms ease',
    display: 'block',
    cursor: 'pointer',
  };

  return (
    <div className={`relative inline-flex items-center gap-2.5 group`}>
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        onClick={handleClick}
      >
        <img
          src={IMAGE_URL}
          alt={formattedName}
          style={imgStyle}
          className="select-none"
          onMouseEnter={e => {
            if (!animate) return;
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(139,92,246,0.5), 0 0 32px rgba(139,92,246,0.3)';
          }}
          onMouseLeave={e => {
            if (!animate) return;
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = ripple
              ? '0 0 12px rgba(139,92,246,0.5), 0 0 24px rgba(139,92,246,0.3)'
              : '0 0 8px rgba(139,92,246,0.3), 0 0 16px rgba(139,92,246,0.15)';
          }}
        />
        {ripple && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              animation: 'ripple 600ms ease-out',
              background: 'rgba(139,92,246,0.25)',
            }}
          />
        )}
      </div>

      {showBadge && (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-text truncate">{formattedName}</span>
          {badge && (
            <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-semibold w-fit mt-0.5 ${badge.className}`}>
              {badge.icon} {badge.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function NexaPersonaAvatar({ user, size = 40, animate = true }) {
  return <NexaPersona user={user} size={size} showBadge={false} animate={animate} />;
}

export { formatName };
