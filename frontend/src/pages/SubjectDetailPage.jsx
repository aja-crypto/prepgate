import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { PageLoading } from '../components/common/GateLoadingScreen';
import {
  subjectService,
  topicService,
  shortNoteService,
  weeklyTestService,
  mockTestService,
  getApiErrorMessage,
} from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import { BRAND } from '../design/tokens';
import toast from 'react-hot-toast';

const SUBJECT_MAP = {
  APT: { name: 'General Aptitude', icon: '🧮', color: '#43aa8b' },
  EM: { name: 'Engineering Mathematics', icon: '🔢', color: '#4f8dff' },
  DS: { name: 'Programming & Data Structures', icon: '🐍', color: '#ff9f43' },
  AL: { name: 'Algorithms', icon: '⚡', color: '#ff6b6b' },
  DB: { name: 'DBMS', icon: '🗄', color: '#06b6d4' },
  OS: { name: 'Operating Systems', icon: '⚙️', color: '#a855f7' },
  CN: { name: 'Computer Networks', icon: '🌐', color: '#ffd166' },
  CO: { name: 'Computer Organization (COA)', icon: '🖥', color: '#06d6a0' },
  TOC: { name: 'Theory of Computation', icon: '🤖', color: '#f72585' },
  CD: { name: 'Compiler Design', icon: '🔧', color: '#4cc9f0' },
  DL: { name: 'Digital Logic', icon: '💻', color: '#7c5cfc' },
};

const TAB_ICONS = { theory: 'book', notes: 'notes', pyq: 'pyq', tests: 'tests', mocks: 'mock-tests' };
const TABS = [
  { key: 'theory', label: 'Theory' },
  { key: 'notes', label: 'Notes' },
  { key: 'pyq', label: 'PYQs' },
  { key: 'tests', label: 'Weekly Tests' },
  { key: 'mocks', label: 'Mock Tests' },
];

const DIFF_BADGE = {
  easy: 'bg-green-500/10 border-green-500/20 text-green-400',
  medium: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  hard: 'bg-red-500/10 border-red-500/20 text-red-400',
};

export default function SubjectDetailPage() {
  const { subjectCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { topics: localTopics } = useProgress();

  const [activeTab, setActiveTab] = useState('theory');
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [shortNotes, setShortNotes] = useState([]);
  const [weeklyTests, setWeeklyTests] = useState([]);
  const [mockTests, setMockTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const meta = SUBJECT_MAP[subjectCode?.toUpperCase()] || {};

  useEffect(() => {
    if (!subjectCode) return;
    (async () => {
      setLoading(true);
      try {
        const subRes = await subjectService.getAll({ code: subjectCode });
        const found = subRes.data?.data?.find(
          (s) => s.code === subjectCode || s.code?.toUpperCase() === subjectCode.toUpperCase()
        );
        if (found) setSubject(found);

        const [topicsRes, notesRes, weeklyRes, mockRes] = await Promise.all([
          topicService.getAll({ subject: found?._id || subjectCode }),
          shortNoteService.getAll(),
          weeklyTestService.getAll({ subject: subjectCode }),
          mockTestService.getAll({ subject: subjectCode }),
        ]);

        setTopics(topicsRes.data?.data || []);
        setShortNotes(notesRes.data?.data || []);
        setWeeklyTests(weeklyRes.data?.data || []);
        setMockTests(mockRes.data?.data || []);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to load subject data'));
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectCode]);

  const subjectName = subject?.name || meta.name || subjectCode;

  const subjectNotes = useMemo(() => {
    const code = subjectCode?.toUpperCase();
    return shortNotes.filter(
      (s) => s.code === code || s.code === subjectCode || s.name === subjectName
    );
  }, [shortNotes, subjectCode, subjectName]);

  const topicCompletionMap = useMemo(() => {
    const map = {};
    (localTopics || []).forEach((t) => {
      if (t.subject === subjectName || t.subject === subjectCode) {
        map[t.id || t._id] = t.done;
      }
    });
    return map;
  }, [localTopics, subjectName, subjectCode]);

  if (loading) {
    return <PageLoading title="Loading Subject" />;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/subjects" className="text-xs text-primary hover:opacity-80 inline-flex items-center gap-1 mb-2">
          <Icon name="chevron-right" className="rotate-180" /> Back to Subjects
        </Link>
        <div className="flex items-center gap-3">
          {meta.icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${meta.color}15`, color: meta.color }}
            >
              {meta.icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-text">{subjectName}</h1>
            <p className="text-sm text-text3 mt-0.5">
              {subject?.topicCount || topics.length} topics · {BRAND.product}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-bg-2 border-border text-text3 hover:border-white/10'
            }`}
          >
            <Icon name={TAB_ICONS[tab.key]} className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'theory' && (
        <div className="space-y-2">
          {topics.length === 0 && (
            <GlassCard padding="p-8" className="text-center">
              <p className="text-sm text-text3">No topics found for {subjectName}.</p>
            </GlassCard>
          )}
          {topics.map((topic) => {
            const tid = topic._id || topic.id;
            const isDone = topicCompletionMap[tid];
            return (
              <NavLink
                key={tid}
                to={`/learn/topic/${tid}`}
                className={`block bg-surface border rounded-xl p-4 transition-all hover:border-primary/30 ${
                  isDone ? 'border-green-500/20' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isDone ? 'bg-green-400' : topic.difficulty === 'easy' ? 'bg-green-400' : topic.difficulty === 'hard' ? 'bg-red-400' : 'bg-orange-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isDone ? 'text-text3 line-through' : 'text-text'}`}>
                      {topic.name}
                    </div>
                    <div className="text-[11px] text-text3 mt-0.5">
                      {topic.difficulty ? `${topic.difficulty} · ` : ''}
                      {topic.weightage ? `~${topic.weightage}%` : ''}
                    </div>
                  </div>
                  {isDone && <span className="text-green-400 text-xs">✓</span>}
                  <Icon name="chevron-right" className="w-4 h-4 text-text3" />
                </div>
              </NavLink>
            );
          })}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          {subjectNotes.length === 0 && (
            <GlassCard padding="p-8" className="text-center">
              <p className="text-sm text-text3">No short notes available for {subjectName}.</p>
            </GlassCard>
          )}
          {subjectNotes.map((sub) => (
            <GlassCard key={sub.code || sub.folder || sub.name} padding="p-5">
              <div className="flex items-center gap-3 mb-4">
                {sub.icon && (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${sub.color || meta.color}15`, color: sub.color || meta.color }}
                  >
                    {sub.icon}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-text">{sub.name}</div>
                  <div className="text-xs text-text3">{sub.count || sub.files?.length || 0} file(s)</div>
                </div>
              </div>
              <div className="space-y-2">
                {(sub.files || []).map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between bg-bg-2 border border-border rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs">{file.type === 'pdf' ? '📄' : '🖼'}</span>
                      <span className="text-[11px] text-text truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => window.open(file.fileUrl, '_blank')}
                        className="text-[10px] px-2 py-1 rounded border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all"
                      >
                        View
                      </button>
                      <a
                        href={file.fileUrl}
                        download={file.name}
                        className="text-[10px] px-2 py-1 rounded border bg-bg-2 border-border text-text3 hover:text-secondary hover:border-secondary/30 transition-all"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'pyq' && (
        <GlassCard padding="p-8" className="text-center">
          <Icon name="pyq" className="w-10 h-10 text-primary mb-3 mx-auto" />
          <h3 className="text-base font-semibold text-text mb-2">Practice PYQs for {subjectName}</h3>
          <p className="text-sm text-text3 mb-4">
            Solve previous year questions tailored for this subject to strengthen your GATE preparation.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/pyq?subject=${subjectCode}`)}
            className="bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-all"
          >
            Go to PYQ Page
          </button>
        </GlassCard>
      )}

      {activeTab === 'tests' && (
        <div className="space-y-3">
          {weeklyTests.length === 0 && (
            <GlassCard padding="p-8" className="text-center">
              <p className="text-sm text-text3">No weekly tests available for {subjectName}.</p>
            </GlassCard>
          )}
          {weeklyTests.map((test) => (
            <GlassCard key={test._id || test.id} padding="p-5" hover={false}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-text">{test.title}</h3>
                    {test.difficulty && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border capitalize ${
                          DIFF_BADGE[test.difficulty] || 'bg-bg-2 border-border text-text3'
                        }`}
                      >
                        {test.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-text3">
                    {test.duration && <span>⏱ {test.duration} min</span>}
                    {test.questionsCount && <span>{test.questionsCount} questions</span>}
                    {(test.topics || []).length > 0 && (
                      <span>Topics: {(test.topics || []).slice(0, 3).join(', ')}</span>
                    )}
                    {test.progress !== undefined && (
                      <span className="text-primary">Progress: {test.progress}%</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/weekly-tests/${subjectCode}`)}
                  className="text-xs px-4 py-2 rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all whitespace-nowrap"
                >
                  Start Test
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'mocks' && (
        <div className="space-y-3">
          {mockTests.length === 0 && (
            <GlassCard padding="p-8" className="text-center">
              <p className="text-sm text-text3">No mock tests available for {subjectName}.</p>
            </GlassCard>
          )}
          {(() => {
            const grouped = {};
            mockTests.forEach((test) => {
              const type = test.testType || 'subject';
              if (!grouped[type]) grouped[type] = [];
              grouped[type].push(test);
            });
            return Object.entries(grouped).map(([testType, tests]) => (
              <div key={testType}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text3 mb-2 capitalize">
                  {testType} Tests
                </h3>
                <div className="space-y-2">
                  {tests.map((test) => (
                    <GlassCard key={test._id || test.id} padding="p-5" hover={false}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-text">{test.title}</h3>
                            {test.difficulty && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded border capitalize ${
                                  DIFF_BADGE[test.difficulty] || 'bg-bg-2 border-border text-text3'
                                }`}
                              >
                                {test.difficulty}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] text-text3">
                            {test.duration && <span>⏱ {test.duration} min</span>}
                            {test.questionsCount && <span>{test.questionsCount} questions</span>}
                            {test.marks && <span>{test.marks} marks</span>}
                            {test.attemptStatus && (
                              <span
                                className={
                                  test.attemptStatus === 'completed'
                                    ? 'text-green-400'
                                    : test.attemptStatus === 'in-progress'
                                    ? 'text-orange-400'
                                    : 'text-text3'
                                }
                              >
                                {test.attemptStatus === 'completed'
                                  ? '✓ Completed'
                                  : test.attemptStatus === 'in-progress'
                                  ? '⏳ In Progress'
                                  : 'Not Attempted'}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/mock-tests/${test._id || test.id}`)}
                          className="text-xs px-4 py-2 rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all whitespace-nowrap"
                        >
                          Start Test
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
