export default function GateNexaLogo({ size = 32, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={glow ? { filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.5))' } : {}}>
      <rect width="32" height="32" rx="8" fill="url(#nexa-grad)" />
      <path d="M9 7 L9 25 M9 25 L23 7 M23 7 L23 25" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id="nexa-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
