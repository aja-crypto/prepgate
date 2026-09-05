// SVG progress ring — replaces basic progress bars
export default function ProgressRing({
  value = 0,
  size = 80,
  stroke = 6,
  color = 'var(--color-primary)',
  trackColor = 'var(--color-border)',
  label,
  sublabel,
  className = '',
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          opacity={0.4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold font-mono text-text leading-none">{Math.round(value)}%</span>
        {label && <span className="text-[9px] text-text3 uppercase tracking-wider mt-0.5">{label}</span>}
      </div>
      {sublabel && <span className="text-[10px] text-text3 mt-2 text-center max-w-[90px] truncate">{sublabel}</span>}
    </div>
  );
}

// Compact inline ring for lists
export function ProgressRingMini({ value = 0, size = 36, stroke = 3, color = 'var(--color-primary)' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative inline-flex shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} opacity={0.4} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-500" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-semibold text-text2">{Math.round(value)}</span>
    </div>
  );
}
