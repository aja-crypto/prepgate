import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { PageLoading } from '../components/common/GateLoadingScreen';
import PremiumPdfViewer from '../components/common/PremiumPdfViewer';
import {
  subjectService, topicService, shortNoteService,
  weeklyTestService, mockTestService, getApiErrorMessage,
} from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import { BRAND } from '../design/tokens';
import toast from 'react-hot-toast';

const SUBJECT_MAP = {
  APT: { name: 'General Aptitude', icon: '≡ƒº«', color: '#43aa8b' },
  EM: { name: 'Engineering Mathematics', icon: '≡ƒöó', color: '#4f8dff' },
  DS: { name: 'Programming & Data Structures', icon: '≡ƒÉì', color: '#ff9f43' },
  AL: { name: 'Algorithms', icon: 'ΓÜí', color: '#ff6b6b' },
  DB: { name: 'DBMS', icon: '≡ƒùä', color: '#06b6d4' },
  OS: { name: 'Operating Systems', icon: 'ΓÜÖ∩╕Å', color: '#a855f7' },
  CN: { name: 'Computer Networks', icon: '≡ƒîÉ', color: '#ffd166' },
  CO: { name: 'Computer Organization (COA)', icon: '≡ƒûÑ', color: '#06d6a0' },
  TOC: { name: 'Theory of Computation', icon: '≡ƒñû', color: '#f72585' },
  CD: { name: 'Compiler Design', icon: '≡ƒöº', color: '#4cc9f0' },
  DL: { name: 'Digital Logic', icon: '≡ƒÆ╗', color: '#7c5cfc' },
};

const TABS = [
  { key: 'theory', label: 'Theory', icon: '≡ƒôû' },
  { key: 'notes', label: 'Notes', icon: '≡ƒô¥' },
  { key: 'pyq', label: 'PYQs', icon: '≡ƒôï' },
  { key: 'tests', label: 'Weekly Tests', icon: '≡ƒôè' },
  { key: 'mocks', label: 'Mock Tests', icon: '≡ƒÄ»' },
];

const DIFF_BADGE = {
  easy: 'bg-green-500/10 border-green-500/25 text-green-400',
  medium: 'bg-orange-500/10 border-orange-500/25 text-orange-400',
  hard: 'bg-red-500/10 border-red-500/25 text-red-400',
};

function TopicCard({ topic, isDone, onClick, subjectColor }) {
  return (
    <NavLink
      to={onClick}
      className={`group block rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/8 ${
        isDone ? 'border-green-500/20 bg-green-500/[0.02]' : 'border-border bg-surface hover:border-purple-500/25'
      }`}
      style={{ minHeight: '96px' }}
    >
      <div className="flex items-center gap-4 p-5 h-full">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${subjectColor}18, ${subjectColor}08)`,
            color: subjectColor,
            boxShadow: `0 0 20px -4px ${subjectColor}20`,
          }}
        >
          {topic.difficulty === 'easy' ? '≡ƒƒó' : topic.difficulty === 'hard' ? '≡ƒö┤' : '≡ƒƒá'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`text-sm font-semibold ${isDone ? 'text-text3 line-through' : 'text-text'}`}>
              {topic.name}
            </span>
            {topic.difficulty && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${DIFF_BADGE[topic.difficulty] || 'bg-bg-2 border-border text-text3'}`}>
                {topic.difficulty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text3">
            {topic.weightage && <span>≡ƒôè ~{topic.weightage}% weightage</span>}
            {topic.questionCount && <span>≡ƒôä {topic.questionCount} questions</span>}
            {!topic.weightage && !topic.questionCount && <span>Click to start learning</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDone && (
            <span className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-green-400"><path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>
            </span>
          )}
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-text3/40 group-hover:text-purple-400 transition-all duration-200 group-hover:translate-x-0.5">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/>
          </svg>
        </div>
      </div>
    </NavLink>
  );
}

function StartTestButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
      }}
    >
      <span className="relative z-10">{label || 'Start Test'}</span>
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{
        background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
        filter: 'blur(12px)',
        zIndex: 0,
      }} />
    </button>
  );
}

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const subjectCode = subjectId;
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
  const [viewerFile, setViewerFile] = useState(null);

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

        const subjectId = found?._id;
        if (!subjectId) {
          toast.error('Subject not found');
          setLoading(false);
          return;
        }
        const [topicsRes, notesRes, weeklyRes, mockRes] = await Promise.all([
          topicService.getAll({ subject: subjectId }),
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
  const subjectColor = meta.color || '#8B5CF6';

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

  if (loading) return <PageLoading title="Loading Subject" />;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/subjects" className="inline-flex items-center gap-1.5 text-xs text-text3 hover:text-purple-400 transition-colors mb-3">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Back to Subjects
        </Link>
        <div className="flex items-center gap-4">
          {meta.icon && (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{
                background: `linear-gradient(135deg, ${subjectColor}20, ${subjectColor}08)`,
                color: subjectColor,
                boxShadow: `0 0 24px -4px ${subjectColor}25`,
              }}
            >
              {meta.icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text">{subjectName}</h1>
            <p className="text-sm text-text3 mt-1">
              {subject?.topicCount || topics.length} topics ┬╖ {BRAND.product}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.key
                ? 'text-white shadow-lg'
                : 'text-text3 bg-bg-2/50 border border-border hover:border-purple-500/20 hover:text-text'
            }`}
            style={activeTab === tab.key ? {
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              boxShadow: '0 4px 16px -4px rgba(139,92,246,0.3)',
            } : {}}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Theory Tab */}
      {activeTab === 'theory' && (
        <div className="space-y-4">
          {topics.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-10 text-center">
              <p className="text-sm text-text3">No topics found for {subjectName}.</p>
            </div>
          )}
          {topics.map((topic) => {
            const tid = topic._id || topic.id;
            const isDone = topicCompletionMap[tid];
            return (
              <TopicCard
                key={tid}
                topic={topic}
                isDone={isDone}
                onClick={`/learn/topic/${tid}`}
                subjectColor={subjectColor}
              />
            );
          })}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {subjectNotes.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-10 text-center">
              <p className="text-sm text-text3">No short notes available for {subjectName}.</p>
            </div>
          )}
          {subjectNotes.map((sub) => (
            <div key={sub.code || sub.folder || sub.name} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3 mb-4">
                {sub.icon && (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${sub.color || subjectColor}18`, color: sub.color || subjectColor }}
                  >
                    {sub.icon}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-text">{sub.name}</div>
                  <div className="text-xs text-text3 mt-0.5">{sub.count || sub.files?.length || 0} file(s)</div>
                </div>
              </div>
              <div className="space-y-2">
                {(sub.files || []).map((file) => (
                  <div key={file.name} className="flex items-center justify-between bg-bg-2 border border-border rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-sm">{file.type === 'pdf' ? '≡ƒôä' : '≡ƒû╝'}</span>
                      <span className="text-xs text-text truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={() => setViewerFile(file)}
                      className="text-xs px-3 py-1.5 rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-all shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PYQ Tab */}
      {activeTab === 'pyq' && (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <span className="text-4xl block mb-4">≡ƒôï</span>
          <h3 className="text-base font-semibold text-text mb-2">Practice PYQs for {subjectName}</h3>
          <p className="text-sm text-text3 mb-5 max-w-md mx-auto">
            Solve previous year questions tailored for this subject to strengthen your GATE preparation.
          </p>
          <button
            onClick={() => navigate(`/pyq?subject=${subjectCode}`)}
            className="bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            Go to PYQ Page
          </button>
        </div>
      )}

      {/* Weekly Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          {weeklyTests.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-10 text-center">
              <p className="text-sm text-text3">No weekly tests available for {subjectName}.</p>
            </div>
          )}
          {weeklyTests.map((test) => (
            <div key={test._id || test.id} className="rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/20 hover:shadow-md hover:shadow-purple-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-sm font-semibold text-text">{test.title}</h3>
                    {test.difficulty && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${DIFF_BADGE[test.difficulty] || 'bg-bg-2 border-border text-text3'}`}>
                        {test.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text3">
                    {test.duration && <span>ΓÅ▒ {test.duration} min</span>}
                    {test.questionsCount && <span>≡ƒôä {test.questionsCount} questions</span>}
                    {(test.topics || []).length > 0 && (
                      <span>Topics: {(test.topics || []).slice(0, 3).join(', ')}</span>
                    )}
                    {test.progress !== undefined && (
                      <span className="text-primary">Progress: {test.progress}%</span>
                    )}
                  </div>
                </div>
                <StartTestButton onClick={() => navigate(`/weekly-tests/${subjectCode}`)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mock Tests Tab */}
      {activeTab === 'mocks' && (
        <div className="space-y-6">
          {mockTests.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-10 text-center">
              <p className="text-sm text-text3">No mock tests available for {subjectName}.</p>
            </div>
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text3 mb-3 capitalize">{testType} Tests</h3>
                <div className="space-y-3">
                  {tests.map((test) => (
                    <div key={test._id || test.id} className="rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/20 hover:shadow-md hover:shadow-purple-500/5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <h3 className="text-sm font-semibold text-text">{test.title}</h3>
                            {test.difficulty && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${DIFF_BADGE[test.difficulty] || 'bg-bg-2 border-border text-text3'}`}>
                                {test.difficulty}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text3">
                            {test.duration && <span>ΓÅ▒ {test.duration} min</span>}
                            {test.questionsCount && <span>≡ƒôä {test.questionsCount} questions</span>}
                            {test.marks && <span>≡ƒÄ» {test.marks} marks</span>}
                            {test.attemptStatus && (
                              <span className={
                                test.attemptStatus === 'completed' ? 'text-green-400' :
                                test.attemptStatus === 'in-progress' ? 'text-orange-400' : 'text-text3'
                              }>
                                {test.attemptStatus === 'completed' ? 'Γ£ô Completed' :
                                 test.attemptStatus === 'in-progress' ? 'ΓÅ│ In Progress' : 'Not Attempted'}
                              </span>
                            )}
                          </div>
                        </div>
                        <StartTestButton onClick={() => navigate(`/mock-tests/${test._id || test.id}`)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* PDF Viewer */}
      {viewerFile && viewerFile.type === 'pdf' && (
        <PremiumPdfViewer
          url={viewerFile.fileUrl?.startsWith('http') ? viewerFile.fileUrl : viewerFile.fileUrl}
          fileName={viewerFile.name}
          onClose={() => setViewerFile(null)}
        />
      )}
      {viewerFile && viewerFile.type !== 'pdf' && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setViewerFile(null)}>
          <div className="max-w-4xl max-h-[90vh] w-full bg-surface rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold text-text truncate">{viewerFile.name}</div>
              <button onClick={() => setViewerFile(null)} className="text-text3 hover:text-text p-1">&times;</button>
            </div>
            <div className="p-2">
              <img src={viewerFile.fileUrl} alt={viewerFile.name} className="max-w-full max-h-[75vh] mx-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
