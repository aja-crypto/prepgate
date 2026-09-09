import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { subscribeConnectionEvent } from '../../utils/connectionEvents';
import { useDiagnostics } from '../../context/DiagnosticsContext';

export default function ConnectionNotice() {
  const [notice, setNotice] = useState(null);
  const { openDiagnostics } = useDiagnostics();

  useEffect(() => {
    return subscribeConnectionEvent((payload) => {
      if (payload.type === 'slow_api') {
        setNotice({ title: 'We noticed buffering', message: `GateNexa is taking longer than usual${payload.latency ? ` (${(payload.latency/1000).toFixed(1)}s)` : ''}. Run a quick connection test so we can adjust for you.`, action: 'Run diagnostics' });
      } else if (payload.type === 'failed_api') {
        setNotice({ title: 'Connection issue', message: 'Something is preventing GateNexa from loading correctly.', action: 'Run diagnostics' });
      } else if (payload.type === 'slow_chunk') {
        setNotice({ title: 'Loading is slow', message: 'GateNexa is taking longer than usual to load. Check your connection.', action: 'Check connection' });
      } else if (payload.type === 'failed_chunk') {
        setNotice({ title: 'Failed to load', message: 'A GateNexa module failed to load. Check connection and retry.', action: 'Run diagnostics' });
      }
    });
  }, []);

  if (!notice) return null;

  const content = (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(420px,calc(100vw-16px))] rounded-2xl px-5 py-4 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)', border: '1px solid rgba(139,92,246,0.18)', boxShadow: '0 12px 40px rgba(0,0,0,0.45), 0 0 24px rgba(139,92,246,0.12)' }}>
      <button onClick={() => setNotice(null)} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 text-xs">✕</button>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)] shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Connection diagnostics</span>
      </div>
      <div className="pr-6">
        <div className="text-[15px] font-bold text-white leading-tight">{notice.title}</div>
        <div className="text-xs text-white/60 mt-1 leading-relaxed">{notice.message}</div>
      </div>
      <div className="flex gap-2.5">
        <button onClick={() => { setNotice(null); openDiagnostics(); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-900" style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A78BFA 50%, #C084FC 100%)' }}>{notice.action}</button>
        <button onClick={() => setNotice(null)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.06] border border-white/[0.10] text-white/80 hover:bg-white/[0.08]">Not now</button>
      </div>
    </div>
  );
  return createPortal(content, document.body);
}
