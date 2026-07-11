import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const FAQ = [
  { q: 'How do I track my GATE preparation?', a: 'Go to Dashboard → Topics to mark syllabus topics as completed. Your progress updates automatically.' },
  { q: 'How do I practice previous year questions?', a: 'Navigate to PYQ Practice → select subject/topic → filter by year/difficulty → start solving.' },
  { q: 'How do mock tests work?', a: 'Go to Mock Tests → pick a test → start with timer → submit → review detailed analysis.' },
  { q: 'Can I use GateNexa on my phone?', a: 'Yes. GateNexa is fully responsive and works on any device with a browser.' },
  { q: 'How does the AI Mentor work?', a: 'Navigate to GateNexa AI → ask questions about GATE topics, get personalized study advice.' },
  { q: 'How do I report a bug or request a feature?', a: 'Go to Profile dropdown → Feedback → describe your issue or suggestion.' },
];

export default function HelpPage() {
  useEffect(() => { const t = Date.now(); console.log('[Trace] HelpPage MOUNTED at', t); return () => console.log('[Trace] HelpPage UNMOUNTED after', Date.now() - t, 'ms'); }, []);
  return (
    <div className="min-h-screen" style={{ background: '#070B1A' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
        <Link to="/" className="text-xs text-purple-400 hover:text-purple-300 mb-6 inline-block transition-colors">← Back to Home</Link>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Help & Support</h1>
          <p className="text-sm text-slate-400">Everything you need to know about using GateNexa.</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.08)' }}>
              <h3 className="text-sm font-bold text-white mb-2">{item.q}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.08)' }}>
          <h2 className="text-lg font-semibold text-white">Contact Support</h2>
          <p className="text-sm text-slate-400">Still need help? Reach out to us:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="mailto:support@GateNexa.dev" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA' }}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
              Email Support
            </a>
            <Link to="/feedback" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" /></svg>
              Send Feedback
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

