import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TARGET = 2;
const BASE_URL = window.location.origin;

export default function ReferralCard() {
  const { referralCode, referralCount, referralProgress } = useAuth();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const referralLink = referralCode ? `${BASE_URL}/ref/${referralCode}` : '';

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const shareWhatsApp = () => {
    if (!referralLink) return;
    window.open(`https://wa.me/?text=${encodeURIComponent('Join me on GateNexa for GATE 2027 preparation! Use my referral link: ' + referralLink)}`, '_blank');
  };

  if (!referralCode) return null;

  return (
    <div className="rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01]" style={{ background: 'rgba(18, 24, 40, 0.7)', border: '1px solid rgba(139, 92, 246, 0.2)' }} onClick={() => navigate('/referral')}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Referral Program</h3>
        {referralCount >= TARGET && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>Unlocked</span>
        )}
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/50 mb-1">
          <span>Progress</span>
          <span>{referralCount} / {TARGET}</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, referralProgress)}%`, background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)' }} />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-xs text-white/40 font-mono truncate">{referralCode}</span>
          <button onClick={(e) => { e.stopPropagation(); copyLink(); }} className="shrink-0 text-purple-400 hover:text-purple-300 text-xs font-medium">{copied ? 'Copied' : 'Copy'}</button>
        </div>
        <button onClick={(e) => { e.stopPropagation(); shareWhatsApp(); }} className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium text-white transition-all hover:scale-[1.05]" style={{ background: '#25D366' }}>Share</button>
      </div>
    </div>
  );
}
