import { useState, useEffect, useMemo } from 'react';
import { shortNoteService } from '../services/api';
import { PageLoading } from '../components/common/GateLoadingScreen';

export default function ShortNotesPage() {
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setLoading(true);
    shortNoteService.getAll().then(r => setSubjects(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return subjects;
    const s = search.toLowerCase();
    return subjects.filter(sub =>
      sub.name?.toLowerCase().includes(s) ||
      sub.code?.toLowerCase().includes(s) ||
      sub.files?.some(f => f.name.toLowerCase().includes(s))
    );
  }, [subjects, search]);

  const totalNotes = subjects.reduce((sum, s) => sum + s.count, 0);

  if (loading) {
    return <PageLoading title="Loading Short Notes" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">AIR 1 Short Notes</h1>
        <p className="text-sm text-text3 mt-0.5">Concise GATE revision notes curated from toppers</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="text-xl font-bold font-mono text-primary">{subjects.length}</div>
          <div className="text-[10px] text-text3 uppercase mt-0.5">Subjects</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="text-xl font-bold font-mono text-secondary">{totalNotes}</div>
          <div className="text-[10px] text-text3 uppercase mt-0.5">Note Files</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="text-xl font-bold font-mono text-green-400">AIR 1</div>
          <div className="text-[10px] text-text3 uppercase mt-0.5">Curated</div>
        </div>
      </div>

      <div className="relative mb-5">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text3"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        <input type="text" placeholder="Search subjects or notes..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-bg-2 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/40" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sub, subIdx) => (
          <div key={`sub-${subIdx}-${sub.code || sub.folder || sub.name}`} className="bg-surface border border-border rounded-xl p-5 hover:border-white/15 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${sub.color}15`, color: sub.color }}>{sub.icon}</div>
              <div>
                <div className="text-sm font-semibold text-text">{sub.name}</div>
                <div className="text-xs text-text3 mt-0.5">{sub.count} file{sub.count > 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="space-y-2">
              {sub.files.map((file, fileIdx) => (
                <div key={`file-${subIdx}-${fileIdx}-${file.name}`} className="flex items-center justify-between bg-bg-2 border border-border rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs">{file.type === 'pdf' ? '📄' : '🖼'}</span>
                    <span className="text-[11px] text-text truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {file.type === 'pdf' && (
                      <button onClick={() => window.open(file.fileUrl, '_blank')} className="text-[10px] px-2 py-1 rounded border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all">View</button>
                    )}
                    <a href={file.fileUrl} download={file.name} className="text-[10px] px-2 py-1 rounded border bg-bg-2 border-border text-text3 hover:text-secondary hover:border-secondary/30 transition-all">Download</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-16 text-text3 text-sm">No short notes found</div>}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="max-w-4xl max-h-[90vh] w-full bg-surface rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold text-text truncate">{preview.name}</div>
              <button onClick={() => setPreview(null)} className="text-text3 hover:text-text p-1">&times;</button>
            </div>
            <div className="p-2">
              {preview.type === 'pdf' ? (
                <iframe src={preview.fileUrl} className="w-full h-[75vh] rounded" title={preview.name} />
              ) : (
                <img src={preview.fileUrl} alt={preview.name} className="max-w-full max-h-[75vh] mx-auto object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
