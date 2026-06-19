import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    api.get('/cms/announcements').then(r => {
      const data = r.data?.data || [];
      if (data.length) {
        setAnnouncements(data);
        setVisible(true);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setVisible(false);
        setTimeout(() => {
          setAnnouncements(arr => [...arr.slice(1), arr[0]]);
          setVisible(true);
        }, 500);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [announcements.length]);

  if (!announcements.length) return null;

  const current = announcements[0];

  const priorityColors = {
    urgent: '#EF4444',
    high: '#F97316',
    medium: '#FBBF24',
    low: '#34D399',
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border animate-slide-down" style={{
      background: 'linear-gradient(90deg, rgba(239,68,68,0.08), rgba(251,191,36,0.05))',
      borderColor: 'rgba(239,68,68,0.2)',
    }}>
      <span className="text-sm">📢</span>
      <div className="relative flex-1 min-w-0">
        <div key={current.title} className="flex items-center gap-2 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priorityColors[current.priority] || '#FBBF24' }} />
          <span className="text-xs font-semibold text-white truncate">{current.title}</span>
          {current.link && (
            <a href={current.link} target="_blank" rel="noopener noreferrer" className="text-xs ml-2 px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.1)', color: '#FBBF24' }}>
              Learn more →
            </a>
          )}
        </div>
      </div>
      {announcements.length > 1 && (
        <div className="flex gap-1 shrink-0">
          {announcements.map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full transition-all" style={{
              background: i === 0 ? '#FBBF24' : 'rgba(251,191,36,0.2)',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

<style>{`
  @keyframes slide-down {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`}</style>
