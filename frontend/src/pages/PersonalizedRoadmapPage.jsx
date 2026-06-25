// src/pages/PersonalizedRoadmapPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import ProgressRing from '../components/ui/ProgressRing';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = '/api';

export default function PersonalizedRoadmapPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [examDate, setExamDate] = useState('2027-02-07');
  const [dailyHours, setDailyHours] = useState(8);
  const [weakTopics, setWeakTopics] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      // Load subjects and progress
      const [subjectsRes, progressRes] = await Promise.all([
        axios.get(`${API}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/progress/stats`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { data: {} } })),
      ]);
      
      const subjects = subjectsRes.data?.data || [];
      const progress = progressRes.data?.data || {};
      
      // Calculate progress per subject
      const progressMap = progress.subjectProgress || {};
      const subjectProgressData = subjects.map(s => ({
        name: s.name,
        code: s.code,
        progress: progressMap[s.name] || 0,
        weightage: s.weightage || 10,
        topicsTotal: s.topics?.length || 0,
        topicsDone: Math.round((progressMap[s.name] || 0) / 100 * (s.topics?.length || 10)),
      })).sort((a, b) => b.progress - a.progress);

      setSubjectProgress(subjectProgressData);

      // Identify weak topics
      const weak = subjectProgressData.filter(s => s.progress < 50).map(s => s.name);
      setWeakTopics(weak);
    } catch (err) {
      console.error('Failed to load progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('accessToken');
      
      // Call AI service to generate personalized roadmap
      const res = await axios.post(`${API}/ai/generate-roadmap`, {
        subjects: subjectProgress,
        weakTopics,
        examDate,
        dailyHours,
        daysRemaining: Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)),
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data?.success) {
        setRoadmap(res.data.data);
        toast.success('Roadmap generated!');
      } else {
        // Generate a basic roadmap in case AI fails
        generateBasicRoadmap();
      }
    } catch (err) {
      console.error('Failed to generate roadmap:', err);
      // Fallback to basic roadmap generation
      generateBasicRoadmap();
    } finally {
      setGenerating(false);
    }
  };

  const generateBasicRoadmap = () => {
    const daysRemaining = Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)));
    const totalHours = daysRemaining * dailyHours;
    
    // Sort subjects by priority (weightage and low progress)
    const prioritizedSubjects = [...subjectProgress].sort((a, b) => {
      const priorityA = (a.weightage * 2) + (100 - a.progress);
      const priorityB = (b.weightage * 2) + (100 - b.progress);
      return priorityB - priorityA;
    });

    const weeks = Math.ceil(daysRemaining / 7);
    const weeklyPlan = [];
    let hoursUsed = 0;

    prioritizedSubjects.forEach((subject, idx) => {
      const subjectHours = Math.round((subject.weightage / 100) * totalHours * 1.5);
      hoursUsed += subjectHours;
      
      weeklyPlan.push({
        subject: subject.name,
        color: getSubjectColor(subject.name),
        totalHours: subjectHours,
        weeklyDistribution: Array(weeks).fill(Math.round(subjectHours / weeks)),
        focus: subject.progress < 30 ? 'Foundation building' : subject.progress < 60 ? 'Intermediate concepts' : 'Advanced practice',
        priority: idx + 1,
        milestones: generateMilestones(subject, daysRemaining),
      });
    });

    setRoadmap({
      examDate,
      daysRemaining,
      dailyHours,
      totalStudyHours: totalHours,
      subjects: weeklyPlan,
      strategy: {
        phase1: { name: 'Foundation', weeks: Math.floor(weeks * 0.3), description: 'Build strong base in weak areas' },
        phase2: { name: 'Strengthening', weeks: Math.floor(weeks * 0.4), description: 'Deep dive into all topics' },
        phase3: { name: 'Mock & Revision', weeks: Math.floor(weeks * 0.3), description: 'Practice tests and quick revision' },
      },
    });

    toast.success('Basic roadmap generated!');
  };

  const generateMilestones = (subject, totalDays) => {
    return [
      { day: Math.round(totalDays * 0.3), label: 'Complete topic coverage', progress: 60 },
      { day: Math.round(totalDays * 0.6), label: 'Solve PYQs & practice', progress: 80 },
      { day: Math.round(totalDays * 0.9), label: 'Final revision', progress: 95 },
    ];
  };

  const getSubjectColor = (name) => {
    const colors = {
      'Engineering Mathematics': '#10B981',
      'Algorithms': '#3B82F6',
      'DBMS': '#F59E0B',
      'Operating Systems': '#22C55E',
      'Computer Networks': '#06B6D4',
      'Theory of Computation': '#A855F7',
      'Compiler Design': '#EC4899',
      'Computer Organization': '#EF4444',
      'Digital Logic': '#84CC16',
      'General Aptitude': '#F97316',
    };
    return colors[name] || '#8B5CF6';
  };

  const getDaysLabel = () => {
    if (!roadmap) return '';
    const days = roadmap.daysRemaining;
    if (days <= 30) return `${days} days - Sprint mode!`;
    if (days <= 100) return `${days} days - Intensive prep`;
    return `${days} days - Comprehensive coverage`;
  };

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Personalized Roadmap</h1>
        <p className="text-sm text-text3 mt-0.5">AI-generated study plan based on your progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Configuration */}
          {!roadmap && (
            <GlassCard hover={false} padding="p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Generate Your Roadmap</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Exam Date</label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full bg-bg-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Daily Study Hours</label>
                    <select
                      value={dailyHours}
                      onChange={(e) => setDailyHours(Number(e.target.value))}
                      className="w-full bg-bg-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60"
                    >
                      {[4, 5, 6, 7, 8, 9, 10, 12].map(h => (
                        <option key={h} value={h}>{h} hours/day</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject Progress Overview */}
                {subjectProgress.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-text mb-3">Your Subject Progress</h3>
                    <div className="space-y-2">
                      {subjectProgress.slice(0, 6).map((sub) => (
                        <div key={sub.name} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getSubjectColor(sub.name) }} />
                          <span className="text-sm text-text flex-1 truncate">{sub.name}</span>
                          <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${sub.progress}%`, background: getSubjectColor(sub.name) }} />
                          </div>
                          <span className="text-xs text-text3 w-10 text-right">{sub.progress}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleGenerateRoadmap}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>✨ Generate Personalized Roadmap</>
                  )}
                </button>
              </div>
            </GlassCard>
          )}

          {/* Generated Roadmap */}
          {roadmap && (
            <>
              {/* Overview */}
              <GlassCard hover={false} padding="p-6" className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-text">Your GATE 2027 Roadmap</h2>
                    <p className="text-sm text-text3">{getDaysLabel()}</p>
                  </div>
                  <button onClick={() => setRoadmap(null)} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] text-text2 hover:bg-white/[0.1] transition-all">
                    Regenerate
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-bg-2 border border-border rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold font-mono text-primary">{roadmap.totalStudyHours}h</div>
                    <div className="text-xs text-text3 mt-1">Total Study Hours</div>
                  </div>
                  <div className="bg-bg-2 border border-border rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold font-mono text-green-400">{roadmap.dailyHours}h</div>
                    <div className="text-xs text-text3 mt-1">Daily Target</div>
                  </div>
                  <div className="bg-bg-2 border border-border rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold font-mono text-orange-400">{roadmap.subjects.length}</div>
                    <div className="text-xs text-text3 mt-1">Subjects</div>
                  </div>
                </div>

                {/* Three Phases */}
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(roadmap.strategy).map((phase, i) => (
                    <div key={i} className="bg-bg-2 border border-border rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Phase {i + 1}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-text">{phase.name}</h4>
                      <p className="text-[10px] text-text3 mt-1">{phase.description}</p>
                      <div className="text-[10px] text-text2 mt-1">{phase.weeks} weeks</div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Subject-wise Plan */}
              <h3 className="text-lg font-semibold text-text mb-3">Subject-wise Breakdown</h3>
              <div className="space-y-4">
                {roadmap.subjects.map((subject, idx) => (
                  <GlassCard key={idx} hover={false} padding="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${subject.color}15` }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-text">{subject.subject}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${subject.color}15`, color: subject.color }}>
                            {subject.focus}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text3 mb-3">
                          <span>{subject.totalHours}h total</span>
                          <span>{Math.round(subject.totalHours / roadmap.daysRemaining * 7)}h/week</span>
                          <span>Priority #{subject.priority}</span>
                        </div>
                        {subject.milestones && (
                          <div className="space-y-1.5">
                            {subject.milestones.map((m, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <div className="w-16 text-text2">Day {m.day}</div>
                                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: subject.color }} />
                                </div>
                                <div className="text-text3">{m.label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        {subjectProgress.length > 0 && (
          <div className="space-y-4">
            <GlassCard hover={false} padding="p-5">
              <h3 className="text-[10px] font-semibold text-text uppercase tracking-wider mb-3">Subject Priority</h3>
              <div className="space-y-2">
                {[...subjectProgress].sort((a, b) => (b.weightage * (100 - b.progress)) - (a.weightage * (100 - a.progress))).map((sub, i) => (
                  <div key={sub.name} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text3 w-4">{i + 1}</span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getSubjectColor(sub.name) }} />
                    <span className="text-xs text-text flex-1 truncate">{sub.name}</span>
                    <span className="text-[10px] text-text3">{sub.progress}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard hover={false} padding="p-5">
              <h3 className="text-[10px] font-semibold text-text uppercase tracking-wider mb-3">Weak Areas</h3>
              {weakTopics.length > 0 ? (
                <div className="space-y-1.5">
                  {weakTopics.map((topic, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                      <span className="text-red-400">⚠️</span>
                      <span className="text-text">{topic}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text3">Great! No weak topics identified.</p>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}