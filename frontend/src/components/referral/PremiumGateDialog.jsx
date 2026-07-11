import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PremiumGateDialog({ title, message, onClose }) {
  const { setShowReferralModal } = useAuth();
  const navigate = useNavigate();

  const handleInvite = () => {
    setShowReferralModal(false);
    navigate('/referral');
  };

  const handleClose = () => {
    setShowReferralModal(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl p-8 max-w-sm w-full text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(18, 24, 40, 0.95), rgba(5, 8, 22, 0.95))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 60%)' }} />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-purple-400"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{title || 'Free Limit Reached'}</h2>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            {message || "You've used today's 5 free AI questions.\n\nInvite 2 friends to unlock unlimited AI access."}
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={handleInvite} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
              Invite Friends
            </button>
            <button onClick={handleClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/60 transition-all duration-200 hover:text-white/80" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
