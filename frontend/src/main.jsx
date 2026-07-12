import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE || 'development',
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  integrations: [Sentry.browserTracingIntegration()],
  beforeSend(event) { if (!import.meta.env.PROD) return null; return event; },
});

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

import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardProvider } from './context/DashboardContext';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { FocusProvider } from './context/FocusContext';
import { Analytics } from '@vercel/analytics/react';
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
          <PwaSetup />
          <ReminderScheduler />
          <App />
        </FocusProvider>
      </DashboardProvider>
    </ProgressProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AdminAuthProvider>
            <ProgressProviderWrapper />
            <Toaster position="top-right" />
            <Analytics />
          </AdminAuthProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
