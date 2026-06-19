// Premium auth — PrepFlow branding
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

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen login-wallpaper-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] animate-slide-up relative z-10">
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
          <h2 className="text-xl font-bold text-text tracking-tight mb-1">Welcome back</h2>
          <p className="text-sm text-text2 mb-6">Sign in to continue your preparation</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text2 uppercase tracking-wider mb-2">Password</label>
              <PasswordInput value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} autoComplete="current-password" />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary hover:opacity-80">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-glass px-3 text-[10px] uppercase tracking-wider text-text3">or continue with</span></div>
          </div>

          <GoogleSignInButton
            onSuccess={async (token) => { await googleLogin(token); navigate('/dashboard'); }}
            onError={() => toast.error('Google sign-in failed')}
          />

          <p className="text-center text-sm text-text3 mt-6">
            No account? <Link to="/register" className="text-primary font-medium hover:opacity-80">Create one</Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
