import React, { useEffect, useRef } from 'react';
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
    if ('serviceWorker' in navigator) {
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
          </AdminAuthProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
