import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { subscribeConnectionState, recordSlowApi, recordFailedApi, recordChunkEvent } from '../../services/connectionHealth';

export default function ConnectionNotice() {
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();
  const dismissTimer = useRef(null);

  useEffect(() => {
    const handleSlowApi = (e) => {
      const { url, latencyMs } = e.detail || {};
      recordSlowApi(url, latencyMs);
    };
    const handleFailedApi = (e) => {
      const { url, status } = e.detail || {};
      recordFailedApi(url, status);
    };
    const handleSlowChunk = () => recordChunkEvent('slow_chunk');
    const handleFailedChunk = () => recordChunkEvent('failed_chunk');

    window.addEventListener('gatenexa:slow-api', handleSlowApi);
    window.addEventListener('gatenexa:failed-api', handleFailedApi);
    window.addEventListener('gatenexa:slow-chunk', handleSlowChunk);
    window.addEventListener('gatenexa:failed-chunk', handleFailedChunk);
    return () => {
      window.removeEventListener('gatenexa:slow-api', handleSlowApi);
      window.removeEventListener('gatenexa:failed-api', handleFailedApi);
      window.removeEventListener('gatenexa:slow-chunk', handleSlowChunk);
      window.removeEventListener('gatenexa:failed-chunk', handleFailedChunk);
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeConnectionState((payload) => {
      if (payload.severity === 'none' && payload.reason === 'recovered') {
        setNotice({ type: 'recovered', title: payload.title, message: payload.message, action: null });
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        dismissTimer.current = setTimeout(() => setNotice(null), 4000);
        return;
      }
      setNotice({
        type: payload.severity === 'offline' ? 'offline' : payload.severity === 'unavailable' ? 'failed' : 'slow',
        severity: payload.severity,
        title: payload.title,
        message: payload.message,
        action: payload.action,
      });
    });
    return () => { unsub(); if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, []);

  const handleAction = useCallback(() => {
    const s = notice?.severity;
    setNotice(null);
    // Offline / Retry -> attempt a reload to re-establish connectivity.
    if (s === 'offline' || notice?.action === 'Retry') {
      window.location.reload();
      return;
    }
    // Troubleshoot / any other action -> open the real Connection Center,
    // which re-runs the actual diagnostics checks and shows results.
    navigate('/connection-diagnostics');
  }, [notice, navigate]);

  const handleDismiss = useCallback(() => setNotice(null), []);

  if (!notice) return null;

  const isRecovered = notice.type === 'recovered';
  const dotColor = isRecovered ? 'bg-emerald-400' : notice.type === 'failed' || notice.type === 'offline' ? 'bg-red-400' : 'bg-amber-400';
  const dotShadow = isRecovered ? 'rgba(16,185,129,0.6)' : notice.type === 'failed' || notice.type === 'offline' ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)';

  const content = (
    <div
      role={isRecovered ? 'status' : 'alert'}
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-40 w-[min(420px,calc(100vw-16px))] rounded-2xl px-4 py-3 flex flex-col gap-2"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 60px)',
        background: isRecovered
          ? 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)',
        border: isRecovered ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(139,92,246,0.15)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.08)',
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="absolute top-1.5 right-1.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 text-[11px]"
      >
        ✕
      </button>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} style={{ boxShadow: `0 0 6px ${dotShadow}` }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">{isRecovered ? 'Recovered' : 'Connection'}</span>
      </div>
      <div className="pr-6">
        <div className="text-[13px] font-bold text-white leading-tight">{notice.title}</div>
        <div className="text-[11px] text-white/55 mt-0.5 leading-relaxed">{notice.message}</div>
      </div>
      <div className="flex gap-2">
        {notice.action && (
          <button onClick={handleAction} className="flex-1 py-2 rounded-xl text-[11px] font-bold text-slate-900" style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A78BFA 50%, #C084FC 100%)' }}>
            {notice.action}
          </button>
        )}
        <button onClick={handleDismiss} className={`${notice.action ? 'flex-1' : 'w-full'} py-2 rounded-xl text-[11px] font-semibold bg-white/[0.06] border border-white/[0.08] text-white/70 hover:bg-white/[0.08]`}>
          {isRecovered ? 'Dismiss' : 'Dismiss'}
        </button>
      </div>
    </div>
  );
  return createPortal(content, document.body);
}
