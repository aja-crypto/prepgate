import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: '🤖', name: 'Unlimited AI Chat', desc: 'Ask anything without daily limits' },
  { icon: '📊', name: 'Advanced Analytics', desc: 'Deep performance insights & trends' },
  { icon: '🎯', name: 'AIR Predictor Pro', desc: 'More accurate rank predictions' },
  { icon: '📝', name: 'Custom Mock Tests', desc: 'Create subject/topic-specific mocks' },
  { icon: '🔐', name: 'Gate Vault', desc: 'Curated practice from topper notes' },
  { icon: '⭐', name: 'Early Access', desc: 'Be first to try new features' },
];

export default function PremiumPage() {
  const { isPremium, referralProgress, referralCount } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-purple-400"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 className="text-xl font-bold text-text">GateNexa Premium</h1>
          <p className="text-sm text-text3 mt-1">{isPremium ? 'You have full access' : 'Unlock the full experience'}</p>
        </div>

        {isPremium ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(34,211,238,0.08))', border: '1px solid rgba(139,92,246,0.2)' }}>
            <span className="text-3xl">⭐</span>
            <p className="text-sm font-semibold text-text mt-2">Premium Active</p>
            <p className="text-xs text-text3 mt-1">All features unlocked. Thank you for being a premium member!</p>
          </div>
        ) : (
          <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-semibold text-text">Get Premium Free</p>
            <p className="text-xs text-text3 mt-1">Invite friends to unlock premium features</p>
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-xs text-text3">Progress: {Math.min(100, Math.round(referralProgress))}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full max-w-xs mx-auto" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, referralProgress)}%`, background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)', boxShadow: '0 0 8px rgba(139,92,246,0.3)' }} />
              </div>
            </div>
            <button onClick={() => navigate('/referral')} className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
              Invite Friends
            </button>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-bold text-text mb-4">Premium Features</h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.name} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-lg">{f.icon}</span>
                <div className="text-xs font-semibold text-text mt-2">{f.name}</div>
                <div className="text-[10px] text-text3 mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
