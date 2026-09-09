export default function GateNexaLoader({ progress, status }) {
  const pct = Math.round(progress);
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg mesh-bg">
      <div className="text-center max-w-sm w-full mx-auto px-8 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8"><path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="text-base font-bold text-text tracking-tight">GateNexa</div>
        <div className="text-[10px] tracking-[0.14em] uppercase text-text3 font-semibold mt-0.5">GATE 2027 Intelligence</div>
        <div className="mt-8 h-1.5 bg-bg-3 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-text3 font-mono">{pct}%</span>
          <span className="text-[11px] text-text3 truncate ml-4">{status}</span>
        </div>
      </div>
    </div>
  );
}
