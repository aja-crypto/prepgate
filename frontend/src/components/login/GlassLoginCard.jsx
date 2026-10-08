import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Shield, Zap, Globe } from 'lucide-react';
import GoogleSignInButton from '../auth/GoogleSignInButton';
import GoogleAuthError, { reportGoogleAuthError } from '../auth/GoogleAuthError';
import { useAuthActions } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../services/api';

const INPUT_VARIANTS = {
  hidden: { opacity: 0, y: 12, filter: 'blur(8px)' },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.4 + i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function GlowInput({ icon: Icon, type, placeholder, value, onChange, showToggle, onToggle, isVisible, index, inputRef }) {
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
          transition: 'all 0.3s ease',
        }}
      >
        <div className="flex items-center px-4 md:px-4 py-4 md:py-3.5">
          <Icon
            size={17}
            className="shrink-0 transition-colors duration-300"
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
            className="flex-1 min-w-0 bg-transparent outline-none ml-3 text-sm text-white/90 placeholder:text-white/45 font-normal focus-visible:outline-none"
            style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
          />
          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={isVisible ? 'Hide password' : 'Show password'}
              className="shrink-0 p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              {isVisible ? (
                <EyeOff size={15} className="text-white/25" />
              ) : (
                <Eye size={15} className="text-white/25" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function GlassLoginCard({ onStatusChange, mouse = { x: 0, y: 0 }, onLoginSuccess }) {
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

  const rotateX = mouse.y * -2;
  const rotateY = mouse.x * 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-[420px] mx-auto px-0 md:px-0"
    >
      <motion.div
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ perspective: '1000px' }}
      >
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 30 }}
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
              {/* Logo mark */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
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

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 px-4 py-2.5 rounded-xl text-xs text-red-300/90"
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
                />

                <div className="flex justify-end -mt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-purple-400/70 hover:text-purple-300 transition-colors rounded-md px-1 py-1"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In button */}
                <motion.div
                  custom={2}
                  variants={INPUT_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  className="pt-3"
                >
                  <motion.button
                    type="submit"
                    disabled={loading || googleConnecting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    aria-label="Sign in to your account"
                    className="w-full relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
                      transition: 'box-shadow 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.25), 0 4px 15px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                  <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.2))',
                      }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                      {loading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Signing in…
                        </>
                      ) : (
                        <>
                          Sign in
                          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </span>
                  </motion.button>
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
                    <Loader2 size={16} className="animate-spin text-purple-300" />
                    Connecting to Google…
                  </div>
                ) : googleError ? (
                  <GoogleAuthError onRetry={handleGoogleRetry} onUseEmail={handleUseEmail} />
                ) : (
                  <GoogleSignInButton
                    key={gsiKey}
                    text="continue_with"
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleFailure}
                  />
                )}
              </motion.div>

              {/* Demo + Sign up */}
              <motion.div
                custom={5}
                variants={INPUT_VARIANTS}
                initial="hidden"
                animate="visible"
                className="mt-4 sm:mt-6 flex flex-col items-center gap-2.5 sm:gap-3.5"
              >
                <button
                  type="button"
                  onClick={handleDemo}
                  className="text-xs text-white/35 hover:text-white/60 transition-colors font-medium"
                  style={{ cursor: 'pointer', fontFamily: "'Inter', -apple-system, sans-serif" }}
                >
                  Explore Demo — no account required
                </button>
                <p className="text-xs text-white/40 font-normal">
                  New to GateNexa?{' '}
                  <Link to="/register" className="inline-block -mx-1 px-1 py-1.5 text-purple-400/80 hover:text-purple-300 transition-colors font-medium">
                    Create an account
                  </Link>
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
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
