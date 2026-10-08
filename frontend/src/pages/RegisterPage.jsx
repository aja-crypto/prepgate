import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthActions } from '../context/AuthContext';
import { referralService, getApiErrorMessage } from '../services/api';
import PasswordInput from '../components/common/PasswordInput';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import GoogleAuthError, { reportGoogleAuthError } from '../components/auth/GoogleAuthError';
import CinematicBackground from '../components/login/CinematicBackground';
import { BrandName } from '../components/ui/BrandText';
import toast from 'react-hot-toast';

const EXAM_DATE = new Date('2027-02-07T09:00:00');

function CountdownBadge() {
  const [days, setDays] = useState(0);
  useEffect(() => {
    const calc = () => {
      const diff = EXAM_DATE - new Date();
      setDays(Math.max(0, Math.ceil(diff / 86400000)));
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
      <span className="text-[11px] text-white/40 font-light">
        <span className="text-white/60 font-normal">GATE 2027</span> &middot; {days} days left
      </span>
    </motion.div>
  );
}

export default function RegisterPage() {
  const { register, googleLogin, loginAsGuest } = useAuthActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [form, setForm] = useState({ name: '', email: '', password: '', refCode });
  const [loading, setLoading] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [refStatus, setRefStatus] = useState(null); // null | 'valid' | 'invalid' | 'checking'
  const [refName, setRefName] = useState('');
  const [googleError, setGoogleError] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [gsiKey, setGsiKey] = useState(0);
  const emailRef = useRef(null);

  const checkRef = async (code) => {
    if (!code || code.length < 3) { setRefStatus(null); setRefName(''); return; }
    setRefStatus('checking');
    try {
      const res = await referralService.validate(code);
      if (res.data?.valid) { setRefStatus('valid'); setRefName(res.data.name || 'a friend'); }
      else { setRefStatus('invalid'); setRefName(''); }
    } catch { setRefStatus('invalid'); setRefName(''); }
  };

  const handleDemoMode = async () => {
    if (loading || googleConnecting) return;
    await loginAsGuest();
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');
    if (loading || googleConnecting) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.refCode);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-bg">
      <CinematicBackground />

      {/* Top-left: Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="fixed top-5 left-5 z-20 flex items-center gap-2.5"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))',
            border: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          <picture>
            <img src="/images/logo.png" alt="GateNexa" className="w-5 h-5" />
          </picture>
        </div>
        <span
          className="text-sm font-medium text-white/70 hidden sm:block"
          style={{ fontFamily: "'Inter', -apple-system, sans-serif", letterSpacing: '0.02em' }}
        >
          GateNexa
        </span>
      </motion.div>

      {/* Top-right: Countdown */}
      <div className="fixed top-5 right-5 z-20">
        <CountdownBadge />
      </div>

      {/* Centered register card */}
      <div className="relative z-10 w-full max-w-[420px] px-4 md:px-6 pt-14 lg:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full rounded-2xl p-4 sm:p-6 md:p-8"
          style={{
            background: 'rgba(10, 15, 30, 0.18)',
            backdropFilter: 'blur(28px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.04) inset,
              0 1px 0 rgba(255,255,255,0.05) inset,
              0 20px 60px -12px rgba(0, 0, 0, 0.4)
            `,
          }}
        >
          <div className="flex flex-col items-center mb-6">
            <BrandName size="20px" />
            <p className="text-xs text-white/40 mt-2 tracking-wider">GATE 2027 &middot; REGISTER</p>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight mb-1">Create your GateNexa account</h2>
          <p className="text-sm text-white/55 mb-2">Start your GATE 2027 preparation in minutes.</p>
          <p className="text-[11px] text-white/40 mb-5">* Required fields</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-[11px] font-semibold text-white/55 uppercase tracking-wider mb-2">Full name <span aria-hidden="true" className="text-purple-400/90">*</span></label>
              <input id="reg-name" name="name" type="text" placeholder="Your name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} aria-required="true"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-purple-500/50 transition-colors" />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-[11px] font-semibold text-white/55 uppercase tracking-wider mb-2">Email address <span aria-hidden="true" className="text-purple-400/90">*</span></label>
              <input id="reg-email" ref={emailRef} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} autoComplete="email" aria-required="true"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-purple-500/50 transition-colors" />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-[11px] font-semibold text-white/55 uppercase tracking-wider mb-2">Password <span aria-hidden="true" className="text-purple-400/90">*</span></label>
              <PasswordInput id="reg-password" name="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="At least 8 characters" autoComplete="new-password" aria-required="true" />
              <p className="mt-1.5 text-[11px] text-white/35">Use at least 8 characters.</p>
            </div>

            {/* Referral Code — optional, visually secondary */}
            <div>
              <button type="button" onClick={() => setRefOpen(!refOpen)} className="flex items-center gap-2 text-xs text-white/35 hover:text-purple-300 transition-colors">
                <span>Have a referral code? (Optional)</span>
                <motion.svg animate={{ rotate: refOpen ? 180 : 0 }} viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></motion.svg>
              </button>
              {refOpen && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                  <input value={form.refCode} onChange={(e) => { setForm(p => ({ ...p, refCode: e.target.value })); checkRef(e.target.value); }}
                    aria-label="Referral code (optional)"
                    placeholder="Enter referral code" className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-purple-500/50 transition-colors" />
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    {refStatus === 'checking' && <span className="text-[11px] text-white/45">Checking...</span>}
                    {refStatus === 'valid' && <><span className="text-green-400 text-[11px]">✅ Referred by {refName}</span><span className="text-[9px] text-white/35">Rewards unlock after account creation.</span></>}
                    {refStatus === 'invalid' && <span className="text-red-400 text-[11px]">❌ Invalid referral code.</span>}
                  </div>
                </motion.div>
              )}
            </div>

            <button type="submit" disabled={loading || googleConnecting}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 transition-all">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center"><span className="bg-[#0a0a0f] px-3 text-[10px] uppercase tracking-wider text-white/30">or</span></div>
          </div>

          {googleConnecting ? (
            <div
              role="status"
              aria-live="polite"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-sm text-white/70"
              style={{
                background: 'rgba(124, 58, 237, 0.06)',
                border: '1px solid rgba(124, 58, 237, 0.22)',
              }}
            >
              <span className="w-4 h-4 border-2 border-white/20 border-t-purple-300 rounded-full animate-spin" />
              Connecting to Google…
            </div>
          ) : googleError ? (
            <GoogleAuthError
              onRetry={() => { setGoogleError(false); setGsiKey((k) => k + 1); }}
              onUseEmail={() => emailRef.current?.focus()}
            />
          ) : (
            <GoogleSignInButton
              key={gsiKey}
              text="continue_with"
              onSuccess={async (token) => {
                if (googleConnecting) return;
                setGoogleConnecting(true);
                try {
                  await googleLogin(token);
                  navigate('/dashboard');
                } catch (err) {
                  reportGoogleAuthError(err, 'register-google');
                  setGoogleError(true);
                } finally {
                  setGoogleConnecting(false);
                }
              }}
              onError={(err) => {
                reportGoogleAuthError(err, 'register-google');
                setGoogleError(true);
              }}
            />
          )}

          <button
            type="button"
            onClick={handleDemoMode}
            disabled={loading || googleConnecting}
            className="w-full mt-3 py-1.5 text-xs text-white/35 hover:text-white/60 transition-colors font-medium text-center"
            style={{ cursor: 'pointer', fontFamily: "'Inter', -apple-system, sans-serif" }}
          >
            Explore Demo — no account required
          </button>

          <p className="text-center text-sm text-white/50 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="inline-block -mx-1 px-1 py-1.5 text-purple-400 hover:text-purple-300 transition-colors font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
