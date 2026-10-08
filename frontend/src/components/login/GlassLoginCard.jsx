import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Shield, Zap, Globe } from 'lucide-react';
import GoogleSignInButton from '../auth/GoogleSignInButton';
import GoogleAuthError, { reportGoogleAuthError } from '../auth/GoogleAuthError';
import { useAuthActions } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';

// Fast, cheap stagger: opacity + transform only (no filter blur — expensive on
// mobile GPUs). Total reveal stays well under 450ms so auth never feels slow.
const INPUT_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 + i * 0.05, duration: 0.32, ease: 'easeOut' },
  }),
};

function GlowInput({ icon: Icon, type, placeholder, value, onChange, showToggle, onToggle, isVisible, index, inputRef, required }) {
  const [focused, setFocused] = useState(false);
  const inputId = `input-${type}-${index}`;

  return (
    <motion.div custom={index} variants={INPUT_VARIANTS} initial="hidden" animate="visible">
      <label htmlFor={inputId} className="sr-only">{placeholder}</label>
      <div
        className="relative group"
        style={{
          borderRadius: '12px',
          background: focused
            ? 'rgba(124, 58, 237, 0.06)'
            : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${focused ? 'rgba(124, 58, 237, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
          boxShadow: focused
            ? '0 0 24px rgba(124, 58, 237, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
            : 'inset 0 1px 0 rgba(255,255,255,0.03)',
          // Animate only color/shadow properties at 180ms — never `all`,
          // and never width/height/margin (layout must stay fixed).
          transition: 'border-color 180ms ease-out, background-color 180ms ease-out, box-shadow 180ms ease-out',
        }}
      >
        <div className="flex items-center px-4 md:px-4 py-4 md:py-3.5">
          <Icon
            size={17}
            className="shrink-0 transition-colors duration-150"
            style={{ color: focused ? '#A78BFA' : 'rgba(255,255,255,0.38)' }}
          />
          <input
            id={inputId}
            ref={inputRef}
            name={type}
            type={showToggle ? (isVisible ? 'text' : 'password') : type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-label={placeholder}
            aria-required={required ? true : undefined}
            className="flex-1 min-w-0 bg-transparent outline-none ml-3 text-sm text-white/90 placeholder:text-white/45 font-normal focus-visible:outline-none"
            style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
          />
          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={isVisible ? 'Hide password' : 'Show password'}
              className="shrink-0 p-1.5 rounded-lg text-white/45 hover:text-white/85 hover:bg-white/5 transition-[color,background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40 active:scale-95"
            >
              {isVisible ? (
                <EyeOff size={15} />
              ) : (
                <Eye size={15} />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function GlassLoginCard({ onStatusChange, onLoginSuccess }) {
  const { googleLogin, login, loginAsGuest } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [gsiKey, setGsiKey] = useState(0);
  const emailRef = useRef(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading || googleConnecting) return;
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    onStatusChange?.('loading');

    try {
      await login(email, password);
      onStatusChange?.('success');
      onLoginSuccess?.();
    } catch (err) {
      // Never surface raw axios/5xx text — network failures must NOT read
      // "Invalid credentials" (they say nothing about the credentials).
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
      onStatusChange?.('error');
      setTimeout(() => onStatusChange?.('idle'), 2000);
    } finally {
      setLoading(false);
    }
  }, [email, password, login, onStatusChange, onLoginSuccess, loading, googleConnecting]);

  const handleDemo = useCallback(async () => {
    if (loading || googleConnecting) return;
    setLoading(true);
    setError('');
    onStatusChange?.('loading');
    try {
      await loginAsGuest();
      onStatusChange?.('success');
      onLoginSuccess?.();
    } catch {
      setError('Demo unavailable');
      onStatusChange?.('error');
      setTimeout(() => onStatusChange?.('idle'), 2000);
    } finally {
      setLoading(false);
    }
  }, [loginAsGuest, onStatusChange, onLoginSuccess, loading, googleConnecting]);

  const handleGoogleSuccess = useCallback(async (token) => {
    if (loading || googleConnecting) return;
    setGoogleConnecting(true);
    try {
      onStatusChange?.('loading');
      await googleLogin(token);
      onStatusChange?.('success');
      onLoginSuccess?.();
    } catch (err) {
      reportGoogleAuthError(err, 'login-google');
      setGoogleError(true);
      onStatusChange?.('error');
      setTimeout(() => onStatusChange?.('idle'), 2000);
    } finally {
      setGoogleConnecting(false);
    }
  }, [googleLogin, onStatusChange, onLoginSuccess, loading, googleConnecting]);

  const handleGoogleFailure = useCallback((err) => {
    reportGoogleAuthError(err, 'login-google');
    setGoogleError(true);
    onStatusChange?.('error');
    setTimeout(() => onStatusChange?.('idle'), 2000);
  }, [onStatusChange]);

  const handleGoogleRetry = useCallback(() => {
    setGoogleError(false);
    setError('');
    setGsiKey((k) => k + 1);
  }, []);

  const handleUseEmail = useCallback(() => {
    emailRef.current?.focus();
  }, []);

  return (
    // Card entrance: subtle fade + 8px lift over 350ms (spec §3). The previous
    // mouse-tilt + infinite bob wrappers were removed — they re-rendered the
    // whole form on every mousemove and ran a perpetual animation loop.
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-[420px] mx-auto px-0 md:px-0"
    >
      <div
        className="relative overflow-hidden"
            style={{
              borderRadius: '28px',
              background: 'rgba(10, 15, 30, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.04) inset,
                0 1px 0 rgba(255,255,255,0.05) inset,
                0 20px 60px -12px rgba(0, 0, 0, 0.4)
              `,
            }}
          >
            <div className="relative z-10 px-4 sm:px-8 md:px-12 pt-5 sm:pt-10 md:pt-14 pb-5 sm:pb-8 md:pb-12">
              {/* Logo mark — very subtle fade, no dramatic scale (spec §18) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.06, duration: 0.3, ease: 'easeOut' }}
                className="flex justify-center mb-8"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))',
                    border: '1px solid rgba(124,58,237,0.15)',
                  }}
                >
                  <Shield size={22} className="text-purple-400/80" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
                className="text-center mb-8 md:mb-12"
              >
                <h1
                  className="text-[26px] font-semibold text-white/95 mb-2.5"
                  style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: 600, letterSpacing: '-0.03em' }}
                >
                  Welcome back 👋
                </h1>
                <p
                  className="text-sm text-white/45 font-normal"
                  style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
                >
                  Sign in to continue your GATE preparation.
                </p>
              </motion.div>

              {/* Error — subtle fade + 2px slide, no shake, no height animation */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="mb-5 px-4 py-2.5 rounded-xl text-xs text-red-300/90"
                    role="alert"
                    style={{
                      background: 'rgba(239, 68, 68, 0.06)',
                      border: '1px solid rgba(239, 68, 68, 0.12)',
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <GlowInput
                  icon={Mail}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  index={0}
                  inputRef={emailRef}
                  required
                />
                <GlowInput
                  icon={Lock}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showToggle
                  onToggle={() => setShowPassword(!showPassword)}
                  isVisible={showPassword}
                  index={1}
                  required
                />

                <div className="flex justify-end -mt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-purple-400/70 hover:text-purple-300 hover:underline underline-offset-2 decoration-purple-400/60 transition-[color,text-decoration-color] duration-150 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In button — CSS-driven hover/active (no JS mouse handlers,
                     no re-renders). Subtle brightness + glow + 1px lift per spec §4. */}
                <motion.div
                  custom={2}
                  variants={INPUT_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  className="pt-3"
                >
                  <button
                    type="submit"
                    disabled={loading || googleConnecting}
                    aria-label="Sign in to your account"
                    aria-busy={loading}
                    className="w-full relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-[transform,box-shadow,filter,opacity] duration-150 ease-out hover:-translate-y-px hover:brightness-[1.07] hover:shadow-[0_0_28px_rgba(124,58,237,0.3),0_4px_14px_rgba(0,0,0,0.35)] active:translate-y-0 active:brightness-100 active:shadow-none disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:brightness-100 disabled:hover:shadow-none"
                    style={{
                      borderRadius: '12px',
                      padding: '14px 0',
                      background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '14px',
                      letterSpacing: '0.01em',
                      cursor: loading ? 'wait' : 'pointer',
                    }}
                  >
                  <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.2))',
                      }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2.5 min-h-[20px]">
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Signing in…
                        </>
                      ) : (
                        <>
                          Sign in
                          <ArrowRight size={15} className="transition-transform duration-150 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </span>
                  </button>
                </motion.div>
              </form>

              {/* Divider */}
              <motion.div
                custom={3}
                variants={INPUT_VARIANTS}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-2 sm:gap-3 my-4 sm:my-6"
              >
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] text-white/35 font-light uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </motion.div>

              {/* Google Sign-In / friendly Google failure state */}
              <motion.div
                custom={4}
                variants={INPUT_VARIANTS}
                initial="hidden"
                animate="visible"
              >
                {/* State swaps fade in gently (~180ms) instead of popping. */}
                {googleConnecting ? (
                  <motion.div
                    key="google-connecting"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    role="status"
                    aria-live="polite"
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-sm text-white/70"
                    style={{
                      background: 'rgba(124, 58, 237, 0.06)',
                      border: '1px solid rgba(124, 58, 237, 0.22)',
                    }}
                  >
                    <Loader2 size={16} className="animate-spin text-purple-300" />
                    Connecting to Google…
                  </motion.div>
                ) : googleError ? (
                  <motion.div
                    key="google-error"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <GoogleAuthError onRetry={handleGoogleRetry} onUseEmail={handleUseEmail} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`google-ready-${gsiKey}`}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <GoogleSignInButton
                      key={gsiKey}
                      text="continue_with"
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleFailure}
                    />
                  </motion.div>
                )}
              </motion.div>

              {/* New user path — the sign-up decision, made obvious.
                  Subtle block hover per spec §11: border/text brighten, arrow
                  nudges 3px. Sign In stays visually primary. */}
              <motion.div
                custom={5}
                variants={INPUT_VARIANTS}
                initial="hidden"
                animate="visible"
                className="group/newuser mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/[0.06] text-center transition-[border-color] duration-200 hover:border-t-white/[0.14]"
              >
                <div className="pb-2 -mb-2 rounded-xl transition-colors duration-200 group-hover/newuser:bg-white/[0.03]">
                  <p className="text-[13px] font-medium text-white/65 transition-colors duration-200 group-hover/newuser:text-white/85">
                    New to GateNexa?
                  </p>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed transition-colors duration-200 group-hover/newuser:text-white/55">
                    Create an account to start your GATE 2027 preparation.
                  </p>
                  <Link
                    to="/register"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-300/90 hover:text-purple-200 transition-colors rounded-lg px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
                  >
                    Create an account
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover/newuser:translate-x-[3px]" />
                  </Link>
                </div>
              </motion.div>

              {/* Demo — tertiary option */}
              <motion.div
                custom={6}
                variants={INPUT_VARIANTS}
                initial="hidden"
                animate="visible"
                className="mt-1 sm:mt-2 text-center"
              >
                <button
                  type="button"
                  onClick={handleDemo}
                  disabled={loading || googleConnecting}
                  className="text-xs text-white/35 hover:text-white/60 transition-[color,opacity] duration-150 font-medium py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ cursor: loading ? 'wait' : 'pointer', fontFamily: "'Inter', -apple-system, sans-serif" }}
                >
                  Explore Demo — no account required
                </button>
              </motion.div>
            </div>
          </div>

      {/* Bottom trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: 'easeOut' }}
        className="flex items-center justify-center gap-5 sm:gap-8 mt-5 sm:mt-8"
      >
        {[
          { icon: Shield, label: 'Secure', sub: '256-bit encryption' },
          { icon: Zap, label: 'Fast', sub: 'Optimized experience' },
          { icon: Globe, label: 'Reliable', sub: 'Always available' },
        ].map(({ icon: I, label, sub }) => (
          <div key={label} className="flex items-center gap-2">
            <I size={13} className="text-white/30" />
            <div>
              <div className="text-[10px] text-white/45 font-medium">{label}</div>
              <div className="text-[9px] text-white/25 font-light">{sub}</div>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
