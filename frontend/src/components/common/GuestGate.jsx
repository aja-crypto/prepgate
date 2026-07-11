import { useNavigate } from 'react-router-dom';

const MESSAGES = {
  predictor: 'Sign in to unlock personalized AI predictions and continue your preparation.',
  ai: 'Sign in to ask AI questions and get personalized study assistance.',
  default: 'Sign in to unlock personalized AI predictions and continue your preparation.',
};

export default function GuestGate({ children, context = 'default' }) {
  const navigate = useNavigate();
  const message = MESSAGES[context] || MESSAGES.default;
  return (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(5, 8, 22, 0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="rounded-2xl p-8 max-w-md mx-4 text-center" style={{ background: 'rgba(18, 24, 40, 0.9)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-purple-400"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-white/80 text-sm mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>Sign In</button>
            <button onClick={() => navigate('/register')} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white/80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}>Create Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
