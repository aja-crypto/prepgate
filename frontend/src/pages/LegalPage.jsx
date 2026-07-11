import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PAGES = {
  'privacy-policy': {
    title: 'Privacy Policy',
    updated: 'July 8, 2026',
    sections: [
      { h: 'Information We Collect', c: 'We collect information you provide when creating an account: name, email address, academic details (target year, subjects), and study progress data. We also collect usage data such as page views, feature interactions, and AI chat queries to improve our services.' },
      { h: 'How We Use Your Data', c: 'Your data is used to personalize your GATE preparation experience — generating study plans, predicting college admissions, tracking progress, and providing AI-powered recommendations. We do not sell your personal data to third parties.' },
      { h: 'Authentication', c: 'We use JWT-based authentication to secure your account. Passwords are hashed using bcrypt before storage. Google Sign-In is available as an alternative login method.' },
      { h: 'AI Usage', c: 'AI chat conversations are processed to generate responses. Conversations may be stored to improve response quality. You can delete your chat history at any time from the AI Assistant settings.' },
      { h: 'Cookies', c: 'We use essential cookies for authentication and session management. Preference cookies store your theme selection and dashboard layout choices. Analytics cookies help us understand feature usage. See our Cookie Policy for details.' },
      { h: 'Data Retention', c: 'Your data is retained for as long as your account is active. You can request account deletion at any time from Settings. After deletion, data is permanently removed within 30 days.' },
      { h: 'Your Rights', c: 'You have the right to access, correct, or delete your personal data. You can export your data from Settings. For privacy-related requests, contact privacy@gatenexa.app.' },
      { h: 'Third-Party Services', c: 'We use OpenRouter for AI model access, MongoDB for database storage, and Cloudinary for file storage. Each provider has its own privacy policy governing data handling.' },
    ],
  },
  'terms-of-service': {
    title: 'Terms of Service',
    updated: 'July 8, 2026',
    sections: [
      { h: 'Acceptance of Terms', c: 'By creating a GateNexa account, you agree to these Terms of Service. If you do not agree, do not use the platform. We may update these terms; continued use after changes constitutes acceptance.' },
      { h: 'User Responsibilities', c: 'You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your account, use the platform for any illegal purpose, or attempt to circumvent security measures.' },
      { h: 'Acceptable Use', c: 'GateNexa is designed for GATE preparation and educational purposes. You agree not to abuse the AI systems, submit offensive content, upload malicious files, or attempt to scrape or overload the platform.' },
      { h: 'Account Security', c: 'You are responsible for all activity under your account. Notify us immediately at security@gatenexa.app if you suspect unauthorized access. We reserve the right to suspend accounts violating these terms.' },
      { h: 'AI Prediction Disclaimer', c: 'College predictions, AIR estimates, and recommendations provided by GateNexa are for informational and planning purposes only. They are estimates based on historical data and should not be treated as guaranteed outcomes. Admission decisions are made solely by official counselling authorities (CCMT, COAP, JoSAA, etc.).' },
      { h: 'Intellectual Property', c: 'The GateNexa platform, including its design, code, and content, is owned by GateNexa. Users retain ownership of their study notes and uploaded content. You may not copy, modify, or distribute the platform without permission.' },
      { h: 'Limitation of Liability', c: 'GateNexa provides the platform "as is" without warranties of accuracy or availability. We are not liable for any damages arising from the use of our services, including incorrect predictions or service interruptions.' },
      { h: 'Termination', c: 'We reserve the right to terminate accounts that violate these terms. Users may delete their account at any time from Settings. Upon termination, your data will be deleted within 30 days.' },
    ],
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    updated: 'July 8, 2026',
    sections: [
      { h: 'What Are Cookies', c: 'Cookies are small text files stored on your device by your web browser. They help websites remember your preferences and improve your browsing experience.' },
      { h: 'Essential Cookies', c: 'These cookies are necessary for the platform to function. They enable core features like authentication, session management, and security. Without these cookies, the platform cannot operate properly.' },
      { h: 'Authentication Cookies', c: 'We use JWT tokens stored in localStorage to keep you logged in across sessions. These tokens expire after a set period and are automatically refreshed.' },
      { h: 'Preference Cookies', c: 'These cookies remember your settings — dark/light theme, accent color, dashboard layout, and AI assistant preferences. This ensures a consistent experience across visits.' },
      { h: 'Analytics Cookies', c: 'We use analytics to understand how users interact with the platform. This helps us improve features and identify issues. No personally identifiable information is collected through analytics.' },
      { h: 'Managing Cookies', c: 'You can control cookies through your browser settings. Disabling essential cookies may prevent the platform from functioning correctly. You can clear stored data at any time from your browser preferences.' },
    ],
  },
  'disclaimer': {
    title: 'Disclaimer',
    updated: 'July 8, 2026',
    sections: [
      { h: 'Educational Guidance Only', c: 'GateNexa provides educational guidance and planning tools for GATE preparation. All content, predictions, and recommendations are for informational purposes only and should not be considered as professional or legal advice.' },
      { h: 'College Predictions', c: 'College admission predictions, AIR estimates, and probability scores are based on historical cutoff data from CCMT, COAP, and other sources. These predictions are estimates and may not reflect actual admission outcomes. Admission decisions are made by official counselling authorities.' },
      { h: 'Verify Official Sources', c: 'Users should always verify admission-related information using official counselling portals: CCMT (ccmt.nic.in), COAP (coap.iitd.ac.in), JoSAA (josaa.nic.in), and individual institute websites. GateNexa is not affiliated with any of these official bodies.' },
      { h: 'AI Responses', c: 'Responses from the AI Assistant are generated by language models and are for informational purposes. They should not be treated as official admission advice, academic guidance, or legal counsel. Always verify critical information with authoritative sources.' },
      { h: 'Third-Party Content', c: 'Notes and resources available on the platform may include content sourced from public channels. We do not claim ownership of third-party materials. If you believe your copyrighted content has been included, please contact us for removal.' },
      { h: 'No Guarantee', c: 'GateNexa makes no guarantees regarding GATE exam scores, college admissions, rank predictions, or placement outcomes. Individual results depend on numerous factors including preparation quality, exam performance, and counselling processes.' },
    ],
  },
};

const LEGAL_LINKS = [
  { label: 'Privacy Policy', to: '/legal/privacy-policy' },
  { label: 'Terms of Service', to: '/legal/terms-of-service' },
  { label: 'Cookie Policy', to: '/legal/cookie-policy' },
  { label: 'Disclaimer', to: '/legal/disclaimer' },
];

export default function LegalPage() {
  const { pageId } = useParams();
  useEffect(() => { const t = Date.now(); console.log('[Trace] LegalPage MOUNTED — pageId:', pageId, 'at', t); return () => console.log('[Trace] LegalPage UNMOUNTED — pageId:', pageId, 'after', Date.now() - t, 'ms'); }, [pageId]);
  const page = PAGES[pageId];
  const currentIdx = LEGAL_LINKS.findIndex(l => l.to === `/legal/${pageId}`);
  if (!page) return <div className="min-h-screen flex items-center justify-center text-slate-400">Page not found.</div>;

  return (
    <div className="min-h-screen" style={{ background: '#070B1A' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Link to="/" className="text-xs text-purple-400 hover:text-purple-300 mb-6 inline-block transition-colors">{'\u2190'} Back to Home</Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{page.title}</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: {page.updated}</p>

          <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-white/5">
            {LEGAL_LINKS.map((l, i) => (
              <Link key={l.to} to={l.to}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={l.to === `/legal/${pageId}`
                  ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#C4B5FD' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94A3B8' }}>
                {l.label}
              </Link>
            ))}
          </div>
          
          <div className="space-y-5">
            {page.sections.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="rounded-2xl p-6 sm:p-7"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(139,92,246,0.08)' }}
              >
                <h2 className="text-base sm:text-lg font-bold text-white mb-3">{s.h}</h2>
                <p className="text-sm sm:text-base text-slate-400 leading-[1.75]">{s.c}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
            <div>
              {currentIdx > 0 && (
                <Link to={LEGAL_LINKS[currentIdx - 1].to} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  {'\u2190'} {LEGAL_LINKS[currentIdx - 1].label}
                </Link>
              )}
            </div>
            <div>
              {currentIdx < LEGAL_LINKS.length - 1 && (
                <Link to={LEGAL_LINKS[currentIdx + 1].to} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  {LEGAL_LINKS[currentIdx + 1].label} {'\u2192'}
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}