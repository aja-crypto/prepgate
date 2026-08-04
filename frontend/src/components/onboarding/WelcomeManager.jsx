import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import PremiumOnboarding from './PremiumOnboarding';
import DailyWelcomePopup from './DailyWelcomePopup';
import MilestoneCelebration from './MilestoneCelebration';

// Pages where full-screen welcome popups would cover interactive flows.
// Feedback is a public multi-step wizard — a modal must never hide it.
const NO_POPUP_ROUTES = ['/feedback', '/login', '/register'];

export default function WelcomeManager({ children }) {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [welcomeData, setWelcomeData] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasShown, setHasShown] = useState(false);

  const isFlowPage = NO_POPUP_ROUTES.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));

  useEffect(() => {
    if (!user || authLoading || hasShown) return;
    setHasShown(true);

    // Fetch welcome status
    api.get('/auth/daily-welcome').then(r => {
      const data = r.data.data;
      if (!data) { setLoading(false); return; }
      setWelcomeData(data);

      if (data.showOnboarding) {
        setShowOnboarding(true);
      } else if (data.isNewDay) {
        setShowDaily(true);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // Check milestones
    api.get('/auth/check-milestones').then(r => {
      const ms = r.data.data.milestones;
      if (ms?.length > 0) {
        setMilestones(ms);
        setCurrentMilestone(ms[0]);
      }
    }).catch(() => {});
  }, [user, authLoading, hasShown]);

  const completeOnboarding = useCallback(async (skipped = false) => {
    try {
      await api.post('/auth/complete-onboarding', { skipped });
    } catch {}
    setShowOnboarding(false);
  }, []);

  const dismissDaily = useCallback(async () => {
    try {
      await api.post('/auth/complete-onboarding', { skipped: false });
    } catch {}
    setShowDaily(false);
  }, []);

  const startPlan = useCallback(() => {
    setShowDaily(false);
    nav('/planner');
  }, [nav]);

  const dismissMilestone = useCallback(() => {
    const idx = milestones.indexOf(currentMilestone);
    if (idx < milestones.length - 1) {
      setCurrentMilestone(milestones[idx + 1]);
    } else {
      setCurrentMilestone(null);
    }
  }, [milestones, currentMilestone]);

  if (loading || authLoading) return <>{children}</>;

  // Never cover interactive flow pages with full-screen welcome popups.
  if (isFlowPage) return <>{children}</>;

  return (
    <>
      {children}

      {showOnboarding && (
        <PremiumOnboarding
          onComplete={() => completeOnboarding(false)}
          onSkip={() => completeOnboarding(true)}
        />
      )}

      {!showOnboarding && showDaily && welcomeData && (
        <DailyWelcomePopup
          data={welcomeData}
          onDismiss={dismissDaily}
          onStartPlan={startPlan}
        />
      )}

      {!showOnboarding && !showDaily && currentMilestone && (
        <MilestoneCelebration
          milestone={currentMilestone}
          onDismiss={dismissMilestone}
        />
      )}
    </>
  );
}
