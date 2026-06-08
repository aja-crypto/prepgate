import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { aiService } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Icon from '../components/ui/Icon';
import ProgressRing from '../components/ui/ProgressRing';
import { computeSubjectCompletion, computeReadinessScore, computeCompletionForecast } from '../utils/gateUtils';

import AICoachChat from '../components/gate/AICoachChat';

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
  const { topics, pyqs, mocks, studyStats, gateFeatures } = useProgress();
  const [recommendations, setRecommendations] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [loading, setLoading] = useState(true);

  const subjects = useMemo(
    () => computeSubjectCompletion(studyStats.subjects, topics, pyqs),
    [studyStats.subjects, topics, pyqs]
  );

  const overall = useMemo(() => {
    if (!subjects.length) return 0;
    return Math.round(subjects.reduce((s, x) => s + x.progress, 0) / subjects.length);
  }, [subjects]);

  const readiness = useMemo(
    () => computeReadinessScore(topics, pyqs, mocks, gateFeatures.streak),
    [topics, pyqs, mocks, gateFeatures.streak]
  );

  const forecast = useMemo(
    () => computeCompletionForecast(topics, gateFeatures),
    [topics, gateFeatures]
  );

  const fetchTimerRef = useRef(null);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!localStorage.getItem('accessToken') && localStorage.getItem('isGuest') !== 'true') {
        return;
      }
      
      try {
        setLoading(true);
        const res = await aiService.getRecommendations({
          subjects: subjects || [],
          topics: topics || [],
          pyqs: pyqs || [],
          mocks: mocks || [],
          gateFeatures,
          overall: { percentage: overall || 0 },
          studyStats
        });
        if (res.data.success) {
          setRecommendations(res.data.data.recommendations);
          setAnalysis(res.data.data.analysis);
          setAiError(res.data.data.aiError || null);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce AI fetch to prevent rapid firing on multi-state updates
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(fetchRecs, 1000);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [subjects, topics, pyqs, mocks, gateFeatures, overall, studyStats]);

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
    const totalHours = (studyStats.weeklyHours || []).reduce((a, b) => a + b, 0);
    if (totalHours > 60) {
      msgs.push({ text: "High study volume! Take a break to avoid burnout.", type: 'health' });
    }

    // 3. Streak
    if (gateFeatures.streak.current > 5) {
      msgs.push({ text: `Incredible! You are on a ${gateFeatures.streak.current}-day streak.`, type: 'success' });
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
    if (gateFeatures.streak.current === 0 && studyStats.lastStudyDate) {
      msgs.push({ text: "Don't let your progress slip! Start a small 15-minute session today to get back on track.", type: 'insight' });
    }

    return msgs;
  }, [pyqs, studyStats, gateFeatures, overall, forecast.forecastDate, subjects]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-1">AI Mentor</p>
          <h1 className="text-3xl font-bold text-text tracking-tight">Personal GATE Coach</h1>
          <p className="text-sm text-text3 mt-1">Real-time analysis of your preparation journey</p>
        </div>
        <div className="flex gap-2">
          {gateFeatures.streak.current > 0 && (
            <div className="bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-lg border border-orange-500/20 flex items-center gap-2">
              <Icon name="zap" className="w-4 h-4 fill-current" />
              <span className="text-xs font-bold">{gateFeatures.streak.current} DAY STREAK</span>
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
            <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <Icon name="zap" className="text-primary w-5 h-5" />
              Strategic Recommendations
            </h2>
            
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-surface-2 rounded-xl border border-border" />
                  ))}
                </div>
              ) : (
                recommendations.map((rec, idx) => (
                  <GlassCard key={idx} className="flex gap-4 items-start border-l-4 border-l-primary hover:translate-x-1 transition-transform" padding="p-5">
                    <div className={`p-3 rounded-xl ${TYPE_CONFIG[rec.type]?.bg || 'bg-bg-3'}`}>
                      <Icon name={TYPE_CONFIG[rec.type]?.icon || 'star'} className={`w-6 h-6 ${TYPE_CONFIG[rec.type]?.color || 'text-text3'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-text">{rec.title}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text3 bg-bg-3 px-2 py-0.5 rounded-full">
                          {rec.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-text2 mt-2 leading-relaxed">{rec.content}</p>
                      <button 
                        onClick={() => navigate(rec.action)}
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
                   {recommendations.find(r => r.type === 'plan')?.content.split('|').map((step, i) => (
                     <div key={i} className="flex items-center gap-3 text-xs bg-bg-2 p-2 rounded-lg border border-border">
                       <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">{i+1}</span>
                       <span className="text-text">{step.trim()}</span>
                     </div>
                   ))}
                 </div>
               </GlassCard>
               <GlassCard title="Mistake Analysis" icon="alert-triangle">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text2">PYQ Accuracy</span>
                      <span className={`font-bold ${overall > 70 ? 'text-success' : 'text-orange-500'}`}>{overall}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${overall}%` }} />
                    </div>
                    <p className="text-[11px] text-text3 italic mt-2">
                      Recurring patterns: Time management seems to be your biggest hurdle in Mocks.
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
              You are strongest in <strong>{subjects.sort((a, b) => b.progress - a.progress)[0]?.name}</strong>. 
              Try to maintain this while dedicating 60% of your time to your weakest subject: 
              <strong>{subjects.sort((a, b) => a.progress - b.progress)[0]?.name}</strong>.
            </p>
          </GlassCard>

          <GlassCard className="bg-bg-3/50 border-dashed border-2">
            <div className="text-center py-4">
              <div className="text-xs font-bold text-text3 uppercase mb-2">Consistency (Last 7 Days)</div>
              <div className="flex justify-center gap-1">
                {['M','T','W','T','F','S','S'].map((day, i) => (
                  <div key={i} className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${studyStats.weeklyHours?.[i] > 0 ? 'bg-success text-white' : 'bg-bg border border-border text-text3'}`}>
                    {day}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-text3 mt-3">Total: {studyStats.weeklyHours?.reduce((a, b) => a + b, 0) || 0}h / week</div>
            </div>
          </GlassCard>

          <AICoachChat />
        </div>
      </div>
    </div>
  );
};

export default AIMentorPage;
