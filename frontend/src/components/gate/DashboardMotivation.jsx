import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

const QUOTES = [
  { quote: 'Success in GATE Starts With Knowing What to Do Today.', author: 'GateApex Team' },
  { quote: 'Consistency beats intensity. Small daily progress becomes a big rank.', author: 'GateApex Team' },
  { quote: 'Every question you solve today is one step closer to your IIT dream.', author: 'GateApex Team' },
  { quote: 'The best time to start was yesterday. The next best time is now.', author: 'GateApex Team' },
  { quote: 'Don\'t count the days, make the days count.', author: 'GateApex Team' },
];

export default function DashboardMotivation() {
  const [items, setItems] = useState(QUOTES);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/cms/motivation').then(r => {
      if (r.data?.data) {
        const data = Array.isArray(r.data.data) ? r.data.data : [r.data.data];
        if (data.length) setItems(data);
      }
    }).catch(e => console.warn('[DashboardMotivation] fetch failed', e?.message));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(c => (c + 1) % items.length);
        setVisible(true);
      }, 600);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  const item = items[current] || QUOTES[0];

  return (
    <div className="relative overflow-hidden rounded-2xl p-6" style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.05))',
      border: '1px solid rgba(139,92,246,0.12)',
    }}>
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <span key={i} className="absolute w-1 h-1 rounded-full" style={{
            background: i % 2 === 0 ? 'rgba(167,139,250,0.3)' : 'rgba(34,211,238,0.2)',
            left: `${15 + i * 18}%`,
            top: `${20 + (i * 13) % 60}%`,
            animation: `float-particle ${3 + i % 3}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-12px) scale(1.5); opacity: 0.8; }
        }
      `}</style>

      <div className="relative z-10 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0" style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))',
          boxShadow: '0 0 20px rgba(167,139,250,0.15)',
        }}>
          🔥
        </div>
        <div className="flex-1 min-w-0" style={{ transition: 'opacity 0.5s ease-in-out', opacity: visible ? 1 : 0 }}>
          <p className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight">
            &ldquo;{item.quote}&rdquo;
          </p>
          <p className="text-xs text-gray-400 mt-2">— {item.author || 'GateApex Team'}</p>
        </div>
        <div className="flex gap-1.5 shrink-0 self-center">
          {items.map((_, i) => (
            <button key={i} onClick={() => { setCurrent(i); setVisible(true); }}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{ background: i === current ? '#A78BFA' : 'rgba(167,139,250,0.2)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

