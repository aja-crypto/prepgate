import { useState, useEffect, useCallback } from 'react';
import Icon from '../ui/Icon';
import BrandText from '../ui/BrandText';

const LS_KEY = 'gatenexa_install_dismissed';

function isStandalone() {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  } catch { return false; }
}

function isIOSSafari() {
  const ua = window.navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const macTouch = ua.includes('Mac') && 'ontouchend' in window;
  return iOS || macTouch;
}

function isInAppBrowser() {
  const ua = window.navigator.userAgent || '';
  return /(FBAN|FBAV|FB_IAB|Instagram|Line|WeChat|Snapchat|TikTok|Twitter|WhatsApp|LinkedInApp|Pinterest|Slack|Discord|Telegram)/i.test(ua);
}

function getDismissed() {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}

function isSuppressed(d) {
  if (!d) return false;
  if (d === 'installed' || d === 'permanent') return true;
  try {
    const parsed = JSON.parse(d);
    if (parsed?.until && parsed.until > Date.now()) return true;
  } catch {}
  return false;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(() => (typeof window !== 'undefined' ? window.__deferredInstallPrompt || null : null));
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(() => (typeof window !== 'undefined' ? isStandalone() : false));

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    let mql;
    try {
      mql = window.matchMedia('(display-mode: standalone)');
      const h = (e) => { if (e.matches) { setInstalled(true); setShow(false); } };
      mql.addEventListener('change', h);
      return () => mql.removeEventListener('change', h);
    } catch { return undefined; }
  }, []);

  useEffect(() => {
    const onBip = () => setDeferredPrompt(window.__deferredInstallPrompt || null);
    const onNative = (e) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('gatenexa:beforeinstallprompt', onBip);
    window.addEventListener('beforeinstallprompt', onNative);
    window.addEventListener('appinstalled', onInstalled);
    function onInstalled() {
      setInstalled(true);
      setShow(false);
      setDeferredPrompt(null);
    }
    if (window.__deferredInstallPrompt) setDeferredPrompt(window.__deferredInstallPrompt);
    return () => {
      window.removeEventListener('gatenexa:beforeinstallprompt', onBip);
      window.removeEventListener('beforeinstallprompt', onNative);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (installed) return;
    if (isSuppressed(getDismissed())) return;
    const inApp = isInAppBrowser();
    const ios = isIOSSafari();
    let t;
    if (deferredPrompt) {
      t = setTimeout(() => { if (!isSuppressed(getDismissed())) setShow(true); }, 2500);
    } else if (ios || inApp) {
      t = setTimeout(() => { if (!isSuppressed(getDismissed())) setShow(true); }, 2000);
    } else {
      return undefined;
    }
    return () => clearTimeout(t);
  }, [deferredPrompt, installed]);

  const handleInstall = useCallback(async () => {
    const dp = deferredPrompt || window.__deferredInstallPrompt;
    if (!dp) return;
    try {
      dp.prompt();
      const result = await dp.userChoice;
      if (result && result.outcome === 'accepted') {
        setShow(false);
        try { localStorage.setItem(LS_KEY, 'installed'); } catch {}
        setInstalled(true);
      }
      window.__deferredInstallPrompt = null;
      setDeferredPrompt(null);
    } catch {}
  }, [deferredPrompt]);

  const handleLater = useCallback(() => {
    setShow(false);
    try { localStorage.setItem(LS_KEY, JSON.stringify({ until: Date.now() + 7 * 24 * 60 * 60 * 1000 })); } catch {}
  }, []);

  const handleDontShow = useCallback(() => {
    setShow(false);
    try { localStorage.setItem(LS_KEY, 'permanent'); } catch {}
  }, []);

  const handleOpenInBrowser = useCallback(() => {
    try {
      const url = window.location.href;
      if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
      window.open(url, '_blank', 'noopener');
    } catch {}
    setShow(false);
  }, []);

  if (!show || installed) return null;
  if (isSuppressed(getDismissed())) return null;

  const cardStyle = { background: 'rgba(15,17,25,0.97)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(20px)' };
  const primaryBtn = { background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' };

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-24 right-4 md:right-6 z-[99999] animate-slide-up">
        <div className="rounded-2xl p-4 w-[300px] shadow-2xl" style={cardStyle}>
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
            <button onClick={handleInstall} className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all" style={primaryBtn}>
              Install
            </button>
            <button onClick={handleLater} className="px-3 py-2 rounded-xl text-xs text-text2 hover:text-text transition-all bg-white/5 hover:bg-white/10">Later</button>
            <button onClick={handleDontShow} className="px-3 py-2 rounded-xl text-xs text-text3 hover:text-text transition-all">Don&apos;t Show</button>
          </div>
        </div>
      </div>
    );
  }

  if (isIOSSafari()) {
    return (
      <div className="fixed bottom-24 right-4 md:right-6 z-[99999] animate-slide-up">
        <div className="rounded-2xl p-4 w-[300px] shadow-2xl" style={cardStyle}>
          <div className="flex items-start gap-3 mb-3">
            <Icon name="logo" className="w-10 h-10 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text">Install <BrandText /></div>
              <div className="text-xs text-text3 mt-0.5 leading-relaxed">
                Add GateNexa to your Home Screen.
              </div>
            </div>
          </div>
          <div className="rounded-lg p-2.5 mb-3 text-[10px] text-text2 leading-relaxed" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <div>1. Tap the <span className="font-semibold">Share</span> button.</div>
            <div>2. Choose <span className="font-semibold">Add to Home Screen</span>.</div>
            <div>3. Tap <span className="font-semibold">Add</span>.</div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleLater} className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all" style={primaryBtn}>
              Got it
            </button>
            <button onClick={handleDontShow} className="px-3 py-2 rounded-xl text-xs text-text3 hover:text-text transition-all">Don&apos;t Show</button>
          </div>
        </div>
      </div>
    );
  }

  if (isInAppBrowser()) {
    return (
      <div className="fixed bottom-24 right-4 md:right-6 z-[99999] animate-slide-up">
        <div className="rounded-2xl p-4 w-[300px] shadow-2xl" style={cardStyle}>
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
            <button onClick={handleOpenInBrowser} className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all" style={primaryBtn}>
              Open in Browser
            </button>
            <button onClick={handleLater} className="px-3 py-2 rounded-xl text-xs text-text2 hover:text-text transition-all bg-white/5 hover:bg-white/10">Later</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
