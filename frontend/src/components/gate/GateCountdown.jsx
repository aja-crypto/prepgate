// GATE 2027 exam countdown timer
import { useEffect, useState } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { getCountdown } from '../../utils/gateUtils';

export default function GateCountdown({ prominent = false }) {
  const { gateFeatures } = useProgress();
  const [cd, setCd] = useState(() => getCountdown(gateFeatures.examDate));

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(gateFeatures.examDate)), 1000);
    return () => clearInterval(t);
  }, [gateFeatures.examDate]);

  const examLabel = new Date(gateFeatures.examDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const units = [
    { v: cd.days, l: 'Days' },
    { v: cd.hours, l: 'Hours' },
    { v: cd.minutes, l: 'Mins' },
    { v: cd.seconds, l: 'Secs' },
  ];

  if (prominent) {
    return (
      <div className="bg-gradient-to-br from-primary/20 via-surface to-secondary/10 border border-primary/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-lg font-bold text-text">⏳ GATE 2027 Countdown</div>
            <div className="text-[11px] text-text3 mt-0.5">Exam date: {examLabel} (configurable in Settings)</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold font-mono text-primary">{cd.days}</div>
            <div className="text-[10px] text-text3 uppercase">days left</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {units.map((x) => (
            <div key={x.l} className="bg-bg-2/80 border border-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary font-mono">{String(x.v).padStart(2, '0')}</div>
              <div className="text-[10px] text-text3 uppercase tracking-wider mt-1">{x.l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-text">GATE 2027 Countdown</div>
          <div className="text-[11px] text-text3 mt-0.5">{examLabel}</div>
        </div>
        <span className="text-xl">⏳</span>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {units.map((x) => (
          <div key={x.l} className="bg-bg-2 border border-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary font-mono">{String(x.v).padStart(2, '0')}</div>
            <div className="text-[10px] text-text3 uppercase tracking-wider mt-1">{x.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
