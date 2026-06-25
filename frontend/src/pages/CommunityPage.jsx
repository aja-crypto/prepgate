// src/pages/CommunityPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = '/api/community';

export default function CommunityPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', type: '', sort: 'votes' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAskModal, setShowAskModal] = useState(false);
  const [askForm, setAskForm] = useState({ title: '', body: '', subject: '', topic: '', type: 'concept', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadQuestions(); }, [filter, page]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ page, limit: 15, ...filter });
      const res = await axios.get(`${API}/questions?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setQuestions(res.data?.data || []);
      setTotalPages(res.data?.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load questions:', err);
      toast.error('Failed to load community questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!askForm.title || !askForm.body || !askForm.subject) {
      return toast.error('Title, body, and subject are required');
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem('accessToken');
      const tags = askForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      await axios.post(`${API}/questions`, { ...askForm, tags }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Question posted!');
      setShowAskModal(false);
      setAskForm({ title: '', body: '', subject: '', topic: '', type: 'concept', tags: '' });
      loadQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (questionId, vote) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API}/questions/${questionId}/vote`, { vote }, { headers: { Authorization: `Bearer ${token}` } });
      loadQuestions();
    } catch (err) {
      toast.error('Failed to vote');
    }
  };

  const subjects = ['Engineering Mathematics', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks', 'Theory of Computation', 'Compiler Design', 'Computer Organization', 'Digital Logic', 'General Aptitude'];

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">Community Q&A</h1>
          <p className="text-sm text-text3 mt-0.5">Ask doubts, share knowledge, learn together</p>
        </div>
        <button onClick={() => setShowAskModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all">
          Ask Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filter.subject} onChange={e => { setFilter(f => ({ ...f, subject: e.target.value })); setPage(1); }} className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60">
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.type} onChange={e => { setFilter(f => ({ ...f, type: e.target.value })); setPage(1); }} className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60">
          <option value="">All Types</option>
          <option value="concept">Concept</option>
          <option value="doubt">Doubt</option>
          <option value="problem">Problem</option>
          <option value="formula">Formula</option>
          <option value="strategy">Strategy</option>
        </select>
        <select value={filter.sort} onChange={e => setFilter(f => ({ ...f, sort: e.target.value }))} className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60">
          <option value="votes">Top Voted</option>
          <option value="recent">Most Recent</option>
          <option value="unanswered">Unanswered</option>
        </select>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : questions.length === 0 ? (
        <GlassCard hover={false} padding="p-12" className="text-center">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-xl font-bold text-text mb-2">No Questions Yet</h2>
          <p className="text-text3 mb-6">Be the first to ask a question!</p>
          <button onClick={() => setShowAskModal(true)} className="px-6 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium hover:bg-primary/20 transition-all">
            Ask the First Question
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {questions.map(q => (
            <GlassCard key={q._id} hover={false} padding="p-4">
              <div className="flex gap-4">
                {/* Vote column */}
                <div className="flex flex-col items-center gap-1 min-w-[50px]">
                  <button onClick={() => handleVote(q._id, 1)} className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-text2 hover:text-primary transition-all flex items-center justify-center text-lg">▲</button>
                  <span className="text-sm font-bold text-text">{q.upvotes - q.downvotes}</span>
                  <button onClick={() => handleVote(q._id, -1)} className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-text2 hover:text-red-400 transition-all flex items-center justify-center text-lg">▼</button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{q.subject}</span>
                    {q.topic && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text3">{q.topic}</span>}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${q.type === 'concept' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>{q.type}</span>
                  </div>
                  
                  <h3 className="text-base font-semibold text-text mb-2 hover:text-primary cursor-pointer" onClick={() => navigate(`/community/question/${q._id}`)}>
                    {q.title}
                  </h3>
                  
                  <p className="text-sm text-text3 line-clamp-2 mb-3">{q.body}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-text3">
                      <span>{q.answerCount || 0} answers</span>
                      <span>{q.viewCount || 0} views</span>
                      {q.acceptedAnswer && <span className="text-green-400">✓ Answered</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text3">{q.user?.name || 'Anonymous'}</span>
                      <span className="text-[9px] text-text3">{new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-text2 text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50">
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-text3">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-text2 text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ask Question Modal */}
      <Modal open={showAskModal} onClose={() => setShowAskModal(false)} title="Ask a Question" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Title *</label>
            <input value={askForm.title} onChange={e => setAskForm(f => ({ ...f, title: e.target.value }))} placeholder="What's your question?" className="w-full bg-bg-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Details *</label>
            <textarea value={askForm.body} onChange={e => setAskForm(f => ({ ...f, body: e.target.value }))} placeholder="Provide more context..." rows={5} className="w-full bg-bg-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/60 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Subject *</label>
              <select value={askForm.subject} onChange={e => setAskForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/60">
                <option value="">Select</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Topic</label>
              <input value={askForm.topic} onChange={e => setAskForm(f => ({ ...f, topic: e.target.value }))} placeholder="Specific topic" className="w-full bg-bg-2 border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/60" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Tags (comma separated)</label>
            <input value={askForm.tags} onChange={e => setAskForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g., algorithms, sorting, time-complexity" className="w-full bg-bg-2 border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/60" />
          </div>
          <button onClick={handleAskQuestion} disabled={submitting} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50">
            {submitting ? 'Posting...' : 'Post Question'}
          </button>
        </div>
      </Modal>
    </div>
  );
}