// Google Sign-In — uses renderButton() with timeout + retry
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const IS_PLACEHOLDER = !CLIENT_ID ||
  CLIENT_ID === '' ||
  CLIENT_ID.includes('your_google_client_id') ||
  CLIENT_ID === 'undefined' ||
  CLIENT_ID.includes('PLACEHOLDER');

const LOADING_TIMEOUT = 15000;
const RETRY_COOLDOWN = 5000;

export default function GoogleSignInButton({ onSuccess, onError, text = 'signin_with' }) {
  const { loginAsGuest } = useAuth();
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

  const handleDemoMode = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  const handleCredential = useCallback(async (response) => {
    setLoading(false);
    try {
      await onSuccess(response.credential);
    } catch (err) {
      onError?.(err);
      setPromptFailed(true);
      setError(err?.message || 'Google sign-in failed');
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
          console.error('Google Sign-In error:', err);
          if (err?.type === 'popup_closed_by_user') return;
          if (err?.type === 'popup_closed') return;
          const msg = err?.message || err?.type || '';
          if (msg.includes('origin') || msg.includes('redirect_uri')) {
            setError('Google Sign-In blocked: add http://localhost:5173 to Google Cloud Console authorized origins.');
          } else if (msg.includes('network') || msg.includes('fetch')) {
            setError('Network error. Check your connection and try again.');
          } else {
            setError('Google Sign-In failed: ' + (msg || 'Unknown error'));
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
      setError('Failed to load Google Sign-In. Check your connection.');
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
    const old = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (old) old.remove();
    delete window.google?.accounts;
    setTimeout(loadScript, RETRY_COOLDOWN);
  };

  useEffect(() => {
    if (!scriptReady || !btnRef.current || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        width: btnRef.current.offsetWidth || 380,
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
        disabled={import.meta.env.PROD}
        onClick={import.meta.env.PROD ? undefined : handleDemoMode}
        aria-label="Google Sign-In disabled"
        className="w-full group text-[11px] text-text3 text-center py-4 px-4 border border-dashed border-border rounded-xl bg-bg-3/30 transition-all disabled:cursor-not-allowed"
        style={import.meta.env.PROD ? { cursor: 'not-allowed', opacity: 0.6 } : { cursor: 'pointer' }}
      >
        <p className="font-bold text-text mb-1 italic">Google Sign-In Unavailable</p>
        <p className="mb-2 opacity-70">
          {import.meta.env.PROD
            ? 'Please sign in with email & password or Sign up.'
            : 'Set VITE_GOOGLE_CLIENT_ID in .env'}
        </p>
        {!import.meta.env.PROD && (
          <div className="text-primary font-bold uppercase tracking-widest text-[10px] bg-primary/10 py-1.5 rounded-xl border border-primary/20">
            Enter Demo Mode instead →
          </div>
        )}
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
