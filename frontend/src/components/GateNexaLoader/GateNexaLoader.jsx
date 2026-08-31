import { useEffect, useRef, useState } from 'react';
import './GateNexaLoader.css';
const TOTAL_BARS = 30;
function CornerBracket({ pos }) {
  return <span className={`gx-corner gx-corner--${pos}`} aria-hidden="true" />;
}
export default function GateNexaLoader({ progress = 0, label = '', active = true, onExited }) {
  const [exiting, setExiting] = useState(false);
  const exitedRef = useRef(false);
  useEffect(() => {
    if (!active && !exitedRef.current) {
      exitedRef.current = true;
      setExiting(true);
      const timer = setTimeout(() => onExited && onExited(), 350);
      return () => clearTimeout(timer);
    }
  }, [active, onExited]);
  const clamped = Math.max(0, Math.min(100, progress));
  const litBars = Math.round((clamped / 100) * TOTAL_BARS);
  return (
    <div className={`gx-loader${exiting ? ' gx-loader--exiting' : ''}`} role="status" aria-live="polite">
      <div className="gx-loader__bg" aria-hidden="true" />
      <div className="gx-loader__grain" aria-hidden="true" />
      <div className="gx-loader__card">
        <CornerBracket pos="tl" />
        <CornerBracket pos="tr" />
        <CornerBracket pos="bl" />
        <CornerBracket pos="br" />
        <div className="gx-loader__eyebrow">
          <span className="gx-loader__dot" aria-hidden="true" />
          <span>GATENEXA / AI ENGINE</span>
        </div>
        <div className="gx-loader__rule" />
        <div className="gx-wordmark-wrap">
          <div className="gx-kicker">GATE</div>
          <h1 className="gx-wordmark">
            {'NEXA'.split('').map((letter, i) => (
              <span key={`${letter}-${i}`} data-letter={letter}>
                {letter}
              </span>
            ))}
          </h1>
        </div>
        <div className="gx-loader__rule" />
        <div className="gx-loader__rows">
          <div className="gx-loader__row">
            <span className="gx-loader__row-label">SESSION</span>
            <span className="gx-loader__row-value">GATE 2027 · CSE</span>
          </div>
          <div className="gx-loader__row">
            <span className="gx-loader__row-label">ENGINE</span>
            <span className="gx-loader__row-value">AI Mentor · Online</span>
          </div>
          <div className="gx-loader__row">
            <span className="gx-loader__row-label">STATUS</span>
            <span className="gx-loader__row-value gx-loader__status-value" key={label}>{label}</span>
          </div>
        </div>
        <div className="gx-loader__progress" aria-hidden="true">
          {Array.from({ length: TOTAL_BARS }).map((_, i) => {
            const lit = i < litBars;
            const h = 40 + ((i * 37) % 60);
            return <span key={i} className={lit ? 'is-active' : ''} style={{ height: `${h}%` }} />;
          })}
        </div>
        <div className="gx-loader__boot">
          <span>SYSTEM BOOT</span>
          <span className="gx-loader__boot-value">{Math.round(clamped)}%</span>
        </div>
      </div>
    </div>
  );
}
