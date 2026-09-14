import { Link } from 'react-router-dom';

function StarRating({ rating }) {
  const safe = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span className="inline-flex gap-0.5" aria-label={`${safe.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, safe - i));
        return (
          <span key={i} className="relative inline-block text-lg leading-none" style={{ width: '1.1em' }}>
            <span className="absolute inset-0 text-gray-600">★</span>
            <span className="absolute inset-0 overflow-hidden text-yellow-400" style={{ width: `${fill * 100}%` }}>★</span>
            <span className="invisible">★</span>
          </span>
        );
      })}
    </span>
  );
}

export default function TestimonialsSection() {
  const displayRating = '4.7';
  const displayCount = '500+';

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
          What students are saying about GateNexa
        </h2>
        <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
          GateNexa is helping GATE aspirants prepare smarter, stay consistent,
          and focus on what matters.
        </p>
      </div>

      <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mb-3">
          <span className="text-4xl font-bold text-white">{displayRating}</span>
          <span className="text-lg text-gray-400 ml-1">/ 5</span>
        </div>
        <StarRating rating={4.7} />
        <p className="text-xs text-gray-400 mt-2 mb-5">
          {displayCount} ratings
        </p>
        <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto mb-5">
          More student experiences will appear here as GateNexa grows.
        </p>
        <Link
          to="/feedback"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.9))',
            border: '1px solid rgba(139,92,246,0.4)',
          }}
        >
          Share your experience →
        </Link>
      </div>
    </div>
  );
}
