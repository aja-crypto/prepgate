// Hook for fetching live GATE data
import { useState, useEffect, useCallback, useRef } from 'react';
import { liveDataService } from '../services/api';

export function useLiveData(refreshInterval = 900000) { // Default to 15 mins
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem('cachedLiveData');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await liveDataService.getDashboard();
      if (!mountedRef.current) return;
      const freshData = res.data.data;
      
      setData(prevData => {
        if (prevData && freshData) {
          const hasNewAnnouncements = freshData.announcements?.length > prevData.announcements?.length ||
            (freshData.announcements?.[0]?.contentHash !== prevData.announcements?.[0]?.contentHash);
          if (hasNewAnnouncements) {
            console.log('New GATE updates available!');
          }
        }
        localStorage.setItem('cachedLiveData', JSON.stringify(freshData));
        return freshData;
      });
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Failed to load live data');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData(true);
    const interval = setInterval(() => fetchData(false), refreshInterval);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refresh: () => fetchData(true) };
}

export default useLiveData;
