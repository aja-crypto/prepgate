// Google Sign-In — uses renderButton() for reliable flow
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const IS_PLACEHOLDER = !CLIENT_ID ||
  CLIENT_ID === '' ||
  CLIENT_ID.includes('your_google_client_id') ||
  CLIENT_ID === 'undefined' ||
  CLIENT_ID.includes('purruajaykumar') ||
  CLIENT_ID.includes('PLACEHOLDER');

export default function GoogleSignInButton({ onSuccess, onError }) {
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const scriptLoaded = useRef(false);
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [promptFailed, setPromptFailed] = useState(false);

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
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    if (IS_PLACEHOLDER) return;

    let mounted = true;

    const initGoogleSignIn = () => {
      if (!mounted || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredential,
          auto_select: false,
        });
        if (mounted) setScriptReady(true);
      } catch (err) {
        console.error('Google Sign-In initialization failed:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleSignIn();
    } else if (!scriptLoaded.current) {
      scriptLoaded.current = true;
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
        if (mounted) setPromptFailed(true);
      };
      document.body.appendChild(script);
    }

    return () => { mounted = false; };
  }, [handleCredential]);

  // Render the native Google button inside our container
  useEffect(() => {
    if (!scriptReady || !btnRef.current || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        width: btnRef.current.offsetWidth || 380,
        text: 'signin_with',
        shape: 'rectangular',
      });
    } catch (err) {
      console.error('Google renderButton failed:', err);
      setPromptFailed(true);
    }
  }, [scriptReady]);

  if (IS_PLACEHOLDER) {
    return (
      <button
        onClick={handleDemoMode}
        className="w-full group text-[11px] text-text3 text-center py-4 px-4 border border-dashed border-border rounded-xl bg-bg-3/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
      >
        <p className="font-bold text-text mb-1 group-hover:text-primary transition-colors italic">Google Sign-In Disabled</p>
        <p className="mb-2 opacity-70">Set VITE_GOOGLE_CLIENT_ID in .env</p>
        <div className="text-primary font-bold uppercase tracking-widest text-[10px] bg-primary/10 py-1.5 rounded-xl border border-primary/20">
          Enter Demo Mode instead →
        </div>
      </button>
    );
  }

  if (promptFailed) {
    return (
      <button
        onClick={handleDemoMode}
        className="w-full group text-[11px] text-text3 text-center py-4 px-4 border border-dashed border-border rounded-xl bg-bg-3/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
      >
        <p className="font-bold text-text mb-1 group-hover:text-primary transition-colors italic">Google Sign-In Unavailable</p>
        <p className="mb-2 opacity-70">Could not load Google services. Check your connection.</p>
        <div className="text-primary font-bold uppercase tracking-widest text-[10px] bg-primary/10 py-1.5 rounded-xl border border-primary/20">
          Enter Demo Mode instead →
        </div>
      </button>
    );
  }

  return (
    <div className="w-full relative">
      {/* Native Google button rendered here */}
      <div
        ref={btnRef}
        className="w-full [&>div]:w-full [&>div>div]:w-full"
      />
      {/* Loading overlay while script loads */}
      {!scriptReady && (
        <div className="absolute inset-0 flex items-center justify-center py-3.5 px-4 rounded-xl border border-border bg-surface/60 backdrop-blur-md">
          <div className="w-5 h-5 border-2 border-white/20 border-t-primary rounded-full animate-spin mr-3" />
          <span className="text-sm text-text3">Loading Google Sign-In...</span>
        </div>
      )}
    </div>
  );
}
