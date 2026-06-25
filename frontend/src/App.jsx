// src/App.jsx – Main Router
import React, { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useAdminAuth } from './context/AdminAuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import PremiumLoadingScreen from './components/common/PremiumLoadingScreen';
import FocusWidget from './components/common/FocusWidget';
import FloatingAIAssistant from './components/common/FloatingAIAssistant';
import AmbientBackground from './components/common/AmbientBackground';
import InstallPrompt from './components/common/InstallPrompt';

const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const TopicsPage = lazy(() => import('./pages/TopicsPage'));
const TopicDetailPage = lazy(() => import('./pages/TopicDetailPage'));
const PYQPage = lazy(() => import('./pages/PYQPage'));
const MocksPage = lazy(() => import('./pages/MocksPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const StudyPlannerPage = lazy(() => import('./pages/StudyPlannerPage'));
const FormulaSheetPage = lazy(() => import('./pages/FormulaSheetPage'));
// const AdminPage = lazy(() => import('./pages/AdminPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminPdfsPage = lazy(() => import('./pages/admin/AdminPdfsPage'));
const AdminMockTestsPage = lazy(() => import('./pages/admin/AdminMockTestsPage'));
const AdminMockQuestionsPage = lazy(() => import('./pages/admin/AdminMockQuestionsPage'));
const AdminPyqPage = lazy(() => import('./pages/admin/AdminPyqPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminNotificationCenterPage = lazy(() => import('./pages/admin/AdminNotificationCenterPage'));
const AdminFeedbackCenterPage = lazy(() => import('./pages/admin/AdminFeedbackCenterPage'));
const AdminSystemHealthPage = lazy(() => import('./pages/admin/AdminSystemHealthPage'));
const TopicPyqPractice = lazy(() => import('./pages/TopicPyqPractice'));
const ProtectedViewPage = lazy(() => import('./pages/ProtectedViewPage'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const RevisionPage = lazy(() => import('./pages/RevisionPage'));
const ProductivityPage = lazy(() => import('./pages/ProductivityPage'));
const AIMentorPage = lazy(() => import('./pages/AIMentorPage'));
const AICoachPage = lazy(() => import('./pages/AICoachPage'));
const DailyCoachPage = lazy(() => import('./pages/DailyCoachPage'));
const WeakTopicsPage = lazy(() => import('./pages/WeakTopicsPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const SuccessHubPage = lazy(() => import('./pages/SuccessHubPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const MistakeNotebookPage = lazy(() => import('./pages/MistakeNotebookPage'));
const WeeklyTestsPage = lazy(() => import('./pages/WeeklyTestsPage'));
const WeeklyTestDetailPage = lazy(() => import('./pages/WeeklyTestDetailPage'));
const ShortNotesPage = lazy(() => import('./pages/ShortNotesPage'));
const GatePapersPage = lazy(() => import('./pages/GatePapersPage'));
const StudySchedulePage = lazy(() => import('./pages/StudySchedulePage'));
const FinalRevisionHubPage = lazy(() => import('./pages/FinalRevisionHubPage'));
const DoubtSolverPage = lazy(() => import('./pages/DoubtSolverPage'));
const DeepFocusPage = lazy(() => import('./pages/DeepFocusPage'));
const FocusSessionPage = lazy(() => import('./pages/FocusSessionPage'));
const SubjectMocksPage = lazy(() => import('./pages/SubjectMocksPage'));
const MockTestsPage = lazy(() => import('./pages/MockTestsPage'));
const MockTestTakingPage = lazy(() => import('./pages/MockTestTakingPage'));
const MockTestResultPage = lazy(() => import('./pages/MockTestResultPage'));
const SubjectDetailPage = lazy(() => import('./pages/SubjectDetailPage'));
const GateApexAIPage = lazy(() => import('./pages/GateApexAIPage'));
const StudyHubPage = lazy(() => import('./pages/StudyHubPage'));
const AirPredictorPage = lazy(() => import('./pages/AirPredictorPage'));
const GateVaultPage = lazy(() => import('./pages/GateVaultPage'));
const GateVaultPracticePage = lazy(() => import('./pages/GateVaultPracticePage'));
const AdminGateVaultPage = lazy(() => import('./pages/admin/AdminGateVaultPage'));
const AdminCmsPage = lazy(() => import('./pages/admin/AdminCmsPage'));
const AdminQuestionBankPage = lazy(() => import('./pages/admin/AdminQuestionBankPage'));

// New feature pages
const FlashcardReviewPage = lazy(() => import('./pages/FlashcardReviewPage'));
const FlashcardBankPage = lazy(() => import('./pages/FlashcardBankPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const FormulaSheetsPage = lazy(() => import('./pages/FormulaSheetsPage'));
const VideoLecturesPage = lazy(() => import('./pages/VideoLecturesPage'));
const PersonalizedRoadmapPage = lazy(() => import('./pages/PersonalizedRoadmapPage'));

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg mesh-bg">
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="text-text2 text-sm font-medium">Loading GateApex...</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

// Admin route wrapper
const AdminPrivateRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg mesh-bg">
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="text-text2 text-sm font-medium">Loading Admin...</div>
      </div>
    </div>
  );
  return admin ? children : <Navigate to="/admin/login" replace />;
};

const AdminPublicRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg mesh-bg">
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="text-text2 text-sm font-medium">Loading...</div>
      </div>
    </div>
  );
  return admin ? <Navigate to="/admin/dashboard" replace /> : children;
};

// Floating widgets — mounted outside Suspense to prevent DOM reconciliation errors
function AppFloatingWidgets() {
  const { user } = useAuth();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  if (!user) return null;
  return (
    <>
      <AmbientBackground />
      <FocusWidget />
      <FloatingAIAssistant open={aiPanelOpen} setOpen={setAiPanelOpen} />
    </>
  );
}

// Always show landing page on "/"
const HomePageWrapper = () => {
  return <LandingPage />;
};

export default function App() {
  const [initialLoad, setInitialLoad] = useState(true);
  const handleLoadComplete = useCallback(() => {
    setInitialLoad(false);
    document.body.classList.remove('app-loading');
  }, []);

  // Block fixed widgets during loading
  useEffect(() => {
    if (initialLoad) document.body.classList.add('app-loading');
  }, [initialLoad]);

  return (
    <ErrorBoundary>
      {initialLoad && <PremiumLoadingScreen onComplete={handleLoadComplete} />}
      <AppFloatingWidgets />
      <InstallPrompt />
      <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePageWrapper />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      {/* Protected layout */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="GateApex-ai" element={<GateApexAIPage />} />
        <Route path="study-hub" element={<StudyHubPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="learn/topic/:topicId" element={<TopicDetailPage />} />
        <Route path="pyq" element={<PYQPage />} />
        <Route path="mocks" element={<MocksPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="air-predictor" element={<AirPredictorPage />} />
        <Route path="mentor" element={<AIMentorPage />} />
        <Route path="ai-coach" element={<AICoachPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="planner" element={<StudyPlannerPage />} />
        <Route path="formulas" element={<FormulaSheetPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="revision" element={<RevisionPage />} />
        <Route path="productivity" element={<ProductivityPage />} />
        <Route path="daily-coach" element={<DailyCoachPage />} />
        <Route path="weak-topics" element={<WeakTopicsPage />} />
        <Route path="success-hub" element={<SuccessHubPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="mistakes" element={<MistakeNotebookPage />} />
        <Route path="weekly-tests" element={<WeeklyTestsPage />} />
        <Route path="weekly-tests/:testId" element={<WeeklyTestDetailPage />} />
        <Route path="short-notes" element={<ShortNotesPage />} />
        <Route path="gate-papers" element={<GatePapersPage />} />
        <Route path="study-schedule" element={<StudySchedulePage />} />
        <Route path="final-revision" element={<FinalRevisionHubPage />} />
        <Route path="doubt-solver" element={<DoubtSolverPage />} />
        <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
        <Route path="mock-tests" element={<MockTestsPage />} />
        <Route path="mock-tests/:testId/take" element={<MockTestTakingPage />} />
        <Route path="mock-tests/:testId/result" element={<MockTestResultPage />} />
        <Route path="subjects/:subjectId/mocks" element={<SubjectMocksPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="gate-vault" element={<GateVaultPage />} />
        <Route path="gate-vault/practice" element={<GateVaultPracticePage />} />
        <Route path="flashcards" element={<FlashcardReviewPage />} />
        <Route path="flashcard/bank" element={<FlashcardBankPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="formula-sheets" element={<FormulaSheetsPage />} />
        <Route path="video-lectures" element={<VideoLecturesPage />} />
        <Route path="roadmap" element={<PersonalizedRoadmapPage />} />
        <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Admin routes (own layout, separate auth) */}
      <Route path="/admin/login" element={<AdminPublicRoute><AdminLoginPage /></AdminPublicRoute>} />
      <Route path="/admin" element={<AdminPrivateRoute><AdminLayout /></AdminPrivateRoute>}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="pdfs" element={<AdminPdfsPage />} />
        <Route path="mock-tests" element={<AdminMockTestsPage />} />
        <Route path="mock-tests/:testId/questions" element={<AdminMockQuestionsPage />} />
        <Route path="pyq" element={<AdminPyqPage />} />
        <Route path="gate-vault" element={<AdminGateVaultPage />} />
        <Route path="cms" element={<AdminCmsPage />} />
        <Route path="question-bank" element={<AdminQuestionBankPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="notifications" element={<AdminNotificationCenterPage />} />
        <Route path="feedback" element={<AdminFeedbackCenterPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="system-health" element={<AdminSystemHealthPage />} />
        <Route path="pyq-practice" element={<TopicPyqPractice />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Standalone routes (no sidebar) */}
      <Route path="/about" element={<PrivateRoute><AboutPage /></PrivateRoute>} />
      <Route path="/protected/view/:id" element={<PrivateRoute><ProtectedViewPage /></PrivateRoute>} />
      <Route path="/deep-focus" element={<PrivateRoute><DeepFocusPage /></PrivateRoute>} />
      <Route path="/focus-session" element={<PrivateRoute><FocusSessionPage /></PrivateRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}

