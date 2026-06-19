import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AnnouncementBar() {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api.get('/cms/announcements').then(r => {
      const data = r.data?.data || [];
      if (data.length) setItems(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;

  const item = items[current];

  const priorityColors = {
    urgent: '#EF4444',
    high: '#F97316',
    medium: '#FBBF24',
    low: '#34D399',
  };

  return (
    <div className="rounded-xl px-4 py-2.5 flex items-center gap-3" style={{
      background: 'linear-gradient(90deg, rgba(251,191,36,0.06), rgba(251,191,36,0.02))',
      border: '1px solid rgba(251,191,36,0.12)',
    }}>
      <span className="text-sm">📢</span>
      <div className="relative flex-1 min-w-0" style={{ height: '18px' }}>
        <div key={current} className="absolute inset-0 flex items-center gap-2 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priorityColors[item.priority] || '#FBBF24' }} />
          <span className="text-xs text-white font-medium truncate">{item.title}</span>
          <span className="text-[10px] text-gray-400 truncate hidden sm:inline">{item.message}</span>
        </div>
      </div>
      {items.length > 1 && (
        <div className="flex gap-1 shrink-0">
          {items.map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full transition-all" style={{
              background: i === current ? '#FBBF24' : 'rgba(251,191,36,0.2)',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
