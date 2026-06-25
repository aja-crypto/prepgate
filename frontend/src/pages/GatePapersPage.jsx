import { useState, useEffect, useMemo } from 'react';
import { gatePaperService } from '../services/api';

export default function GatePapersPage() {
  const [papers, setPapers] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    setLoading(true);
    gatePaperService.getAll()
      .then(r => { setPapers(r.data.data); setYears(r.data.years || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    const filtered = selectedYear ? papers.filter(p => p.year === selectedYear) : papers;
    filtered.forEach(p => {
      if (!map[p.year]) map[p.year] = [];
      map[p.year].push(p);
    });
    return Object.entries(map).sort((a, b) => b[0] - a[0]);
  }, [papers, selectedYear]);

  const totalPapers = papers.length;
  const yearRange = years.length ? `${years[0]}–${years[years.length - 1]}` : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">GATE Papers {yearRange}</h1>
        <p className="text-sm text-text3 mt-0.5">Previous year question papers for practice & download</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="text-xl font-bold font-mono text-primary">{totalPapers}</div>
          <div className="text-[10px] text-text3 uppercase mt-0.5">Total Papers</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="text-xl font-bold font-mono text-secondary">{years.length}</div>
          <div className="text-[10px] text-text3 uppercase mt-0.5">Years Covered</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="text-xl font-bold font-mono text-green-400">{yearRange}</div>
          <div className="text-[10px] text-text3 uppercase mt-0.5">Range</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedYear(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            !selectedYear ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text3 hover:text-text'
          }`}
        >All Years</button>
        {years.map(y => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              selectedYear === y ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-text3 hover:text-text'
            }`}
          >{y}</button>
        ))}
      </div>

      <div className="space-y-4">
        {grouped.map(([year, yearPapers]) => (
          <div key={year} className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text">GATE {year}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{yearPapers.length} paper{yearPapers.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {yearPapers.map((paper, i) => (
                <div key={`${year}-${i}`} className="px-4 py-3 flex items-center justify-between hover:bg-bg-2/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {year.toString().slice(-2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-text font-medium truncate">{paper.title}</div>
                      <div className="text-[10px] text-text3 mt-0.5">{paper.set} • PDF</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewFile(paper)}
                      className="text-[10px] px-3 py-1.5 rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all font-medium"
                    >View</button>
                    <a
                      href={gatePaperService.downloadUrl(paper.filename)}
                      download
                      className="text-[10px] px-3 py-1.5 rounded-lg border bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all font-medium"
                    >Download</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="text-center py-16 text-text3 text-sm">No papers found</div>
        )}
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div className="max-w-5xl max-h-[90vh] w-full bg-surface rounded-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="text-sm font-semibold text-text truncate">{previewFile.title}</div>
              <div className="flex items-center gap-2">
                <a href={gatePaperService.downloadUrl(previewFile.filename)} download className="text-[10px] px-3 py-1.5 rounded-lg border bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all font-medium">Download</a>
                <button onClick={() => setPreviewFile(null)} className="text-text3 hover:text-text p-1 text-lg">&times;</button>
              </div>
            </div>
            <div className="flex-1 min-h-0 p-2">
              <iframe
                src={gatePaperService.downloadUrl(previewFile.filename)}
                className="w-full h-full rounded"
                title={previewFile.title}
                style={{ minHeight: '75vh' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
