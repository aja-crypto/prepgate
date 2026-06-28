import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const QUOTES = [
  { quote: 'Success in GATE Starts With Knowing What to Do Today.', author: 'GateNexa Team' },
  { quote: 'Consistency beats intensity. Small daily progress becomes a big rank.', author: 'GateNexa Team' },
  { quote: 'Don\'t count the days, make the days count.', author: 'GateNexa Team' },
  { quote: 'Hard work beats talent. When talent doesn\'t work hard, hard work wins.', author: 'Unknown' },
  { quote: 'Every question you solve today is one step closer to your IIT dream.', author: 'GateNexa Team' },
];
export default function MotivationCard() {
  const [quote, setQuote] = useState(QUOTES[0]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    api.get('/cms/motivation').then(r => {
      if (r.data?.data) {
        const data = Array.isArray(r.data.data) ? r.data.data : [r.data.data];
        if (data.length) setQuote(data[0]);
      }
    }).catch(e => console.warn('[MotivationCard] fetch failed', e?.message));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQuote(prev => {
          const idx = QUOTES.findIndex(q => q.quote === prev.quote);
          const nextIdx = (idx + 1) % QUOTES.length;
          return QUOTES[nextIdx];
        });
        setVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/20 backdrop-blur-md shadow-lg animate-fade-in" style={{ backdropFilter: 'blur(12px)' }}>
      <span className="text-xl">🔥</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{quote.quote}</p>
        <p className="text-xs text-text2 truncate">— {quote.author}</p>
      </div>
    </div>
  );
}

