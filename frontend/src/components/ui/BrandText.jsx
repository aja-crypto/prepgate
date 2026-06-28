const NEXA_GRADIENT = {
  background: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 40%, #60A5FA 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export function GateText({ className = '' }) {
  return <span className={`text-white ${className}`}>Gate</span>;
}

export function NexaText({ className = '' }) {
  return <span className={className} style={NEXA_GRADIENT}>Nexa</span>;
}

export default function BrandText({ className = '' }) {
  return (
    <span className={className}>
      <GateText />
      <NexaText />
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
