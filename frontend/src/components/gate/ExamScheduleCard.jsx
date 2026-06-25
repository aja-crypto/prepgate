// Important GATE exam dates timeline
export default function ExamScheduleCard({ schedule = [], examDate }) {
  const eventIcons = {
    application_start: '📝',
    application_end: '⏰',
    admit_card: '🎫',
    exam: '📋',
    answer_key: '🔑',
    result: '🏆',
    counseling: '🎓',
    correction_window: '✏️',
  };

  const now = new Date();

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text">📅 GATE 2027 Schedule</div>
          <div className="text-[11px] text-text3 mt-0.5">Application, exam, result & counseling dates</div>
        </div>
        {examDate && (
          <div className="text-right">
            <div className="text-[10px] text-text3">Exam</div>
            <div className="text-xs font-mono text-primary">{new Date(examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {schedule.map((ev) => {
          const date = new Date(ev.date || ev.startDate);
          const isPast = date < now;
          const isUpcoming = !isPast && date - now < 30 * 86400000;
          return (
            <div
              key={ev._id || ev.eventType}
              className={`flex items-center gap-3 rounded-lg p-3 border ${
                isUpcoming ? 'bg-primary/5 border-primary/20' : isPast ? 'bg-bg-2/50 border-border opacity-60' : 'bg-bg-2 border-border'
              }`}
            >
              <span className="text-lg">{eventIcons[ev.eventType] || '📌'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text">{ev.label}</div>
                {ev.description && <div className="text-[10px] text-text3 truncate">{ev.description}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono text-text2">
                  {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {ev.endDate && (
                  <div className="text-[10px] text-text3">
                    to {new Date(ev.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
