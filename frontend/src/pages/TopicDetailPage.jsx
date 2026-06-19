// GateForge topic learning hub — full GATE 2027 preparation per topic
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { topicService, mockSessionService, getApiErrorMessage } from '../services/api';
import { silentCatch } from '../utils/errorHandler';
import { PageLoading } from '../components/common/GateLoadingScreen';
import QuestionPractice from '../components/pyq/QuestionPractice';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Theory', 'Short Notes', 'Formulas', 'GATE 2027', 'Revision', 'PYQs', 'Practice', 'Resources'];

const DIFF_STYLE = {
  easy: 'text-green-400 bg-green-500/10 border-green-500/20',
  medium: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  hard: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const STRENGTH_STYLE = { strong: 'text-green-400', moderate: 'text-orange-400', weak: 'text-red-400' };
const COMPLETION_TASKS = [
  { key: 'lecture', label: '🎥 Lecture', icon: '🎥' },
  { key: 'notes', label: '📝 Notes', icon: '📝' },
  { key: 'revision1', label: '🔄 Revision 1', icon: '🔄' },
  { key: 'revision2', label: '🔄 Revision 2', icon: '🔄' },
  { key: 'revision3', label: '🔄 Revision 3', icon: '🔄' },
  { key: 'revision4', label: '🔄 Revision 4', icon: '🔄' },
  { key: 'pyqs', label: '📚 PYQs', icon: '📚' },
  { key: 'topicTest', label: '🧪 Topic Test', icon: '🧪' },
];

export default function TopicDetailPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [practicePyq, setPracticePyq] = useState(null);
  const startTime = useRef(Date.now());

  const load = async () => {
    setLoading(true);
    try {
      const res = await topicService.getLearn(topicId);
      setData(res.data.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setData(null); // Will show "Topic Not Available" with specific message
        toast.error('Topic not found');
      } else if (status === 401) {
        navigate('/login');
      } else {
        toast.error(getApiErrorMessage(err, 'Failed to load topic'));
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    startTime.current = Date.now();
    return () => {
      const mins = Math.round((Date.now() - startTime.current) / 60000);
      if (mins > 0) topicService.updateProgress(topicId, { studyTimeMinutes: mins }).catch(silentCatch('Update study time'));
    };
  }, [topicId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFlag = async (field, value) => {
    try {
      const updates = { [field]: value };
      
      // If updating a sub-task, the value is an object
      if (field === 'completionTasks') {
        await topicService.updateProgress(topicId, { completionTasks: value });
      } else {
        await topicService.updateProgress(topicId, updates);
      }
      
      setData((d) => {
        const nextProgress = { ...d.progress, [field]: value };
        
        if (field === 'completionTasks') {
          const doneCount = COMPLETION_TASKS.filter((task) => value[task.key]).length;
          nextProgress.completionPercentage = Math.round((doneCount / COMPLETION_TASKS.length) * 100);
          if (nextProgress.completionPercentage === 100 && !nextProgress.isCompleted) {
            nextProgress.isCompleted = true;
            nextProgress.lastCompleted = new Date().toISOString();
          }
          const now = new Date().toISOString();
          const lastRev = value.revision1 ? now : null;
          if (lastRev) nextProgress.lastRevised1 = now;
          if (value.revision2) nextProgress.lastRevised2 = now;
          if (value.revision3) nextProgress.lastRevised3 = now;
          if (value.revision4) nextProgress.lastRevised4 = now;
          if (lastRev) nextProgress.lastRevised = now;
        }
        
        return { ...d, progress: nextProgress };
      });
    } catch {
      toast.error('Failed to save progress');
    }
  };

  const toggleTask = (taskKey) => {
    const current = progress.completionTasks || {};
    const defaults = COMPLETION_TASKS.reduce((acc, t) => ({ ...acc, [t.key]: false }), {});
    const nextTasks = {
      ...defaults,
      ...current,
      [taskKey]: !(current[taskKey])
    };
    updateFlag('completionTasks', nextTasks);
  };

  const toggleComplete = async () => {
    const next = !data.progress.isCompleted;
    await updateFlag('isCompleted', next);
    if (next) toast.success('Topic marked complete!');
  };

  const startTopicMock = async () => {
    try {
      const res = await mockSessionService.generate({
        type: 'topic',
        topics: [topicId],
        count: Math.min(10, Math.max(data.relatedPyqs.length, 5)),
        name: `${data.topic.name} — GATE 2027 Mock`,
      });
      navigate('/mocks', { state: { sessionId: res.data.data._id } });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not generate mock'));
    }
  };

  if (loading) return <PageLoading title="Loading Topic" />;
  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-8" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.1))', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 0 30px rgba(168,85,247,0.1)' }}>
        <span className="text-5xl">📚</span>
      </div>
      <h2 className="text-2xl font-bold text-text mb-3">Topic Not Available</h2>
      <p className="text-sm text-text3 max-w-md mb-8 leading-relaxed">This topic may have been removed or is still being prepared. Browse all topics or ask PrepGate AI for guidance.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/topics" className="inline-flex items-center gap-2 text-sm px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'white', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0V9a1 1 0 112 0v4zm-1-6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
          Browse Topics
        </Link>
        <button onClick={() => navigate('/prepgate-ai')} className="inline-flex items-center gap-2 text-sm px-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02]" style={{ background: 'rgba(168,85,247,0.1)', color: '#A78BFA', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 0 15px rgba(168,85,247,0.1)' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
          Ask AI Mentor
        </button>
      </div>
    </div>
  );

  const { topic, progress, relatedPyqs, analytics } = data;
  const content = topic.content || {};
  const subject = topic.subject;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/subjects" className="text-xs text-primary hover:opacity-80">← Back to Subjects</Link>
        {content.gatePriority === 'HIGH' && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-semibold">HIGH PRIORITY — GATE 2027</span>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] text-text3 mb-1">{subject?.name} · {content.marksRange || `~${subject?.weightage} marks`}</div>
            <h1 className="text-xl font-bold text-text">{topic.name}</h1>
            <p className="text-sm text-text2 mt-2 max-w-2xl">{topic.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`text-[10px] px-2 py-1 rounded border capitalize ${DIFF_STYLE[topic.difficulty]}`}>{topic.difficulty}</span>
              <span className="text-[10px] px-2 py-1 rounded border bg-bg-2 border-border text-text3">Topic weightage ~{analytics.weightage}%</span>
              <span className={`text-[10px] px-2 py-1 rounded border bg-bg-2 border-border capitalize ${STRENGTH_STYLE[analytics.strength]}`}>
                Strength: {analytics.strength} · {analytics.accuracy}% accuracy
              </span>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={toggleComplete} className={`text-xs px-3 py-2 rounded-lg border ${progress.isCompleted ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-bg-2 border-border text-text2'}`}>
              {progress.isCompleted ? '✓ Complete' : 'Mark Complete'}
            </button>
            <button type="button" onClick={() => updateFlag('isBookmarked', !progress.isBookmarked)} className={`text-xs px-3 py-2 rounded-lg border ${progress.isBookmarked ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-bg-2 border-border text-text2'}`}>★ Bookmark</button>
            <button type="button" onClick={() => updateFlag('revisionNeeded', !progress.revisionNeeded)} className={`text-xs px-3 py-2 rounded-lg border ${progress.revisionNeeded ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-bg-2 border-border text-text2'}`}>↻ Revision</button>
            <button type="button" onClick={() => updateFlag('markedDifficult', !progress.markedDifficult)} className={`text-xs px-3 py-2 rounded-lg border ${progress.markedDifficult ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-bg-2 border-border text-text2'}`}>! Difficult</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          {[
            { label: 'Completion', value: progress.isCompleted ? '✓ Done' : 'Pending', color: progress.isCompleted ? 'text-green-400' : 'text-text3' },
            { label: 'PYQs Solved', value: `${analytics.pyqSolved}/${analytics.pyqCount}` },
            { label: 'Study Time', value: `${progress.studyTimeMinutes || 0}m` },
            { label: 'Revision Count', value: progress.revisionCount || 0 },
            { label: 'Confidence', value: `${progress.confidence || 3}/5` },
          ].map((s) => (
            <div key={s.label} className="bg-bg-2 rounded-lg p-3 text-center">
              <div className={`text-lg font-bold font-mono ${s.color || 'text-text'}`}>{s.value}</div>
              <div className="text-[9px] text-text3 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 flex-wrap mb-5">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`text-xs px-3 py-2 rounded-lg border whitespace-nowrap ${tab === t ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Section title="Key Concepts">
            <ul className="space-y-1">{(content.keyConcepts || []).map((c, i) => <li key={i} className="text-sm text-text2">• {c}</li>)}</ul>
          </Section>
          <Section title="Frequently Asked Concepts">
            <ul className="space-y-1">{(content.frequentlyAskedConcepts || []).map((c, i) => (
              <li key={i} className="text-sm text-primary/90">◆ {c}</li>
            ))}</ul>
          </Section>
          <Section title="Common Mistakes">
            <ul className="space-y-1">{(content.commonMistakes || []).map((m, i) => <li key={i} className="text-sm text-red-400/80">⚠ {m}</li>)}</ul>
          </Section>
          <Section title="Smart Topic Progress">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text3">8 Tasks</div>
                <div className="text-xs font-mono text-primary">{progress.completionPercentage || 0}%</div>
              </div>
              <div className="w-full bg-bg-2 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progress.completionPercentage || 0}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {COMPLETION_TASKS.map((t) => {
                  const done = progress.completionTasks?.[t.key];
                  return (
                    <button
                      key={t.key}
                      onClick={() => toggleTask(t.key)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        done
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-bg-2 border-border hover:border-white/20'
                      }`}
                    >
                      <span className={`text-base ${done ? '' : 'opacity-50'}`}>{t.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-medium ${done ? 'text-green-400 line-through' : 'text-text'}`}>
                          {t.label}
                        </div>
                        <div className="text-[9px] text-text3">{done ? 'Done' : 'Not done'}</div>
                      </div>
                      {done && <span className="text-green-400 text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>
        </div>
      )}

      {tab === 'Theory' && (
        <Section title="Theory Notes">
          <div className="text-sm text-text2 whitespace-pre-wrap leading-relaxed">{content.theoryNotes}</div>
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-text3 uppercase mb-2">Important Definitions</h4>
            {(content.definitions || []).map((d, i) => (
              <div key={i} className="mb-2">
                <span className="text-sm font-medium text-primary">{d.term}: </span>
                <span className="text-sm text-text2">{d.definition}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === 'Short Notes' && (
        <Section title="Short Notes">
          <p className="text-sm text-text2 whitespace-pre-wrap leading-relaxed">{content.shortNotes}</p>
        </Section>
      )}

      {tab === 'Formulas' && (
        <div className="space-y-3">
          {(content.formulas || []).map((f, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4">
              <div className="text-sm font-semibold text-text">{f.name}</div>
              <div className="font-mono text-primary text-sm mt-2 bg-bg-2 rounded-lg p-3">{f.expression}</div>
              {f.note && <div className="text-xs text-text3 mt-2">{f.note}</div>}
            </div>
          ))}
          {!content.formulas?.length && <p className="text-sm text-text3">No formulas seeded for this topic yet.</p>}
        </div>
      )}

      {tab === 'GATE 2027' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Section title="Expected Questions for GATE 2027">
            <ul className="space-y-2">
              {(content.expectedQuestions2027 || []).map((q, i) => (
                <li key={i} className="text-sm text-text2 flex gap-2">
                  <span className="text-primary font-mono flex-shrink-0">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Frequently Asked GATE Concepts">
            <ul className="space-y-1">
              {(content.frequentlyAskedConcepts || []).map((c, i) => (
                <li key={i} className="text-sm text-text2">◆ {c}</li>
              ))}
            </ul>
            {(content.faqQuestions || []).map((f, i) => (
              <div key={i} className="mt-3 pt-3 border-t border-border">
                <div className="text-sm font-medium text-text">{f.question}</div>
                <div className="text-xs text-text2 mt-1">{f.answer}</div>
              </div>
            ))}
          </Section>
        </div>
      )}

      {tab === 'Revision' && (
        <Section title="Revision Notes">
          <p className="text-sm text-text2 whitespace-pre-wrap mb-4">{content.revisionNotes}</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => {
              const done = progress.completionTasks?.[`revision${n}`];
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleTask(`revision${n}`)}
                  className={`text-xs px-3 py-2 rounded-lg border ${done ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-bg-2 border-border text-text2'}`}
                >
                  {done ? '✓' : '○'} Revision {n}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {tab === 'PYQs' && (
        <div className="space-y-2">
          {relatedPyqs.length ? relatedPyqs.map((p) => (
            <div key={p._id} className="flex items-center justify-between bg-surface border border-border rounded-xl p-4">
              <div>
                <div className="text-sm text-text">{p.title}</div>
                <div className="text-[10px] text-text3">GATE {p.year} · {p.difficulty} · {p.marks} marks {p.isSolved && '· ✓ solved'}</div>
              </div>
              <button type="button" onClick={() => setPracticePyq(p._id)} className="text-xs btn-primary px-3 py-1.5">Practice</button>
            </div>
          )) : (
            <p className="text-sm text-text3 text-center py-8">Import PYQs via Admin → PYQs to populate this section.</p>
          )}
        </div>
      )}

      {tab === 'Practice' && (
        <div className="space-y-4">
          <button type="button" onClick={startTopicMock} className="btn-primary w-full md:w-auto">🎯 Start Topic Mock Test</button>
          <p className="text-xs text-text3">Practice questions for self-study:</p>
          {(content.practiceQuestions || []).map((q, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4">
              <div className="text-sm font-medium text-text">Q{i + 1}. {q.question}</div>
              {q.hint && <div className="text-xs text-text3 mt-2">💡 {q.hint}</div>}
            </div>
          ))}
        </div>
      )}

      {tab === 'Resources' && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-text3 uppercase">Topic Discussion & Courses</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: `${topic.name} — GateOverflow Discussions`, url: `https://gateoverflow.in/?q=${encodeURIComponent(topic.name)}`, icon: '💬' },
              { title: `${topic.name} — NPTEL Search`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`NPTEL ${subject?.name || ''} ${topic.name}`)}`, icon: '🎓' },
            ].map((r) => (
              <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 hover:border-white/15">
                <span className="text-lg">{r.icon}</span>
                <span className="text-sm text-text">{r.title}</span>
              </a>
            ))}
          </div>
          <h4 className="text-xs font-semibold text-text3 uppercase">Video Resources</h4>
          {(topic.resources || []).filter((r) => r.type === 'video').map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 hover:border-white/15">
              <span className="text-lg">▶</span>
              <span className="text-sm text-text">{r.title}</span>
            </a>
          ))}
          <h4 className="text-xs font-semibold text-text3 uppercase mt-4">Book References</h4>
          {(content.bookReferences || []).map((b, i) => (
            <div key={i} className="bg-bg-2 border border-border rounded-lg p-3 text-sm">
              <span className="text-text font-medium">{b.title}</span>
              <span className="text-text3"> — {b.author}, {b.chapter}</span>
            </div>
          ))}
          <h4 className="text-xs font-semibold text-text3 uppercase mt-4">Important PYQs & Asked Concepts</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-bg-2 border border-border rounded-lg p-3">
              <div className="text-xs font-semibold text-text mb-2">Frequently Asked</div>
              <ul className="space-y-1">
                {(content.frequentlyAskedConcepts || []).slice(0, 5).map((c, i) => <li key={i} className="text-xs text-text2">• {c}</li>)}
              </ul>
            </div>
            <div className="bg-bg-2 border border-border rounded-lg p-3">
              <div className="text-xs font-semibold text-text mb-2">Expected PYQ Patterns</div>
              <ul className="space-y-1">
                {(content.expectedQuestions2027 || []).slice(0, 5).map((q, i) => <li key={i} className="text-xs text-text2">• {q}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Modal open={!!practicePyq} onClose={() => setPracticePyq(null)} title="Practice PYQ" maxWidth="max-w-2xl">
        {practicePyq && <QuestionPractice pyqId={practicePyq} onClose={() => { setPracticePyq(null); load(); }} />}
      </Modal>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text mb-3">{title}</h3>
      {children}
    </div>
  );
}
