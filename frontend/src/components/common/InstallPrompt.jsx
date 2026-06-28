import { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import BrandText from '../ui/BrandText';

const LS_KEY = 'gatenexa_install_dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(LS_KEY));

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const d = localStorage.getItem(LS_KEY);
      if (!d) {
        setTimeout(() => setShow(true), 2000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
      localStorage.setItem(LS_KEY, 'installed');
    }
    setDeferredPrompt(null);
  };

  const handleLater = () => {
    setShow(false);
    sessionStorage.setItem('gatenexa_install_later', Date.now().toString());
  };

  const handleDontShow = () => {
    setShow(false);
    localStorage.setItem(LS_KEY, 'permanent');
    setDismissed('permanent');
  };

  if (!show || dismissed === 'permanent' || dismissed === 'installed') return null;

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