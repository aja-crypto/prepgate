// src/App.jsx – Main Router
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import SubjectsPage from './pages/SubjectsPage';
import TopicsPage from './pages/TopicsPage';
import TopicDetailPage from './pages/TopicDetailPage';
import PYQPage from './pages/PYQPage';
import MocksPage from './pages/MocksPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotesPage from './pages/NotesPage';
import StudyPlannerPage from './pages/StudyPlannerPage';
import FormulaSheetPage from './pages/FormulaSheetPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import ResourcesPage from './pages/ResourcesPage';
import RevisionPage from './pages/RevisionPage';
import ProductivityPage from './pages/ProductivityPage';
import AIMentorPage from './pages/AIMentorPage';

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg mesh-bg">
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="text-text2 text-sm font-medium">Loading PrepFlow...</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

// Admin route wrapper
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="learn/topic/:topicId" element={<TopicDetailPage />} />
        <Route path="pyq" element={<PYQPage />} />
        <Route path="mocks" element={<MocksPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="mentor" element={<AIMentorPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="planner" element={<StudyPlannerPage />} />
        <Route path="formulas" element={<FormulaSheetPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="revision" element={<RevisionPage />} />
        <Route path="productivity" element={<ProductivityPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
