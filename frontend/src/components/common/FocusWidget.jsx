import { useState, useEffect, useRef } from 'react';
import { useFocus } from '../../context/FocusContext';

export default function FocusWidget() {
  const {
    isActive, isPaused, mode, sessionDuration, timeRemaining,
    sessionsCompleted, dailyStreak, isMinimized, currentSubject,
    progress, DURATIONS, BREAK_DURATION,
    startSession, pauseSession, resumeSession, stopSession,
    toggleMinimized, selectDuration, formatTime,
  } = useFocus();

  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (showDurationPicker) setShowDurationPicker(isActive);
  }, [isActive]);

  useEffect(() => {
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowDurationPicker(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isActive && !isMinimized) {
    // Show the "Start Focus" trigger
    return (
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {showDurationPicker && (
          <div ref={pickerRef} className="bg-surface backdrop-blur-xl border border-border rounded-xl p-2 shadow-2xl flex gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => { selectDuration(d.value); setShowDurationPicker(false); startSession(d.value, null); }}
                className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border text-text2 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowDurationPicker((s) => !s)}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
          Focus
        </button>
      </div>
    );
  }

  // Mobile: floating pill when collapsed
  if (isMobile && !mobileExpanded) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setMobileExpanded(true)}
          className="flex items-center gap-2 bg-primary/90 backdrop-blur-xl text-white text-xs font-semibold px-3 py-2 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all border border-white/10"
        >
          <span>{formatTime(timeRemaining)}</span>
          {mode === 'break' && <span className="text-[10px] text-green-200">Break</span>}
        </button>
      </div>
    );
  }

  // Desktop widget or mobile expanded
  return (
    <div className={`fixed bottom-5 right-5 z-50 ${isMobile ? 'inset-0 bottom-0 right-0 flex items-end justify-center p-4 bg-black/40' : ''}`}>
      <div className={`bg-surface backdrop-blur-xl border border-border rounded-2xl shadow-2xl ${isMobile ? 'w-full max-w-sm' : 'w-[260px]'} overflow-hidden transition-all`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text">
              {mode === 'break' ? 'Break Time' : 'Focus Session'}
            </span>
            {dailyStreak > 0 && (
              <span className="text-[10px] text-orange-400 font-medium flex items-center gap-0.5">
                {dailyStreak}d streak
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isMobile && (
              <button
                onClick={toggleMinimized}
                className="text-text3 hover:text-text p-0.5 transition-colors"
                title="Minimize"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              </button>
            )}
            {isMobile && (
              <button
                onClick={() => setMobileExpanded(false)}
                className="text-text3 hover:text-text p-0.5 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className="px-4 py-2 text-center">
          <div className={`font-mono font-bold text-text tracking-tight ${isMobile ? 'text-6xl' : 'text-3xl'}`}>
            {formatTime(timeRemaining)}
          </div>
          {currentSubject && (
            <div className="text-[10px] text-primary mt-0.5 font-medium truncate max-w-full">
              {currentSubject}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-1.5">
          <div className="h-1 rounded-full bg-bg-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${mode === 'work' ? 'bg-primary' : 'bg-success'}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>

        {/* Duration selector */}
        {!isActive && (
          <div className="px-4 pb-2 flex gap-1 justify-center">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => selectDuration(d.value)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                  sessionDuration === d.value
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'border-border text-text3 hover:border-primary/30'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="px-4 pb-3.5 flex gap-2 justify-center">
          {!isActive ? (
            <button
              onClick={() => startSession(sessionDuration, currentSubject)}
              className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-all shadow-sm shadow-primary/20"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              Start
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={resumeSession}
                  className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-all"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseSession}
                  className="flex items-center gap-1.5 bg-bg-2 border border-border text-text2 text-xs font-semibold px-5 py-2 rounded-lg hover:bg-hover transition-all"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  Pause
                </button>
              )}
              <button
                onClick={stopSession}
                className="flex items-center gap-1.5 bg-danger/10 border border-danger/20 text-danger text-xs font-semibold px-4 py-2 rounded-lg hover:bg-danger/15 transition-all"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                Stop
              </button>
            </>
          )}
        </div>

        {/* Sessions count */}
        {sessionsCompleted > 0 && (
          <div className="px-4 pb-3 text-center">
            <div className="text-[10px] text-text3">
              Sessions completed today: {sessionsCompleted}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
