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
import { VideoPlayerProvider } from './components/video/VideoPlayerContext';
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

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function registerWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!localStorage.getItem('accessToken')) return;
  if (Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!publicKey) return;

    const vapidResponse = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/notifications/vapid-public-key`, { headers: { Accept: 'application/json' } });
    const vapidData = vapidResponse.ok ? await vapidResponse.json() : null;
    const keyToUse = vapidData?.publicKey || publicKey;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyToUse),
    });

    await fetch(`${import.meta.env.VITE_API_URL || '/api'}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ subscription }),
    });
  } catch (error) {
    console.warn('[PUSH] Browser push registration failed:', error);
  }
}

function PwaSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(silentCatch('Service worker registration'));
    }
    if (Notification.permission === 'granted') {
      registerWebPush().catch(silentCatch('Web push registration'));
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
    <ThemeProvider>
      <AuthProvider>
        <VideoPlayerProvider>
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
        </VideoPlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
