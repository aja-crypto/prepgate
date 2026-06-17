import { useState, useEffect, useRef } from 'react';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import { aiService } from '../services/api';
import toast from 'react-hot-toast';

const SUBJECT_MAP = {
  AL: 'Algorithms',
  DS: 'Data Structures',
  DB: 'Databases',
  OS: 'Operating Systems',
  CN: 'Computer Networks',
  CO: 'Computer Organization',
  TOC: 'Theory of Computation',
  CD: 'Compiler Design',
  DL: 'Digital Logic',
  EM: 'Engineering Mathematics',
  APT: 'Aptitude',
};

export default function DoubtSolverPage() {
  const [doubt, setDoubt] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    aiService.getDoubtSubjects().then((res) => {
      if (res.data?.success) setSubjects(res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [result]);

  const handleSolve = async () => {
    if (!doubt.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await aiService.doubtSolve({
        doubt: doubt.trim(),
        subject: subject || undefined,
        topic: topic || undefined,
      });

      if (res.data?.success) {
        setResult(res.data.data);
        setHistory((prev) => [{ doubt: doubt.trim(), subject, topic, ...res.data.data }, ...prev].slice(0, 10));
      } else {
        toast.error(res.data?.message || 'Failed to solve doubt');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSolve();
    }
  };

  const renderContent = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-text mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      return <p key={i} className="text-text2 text-sm leading-relaxed">{line || '\u00A0'}</p>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <Icon name="zap" className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">AI Doubt Solver</h1>
          <p className="text-sm text-text3">Ask any GATE CSE question and get a step-by-step explanation</p>
        </div>
      </div>

      <GlassCard padding="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-text3 block mb-1">Subject (optional)</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-bg-2 border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{SUBJECT_MAP[s] || s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text3 block mb-1">Topic (optional)</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Deadlocks, Normalization"
              className="w-full bg-bg-2 border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-text4 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="relative">
          <textarea
            value={doubt}
            onChange={(e) => setDoubt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your doubt here... e.g., How does LRU page replacement work? Why is BCNF considered stronger than 3NF?"
            className="w-full bg-bg-2 border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text4 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none min-h-[100px]"
            rows={3}
          />
          <button
            onClick={handleSolve}
            disabled={!doubt.trim() || loading}
            className="mt-3 w-full sm:w-auto px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Solving...
              </>
            ) : (
              <>
                <Icon name="zap" className="w-4 h-4" />
                Solve Doubt
              </>
            )}
          </button>
        </div>
      </GlassCard>

      {result && (
        <div ref={scrollRef} className="space-y-4 animate-fade-in">
          <GlassCard padding="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                <Icon name="zap" className="w-5 h-5 text-cyan-400" />
                Explanation
              </h2>
              {result.source === 'ai' && (
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 font-medium">
                  AI-Generated
                </span>
              )}
            </div>
            <div className="prose prose-invert max-w-none text-sm">
              {renderContent(result.explanation)}
            </div>
          </GlassCard>

          {result.steps?.length > 0 && (
            <GlassCard padding="p-5">
              <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">S</span>
                Step-by-Step Solution
              </h2>
              <div className="space-y-3">
                {result.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text">{step.title}</h3>
                      <p className="text-xs text-text2 mt-0.5">{step.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {result.keyTakeaways?.length > 0 && (
            <GlassCard padding="p-5">
              <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-400">K</span>
                Key Takeaways
              </h2>
              <ul className="space-y-2">
                {result.keyTakeaways.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text2">
                    <span className="text-green-400 flex-shrink-0 mt-0.5">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {result.answers?.length > 0 && (
            <GlassCard padding="p-5">
              <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">Q</span>
                Common Follow-ups
              </h2>
              <div className="space-y-3">
                {result.answers.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-bg-2 border border-border">
                    <p className="text-xs font-semibold text-amber-400 mb-1">{item.q}</p>
                    <p className="text-sm text-text2">{item.a}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {result.relatedTopics?.length > 0 && (
            <GlassCard padding="p-5">
              <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">R</span>
                Related Topics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.relatedTopics.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-bg-2 border border-border hover:border-primary/30 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-text">{item.name}</p>
                    <p className="text-xs text-text3 mt-0.5">{item.description}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {result.doubt && (
            <p className="text-center text-xs text-text4 italic">
              Asked: "{result.doubt}"
            </p>
          )}
        </div>
      )}

      {history.length > 0 && !result && (
        <GlassCard padding="p-5">
          <h2 className="text-sm font-bold text-text mb-3">Recent Doubts</h2>
          <div className="space-y-2">
            {history.map((item, i) => (
              <button
                key={i}
                onClick={() => { setDoubt(item.doubt); setSubject(item.subject || ''); setTopic(item.topic || ''); }}
                className="w-full text-left p-2.5 rounded-xl bg-bg-2 border border-border hover:border-cyan-500/30 transition-colors"
              >
                <p className="text-sm text-text truncate">{item.doubt}</p>
                <p className="text-[10px] text-text4 mt-0.5">
                  {SUBJECT_MAP[item.subject] || item.subject || 'General'} {item.topic ? `\u00B7 ${item.topic}` : ''}
                </p>
              </button>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}