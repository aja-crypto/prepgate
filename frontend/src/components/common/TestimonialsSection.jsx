import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3 && rating - full < 0.8;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} className="text-yellow-400 text-lg">★</span>
      ))}
      {hasHalf && <span className="text-yellow-400 text-lg">★</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} className="text-gray-600 text-lg">★</span>
      ))}
    </span>
  );
}

export default function TestimonialsSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/feedback/public-stats');
        const data = await res.json();
        if (!cancelled && data.success) {
          setStats(data.data);
        }
      } catch {
        // Silently fail — keep honest empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  const hasRatings = stats && stats.ratingCount > 0 && stats.averageRating !== null;
  const ratingDisplay = hasRatings ? stats.averageRating.toFixed(1) : null;
  const countDisplay = hasRatings
    ? stats.ratingCount >= 500
      ? `${Math.floor(stats.ratingCount / 100) * 100}+`
      : String(stats.ratingCount)
    : null;

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
          What students are saying about GateNexa
        </h2>
        <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
          {hasRatings
            ? 'Real feedback from GATE aspirants using GateNexa.'
            : 'GateNexa is still growing. Real student feedback will appear here as more aspirants use the platform.'}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      ) : hasRatings ? (
        <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mb-3">
            <span className="text-4xl font-bold text-white">{ratingDisplay}</span>
            <span className="text-lg text-gray-400 ml-1">/ 5</span>
          </div>
          <StarRating rating={stats.averageRating} />
          <p className="text-xs text-gray-400 mt-2 mb-5">
            Based on {countDisplay} rating{stats.ratingCount !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto mb-5">
            Real feedback from GATE aspirants will appear here as users choose to share their experience.
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
      ) : (
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
      )}
    </div>
  );
}
