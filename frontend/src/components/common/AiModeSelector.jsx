import { useState, useRef, useEffect } from 'react';
import { MODES } from '../../hooks/useAiMode';

export default function AiModeSelector({ mode, setMode, current }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          color: '#C4B5FD',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
          border: '1px solid rgba(139,92,246,0.25)',
        }}
        aria-label={`AI mode: ${current.label}. Click to change.`}
        aria-expanded={open}
      >
        <span>{current.icon}</span>
        <span>{current.label}</span>
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path fillRule="evenodd" d="M4.293 5.293a1 1 0 011.414 0L8 7.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-48 rounded-xl overflow-hidden z-50"
          style={{
            background: 'rgba(10,15,30,0.98)',
            border: '1px solid rgba(139,92,246,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {Object.values(MODES).map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setOpen(false); }}
              className="w-full text-left px-3.5 py-2.5 text-xs transition-all hover:bg-white/5 flex items-center gap-3"
              style={{
                background: mode === m.id ? 'rgba(139,92,246,0.1)' : 'transparent',
                color: mode === m.id ? '#A78BFA' : 'rgba(255,255,255,0.7)',
              }}
            >
              <span className="text-base">{m.icon}</span>
              <div>
                <div className="font-semibold">{m.label}</div>
                <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{m.description}</div>
              </div>
              {mode === m.id && (
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 ml-auto shrink-0" style={{ color: '#A78BFA' }}>
                  <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
