export const TESTIMONIALS = [
  {
    quote: 'Helped me stay consistent with daily study targets. The revision reminders are a game changer.',
    author: 'Rahul S.',
    role: 'GATE 2026 Aspirant',
    rating: 5,
  },
  {
    quote: 'The PYQ tracker and analytics showed me exactly where I was weak. Improved my score by 15 marks.',
    author: 'Priya M.',
    role: 'AIR 287, GATE 2025',
    rating: 5,
  },
  {
    quote: 'Finally a platform that organizes everything. No more hunting for notes across 10 Telegram groups.',
    author: 'Arun K.',
    role: 'M.Tech @ IIT Bombay (2024)',
    rating: 5,
  },
  {
    quote: 'The AI mentor recommendations were surprisingly accurate. Felt like having a personal coach.',
    author: 'Neha G.',
    role: 'GATE 2026 Aspirant',
    rating: 4,
  },
];

export default function TestimonialsSection() {
  const avgRating = (TESTIMONIALS.reduce((s, t) => s + t.rating, 0) / TESTIMONIALS.length).toFixed(1);

  return (
    <div>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1 text-lg mb-2">
          {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
        </div>
        <div className="text-2xl font-bold text-white">{avgRating} / 5</div>
        <p className="text-xs text-gray-500 mt-1">What aspirants say about GateApex</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.author}
            className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-xs" style={{ color: i < t.rating ? '#F59E0B' : '#374151' }}>★</span>
              ))}
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">"{t.quote}"</p>
            <div>
              <span className="text-xs font-semibold text-white">{t.author}</span>
              <span className="text-[10px] text-gray-500 block">{t.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

