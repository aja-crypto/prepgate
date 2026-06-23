import { useState, useMemo } from 'react';

const SORT_OPTIONS = [
  { key: 'rank', label: 'Rank' },
  { key: 'roiScore', label: 'ROI Score' },
  { key: 'weightage', label: 'Weightage' },
];

const PRIORITY_COLORS = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Medium: '#06B6D4',
};

const DIFFICULTY_COLORS = {
  Easy: '#34D399',
  Medium: '#F59E0B',
  'Medium-High': '#F97316',
  High: '#EF4444',
};

export default function HighROITable({ topics, subjectFilters, priorityFilters, difficultyFilters }) {
  const [sortBy, setSortBy] = useState('rank');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  const filtered = useMemo(() => {
    let result = [...topics];
    if (subjectFilter) result = result.filter(t => t.subject === subjectFilter);
    if (priorityFilter) result = result.filter(t => t.priority === priorityFilter);
    if (difficultyFilter) result = result.filter(t => t.difficulty === difficultyFilter);
    if (sortBy === 'rank') result.sort((a, b) => a.rank - b.rank);
    else if (sortBy === 'roiScore') {
      const order = { Maximum: 5, 'Very High': 4, High: 3, Medium: 2, Low: 1 };
      result.sort((a, b) => (order[b.roiScore] || 0) - (order[a.roiScore] || 0));
    }
    return result;
  }, [topics, subjectFilter, priorityFilter, difficultyFilter, sortBy]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="text-[10px] px-3 py-1.5 rounded-lg bg-bg-2 border border-border text-text3 focus:outline-none focus:border-primary/30"
        >
          <option value="">All Subjects</option>
          {subjectFilters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="text-[10px] px-3 py-1.5 rounded-lg bg-bg-2 border border-border text-text3 focus:outline-none focus:border-primary/30"
        >
          <option value="">All Priorities</option>
          {priorityFilters.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={difficultyFilter}
          onChange={e => setDifficultyFilter(e.target.value)}
          className="text-[10px] px-3 py-1.5 rounded-lg bg-bg-2 border border-border text-text3 focus:outline-none focus:border-primary/30"
        >
          <option value="">All Difficulties</option>
          {difficultyFilters.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="flex gap-1 ml-auto">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all ${
                sortBy === opt.key ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[9px] uppercase tracking-wider text-text3 border-b border-border">
              <th className="pb-2 pr-2 font-semibold">#</th>
              <th className="pb-2 pr-2 font-semibold">Topic</th>
              <th className="pb-2 pr-2 font-semibold">Subject</th>
              <th className="pb-2 pr-2 font-semibold">Weightage</th>
              <th className="pb-2 pr-2 font-semibold">ROI</th>
              <th className="pb-2 pr-2 font-semibold">Priority</th>
              <th className="pb-2 font-semibold">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.rank}
                className="border-b border-border/40 transition-colors hover:bg-white/[0.02]"
              >
                <td className="py-2.5 pr-2 text-[11px] text-text3 font-mono">{t.rank}</td>
                <td className="py-2.5 pr-2 text-[11px] text-text font-medium">{t.topic}</td>
                <td className="py-2.5 pr-2 text-[11px] text-text2">{t.subject}</td>
                <td className="py-2.5 pr-2 text-[11px] text-text2 font-mono">{t.weightage}</td>
                <td className="py-2.5 pr-2">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${t.roiScore === 'Maximum' ? '#EF4444' : t.roiScore === 'Very High' ? '#F59E0B' : '#06B6D4'}15`,
                      color: t.roiScore === 'Maximum' ? '#EF4444' : t.roiScore === 'Very High' ? '#F59E0B' : '#06B6D4',
                    }}
                  >
                    {t.roiScore}
                  </span>
                </td>
                <td className="py-2.5 pr-2">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: `${PRIORITY_COLORS[t.priority]}15`, color: PRIORITY_COLORS[t.priority] }}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="py-2.5">
                  <span style={{ color: DIFFICULTY_COLORS[t.difficulty] || '#94A3B8' }} className="text-[11px]">
                    {t.difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-text3">No topics match your filters.</div>
      )}
    </div>
  );
}
