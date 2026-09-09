import React, { useState, useEffect } from 'react';

export default function OfficialCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    // GATE 2027 Date (Feb 1st, 2027)
    const target = new Date('2027-02-01T09:00:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1.5 font-mono text-primary font-black">
      <div className="flex flex-col items-center">
        <span className="text-sm leading-none">{timeLeft.days}</span>
        <span className="text-[7px] uppercase tracking-tighter opacity-50">Days</span>
      </div>
      <span className="opacity-30 text-[10px] mb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-sm leading-none">{timeLeft.hours}</span>
        <span className="text-[7px] uppercase tracking-tighter opacity-50">Hrs</span>
      </div>
      <span className="opacity-30 text-[10px] mb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-sm leading-none">{timeLeft.mins}</span>
        <span className="text-[7px] uppercase tracking-tighter opacity-50">Min</span>
      </div>
      <span className="opacity-30 text-[10px] mb-2">:</span>
      <div className="flex flex-col items-center">
        <span className="text-sm leading-none">{timeLeft.secs}</span>
        <span className="text-[7px] uppercase tracking-tighter opacity-50">Sec</span>
      </div>
    </div>
  );
}
