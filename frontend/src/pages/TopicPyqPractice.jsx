// Topic-wise PYQ Practice with advanced filters
import { useState, useMemo, useEffect, useCallback } from 'react';
import { pyqService } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import QuestionPractice from '../components/pyq/QuestionPractice';
import ProgressRing from '../components/ui/ProgressRing';
import toast from 'react-hot-toast';

const DIFF_COLORS = {
  easy: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
  medium: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  hard: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
};

const STAT_COLORS = {
  high: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
  medium: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  low: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
};

export default function TopicPyqPractice() {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [yearRange, setYearRange] = useState({ start: 'All', end: 'All' });
  const [difficulty, setDifficulty] = useState('All');
  const [marksRange, setMarksRange] = useState({ min: 0, max: 10 });
  const [solvedOnly, setSolvedOnly] = useState(false);
  const [revisionOnly, setRevisionOnly] = useState(false);
  const [difficultOnly, setDifficultOnly] = useState(false);
  const [sortBy, setSortBy] = useState('year-desc');

  const [pyqs, setPyqs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const statsCallback = useCallback((r) => setStats(r.data.data), []);
  const fetchPyqs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubject !== 'All') params.set('subject', selectedSubject);
      if (selectedTopic !== 'All') params.set('topic', selectedTopic);
      if (yearRange.start !== 'All') params.set('year', yearRange.start);
      if (yearRange.end !== 'All') params.set('endYear', yearRange.end);
      if (difficulty !== 'All') params.set('difficulty', difficulty);
      if (solvedOnly) params.set('solved', 'true');
      if (revisionOnly) params.set('revision', 'true');
      if (difficultOnly) params.set('difficult', 'true');
      if (sortBy) params.set('sortBy', sortBy);

      const res = await pyqService.getAll({ ...Object.fromEntries(params), limit: 500 });
      setPyqs(res.data.data || []);
    } catch (e) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedTopic, yearRange, difficulty, solvedOnly, revisionOnly, difficultOnly, sortBy]);

  useEffect(() => { fetchPyqs(); }, [fetchPyqs]);

  const filtered = useMemo(() => {
    return pyqs.filter((q) => {
      if (marksRange.min > 0 && q.marks < marksRange.min) return false;
      if (marksRange.max < 999 && q.marks > marksRange.max) return false;
      return true;
    });
  }, [pyqs, marksRange]);

  const groupedByTopic = useMemo(() => {
    const groups = {};
    filtered.forEach((q) => {
      if (!groups[q.topic]) groups[q.topic] = { total: 0, solved: 0, correct: 0, averageMarks: 0, difficultyDistribution: { easy: 0, medium: 0, hard: 0 } };
      const g = groups[q.topic];
      g.total++;
      g.averageMarks += q.marks || 0;
      if (q.difficulty) g.difficultyDistribution[q.difficulty] = (g.difficultyDistribution[q.difficulty] || 0) + 1;
    });

    Object.values(groups).forEach((g) => {
      g.averageMarks = g.total ? g.averageMarks / g.total : 0;
    });

    return groups;
  }, [filtered]);

  const getAccuracyColor = (pct) => {
    if (pct >= 70) return STAT_COLORS.high;
    if (pct >= 40) return STAT_COLORS.medium;
    return STAT_COLORS.low;
  };

  const getDifficultyLabel = (dist) => {
    const maxDiff = ['easy', 'medium', 'hard'].sort((a, b) => (dist[b] || 0) - (dist[a] || 0))[0];
    return maxDiff ? maxDiff.charAt(0).toUpperCase() + maxDiff.slice(1) : 'N/A';
  };

  const years = useMemo(() => ['All', ...new Set(pyqs.map((q) => q.year))].sort((a, b) => (b === 'All' ? 1 : a === 'All' ? -1 : b - a)), [pyqs]);
  const subjects = useMemo(() => ['All', ...new Set(pyqs.map((q) => q.subject))], [pyqs]);
  const topics = useMemo(() => ['All', ...new Set(pyqs.map((q) => q.topic).filter(Boolean))], [pyqs]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
              <Icon name="book" className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm text-text3">Loading questions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Topic-wise PYQ Practice</h1>
          <p className="text-sm text-text3 mt-1">Master GATE by topic and year with targeted practice</p>
        </div>
        <div className="text-xs text-text3 bg-bg-2 px-3 py-2 rounded-lg">
          {filtered.length} questions • {filtered.filter((q) => q.solved).length} solved
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard padding="p-4" className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="book" className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-text">Subject</span>
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 bg-bg-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-purple-400"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </GlassCard>

        <GlassCard padding="p-4" className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="list" className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-text">Topic</span>
          </div>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-3 py-2 bg-bg-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-blue-400"
          >
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </GlassCard>

        <GlassCard padding="p-4" className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="calendar" className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-text">Year Range</span>
          </div>
          <div className="flex gap-2">
            <select
              value={yearRange.start}
              onChange={(e) => setYearRange((prev) => ({ ...prev, start: e.target.value }))}
              className="flex-1 px-3 py-2 bg-bg-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-green-400"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={yearRange.end}
              onChange={(e) => setYearRange((prev) => ({ ...prev, end: e.target.value }))}
              className="flex-1 px-3 py-2 bg-bg-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-green-400"
            >
              <option value="All">Any</option>
              {years.filter((y) => y !== 'All' && (yearRange.start === 'All' || y >= yearRange.start)).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </GlassCard>

        <GlassCard padding="p-4" className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="target" className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-text">Difficulty</span>
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 bg-bg-2 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-red-400"
          >
            <option value="All">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </GlassCard>

        <GlassCard padding="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="filter" className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-text">Advanced Filters</span>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={solvedOnly}
                onChange={(e) => setSolvedOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border text-cyan-400 focus:ring-cyan-400"
              />
              <span className="text-text3">Solved only</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={revisionOnly}
                onChange={(e) => setRevisionOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border text-cyan-400 focus:ring-cyan-400"
              />
              <span className="text-text3">Revision needed</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={difficultOnly}
                onChange={(e) => setDifficultOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border text-cyan-400 focus:ring-cyan-400"
              />
              <span className="text-text3">Hard topics</span>
            </label>
          </div>
        </GlassCard>

        <GlassCard padding="p-4" className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="sort" className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-text">Sort By</span>
          </div>
          <div className="flex gap-2">
            {[
              { value: 'year-desc', label: 'Newest First' },
              { value: 'year-asc', label: 'Oldest First' },
              { value: 'difficulty', label: 'Difficulty' },
              { value: 'marks-desc', label: 'Marks (High to Low)' },
              { value: 'attempts', label: 'Most Attempted' },
              { value: 'accuracy', label: 'Accuracy' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${sortBy === opt.value
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-bg-2 text-text3 hover:bg-bg-3 border border-border hover:border-white/20'}
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
              <Icon name="book" className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm text-text3">Loading questions...</div>
          </div>
        </div>
      ) : filtered.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedByTopic).map(([topic, data]) => {
            const accuracy = data.total ? (data.solved / data.total) * 100 : 0;
            const difficultyLabel = getDifficultyLabel(data.difficultyDistribution);
            const avgMarks = data.averageMarks;

            return (
              <GlassCard key={topic} className="p-5 hover:translate-y-[-2px] transition-transform cursor-pointer" onClick={() => setSelectedTopic(topic)}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text truncate">{topic}</h3>
                  <div className="text-xs text-text3 bg-bg-2 px-2 py-1 rounded">
                    {data.total} questions
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text3">Accuracy</span>
                    <span className={`font-mono font-bold ${getAccuracyColor(accuracy).text}`}>{accuracy.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getAccuracyColor(accuracy).bg} transition-all`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-bg-2 rounded-lg p-2">
                    <div className="text-text3 mb-1">Solved</div>
                    <div className="font-bold text-green-400">{data.solved}/{data.total}</div>
                  </div>
                  <div className="bg-bg-2 rounded-lg p-2">
                    <div className="text-text3 mb-1">Avg Marks</div>
                    <div className="font-mono text-green-400">{avgMarks.toFixed(1)}</div>
                  </div>
                  <div className="bg-bg-2 rounded-lg p-2">
                    <div className="text-text3 mb-1">Difficulty</div>
                    <div className={`font-medium ${getAccuracyColor(accuracy).text}`}>{difficultyLabel}</div>
                  </div>
                  <div className="bg-bg-2 rounded-lg p-2">
                    <div className="text-text3 mb-1">Topic Type</div>
                    <div className="text-text truncate">
                      {Object.entries(data.difficultyDistribution).filter(([_, count]) => count > 0).map(([diff, count]) => (
                        <span key={diff} className="inline-block mr-1">
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${DIFF_COLORS[diff]?.bg || 'bg-text3'}`}></span>
                          {diff} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text3">Next practice session</span>
                    <span className="text-primary font-medium">Click to practice →</span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {selectedQuestion && (
        <Modal onClose={() => setSelectedQuestion(null)} size="large">
          <QuestionPractice question={selectedQuestion} onAttempt={(result) => {
            toast.success(result.status === 'correct' ? 'Correct!' : 'Incorrect');
            setSelectedQuestion(null);
            fetchPyqs();
          }} />
        </Modal>
      )}
    </div>
  );
}
