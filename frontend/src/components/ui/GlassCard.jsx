import { memo, useMemo } from 'react';

const TINT_OVERLAY = {
  purple: 'rgba(139, 92, 246, 0.04)',
  cyan: 'rgba(34, 211, 238, 0.04)',
  orange: 'rgba(245, 158, 11, 0.05)',
  emerald: 'rgba(34, 197, 94, 0.04)',
  rose: 'rgba(225, 29, 72, 0.04)',
};

const TINT_GLOW = {
  purple: 'rgba(139, 92, 246, 0.25)',
  cyan: 'rgba(34, 211, 238, 0.2)',
  orange: 'rgba(245, 158, 11, 0.2)',
  emerald: 'rgba(34, 197, 94, 0.2)',
  rose: 'rgba(225, 29, 72, 0.2)',
};

const BLUR_MAP = { sm: 'blur(16px)', md: 'blur(24px)', lg: 'blur(32px)' };

function buildClassName({ hover, glow, padding, tint, intensity, className }) {
  const base = 'glass-card';
  const hoverClass = hover ? '' : 'hover:shadow-none';
  const glowClass = glow ? 'stat-glow' : '';
  const blurClass = intensity && BLUR_MAP[intensity] ? intensity : '';
  return [base, hoverClass, glowClass, blurClass, className].filter(Boolean).join(' ');
}

const GlassCard = memo(function GlassCard({
  children,
  className = '',
  hover = true,
  padding = 'p-5',
  glow = false,
  tint = null,
  intensity = null,
  style,
  ...props
}) {
  const computed = useMemo(() => {
    const overlay = tint && TINT_OVERLAY[tint];
    const glowColor = tint && TINT_GLOW[tint];
    const blur = intensity && BLUR_MAP[intensity];

    const customStyle = { ...style };
    if (overlay) {
      customStyle['--tint-overlay'] = overlay;
    }
    if (glowColor) {
      customStyle['--tint-glow'] = glowColor;
    }
    if (blur) {
      customStyle.backdropFilter = blur;
      customStyle.WebkitBackdropFilter = blur;
    }
    return customStyle;
  }, [tint, intensity, style]);

  return (
    <div
      className={`glass-enter ${buildClassName({ hover, glow, padding, tint, intensity, className })}${tint ? ` glass-tinted-${tint}` : ''}`}
      style={Object.keys(computed).length > 0 ? computed : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

export default GlassCard;
