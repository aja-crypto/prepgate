import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { aiService } from '../../services/api';
import Icon from '../ui/Icon';
import { computeSubjectCompletion } from '../../utils/gateUtils';

const TYPE_CONFIG = {
  next_study: { icon: 'book', color: 'text-blue-500' },
  revision: { icon: 'refresh', color: 'text-orange-500' },
  weak_area: { icon: 'trending-down', color: 'text-red-500' },
  mock_test: { icon: 'target', color: 'text-purple-500' },
  insight: { icon: 'zap', color: 'text-yellow-500' },
  health: { icon: 'heart', color: 'text-green-500' },
  readiness: { icon: 'award', color: 'text-indigo-500' },
  plan: { icon: 'calendar', color: 'text-cyan-500' },
  mistake_analysis: { icon: 'alert-triangle', color: 'text-rose-500' },
};

export default function AIMentorWidget() {
  const { topics, pyqs, mocks, studyStats, gateFeatures } = useProgress();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchTimerRef = useRef(null);

  useEffect(() => {
    const fetchRecs = async () => {
      // Don't fetch if guest or not logged in
      const isGuest = localStorage.getItem('isGuest') === 'true';
      const hasToken = !!localStorage.getItem('accessToken');
      
      if (!hasToken && !isGuest) {
        setLoading(false);
        return;
      }

      try {
        const currentSubjects = computeSubjectCompletion(studyStats?.subjects || [], topics || [], pyqs || []);
        const overallProgress = Math.round((currentSubjects || []).reduce((s, x) => s + (x.progress || 0), 0) / ((currentSubjects || []).length || 1));
        
        const res = await aiService.getRecommendations({
          subjects: currentSubjects,
          topics: topics || [],
          pyqs: pyqs || [],
          mocks: mocks || [],
          gateFeatures,
          overall: { percentage: overallProgress },
          studyStats
        });
        
        if (res.data.success && res.data.data.recommendations?.length > 0) {
          // Just show the top recommendation in the widget
          setRecommendation(res.data.data.recommendations[0]);
        }
      } catch (error) {
        console.error('Failed to fetch AI recommendation:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce AI fetch to prevent rapid firing on multi-state updates
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(fetchRecs, 1500); // Slightly longer for widget

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [topics, pyqs, mocks, gateFeatures, studyStats]);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-bg-3 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-bg-3 rounded mb-2"></div>
      </div>
    );
  }

  if (!recommendation) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon name="zap" className="w-12 h-12 text-primary" />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text flex items-center gap-2">
            <Icon name="zap" className="w-4 h-4 text-primary" />
            AI Mentor Insight
          </div>
          <div className="text-[10px] text-text3 uppercase tracking-wider">Smart Guidance</div>
        </div>
        <Link to="/mentor" className="text-[10px] text-primary hover:underline z-10">View Full Dashboard →</Link>
      </div>

      <div className="flex gap-3 items-start">
        <div className={`p-2 rounded-lg bg-bg-3 ${TYPE_CONFIG[recommendation.type]?.color || 'text-primary'}`}>
          <Icon name={TYPE_CONFIG[recommendation.type]?.icon || 'zap'} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-text truncate">{recommendation.title}</div>
          <p className="text-[11px] text-text2 mt-1 line-clamp-2 leading-relaxed">
            {recommendation.content}
          </p>
        </div>
      </div>
    </div>
  );
}
