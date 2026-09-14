import { useState, useEffect, useCallback } from 'react';
import Icon from '../ui/Icon';
import BrandText from '../ui/BrandText';

const LS_KEY = 'gatenexa_install_dismissed';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOSSafari() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in window);
}

function isAndroid() {
  return /Android/i.test(window.navigator.userAgent);
}

function isInAppBrowser() {
  const ua = window.navigator.userAgent;
  return /(FBAN|FBAV|Instagram|Line|WeChat|Snapchat|TikTok|Twitter|WhatsApp)/i.test(ua);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(LS_KEY); } catch { return null; }
  });
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  // Detect if already installed
  useEffect(() => {
    if (isStandalone()) {
      setIsAlreadyInstalled(true);
      return;
    }
    // Check media query for standalone
    const mql = window.matchMedia('(display-mode: standalone)');
    const handler = (e) => setIsAlreadyInstalled(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Capture beforeinstallprompt event
  useEffect(() => {
    if (isAlreadyInstalled) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isAlreadyInstalled]);

  // Show logic: determine when to display the prompt
  useEffect(() => {
    if (isAlreadyInstalled) return;
    if (isInAppBrowser()) return;

    // Check dismissal state
    if (dismissed === 'installed' || dismissed === 'permanent') return;

    if (dismissed) {
      try {
        const parsed = JSON.parse(dismissed);
        if (parsed?.until && parsed.until > Date.now()) return;
      } catch { /* invalid data, treat as not dismissed */ }
    }

    // If we have a native prompt, show after short delay
    if (deferredPrompt) {
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }

    // If no native prompt (iOS Safari, etc.), show after longer delay with manual instructions
    const timer = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(timer);
  }, [deferredPrompt, isAlreadyInstalled, dismissed]);

  // Listen for appinstalled event
  useEffect(() => {
    const handler = () => {
      setIsAlreadyInstalled(true);
      setShow(false);
      try { localStorage.setItem(LS_KEY, 'installed'); } catch {}
      setDismissed('installed');
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShow(false);
        try { localStorage.setItem(LS_KEY, 'installed'); } catch {}
        setDismissed('installed');
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleLater = useCallback(() => {
    setShow(false);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    try { localStorage.setItem(LS_KEY, JSON.stringify({ until: expiresAt })); } catch {}
    setDismissed(JSON.stringify({ until: expiresAt }));
  }, []);

  const handleDontShow = useCallback(() => {
    setShow(false);
    try { localStorage.setItem(LS_KEY, 'permanent'); } catch {}
    setDismissed('permanent');
  }, []);

  const handleClose = useCallback(() => {
    setShow(false);
  }, []);

  // Don't render if not showing or permanently dismissed or installed
  if (!show || dismissed === 'permanent' || dismissed === 'installed' || isAlreadyInstalled) {
    return null;
  }

  // iOS Safari: manual install guide
  if (isIOSSafari() && !deferredPrompt) {
    return (
      <div className="fixed bottom-24 right-4 md:right-6 z-[99999] animate-slide-up">
        <div className="rounded-2xl p-4 w-[300px] shadow-2xl" style={{ background: 'rgba(15,17,25,0.97)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-start gap-3 mb-3">
            <Icon name="logo" className="w-10 h-10 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text">Install <BrandText /></div>
              <div className="text-xs text-text3 mt-0.5 leading-relaxed">
                Add GateNexa to your Home Screen for faster access and a native app experience.
              </div>
            </div>
          </div>
          <div className="rounded-lg p-2.5 mb-3 text-[10px] text-text2 leading-relaxed" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="font-semibold text-text mb-1">How to install:</div>
            <div>1. Tap the <span className="font-semibold">Share</span> button below</div>
            <div>2. Tap <span className="font-semibold">Add to Home Screen</span></div>
            <div>3. Tap <span className="font-semibold">Add</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleClose} className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}>
              Got it
            </button>
            <button onClick={handleLater} className="px-3 py-2 rounded-xl text-xs text-text2 hover:text-text transition-all bg-white/5 hover:bg-white/10">Later</button>
            <button onClick={handleDontShow} className="px-3 py-2 rounded-xl text-xs text-text3 hover:text-text transition-all">Don't Show</button>
          </div>
        </div>
      </div>
    );
  }

  // Android / desktop with no native prompt (in-app browser or unsupported)
  if (!deferredPrompt && !isIOSSafari()) {
    return (
      <div className="fixed bottom-24 right-4 md:right-6 z-[99999] animate-slide-up">
        <div className="rounded-2xl p-4 w-[300px] shadow-2xl" style={{ background: 'rgba(15,17,25,0.97)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-start gap-3 mb-3">
            <Icon name="logo" className="w-10 h-10 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text">Install <BrandText /></div>
              <div className="text-xs text-text3 mt-0.5 leading-relaxed">
                Open GateNexa in your browser to install the app.
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleClose} className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}>
              Got it
            </button>
            <button onClick={handleLater} className="px-3 py-2 rounded-xl text-xs text-text2 hover:text-text transition-all bg-white/5 hover:bg-white/10">Later</button>
            <button onClick={handleDontShow} className="px-3 py-2 rounded-xl text-xs text-text3 hover:text-text transition-all">Don't Show</button>
          </div>
        </div>
      </div>
    );
  }

  // Native install prompt (Chrome, Edge, etc.)
  return (
    <div className="fixed bottom-24 right-4 md:right-6 z-[99999] animate-slide-up">
      <div className="rounded-2xl p-4 w-[300px] shadow-2xl" style={{ background: 'rgba(15,17,25,0.97)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-start gap-3 mb-3">
          <Icon name="logo" className="w-10 h-10 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-text">Install <BrandText /></div>
            <div className="text-xs text-text3 mt-0.5 leading-relaxed">
              Install for faster access, offline support, and a native app experience.
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleInstall} className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}>
            Install
          </button>
          <button onClick={handleLater} className="px-3 py-2 rounded-xl text-xs text-text2 hover:text-text transition-all bg-white/5 hover:bg-white/10">Maybe Later</button>
          <button onClick={handleDontShow} className="px-3 py-2 rounded-xl text-xs text-text3 hover:text-text transition-all">Don't Show Again</button>
        </div>
      </div>
    </div>
  );
}
