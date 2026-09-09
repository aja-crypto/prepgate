import { Component, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import RouteLoadingFallback from './components/common/RouteLoadingFallback';
import { RouteErrorBoundary } from './components/common/ErrorBoundary';

function lazyWithRetry(importer) {
  return lazy(() => importer().catch((err) => {
    const chunkFailed = err?.message?.includes('Failed to fetch') || err?.message?.includes('Loading chunk');
    if (chunkFailed && !sessionStorage.getItem('gatenexa_chunk_retry')) {
      sessionStorage.setItem('gatenexa_chunk_retry', '1');
      window.location.reload();
      return new Promise(() => {});
    }
    throw err;
  }));
}

const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const SubjectsPage = lazyWithRetry(() => import('./pages/SubjectsPage'));
const TopicsPage = lazyWithRetry(() => import('./pages/TopicsPage'));
const TopicDetailPage = lazyWithRetry(() => import('./pages/TopicDetailPage'));
const PYQPage = lazyWithRetry(() => import('./pages/PYQPage'));
const MocksPage = lazyWithRetry(() => import('./pages/MocksPage'));
const AnalyticsPage = lazyWithRetry(() => import('./pages/AnalyticsPage'));
const NotesPage = lazyWithRetry(() => import('./pages/NotesPage'));
const StudyPlannerPage = lazyWithRetry(() => import('./pages/StudyPlannerPage'));
const FormulaSheetPage = lazyWithRetry(() => import('./pages/FormulaSheetPage'));
const AdminPage = lazyWithRetry(() => import('./pages/AdminPage'));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const ResourcesPage = lazyWithRetry(() => import('./pages/ResourcesPage'));
const RevisionPage = lazyWithRetry(() => import('./pages/RevisionPage'));
const ProductivityPage = lazyWithRetry(() => import('./pages/ProductivityPage'));
const AIMentorPage = lazyWithRetry(() => import('./pages/AIMentorPage'));
const LearningHubPage = lazyWithRetry(() => import('./pages/LearningHubPage'));

function withSuspense(el) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>{el}</Suspense>
    </RouteErrorBoundary>
  );
}

export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-bg">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-text mb-2">Something went wrong</h2>
            <p className="text-sm text-text3 mb-6">An unexpected error occurred. This might be a temporary issue.</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }} className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">Reload App</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg mesh-bg">
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="text-text2 text-sm font-medium">Loading PrepFlow...</div>
        <div className="text-text3 text-[11px] mt-2">If this takes too long, check your connection</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={withSuspense(<DashboardPage />)} />
        <Route path="subjects" element={withSuspense(<SubjectsPage />)} />
        <Route path="topics" element={withSuspense(<TopicsPage />)} />
        <Route path="learn/topic/:topicId" element={withSuspense(<TopicDetailPage />)} />
        <Route path="learning-hub" element={withSuspense(<LearningHubPage />)} />
        <Route path="pyq" element={withSuspense(<PYQPage />)} />
        <Route path="mocks" element={withSuspense(<MocksPage />)} />
        <Route path="analytics" element={withSuspense(<AnalyticsPage />)} />
        <Route path="mentor" element={withSuspense(<AIMentorPage />)} />
        <Route path="notes" element={withSuspense(<NotesPage />)} />
        <Route path="planner" element={withSuspense(<StudyPlannerPage />)} />
        <Route path="formulas" element={withSuspense(<FormulaSheetPage />)} />
        <Route path="resources" element={withSuspense(<ResourcesPage />)} />
        <Route path="revision" element={withSuspense(<RevisionPage />)} />
        <Route path="productivity" element={withSuspense(<ProductivityPage />)} />
        <Route path="settings" element={withSuspense(<SettingsPage />)} />
        <Route path="admin" element={<AdminRoute>{withSuspense(<AdminPage />)}</AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
