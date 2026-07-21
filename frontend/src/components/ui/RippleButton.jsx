import { forwardRef, useState, useCallback } from 'react';
import { useTouchPress } from '../../hooks/useTouchPress';

const RippleButton = forwardRef(function RippleButton({
  children, onClick, className = '', variant = 'ghost',
  disabled = false, rippleColor = 'rgba(139,92,246,0.15)', ...props
}, ref) {
  const { isPressed, handlers } = useTouchPress(150);
  const [ripples, setRipples] = useState([]);

  const handleClick = useCallback((e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { x, y, id }]);
    setTimeout(() => setRipples((r) => r.filter((ri) => ri.id !== id)), 600);
    onClick?.(e);
  }, [disabled, onClick]);

  const baseClasses = [
    'relative overflow-hidden',
    'inline-flex items-center justify-center gap-2 rounded-xl',
    'font-medium transition-all duration-200',
    'select-none -webkit-tap-highlight-color-transparent',
    'active:scale-[0.97]',
    disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
    isPressed && !disabled && 'scale-[0.97]',
    variant === 'primary' && 'bg-primary text-white shadow-lg shadow-primary/20',
    variant === 'secondary' && 'bg-primary/10 text-primary border border-primary/20',
    variant === 'ghost' && 'bg-transparent text-text2 border border-border hover:text-text hover:border-primary/20',
    variant === 'danger' && 'bg-danger/10 text-danger border border-danger/20',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled}
      {...handlers}
      {...props}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute pointer-events-none rounded-full animate-ripple"
          style={{
            left: r.x - 10,
            top: r.y - 10,
            width: 20,
            height: 20,
            background: rippleColor,
          }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </button>
  );
});

export default RippleButton;
