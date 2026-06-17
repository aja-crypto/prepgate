const STEPS = [
  { icon: '📖', label: 'Learn', desc: 'Study concepts from trusted resources', color: '#7C3AED' },
  { icon: '📝', label: 'Notes', desc: 'Create short revision notes', color: '#8B5CF6' },
  { icon: '🔄', label: 'Revise', desc: 'Spaced repetition cycle', color: '#6366F1' },
  { icon: '🎯', label: 'PYQs', desc: 'Solve previous year questions', color: '#4F46E5' },
  { icon: '🧪', label: 'Tests', desc: 'Mock tests & subject exams', color: '#06B6D4' },
  { icon: '🏆', label: 'Success', desc: 'Crack GATE with top rank', color: '#10B981' },
];

export default function StudyWorkflow() {
  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-[23px] top-8 bottom-8 w-[2px] hidden sm:block" style={{ background: 'linear-gradient(180deg, #7C3AED, #06B6D4, #10B981)' }} />

      <div className="space-y-6">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-start gap-5 group">
            {/* Icon */}
            <div
              className="w-[48px] h-[48px] rounded-xl flex items-center justify-center text-lg flex-shrink-0 relative z-10 transition-all duration-300 group-hover:scale-110"
              style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}
            >
              {step.icon}
            </div>

            {/* Content */}
            <div className="pt-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-white">{step.label}</span>
                {i < STEPS.length - 1 && (
                  <span className="text-gray-600 text-xs hidden sm:inline">→</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
