import { isAfter, subHours } from 'date-fns';

// PSU recruitment and M.Tech admission notifications
export default function RecruitmentFeed({ psuRecruitments = [], mtechAdmissions = [], internships = [] }) {
  const sections = [
    { title: 'PSU Recruitments', icon: '🏭', items: psuRecruitments, color: '#ff9f43' },
    { title: 'M.Tech Admissions', icon: '🎓', items: mtechAdmissions, color: '#4f8dff' },
    { title: 'CSE Internships', icon: '💼', items: internships, color: '#06d6a0' },
  ];

  const isNew = (date) => {
    if (!date) return false;
    return isAfter(new Date(date), subHours(new Date(), 24));
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-sm font-semibold text-text mb-1">🏢 Recruitment & Admissions</div>
      <div className="text-[11px] text-text3 mb-4">PSU · IIT/NIT/IIIT · Internships</div>
      <div className="space-y-4">
        {sections.map((sec) => (
          <div key={sec.title}>
            <div className="flex items-center gap-2 mb-2">
              <span>{sec.icon}</span>
              <span className="text-xs font-semibold text-text2">{sec.title}</span>
              <span className="text-[10px] text-text3">({sec.items.length})</span>
            </div>
            <div className="space-y-1.5">
              {sec.items.slice(0, 4).map((item, i) => (
                <a
                  key={item._id || i}
                  href={item.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-bg-2 border border-border rounded-lg p-2.5 hover:border-primary/30 transition-all hover:translate-x-0.5 relative overflow-hidden"
                >
                  <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0 font-bold" style={{ background: `${sec.color}15`, color: sec.color }}>
                    {item.category}
                  </span>
                  <span className="text-xs text-text truncate flex-1">{item.title}</span>
                  {isNew(item.publishedAt) && (
                    <span className="text-[8px] font-bold text-primary bg-primary/10 px-1 rounded">NEW</span>
                  )}
                  <span className="text-[10px] text-primary shrink-0 opacity-50">→</span>
                </a>
              ))}
              {!sec.items.length && <div className="text-[10px] text-text3 px-2 italic">No updates yet</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
