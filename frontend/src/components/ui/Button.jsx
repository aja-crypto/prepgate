import { forwardRef } from 'react';

const SIZE = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

const VARIANT = {
  primary: [
    'bg-primary text-white shadow-primary',
    'hover:shadow-primary-lg hover:-translate-y-0.5',
    'active:shadow-primary-sm active:translate-y-0',
  ],
  secondary: [
    'bg-primary/10 text-primary border border-primary/20',
    'hover:bg-primary/15 hover:border-primary/30 hover:-translate-y-0.5',
    'active:bg-primary/10 active:translate-y-0',
  ],
  ghost: [
    'bg-transparent text-text2 border border-border',
    'hover:text-text hover:bg-primary/5 hover:border-primary/15 hover:-translate-y-0.5',
    'active:bg-primary/5 active:translate-y-0',
  ],
  danger: [
    'bg-danger/10 text-danger border border-danger/20',
    'hover:bg-danger/15 hover:border-danger/30 hover:-translate-y-0.5',
    'active:bg-danger/10 active:translate-y-0',
  ],
  link: [
    'bg-transparent text-primary hover:underline underline-offset-4 px-0',
    'hover:no-underline',
  ],
};

const LoadingSpinner = () => (
  <svg
    className="animate-spin"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
  </svg>
);

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    as: Tag = 'button',
    ...props
  },
  ref
) {
  const baseClass = [
    'inline-flex items-center justify-center gap-2 rounded-xl',
    'font-medium transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
    SIZE[size],
    VARIANT[variant]?.join(' ') ?? VARIANT.primary.join(' '),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isDisabled = disabled || loading;

  if (Tag === 'button') {
    return (
      <button
        ref={ref}
        className={baseClass}
        disabled={isDisabled}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {children}
      </button>
    );
  }

  return (
    <Tag
      ref={ref}
      className={`${baseClass}${isDisabled ? ' pointer-events-none opacity-40' : ''}`}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {children}
    </Tag>
  );
});

export default Button;