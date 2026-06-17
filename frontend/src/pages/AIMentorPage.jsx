import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { aiService } from '../services/api';
import { MentorLoading } from '../components/common/GateLoadingScreen';
import toast from 'react-hot-toast';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import ProgressRing from '../components/ui/ProgressRing';
import { computeSubjectCompletion, computeReadinessScore, computeCompletionForecast } from '../utils/gateUtils';

import AICoachChat from '../components/gate/AICoachChat';
import NextTopicRecommendation from '../components/gate/NextTopicRecommendation';

function localHeuristicRecommendations(data) {
  const { subjects = [], topics = [], pyqs = [], mocks = [], studyStats = {} } = data;
  const overall = data.overall?.percentage || 0;
  const weakSubjects = subjects.filter(s => s.progress < 50).sort((a, b) => a.progress - b.progress);
  const incomplete = topics.filter(t => !t.done);
  const avgMock = mocks.length > 0 ? mocks.reduce((a, m) => a + (m.score || 0), 0) / mocks.length : 0;
  const weeklyHours = studyStats.weeklyHours || [];
  const totalHours = weeklyHours.reduce((a, b) => a + b, 0);

  return {
    recommendations: [
      weakSubjects.length > 0 ? {
        type: 'weak_area', title: `Focus on ${weakSubjects[0].name}`,
        content: `Your ${weakSubjects[0].name} progress is ${weakSubjects[0].progress}%. Dedicate 2 hours daily to improve this.`,
        action: '/subjects'
      } : {
        type: 'readiness', title: 'Strong Progress',
        content: 'All subjects above 50%. Maintain consistency with PYQ practice.', action: '/analytics'
      },
      incomplete.length > 0 ? {
        type: 'next_study', title: `Study: ${incomplete[0].name}`,
        content: `Next topic: "${incomplete[0].name}" in ${incomplete[0].subject}. High-weightage area for GATE.`,
        action: '/topics'
      } : {
        type: 'plan', title: 'Review Phase',
        content: 'All topics covered. Focus on mock tests and full-length revisions.', action: '/dashboard'
      },
      {
        type: 'mock_test', title: avgMock > 0 ? 'Keep Taking Mocks' : 'Start Mock Tests',
        content: avgMock > 0 ? `Your avg mock score is ${Math.round(avgMock)}%. Take 1 full-length mock weekly.` : 'You haven\'t taken any mock tests. Start with a subject-wise mock today.',
        action: '/mocks'
      },
      {
        type: 'plan', title: 'Daily Focus',
        content: `1. ${weakSubjects[0]?.name || 'Core subject'} (2h) | 2. PYQ practice (1h) | 3. Revision (30m)`,
        action: '/dashboard'
      },
      {
        type: 'health', title: totalHours > 40 ? 'Burnout Risk' : 'Consistency Check',
        content: totalHours > 40 ? 'High study volume detected. Take breaks to maintain focus.' : 'Aim for 3-4 hours daily for steady progress.',
        action: '/productivity'
      },
    ],
    analysis: {
      scores: {
        mentor: Math.round((overall + (avgMock || overall)) / 2),
        readiness: Math.round(overall),
        consistency: Math.round(Math.min(100, (weeklyHours.filter(h => h > 0).length / 7) * 100)),
        revisionHealth: Math.round(Math.min(100, pyqs.length > 0 ? (pyqs.filter(p => !p.revisionNeeded).length / pyqs.length) * 100 : 0)),
        mockPerformance: Math.round(avgMock)
      },
      predictions: {
        score: Math.round(Math.min(100, (overall * 0.4) + (avgMock * 0.4) + 20)),
        rank: Math.round(Math.pow(10, (100 - Math.min(100, (overall * 0.4) + (avgMock * 0.4) + 20)) / 25) * 100),
        admissions: overall > 70 ? 'High chance for Top IITs' : overall > 40 ? 'Good chance for NITs' : 'Focus on core subjects first'
      },
      riskLevel: overall < 30 ? 'High' : overall < 60 ? 'Medium' : 'Low'
    }
  };
}

const toWeeklyHours = (value) => (Array.isArray(value) ? value : []);

const TYPE_CONFIG = {
  next_study: { icon: 'book', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  revision: { icon: 'refresh', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  weak_area: { icon: 'trending-down', color: 'text-red-500', bg: 'bg-red-500/10' },
  mock_test: { icon: 'target', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  insight: { icon: 'zap', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  health: { icon: 'heart', color: 'text-green-500', bg: 'bg-green-500/10' },
  readiness: { icon: 'award', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  plan: { icon: 'calendar', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  mistake_analysis: { icon: 'alert-triangle', color: 'text-rose-500', bg: 'bg-rose-500/10' },
};

const MorningBriefing = ({ subjects, topics, pyqs, gateFeatures, forecast }) => {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const targets = useMemo(() => {
    const list = [];
    const weakSub = [...subjects].sort((a, b) => a.progress - b.progress)[0];
    if (weakSub) list.push(`Focus on ${weakSub.name} fundamentals`);
    
    const overdue = pyqs.filter(p => p.revisionNeeded).length;
    if (overdue > 0) list.push(`Clear ${overdue} pending revisions`);
    
    list.push("Complete at least 5 new PYQs");
    return list;
  }, [subjects, pyqs]);

  return (
    <GlassCard className="border-l-4 border-l-yellow-500 bg-yellow-500/5" padding="p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-yellow-500/10 rounded-xl">
          <Icon name="sun" className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-text">Morning Briefing</h2>
              <p className="text-xs text-text3">{today}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-text3 uppercase tracking-wider">Exam Readiness</p>
              <p className="text-lg font-bold text-primary">{forecast.readiness}%</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-text2 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                Today's Study Targets
              </h3>
              <ul className="space-y-2">
                {targets.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text2">
                    <Icon name="check-circle" className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-text2 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-orange-500" />
                Revision Due Today
              </h3>
              <p className="text-sm text-text2">
                {pyqs.filter(p => p.revisionNeeded).length > 0 
                  ? `You have ${pyqs.filter(p => p.revisionNeeded).length} topics that need immediate recall practice.`
                  : "All revisions are up to date! Focus on new concepts today."}
              </p>
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase mb-1">Coach's Tip</p>
                <p className="text-xs text-text2 italic">"Consistency beats intensity. Even 2 hours of focused study is better than 8 hours of distracted reading."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

const AIMentorPage = () => {
  const navigate = useNavigate();
  const { topics, pyqs, mocks, studyStats, gateFeatures, revisionSchedule } = useProgress();
  const [recommendations, setRecommendations] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [coachPrompt, setCoachPrompt] = useState(null);

  const subjects = useMemo(
    () => computeSubjectCompletion(studyStats?.subjects || [], topics || [], pyqs || []),
    [studyStats?.subjects, topics, pyqs]
  );

  const overall = useMemo(() => {
    if (!subjects.length) return 0;
    return Math.round(subjects.reduce((s, x) => s + x.progress, 0) / subjects.length);
  }, [subjects]);

  const readiness = useMemo(
    () => computeReadinessScore(topics, pyqs, mocks, gateFeatures?.streak),
    [topics, pyqs, mocks, gateFeatures?.streak]
  );

  const forecast = useMemo(
    () => computeCompletionForecast(topics, gateFeatures),
    [topics, gateFeatures]
  );

  const fetchTimerRef = useRef(null);
  const abortRef = useRef(null);

  const stableTopics = useMemo(() => topics, []);
  const stablePyqs = useMemo(() => pyqs, []);
  const stableMocks = useMemo(() => mocks, []);

  useEffect(() => {
    if (!localStorage.getItem('accessToken') && localStorage.getItem('isGuest') !== 'true') return;

    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    if (abortRef.current) abortRef.current.abort();

    fetchTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const res = await aiService.getRecommendations({
          subjects: subjects || [],
          topics: stableTopics || [],
          pyqs: stablePyqs || [],
          mocks: stableMocks || [],
          gateFeatures: gateFeatures || {},
          overall: { percentage: overall || 0 },
          studyStats: studyStats || {}
        });
        if (controller.signal.aborted) return;
        if (res.data.success) {
          setRecommendations(res.data.data.recommendations);
          setAnalysis(res.data.data.analysis);
          setAiError(res.data.data.aiError || null);
        }
      } catch (error) {
        if (error.name === 'CanceledError' || controller.signal.aborted) return;
        const fallback = localHeuristicRecommendations({
          subjects: subjects || [],
          topics: stableTopics || [],
          pyqs: stablePyqs || [],
          mocks: stableMocks || [],
          overall: { percentage: overall || 0 },
          studyStats: studyStats || {}
        });
        setRecommendations(fallback.recommendations);
        setAnalysis(fallback.analysis);
        setAiError(null);
      } finally {
        if (!abortRef.current?.signal.aborted) setLoading(false);
      }
    }, 500);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [subjects, overall, gateFeatures, studyStats, refreshKey]);

  const smartMessages = useMemo(() => {
    const msgs = [];
    
    // 1. Accuracy drop check
    if (pyqs.length > 10) {
      const recent = pyqs.slice(-10);
      const recentAccuracy = (recent.filter(p => p.status === 'correct').length / 10) * 100;
      if (recentAccuracy < 60) {
        msgs.push({
          text: `Your recent PYQ accuracy has dropped to ${recentAccuracy}%. Review the fundamental concepts.`,
          type: 'warning'
        });
      }
    }

    // 2. Burnout/Low study hours
    const totalHours = toWeeklyHours(studyStats?.weeklyHours).reduce((a, b) => a + b, 0);
    if (totalHours > 60) {
      msgs.push({ text: "High study volume! Take a break to avoid burnout.", type: 'health' });
    }

    // 3. Streak
    if ((gateFeatures?.streak?.current || 0) > 5) {
      msgs.push({ text: `Incredible! You are on a ${gateFeatures?.streak?.current || 0}-day streak.`, type: 'success' });
    }

    // 4. Overdue revisions (Specific example: Deadlocks)
    const overdueCount = pyqs.filter(p => p.revisionNeeded).length;
    if (overdueCount > 0) {
      const firstOverdue = pyqs.find(p => p.revisionNeeded);
      msgs.push({ text: `You have ${overdueCount} items overdue for revision, including "${firstOverdue?.title || 'key topics'}".`, type: 'info' });
    }

    // 5. Syllabus completion projection
    if (overall < 100) {
      msgs.push({ text: `Based on your current progress, you can finish the syllabus by ${forecast.forecastDate}.`, type: 'success' });
    }

    // 6. Imbalance detection
    const strongSubject = [...subjects].sort((a, b) => b.progress - a.progress)[0];
    const weakSubject = [...subjects].sort((a, b) => a.progress - b.progress)[0];
    if (strongSubject && strongSubject.progress > 80 && weakSubject && weakSubject.progress < 20) {
      msgs.push({ text: `You are spending a lot of time on ${strongSubject.name}. Shift focus to ${weakSubject.name} this week.`, type: 'warning' });
    }

    // 7. AI Reality Check (Brutal honesty)
    const daysToExam = Math.max(1, (new Date('2027-02-01') - new Date()) / (1000 * 60 * 60 * 24));
    const requiredDailyHours = ((100 - overall) / 100) * 800 / (daysToExam / 30); // Rough estimate: 800 hours total
    if (requiredDailyHours > 8 && overall < 50) {
      msgs.push({ 
        text: `REALITY CHECK: At your current pace, you need ${requiredDailyHours.toFixed(1)} hours daily to finish. You're falling behind!`, 
        type: 'mistake_analysis' 
      });
    }

    // 8. Motivation Boost
    if ((gateFeatures?.streak?.current ?? 0) === 0 && studyStats?.lastStudyDate) {
      msgs.push({ text: "Don't let your progress slip! Start a small 15-minute session today to get back on track.", type: 'insight' });
    }

    return msgs;
  }, [pyqs, studyStats, gateFeatures, overall, forecast.forecastDate, subjects]);

  const strongestSubject = useMemo(
    () => [...subjects].sort((a, b) => b.progress - a.progress)[0],
    [subjects]
  );

  const weakestSubject = useMemo(
    () => [...subjects].sort((a, b) => a.progress - b.progress)[0],
    [subjects]
  );

  const pyqAccuracy = useMemo(() => {
    if (!pyqs || pyqs.length === 0) return 0;
    const correct = pyqs.filter(p => p.status === 'correct' || p.solved).length;
    return Math.round((correct / pyqs.length) * 100);
  }, [pyqs]);

  const planSteps = useMemo(() => {
    const planContent = recommendations.find((r) => r.type === 'plan')?.content;
    if (typeof planContent !== 'string') return [];
    return planContent.split('|').map((step) => step.trim()).filter(Boolean);
  }, [recommendations]);

  const weeklyTotal = toWeeklyHours(studyStats?.weeklyHours).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-1">AI Mentor</p>
          <h1 className="text-3xl font-bold text-text tracking-tight">Personal GATE Coach</h1>
          <p className="text-sm text-text3 mt-1">Real-time analysis of your preparation journey</p>
        </div>
        <div className="flex gap-2">
          {(gateFeatures?.streak?.current || 0) > 0 && (
            <div className="bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-lg border border-orange-500/20 flex items-center gap-2">
              <Icon name="zap" className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold">{gateFeatures?.streak?.current || 0} DAY STREAK</span>
            </div>
          )}
        </div>
      </div>

      <MorningBriefing 
        subjects={subjects}
        topics={topics}
        pyqs={pyqs}
        gateFeatures={gateFeatures}
        forecast={{ ...forecast, readiness }}
      />

      <GlassCard padding="p-4" className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="zap" className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-text">Quick Actions</span>
          <span className="text-[10px] text-text3 ml-auto">Click to ask AI Coach</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'What should I study today?', icon: 'book' },
            { label: 'Which subject needs most attention?', icon: 'trending-down' },
            { label: 'Create a study plan for this week', icon: 'calendar' },
            { label: 'How can I improve my weak areas?', icon: 'alert-triangle' },
            { label: "What's my predicted rank?", icon: 'award' },
            { label: 'Give me a revision schedule', icon: 'refresh' },
            { label: 'How to prepare for mock tests?', icon: 'target' },
            { label: 'Which PYQs should I practice?', icon: 'file-text' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => setCoachPrompt(item.label)}
              className="flex items-center gap-1.5 px-3 py-2 bg-bg-2 border border-border rounded-xl text-sm text-text3 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <Icon name={item.icon} className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="border-primary/20 bg-primary/5" padding="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-text">AI Mentor Memory</h2>
            <p className="text-xs text-text3">Personalization context used for recommendations</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">Live</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Weak', value: weakestSubject?.name || 'N/A' },
            { label: 'Strong', value: strongestSubject?.name || 'N/A' },
            { label: 'Revisions', value: `${(revisionSchedule || []).filter((r) => r.status !== 'done').length} due` },
            { label: 'Mocks', value: `${mocks.length} logged` },
            { label: 'Study Hours', value: `${weeklyTotal}h/week` },
          ].map((item) => (
            <div key={item.label} className="bg-bg-2 border border-border rounded-xl p-3">
              <div className="text-[9px] uppercase tracking-wider text-text3">{item.label}</div>
              <div className="text-sm font-semibold text-text mt-1 truncate">{item.value}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <NextTopicRecommendation
            topicName={subjects.find(s => s.progress < 70)?.name || "Data Structures & Algorithms"}
            confidence={Math.min(95, 95 - (subjects.find(s => s.progress < 70)?.progress || 0))}
            expectedGain={`+${Math.max(5, Math.ceil(100 - (subjects.find(s => s.progress < 70)?.progress || 0)))} marks`}
            onStartLearning={() => navigate("/topics")}
          />
        </div>
        <div className="lg:col-span-2"></div>
      </div>

      {aiError && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-text2">
          <span className="font-semibold text-amber-600">AI Note: </span>
          {aiError}
        </div>
      )}

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="flex flex-col items-center text-center py-6" glow>
          <div className="text-3xl font-bold text-primary mb-1">{analysis?.scores?.mentor || 0}</div>
          <div className="text-[10px] text-text3 uppercase tracking-wider font-bold">Mentor Score</div>
        </GlassCard>

        <GlassCard className="flex flex-col items-center text-center py-6" glow>
          <div className="text-3xl font-bold text-success mb-1">{analysis?.predictions?.score || 0}</div>
          <div className="text-[10px] text-text3 uppercase tracking-wider font-bold">Predicted Marks</div>
        </GlassCard>

        <GlassCard className="flex flex-col items-center text-center py-6" glow>
          <div className="text-3xl font-bold text-orange-500 mb-1">#{analysis?.predictions?.rank || '—'}</div>
          <div className="text-[10px] text-text3 uppercase tracking-wider font-bold">Predicted Rank</div>
        </GlassCard>

        <GlassCard className="flex flex-col items-center text-center py-6" glow>
          <div className={`text-lg font-bold mb-1 ${analysis?.riskLevel === 'High' ? 'text-red-500' : 'text-success'}`}>
            {analysis?.riskLevel || 'Low'} Risk
          </div>
          <div className="text-[10px] text-text3 uppercase tracking-wider font-bold">Burnout / Failure Risk</div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Recommendations Column */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                <Icon name="zap" className="text-primary w-5 h-5" />
                Strategic Recommendations
              </h2>
              <button
                onClick={() => { setRefreshKey(k => k + 1); setRecommendations([]); setAiError(null); }}
                className="text-[10px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium"
                disabled={loading}
              >
                <Icon name="refresh" className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
            
            <div className="space-y-4 overflow-hidden">
              {loading ? (
                <div className="py-8">
                  <MentorLoading />
                </div>
                ) : recommendations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.15)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-primary"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h4 className="text-base font-semibold text-text mb-2">No Insights Yet</h4>
                    <p className="text-sm text-text3 max-w-sm mb-6 leading-relaxed">Complete topics and mock tests to unlock personalized AI recommendations tailored to your progress.</p>
                    <div className="flex gap-3">
                      <Link to="/topics" className="inline-flex items-center gap-2 text-xs px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'white', boxShadow: '0 0 15px rgba(168,85,247,0.25)' }}>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0V9a1 1 0 112 0v4zm-1-6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                        Start Topics
                      </Link>
                      <button onClick={() => { setRefreshKey(k => k + 1); setRecommendations([]); }} className="inline-flex items-center gap-2 text-xs px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02]" style={{ background: 'rgba(168,85,247,0.1)', color: '#A78BFA', border: '1px solid rgba(168,85,247,0.25)' }}>
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                recommendations.map((rec, idx) => (
                  <GlassCard key={idx} className="flex gap-4 items-start border-l-4 border-l-primary hover:translate-x-1 transition-transform" padding="p-5">
                    <div className={`p-3 rounded-xl shrink-0 ${TYPE_CONFIG[rec.type]?.bg || 'bg-bg-3'}`}>
                      <Icon name={TYPE_CONFIG[rec.type]?.icon || 'star'} className={`w-6 h-6 ${TYPE_CONFIG[rec.type]?.color || 'text-text3'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-text break-words">{rec.title}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text3 bg-bg-3 px-2 py-0.5 rounded-full shrink-0">
                          {(rec.type || 'insight').replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-text2 mt-2 leading-relaxed break-words break-words">{rec.content}</p>
                      <button 
                        onClick={() => navigate(rec.action || '/dashboard')}
                        className="mt-4 text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                      >
                        Go to Section <Icon name="chevron-right" className="w-3 h-3" />
                      </button>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </section>

          {/* Daily/Weekly Plan Section */}
          <section>
            <h2 className="text-lg font-bold text-text mb-4">Focus Areas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard title="Today's Study Goal" icon="calendar">
                  <p className="text-sm text-text2 mb-4">Generated based on your target and weak areas.</p>
                  <div className="space-y-2">
                    {planSteps.length > 0 ? planSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs bg-bg-2 p-2 rounded-lg border border-border">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">{i + 1}</span>
                        <span className="text-text">{step}</span>
                      </div>
                    )) : (
                      <div className="text-xs text-text3 bg-bg-2 p-3 rounded-lg border border-border">
                        No plan is available yet. Try refreshing the AI Mentor.
                      </div>
                    )}
                  </div>
                </GlassCard>
                <GlassCard title="Mistake Analysis" icon="alert-triangle">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text2">PYQ Accuracy</span>
                      <span className={`font-bold ${pyqAccuracy > 70 ? 'text-success' : 'text-orange-500'}`}>{pyqAccuracy}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pyqAccuracy}%` }} />
                    </div>
                    <p className="text-[11px] text-text3 italic mt-2">
                      {pyqAccuracy < 50 ? 'Focus on building core concepts before attempting more PYQs.' :
                       pyqAccuracy < 70 ? 'Review your mistake patterns — are they conceptual or silly errors?' :
                       'Good accuracy! Now work on speed and time management.'}
                    </p>
                  </div>
               </GlassCard>
            </div>
          </section>
        </div>

        {/* Side Panel: Insights & Warnings */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-text mb-4">Smart Notifications</h2>
          
          <div className="space-y-3">
            {smartMessages.map((msg, i) => (
              <div key={i} className={`p-4 rounded-xl border flex gap-3 items-start animate-slide-in-right`} style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  msg.type === 'warning' ? 'bg-red-500' : 
                  msg.type === 'success' ? 'bg-success' : 'bg-primary'
                }`} />
                <p className="text-xs text-text2 leading-normal font-medium">{msg.text}</p>
              </div>
            ))}
            {smartMessages.length === 0 && (
              <p className="text-xs text-text3 italic px-2">No new notifications.</p>
            )}
          </div>

          <GlassCard className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="zap" className="text-primary w-5 h-5" />
              <span className="text-sm text-text font-bold">Strategy Tip</span>
            </div>
             <p className="text-xs text-text2 leading-relaxed">
              You are strongest in <strong>{strongestSubject?.name || 'N/A'}</strong>. 
              Try to maintain this while dedicating 60% of your time to your weakest subject: 
              <strong>{weakestSubject?.name || 'N/A'}</strong>.
             </p>
           </GlassCard>

          <GlassCard className="bg-bg-3/50 border-dashed border-2">
            <div className="text-center py-4">
              <div className="text-xs font-bold text-text3 uppercase mb-2">Consistency (Last 7 Days)</div>
              <div className="flex justify-center gap-1">
                {['M','T','W','T','F','S','S'].map((day, i) => (
                  <div key={i} className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${toWeeklyHours(studyStats?.weeklyHours)[i] > 0 ? 'bg-success text-white' : 'bg-bg border border-border text-text3'}`}>
                    {day}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-text3 mt-3">Total: {weeklyTotal}h / week</div>
            </div>
          </GlassCard>

          <AICoachChat initialPrompt={coachPrompt} />
        </div>
      </div>
    </div>
  );
};

export default AIMentorPage;
