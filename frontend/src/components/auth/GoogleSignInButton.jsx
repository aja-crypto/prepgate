// Google Sign-In button using Google Identity Services
import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Better check for placeholder or missing ID
const IS_PLACEHOLDER = !CLIENT_ID || 
                        CLIENT_ID === '' || 
                        CLIENT_ID.includes('your_google_client_id') || 
                        CLIENT_ID === 'undefined';

export default function GoogleSignInButton({ onSuccess, onError, text = 'signin_with' }) {
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const scriptLoaded = useRef(false);

  const handleDemoMode = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  const handleCredential = useCallback(async (response) => {
    try {
      await onSuccess(response.credential);
    } catch (err) {
      onError?.(err);
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    // If it's a placeholder, don't even try to load the script
    if (IS_PLACEHOLDER) return;

    let mounted = true;

    const initGoogleSignIn = () => {
      if (!mounted || !window.google?.accounts?.id || !btnRef.current) return;
      
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredential,
          auto_select: false, // Prevent automatic prompts that cause removeChild errors
        });
        
        window.google.accounts.id.renderButton(btnRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text,
          width: 320,
          shape: 'rectangular',
        });
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
      document.body.appendChild(script);
    }

    return () => {
      mounted = false;
      // Note: We don't remove the script globally, but we stop the init flow
    };
  }, [handleCredential, text]);

  if (IS_PLACEHOLDER) {
    return (
      <button 
        onClick={handleDemoMode}
        className="w-full group text-[11px] text-text3 text-center py-4 px-4 border border-dashed border-border rounded-xl bg-bg-3/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
      >
        <p className="font-bold text-text mb-1 group-hover:text-primary transition-colors italic">Google Sign-In Disabled</p>
        <p className="mb-2 opacity-70">Set VITE_GOOGLE_CLIENT_ID in .env</p>
        <div className="text-primary font-bold uppercase tracking-widest text-[10px] bg-primary/10 py-1.5 rounded-lg border border-primary/20">
          Enter Demo Mode instead →
        </div>
      </button>
    );
  }

  return (
    <div className="flex justify-center w-full min-h-[44px]">
      <div ref={btnRef} />
    </div>
  );
}
