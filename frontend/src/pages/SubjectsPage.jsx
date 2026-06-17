// GateForge — GATE CSE 2027 syllabus with subject-wise weightage
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { subjectService, getApiErrorMessage } from '../services/api';
import { PageLoading } from '../components/common/GateLoadingScreen';
import toast from 'react-hot-toast';

const DIFF_DOT = { easy: 'bg-green-400', medium: 'bg-orange-400', hard: 'bg-red-400' };

const WEIGHTAGE_TABLE = [
  { subject: 'General Aptitude', marks: '~15' },
  { subject: 'Engineering Mathematics', marks: '10–15' },
  { subject: 'Programming & Data Structures', marks: '10–13' },
  { subject: 'Computer Networks', marks: '7–10' },
  { subject: 'Operating Systems', marks: '8–10' },
  { subject: 'DBMS', marks: '7–9' },
  { subject: 'Computer Organization (COA)', marks: '7–10' },
  { subject: 'Theory of Computation', marks: '7–9' },
  { subject: 'Algorithms', marks: '6–9' },
  { subject: 'Compiler Design', marks: '4–6' },
  { subject: 'Digital Logic', marks: '4–6' },
];

export default function SubjectsPage() {
  const { topics: localTopics, studyStats } = useProgress();
  const [subjects, setSubjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [showWeightage, setShowWeightage] = useState(true);
  const [loading, setLoading] = useState(true);

  const buildFallbackData = () => {
    // Default fallback subjects in case studyStats is empty
    const defaultSubjects = [
      { name: 'General Aptitude', code: 'aptitude', icon: '🧠', color: '#10b981', weightage: 15, isHighPriority: false },
      { name: 'Engineering Mathematics', code: 'math', icon: '📐', color: '#3b82f6', weightage: 13, isHighPriority: true },
      { name: 'Programming & Data Structures', code: 'ds', icon: '💻', color: '#8b5cf6', weightage: 12, isHighPriority: true },
      { name: 'Algorithms', code: 'algo', icon: '⚡', color: '#f59e0b', weightage: 8, isHighPriority: true },
      { name: 'Operating Systems', code: 'os', icon: '🖥️', color: '#ec4899', weightage: 9, isHighPriority: true },
      { name: 'DBMS', code: 'dbms', icon: '🗃️', color: '#06b6d4', weightage: 8, isHighPriority: true },
      { name: 'Computer Networks', code: 'cn', icon: '🌐', color: '#14b8a6', weightage: 9, isHighPriority: true },
      { name: 'Computer Organization', code: 'coa', icon: '🔧', color: '#f97316', weightage: 8, isHighPriority: true },
      { name: 'Theory of Computation', code: 'toc', icon: '📜', color: '#a855f7', weightage: 8, isHighPriority: false },
      { name: 'Compiler Design', code: 'cd', icon: '⚙️', color: '#64748b', weightage: 5, isHighPriority: false },
      { name: 'Digital Logic', code: 'dl', icon: '🔌', color: '#6366f1', weightage: 5, isHighPriority: false },
    ];

    const subjectsToUse = studyStats?.subjects?.length ? studyStats.subjects : defaultSubjects;

    const subjectsData = subjectsToUse.map((sub, subIdx) => {
      const subTopics = (localTopics || [])
        .filter((t) => t.subject === sub.name)
        .map((t, idx) => ({
          _id: String(t.id || idx),
          name: t.name,
          difficulty: t.difficulty || 'medium',
          weightage: t.weightage || 0,
          order: t.order || idx + 1,
          isCompleted: !!t.done,
          isBookmarked: !!t.bookmarked,
          revisionNeeded: !!t.revisionNeeded,
          markedDifficult: !!t.markedDifficult,
          accuracy: t.accuracy || 0,
        }));
      const completed = subTopics.filter((t) => t.isCompleted).length;
      return {
        _id: sub._id || sub.code || sub.name || `sub-${subIdx}`,
        name: sub.name,
        code: sub.code || sub.name,
        icon: sub.icon || '📘',
        color: sub.color || '#4f8dff',
        weightage: sub.weightage || 0,
        isHighPriority: !!sub.isHighPriority,
        topicCount: subTopics.length || 0,
        completedTopics: completed,
        completionPct: subTopics.length ? Math.round((completed / subTopics.length) * 100) : (sub.progress || 0),
        topics: subTopics,
      };
    });

    const totalTopics = subjectsData.reduce((sum, sub) => sum + (sub.topicCount || 0), 0);
    const totalCompleted = subjectsData.reduce((sum, sub) => sum + (sub.completedTopics || 0), 0);

    return {
      subjects: subjectsData,
      overall: {
        topicCompletionPct: totalTopics ? Math.round((totalCompleted / totalTopics) * 100) : 0,
        totalTopics,
        completedTopics: totalCompleted,
      },
    };
  };

  useEffect(() => {
    (async () => {
      try {
        const [hierRes, analRes] = await Promise.all([
          subjectService.getHierarchy().catch(() => null),
          subjectService.getAnalytics().catch(() => null),
        ]);
        if (hierRes?.data?.data) {
          setSubjects(hierRes.data.data);
          if (analRes?.data?.data) setAnalytics(analRes.data.data);
          // Auto-expand first high-priority subject
          const first = (hierRes.data.data || []).find((s) => s.isHighPriority);
          if (first) setExpanded(first._id);
        } else {
          // Fallback to local if no API response
          const fallback = buildFallbackData();
          setSubjects(fallback.subjects);
          setAnalytics(fallback);
        }
      } catch (err) {
        const fallback = buildFallbackData();
        setSubjects(fallback.subjects);
        setAnalytics(fallback);
        toast.error(getApiErrorMessage(err, 'Showing local syllabus fallback'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoading title="Loading Subjects" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">GATE CSE 2027 — Syllabus</h1>
        <p className="text-sm text-text3 mt-0.5">
          Complete official syllabus · {analytics ? `${analytics.overall.completedTopics}/${analytics.overall.totalTopics} topics (${analytics.overall.topicCompletionPct}%)` : `${subjects.length} subjects`}
        </p>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Overall Completion', value: `${analytics.overall.topicCompletionPct}%`, color: 'text-primary' },
            { label: 'Topics Completed', value: analytics.overall.completedTopics, color: 'text-green-400' },
            { label: 'Total Topics', value: analytics.overall.totalTopics, color: 'text-text' },
            { label: 'High-Priority Subjects', value: subjects.filter((s) => s.isHighPriority).length, color: 'text-orange-400' },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-xl p-4 text-center">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-text3 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {WEIGHTAGE_TABLE.map((row) => {
          const sub = subjects.find((s) => s.name.includes(row.subject.split(' ')[0]) || s.name === row.subject);
          const pct = sub?.completionPct || 0;
          const color = sub?.color || '#4f8dff';
          return (
            <Link
              key={row.subject}
              to={`/subjects/${sub?.code || row.subject}`}
              className="bg-surface border border-border rounded-xl p-3 text-center hover:border-primary/30 transition-all"
            >
              <div className="text-lg mb-1">{sub?.icon || '📘'}</div>
              <div className="text-[10px] font-semibold text-text truncate">{row.subject}</div>
              <div className="text-[9px] text-text3 mt-0.5">{row.marks} marks</div>
              <div className="flex items-center gap-1 justify-center mt-2">
                <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden max-w-[50px]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className={`text-[9px] font-mono ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-orange-400' : 'text-text3'}`}>{pct}%</span>
              </div>
              {sub?.isHighPriority && <span className="text-[8px] text-primary font-bold block mt-1">★ HIGH</span>}
            </Link>
          );
        })}
      </div>

      <div className="space-y-2">
        {subjects.map((s) => {
          const isOpen = expanded === s._id;
          const pct = s.completionPct || 0;

          return (
            <div key={s._id} className={`bg-surface border rounded-xl transition-all ${isOpen ? 'border-white/20' : 'border-border hover:border-white/10'}`}>
              <button type="button" className="w-full p-4 flex items-center gap-3 text-left" onClick={() => setExpanded(isOpen ? null : s._id)}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${s.color}20` }}>{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">{s.name}</span>
                    {s.isHighPriority && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">HIGH</span>}
                  </div>
                  <div className="text-[11px] text-text3 mt-0.5">
                    {s.completedTopics || 0}/{s.topicCount || 0} topics · {s.marksRange || `~${s.weightage} marks`}
                  </div>
                  <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden mt-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold font-mono" style={{ color: s.color }}>{pct}%</div>
                  <div className="text-xs text-text3 mt-1">{isOpen ? '▲' : '▼'}</div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border p-4">
                  {s.frequentlyAsked?.length > 0 && (
                    <div className="mb-3 text-[10px] text-text3">
                      <span className="text-primary font-semibold">FAQ: </span>
                      {(s.frequentlyAsked || []).slice(0, 4).join(' · ')}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(s.topics || []).map((t) => (
                      <Link
                        key={t._id}
                        to={`/learn/topic/${t._id}`}
                        className={`flex items-center gap-2 text-left text-xs rounded-lg p-3 border transition-all hover:border-primary/30 ${
                          t.isCompleted ? 'bg-green-500/5 border-green-500/20' : 'bg-bg-2 border-border'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${DIFF_DOT[t.difficulty] || 'bg-text3'}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`truncate ${t.isCompleted ? 'text-text3 line-through' : 'text-text'}`}>{t.name}</div>
                          <div className="text-[9px] text-text3">
                            {t.difficulty} · ~{t.weightage}%
                            {t.isBookmarked && ' · ★'}{t.revisionNeeded && ' · ↻'}
                          </div>
                        </div>
                        {t.isCompleted && <span className="text-green-400 text-[10px]">✓</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!subjects.length && (
        <div className="text-center py-16 text-text3 text-sm">
          Run <code className="text-primary">cd backend && npm run seed</code> to load the GATE 2027 syllabus.
        </div>
      )}
    </div>
  );
}
