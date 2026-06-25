// Hook for fetching live GATE data
import { useState, useEffect, useCallback } from 'react';
import { liveDataService } from '../services/api';

export function useLiveData(refreshInterval = 1800000) { // Default to 30 mins
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem('gateapex_cached_live_data');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await liveDataService.getDashboard();
      const freshData = res.data.data;
      
      setData(prevData => {
        // Check for new updates to notify user
        if (prevData && freshData) {
          const hasNewAnnouncements = freshData.announcements?.length > prevData.announcements?.length ||
            (freshData.announcements?.[0]?.contentHash !== prevData.announcements?.[0]?.contentHash);
          
          if (hasNewAnnouncements) {
            console.log('New GATE updates available!');
          }
        }
        
        localStorage.setItem('gateapex_cached_live_data', JSON.stringify(freshData));
        return freshData;
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load live data');
    } finally {
      setLoading(false);
    }
  }, []); // Remove data from dependencies to prevent loop

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), refreshInterval); // Auto-refresh every 30 mins
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refresh: () => fetchData(true) };
}

export default useLiveData;
