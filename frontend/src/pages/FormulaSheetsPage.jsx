// src/pages/FormulaSheetsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = '/api/formula-sheets';

export default function FormulaSheetsPage() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', difficulty: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadSheets(); }, [filter, page, searchQuery]);

  const loadSheets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page, limit: 12, ...filter });
      if (searchQuery) params.append('search', searchQuery);
      const res = await axios.get(`${API}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setSheets(res.data?.data || []);
      setTotalPages(res.data?.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load formula sheets:', err);
      toast.error('Failed to load formula sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sheetId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API}/${sheetId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Saved to your collection!');
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const subjects = ['Engineering Mathematics', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks', 'Theory of Computation', 'Compiler Design', 'Computer Organization', 'Digital Logic', 'General Aptitude'];

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-text">Formula Sheets</h1>
            <p className="text-sm text-text3 mt-0.5">Essential formulas for GATE preparation</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search formulas..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/60"
            />
          </div>
          <select
            value={filter.subject}
            onChange={(e) => { setFilter(f => ({ ...f, subject: e.target.value })); setPage(1); }}
            className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filter.difficulty}
            onChange={(e) => { setFilter(f => ({ ...f, difficulty: e.target.value })); setPage(1); }}
            className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60"
          >
            <option value="">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Formula Sheets Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : sheets.length === 0 ? (
        <GlassCard hover={false} padding="p-12" className="text-center">
          <div className="text-5xl mb-4">📐</div>
          <h2 className="text-xl font-bold text-text mb-2">No Formula Sheets Found</h2>
          <p className="text-text3 mb-6">Try adjusting your filters or search query.</p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {sheets.map((sheet) => (
              <GlassCard key={sheet._id} hover={false} padding="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {sheet.subject}
                      </span>
                      {sheet.difficulty && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                          sheet.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                          sheet.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {sheet.difficulty}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-text mb-1">{sheet.topic}</h3>
                    <div className="flex items-center gap-3 text-xs text-text3">
                      <span>{sheet.totalFormulas || sheet.totalFormulasCount || 0} formulas</span>
                      {(sheet.totalMarksWeight || sheet.totalMarksWeightCount > 0) && (
                        <span className="text-orange-400">~{(sheet.totalMarksWeight || sheet.totalMarksWeightCount || 0)} marks</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleSave(sheet._id)} className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-text2 hover:text-primary transition-all flex items-center justify-center shrink-0">
                    📥
                  </button>
                </div>

                {sheet.gateNotes && (
                  <p className="text-xs text-text3 line-clamp-2 mb-3 bg-white/[0.02] rounded-lg p-2">
                    💡 {sheet.gateNotes}
                  </p>
                )}

                {sheet.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sheet.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-text3">{tag}</span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => navigate(`/formula-sheets/${sheet._id}`)}
                  className="w-full py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
                >
                  View Formula Sheet
                </button>
              </GlassCard>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-text2 text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50">
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-text3">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-text2 text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}