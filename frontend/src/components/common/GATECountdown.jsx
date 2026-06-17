import { useState, useEffect } from 'react';

function getDaysUntilGATE2027() {
  // GATE 2027 expected: first Sunday of February 2027
  const gateDate = new Date(2027, 1, 7); // Feb 7, 2027 (first Sunday)
  const now = new Date();
  const diff = gateDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function GATECountdown() {
  const [days, setDays] = useState(getDaysUntilGATE2027());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const timer = setInterval(() => setDays(getDaysUntilGATE2027()), 3600000);
    return () => clearInterval(timer);
  }, []);

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  const progress = Math.max(0, Math.min(100, ((365 - days) / 365) * 100));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Circular progress */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="url(#countdownGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="countdownGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{days}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Days Left</div>
            </div>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-medium mb-3" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#A78BFA' }}>
            🎯 GATE 2027 Countdown
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Stay on Track</h3>
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
            {weeks} weeks and {remainingDays} days until the exam. 
            Every day counts — make each one matter.
          </p>
          <div className="flex gap-3 mt-3">
            <span className="text-[10px] text-gray-500">
              Progress: <span className="text-white font-semibold">{Math.round(progress)}%</span>
            </span>
            <span className="text-[10px] text-gray-500">
              Remaining: <span className="text-white font-semibold">{Math.round(100 - progress)}%</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
