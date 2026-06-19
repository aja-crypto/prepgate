// Generate topic/subject/full/custom mocks from PYQ bank
import { useState, useEffect } from 'react';
import { mockSessionService, subjectService, topicService, getApiErrorMessage } from '../../services/api';
import { silentCatch } from '../../utils/errorHandler';
import toast from 'react-hot-toast';

const MOCK_TYPES = [
  { id: 'topic', label: 'Topic-wise', desc: 'Questions from selected topics' },
  { id: 'subject', label: 'Subject-wise', desc: 'Questions from selected subjects' },
  { id: 'year', label: 'Year-wise', desc: 'Questions from a GATE year' },
  { id: 'full', label: 'Full-Length', desc: '65 Q GATE-style mock (weighted)' },
  { id: 'custom', label: 'Custom', desc: 'Mix subjects, topics, difficulty' },
];

export default function MockTestBuilder({ onStart }) {
  const [type, setType] = useState('subject');
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [year, setYear] = useState(2023);
  const [count, setCount] = useState(15);
  const [difficulties, setDifficulties] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    subjectService.getAll().then((res) => setSubjects(res.data.data || [])).catch(silentCatch('Load subjects'));
  }, []);

  useEffect(() => {
    if (!selectedSubjects.length) { setTopics([]); return; }
    Promise.all(selectedSubjects.map((id) => topicService.getAll({ subject: id })))
      .then((results) => {
        const all = results.flatMap((r) => r.data.data || []);
        setTopics(all);
      })
      .catch(silentCatch('Load topics by subject'));
  }, [selectedSubjects]);

  const toggleSubject = (id) => {
    setSelectedSubjects((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const toggleTopic = (id) => {
    setSelectedTopics((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const toggleDiff = (d) => {
    setDifficulties((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const config = {
        type,
        count: type === 'full' ? 65 : count,
        durationMinutes: type === 'full' ? 180 : Math.ceil(count * 3),
        subjects: type === 'subject' || type === 'custom' ? selectedSubjects : [],
        topics: type === 'topic' || type === 'custom' ? selectedTopics : [],
        years: type === 'year' ? [year] : [],
        difficulties: difficulties.length ? difficulties : undefined,
      };
      const res = await mockSessionService.generate(config);
      toast.success(`Mock created: ${res.data.data.name}`);
      onStart?.(res.data.data._id);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to generate mock'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text mb-4">Generate Mock Test</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {MOCK_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`text-left p-3 rounded-lg border transition-all ${
              type === t.id ? 'bg-primary/15 border-primary/30' : 'bg-bg-2 border-border hover:border-white/10'
            }`}
          >
            <div className="text-xs font-semibold text-text">{t.label}</div>
            <div className="text-[9px] text-text3 mt-0.5">{t.desc}</div>
          </button>
        ))}
      </div>

      {(type === 'subject' || type === 'custom' || type === 'topic') && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-text3 mb-2">Subjects</div>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => toggleSubject(s._id)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border ${
                  selectedSubjects.includes(s._id) ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {(type === 'topic' || type === 'custom') && selectedSubjects.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-text3 mb-2">Topics</div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {topics.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => toggleTopic(t._id)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border ${
                  selectedTopics.includes(t._id) ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === 'year' && (
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-wider text-text3">GATE Year</label>
          <select value={year} onChange={(e) => setYear(+e.target.value)} className="input-field mt-1">
            {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => (
              <option key={y} value={y}>GATE {y}</option>
            ))}
          </select>
        </div>
      )}

      {type !== 'full' && (
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-wider text-text3">Question Count</label>
          <input type="number" min={5} max={65} value={count} onChange={(e) => setCount(+e.target.value)} className="input-field mt-1" />
        </div>
      )}

      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-text3 mb-2">Difficulty (optional)</div>
        <div className="flex gap-2">
          {['easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDiff(d)}
              className={`text-xs px-3 py-1.5 rounded-lg border capitalize ${
                difficulties.includes(d) ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <button type="button" disabled={generating} onClick={generate} className="btn-primary w-full">
        {generating ? 'Generating...' : 'Start Mock Test'}
      </button>
      <p className="text-[10px] text-text3 mt-2 text-center">
        Mocks are built from your PYQ bank. Import questions via Admin → PYQs.
      </p>
    </div>
  );
}
