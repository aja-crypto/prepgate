import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PyqPapersPage() {
  const [years, setYears] = useState([]);
  const [papers, setPapers] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYear) fetchPapersForYear(selectedYear);
  }, [selectedYear]);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/pyq-papers/years', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await res.json();
      if (data.success) setYears(data.data);
      if (data.data.length > 0) setSelectedYear(data.data[0]);
    } catch (err) {
      console.error('Failed to fetch years:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPapersForYear = async (year) => {
    try {
      const res = await fetch('/api/pyq-papers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setPapers(data.data.filter(p => p.year === year));
      }
    } catch (err) {
      console.error('Failed to fetch papers:', err);
    }
  };

  const getSetLabel = (set) => {
    const labels = { 1: 'Set 1', 2: 'Set 2', 3: 'Set 3' };
    return labels[set] || `Set ${set}`;
  };

  const getPdfUrl = (paper) => {
    if (!paper.pdfUrl) return '#';
    if (paper.pdfUrl.startsWith('http')) return paper.pdfUrl;
    return paper.pdfUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-text3">Loading PYQ Papers...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">GATE Previous Year Papers</h1>
        <p className="text-text3">Access GATE CSE previous year papers from 2000 to 2026</p>
      </div>

      {/* Year selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {years.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedYear === year
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-surface text-text3 hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Papers for selected year */}
      {selectedYear && (
        <div>
          <h2 className="text-xl font-semibold text-text mb-4">GATE CSE {selectedYear}</h2>
          {papers.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-text3">No papers available for {selectedYear} yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {papers.map((paper) => (
                <div key={paper._id || paper.id} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.1))' }}>
                        <span className="text-xl">📄</span>
                      </div>
                      <div>
                        <p className="font-semibold text-text">{paper.title || `GATE CSE ${paper.year} ${getSetLabel(paper.set)}`}</p>
                        <p className="text-sm text-text3">{paper.subject} • {getSetLabel(paper.set)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={getPdfUrl(paper)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg font-medium text-white bg-primary/90 hover:bg-primary transition-all flex items-center gap-2"
                      >
                        <span>👁</span> View
                      </a>
                      <a
                        href={getPdfUrl(paper)}
                        download={paper.fileName || `GATE_CSE_${paper.year}_Set${paper.set}.pdf`}
                        className="px-4 py-2 rounded-lg font-medium bg-surface border border-border hover:bg-primary/10 transition-all flex items-center gap-2"
                      >
                        <span>⬇</span> Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state for no years */}
      {years.length === 0 && !loading && (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-text mb-2">No PYQ Papers Available</h3>
          <p className="text-text3">PYQ papers will appear here once admin uploads them.</p>
        </div>
      )}
    </div>
  );
}