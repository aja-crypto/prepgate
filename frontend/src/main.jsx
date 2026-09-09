import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App, { ErrorBoundary } from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardProvider } from './context/DashboardContext';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { VideoPlayerProvider } from './context/VideoPlayerContext';
import BootGate from './components/GateNexaLoader/BootGate';
import { checkReminders } from './utils/reminderUtils';
import { initFirebasePush, isFirebaseConfigured } from './utils/firebase';
import './styles/globals.css';

function ReminderScheduler() {
  const context = useProgress();
  const notifRef = useRef(null);
  const dataRef = useRef(null);
  useEffect(() => { notifRef.current = context?.notifications; }, [context?.notifications]);
  useEffect(() => { dataRef.current = context?.data; }, [context?.data]);
  useEffect(() => {
    const interval = setInterval(() => checkReminders(notifRef.current, dataRef.current), 60000);
    return () => clearInterval(interval);
  }, []);
  return null;
}

function PwaSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const handler = (e) => { e.preventDefault(); window.deferredPrompt = e; };
    window.addEventListener('beforeinstallprompt', handler);
    if (isFirebaseConfigured()) { initFirebasePush().catch(() => {}); }
    return () => { window.removeEventListener('beforeinstallprompt', handler); };
  }, []);
  return null;
}

function ProgressProviderWrapper() {
  return (
    <ProgressProvider>
      <DashboardProvider>
        <VideoPlayerProvider>
          <PwaSetup />
          <ReminderScheduler />
          <BootGate><App /></BootGate>
        </VideoPlayerProvider>
      </DashboardProvider>
    </ProgressProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <ProgressProviderWrapper />
          </ErrorBoundary>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
