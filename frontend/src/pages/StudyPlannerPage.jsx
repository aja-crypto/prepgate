import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../context/ProgressContext';
import { aiService } from '../services/api';
import { GATE_SUBJECTS } from '../data/gateSubjectsData';
import { computeSubjectCompletion } from '../utils/gateUtils';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { Sparkles, ChevronLeft, ChevronRight, Clock, BookOpen, Target, CheckCircle, Play, BarChart3, Brain, AlertCircle, GripVertical, X, Plus, Layers } from 'lucide-react';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM – 9 PM
const COLORS_BY_NAME = Object.fromEntries(GATE_SUBJECTS.map(s => [s.name, { color: s.color, icon: s.icon }]));
function subjectMeta(name) {
  const m = Object.values(GATE_SUBJECTS).find(s => s.name === name);
  return { color: m?.color || '#7C3AED', icon: m?.icon || '📘' };
}

// Generate smart schedule from weak topics
function generateSmartSchedule(topics, pyqs, studyStats) {
  const subjects = computeSubjectCompletion(studyStats?.subjects || [], topics, pyqs);
  const weak = subjects.filter(s => s.progress < 50).sort((a, b) => a.progress - b.progress);
  const mid = subjects.filter(s => s.progress >= 50 && s.progress < 75).sort((a, b) => a.progress - b.progress);
  const strong = subjects.filter(s => s.progress >= 75);
  if (!weak.length && !mid.length) return [];

  const schedule = [];
  let hour = 14; // start 2 PM
  const push = (sub, label, mins) => {
    const meta = subjectMeta(sub.name);
    schedule.push({ id: Date.now() + schedule.length, subject: sub.name, label: label || 'Revision', duration: mins, startHour: hour, color: meta.color, icon: meta.icon, progress: sub.progress });
    hour += Math.ceil(mins / 60);
  };

  // 2h on weakest subjects
  weak.slice(0, 2).forEach(s => push(s, s.name === 'General Aptitude' ? 'Practice' : 'Core Topics', 120));
  // 1h on mid subjects
  mid.slice(0, 1).forEach(s => push(s, 'PYQ Practice', 60));
  // 30min break
  hour += 0.5;
  // 1h PYQ
  if (pyqs?.length) push(mid[0] || weak[0], 'PYQ Practice', 60);
  // 30min revision
  if (strong.length) push(strong[0], 'Quick Revision', 30);

  return schedule;
}

export default function StudyPlannerPage() {
  const { gateFeatures, updateGateFeatures, syncToCloud, topics, pyqs, mocks, studyStats } = useProgress();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerPlan, setDrawerPlan] = useState(null);
  const [drawerDate, setDrawerDate] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [form, setForm] = useState({ subject: '', topic: '', hours: 2, notes: '' });
  const [editId, setEditId] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const timelineRef = useRef(null);

  const today = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) });
  }, []);

  const getPlans = useCallback((date) => {
    const key = format(date, 'yyyy-MM-dd');
    return gateFeatures?.studyPlans?.[key] || [];
  }, [gateFeatures]);

  const todayKey = format(today, 'yyyy-MM-dd');
  const todayPlans = getPlans(today);
  const subjects = computeSubjectCompletion(studyStats?.subjects || [], topics, pyqs);
  const smartSched = useMemo(() => generateSmartSchedule(topics, pyqs, studyStats), [topics, pyqs, studyStats]);

  const totalHours = todayPlans.reduce((s, p) => s + (+p.hours || 0), 0);
  const completedCount = todayPlans.filter(p => p.done).length;

  // Show today's schedule by default
  const [activeDay, setActiveDay] = useState(todayKey);
  const activeDate = new Date(activeDay + 'T00:00:00');
  const activePlans = getPlans(activeDate);

  // Time-based current hour highlight
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const openAdd = (date) => {
    setSelectedDate(date);
    setForm({ subject: GATE_SUBJECTS[0].name, topic: GATE_SUBJECTS[0].highRoiTopics[0] || '', hours: 1, notes: '' });
    setEditId(null);
    setShowModal(true);
  };

  const openDrawer = (plan, date) => {
    setDrawerPlan(plan);
    setDrawerDate(date);
    setShowDrawer(true);
  };

  const savePlan = async () => {
    if (!selectedDate || !form.topic.trim()) return;
    const key = format(selectedDate, 'yyyy-MM-dd');
    updateGateFeatures((gf) => {
      const existing = gf.studyPlans[key] || [];
      const plan = { id: editId || Date.now(), ...form, hours: +form.hours, startHour: form.startHour !== undefined ? +form.startHour : 14 };
      const updated = editId ? existing.map(p => p.id === editId ? plan : p) : [...existing, plan];
      return { ...gf, studyPlans: { ...gf.studyPlans, [key]: updated } };
    });
    setShowModal(false);
    await syncToCloud();
  };

  const deletePlan = async (date, id) => {
    const key = format(date, 'yyyy-MM-dd');
    updateGateFeatures((gf) => {
      const updated = (gf.studyPlans[key] || []).filter(p => p.id !== id);
      const plans = { ...gf.studyPlans };
      if (updated.length) plans[key] = updated;
      else delete plans[key];
      return { ...gf, studyPlans: plans };
    });
    await syncToCloud();
    setShowDrawer(false);
  };

  const toggleDone = async (date, id) => {
    const key = format(date, 'yyyy-MM-dd');
    updateGateFeatures((gf) => {
      const updated = (gf.studyPlans[key] || []).map(p => p.id === id ? { ...p, done: !p.done } : p);
      return { ...gf, studyPlans: { ...gf.studyPlans, [key]: updated } };
    });
    await syncToCloud();
  };

  const generateAiSchedule = async () => {
    setAiGenerating(true);
    try {
      const res = await aiService.generatePlan({
        subjects: studyStats.subjects || [],
        topics: topics || [],
        pyqs: pyqs || [],
        mocks: mocks || [],
        dailyHours: gateFeatures?.dailyTarget?.hours || 8,
        period: 'today',
      });
      const plan = res.data?.data?.plan;
      if (plan?.length) {
        const key = format(today, 'yyyy-MM-dd');
        updateGateFeatures((gf) => {
          const existing = gf.studyPlans[key] || [];
          const newPlans = plan.map((p, i) => ({
            id: Date.now() + i,
            subject: p.subject || GATE_SUBJECTS[i % GATE_SUBJECTS.length].name,
            topic: p.topic || 'Study Session',
            hours: p.hours || 1,
            notes: p.notes || '',
            startHour: 14 + i * 2,
          }));
          return { ...gf, studyPlans: { ...gf.studyPlans, [key]: [...existing, ...newPlans] } };
        });
        await syncToCloud();
        toast.success('AI schedule generated');
      } else {
        // Fallback: use smart heuristic
        const key = format(today, 'yyyy-MM-dd');
        updateGateFeatures((gf) => {
          const smart = smartSched.map((s, i) => ({
            id: Date.now() + i, subject: s.subject, topic: s.label, hours: s.duration / 60,
            startHour: s.startHour, notes: '', color: s.color,
          }));
          return { ...gf, studyPlans: { ...gf.studyPlans, [key]: smart } };
        });
        await syncToCloud();
        toast('Smart schedule created', { icon: '📋' });
      }
    } catch {
      // Fallback: smart heuristic
      const key = format(today, 'yyyy-MM-dd');
      updateGateFeatures((gf) => {
        const smart = smartSched.map((s, i) => ({
          id: Date.now() + i, subject: s.subject, topic: s.label, hours: s.duration / 60,
          startHour: s.startHour, notes: '', color: s.color,
        }));
        return { ...gf, studyPlans: { ...gf.studyPlans, [key]: smart } };
      });
      await syncToCloud();
      toast('Created smart schedule', { icon: '📋' });
    } finally {
      setAiGenerating(false);
    }
  };

  // Drag & drop: move plan to another hour slot
  const dropPlan = (dateKey, planId, newStartHour) => {
    updateGateFeatures((gf) => {
      const plans = { ...(gf.studyPlans || {}) };
      const dayPlans = (plans[dateKey] || []).map(p =>
        p.id === planId ? { ...p, startHour: newStartHour } : p
      );
      plans[dateKey] = dayPlans;
      return { ...gf, studyPlans: plans };
    });
    setDraggingId(null);
  };

  // Scroll to current hour on mount
  useEffect(() => {
    if (timelineRef.current) {
      const hourEl = timelineRef.current.querySelector('[data-hour]');
      if (hourEl) hourEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeDay]);

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)] min-h-[600px]">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className="hidden lg:flex flex-col w-56 shrink-0 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-3">Today's Plan</div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs"><span className="text-text3">Sessions</span><span className="text-text font-semibold">{todayPlans.length}</span></div>
            <div className="flex justify-between text-xs"><span className="text-text3">Completed</span><span className="text-success font-semibold">{completedCount}</span></div>
            <div className="flex justify-between text-xs"><span className="text-text3">Pending</span><span className="text-orange-400 font-semibold">{todayPlans.length - completedCount}</span></div>
            <div className="flex justify-between text-xs"><span className="text-text3">Study Time</span><span className="text-text font-semibold">{totalHours}h</span></div>
          </div>
          {todayPlans.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] text-text3 mb-1.5">Current</div>
              <div className="text-xs font-medium text-text truncate">{todayPlans[0]?.topic || ''}</div>
              <div className="text-xs text-text3 mt-2 mb-1.5">Next</div>
              <div className="text-xs text-text truncate">{todayPlans[1]?.topic || '—'}</div>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-text mb-3">Quick Actions</div>
          <div className="space-y-2">
            <button onClick={() => openAdd(today)} className="w-full text-xs bg-primary/10 text-primary px-3 py-2 rounded-lg border border-primary/20 hover:bg-primary/15 text-left flex items-center gap-2">
              <Plus size={14} /> Add Session
            </button>
            <button onClick={generateAiSchedule} disabled={aiGenerating} className="w-full text-xs bg-purple-500/10 text-purple-400 px-3 py-2 rounded-lg border border-purple-500/20 hover:bg-purple-500/15 text-left flex items-center gap-2">
              {aiGenerating ? <div className="w-3.5 h-3.5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" /> : <Sparkles size={14} />}
              {aiGenerating ? 'Generating...' : 'AI Schedule'}
            </button>
            <a href="/topics" className="w-full text-xs bg-bg-2 text-text2 px-3 py-2 rounded-lg border border-border hover:border-white/10 text-left flex items-center gap-2">
              <BookOpen size={14} /> Browse Topics
            </a>
          </div>

          {subjects.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-[10px] text-text3 mb-2">Subject Priority</div>
              {subjects.sort((a, b) => a.progress - b.progress).slice(0, 4).map(s => {
                const meta = subjectMeta(s.name);
                return (
                  <div key={s.name} className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                    <span className="text-[10px] text-text2 flex-1 truncate">{s.name.split(' ').slice(-1)[0]}</span>
                    <span className="text-[9px] font-mono text-text3">{s.progress}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== CENTER — TIMELINE ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Week selector */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-thin">
          {weekDays.map((d) => {
            const k = format(d, 'yyyy-MM-dd');
            const count = getPlans(d).length;
            const active = k === activeDay;
            return (
              <button key={k} onClick={() => setActiveDay(k)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-all shrink-0 min-w-[56px] ${active ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-surface border-border text-text3 hover:border-white/10'}`}>
                <span className="text-[9px] uppercase">{format(d, 'EEE')}</span>
                <span className={`text-sm font-bold font-mono mt-0.5 ${active ? 'text-primary' : ''}`}>{format(d, 'd')}</span>
                {count > 0 && <span className="text-[8px] mt-0.5 text-primary">{count} sessions</span>}
                {isToday(d) && !active && <span className="text-[8px] mt-0.5 text-primary">Today</span>}
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto relative" ref={timelineRef}>
          <div className="relative">
            {HOURS.map((h, idx) => {
              const hourFloat = h;
              const isCurrentHour = hourFloat <= currentHour && currentHour < hourFloat + 1;
              const plansAtHour = activePlans.filter(p => {
                const sh = p.startHour !== undefined ? +p.startHour : 14;
                return Math.floor(sh) === h;
              });

              return (
                <div key={h} className="relative flex" data-hour={isCurrentHour ? 'now' : ''}>
                  {/* Time label */}
                  <div className="w-14 shrink-0 pt-1.5 text-right pr-3">
                    <span className={`text-[10px] font-mono ${isCurrentHour ? 'text-primary font-bold text-xs' : 'text-text3'}`}>
                      {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                    </span>
                  </div>

                  {/* Slot */}
                  <div
                    className={`flex-1 min-h-[56px] border-l-2 pl-3 py-1.5 relative transition-all ${isCurrentHour ? 'border-primary border-l-[3px] bg-primary/[0.03]' : 'border-border'} ${idx === HOURS.length - 1 ? '' : 'mb-0.5'}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (draggingId) dropPlan(activeDay, draggingId, h); }}
                  >
                    {isCurrentHour && (
                      <div className="absolute left-[-2.5px] top-0 w-[5px] h-full bg-primary rounded-full animate-pulse" />
                    )}

                    {plansAtHour.length === 0 && !isCurrentHour && (
                      <button onClick={() => { setSelectedDate(activeDate); setForm({ subject: GATE_SUBJECTS[0].name, topic: '', hours: 1, notes: '', startHour: h }); setEditId(null); setShowModal(true); }}
                        className="w-full h-full min-h-[40px] rounded-lg border border-dashed border-border/40 hover:border-primary/30 hover:bg-primary/[0.02] transition-all text-[10px] text-text3/40 hover:text-text3/60 flex items-center justify-center">
                        + Add at {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                      </button>
                    )}

                    <AnimatePresence>
                      {plansAtHour.map(plan => {
                        const meta = subjectMeta(plan.subject);
                        const dur = plan.duration || plan.hours * 60 || 60;
                        const endHour = hourFloat + dur / 60;
                        return (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            draggable
                            onDragStart={() => setDraggingId(plan.id)}
                            onClick={() => openDrawer(plan, activeDate)}
                            style={{ borderLeftColor: meta.color }}
                            className="bg-surface border border-border border-l-[3px] rounded-xl p-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 opacity-[0.03]" style={{ background: `linear-gradient(135deg, ${meta.color}, transparent)` }} />
                            <div className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <GripVertical size={12} className="text-text3/30 group-hover:text-text3/60 cursor-grab shrink-0" />
                                  <span className="text-[10px] font-semibold" style={{ color: meta.color }}>{plan.subject.split(' ').slice(-1)[0]}</span>
                                </div>
                                <button onClick={e => { e.stopPropagation(); toggleDone(activeDate, plan.id); }}
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full border ${plan.done ? 'bg-success/10 border-success/20 text-success' : 'bg-bg-2 border-border text-text3'}`}>
                                  {plan.done ? 'Done' : 'Mark'}
                                </button>
                              </div>
                              <div className="text-xs font-semibold text-text truncate pl-[22px]">{plan.topic}</div>
                              <div className="flex items-center gap-2 mt-1 ml-[22px]">
                                <span className="text-[9px] text-text3">
                                  {format(new Date().setHours(h, 0, 0, 0), 'h:mm a')} – {format(new Date().setHours(Math.min(endHour, 23), 0, 0, 0), 'h:mm a')}
                                </span>
                                <span className="text-[9px] text-text3">· {dur}min</span>
                                {plan.notes && <span className="text-[9px] text-text3 truncate">· {plan.notes}</span>}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {activePlans.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.15)' }}>
                <CalendarDays size={28} className="text-primary" />
              </div>
              <h3 className="text-base font-bold text-text mb-2">No Study Plan Yet</h3>
              <p className="text-sm text-text3 max-w-xs mb-6">Generate an AI schedule or add sessions manually.</p>
              <div className="flex gap-3">
                <button onClick={generateAiSchedule} disabled={aiGenerating} className="px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: 'white' }}>
                  {aiGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={16} />}
                  {aiGenerating ? 'Generating...' : 'Generate AI Schedule'}
                </button>
                <button onClick={() => { setSelectedDate(activeDate); setForm({ subject: GATE_SUBJECTS[0].name, topic: '', hours: 1, notes: '' }); setEditId(null); setShowModal(true); }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-bg-2 border border-border text-text2 hover:border-white/15">
                  Create Manually
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="hidden xl:flex flex-col w-64 shrink-0 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-3">Today's Focus</div>
          <div className="text-center py-3">
            <div className="text-2xl font-bold font-mono text-primary">{totalHours}h</div>
            <div className="text-[10px] text-text3">Planned Today</div>
          </div>
          <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (completedCount / (todayPlans.length || 1)) * 100)}%` }} />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-3">Revision Queue</div>
          {subjects.filter(s => s.progress > 0 && s.progress < 100).slice(0, 3).map(s => {
            const meta = subjectMeta(s.name);
            return (
              <div key={s.name} className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                <span className="text-[10px] text-text2 flex-1 truncate">{s.name.split(' ').slice(-1)[0]}</span>
                <span className="text-[9px] font-mono text-text3">{s.progress}%</span>
              </div>
            );
          })}
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-3">Weak Topic</div>
          {subjects.length > 0 ? (
            <div className="text-center">
              <div className="text-xl mb-1">{subjectMeta(subjects.sort((a, b) => a.progress - b.progress)[0].name).icon}</div>
              <div className="text-xs font-medium text-text">{subjects.sort((a, b) => a.progress - b.progress)[0].name.split(' ').slice(-1)[0]}</div>
              <div className="text-[9px] text-orange-400 mt-0.5">{subjects.sort((a, b) => a.progress - b.progress)[0].progress}% complete</div>
              <a href="/topics" className="mt-2 inline-block text-[10px] text-primary hover:underline">Study now →</a>
            </div>
          ) : (
            <p className="text-[10px] text-text3 text-center py-2">No data yet</p>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-2">AI Suggestion</div>
          {subjects.length > 0 ? (
            <p className="text-[10px] text-text3 leading-relaxed">
              Focus on <span className="text-primary font-medium">{subjects.sort((a, b) => a.progress - b.progress)[0]?.name?.split(' ').slice(-1)[0] || 'your weakest subject'}</span> today.
              Complete PYQs and revision for better retention.
            </p>
          ) : (
            <p className="text-[10px] text-text3 leading-relaxed">Start studying to get AI suggestions.</p>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-2">Productivity Score</div>
          <div className="text-center py-2">
            <div className="text-xl font-bold font-mono text-primary">{Math.min(100, totalHours * 12 + completedCount * 5)}</div>
            <div className="text-[9px] text-text3">/ 100</div>
          </div>
        </div>
      </div>

      {/* ===== DRAWER (click study block) ===== */}
      <AnimatePresence>
        {showDrawer && drawerPlan && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[360px] max-w-[90vw] z-50 bg-surface border-l border-border shadow-2xl p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: `${subjectMeta(drawerPlan.subject).color}20`, color: subjectMeta(drawerPlan.subject).color }}>
                {subjectMeta(drawerPlan.subject).icon}
              </div>
              <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-bg-2 text-text3"><X size={18} /></button>
            </div>
            <div className="text-sm font-bold text-text mb-1">{drawerPlan.subject}</div>
            <div className="text-xs text-text3 mb-1">Topic: {drawerPlan.topic}</div>
            <div className="text-xs text-text3 mb-6">Duration: {drawerPlan.hours || drawerPlan.duration / 60 || 1}h</div>

            <div className="space-y-3">
              <a href={`/pyq?subject=${encodeURIComponent(drawerPlan.subject)}`} className="flex items-center gap-3 bg-bg-2 border border-border rounded-xl px-4 py-3 hover:border-white/10 transition-all">
                <BookOpen size={16} className="text-primary" /> <span className="text-xs text-text2">PYQs</span>
              </a>
              <a href={`/notes`} className="flex items-center gap-3 bg-bg-2 border border-border rounded-xl px-4 py-3 hover:border-white/10 transition-all">
                <Layers size={16} className="text-primary" /> <span className="text-xs text-text2">Notes</span>
              </a>
              <a href={`/topics`} className="flex items-center gap-3 bg-bg-2 border border-border rounded-xl px-4 py-3 hover:border-white/10 transition-all">
                <BookOpen size={16} className="text-primary" /> <span className="text-xs text-text2">Study Topic</span>
              </a>
              <a href={`/mistakes`} className="flex items-center gap-3 bg-bg-2 border border-border rounded-xl px-4 py-3 hover:border-white/10 transition-all">
                <AlertCircle size={16} className="text-orange-400" /> <span className="text-xs text-text2">Mistake Notebook</span>
              </a>
              <a href={`/mentor`} className="flex items-center gap-3 bg-bg-2 border border-border rounded-xl px-4 py-3 hover:border-white/10 transition-all">
                <Brain size={16} className="text-purple-400" /> <span className="text-xs text-text2">AI Explain</span>
              </a>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => toggleDone(drawerDate, drawerPlan.id)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${drawerPlan.done ? 'bg-bg-2 border border-border text-text2' : 'bg-success text-white'}`}>
                {drawerPlan.done ? '✓ Completed' : 'Mark Complete'}
              </button>
              <button onClick={() => deletePlan(drawerDate, drawerPlan.id)} className="py-2.5 px-4 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10">Delete</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== ADD/EDIT MODAL ===== */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Session' : 'Add Session'}>
        {selectedDate && <p className="text-xs text-text3 mb-4">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Subject</label>
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60">
              {GATE_SUBJECTS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Topic</label>
            <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Process Scheduling"
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Duration (hours)</label>
            <input type="number" min="0.5" max="12" step="0.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional"
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60" />
          </div>
          <button onClick={savePlan} className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90">
            {editId ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function CalendarDays(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
