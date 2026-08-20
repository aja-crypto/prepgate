// src/App.jsx – Main Router
import React, { Suspense, lazy, useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthData, useAuthActions } from './context/AuthContext';
import { useAdminAuth } from './context/AdminAuthContext';
import Layout from './components/common/Layout';
import DiagnosticsModal from './components/common/DiagnosticsModal';
import { useDiagnostics } from './context/DiagnosticsContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import PremiumLoadingScreen from './components/common/PremiumLoadingScreen';
import FloatingAIAssistant from './components/common/FloatingAIAssistant';
import AmbientBackground from './components/common/AmbientBackground';
import InstallPrompt from './components/common/InstallPrompt';
import WelcomeManager from './components/onboarding/WelcomeManager';
import PremiumGateDialog from './components/referral/PremiumGateDialog';
import CelebrationAnimation from './components/referral/CelebrationAnimation';
import BrandIntroModal from './components/common/BrandIntroModal';
import AiIntroModal, { shouldShowAiIntro } from './components/common/AiIntroModal';
import { SkeletonDashboard, SkeletonSubjectGrid, SkeletonTable } from './components/ui/SkeletonLoader';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
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
const PlatformPage = lazy(() => import('./pages/PlatformPage'));
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
const InsightDetailPage = lazy(() => import('./pages/InsightDetailPage'));
const InsightReportPage = lazy(() => import('./pages/InsightReportPage'));
const InsightsHub = lazy(() => import('./pages/InsightsHub'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
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
const GateNexaAIPage = lazy(() => import('./pages/GateNexaAIPage'));
const StudyHubPage = lazy(() => import('./pages/StudyHubPage'));
const AirPredictorPage = lazy(() => import('./pages/AirPredictorPage'));
const GateVaultPage = lazy(() => import('./pages/GateVaultPage'));
const GateVaultPracticePage = lazy(() => import('./pages/GateVaultPracticePage'));
const AdminGateVaultPage = lazy(() => import('./pages/admin/AdminGateVaultPage'));
const AdminCmsPage = lazy(() => import('./pages/admin/AdminCmsPage'));
const AdminQuestionBankPage = lazy(() => import('./pages/admin/AdminQuestionBankPage'));
const AdminPredictorPage = lazy(() => import('./pages/admin/AdminPredictorPage'));
const AdminLearningHubPage = lazy(() => import('./pages/admin/AdminLearningHubPage'));

// New feature pages
const FlashcardReviewPage = lazy(() => import('./pages/FlashcardReviewPage'));
const FlashcardBankPage = lazy(() => import('./pages/FlashcardBankPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const FormulaSheetsPage = lazy(() => import('./pages/FormulaSheetsPage'));
const VideoLecturesPage = lazy(() => import('./pages/VideoLecturesPage'));
const PersonalizedRoadmapPage = lazy(() => import('./pages/PersonalizedRoadmapPage'));
const OpportunityPredictorPage = lazy(() => import('./pages/OpportunityPredictorPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const PremiumPage = lazy(() => import('./pages/PremiumPage'));
const ReferralDashboardPage = lazy(() => import('./pages/ReferralDashboardPage'));
const LearningHubPage = lazy(() => import('./pages/LearningHubPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'));

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuthData();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg mesh-bg">
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><path d="M10 22V10l6 6 6-6v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="text-text2 text-sm font-medium">Loading GateNexa...</div>
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

// Fallback for unmatched /admin/* subroutes — keeps the admin shell mounted instead of a silent blank main area
function AdminNoMatch() {
  return (
    <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <h1 className="text-lg font-bold text-text">Admin section not found</h1>
        <p className="text-sm text-text3 mt-1">This admin area does not exist. Use the sidebar to navigate.</p>
      </div>
    </div>
  );
}

// Floating widgets — mounted outside Suspense to prevent DOM reconciliation errors
function AppFloatingWidgets() {
  const { user, showReferralModal, showCelebration } = useAuthData();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiIntroOpen, setAiIntroOpen] = useState(false);
  const [brandIntroOpen, setBrandIntroOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isPremium = user?.isPremium || false;
  const showGate = showReferralModal && !isAdmin && !isPremium;

  // Show AI intro on first login (when user first becomes available)
  useEffect(() => {
    if (user && shouldShowAiIntro() && !aiIntroOpen) {
      setAiIntroOpen(true);
    }
  }, [user]);

  // Listen for brand intro trigger from Layout
  useEffect(() => {
    const handler = () => setBrandIntroOpen(true);
    window.addEventListener('open-brand-intro', handler);
    return () => window.removeEventListener('open-brand-intro', handler);
  }, []);

  // AI intro completion handler
  const handleAiIntroComplete = useCallback(() => {
    setAiPanelOpen(true);
    setAiIntroOpen(false);
  }, []);

  const path = window.location.pathname;
  if (!user) return null;
  // Don't show on landing page, public auth pages, or focused flow pages
  const hideOn = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/feedback', '/about', '/help'];
  const hideOnAi = path === '/mentor' || path === '/ai-coach';
  const hideFloatingWidgets = path.startsWith('/legal/');
  if (hideOn.includes(path) || hideFloatingWidgets) {
    // Still allow brand intro to show
    return <BrandIntroModal open={brandIntroOpen} onClose={() => setBrandIntroOpen(false)} />;
  }
  return (
    <>
      {aiIntroOpen && <AiIntroModal onComplete={handleAiIntroComplete} />}
      <BrandIntroModal open={brandIntroOpen} onClose={() => setBrandIntroOpen(false)} />
      <AmbientBackground />
      {localStorage.getItem('gatenexa_ai_fab') !== 'false' && !hideOnAi && (
        <FloatingAIAssistant open={aiPanelOpen} setOpen={setAiPanelOpen} />
      )}
      {showGate && <PremiumGateDialog />}
      {showCelebration && <CelebrationAnimation />}
      <InstallPrompt />
    </>
  );
}

// Always show landing page on "/"
const HomePageWrapper = () => {
  return <LandingPage />;
};

// Route prefetching - preload ONLY the top 5 most critical routes on idle for instant navigation
function RoutePrefetcher() {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        import('./pages/DashboardPage');
        import('./pages/SubjectsPage');
        import('./pages/AIMentorPage');
        import('./pages/OpportunityPredictorPage');
        import('./pages/LearningHubPage');
      }, { timeout: 3000 });
    }
  }, []);
  return null;
}

export default function App() {
  const [initialLoad, setInitialLoad] = useState(true);
  const location = useLocation();
  const { openDiagnostics } = useDiagnostics();

  useEffect(() => {
    window.__openDiagnostics = openDiagnostics;
    return () => { delete window.__openDiagnostics; };
  }, [openDiagnostics]);
  const handleLoadComplete = useCallback(() => {
    setInitialLoad(false);
    document.body.classList.remove('app-loading');
  }, []);

  useEffect(() => {
    if (initialLoad) document.body.classList.add('app-loading');
  }, [initialLoad]);

  const routeFallback = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="w-8 h-8 rounded-xl border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-text3 font-medium">Loading GateNexa...</p>
      </div>
    </div>
  ), []);

  return (
    <ErrorBoundary name="App">
      {initialLoad && <PremiumLoadingScreen onComplete={handleLoadComplete} />}
      <RoutePrefetcher />
      <AppFloatingWidgets />
      <WelcomeManager>
      <Suspense fallback={routeFallback}>
      <Routes location={location}>
      {/* Public routes */}
      <Route path="/" element={<HomePageWrapper />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      {/* Protected layout */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={<ErrorBoundary key="dashboard"><DashboardPage /></ErrorBoundary>} />
        <Route path="GateNexa-ai" element={<Navigate to="/mentor" replace />} />
        <Route path="study-hub" element={<StudyHubPage />} />
        <Route path="subjects" element={<ErrorBoundary key="subjects"><SubjectsPage /></ErrorBoundary>} />
        <Route path="topics" element={<ErrorBoundary key="topics"><TopicsPage /></ErrorBoundary>} />
        <Route path="learn/topic/:topicId" element={<TopicDetailPage />} />
        <Route path="pyq" element={<ErrorBoundary key="pyq"><PYQPage /></ErrorBoundary>} />
        <Route path="mocks" element={<MocksPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="air-predictor" element={<AirPredictorPage />} />
        <Route path="mentor" element={<ErrorBoundary key="ai"><GateNexaAIPage /></ErrorBoundary>} />
        <Route path="ai-coach" element={<AICoachPage />} />
        <Route path="notes" element={<ErrorBoundary key="notes"><NotesPage /></ErrorBoundary>} />
        <Route path="planner" element={<StudyPlannerPage />} />
        <Route path="formulas" element={<FormulaSheetPage />} />
        <Route path="revision" element={<RevisionPage />} />
        <Route path="productivity" element={<ProductivityPage />} />
        <Route path="daily-coach" element={<DailyCoachPage />} />
        <Route path="weak-topics" element={<WeakTopicsPage />} />
        <Route path="success-hub" element={<SuccessHubPage />} />
        <Route path="insights" element={<InsightsHub />} />
        <Route path="insights/topic/:slug" element={<InsightDetailPage />} />
        <Route path="insights/:slug" element={<InsightReportPage />} />
        <Route path="insights-hub" element={<InsightsHub />} />
        <Route path="mistakes" element={<MistakeNotebookPage />} />
        <Route path="weekly-tests" element={<WeeklyTestsPage />} />
        <Route path="weekly-tests/:subjectCode" element={<WeeklyTestDetailPage />} />
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
        <Route path="settings" element={<ErrorBoundary key="settings"><SettingsPage /></ErrorBoundary>} />
        <Route path="gate-vault" element={<GateVaultPage />} />
        <Route path="gate-vault/practice" element={<GateVaultPracticePage />} />
        <Route path="flashcards" element={<FlashcardReviewPage />} />
        <Route path="flashcard/bank" element={<FlashcardBankPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="formula-sheets" element={<FormulaSheetsPage />} />
        <Route path="video-lectures" element={<VideoLecturesPage />} />
        <Route path="roadmap" element={<PersonalizedRoadmapPage />} />
        <Route path="opportunity-predictor" element={<OpportunityPredictorPage />} />
        <Route path="predictor" element={<OpportunityPredictorPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="premium" element={<PremiumPage />} />
        <Route path="referral" element={<ReferralDashboardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="learning-hub" element={<LearningHubPage />} />
      </Route>

      {/* Full-screen routes (no sidebar) */}

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
        <Route path="predictor" element={<AdminPredictorPage />} />
        <Route path="learning-hub" element={<AdminLearningHubPage />} />
        <Route path="pyq-practice" element={<TopicPyqPractice />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Public pages (no login required) */}
      <Route path="/legal/:pageId" element={<LegalPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/study-resources" element={<ResourcesPage />} />
      {/* Standalone routes (no sidebar) */}
      <Route path="/platform" element={<PlatformPage />} />
      <Route path="/protected/view/:id" element={<PrivateRoute><ProtectedViewPage /></PrivateRoute>} />
      <Route path="/deep-focus" element={<PrivateRoute><DeepFocusPage /></PrivateRoute>} />
      <Route path="/focus-session" element={<PrivateRoute><FocusSessionPage /></PrivateRoute>} />

      {/* Error pages */}
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
    </WelcomeManager>
    <DiagnosticsModal />
    </ErrorBoundary>
  );
}

