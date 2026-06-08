// GateForge — GATE CSE 2027 syllabus with subject-wise weightage
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subjectService, getApiErrorMessage } from '../services/api';
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
  const [subjects, setSubjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [showWeightage, setShowWeightage] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [hierRes, analRes] = await Promise.all([
          subjectService.getHierarchy(),
          subjectService.getAnalytics().catch(() => null),
        ]);
        setSubjects(hierRes.data.data || []);
        if (analRes?.data?.data) setAnalytics(analRes.data.data);
        // Auto-expand first high-priority subject
        const first = (hierRes.data.data || []).find((s) => s.isHighPriority);
        if (first) setExpanded(first._id);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to load — run: cd backend && npm run seed'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-sm text-text3 py-16 text-center">Loading GATE 2027 syllabus...</div>;

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

      <div className="mb-5">
        <button type="button" onClick={() => setShowWeightage(!showWeightage)} className="text-xs text-primary hover:opacity-80 mb-2">
          {showWeightage ? '▼ Hide' : '▶ Show'} GATE 2027 Subject Weightage Table
        </button>
        {showWeightage && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-2">
                  <th className="text-left px-4 py-2 text-[10px] uppercase text-text3">Subject</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase text-text3">Expected Marks</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase text-text3">Your Progress</th>
                </tr>
              </thead>
              <tbody>
                {WEIGHTAGE_TABLE.map((row) => {
                  const sub = subjects.find((s) => s.name.includes(row.subject.split(' ')[0]) || s.name === row.subject);
                  const pct = sub?.completionPct || 0;
                  return (
                    <tr key={row.subject} className="border-b border-border/50 hover:bg-hover">
                      <td className="px-4 py-2.5 text-text">
                        {row.subject}
                        {sub?.isHighPriority && <span className="ml-2 text-[9px] text-primary">★ HIGH</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-text2">{row.marks}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-xs font-mono ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-orange-400' : 'text-text3'}`}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
