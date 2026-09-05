// GateForge topic learning hub — full GATE 2027 preparation per topic
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { topicService, mockSessionService, getApiErrorMessage } from '../services/api';
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
      toast.error(getApiErrorMessage(err, 'Failed to load topic'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    startTime.current = Date.now();
    return () => {
      const mins = Math.round((Date.now() - startTime.current) / 60000);
      if (mins > 0) topicService.updateProgress(topicId, { studyTimeMinutes: mins }).catch(() => {});
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
        
        // Auto-calculate percentage if tasks changed
        if (field === 'completionTasks') {
          const doneCount = Object.values(value).filter(Boolean).length;
          nextProgress.completionPercentage = Math.round((doneCount / 4) * 100);
          if (nextProgress.completionPercentage === 100 && !nextProgress.isCompleted) {
            nextProgress.isCompleted = true;
          }
        }
        
        return { ...d, progress: nextProgress };
      });
    } catch {
      toast.error('Failed to save progress');
    }
  };

  const toggleTask = (taskKey) => {
    const nextTasks = {
      ...(progress.completionTasks || { lecture: false, notes: false, pyqs: false, test: false }),
      [taskKey]: !(progress.completionTasks?.[taskKey])
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

  if (loading) return <div className="text-sm text-text3 py-16 text-center">Loading topic...</div>;
  if (!data) return <div className="text-sm text-text3 py-16 text-center">Topic not found</div>;

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
          <Section title="Topic Completion Tracker">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text3">Sub-Tasks</div>
                <div className="text-xs font-mono text-primary">{progress.completionPercentage || 0}%</div>
              </div>
              <div className="w-full bg-bg-2 rounded-full h-1.5 mb-4">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progress.completionPercentage || 0}%` }}
                />
              </div>
              {[
                { key: 'lecture', label: 'Video Lecture' },
                { key: 'notes', label: 'Theory Notes' },
                { key: 'pyqs', label: 'PYQ Practice' },
                { key: 'test', label: 'Topic Test' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => toggleTask(t.key)}
                  className="flex items-center justify-between w-full group"
                >
                  <span className={`text-sm ${progress.completionTasks?.[t.key] ? 'text-green-400' : 'text-text2'}`}>
                    {progress.completionTasks?.[t.key] ? '✓' : '○'} {t.label}
                  </span>
                  <div className={`w-8 h-4 rounded-full border border-border relative transition-colors ${progress.completionTasks?.[t.key] ? 'bg-green-500/20 border-green-500/30' : 'bg-bg-3'}`}>
                    <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${progress.completionTasks?.[t.key] ? 'right-0.5 bg-green-400' : 'left-0.5 bg-text3'}`} />
                  </div>
                </button>
              ))}
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
          <button
            type="button"
            onClick={async () => {
              const next = (progress.revisionCount || 0) + 1;
              await topicService.updateProgress(topicId, { revisionCount: next });
              setData((d) => ({ ...d, progress: { ...d.progress, revisionCount: next } }));
              toast.success('Revision counted');
            }}
            className="btn-ghost text-xs"
          >
            +1 Revision Count
          </button>
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
