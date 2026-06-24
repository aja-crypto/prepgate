import { memo } from 'react';

// Premium glass card container
const GlassCard = memo(function GlassCard({
  children,
  className = '',
  hover = true,
  padding = 'p-5',
  glow = false,
  ...props
}) {
  // Ensure custom props don't bleed into the DOM
  const { hover: _h, glow: _g, padding: _p, ...domProps } = props;

  return (
    <div
      className={`glass-card ${padding} ${hover ? '' : 'hover:shadow-none'} ${glow ? 'stat-glow' : ''} ${className}`}
      {...domProps}
    >
      {children}
    </div>
  );
});

export default GlassCard;
