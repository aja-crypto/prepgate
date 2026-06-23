import { useMemo } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { computeSubjectCompletion } from '../../utils/gateUtils';
import GlassCard from '../ui/GlassCard';

const PHASES = [
  { month: 'August 2026', label: 'Foundation Phase', targets: ['Mathematics', 'C Programming', 'Data Structures'], focus: ['Algorithms', 'Discrete Mathematics'], expectedMin: 25, expectedMax: 35 },
  { month: 'September 2026', label: 'Core Subjects', targets: ['Algorithms', 'Discrete Mathematics', 'Computer Organization'], focus: ['Operating Systems', 'DBMS'], expectedMin: 35, expectedMax: 45 },
  { month: 'October 2026', label: 'Strength Building', targets: ['Operating Systems', 'DBMS'], focus: ['Computer Networks', 'TOC'], expectedMin: 45, expectedMax: 55 },
  { month: 'November 2026', label: 'Syllabus Completion', targets: ['Computer Networks', 'TOC', 'Compiler Design'], focus: ['Revision Round 1'], expectedMin: 55, expectedMax: 65 },
  { month: 'December 2026', label: 'Mock Test Phase', targets: ['Full-Length Mock Tests'], focus: ['Time Management', 'Accuracy'], expectedMin: 65, expectedMax: 70 },
  { month: 'January 2027', label: 'Rank Booster Phase', targets: ['15–20 Full-Length Mocks'], focus: ['PYQ Completion', 'Weak Areas'], expectedMin: 70, expectedMax: 80 },
  { month: 'February 2027', label: 'Final Revision', targets: ['Formula Revision', 'Mistake Notebook', 'Short Notes'], focus: ['Mock Analysis', 'Confidence'], expectedMin: 80, expectedMax: 85 },
  { month: 'March 2027', label: 'Results & Analysis', targets: ['GATE Score', 'Rank Prediction', 'Next Steps'], focus: ['College Applications', 'PSU Prep'], expectedMin: 85, expectedMax: 90 },
];

const PHASE_SUBJECTS = {
  'Foundation Phase': ['Mathematics', 'C Programming', 'Data Structures'],
  'Core Subjects': ['Algorithms', 'Discrete Mathematics', 'Computer Organization'],
  'Strength Building': ['Operating Systems', 'DBMS'],
  'Syllabus Completion': ['Computer Networks', 'TOC', 'Compiler Design'],
};

export default function ExamTimeline() {
  const { studyStats, topics, pyqs, gateFeatures, mocks } = useProgress();

  const progress = useMemo(() => {
    const safeTopics = topics || [];
    const safePyqs = pyqs || [];
    const safeMocks = mocks || [];
    const subjects = studyStats?.subjects || [];
    const completion = computeSubjectCompletion(subjects, safeTopics, safePyqs);
    const totalSubjects = completion.length || 12;
    const completed = completion.filter(s => s.progress >= 80).length;
    const solvedPyqs = safePyqs.filter(p => p.solved).length;
    const weeklyHours = studyStats?.weeklyHours || [];
    const totalHours = weeklyHours.reduce((a, b) => a + b, 0);
    const streakCurrent = gateFeatures?.streak?.current || 0;
    const consistency = Math.min(100, streakCurrent * 5);
    const strongTopics = completion.filter(s => s.progress >= 70).slice(0, 3).map(s => s.name);
    const weakTopics = completion.filter(s => s.progress < 40).slice(0, 3).map(s => s.name);
    const mockAvg = safeMocks.length ? (safeMocks.reduce((s, m) => s + m.score, 0) / safeMocks.length) : 0;

    return { totalSubjects, completed, solvedPyqs, totalHours, consistency, strongTopics, weakTopics, mockAvg, streakCurrent };
  }, [topics, pyqs, studyStats, gateFeatures, mocks]);

  const now = new Date();
  const currentPhaseIdx = PHASES.findIndex(p => {
    const d = new Date(p.month);
    return d > now;
  });
  const activePhase = currentPhaseIdx >= 0 ? currentPhaseIdx : PHASES.length - 1;
  const monthsLeft = Math.max(0, (new Date('2027-02-01').getFullYear() - now.getFullYear()) * 12 + (new Date('2027-02-01').getMonth() - now.getMonth()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))',
        }}>
          🚀
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Your Journey to GATE 2027</h3>
          <p className="text-[10px] text-gray-400">Personalized success roadmap</p>
        </div>
      </div>

      <div className="space-y-3">
        {PHASES.map((phase, idx) => {
          const isPast = idx < activePhase;
          const isCurrent = idx === activePhase;
          const phaseSubjects = PHASE_SUBJECTS[phase.label] || [];
          const phaseCompleted = phaseSubjects.filter(s =>
            progress.strongTopics.some(pt => pt.toLowerCase().includes(s.toLowerCase()))
          ).length;
          const phaseProgress = phaseSubjects.length > 0 ? Math.round((phaseCompleted / phaseSubjects.length) * 100) : 0;

          return (
            <div key={phase.month} className={`rounded-xl transition-all duration-300 ${isCurrent ? 'ring-1' : ''}`} style={{
              background: isCurrent
                ? 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(34,211,238,0.03))'
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isCurrent ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)'}`,
              ...(isCurrent ? { boxShadow: '0 0 20px -8px rgba(139,92,246,0.15)' } : {}),
            }}>
              {/* Header */}
              <div className="flex items-center justify-between p-3 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{
                    background: isCurrent
                      ? 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))'
                      : isPast
                      ? 'rgba(52,211,153,0.1)'
                      : 'rgba(255,255,255,0.03)',
                  }}>
                    {isPast ? '✅' : isCurrent ? '🎯' : '📅'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-white' : isPast ? 'text-gray-500' : 'text-gray-300'}`}>
                        {phase.month}
                      </span>
                      {isCurrent && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.2)' }}>
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] font-medium ${isCurrent ? 'text-gray-300' : 'text-gray-500'}`}>
                      {phase.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {isPast ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>Completed</span>
                  ) : isCurrent ? (
                    <span className="text-xs font-bold font-mono" style={{ color: '#22D3EE' }}>{monthsLeft}mo left</span>
                  ) : (
                    <span className="text-[9px] text-gray-500">Upcoming</span>
                  )}
                </div>
              </div>

              {/* Content (always visible for current, simple summary for past) */}
              {(isCurrent || isPast) ? (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    <StatBox label={isCurrent ? 'Completed' : 'Achieved'} value={`${progress.completed}/${progress.totalSubjects}`} unit="subjects" color="#A78BFA" />
                    <StatBox label="PYQs Solved" value={progress.solvedPyqs} unit="questions" color="#22D3EE" />
                    <StatBox label="Study Hours" value={progress.totalHours} unit="hours" color="#34D399" />
                    <StatBox label="Consistency" value={`${progress.consistency}%`} unit={`${progress.streakCurrent}d streak`} color="#FBBF24" />
                  </div>

                  <div className="flex flex-wrap gap-3 text-[10px]">
                    {phase.targets.length > 0 && (
                      <div>
                        <span className="text-gray-500">Target: </span>
                        {phase.targets.map((t, i) => (
                          <span key={i} className="text-gray-300">{i > 0 ? ', ' : ''}{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isCurrent && progress.weakTopics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[9px] text-gray-500">Weak Areas:</span>
                      {progress.weakTopics.map((w, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(244,63,94,0.1)', color: '#F87171' }}>
                          ⚠ {w}
                        </span>
                      ))}
                    </div>
                  )}

                  {isCurrent && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.08)' }}>
                      <span className="text-[9px] text-gray-400">AI Recommendation:</span>
                      <span className="text-[10px] text-gray-200">
                        {phase.focus[0] ? `Focus on ${phase.focus.slice(0, 2).join(' and ')}. ` : ''}
                        Expected Gain: +{phase.expectedMin}–{phase.expectedMax} Marks
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="mt-2 text-right">
                      <span className="text-[9px] font-mono" style={{ color: '#34D399' }}>
                        Expected Score: {phase.expectedMin}–{phase.expectedMax} Marks
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>Focus: {phase.focus.join(', ')}</span>
                    <span>·</span>
                    <span>Target: {phase.expectedMin}–{phase.expectedMax} marks</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({ label, value, unit, color }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[8px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-[8px] text-gray-600">{unit}</div>
    </div>
  );
}
