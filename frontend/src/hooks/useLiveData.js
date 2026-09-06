// Hook for fetching live GATE data
import { useState, useEffect, useCallback, useRef } from 'react';
import { liveDataService } from '../services/api';

export function useLiveData(refreshInterval = 1800000, enabled = true) { // Default to 30 mins
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('gatenexa_cached_live_data');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const inFlightRef = useRef(null);

  const fetchData = useCallback(async (showLoading = false) => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const request = (async () => {
      try {
        if (showLoading) setLoading(true);
        const res = await liveDataService.getDashboard();
        const freshData = res.data.data;

        setData(prevData => {
          if (prevData && freshData) {
            const hasNewAnnouncements = freshData.announcements?.length > prevData.announcements?.length ||
              (freshData.announcements?.[0]?.contentHash !== prevData.announcements?.[0]?.contentHash);
            if (hasNewAnnouncements) {
              // Intentionally left as a no-op for the current dashboard semantics.
            }
          }

          try { localStorage.setItem('gatenexa_cached_live_data', JSON.stringify(freshData)); } catch {}
          return freshData;
        });
        setError(null);
        return freshData;
      } catch (err) {
        const errMsg = err?.message || 'Failed to load live data';
        setError(errMsg);
        throw err;
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchData(true).catch(() => {});
    const interval = setInterval(() => fetchData(false).catch(() => {}), refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, enabled]);

  return { data, loading, error, refresh: () => fetchData(true).catch(() => {}) };
}

export default useLiveData;
