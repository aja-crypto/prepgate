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
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Help & Support</h1>
        <p className="text-text3 mt-1">Everything you need to know about using GateNexa.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Frequently Asked Questions</h2>
        {FAQ.map((item, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text mb-2">{item.q}</h3>
            <p className="text-sm text-text2 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text">Contact Support</h2>
        <p className="text-sm text-text2">Still need help? Reach out to us:</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href="mailto:support@GateNexa.dev" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-all">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
            Email Support
          </a>
          <Link to="/feedback" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-border text-text2 text-sm font-semibold hover:bg-white/10 transition-all">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" /></svg>
            Send Feedback
          </Link>
        </div>
      </div>
    </div>
  );
}

