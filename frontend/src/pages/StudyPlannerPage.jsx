import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { aiService } from '../services/api';
import { GATE_SUBJECTS } from '../data/gateSubjectsData';
import { computeSubjectCompletion, getCountdown } from '../utils/gateUtils';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { Sparkles, ChevronLeft, ChevronRight, Clock, BookOpen, Target, CheckCircle, Play, BarChart3, Brain, AlertCircle, GripVertical, X, Plus, Layers } from 'lucide-react';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM – 9 PM
const COLORS_BY_NAME = Object.fromEntries(GATE_SUBJECTS.map(s => [s.name, { color: s.color, icon: s.icon }]));
function subjectMeta(name) {
  const m = Object.values(GATE_SUBJECTS).find(s => s.name === name);
  return { color: m?.color || '#7C3AED', icon: m?.icon || '📘' };
}
const SUBJECT_DIFFICULTY = {
  'Operating Systems': 4, 'Computer Networks': 4, 'DBMS': 3,
  'Computer Organization': 4, 'Theory of Computation': 3, 'Algorithms': 3,
  'Programming & Data Structures': 4, 'Engineering Mathematics': 5,
  'Digital Logic': 2, 'Compiler Design': 3, 'General Aptitude': 2,
};
function getSubjectDifficulty(name) { return SUBJECT_DIFFICULTY[name] || 3; }

// Activity styles — permanent gradient colors and icons for each activity type
const ACTIVITY_STYLES = {
  'Wake Up': { icon: '☀️', bg: 'linear-gradient(135deg, #FBBF24, #F59E0B)' },
  'Freshen Up': { icon: '🚿', bg: 'linear-gradient(135deg, #60A5FA, #2563EB)' },
  'Meditation': { icon: '🧘', bg: 'linear-gradient(135deg, #A78BFA, #7C3AED)' },
  'Study Block 1': { icon: '📘', bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
  'Study Block 2': { icon: '📘', bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
  'Study Block 3': { icon: '📘', bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
  'New Concepts': { icon: '📘', bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
  'PYQ Practice': { icon: '❓', bg: 'linear-gradient(135deg, #2563EB, #1D4ED8)' },
  'Revision': { icon: '🧠', bg: 'linear-gradient(135deg, #22C55E, #15803D)' },
  'Formula Sheet': { icon: '📄', bg: 'linear-gradient(135deg, #14B8A6, #0F766E)' },
  'Formula Revision': { icon: '📄', bg: 'linear-gradient(135deg, #14B8A6, #0F766E)' },
  'Mock Test': { icon: '🎯', bg: 'linear-gradient(135deg, #EF4444, #B91C1C)' },
  'Mock Analysis': { icon: '📊', bg: 'linear-gradient(135deg, #F97316, #C2410C)' },
  'Notes': { icon: '📝', bg: 'linear-gradient(135deg, #EC4899, #BE185D)' },
  'Exercise': { icon: '💪', bg: 'linear-gradient(135deg, #10B981, #047857)' },
  'Breakfast': { icon: '🍳', bg: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  'Lunch': { icon: '🍛', bg: 'linear-gradient(135deg, #F97316, #EA580C)' },
  'Dinner': { icon: '🍽', bg: 'linear-gradient(135deg, #FB7185, #E11D48)' },
  'Tea Break': { icon: '☕', bg: 'linear-gradient(135deg, #9CA3AF, #6B7280)' },
  'Break': { icon: '☕', bg: 'linear-gradient(135deg, #9CA3AF, #6B7280)' },
  'Sleep': { icon: '🌙', bg: 'linear-gradient(135deg, #1E3A8A, #312E81)' },
  'Power Nap': { icon: '😴', bg: 'linear-gradient(135deg, #1E3A8A, #312E81)' },
  'Free Time': { icon: '📱', bg: 'linear-gradient(135deg, #06B6D4, #0E7490)' },
  'Walking': { icon: '🚶', bg: 'linear-gradient(135deg, #34D399, #059669)' },
  'AI Tomorrow Planning': { icon: '🤖', bg: 'linear-gradient(135deg, #A78BFA, #7C3AED)' },
  'Goal Planning': { icon: '🎯', bg: 'linear-gradient(135deg, #F97316, #C2410C)' },
  'Full Mock Test': { icon: '🎯', bg: 'linear-gradient(135deg, #EF4444, #B91C1C)' },
  'Weekly Review': { icon: '📊', bg: 'linear-gradient(135deg, #F97316, #C2410C)' },
  'Tomorrow Planning': { icon: '🤖', bg: 'linear-gradient(135deg, #A78BFA, #7C3AED)' },
};

// Default daily schedule — complete 05:45 → 22:30 timetable
const DEFAULT_SCHEDULE = [
  { label: 'Wake Up', startHour: 5.75, duration: 15, icon: '☀️' },
  { label: 'Freshen Up', startHour: 6, duration: 20, icon: '🚿' },
  { label: 'Meditation', startHour: 6.33, duration: 20, icon: '🧘' },
  { label: 'New Concepts', startHour: 6.67, duration: 120, icon: '📘' },
  { label: 'Breakfast', startHour: 8.67, duration: 30, icon: '🍳' },
  { label: 'PYQ Practice', startHour: 9.17, duration: 120, icon: '❓' },
  { label: 'Break', startHour: 11.17, duration: 20, icon: '☕' },
  { label: 'Formula Sheet', startHour: 11.5, duration: 60, icon: '📄' },
  { label: 'Lunch', startHour: 12.5, duration: 60, icon: '🍛' },
  { label: 'Power Nap', startHour: 13.5, duration: 30, icon: '😴' },
  { label: 'New Concepts', startHour: 14, duration: 120, icon: '📘' },
  { label: 'Break', startHour: 16, duration: 20, icon: '☕' },
  { label: 'Notes', startHour: 16.33, duration: 60, icon: '📝' },
  { label: 'Exercise', startHour: 17.33, duration: 40, icon: '💪' },
  { label: 'Revision', startHour: 18, duration: 60, icon: '🧠' },
  { label: 'Dinner', startHour: 19, duration: 40, icon: '🍽' },
  { label: 'Mock Test', startHour: 19.67, duration: 60, icon: '🎯' },
  { label: 'Formula Revision', startHour: 20.67, duration: 40, icon: '📄' },
  { label: 'Tomorrow Planning', startHour: 21.33, duration: 30, icon: '🤖' },
  { label: 'Free Time', startHour: 21.83, duration: 40, icon: '📱' },
  { label: 'Sleep', startHour: 22.5, duration: 0, icon: '🌙' },
];

// Weekly subject rotation
const WEEKLY_SUBJECTS = [
  { day: 1, subjects: ['Operating Systems', 'DBMS'], label: 'OS + DBMS' },
  { day: 2, subjects: ['Computer Networks', 'Algorithms'], label: 'CN + Algorithms' },
  { day: 3, subjects: ['Theory of Computation', 'Compiler Design'], label: 'TOC + CD' },
  { day: 4, subjects: ['Programming & Data Structures', 'Computer Organization'], label: 'DS + CO' },
  { day: 5, subjects: ['Engineering Mathematics', 'Digital Logic'], label: 'Math + DL' },
  { day: 6, subjects: ['General Aptitude', 'All Subjects Revision'], label: 'Aptitude + Revision' },
  { day: 0, label: 'Full Mock + Revision', isMock: true },
];

const SUBJECT_COLORS = {
  'Operating Systems': '#8B5CF6',
  'DBMS': '#3B82F6',
  'Computer Networks': '#06B6D4',
  'Algorithms': '#F59E0B',
  'Programming & Data Structures': '#6366F1',
  'Theory of Computation': '#EC4899',
  'Compiler Design': '#EF4444',
  'Computer Organization': '#14B8A6',
  'Digital Logic': '#EAB308',
  'Engineering Mathematics': '#22C55E',
  'General Aptitude': '#FBBF24',
};

// Generate default timetable on first load
function generateDefaultSchedule(today) {
  const dayOfWeek = today.getDay();
  const rotation = WEEKLY_SUBJECTS[dayOfWeek] || WEEKLY_SUBJECTS[1];
  const now = new Date();
  const isSunday = dayOfWeek === 0;

  return DEFAULT_SCHEDULE.map((slot, i) => {
    const id = Date.now() + i;
    const isStudyBlock = slot.label === 'New Concepts' || slot.label === 'PYQ Practice' || slot.label === 'Mock Test' || slot.label === 'Mock Analysis';
    const style = ACTIVITY_STYLES[slot.label] || ACTIVITY_STYLES['Break'];
    const subject = isStudyBlock && !isSunday
      ? rotation.subjects[i % rotation.subjects.length]
      : isSunday && slot.label === 'Mock Test' ? 'General'
      : slot.label === 'New Concepts' && isSunday ? 'Revision'
      : '';
    const topic = subject ? `${slot.label} — ${rotation.label}` : '';

    return {
      id,
      subject: subject || slot.label,
      topic: topic || slot.label,
      hours: slot.duration / 60,
      startHour: slot.startHour,
      notes: '',
      done: false,
      color: style.bg,
      icon: style.icon,
      progress: 0,
      isDefault: true,
    };
  }).filter(s => s.hours > 0);
}

// Generate smart schedule from weak topics
function generateSmartSchedule(topics, pyqs, studyStats, dailyHours = 8) {
  const SUBJECT_WEIGHTAGE = {
    'Operating Systems': 9, 'Computer Networks': 8.5, 'DBMS': 8,
    'Computer Organization': 8.5, 'Theory of Computation': 8, 'Algorithms': 7.5,
    'Programming & Data Structures': 11.5, 'Engineering Mathematics': 12.5,
    'Digital Logic': 5, 'Compiler Design': 5, 'General Aptitude': 15,
  };
  const subjects = computeSubjectCompletion(studyStats?.subjects || [], topics, pyqs);
  const sorted = [...subjects].sort((a, b) => {
    const wa = SUBJECT_WEIGHTAGE[a.name] || 5;
    const wb = SUBJECT_WEIGHTAGE[b.name] || 5;
    return (wa * (1 - a.progress / 100)) - (wb * (1 - b.progress / 100));
  });
  const weak = sorted.filter(s => s.progress < 50);
  const mid = sorted.filter(s => s.progress >= 50 && s.progress < 75);
  if (!weak.length && !mid.length) return [];

  const schedule = [];
  let hour = 14;
  let remainingMins = dailyHours * 60;
  const push = (sub, label, mins) => {
    if (remainingMins <= 0) return;
    const actualMins = Math.min(mins, remainingMins);
    const meta = subjectMeta(sub.name);
    schedule.push({ id: Date.now() + schedule.length, subject: sub.name, label: label || 'Revision', duration: actualMins, startHour: hour, color: meta.color, icon: meta.icon, progress: sub.progress });
    hour += Math.ceil(actualMins / 60);
    remainingMins -= actualMins;
  };

  weak.slice(0, 2).forEach(s => push(s, s.name === 'General Aptitude' ? 'Practice' : 'Core Topics', Math.round(dailyHours * 60 * 0.35)));
  mid.slice(0, 1).forEach(s => push(s, 'PYQ Practice', Math.round(dailyHours * 60 * 0.2)));
  if (remainingMins > 60 && pyqs?.length) push(mid[0] || weak[0], 'PYQ Practice', Math.round(dailyHours * 60 * 0.2));
  if (remainingMins > 30 && sorted.length) push(sorted[sorted.length - 1], 'Quick Revision', Math.round(dailyHours * 60 * 0.15));

  return schedule;
}

export default function StudyPlannerPage() {
  const { gateFeatures, updateGateFeatures, syncToCloud, topics, pyqs, mocks, studyStats } = useProgress();
  const navigate = useNavigate();
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
  const seededRef = useRef(false);

  // Auto-generate default timetable on first load (never empty)
  useEffect(() => {
    if (seededRef.current) return;
    const plans = gateFeatures?.studyPlans;
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const hasTodayPlans = plans?.[todayKey]?.length > 0;
    const totalPlans = plans ? Object.values(plans).flat().length : 0;
    if (totalPlans === 0 && !seededRef.current) {
      seededRef.current = true;
      const defaultPlan = generateDefaultSchedule(new Date());
      updateGateFeatures((gf) => ({
        ...gf,
        studyPlans: { ...(gf.studyPlans || {}), [todayKey]: defaultPlan },
      }));
    }
  }, [gateFeatures]);

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

  const defaultSchedule = useMemo(() => generateDefaultSchedule(today), []);

  const todayKey = format(today, 'yyyy-MM-dd');
  const todayPlans = (() => {
    const plans = getPlans(today);
    return plans.length > 0 ? plans : defaultSchedule;
  })();
  const subjects = computeSubjectCompletion(studyStats?.subjects || [], topics, pyqs);
  const smartSched = useMemo(() => generateSmartSchedule(topics, pyqs, studyStats), [topics, pyqs, studyStats]);

  const totalHours = todayPlans.reduce((s, p) => s + (+p.hours || 0), 0);
  const completedCount = todayPlans.filter(p => p.done).length;

  // Show today's schedule by default
  const [activeDay, setActiveDay] = useState(todayKey);
  const activeDate = new Date(activeDay + 'T00:00:00');
  const activePlans = format(activeDate, 'yyyy-MM-dd') === todayKey
    ? [...defaultSchedule, ...getPlans(activeDate)]
    : getPlans(activeDate);

  // Time-based current hour highlight
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const startFocusSession = (plan) => {
    const subj = typeof plan.subject === 'string' ? plan.subject : GATE_SUBJECTS[0]?.name || '';
    navigate(`/productivity?subject=${encodeURIComponent(subj || '')}`);
  };
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
        period: 'day',
        daysRemaining: getCountdown(gateFeatures?.examDate).days,
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
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-80px)] lg:h-[calc(100vh-140px)] min-h-0 lg:min-h-[600px]">
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
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-text3">Progress</span>
                <span className="text-[10px] font-mono text-text3">{todayPlans.length > 0 ? Math.round((completedCount / todayPlans.length) * 100) : 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${todayPlans.length > 0 ? (completedCount / todayPlans.length) * 100 : 0}%`, background: 'linear-gradient(90deg, var(--color-primary), #22D3EE)' }} />
              </div>
              <div className="text-[10px] text-text3 mb-1.5">Current</div>
              <div className="text-xs font-medium text-text truncate">{todayPlans[0]?.topic || ''}</div>
              <div className="text-xs text-text3 mt-2 mb-1.5">Next</div>
              <div className="text-xs text-text truncate">{todayPlans[1]?.topic || '—'}</div>
            </div>
          )}
        </div>

        {/* Goal + Streak */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-2">Today's Goal</div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text3">{totalHours}h of {gateFeatures?.dailyTarget?.hours || 8}h</span>
            <span className="text-[10px] font-mono text-primary">{Math.round(Math.min(100, (totalHours / (gateFeatures?.dailyTarget?.hours || 8)) * 100))}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (totalHours / (gateFeatures?.dailyTarget?.hours || 8)) * 100)}%`, background: 'linear-gradient(90deg, #22C55E, #4ADE80)' }} />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text3 flex items-center gap-1">🔥 {gateFeatures?.streak?.current || 0} Day Streak</span>
            <span className="text-text3">Next:{' '}
              {todayPlans.find(p => !p.done) ? (() => {
                const p = todayPlans.find(pl => !pl.done);
                const h = p.startHour || 14;
                return `${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'}`;
              })() : '—'}
            </span>
          </div>
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

        {/* Weekly Heatmap */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-thin">
          {weekDays.map((d) => {
            const k = format(d, 'yyyy-MM-dd');
            const count = getPlans(d).length;
            const doneCount = getPlans(d).filter(p => p.done).length;
            const ratio = count > 0 ? doneCount / count : 0;
            return (
              <button key={k} onClick={() => setActiveDay(k)}
                className="flex flex-col items-center gap-0.5 shrink-0"
                title={`${format(d, 'EEEE')}: ${doneCount}/${count} done`}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-all"
                  style={{
                    background: count === 0 ? 'rgba(255,255,255,0.03)' :
                      ratio >= 1 ? 'rgba(34,197,94,0.25)' :
                      ratio >= 0.5 ? 'rgba(139,92,246,0.2)' :
                      'rgba(234,179,8,0.15)',
                    border: k === activeDay ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.04)',
                    color: count === 0 ? 'rgba(255,255,255,0.2)' : ratio >= 1 ? '#4ADE80' : ratio >= 0.5 ? '#A78BFA' : '#EAB308',
                  }}>
                  {format(d, 'd')}
                </div>
                <span className="text-[8px] text-text3/60 uppercase">{format(d, 'EEE')}</span>
                {count > 0 && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${i < doneCount ? 'bg-success' : 'bg-white/10'}`} />
                    ))}
                  </div>
                )}
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
                    className={`flex-1 min-h-[56px] border-l-2 pl-3 py-1.5 relative transition-all ${isCurrentHour ? 'border-primary border-l-[3px] bg-primary/[0.03]' : 'border-border/40'} ${idx === HOURS.length - 1 ? '' : 'mb-0.5'}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (draggingId) dropPlan(activeDay, draggingId, h); }}
                  >
                    {isCurrentHour && (
                      <div className="absolute left-[-2.5px] top-0 w-[5px] h-full bg-primary rounded-full animate-pulse" />
                    )}
                    {/* Timeline dot indicator */}
                    <div className={`absolute left-[-4px] top-2 w-[6px] h-[6px] rounded-full border-2 ${isCurrentHour ? 'bg-primary border-primary' : 'bg-surface border-border'}`} />

                    {plansAtHour.length === 0 && !isCurrentHour && (
                      <div className="w-full h-full min-h-[40px] rounded-lg flex items-center justify-center gap-2">
                        <button onClick={() => openAdd(activeDate)}
                          className="text-[10px] px-3 py-1.5 rounded-lg border border-dashed border-border/40 hover:border-primary/30 hover:bg-primary/[0.03] text-text3/40 hover:text-text3/60 transition-all">
                          + Add Custom Session
                        </button>
                        {hourFloat >= 8 && hourFloat <= 16 && (
                          <button onClick={generateAiSchedule} disabled={aiGenerating}
                            className="text-[10px] px-3 py-1.5 rounded-lg border border-dashed border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/[0.03] text-purple-400/40 hover:text-purple-400/60 transition-all">
                            {aiGenerating ? '···' : '✨ AI Suggest'}
                          </button>
                        )}
                      </div>
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
                            style={{
                              borderLeftColor: meta.color,
                            }}
                            className="border border-white/[0.06] border-l-[3px] rounded-xl p-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 opacity-[0.03]" style={{ background: `linear-gradient(135deg, ${meta.color}, transparent)` }} />
                            <div className="relative z-10">
                              {/* Header: subject + priority */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <GripVertical size={12} className="text-text3/30 group-hover:text-text3/60 cursor-grab shrink-0" />
                                  {/* Activity type color dot */}
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: plan.color?.match(/#[0-9a-fA-F]{6}/)?.[0] || meta.color }} />
                                  <span className="text-[11px] font-semibold truncate" style={{ color: meta.color }}>{meta.icon} {plan.subject}</span>
                                  {(plan.priority || getSubjectDifficulty(plan.subject) >= 4) && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0" title="High priority">
                                      🔥 High
                                    </span>
                                  )}
                                </div>
                                {/* Status badge */}
                                {plan.done ? (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 shrink-0">✓ Done</span>
                                ) : plan.started ? (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 animate-pulse">● Active</span>
                                ) : (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-text3 border border-white/[0.06] shrink-0">☐ Pending</span>
                                )}
                              </div>

                              {/* Topic + Goal */}
                              <div className="pl-[22px]">
                                <div className="text-xs font-semibold text-text truncate flex items-center gap-1.5">
                                  <span>{(ACTIVITY_STYLES[plan.topic]?.icon || plan.icon || '📘')}</span>
                                  <span className="truncate">{plan.topic}</span>
                                </div>
                                {plan.goal && (
                                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-text3">
                                    <span>🎯</span>
                                    <span className="truncate">{plan.goal}</span>
                                  </div>
                                )}
                              </div>

                              {/* Progress + Difficulty */}
                              <div className="flex items-center gap-3 mt-1.5 pl-[22px]">
                                {!plan.done && (
                                  <div className="flex-1 min-w-0">
                                    <div className="h-2 rounded-full bg-white/5 overflow-hidden shadow-inner">
                                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(100, plan.progress || 0)}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`, boxShadow: plan.progress > 50 ? `0 0 8px ${meta.color}44` : 'none' }} />
                                    </div>
                                  </div>
                                )}
                                <span className="text-[9px] text-amber-400/60 shrink-0 font-mono">{'\u2605'.repeat(getSubjectDifficulty(plan.subject))}{'\u2606'.repeat(5 - getSubjectDifficulty(plan.subject))}</span>
                              </div>

                              {/* Duration + meta */}
                              <div className="flex items-center gap-3 mt-1 pl-[22px]">
                                <span className="text-[9px] text-text3">{dur}min</span>
                                <span className="text-[9px] text-text3">{format(new Date().setHours(h, 0, 0, 0), 'h:mm a')} – {format(new Date().setHours(Math.min(endHour, 23), 0, 0, 0), 'h:mm a')}</span>
                              </div>

                              {/* Quick actions row */}
                              <div className="flex items-center gap-2 mt-1.5 pl-[22px]">
                                <button onClick={e => { e.stopPropagation(); navigate('/notes'); }}
                                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-text3 hover:text-text hover:bg-white/[0.08] transition-all" title="Notes">📄 Notes</button>
                                <button onClick={e => { e.stopPropagation(); navigate('/pyq'); }}
                                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-text3 hover:text-text hover:bg-white/[0.08] transition-all" title="PYQs">❓ PYQs</button>
                                <button onClick={e => { e.stopPropagation(); navigate('/formulas'); }}
                                  className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-text3 hover:text-text hover:bg-white/[0.08] transition-all" title="Formula Sheet">📝 Formula</button>
                              </div>

                              {/* Action row: Start/Done */}
                              <div className="flex items-center justify-end gap-2 mt-2 pl-[22px]">
                                <div className="flex items-center gap-2">
                                  {!plan.done && (
                                    <button onClick={e => { e.stopPropagation(); startFocusSession(plan); }}
                                      className="text-xs px-4 min-h-[36px] rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold flex items-center gap-1.5">
                                      ▶ Start
                                    </button>
                                  )}
                                  <button onClick={e => { e.stopPropagation(); toggleDone(activeDate, plan.id); }}
                                    className={"text-xs px-3 min-h-[36px] rounded-lg border transition-all flex items-center gap-1.5 " + (plan.done ? 'bg-success/10 border-success/20 text-success' : 'bg-white/5 border-white/10 text-text3 hover:text-text')}>
                                    {plan.done ? '✓ Done' : plan.started ? '⏸ Mark' : '☐ Done'}
                                  </button>
                                </div>
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
                <button onClick={() => { setSelectedDate(activeDate); setForm({ subject: GATE_SUBJECTS[0].name, topic: GATE_SUBJECTS[0].highRoiTopics[0] || '', hours: 1, notes: '' }); setEditId(null); setShowModal(true); }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-bg-2 border border-border text-text2 hover:border-white/15">
                  Create Manually
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Motivation footer */}
        {todayPlans.length > 0 && completedCount < todayPlans.length && (
          <div className="mt-3 text-center">
            <p className="text-[10px] text-text3/60">
              🔥 {completedCount > 0 ? `Only ${todayPlans.length - completedCount} more sessions to reach today's goal. Keep going!` : 'Start your first session to begin the momentum.'}
            </p>
          </div>
        )}
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
          <div className="text-xs font-semibold text-text mb-3 flex items-center gap-1.5">
            <span>📋</span> Revision Due Today
          </div>
          {subjects.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{subjectMeta(subjects.sort((a, b) => a.progress - b.progress)[0].name).icon}</span>
                <span className="text-xs font-medium text-text">{subjects.sort((a, b) => a.progress - b.progress)[0].name}</span>
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">High</span>
              </div>
              <div className="text-[10px] text-text3 mb-2">{subjects.sort((a, b) => a.progress - b.progress)[0].progress}% complete · 2 topics pending</div>
              <a href={`/topics`} className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">Start Revision →</a>
            </div>
          ) : (
            <p className="text-[10px] text-text3 py-2">Complete topics to build revision queue</p>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-3 flex items-center gap-1.5">
            <span>❓</span> Today's PYQs
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary font-mono mb-1">{pyqs?.filter(p => p.solved)?.length || 0}</div>
            <div className="text-[10px] text-text3">questions solved</div>
            <a href="/pyq" className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">Solve PYQs →</a>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-3 flex items-center gap-1.5">
            <span>🎯</span> Mock Reminder
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">📅 Sunday 9 AM</div>
            <div className="text-[10px] text-text3 mb-2">Full-length mock every Sunday</div>
            <a href="/mocks" className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">Schedule Mock →</a>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text mb-2">AI Insight</div>
          {subjects.length > 0 ? (
            <p className="text-[10px] text-text3 leading-relaxed">
              Focus on <span className="text-primary font-medium">{subjects.sort((a, b) => a.progress - b.progress)[0]?.name?.split(' ').slice(-1)[0] || 'your weakest subject'}</span> today.
              Complete PYQs and revision for better retention.
            </p>
          ) : (
            <p className="text-[10px] text-text3 leading-relaxed">Start studying to get AI suggestions.</p>
          )}
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
            <select value={form.subject} onChange={e => {
              const sub = GATE_SUBJECTS.find(s => s.name === e.target.value);
              setForm(f => ({ ...f, subject: e.target.value, topic: sub?.highRoiTopics?.[0] || '' }));
            }}
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60">
              {GATE_SUBJECTS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Topic</label>
            <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60">
              {(GATE_SUBJECTS.find(s => s.name === form.subject)?.highRoiTopics || []).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
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
