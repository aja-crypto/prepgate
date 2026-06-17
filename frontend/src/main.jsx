import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardProvider } from './context/DashboardContext';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { FocusProvider } from './context/FocusContext';
import { checkReminders } from './utils/reminderUtils';
import { initFirebasePush, isFirebaseConfigured } from './utils/firebase';
import './styles/globals.css';

function ReminderScheduler() {
  const context = useProgress();
  useEffect(() => {
    if (!context) return;
    const interval = setInterval(() => checkReminders(context.notifications, context.data), 60000);
    return () => clearInterval(interval);
  }, [context]);
  return null;
}

function PwaSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    });
    if (isFirebaseConfigured()) {
      initFirebasePush().catch(() => {});
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
          </AdminAuthProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
