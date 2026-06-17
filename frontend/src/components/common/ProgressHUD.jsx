import { useState, useEffect } from 'react';

function AnimatedNumber({ value, suffix = '', color = '#FFFFFF' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value, displayValue]);

  return (
    <span style={{ color }}>
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

function ReadinessHUD({ value, activeBrainRegion }) {
  const radius = 45;
  const strokeWidth = 4;
  const normalizedValue = Math.max(0, Math.min(100, value)) / 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedValue * circumference);

  const getReadinessColor = (value) => {
    if (value >= 80) return '#22C55E';
    if (value >= 60) return '#10B981';
    if (value >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getReadinessText = (value) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={getReadinessColor(value)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: activeBrainRegion ? `drop-shadow(0 0 15px ${getReadinessColor(value)}60)` : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[20px] font-bold" style={{ color: getReadinessColor(value) }}>
          <AnimatedNumber value={value} suffix="%" />
        </div>
        <div className="text-[8px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {getReadinessText(value)}
        </div>
      </div>
    </div>
  );
}

const radius = 45;
const strokeWidth = 4;
const circumference = 2 * Math.PI * radius;

function AIRPredictionHUD({ value }) {
  const getAIRColor = (value) => {
    if (value >= 5000) return '#22C55E';
    if (value >= 3000) return '#10B981';
    if (value >= 2000) return '#F59E0B';
    return '#EF4444';
  };

  const getAIRBand = (value) => {
    if (value >= 5000) return 'Elite';
    if (value >= 3000) return 'Strong';
    if (value >= 2000) return 'Good';
    return 'Building';
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={getAIRColor(value)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (Math.min(value, 5000) / 5000 * circumference)}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[20px] font-bold" style={{ color: getAIRColor(value) }}>
          <AnimatedNumber value={Math.round(value / 100)} suffix="k" />
        </div>
        <div className="text-[8px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {getAIRBand(value)}
        </div>
      </div>
    </div>
  );
}

export { ReadinessHUD, AIRPredictionHUD };