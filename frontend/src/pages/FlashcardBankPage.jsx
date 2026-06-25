// src/pages/FlashcardBankPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashcardService } from '../services/flashcardService';
import { useProgress } from '../context/ProgressContext';
import GlassCard from '../components/ui/GlassCard';
import toast from 'react-hot-toast';

export default function FlashcardBankPage() {
  const navigate = useNavigate();
  const { subjects } = useProgress();
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', difficulty: '', type: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addingId, setAddingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFlashcards();
  }, [filter, page, searchQuery]);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20, ...filter };
      if (searchQuery) params.search = searchQuery;
      
      const res = await flashcardService.getFlashcardBank(params);
      setFlashcards(res.data?.data || []);
      setTotalPages(res.data?.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
      toast.error('Failed to load flashcard bank');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToDeck = async (flashcardId) => {
    try {
      setAddingId(flashcardId);
      await flashcardService.addFlashcard(flashcardId, 'manual');
      toast.success('Added to your deck!');
    } catch (err) {
      console.error('Failed to add flashcard:', err);
      toast.error(err.response?.data?.message || 'Failed to add flashcard');
    } finally {
      setAddingId(null);
    }
  };

  const handleAddAllWeak = async () => {
    try {
      setAddingId('all-weak');
      // Add all weak topic flashcards
      const weakFlashcards = flashcards.filter(f => f.difficulty === 'hard' || f.difficulty === 'medium');
      for (const f of weakFlashcards) {
        await flashcardService.addFlashcard(f._id, 'weak_topic');
      }
      toast.success(`Added ${weakFlashcards.length} flashcards to your deck!`);
    } catch (err) {
      console.error('Failed to add weak flashcards:', err);
      toast.error('Failed to add flashcards');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-text">Flashcard Bank</h1>
            <p className="text-sm text-text3 mt-0.5">
              Browse and add flashcards to your review deck
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/flashcards')} className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all">
              Go to Review
            </button>
            <button onClick={handleAddAllWeak} disabled={addingId === 'all-weak'} className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-text2 text-sm font-medium hover:bg-white/[0.1] transition-all disabled:opacity-50">
              {addingId === 'all-weak' ? 'Adding...' : 'Add All Weak Topics'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search flashcards..."
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
            {subjects?.map(s => (
              <option key={s._id} value={s.name}>{s.name}</option>
            ))}
          </select>
          <select
            value={filter.difficulty}
            onChange={(e) => { setFilter(f => ({ ...f, difficulty: e.target.value })); setPage(1); }}
            className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={filter.type}
            onChange={(e) => { setFilter(f => ({ ...f, type: e.target.value })); setPage(1); }}
            className="bg-bg-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary/60"
          >
            <option value="">All Types</option>
            <option value="MCQ">MCQ</option>
            <option value="NAT">NAT</option>
            <option value="FITB">Fill in Blank</option>
            <option value="SHORT_ANSWER">Short Answer</option>
          </select>
        </div>
      </div>

      {/* Flashcard Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : flashcards.length === 0 ? (
        <GlassCard hover={false} padding="p-12" className="text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-text mb-2">No Flashcards Found</h2>
          <p className="text-text3">Try adjusting your filters or search query.</p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {flashcards.map((card) => (
              <GlassCard key={card._id} hover={false} padding="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {card.subject?.name || 'General'}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                        card.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
                        card.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {card.difficulty}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-text line-clamp-2">
                      {card.question}
                    </h3>
                  </div>
                  <span className="text-[10px] text-text3 shrink-0">{card.questionType}</span>
                </div>

                {card.options?.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {card.options.slice(0, 2).map((opt, i) => (
                      <div key={i} className="text-[11px] text-text2 truncate">
                        <span className="font-mono">{opt.key}.</span> {opt.text}
                      </div>
                    ))}
                    {card.options.length > 2 && (
                      <div className="text-[10px] text-text3">+{card.options.length - 2} more options</div>
                    )}
                  </div>
                )}

                {card.years?.length > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-[9px] text-text3">GATE:</span>
                    {card.years.slice(0, 3).map(y => (
                      <span key={y} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-text3">{y}</span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleAddToDeck(card._id)}
                  disabled={addingId === card._id}
                  className="w-full py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {addingId === card._id ? 'Adding...' : 'Add to Deck'}
                </button>
              </GlassCard>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-text2 text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-text3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-text2 text-sm hover:bg-white/[0.1] transition-all disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}