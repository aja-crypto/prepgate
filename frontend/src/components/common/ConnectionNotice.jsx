import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useDiagnostics } from '../../context/DiagnosticsContext';

export default function ConnectionNotice() {
  const [notice, setNotice] = useState(null);
  const { openDiagnostics } = useDiagnostics();
  const navigate = useNavigate();

  useEffect(() => {
    let lastEmit = 0;
    const THROTTLE = 60000;

    const handleSlowApi = (e) => {
      const now = Date.now();
      if (now - lastEmit < THROTTLE) return;
      lastEmit = now;
      const { url, latencyMs } = e.detail || {};
      setNotice({
        type: 'slow',
        title: 'GateNexa is responding slowly',
        message: `API response took ${(latencyMs / 1000).toFixed(1)}s${url ? ` (${url})` : ''}.`,
        action: 'Check Connection',
      });
    };

    const handleFailedApi = (e) => {
      const now = Date.now();
      if (now - lastEmit < THROTTLE) return;
      lastEmit = now;
      const { status } = e.detail || {};
      setNotice({
        type: 'failed',
        title: 'Something is preventing GateNexa from loading correctly',
        message: status ? `Server returned HTTP ${status}.` : 'A request failed.',
        action: 'Run Diagnostics',
      });
    };

    const handleSlowChunk = () => {
      const now = Date.now();
      if (now - lastEmit < THROTTLE) return;
      lastEmit = now;
      setNotice({
        type: 'slow',
        title: 'Loading is slow',
        message: 'GateNexa is taking longer than usual to load.',
        action: 'Check Connection',
      });
    };

    const handleFailedChunk = () => {
      const now = Date.now();
      if (now - lastEmit < THROTTLE) return;
      lastEmit = now;
      setNotice({
        type: 'failed',
        title: 'Failed to load',
        message: 'A GateNexa module failed to load.',
        action: 'Run Diagnostics',
      });
    };

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

  const handleAction = useCallback(() => {
    setNotice(null);
    if (notice?.type === 'failed') {
      openDiagnostics();
    } else {
      navigate('/connection-diagnostics');
    }
  }, [notice, openDiagnostics, navigate]);

  if (!notice) return null;

  const content = (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(400px,calc(100vw-16px))] rounded-2xl px-4 py-3 flex flex-col gap-2"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)', border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.08)' }}>
      <button onClick={() => setNotice(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 text-[10px]">✕</button>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${notice.type === 'failed' ? 'bg-red-400' : 'bg-amber-400'}`}
          style={{ boxShadow: `0 0 6px ${notice.type === 'failed' ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)'}` }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">Connection</span>
      </div>
      <div className="pr-5">
        <div className="text-[13px] font-bold text-white leading-tight">{notice.title}</div>
        <div className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{notice.message}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleAction} className="flex-1 py-2 rounded-xl text-[11px] font-bold text-slate-900"
          style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A78BFA 50%, #C084FC 100%)' }}>{notice.action}</button>
        <button onClick={() => setNotice(null)} className="flex-1 py-2 rounded-xl text-[11px] font-semibold bg-white/[0.06] border border-white/[0.08] text-white/70 hover:bg-white/[0.08]">Dismiss</button>
      </div>
    </div>
  );
  return createPortal(content, document.body);
}
