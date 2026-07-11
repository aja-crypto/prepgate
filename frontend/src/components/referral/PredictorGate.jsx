import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const BASE_URL = window.location.origin;

export default function PredictorGate({ children, isUnlocked, referralCode }) {
  const [copied, setCopied] = useState(false);
  const { user, referralCount, referralProgress } = useAuth();
  if (user?.role === 'owner') return children;
  const referralLink = referralCode ? `${BASE_URL}/ref/${referralCode}` : '';
  const progress = referralProgress || { invited: 0, target: 2 };

  useEffect(() => {
    if (isUnlocked) return;
    try { window.gtag?.('event', 'predictor_gate_shown'); } catch {}
  }, [isUnlocked]);

  const copyLink = () => {
    if (!referralLink) { toast.error('Referral link not available'); return; }
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success('Referral link copied!');
      try { window.gtag?.('event', 'predictor_gate_copy'); } catch {}
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error('Could not copy. Try selecting the link manually.'));
  };

  const shareWhatsApp = () => {
    if (!referralLink) { toast.error('Referral link not available'); return; }
    const text = encodeURIComponent(`I'm preparing for GATE 2027 with GateNexa. Join me and get AI-powered predictions, mock tests, and study plans! 🚀\n\n${referralLink}`);
    const url = `https://wa.me/?text=${text}`;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) toast.error('Popup blocked. Copy the link and share manually.');
    else { try { window.gtag?.('event', 'predictor_gate_whatsapp'); } catch {} }
  };

  const shareTwitter = () => {
    if (!referralLink) { toast.error('Referral link not available'); return; }
    const text = encodeURIComponent(`I'm preparing for GATE 2027 with GateNexa! AI predictions, mock tests, and more.\n\n${referralLink}`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) toast.error('Popup blocked. Copy the link and share manually.');
    else { try { window.gtag?.('event', 'predictor_gate_twitter'); } catch {} }
  };

  if (isUnlocked) return children;

  return (
    <div className="relative">
      <div className="filter blur-md pointer-events-none select-none">{children}</div>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center z-10 p-3 sm:p-4"
          style={{ background: 'rgba(5, 8, 22, 0.6)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="rounded-2xl p-6 sm:p-8 w-full max-w-sm mx-2 text-center relative overflow-hidden"
            style={{ background: 'rgba(18, 24, 40, 0.97)', border: '1px solid rgba(139, 92, 246, 0.3)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 60%)' }} />
            <div className="relative z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))' }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/></svg>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Unlock Your Complete GATE Prediction</h3>
              <p className="text-white/50 text-xs sm:text-sm mb-4 leading-relaxed">
                Invite <strong className="text-purple-400">{progress.target - progress.invited} friends</strong> to instantly unlock:
              </p>
              <div className="grid grid-cols-2 gap-2 mb-5 text-left">
                {[
                  'AIR Prediction', 'Admission Chances',
                  'College Recommender', 'Personalized Roadmap',
                ].map(item => (
                  <div key={item} className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/60">
                    <span className="text-purple-400 shrink-0">✦</span> {item}
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between text-[11px] text-white/50 mb-1.5">
                  <span>Invited</span>
                  <span className="text-purple-400 font-medium">{progress.invited} / {progress.target}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.invited / progress.target) * 100}%` }}
                    className="h-full rounded-full transition-all"
                    style={{ background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)' }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button onClick={copyLink} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  {copied ? '✓ Copied!' : 'Copy Invite Link'}
                </button>
                <button onClick={shareWhatsApp} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2" style={{ background: '#25D366' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Share on WhatsApp
                </button>
                <button onClick={shareTwitter} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2" style={{ background: '#1DA1F2' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Share on X (Twitter)
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  No payment required
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Unlock instantly
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
