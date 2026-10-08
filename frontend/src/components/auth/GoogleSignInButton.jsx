// Google Sign-In — uses renderButton() with timeout + retry
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthActions } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { reportGoogleAuthError } from './GoogleAuthError';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const IS_PLACEHOLDER = !CLIENT_ID ||
  CLIENT_ID === '' ||
  CLIENT_ID.includes('your_google_client_id') ||
  CLIENT_ID === 'undefined' ||
  CLIENT_ID.includes('PLACEHOLDER');

const LOADING_TIMEOUT = 10000;
const RETRY_COOLDOWN = 5000;
const GSI_SCRIPT_SELECTOR = 'script[src*="accounts.google.com/gsi/client"]';

export default function GoogleSignInButton({ onSuccess, onError, text = 'signin_with' }) {
  const { loginAsGuest } = useAuthActions();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const scriptLoaded = useRef(false);
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [promptFailed, setPromptFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const timeoutRef = useRef(null);

  const handleDemoMode = async () => {
    await loginAsGuest();
    navigate('/dashboard');
  };

  const handleCredential = useCallback(async (response) => {
    setLoading(false);
    try {
      await onSuccess(response.credential);
    } catch (err) {
      reportGoogleAuthError(err, 'credential');
      onError?.(err);
      setPromptFailed(true);
      setError('Google sign-in failed');
    }
  }, [onSuccess, onError]);

  const handleCredentialRef = useRef(handleCredential);
  handleCredentialRef.current = handleCredential;

  const initializedRef = useRef(false);

  const clearTimeout_ = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startLoadingTimer = () => {
    clearTimeout_();
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
    }, LOADING_TIMEOUT);
  };

  const initGoogleSignIn = () => {
    if (!window.google?.accounts?.id || initializedRef.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => handleCredentialRef.current(response),
        auto_select: false,
        error_callback: (err) => {
          // Real GIS detail stays in the developer console only.
          // eslint-disable-next-line no-console
          console.error('[GoogleAuth] gsi_error_callback', err?.type || '', err?.message || '');
          if (err?.type === 'popup_closed_by_user') return;
          if (err?.type === 'popup_closed') return;
          const msg = err?.message || err?.type || '';
          if (msg.includes('origin') || msg.includes('redirect_uri')) {
            setError('Google sign-in is not available from this page. Please use email and password.');
          } else if (msg.includes('network') || msg.includes('fetch')) {
            setError("Cannot reach Google. Check your connection and try again.");
          } else {
            setError('Google sign-in failed. Please try again or use email and password.');
          }
          setPromptFailed(true);
        },
      });
      initializedRef.current = true;
      setScriptReady(true);
      clearTimeout_();
    } catch (err) {
      console.error('Google Sign-In initialization failed:', err);
      setPromptFailed(true);
      setError('Failed to initialize Google Sign-In');
      clearTimeout_();
    }
  };

  const loadScript = () => {
    if (scriptLoaded.current && !retrying) return;
    scriptLoaded.current = true;
    setTimedOut(false);
    setPromptFailed(false);
    setScriptReady(false);
    setRetrying(false);
    startLoadingTimer();

    // Reuse an existing <script> tag (e.g. after a remount/retry) rather than
    // injecting a duplicate tag.
    const existing = document.querySelector(GSI_SCRIPT_SELECTOR);
    if (existing) {
      if (window.google?.accounts?.id) {
        setTimeout(initGoogleSignIn, 100);
      } else {
        existing.addEventListener('load', () => setTimeout(initGoogleSignIn, 100), { once: true });
        existing.addEventListener(
          'error',
          () => {
            console.error('Failed to load Google Sign-In script');
            setPromptFailed(true);
            setError('Could not reach Google. Check your connection and try again.');
            clearTimeout_();
          },
          { once: true }
        );
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTimeout(initGoogleSignIn, 100);
    };
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      setPromptFailed(true);
      setError('Could not reach Google. Check your connection and try again.');
      clearTimeout_();
    };
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (IS_PLACEHOLDER) {
      setPromptFailed(true);
      setError('Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in .env or use Demo Mode.');
      return;
    }

    if (window.google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      loadScript();
    }

    return () => { clearTimeout_(); };
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    scriptLoaded.current = false;
    initializedRef.current = false;
    const old = document.querySelector(GSI_SCRIPT_SELECTOR);
    if (old) old.remove();
    delete window.google?.accounts;
    setTimeout(loadScript, RETRY_COOLDOWN);
  };

  useEffect(() => {
    if (!scriptReady || !btnRef.current || !window.google?.accounts?.id) return;
    try {
      // Clamp to the real container width so the Google button never forces
      // horizontal overflow on narrow (320–430px) viewports.
      const measured = Math.round(btnRef.current.getBoundingClientRect().width) || 0;
      const viewportCap = Math.max(180, (window.innerWidth || 380) - 32);
      const width = Math.max(180, Math.min(measured || 380, viewportCap));
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        width,
        text: text,
        shape: 'rectangular',
      });
    } catch (err) {
      console.error('Google renderButton failed:', err);
      setPromptFailed(true);
      clearTimeout_();
    }
  }, [scriptReady]);

  if (IS_PLACEHOLDER) {
    // In production, never silently route a "Google sign-in" click into guest/demo mode.
    // Surface a disabled/error state instead.
    return (
      <button
        type="button"
        onClick={handleDemoMode}
        aria-label="Enter Demo Mode"
        className="w-full group text-[11px] text-text3 text-center py-4 px-4 border border-dashed border-border rounded-xl bg-bg-3/30 transition-all"
        style={{ cursor: 'pointer' }}
      >
        <p className="font-bold text-text mb-1 italic">Google Sign-In Unavailable</p>
        <p className="mb-2 opacity-70">
          {import.meta.env.PROD
            ? 'Please sign in with email & password, or create an account.'
            : 'Set VITE_GOOGLE_CLIENT_ID in .env'}
        </p>
        <div className="text-primary font-bold uppercase tracking-widest text-[10px] bg-primary/10 py-1.5 rounded-xl border border-primary/20">
          Enter Demo Mode instead →
        </div>
      </button>
    );
  }

  if (promptFailed) {
    return (
      <div className="w-full flex flex-col items-center gap-3 py-4 px-4 rounded-xl border border-dashed border-border bg-bg-3/30">
        <p className="text-xs text-text3 text-center font-medium">{error || 'Google Sign-In temporarily unavailable'}</p>
        <button
          onClick={handleRetry}
          aria-label="Retry loading Google Sign-In"
          className="text-xs text-primary font-semibold hover:text-primary-light transition-colors px-4 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ minHeight: '48px' }}>
      <div
        ref={btnRef}
        className={`w-full [&>div]:w-full [&>div>div]:w-full ${!scriptReady ? 'invisible' : ''}`}
        aria-label="Google Sign-In button"
      />
      {!scriptReady && !timedOut && (
        <div className="absolute inset-0 flex items-center justify-center py-3.5 px-4 rounded-xl border border-border bg-surface/60 backdrop-blur-md" role="status" aria-label="Loading Google Sign-In">
          <div className="w-5 h-5 border-2 border-white/20 border-t-primary rounded-full animate-spin mr-3" />
          <span className="text-sm text-text3">Initializing Google Sign-In...</span>
        </div>
      )}
      {!scriptReady && timedOut && !promptFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-border bg-surface/60 backdrop-blur-md">
          <p className="text-xs text-text3 text-center">Google Sign-In unavailable</p>
          <button
            onClick={handleRetry}
            aria-label="Retry loading Google Sign-In"
            className="text-xs text-primary font-semibold hover:text-primary-light transition-colors px-4 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
