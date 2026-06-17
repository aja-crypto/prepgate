// Premium registration page
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/common/PasswordInput';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import Icon from '../components/ui/Icon';
import GlassCard from '../components/ui/GlassCard';
import { BRAND } from '../design/tokens';
import { getApiErrorMessage } from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, googleLogin, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleDemoMode = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill all fields');
    if (form.password.length < 8) return toast.error('Password must be 8+ characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="" className="w-10 h-10 object-contain" />
            <div>
              <div className="font-bold text-text tracking-tight" style={{ fontSize: '20px', lineHeight: '1.1' }}>PrepGate</div>
              <div style={{ color: '#A855F7', fontSize: '10px', fontWeight: 600, letterSpacing: '1px' }}>GATE 2027</div>
            </div>
          </div>
        </div>

        <GlassCard hover={false} padding="p-8">
          <h2 className="text-xl font-bold text-text tracking-tight mb-1">Create your workspace</h2>
          <p className="text-sm text-text2 mb-6">Start at 0% — every milestone is yours</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">Full Name</label>
              <input type="text" placeholder="Your name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} autoComplete="email" className="input-field" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">Password</label>
              <PasswordInput value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-glass px-3 text-[10px] uppercase tracking-wider text-text3">or</span></div>
          </div>

          <GoogleSignInButton
            text="signup_with"
            onSuccess={async (token) => { await googleLogin(token); navigate('/dashboard'); }}
            onError={() => toast.error('Google sign-up failed')}
          />

          <button 
            onClick={handleDemoMode}
            className="w-full mt-3 py-2 px-4 rounded-xl border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="zap" className="w-3.5 h-3.5" />
            Explore Demo Mode (No Setup Required)
          </button>

          <p className="text-center text-sm text-text3 mt-6">
            Have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
