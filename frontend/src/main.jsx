import React, { useEffect, useRef, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';

const initSentry = () => {
  if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) return;
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      environment: import.meta.env.MODE || 'development',
      tracesSampleRate: 0.1,
      integrations: [Sentry.browserTracingIntegration()],
      beforeSend(event) { return event; },
    });
  });
};
if ('requestIdleCallback' in window) requestIdleCallback(initSentry, { timeout: 3000 });
else setTimeout(initSentry, 1500);

// Suppress Three.js deprecation warning for THREE.Clock
const originalWarn = console.warn.bind(console);
console.warn = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('THREE.Clock') && msg.includes('deprecated')) return;
  originalWarn(...args);
};

// =============================================
// DEBUG: Global runtime error logging (Phase 1)
// =============================================
window.addEventListener('error', (event) => {
  console.error('========== [GLOBAL] Uncaught Error ==========');
  console.error('Timestamp:', new Date().toISOString());
  console.error('URL:', window.location.href);
  console.error('Message:', event.message);
  console.error('Source:', event.filename, ':', event.lineno, ':', event.colno);
  console.error('Error:', event.error);
  console.error('Stack:', event.error?.stack || '(no stack)');
  console.error('==============================================');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('========== [GLOBAL] Unhandled Promise Rejection ==========');
  console.error('Timestamp:', new Date().toISOString());
  console.error('URL:', window.location.href);
  console.error('Reason:', event.reason);
  console.error('Stack:', event.reason?.stack || '(no stack)');
  console.error('==========================================================');
});
// =============================================

// =============================================
// Stale-chunk auto-recovery after deploys
// When index.html (or a cached app shell / service worker) is old, it can
// reference lazy chunk hashes that a new build replaced. The import throws
// "Failed to fetch dynamically imported module". Reload ONCE to grab the
// latest build instead of leaving the user stuck on a blank/broken screen.
// A sessionStorage flag prevents any infinite reload loop.
// =============================================
(function () {
  let fired = false;
  const marker = 'gatenexa_chunk_reload_done';
  window.addEventListener('error', (event) => {
    if (fired) return;
    const msg = event.message || '';
    if (msg.indexOf('Failed to fetch dynamically imported module') !== -1 ||
        msg.indexOf('error loading dynamically imported module') !== -1 ||
        msg.indexOf('Importing a module script failed') !== -1) {
      fired = true;
      if (!sessionStorage.getItem(marker)) {
        sessionStorage.setItem(marker, '1');
        console.warn('[GLOBAL] Stale chunk detected after deploy — reloading once to fetch the latest build.');
        window.location.reload();
      }
    }
  });
})();
// =============================================

import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import GateNexaBootManager from './boot/GateNexaBootManager';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardProvider } from './context/DashboardContext';
import { DiagnosticsProvider } from './context/DiagnosticsContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { AiMentorProvider } from './context/AiMentorContext';
import AiMentorTracker from './components/ai-mentor/AiMentorTracker';
import { FocusProvider } from './context/FocusContext';
const AnalyticsLazy = lazy(() => import('@vercel/analytics/react').then((m) => ({ default: m.Analytics })));
const SpeedInsightsLazy = lazy(() => import('@vercel/speed-insights/react').then((m) => ({ default: m.SpeedInsights })));
import { checkReminders } from './utils/reminderUtils';
import { initFirebasePush, isFirebaseConfigured } from './utils/firebase';
import { silentCatch } from './utils/errorHandler';
import './styles/globals.css';

function ReminderScheduler() {
  const { notifications, data } = useProgress();
  const notificationsRef = useRef(notifications);
  const dataRef = useRef(data);
  notificationsRef.current = notifications;
  dataRef.current = data;
  useEffect(() => {
    const interval = setInterval(() => {
      checkReminders(notificationsRef.current, dataRef.current);
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  return null;
}

function PwaSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(silentCatch('Service worker registration'));
    }
    if (isFirebaseConfigured()) {
      initFirebasePush().catch(silentCatch('Firebase push init'));
    }
  }, []);
  return null;
}

function ProgressProviderWrapper() {
  return (
    <ProgressProvider>
      <DashboardProvider>
        <FocusProvider>
          <AiMentorProvider>
            <PwaSetup />
            <ReminderScheduler />
            <AiMentorTracker />
            <App />
          </AiMentorProvider>
        </FocusProvider>
      </DashboardProvider>
    </ProgressProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GateNexaBootManager>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AdminAuthProvider>
              <DiagnosticsProvider>
              <NotificationProvider>
            <ProgressProviderWrapper />
          </NotificationProvider>
              </DiagnosticsProvider>
              <Toaster position="top-right" />
              {import.meta.env.PROD && window.location.hostname === 'gatenexa.vercel.app' && (
    <Suspense fallback={null}>
      <AnalyticsLazy />
      <SpeedInsightsLazy />
    </Suspense>
  )}
            </AdminAuthProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GateNexaBootManager>
  </React.StrictMode>
);
