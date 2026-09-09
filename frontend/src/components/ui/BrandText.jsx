const NEXA_GRADIENT = {
  background: 'linear-gradient(110deg, #E9D5FF 0%, #A78BFA 36%, #8B5CF6 68%, #6366F1 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export function NexaMark({ className = '', size = 34 }) {
  return (
    <span
      className={`nexa-mark ${className}`}
      style={{ width: size * 1.78, height: size }}
      aria-hidden="true"
    >
      <img src="/images/logo.png" alt="GateNexa" className="nexa-mark__image" />
    </span>
  );
}

export function GateText({ className = '' }) {
  return <span className={`text-white/70 ${className}`}>GATE</span>;
}

export function NexaText({ className = '' }) {
  return <span className={className} style={NEXA_GRADIENT}>NEXA</span>;
}

export default function BrandText({ className = '' }) {
  return (
    <span className={className}>
      <GateText />
      <NexaText />
    </span>
  );
}

export function BrandLockup({ className = '', compact = false, showProduct = true }) {
  return (
    <span className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''} ${className}`}>
      <NexaMark size={compact ? 28 : 38} />
      <span className="brand-lockup__copy">
        <span className="brand-lockup__wordmark"><GateText /> <NexaText /></span>
        {showProduct && <span className="brand-lockup__product">GATE 2027</span>}
      </span>
    </span>
  );
}

export function BrandName({ className = '', size = '22px', fontWeight = 700, letterSpacing = '6px' }) {
  return (
    <span className={className} style={{ fontSize: size, fontWeight, letterSpacing, lineHeight: '1.1' }}>
      <GateText />
      <NexaText />
    </span>
  );
}
