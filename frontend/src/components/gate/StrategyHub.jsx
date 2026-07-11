import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';

const STRATEGIES = [
  {
    id: '30-marks',
    icon: '🎯',
    title: 'Score 30 Marks',
    difficulty: 'Easy',
    target: '30–40 Marks',
    studyTime: '2–3 Hours Daily',
    duration: '30 Days',
    focus: ['Engineering Mathematics', 'Aptitude', 'Digital Logic', 'C Programming'],
    color: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/20',
    textColor: 'text-green-400',
    plan: {
      overview: 'This foundational strategy focuses on high-weightage, low-difficulty subjects to get you to a qualifying score quickly.',
      weekly: [
        { week: 1, subjects: ['Engineering Mathematics', 'Aptitude', 'Digital Logic'], tasks: ['20 PYQs daily', '30 Formula revisions', '1 Mock test'], hours: '2-3h' },
        { week: 2, subjects: ['C Programming', 'Engineering Mathematics'], tasks: ['Programming practice', 'Topic-wise tests', 'Error analysis'], hours: '3h' },
        { week: 3, subjects: ['Digital Logic', 'Aptitude'], tasks: ['Speed practice', 'Full-length mock', 'Weak area revision'], hours: '3h' },
        { week: 4, subjects: ['All focus subjects'], tasks: ['Full mocks', 'Error review', 'Confidence building'], hours: '3h' },
      ],
      pyqs: ['Engineering Mathematics: All PYQs (2017-2025)', 'Aptitude: All PYQs', 'Digital Logic: GATE 2020-2025'],
      mockSchedule: '1 subject-wise test per week → 1 full-length mock in Week 3-4',
    },
  },
  {
    id: '50-marks',
    icon: '🚀',
    title: 'Score 50 Marks',
    difficulty: 'Medium',
    target: '50–60 Marks',
    studyTime: '3–4 Hours Daily',
    duration: '60 Days',
    focus: ['Engineering Mathematics', 'Aptitude', 'Digital Logic', 'C Programming', 'Computer Networks'],
    color: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/20',
    textColor: 'text-blue-400',
    plan: {
      overview: 'An NIT-focused plan. Builds on the foundation with Computer Networks and structured PYQ practice.',
      weekly: [
        { week: 1, subjects: ['Engineering Mathematics', 'Aptitude'], tasks: ['Foundation revision', '30 PYQs daily', 'Formula mastery'], hours: '3h' },
        { week: 2, subjects: ['Digital Logic', 'C Programming'], tasks: ['Digital circuits practice', 'Programming problems', 'Topic test'], hours: '3-4h' },
        { week: 3, subjects: ['Computer Networks', 'Engineering Mathematics'], tasks: ['CN basics + PYQs', 'Math advanced problems', 'Error analysis'], hours: '3-4h' },
        { week: 4, subjects: ['All focus subjects'], tasks: ['Full-length mock', 'Identify weak areas', 'Targeted revision'], hours: '4h' },
      ],
      pyqs: ['All subjects: GATE 2017-2025 PYQs', 'Computer Networks: All PYQs'],
      mockSchedule: 'Weekly full-length mock starting Week 3',
    },
  },
  {
    id: 'air-5000',
    icon: '🏆',
    title: 'AIR Below 5000',
    difficulty: 'Hard',
    target: '65–75 Marks',
    studyTime: '4–5 Hours Daily',
    duration: '90 Days',
    focus: ['All core CS subjects', 'Engineering Mathematics', 'Aptitude', 'OS', 'DBMS', 'CN', 'Algorithms'],
    color: 'from-purple-500/20 to-violet-500/10',
    border: 'border-purple-500/20',
    textColor: 'text-purple-400',
    plan: {
      overview: 'A structured roadmap covering all core CS subjects with regular mock tests and error analysis for a top 5000 rank.',
      weekly: [
        { week: 1, subjects: ['OS', 'DBMS'], tasks: ['OS fundamentals + PYQs', 'DBMS normalization + SQL', 'Topic tests'], hours: '4h' },
        { week: 2, subjects: ['CN', 'Algorithms'], tasks: ['CN routing + transport layer', 'Algorithm design practice', '30 PYQs daily'], hours: '4-5h' },
        { week: 3, subjects: ['Engineering Mathematics', 'Aptitude'], tasks: ['Math deep dive', 'Aptitude speed practice', 'Full mock'], hours: '4-5h' },
        { week: 4, subjects: ['All subjects'], tasks: ['2 subject tests', '1 full mock', 'Error analysis', 'Revision'], hours: '5h' },
      ],
      pyqs: ['All GATE PYQs (2010-2025) sorted by subject', 'Topic-wise PYQ practice'],
      mockSchedule: '2 subject tests + 1 full-length mock weekly',
    },
  },
  {
    id: 'air-1000',
    icon: '💎',
    title: 'AIR Below 1000',
    difficulty: 'Hard',
    target: '80–85 Marks',
    studyTime: '5–6 Hours Daily',
    duration: '120 Days',
    focus: ['All CS subjects', 'TOC', 'COA', 'Compiler Design', 'Advanced Math'],
    color: 'from-rose-500/20 to-pink-500/10',
    border: 'border-rose-500/20',
    textColor: 'text-rose-400',
    plan: {
      overview: 'An advanced roadmap for competitive ranks. Covers all GATE subjects with deep PYQ analysis and weekly mock assessments.',
      weekly: [
        { week: 1, subjects: ['TOC', 'COA'], tasks: ['Automata theory', 'Computer architecture', 'Topic-wise PYQs'], hours: '5h' },
        { week: 2, subjects: ['Compiler Design', 'OS'], tasks: ['Compiler phases', 'OS memory management', 'Error analysis'], hours: '5h' },
        { week: 3, subjects: ['DBMS', 'CN'], tasks: ['Advanced queries', 'Network security', 'Full mock'], hours: '5-6h' },
        { week: 4, subjects: ['All subjects'], tasks: ['2 subject tests', '1 full mock', 'Comprehensive revision'], hours: '6h' },
      ],
      pyqs: ['All GATE PYQs (2005-2025)', 'Previous year papers with error tracking'],
      mockSchedule: '2 subject tests + 1 full mock per week, detailed error analysis',
    },
  },
  {
    id: 'air-100',
    icon: '👑',
    title: 'AIR Below 100',
    difficulty: 'Expert',
    target: '90+ Marks',
    studyTime: '6–8 Hours Daily',
    duration: '180 Days',
    focus: ['All subjects with mastery', 'Advanced problem-solving', 'Speed & accuracy'],
    color: 'from-amber-500/20 to-yellow-500/10',
    border: 'border-amber-500/20',
    textColor: 'text-amber-400',
    plan: {
      overview: 'The top-tier strategy for single-digit ranks. Requires complete syllabus coverage with rigorous mock analysis and continuous improvement.',
      weekly: [
        { week: 1, subjects: ['Advanced Math', 'TOC', 'COA'], tasks: ['Deep theory revision', 'Advanced PYQs', 'Timed practice'], hours: '6h' },
        { week: 2, subjects: ['OS', 'DBMS', 'CN'], tasks: ['System design basics', 'Advanced DBMS', 'Network protocols deep dive'], hours: '6-7h' },
        { week: 3, subjects: ['Algorithms', 'Compiler Design'], tasks: ['Algorithm optimization', 'Compiler optimization', 'Full mock'], hours: '7h' },
        { week: 4, subjects: ['All subjects'], tasks: ['3 subject tests', '1 full mock', 'Mistake analysis', 'Speed drills'], hours: '8h' },
      ],
      pyqs: ['All GATE PYQs (2000-2025) with time tracking', 'International exams for advanced practice'],
      mockSchedule: '3 subject tests + 2 full-length mocks weekly with detailed performance analysis',
    },
  },
  {
    id: 'crash-course',
    icon: '📅',
    title: '30-Day Crash Course',
    difficulty: 'Intense',
    target: '45–55 Marks',
    studyTime: '6–8 Hours Daily',
    duration: '30 Days',
    focus: ['High-weightage topics only', 'Quick revision cycles', 'Mock test focus'],
    color: 'from-orange-500/20 to-red-500/10',
    border: 'border-orange-500/20',
    textColor: 'text-orange-400',
    plan: {
      overview: 'A last-month intensive plan focusing on high-weightage topics, rapid revision cycles, and mock test performance optimization.',
      weekly: [
        { week: 1, subjects: ['Engineering Mathematics', 'Aptitude', 'Digital Logic'], tasks: ['Rapid revision', 'PYQ blitz (50/day)', 'Formula memorization'], hours: '6h' },
        { week: 2, subjects: ['C Programming', 'OS', 'DBMS'], tasks: ['Core concepts', 'Topic-wise tests', 'Error correction'], hours: '7h' },
        { week: 3, subjects: ['CN', 'Algorithms'], tasks: ['Key algorithms', 'CN protocols', 'Full mock daily'], hours: '7-8h' },
        { week: 4, subjects: ['All subjects'], tasks: ['Full mocks', 'Final revision', 'Confidence building'], hours: '8h' },
      ],
      pyqs: ['Last 5 years PYQs (2020-2025) - all subjects', 'Most frequently repeated questions'],
      mockSchedule: '1 full-length mock daily in Week 3-4',
    },
  },
];

function StrategyDrawer({ strategy, onClose }) {
  if (!strategy) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-3xl relative rounded-2xl border border-white/[0.08] overflow-hidden my-8"
        style={{ background: '#0C0F23' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{strategy.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-text">{strategy.title}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-semibold ${strategy.textColor} bg-white/[0.04] px-2 py-0.5 rounded-full border ${strategy.border}`}>
                    {strategy.difficulty}
                  </span>
                  <span className="text-[10px] text-text3">Target: {strategy.target}</span>
                  <span className="text-[10px] text-text3">{strategy.duration}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-text3 hover:text-text p-1 text-xl leading-none">&times;</button>
          </div>

          {/* Overview */}
          <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm text-text2 leading-relaxed">{strategy.plan.overview}</p>
          </div>

          {/* Weekly Plan */}
          <h3 className="text-sm font-bold text-text mb-4">Weekly Plan</h3>
          <div className="space-y-3 mb-6">
            {strategy.plan.weekly.map((week) => (
              <div key={week.week} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary">Week {week.week} ({week.hours}/day)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {week.subjects.map((sub) => (
                    <span key={sub} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {sub}
                    </span>
                  ))}
                </div>
                <div className="space-y-0.5">
                  {week.tasks.map((task) => (
                    <div key={task} className="flex items-center gap-2 text-[11px] text-text3">
                      <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* PYQs & Mock Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <h4 className="text-xs font-bold text-text mb-2">Recommended PYQs</h4>
              <div className="space-y-1">
                {strategy.plan.pyqs.map((pyq) => (
                  <div key={pyq} className="flex items-center gap-2 text-[10px] text-text3">
                    <span className="w-1 h-1 rounded-full bg-purple-400/40 shrink-0" />
                    {pyq}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <h4 className="text-xs font-bold text-text mb-2">Mock Test Schedule</h4>
              <p className="text-[10px] text-text3 leading-relaxed">{strategy.plan.mockSchedule}</p>
            </div>
          </div>

          {/* Why this roadmap */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 mb-6">
            <p className="text-xs text-text2 leading-relaxed italic">
              "{strategy.plan.overview}"
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-text3 border border-white/[0.08] hover:text-text transition-all">
              Close
            </button>
            <button onClick={() => { onClose(); }}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
              Start This Strategy →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function StrategyHub({ weakSubject, onStartLearning }) {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <span>🎯</span> AI Strategy Hub
          </h3>
          <span className="text-[10px] text-text3">Choose your target</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {STRATEGIES.map((s) => (
            <motion.button
              key={s.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(s)}
              className={`relative p-4 rounded-xl border text-left transition-all bg-gradient-to-br ${s.color} ${s.border} hover:border-white/[0.15] group`}
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${s.color} opacity-30 group-hover:opacity-40 transition-opacity`} />
              <div className="relative z-10">
                <span className="text-2xl block mb-2">{s.icon}</span>
                <h4 className={`text-sm font-bold ${s.textColor} mb-1`}>{s.title}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${s.border} ${s.textColor}`}>
                    {s.difficulty}
                  </span>
                  <span className="text-[9px] text-text3">{s.target}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text3">
                  <span>{s.studyTime}</span>
                  <span>·</span>
                  <span>{s.duration}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.focus.slice(0, 3).map((f) => (
                    <span key={f} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-text3">{f}</span>
                  ))}
                  {s.focus.length > 3 && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-text3">+{s.focus.length - 3}</span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-[10px] text-text3 leading-relaxed">
            These strategies are generated based on your target, current progress, and available study time.
            Adjust your inputs in the dashboard for better personalization.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <StrategyDrawer strategy={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
