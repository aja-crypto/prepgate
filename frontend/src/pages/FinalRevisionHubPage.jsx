import { useState, useEffect } from 'react';
import { shortNoteService } from '../services/api';
import { silentCatch } from '../utils/errorHandler';
import { PageLoading } from '../components/common/GateLoadingScreen';

export default function FinalRevisionHubPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    shortNoteService.getAll().then(r => setSubjects(r.data.data)).catch(silentCatch('Load short notes')).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageLoading title="Loading Revision Hub" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">🚀 Final Revision Hub</h1>
        <p className="text-sm text-text3 mt-0.5">Quick-access short notes — perfect for last-week revision before GATE 2027</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(sub => (
          <div key={sub.code || sub.folder} className="bg-surface border border-border rounded-xl p-5 hover:border-white/15 transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${sub.color}15`, color: sub.color }}>{sub.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text">{sub.name}</div>
                <div className="text-[10px] text-text3">{sub.count} note file{sub.count > 1 ? 's' : ''}</div>
              </div>
              <span className="text-[9px] uppercase tracking-wider px-2 py-1 rounded-full border text-green-400 border-green-500/20 bg-green-500/5">AIR 1</span>
            </div>
            <div className="space-y-1.5">
              {sub.files.map(file => (
                <a
                  key={file.name}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text3 hover:text-text hover:border-white/15 transition-all"
                >
                  <span>{file.type === 'pdf' ? '📄' : '🖼'}</span>
                  <span className="flex-1 truncate">{file.name}</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0 opacity-40 group-hover:opacity-100"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" /></svg>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
