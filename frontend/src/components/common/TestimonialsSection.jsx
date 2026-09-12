import { Link } from 'react-router-dom';

// Trust/UX state: GateNexa has no public, consented user reviews to display yet.
// Do NOT add hardcoded names, quotes, ratings, ranks, or colleges here.
// This section intentionally renders an honest empty/early-feedback state.

export default function TestimonialsSection() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
          What students are saying about GateNexa
        </h2>
        <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
          GateNexa is still growing. Real student feedback will appear here as more aspirants use the platform.
        </p>
      </div>

      <div
        className="rounded-2xl p-8 sm:p-10 text-center transition-all duration-300"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(59,130,246,0.08))',
            border: '1px solid rgba(139,92,246,0.25)',
          }}
          aria-hidden="true"
        >
          💬
        </div>
        <p className="text-sm font-semibold text-white mb-1">No public reviews yet</p>
        <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto mb-5">
          We only show feedback shared by real GateNexa users — nothing invented, nothing exaggerated.
        </p>
        <Link
          to="/feedback"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.9))',
            border: '1px solid rgba(139,92,246,0.4)',
          }}
        >
          Used GateNexa? Share your experience →
        </Link>
      </div>
    </div>
  );
}


