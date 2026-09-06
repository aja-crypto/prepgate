'use client';

import { useEffect, useRef, useState } from 'react';
import { getExampleStageLabel, normalizeBootError } from './bootContract';

const TOTAL_BARS = 30;
const NEXA_LETTERS = ['N', 'E', 'X', 'A'];

const STYLE = `
@keyframes gxCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes gxRuleGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes gxKickerIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes gxRowIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes gxDotPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }

/* NEXA resolve sequence — letters fade/rise in with a slight stagger,
   the gradient settles into place with one gentle sweep, a single soft
   glow pass crosses the wordmark, then it breathes calmly. No skew, no
   slicing, no flicker, no rainbow. */
@keyframes gxLetterIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes gxGradientSettle {
  from { background-position: 100% 50%; }
  to   { background-position: 0% 50%; }
}
@keyframes gxWordBreathe {
  0%, 100% { opacity: 0.88; background-position: 0% 50%; }
  50%      { opacity: 1;    background-position: 12% 50%; }
}
@keyframes gxScanPass {
  0%   { opacity: 0; transform: translateX(-60%); }
  15%  { opacity: 0.55; }
  50%  { opacity: 0.35; }
  85%  { opacity: 0; }
  100% { opacity: 0; transform: translateX(60%); }
}

.gx-root { font-family: inherit; }
.gx-mono { font-family: ui-monospace, "SFMono-Regular", "JetBrains Mono", monospace; }

@media (prefers-reduced-motion: reduce) {
  .gx-root * { animation: none !important; transition-duration: 0.01ms !important; }
  .gx-root [data-gx-static-visible] { opacity: 1 !important; transform: none !important; }
}
`;

function CornerBracket({ pos }) {
  const size = 14;
  const base = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: 'rgba(237,234,247,0.2)',
    borderStyle: 'solid',
    borderWidth: 0,
  };
  const map = {
    tl: { top: -1, left: -1, borderTopWidth: 1, borderLeftWidth: 1 },
    tr: { top: -1, right: -1, borderTopWidth: 1, borderRightWidth: 1 },
    bl: { bottom: -1, left: -1, borderBottomWidth: 1, borderLeftWidth: 1 },
    br: { bottom: -1, right: -1, borderBottomWidth: 1, borderRightWidth: 1 },
  };
  return <div aria-hidden="true" style={{ ...base, ...map[pos] }} />;
}

// Hero wordmark. Single clean layer: GATE kicker, then NEXA resolves in
// letter by letter, settles its gradient with one sweep, gets one soft
// glow pass, then breathes gently while boot continues.
function Wordmark() {
  const heroStyle = {
    fontWeight: 800,
    textTransform: 'uppercase',
    fontSize: 'clamp(2.6rem, 11vw, 5.2rem)',
    letterSpacing: 'clamp(0px, 0.2vw, 1px)',
    margin: 0,
    lineHeight: 1,
  };
  // Controlled palette: violet -> purple -> indigo -> electric blue -> cyan hint.
  // 200% background-size gives gxGradientSettle / gxWordBreathe room to move
  // through the palette without ever looking like a hue-rotate or a rainbow.
  const gradient =
    'linear-gradient(100deg, #8B6CFF 0%, #7C5CFC 20%, #6238E0 45%, #3E63E0 70%, #35B7E0 100%)';

  return (
    <div>
      <div
        className="gx-mono text-center"
        data-gx-static-visible
        style={{
          fontSize: '11px',
          letterSpacing: '0.4em',
          color: 'rgba(237,234,247,0.4)',
          marginBottom: '8px',
          animation: 'gxKickerIn 0.5s cubic-bezier(0.16,1,0.3,1) 0s both',
        }}
      >
        GATE
      </div>

      <div
        className="relative text-center"
        style={{ display: 'inline-block', width: '100%' }}
      >
        <h1
          className="text-center"
          data-gx-static-visible
          style={{
            ...heroStyle,
            backgroundImage: gradient,
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 26px rgba(98,56,224,0.35)',
            animation: 'gxWordBreathe 3.2s ease-in-out 1.1s infinite',
          }}
        >
          {NEXA_LETTERS.map((letter, i) => (
            <span
              key={letter + i}
              style={{
                display: 'inline-block',
                animation: `gxLetterIn 0.5s cubic-bezier(0.16,1,0.3,1) ${0.15 + i * 0.07}s both`,
              }}
            >
              {letter}
            </span>
          ))}
        </h1>

        {/* one-shot gradient settle, layered so it doesn't fight the letter stagger */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            ...heroStyle,
            backgroundImage: gradient,
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            opacity: 0,
            animation: 'gxGradientSettle 0.9s ease-out 0.45s 1 both, gxLetterIn 0.1s linear 0.45s 1 forwards',
          }}
        >
          NEXA
        </div>

        {/* single soft glow pass, once, after the letters have resolved */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background:
              'linear-gradient(90deg, transparent, rgba(213,222,255,0.5), transparent)',
            mixBlendMode: 'screen',
            filter: 'blur(6px)',
            animation: 'gxScanPass 1s cubic-bezier(0.4,0,0.2,1) 0.75s 1 both',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

/**
 * GateNexaLoader
 *
 * Presentational boot screen. It renders whatever state your application
 * gives it — it never invents progress, never fakes readiness, and never
 * calls an API. See bootContract.js for the full prop contract.
 *
 *   <GateNexaLoader
 *     progress={bootProgress}   // 0-100, computed by your app
 *     status={bootStatus}       // optional human-readable current step
 *     isReady={appReady}        // optional explicit readiness flag
 *     error={bootError}         // optional critical failure
 *     onRetry={handleRetry}     // optional, shown only when error is set
 *     onTimeout={handleTimeout} // optional, paired with timeoutMs
 *     timeoutMs={15000}         // optional safety net (see below)
 *     onComplete={handleBootComplete}
 *   />
 *
 * With no props at all it just sits at 0% and waits — it will never
 * disappear on its own, and it will never claim work happened that didn't.
 */
export default function GateNexaLoader({
  progress = 0,
  status,
  isReady,
  error = null,
  onComplete,
  onRetry,
  onTimeout,
  timeoutMs,
  fullscreen = true,
}) {
  const [exiting, setExiting] = useState(false);
  const completedRef = useRef(false);
  const timedOutRef = useRef(false);
  const mountedRef = useRef(true);

  const clampedProgress = Math.max(0, Math.min(100, progress ?? 0));
  const litBars = Math.round((clampedProgress / 100) * TOTAL_BARS);
  const bootError = normalizeBootError(error);
  const statusLabel = status || getExampleStageLabel(clampedProgress);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Exit exactly once, driven only by real readiness — either an explicit
  // `isReady` flag or `progress` reaching 100 when `isReady` isn't used.
  // A short hold (not a fake wait — the app is already ready) keeps 100%
  // legible before the fade. Never fires while a critical error is set.
  useEffect(() => {
    if (bootError) return;
    const ready = typeof isReady === 'boolean' ? isReady : clampedProgress >= 100;
    if (!ready || completedRef.current) return;

    completedRef.current = true;
    const holdTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setExiting(true);
      const fadeTimer = setTimeout(() => {
        if (mountedRef.current) onComplete && onComplete();
      }, 350);
      return () => clearTimeout(fadeTimer);
    }, 200);

    return () => clearTimeout(holdTimer);
  }, [isReady, clampedProgress, bootError, onComplete]);

  // Safety net only — never resolves readiness itself. It just tells the
  // parent app that boot has taken an unreasonable amount of time, so the
  // app can decide to show an error, offer a retry, or log it. Disabled
  // when `timeoutMs` isn't provided.
  useEffect(() => {
    if (!timeoutMs || !onTimeout) return;
    const id = setTimeout(() => {
      if (!mountedRef.current) return;
      if (!completedRef.current && !timedOutRef.current) {
        timedOutRef.current = true;
        onTimeout();
      }
    }, timeoutMs);
    return () => clearTimeout(id);
    // Intentionally only re-armed if the timeout duration itself changes —
    // not on every progress tick, so real incremental progress doesn't
    // reset a stall detector into never firing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutMs, onTimeout]);

  const containerStyle = fullscreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        minHeight: '100dvh',
      }
    : { minHeight: '100dvh' };

  return (
    <div
      className="w-full gx-root"
      role="status"
      aria-live="polite"
      aria-busy={!bootError && !exiting}
      style={{
        ...containerStyle,
        background: '#08070F',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 350ms ease',
        pointerEvents: exiting ? 'none' : 'auto',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <style>{STYLE}</style>

      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ minHeight: '100dvh', background: '#08070F' }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 46%, rgba(91,63,209,0.12), transparent 60%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.025,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div
          className="relative z-10"
          style={{
            width: '100%',
            maxWidth: '360px',
            padding: '40px clamp(20px, 6vw, 34px)',
            animation: 'gxCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <CornerBracket pos="tl" />
          <CornerBracket pos="tr" />
          <CornerBracket pos="bl" />
          <CornerBracket pos="br" />

          <div
            className="flex items-center justify-center gx-mono"
            data-gx-static-visible
            style={{ gap: '8px', marginBottom: '22px', animation: 'gxKickerIn 0.5s cubic-bezier(0.16,1,0.3,1) 0s both' }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: bootError ? '#E06C6C' : '#6C7FE0',
                boxShadow: bootError
                  ? '0 0 6px 1px rgba(224,108,108,0.8)'
                  : '0 0 6px 1px rgba(108,127,224,0.8)',
                animation: 'gxDotPulse 2.4s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: '10px', letterSpacing: '0.28em', color: 'rgba(237,234,247,0.4)' }}>
              GATENEXA / AI ENGINE
            </span>
          </div>

          <div
            style={{
              height: '1px',
              background: 'rgba(237,234,247,0.1)',
              transformOrigin: 'center',
              animation: 'gxRuleGrow 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both',
              marginBottom: '26px',
            }}
          />

          <Wordmark />

          <div
            style={{
              height: '1px',
              background: 'rgba(237,234,247,0.1)',
              transformOrigin: 'center',
              animation: 'gxRuleGrow 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both',
              marginTop: '26px',
              marginBottom: '20px',
            }}
          />

          {bootError ? (
            <div role="alert" data-gx-static-visible style={{ animation: 'gxRowIn 0.4s ease-out 0.5s both' }}>
              <div
                className="gx-mono"
                style={{ fontSize: '12px', color: 'rgba(237,234,247,0.7)', lineHeight: 1.5, marginBottom: '16px' }}
              >
                {bootError}
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="gx-mono"
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: 'rgba(124,92,252,0.12)',
                    border: '1px solid rgba(124,92,252,0.4)',
                    borderRadius: '4px',
                    color: '#B7A8FF',
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="gx-mono" style={{ fontSize: '11px', letterSpacing: '0.03em' }}>
                {[
                  { label: 'SESSION', value: 'GATE 2027 · CSE', delay: 0.5 },
                  { label: 'ENGINE', value: 'AI Mentor · Online', delay: 0.62 },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                    style={{ padding: '5px 0', animation: `gxRowIn 0.4s ease-out ${row.delay}s both` }}
                  >
                    <span style={{ color: 'rgba(237,234,247,0.34)', letterSpacing: '0.12em' }}>{row.label}</span>
                    <span style={{ color: 'rgba(237,234,247,0.82)' }}>{row.value}</span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between"
                  style={{ padding: '5px 0', minHeight: '20px', animation: 'gxRowIn 0.4s ease-out 0.74s both' }}
                >
                  <span style={{ color: 'rgba(237,234,247,0.34)', letterSpacing: '0.12em' }}>STATUS</span>
                  <span
                    style={{
                      color: '#6C7FE0',
                      marginLeft: '16px',
                      textAlign: 'right',
                      transition: 'opacity 200ms ease',
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>

              {/* barcode-style progress — reflects real progress; bars transition
                  color on change instead of a JS-driven animation loop */}
              <div
                className="flex items-end justify-between"
                style={{ marginTop: '22px', height: '18px', animation: 'gxRowIn 0.4s ease-out 0.86s both' }}
              >
                {Array.from({ length: TOTAL_BARS }).map((_, i) => {
                  const lit = i < litBars;
                  const h = 40 + ((i * 37) % 60);
                  return (
                    <div
                      key={i}
                      style={{
                        width: '2px',
                        height: `${h}%`,
                        borderRadius: '1px',
                        background: lit ? 'linear-gradient(180deg, #7C5CFC, #6C7FE0)' : 'rgba(237,234,247,0.1)',
                        boxShadow: lit && i === litBars - 1 ? '0 0 6px 1px rgba(108,127,224,0.8)' : 'none',
                        transition: 'background 300ms ease, box-shadow 300ms ease',
                      }}
                    />
                  );
                })}
              </div>
              <div
                className="gx-mono flex items-center justify-between"
                style={{
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(237,234,247,0.32)',
                  letterSpacing: '0.05em',
                  animation: 'gxRowIn 0.4s ease-out 0.9s both',
                }}
              >
                <span>SYSTEM BOOT</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'rgba(108,127,224,0.85)' }}>
                  {Math.round(clampedProgress)}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
