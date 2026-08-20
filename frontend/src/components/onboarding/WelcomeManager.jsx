import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthData } from '../../context/AuthContext';
import { api } from '../../services/api';
import MilestoneCelebration from './MilestoneCelebration';

// Pages where full-screen popups would cover interactive flows.
const NO_POPUP_ROUTES = ['/feedback', '/login', '/register'];

export default function WelcomeManager({ children }) {
  const { user, loading: authLoading } = useAuthData();
  const location = useLocation();
  const [milestones, setMilestones] = useState([]);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasShown, setHasShown] = useState(false);

  const isFlowPage = NO_POPUP_ROUTES.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));

  useEffect(() => {
    if (!user || authLoading || hasShown) return;
    setHasShown(true);

    // Check milestones only
    api.get('/auth/check-milestones').then(r => {
      const ms = r.data.data.milestones;
      if (ms?.length > 0) {
        setMilestones(ms);
        setCurrentMilestone(ms[0]);
      }
    }).catch(() => {});
    setLoading(false);
  }, [user, authLoading, hasShown]);

  const dismissMilestone = () => {
    const idx = milestones.indexOf(currentMilestone);
    if (idx < milestones.length - 1) {
      setCurrentMilestone(milestones[idx + 1]);
    } else {
      setCurrentMilestone(null);
    }
  };

  if (loading || authLoading) return <>{children}</>;

  // Never cover interactive flow pages with full-screen popups.
  if (isFlowPage) return <>{children}</>;

  return (
    <>
      {children}
      {currentMilestone && (
        <MilestoneCelebration
          milestone={currentMilestone}
          onDismiss={dismissMilestone}
        />
      )}
    </>
  );
}