import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, isToday, isSameDay } from 'date-fns';
import { useProgress } from '../context/ProgressContext';
import { useFocus } from '../context/FocusContext';
import { aiService } from '../services/api';
import { detectWeakTopics, computeRevisionPriority, getCountdown } from '../utils/gateUtils';
import GlassCard from '../components/ui/GlassCard';
import ProgressRing from '../components/ui/ProgressRing';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const SUBJECT_COLORS = {
  'Engineering Mathematics': '#10B981',
  'Programming & Data Structures': '#6366F1',
  'Programming & DS': '#6366F1',
  'Algorithms': '#3B82F6',
  'DBMS': '#F59E0B',
  'Operating Systems': '#22C55E',
  'Computer Networks': '#06B6D4',
  'Theory of Computation': '#A855F7',
  'Compiler Design': '#EC4899',
  'Computer Organization': '#EF4444',
  'Computer Organization (COA)': '#EF4444',
  'Digital Logic': '#84CC16',
  'General Aptitude': '#F97316',
  'Full-Length Mock': '#EF4444',
  'Mixed': '#8B5CF6',
};

const SUBJECT_ICONS = {
  'Engineering Mathematics': '\u2211',
  'Programming & Data Structures': '\u25CE',
  'Programming & DS': '\u25CE',
  'Algorithms': '\uD83D\uDCC8',
  'DBMS': '\uD83D\uDDC4\uFE0F',
  'Operating Systems': '\uD83D\uDCBB',
  'Computer Networks': '\uD83C\uDF10',
  'Theory of Computation': '\uD83E\uDDF1',
  'Compiler Design': '\u2699\uFE0F',
  'Computer Organization': '\u2699\uFE0F',
  'Computer Organization (COA)': '\u2699\uFE0F',
  'Digital Logic': '\uD83D\uDCA1',
  'General Aptitude': '\uD83C\uDFAF',
  'Full-Length Mock': '\uD83D\uDCDD',
  'Mixed': '\u2728',
};

const BLOCK_TYPES = [
  { id: 'new-concept', label: 'New Concepts', icon: '\uD83D\uDCDA', color: '#8B5CF6' },
  { id: 'problem-solving', label: 'Problem Solving', icon: '\u26A1', color: '#22D3EE' },
  { id: 'revision', label: 'Revision', icon: '\uD83D\uDD04', color: '#F59E0B' },
  { id: 'pyq', label: 'PYQ Practice', icon: '\uD83D\uDCC4', color: '#22C55E' },
  { id: 'mock', label: 'Mock Test', icon: '\uD83D\uDCDD', color: '#EF4444' },
  { id: 'focus', label: 'Focus Session', icon: '\uD83C\uDFAF', color: '#3B82F6' },
  { id: 'break', label: 'Break', icon: '\u2615', color: '#64748B' },
  { id: 'free', label: 'Free Time', icon: '\uD83C\uDFB5', color: '#475569' },
  { id: 'planning', label: 'Planning', icon: '\uD83D\uDCC5', color: '#8B5CF6' },
];

const BLOCK_TYPE_MAP = Object.fromEntries(BLOCK_TYPES.map(b => [b.id, b]));
function getBlockType(id) { return BLOCK_TYPE_MAP[id] || BLOCK_TYPES[0]; }
function getSubjectColor(name) { return SUBJECT_COLORS[name] || '#8B5CF6'; }
function getSubjectIcon(name) { return SUBJECT_ICONS[name] || '\uD83D\uDCD6'; }
function generateId() { return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function formatTime12(h, m) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${String(m).padStart(2, '0')} ${period}`;
}
function parseTime(t) {
  if (!t || typeof t !== 'string') return { h: 0, m: 0 };
  const [h, m] = t.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}
function blockDuration(b) {
  const s = parseTime(b.startTime);
  const e = parseTime(b.endTime);
  return Math.max(0, (e.h * 60 + e.m - s.h * 60 - s.m) / 60);
}

const HOUR_START = 5;
const HOUR_END = 23;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);
const PX_PER_HOUR = 64;
const PX_PER_15MIN = PX_PER_HOUR / 4;

function generateDefaultSchedule(weekStart, dailyTarget, subjects) {
  const schedule = {};
  const SUBJECT_WEIGHTAGE = {
    'Operating Systems': 9, 'Computer Networks': 8.5, 'DBMS': 8,
    'Computer Organization': 8.5, 'Theory of Computation': 8, 'Algorithms': 7.5,
    'Programming & Data Structures': 11.5, 'Engineering Mathematics': 12.5,
    'Digital Logic': 5, 'Compiler Design': 5, 'General Aptitude': 15,
  };
  const subNames = (subjects || [])
    .map(s => s.name)
    .filter(Boolean)
    .sort((a, b) => (SUBJECT_WEIGHTAGE[b] || 5) - (SUBJECT_WEIGHTAGE[a] || 5));
  const fallback = Object.entries(SUBJECT_WEIGHTAGE).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  const subs = subNames.length >= 3 ? subNames : fallback;
  const hours = Math.max(2, Math.min(14, dailyTarget || 8));
  const startHour = 6;
  const endHour = startHour + hours;

  const makeBlock = (type, subject, topic, startH, endH, notes) => ({
    id: generateId(), type, subject, topic, startTime: `${String(startH).padStart(2, '0')}:00`, endTime: `${String(endH).padStart(2, '0')}:00`, status: 'not-started', notes,
  });

  const buildDay = (dayIdx, blockDefs) => {
    const blocks = [];
    let h = startHour;
    for (const def of blockDefs) {
      const duration = Math.min(def.dur, endHour - h);
      if (duration <= 0) break;
      const sub = subs[(dayIdx + def.subOffset) % subs.length];
      blocks.push(makeBlock(def.type, def.type === 'break' || def.type === 'planning' ? '' : sub, def.topic || '', h, h + duration, def.notes));
      h += duration;
    }
    return blocks;
  };

  const weekday = (dayIdx) => buildDay(dayIdx, [
    { type: 'new-concept', subOffset: 0, dur: Math.min(2, hours * 0.25), notes: 'Morning deep study' },
    { type: 'break', subOffset: 0, dur: 0.5, topic: 'Break', notes: '' },
    { type: 'problem-solving', subOffset: 0, dur: Math.min(2, hours * 0.2), notes: 'Practice problems' },
    { type: 'break', subOffset: 0, dur: 0.5, topic: 'Break', notes: '' },
    { type: 'pyq', subOffset: 1, dur: Math.min(1.5, hours * 0.15), notes: 'PYQ session' },
    { type: 'break', subOffset: 0, dur: 1, topic: 'Lunch', notes: '' },
    { type: 'revision', subOffset: 2, dur: Math.min(1.5, hours * 0.15), notes: 'Spaced revision' },
    { type: 'new-concept', subOffset: 3, dur: Math.min(1.5, hours * 0.15), notes: 'New topic study' },
    { type: 'break', subOffset: 0, dur: 0.5, topic: 'Break', notes: '' },
    { type: 'problem-solving', subOffset: 1, dur: Math.min(1.5, hours * 0.1), notes: 'Evening practice' },
    { type: 'planning', subOffset: 0, dur: 0.5, topic: 'Tomorrow Planning', notes: 'Plan next day' },
  ]);

  const saturday = () => buildDay(3, [
    { type: 'new-concept', subOffset: 3, dur: Math.min(2, hours * 0.25), notes: 'Weak topic deep dive' },
    { type: 'break', subOffset: 0, dur: 0.5, topic: 'Break', notes: '' },
    { type: 'mock', subOffset: 0, dur: Math.min(3, hours * 0.3), topic: 'Full-Length Mock', notes: 'Weekly mock test' },
    { type: 'break', subOffset: 0, dur: 0.5, topic: 'Break', notes: '' },
    { type: 'revision', subOffset: 4, dur: Math.min(1.5, hours * 0.15), notes: 'Mock analysis + revision' },
    { type: 'break', subOffset: 0, dur: 1, topic: 'Lunch', notes: '' },
    { type: 'pyq', subOffset: 0, dur: Math.min(2, hours * 0.15), topic: 'Mixed', notes: 'PYQ marathon' },
  ]);

  const sunday = () => buildDay(6, [
    { type: 'revision', subOffset: 0, dur: Math.min(2, hours * 0.25), notes: 'Weekly full revision' },
    { type: 'break', subOffset: 0, dur: 0.5, topic: 'Break', notes: '' },
    { type: 'pyq', subOffset: 0, dur: Math.min(1.5, hours * 0.2), topic: 'Mixed', notes: 'PYQ practice — weak areas' },
    { type: 'break', subOffset: 0, dur: 0.5, topic: 'Break', notes: '' },
    { type: 'mock', subOffset: 0, dur: Math.min(2.5, hours * 0.25), topic: 'Full-Length Mock', notes: 'Sunday mock test' },
    { type: 'break', subOffset: 0, dur: 1, topic: 'Lunch', notes: '' },
    { type: 'revision', subOffset: 2, dur: Math.min(1.5, hours * 0.15), notes: 'Full revision' },
    { type: 'planning', subOffset: 0, dur: 0.5, topic: 'Next Week Planning', notes: 'Plan next week' },
  ]);

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const key = format(date, 'yyyy-MM-dd');
    if (i < 5) schedule[key] = weekday(i);
    else if (i === 5) schedule[key] = saturday();
    else schedule[key] = sunday();
  }
  return schedule;
}

function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') return Promise.resolve(false);
  return Notification.requestPermission().then(p => p === 'granted');
}

function notifyBlock(block) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const bt = getBlockType(block.type);
  new Notification(`GateNexa: ${bt.label} in 5 min`, {
    body: `${block.subject || bt.label} at ${block.startTime}`,
    icon: '/favicon.ico',
    tag: `block-reminder-${block.id}`,
  });
}

export default function StudySchedulePage() {
  const navigate = useNavigate();
  const { topics, pyqs, mocks, studyStats, gateFeatures, updateGateFeatures, revisionSchedule, syncToCloud } = useProgress();
  const { sessionsCompleted, dailyStreak, history } = useFocus();

  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBlock, setEditBlock] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [blockForm, setBlockForm] = useState({ type: 'new-concept', subject: '', topic: '', startTime: '08:00', endTime: '10:00', notes: '' });
  const timelineRef = useRef(null);
  const notifiedRef = useRef(new Set());

  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const examDate = gateFeatures?.examDate || '2027-02-07T09:00:00';
  const countdown = useMemo(() => getCountdown(examDate), [examDate]);
  const dailyTarget = gateFeatures?.dailyTarget?.hours || 8;
  const weeklyTarget = dailyTarget * 7;
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const plansLoaded = gateFeatures !== null && gateFeatures !== undefined;
  const hasExistingSchedule = useMemo(() => {
    if (!plansLoaded) return true;
    const plans = gateFeatures?.studyPlans || {};
    return Object.keys(plans).some(key => Array.isArray(plans[key]) && plans[key].length > 0);
  }, [gateFeatures?.studyPlans, plansLoaded]);

  const generatedRef = useRef(false);
  useEffect(() => {
    if (!plansLoaded || hasExistingSchedule || generatedRef.current) return;
    generatedRef.current = true;
    const def = generateDefaultSchedule(weekStart, dailyTarget, studyStats?.subjects || []);
    updateGateFeatures(gf => ({ ...gf, studyPlans: { ...(gf.studyPlans || {}), ...def } }));
  }, [plansLoaded, hasExistingSchedule, weekStart, dailyTarget, studyStats?.subjects, updateGateFeatures]);

  useEffect(() => {
    if (plansLoaded && !hasExistingSchedule && generatedRef.current) {
      generatedRef.current = false;
    }
  }, [plansLoaded, hasExistingSchedule]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const key = format(date, 'yyyy-MM-dd');
      const blocks = gateFeatures?.studyPlans?.[key] || [];
      const totalHours = blocks.reduce((s, b) => s + blockDuration(b), 0);
      const completed = blocks.filter(b => b.status === 'completed').length;
      return { date, key, blocks, totalHours, completed, pct: blocks.length ? Math.round((completed / blocks.length) * 100) : 0, isToday: isToday(date) };
    });
  }, [weekStart, gateFeatures?.studyPlans]);

  const selectedDayKey = format(selectedDay, 'yyyy-MM-dd');
  const selectedBlocks = useMemo(() => {
    return [...(gateFeatures?.studyPlans?.[selectedDayKey] || [])].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [gateFeatures?.studyPlans, selectedDayKey]);

  const weekPlanned = useMemo(() => weekDays.reduce((s, d) => s + d.totalHours, 0), [weekDays]);
  const weekCompleted = studyStats?.weekHours || 0;
  const totalBlocks = useMemo(() => weekDays.reduce((s, d) => s + d.blocks.length, 0), [weekDays]);
  const completedBlocks = useMemo(() => weekDays.reduce((s, d) => s + d.completed, 0), [weekDays]);

  const revisionDue = useMemo(() => (revisionSchedule || []).filter(r => r.status !== 'done'), [revisionSchedule]);
  const revisionOverdue = useMemo(() => revisionDue.filter(r => r.status === 'missed'), [revisionDue]);
  const revisionToday = useMemo(() => revisionDue.filter(r => r.status === 'today'), [revisionDue]);
  const revisionHighPriority = useMemo(() => {
    const today = new Date();
    return revisionDue.map(r => ({ ...r, priority: computeRevisionPriority(r, today) })).sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [revisionDue]);

  const weakTopics = useMemo(() => detectWeakTopics(topics, pyqs, mocks, studyStats?.subjects || []), [topics, pyqs, mocks, studyStats]);
  const recommendedPqs = useMemo(() => {
    const weak = new Set(weakTopics.slice(0, 3).map(w => w.name));
    return pyqs.filter(p => weak.has(p.topic) && !p.solved).slice(0, 5);
  }, [pyqs, weakTopics]);

  const todayFocusHrs = useMemo(() => (history || []).filter(h => h.date === todayKey).reduce((s, h) => s + (h.duration || 0) / 3600, 0), [history, todayKey]);
  const focusGoal = dailyTarget * 0.25;
  const focusProgress = Math.min(100, (todayFocusHrs / Math.max(1, focusGoal)) * 100);

  const subjectTime = useMemo(() => {
    const map = {};
    weekDays.forEach(d => d.blocks.forEach(b => {
      if (b.subject && b.type !== 'break' && b.type !== 'free' && b.type !== 'planning') {
        map[b.subject] = (map[b.subject] || 0) + blockDuration(b);
      }
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [weekDays]);

  const recommendations = useMemo(() => {
    const recs = [];
    weakTopics.slice(0, 2).forEach(w => recs.push({ text: `You are behind in ${w.name}.`, action: `Focus on ${w.name} topics today.`, color: getSubjectColor(w.name) }));
    if (revisionOverdue.length > 0) recs.push({ text: `Revision overdue for ${revisionOverdue[0].subject || revisionOverdue[0].topicName}.`, action: 'Review now to stay on track.', color: '#F59E0B' });
    if (weekCompleted < weeklyTarget * 0.5) recs.push({ text: 'Behind this week\'s target.', action: `Study ${Math.round(weeklyTarget - weekCompleted)} more hours.`, color: '#3B82F6' });
    if (completedBlocks < totalBlocks * 0.3) recs.push({ text: 'Most blocks are incomplete.', action: 'Start your next scheduled block.', color: '#8B5CF6' });
    if (recs.length === 0) recs.push({ text: 'Great progress! Keep the momentum.', action: 'Try a PYQ practice session.', color: '#22C55E' });
    return recs;
  }, [weakTopics, revisionOverdue, weekCompleted, weeklyTarget, completedBlocks, totalBlocks]);

  const upcomingMock = useMemo(() => {
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = addDays(now, i);
      const key = format(d, 'yyyy-MM-dd');
      if ((gateFeatures?.studyPlans?.[key] || []).some(b => b.type === 'mock')) return format(d, 'EEE, MMM d');
    }
    return 'Sunday';
  }, [gateFeatures?.studyPlans]);

  const nextUpBlock = useMemo(() => {
    if (!isToday(selectedDay)) return null;
    const upcoming = selectedBlocks.filter(b => {
      const start = parseTime(b.startTime);
      const startMin = start.h * 60 + start.m;
      return b.status !== 'completed' && startMin > nowMinutes;
    });
    return upcoming[0] || null;
  }, [selectedDay, selectedBlocks, nowMinutes]);

  const currentBlock = useMemo(() => {
    if (!isToday(selectedDay)) return null;
    return selectedBlocks.find(b => {
      if (b.status === 'completed') return false;
      const s = parseTime(b.startTime);
      const e = parseTime(b.endTime);
      const start = s.h * 60 + s.m;
      const end = e.h * 60 + e.m;
      return nowMinutes >= start && nowMinutes < end;
    }) || null;
  }, [selectedDay, selectedBlocks, nowMinutes]);

  useEffect(() => {
    if (!isToday(selectedDay)) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    selectedBlocks.forEach(b => {
      if (b.status === 'completed' || notifiedRef.current.has(b.id)) return;
      const s = parseTime(b.startTime);
      const startMin = s.h * 60 + s.m;
      const diff = startMin - nowMinutes;
      if (diff > 0 && diff <= 5) {
        notifiedRef.current.add(b.id);
        notifyBlock(b);
      }
    });
  }, [selectedDay, selectedBlocks, nowMinutes]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (isToday(selectedDay) && timelineRef.current) {
      const startMin = HOUR_START * 60;
      const scrollTarget = Math.max(0, ((nowMinutes - startMin) / 60) * PX_PER_HOUR - 100);
      timelineRef.current.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    }
  }, [selectedDay, nowMinutes]);

  const saveBlocks = useCallback(async (dateKey, blocks) => {
    updateGateFeatures(gf => ({ ...gf, studyPlans: { ...(gf.studyPlans || {}), [dateKey]: blocks } }));
  }, [updateGateFeatures]);

  const toggleBlockStatus = useCallback(async (blockId) => {
    const existing = gateFeatures?.studyPlans?.[selectedDayKey] || [];
    const updated = existing.map(b => {
      if (b.id !== blockId) return b;
      const next = b.status === 'completed' ? 'not-started' : b.status === 'not-started' ? 'in-progress' : 'completed';
      return { ...b, status: next };
    });
    await saveBlocks(selectedDayKey, updated);
  }, [gateFeatures?.studyPlans, selectedDayKey, saveBlocks]);

  const handleAddBlock = useCallback(async () => {
    if (!blockForm.startTime || !blockForm.endTime) return toast.error('Set times');
    if (blockForm.startTime >= blockForm.endTime) return toast.error('End after start');
    const existing = gateFeatures?.studyPlans?.[selectedDayKey] || [];
    await saveBlocks(selectedDayKey, [...existing, { id: generateId(), ...blockForm, status: 'not-started' }]);
    setShowAddModal(false);
    setBlockForm({ type: 'new-concept', subject: '', topic: '', startTime: '08:00', endTime: '10:00', notes: '' });
    toast.success('Block added');
  }, [blockForm, selectedDayKey, gateFeatures?.studyPlans, saveBlocks]);

  const handleEditBlock = useCallback(async () => {
    if (!editBlock) return;
    const existing = gateFeatures?.studyPlans?.[selectedDayKey] || [];
    await saveBlocks(selectedDayKey, existing.map(b => b.id === editBlock.id ? { ...b, ...blockForm } : b));
    setEditBlock(null);
    setShowAddModal(false);
    toast.success('Block updated');
  }, [editBlock, blockForm, selectedDayKey, gateFeatures?.studyPlans, saveBlocks]);

  const handleDeleteBlock = useCallback(async (blockId) => {
    const existing = gateFeatures?.studyPlans?.[selectedDayKey] || [];
    await saveBlocks(selectedDayKey, existing.filter(b => b.id !== blockId));
    toast.success('Removed');
  }, [selectedDayKey, gateFeatures?.studyPlans, saveBlocks]);

  const handleDuplicateBlock = useCallback(async (block) => {
    const existing = gateFeatures?.studyPlans?.[selectedDayKey] || [];
    const s = parseTime(block.endTime);
    const eH = Math.min(s.h + Math.round(blockDuration(block)), 23);
    await saveBlocks(selectedDayKey, [...existing, { ...block, id: generateId(), startTime: block.endTime, endTime: `${String(eH).padStart(2, '0')}:${String(s.m).padStart(2, '0')}`, status: 'not-started' }]);
    toast.success('Duplicated');
  }, [selectedDayKey, gateFeatures?.studyPlans, saveBlocks]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const subjects = (studyStats?.subjects || []).map(s => ({ name: s.name, progress: s.progress || 0 }));
      const weakNames = weakTopics.slice(0, 5).map(w => ({ name: w.name, subject: w.subject || w.name, done: false }));
      const overdue = revisionOverdue.map(r => ({ topic: r.topicName, subject: r.subject }));
      const res = await aiService.generatePlan({
        subjects, topics: weakNames,
        pyqs: pyqs.slice(0, 20).map(p => ({ topic: p.topic, subject: p.subject, difficulty: p.difficulty, solved: p.solved })),
        mocks: mocks.slice(-5).map(m => ({ score: m.score, subject: m.subject, name: m.name })),
        hoursPerDay: dailyTarget, dailyHours: dailyTarget, period: 'week',
        context: { weakTopics: weakNames, overdueRevisions: overdue, daysRemaining: countdown.days, streak: dailyStreak },
      });
      const result = res.data?.data;
      const plan = result?.plan || [];
      if (!Array.isArray(plan) || plan.length === 0) { toast('No plan generated.', { icon: ' ' }); return; }
      const dayMap = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
      const existing = gateFeatures?.studyPlans || {};
      const merged = { ...existing };
      plan.forEach(item => {
        const idx = dayMap[item.day] ?? dayMap[Object.keys(dayMap).find(k => item.day?.toLowerCase().startsWith(k.toLowerCase()))];
        if (idx === undefined) return;
        const dateKey = format(addDays(weekStart, idx), 'yyyy-MM-dd');
        const sh = 8;
        const eh = Math.min(sh + Math.round(item.hours || 2), 23);
        merged[dateKey] = [...(merged[dateKey] || []), { id: generateId(), type: 'new-concept', subject: item.subject || '', topic: item.topic || '', startTime: `${String(sh).padStart(2, '0')}:00`, endTime: `${String(eh).padStart(2, '0')}:00`, status: 'not-started', notes: (item.tasks || []).join('; ') }];
      });
      updateGateFeatures(gf => ({ ...gf, studyPlans: merged }));
      await syncToCloud();
      toast.success(`Schedule generated (${result?.source || 'AI'})!`);
    } catch { toast.error('Failed to generate'); }
    finally { setGenerating(false); }
  }, [studyStats, weakTopics, revisionOverdue, pyqs, mocks, dailyTarget, countdown, dailyStreak, gateFeatures?.studyPlans, weekStart, updateGateFeatures, syncToCloud]);

  const openEdit = (b) => { setBlockForm({ type: b.type, subject: b.subject || '', topic: b.topic || '', startTime: b.startTime, endTime: b.endTime, notes: b.notes || '' }); setEditBlock(b); setShowAddModal(true); };
  const openAdd = () => { setBlockForm({ type: 'new-concept', subject: '', topic: '', startTime: '08:00', endTime: '10:00', notes: '' }); setEditBlock(null); setShowAddModal(true); };
  const subjects = studyStats?.subjects || [];

  const currentTimeTopPx = useMemo(() => {
    if (nowMinutes < HOUR_START * 60 || nowMinutes > (HOUR_END + 1) * 60) return null;
    return ((nowMinutes - HOUR_START * 60) / 60) * PX_PER_HOUR;
  }, [nowMinutes]);

  const dayTotalMin = useMemo(() => {
    if (!selectedBlocks.length) return 0;
    let latest = 0;
    selectedBlocks.forEach(b => {
      const e = parseTime(b.endTime);
      latest = Math.max(latest, e.h * 60 + e.m);
    });
    return latest;
  }, [selectedBlocks]);

  const timelineHeightPx = Math.max(
    (HOUR_END - HOUR_START + 1) * PX_PER_HOUR,
    dayTotalMin > 0 ? ((dayTotalMin - HOUR_START * 60) / 60) * PX_PER_HOUR + 40 : 0
  );

  function getBlockTopPx(b) {
    const s = parseTime(b.startTime);
    return ((s.h * 60 + s.m - HOUR_START * 60) / 60) * PX_PER_HOUR;
  }

  function getBlockHeightPx(b) {
    return blockDuration(b) * PX_PER_HOUR;
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">Study Schedule</h1>
          <p className="text-sm text-text3 mt-0.5">{countdown.days} days to GATE 2027</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openAdd} className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-text2 text-xs font-medium hover:bg-white/[0.1] transition-all">
            <span>+</span> Add
          </button>
          <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50">
            {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>✨</span>}
            {generating ? 'Generating...' : 'Auto-Generate'}
          </button>
        </div>
      </div>

      {/* Stat Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none -mx-1 px-1">
        {[
          { label: 'Planned', value: `${weekPlanned.toFixed(0)}h`, sub: `of ${weeklyTarget}h`, color: '#8B5CF6' },
          { label: 'Today', value: `${dailyTarget}h`, sub: 'target', color: '#22D3EE' },
          { label: 'Done', value: `${weekCompleted.toFixed(1)}h`, sub: 'this week', color: '#22C55E' },
          { label: 'Streak', value: `${dailyStreak || studyStats?.streak?.current || 0}`, sub: 'days', color: '#F59E0B' },
          { label: 'Overdue', value: revisionOverdue.length, sub: 'revisions', color: '#EF4444' },
          { label: 'Next Mock', value: upcomingMock, sub: '', color: '#3B82F6' },
          { label: 'Blocks', value: `${completedBlocks}/${totalBlocks}`, sub: 'done', color: '#22C55E' },
          { label: 'GATE', value: `${countdown.days}d`, sub: format(new Date(examDate), 'MMM d'), color: '#A855F7' },
        ].map((s, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] min-w-[80px]">
            <div className="text-[9px] text-text3 uppercase tracking-wider">{s.label}</div>
            <div className="text-sm font-bold font-mono mt-0.5" style={{ color: s.color }}>{s.value}</div>
            {s.sub && <div className="text-[8px] text-text3">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Day Strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-none -mx-1 px-1">
        {weekDays.map(d => {
          const pct = d.pct;
          const isSelected = isSameDay(d.date, selectedDay);
          const barColor = pct >= 80 ? '#22C55E' : pct >= 40 ? '#F59E0B' : '#EF4444';
          return (
            <button key={d.key} onClick={() => setSelectedDay(d.date)} className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-xl border transition-all min-w-[72px] ${isSelected ? 'border-primary/50 bg-primary/10' : d.isToday ? 'border-white/15 bg-white/[0.04]' : 'border-transparent bg-white/[0.02] hover:bg-white/[0.04]'}`}>
              <div className={`text-[10px] font-semibold ${d.isToday ? 'text-primary' : 'text-text3'}`}>{format(d.date, 'EEE')}</div>
              <div className={`text-xs font-bold font-mono ${isSelected ? 'text-primary' : 'text-text'}`}>{format(d.date, 'd')}</div>
              <div className="w-8 h-1 rounded-full overflow-hidden bg-white/[0.06] mt-0.5">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <div className="text-[8px] text-text3">{d.totalHours.toFixed(0)}h</div>
            </button>
          );
        })}
      </div>

      {/* NEXT UP / CURRENT Card */}
      {(currentBlock || nextUpBlock) && isToday(selectedDay) && (
        <GlassCard hover={false} padding="p-0" className="mb-5 overflow-hidden">
          <div className="relative p-4 overflow-hidden">
            {currentBlock && (() => {
              const b = currentBlock;
              const bt = getBlockType(b.type);
              const subColor = getSubjectColor(b.subject);
              const sMin = parseTime(b.startTime).h * 60 + parseTime(b.startTime).m;
              const eMin = parseTime(b.endTime).h * 60 + parseTime(b.endTime).m;
              const progress = Math.min(100, Math.max(0, ((nowMinutes - sMin) / (eMin - sMin)) * 100));
              return (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: subColor }} />
                  <div className="absolute inset-0 opacity-[0.03]" style={{ background: `linear-gradient(135deg, ${subColor}, transparent)` }} />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${subColor}15` }}>{getSubjectIcon(b.subject)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse" style={{ background: `${subColor}20`, color: subColor }}>In Progress</span>
                        </div>
                        <div className="text-sm font-bold text-text mt-1 truncate">{b.subject || bt.label}{b.topic ? ` — ${b.topic}` : ''}</div>
                        <div className="text-[10px] text-text3 font-mono mt-0.5">{b.startTime} – {b.endTime}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-2">
                      <ProgressRing value={progress} size={52} stroke={4} color={subColor} />
                      <button onClick={() => toggleBlockStatus(b.id)} className="text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all" style={{ background: `${subColor}15`, color: subColor }}>Complete</button>
                    </div>
                  </div>
                </>
              );
            })()}
            {!currentBlock && nextUpBlock && (() => {
              const b = nextUpBlock;
              const bt = getBlockType(b.type);
              const subColor = getSubjectColor(b.subject);
              const sMin = parseTime(b.startTime).h * 60 + parseTime(b.startTime).m;
              const minsUntil = sMin - nowMinutes;
              return (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: subColor }} />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${subColor}10` }}>{bt.icon}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ background: '#3B82F620', color: '#3B82F6' }}>Next Up</span>
                          <span className="text-[10px] font-mono text-text3">{minsUntil}m</span>
                        </div>
                        <div className="text-sm font-bold text-text mt-1 truncate">{b.subject || bt.label}{b.topic ? ` — ${b.topic}` : ''}</div>
                        <div className="text-[10px] text-text3 font-mono mt-0.5">{b.startTime} – {b.endTime}</div>
                      </div>
                    </div>
                    <button onClick={() => toggleBlockStatus(b.id)} className="text-[10px] px-3 py-1.5 rounded-lg font-medium bg-white/[0.06] border border-white/10 text-text2 hover:bg-white/[0.1] transition-all shrink-0">Start</button>
                  </div>
                </>
              );
            })()}
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
        {/* Main Column */}
        <div className="space-y-5">
          {/* Premium Timeline */}
          <GlassCard hover={false} padding="p-0" className="overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div>
                <h2 className="text-sm font-semibold text-text">{format(selectedDay, 'EEEE, MMMM d')}</h2>
                <p className="text-[10px] text-text3 mt-0.5">{selectedBlocks.length} blocks planned</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={openAdd} className="hidden md:flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-medium">
                  <span>+</span> Add Block
                </button>
              </div>
            </div>

            {selectedBlocks.length === 0 ? (
              <div className="text-center py-16 text-text3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-2xl mb-4">
                  📅
                </div>
                <p className="text-sm font-medium text-text2">No Blocks Scheduled</p>
                <p className="text-[10px] mt-1">Add a block or auto-generate your schedule</p>
                <button onClick={openAdd} className="mt-4 text-[11px] px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-medium">+ Add Block</button>
              </div>
            ) : (
              <div ref={timelineRef} className="overflow-y-auto max-h-[600px] md:max-h-[720px] scrollbar-thin">
                <div className="relative" style={{ height: `${timelineHeightPx}px` }}>
                  {/* Time grid lines + labels */}
                  {HOURS.map(hour => {
                    const topPx = ((hour - HOUR_START) * 60) / 60 * PX_PER_HOUR;
                    return (
                      <div key={hour}>
                        <div className="absolute left-0 right-0 flex items-start pointer-events-none" style={{ top: `${topPx}px` }}>
                          <div className="w-[52px] shrink-0 text-right pr-2 -mt-2">
                            <span className="text-[10px] text-text2 font-mono font-medium">{formatTime12(hour, 0)}</span>
                          </div>
                          <div className="flex-1 border-t border-white/[0.04]" />
                        </div>
                        {[15, 30, 45].map(min => {
                          const subTop = topPx + (min / 60) * PX_PER_HOUR;
                          return (
                            <div key={`${hour}-${min}`} className="absolute left-[52px] right-0 pointer-events-none" style={{ top: `${subTop}px` }}>
                              <div className="border-t border-dashed border-white/[0.03]" />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Current time line */}
                  {isToday(selectedDay) && currentTimeTopPx !== null && (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${currentTimeTopPx}px` }}>
                      <div className="flex items-center">
                        <div className="w-[52px] shrink-0 flex justify-end pr-1.5 -mt-2">
                          <span className="text-[11px] font-mono font-bold text-red-400">{format(now, 'h:mm')}</span>
                        </div>
                        <div className="flex items-center flex-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 shadow-lg shadow-red-500/50 animate-pulse" />
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-red-500/80 via-red-500/40 to-transparent" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Task Blocks — absolute positioned */}
                  {selectedBlocks.map(b => {
                    const bt = getBlockType(b.type);
                    const subColor = getSubjectColor(b.subject);
                    const blockTop = getBlockTopPx(b);
                    const blockHeight = Math.max(28, getBlockHeightPx(b));
                    const isCompleted = b.status === 'completed';
                    const isInProgress = b.status === 'in-progress';
                    const isNow = isToday(selectedDay) && !isCompleted && (() => {
                      const bStart = parseTime(b.startTime);
                      const bEnd = parseTime(b.endTime);
                      return nowMinutes >= bStart.h * 60 + bStart.m && nowMinutes < bEnd.h * 60 + bEnd.m;
                    })();
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

                    return (
                      <div
                        key={b.id}
                        className={`absolute left-[56px] right-3 rounded-lg border-l-[3px] group transition-all ${isCompleted ? 'opacity-40' : ''} ${isNow ? 'ring-1 ring-primary/40 z-10' : ''}`}
                        style={{
                          top: `${blockTop}px`,
                          height: `${blockHeight}px`,
                          background: isNow ? `${subColor}12` : `${subColor}08`,
                          borderLeftColor: subColor,
                          borderColor: `${subColor}20`,
                        }}
                      >
                        <div className={`flex items-center gap-2 h-full px-2.5 ${blockHeight < 36 ? 'py-0.5' : 'py-1.5'}`}>
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleBlockStatus(b.id)}
                            className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-all text-[10px] ${isCompleted ? 'bg-green-500 border-green-500 text-white' : isInProgress ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20 hover:border-white/40'}`}
                          >
                            {isCompleted ? '✓' : isInProgress ? '▶' : ''}
                          </button>

                          {/* Subject icon */}
                          {!isMobile && blockHeight >= 44 && (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0" style={{ background: `${subColor}15` }}>
                              {getSubjectIcon(b.subject)}
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-text3' : 'text-text'}`}>
                                {b.subject || bt.label}{b.topic ? ` — ${b.topic}` : ''}
                              </span>
                              {isNow && (
                                <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold uppercase tracking-wider animate-pulse shrink-0">NOW</span>
                              )}
                            </div>
                            {blockHeight >= 36 && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-mono" style={{ color: subColor }}>{b.startTime}–{b.endTime}</span>
                                <span className="text-[8px] px-1.5 py-[1px] rounded-full font-medium" style={{ background: `${subColor}10`, color: subColor }}>{bt.icon} {bt.label}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions — always visible on mobile, hover-only on desktop */}
                          <div className="flex items-center gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(b)} className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] bg-white/[0.06] text-text3 hover:text-text hover:bg-white/[0.1] transition-all" aria-label="Edit block">✏</button>
                            <button onClick={() => handleDuplicateBlock(b)} className="hidden sm:flex w-6 h-6 rounded-md items-center justify-center text-[9px] bg-white/[0.06] text-text3 hover:text-text hover:bg-white/[0.1] transition-all" aria-label="Duplicate block">⧉</button>
                            <button onClick={() => handleDeleteBlock(b.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" aria-label="Delete block">✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Subject Time Distribution */}
          {subjectTime.length > 0 && (
            <GlassCard hover={false} padding="p-5">
              <h2 className="text-sm font-semibold text-text mb-3">Subject Time This Week</h2>
              <div className="space-y-2.5">
                {subjectTime.map(([name, hrs]) => {
                  const pct = Math.min(100, (hrs / Math.max(1, weekPlanned)) * 100);
                  const color = getSubjectColor(name);
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0" style={{ background: `${color}10` }}>{getSubjectIcon(name)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-text truncate">{name}</span>
                          <span className="text-[10px] text-text3 font-mono shrink-0 ml-2">{hrs.toFixed(1)}h</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Weekly Analytics */}
          <GlassCard hover={false} padding="p-5">
            <h2 className="text-sm font-semibold text-text mb-3">Weekly Analytics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Planned', value: `${weekPlanned.toFixed(0)}h`, color: '#8B5CF6' },
                { label: 'Completed', value: `${weekCompleted.toFixed(1)}h`, color: '#22C55E' },
                { label: 'Completion', value: `${totalBlocks ? Math.round((completedBlocks / totalBlocks) * 100) : 0}%`, color: '#22D3EE' },
                { label: 'Active Days', value: weekDays.filter(d => d.totalHours > 0).length, color: '#F59E0B' },
              ].map((a, i) => (
                <div key={i} className="bg-bg-2 border border-border rounded-xl p-3 text-center">
                  <div className="text-lg font-bold font-mono" style={{ color: a.color }}>{a.value}</div>
                  <div className="text-[10px] text-text3 uppercase">{a.label}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recommendations */}
          <GlassCard hover={false} padding="p-5">
            <h2 className="text-sm font-semibold text-text mb-3">Smart Recommendations</h2>
            <div className="space-y-2">
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-bg-2 border border-border rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: r.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text font-medium">{r.text}</div>
                    <div className="text-[10px] text-text3 mt-0.5">{r.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Focus */}
          <GlassCard hover={false} padding="p-5">
            <h3 className="text-[10px] font-semibold text-text uppercase tracking-wider mb-3">Today's Focus</h3>
            <div className="flex items-center gap-4">
              <ProgressRing value={focusProgress} size={68} stroke={5} color="#3B82F6" />
              <div>
                <div className="text-sm font-bold text-text">{todayFocusHrs.toFixed(1)}h</div>
                <div className="text-[10px] text-text3">of {focusGoal.toFixed(1)}h goal</div>
                <div className="text-[10px] text-text3 mt-1">{sessionsCompleted || 0} sessions</div>
              </div>
            </div>
          </GlassCard>

          {/* Revision */}
          <GlassCard hover={false} padding="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold text-text uppercase tracking-wider">Revision Queue</h3>
              <button onClick={() => navigate('/final-revision')} className="text-[10px] text-primary hover:underline">View All</button>
            </div>
            {revisionToday.length > 0 && <div className="mb-2 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20"><span className="text-[10px] text-red-400 font-medium">{revisionToday.length} due today</span></div>}
            {revisionOverdue.length > 0 && <div className="mb-2 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20"><span className="text-[10px] text-orange-400 font-medium">{revisionOverdue.length} overdue</span></div>}
            <div className="space-y-1.5">
              {revisionHighPriority.slice(0, 4).map((r, i) => (
                <div key={r.id || i} className="flex items-center justify-between text-[11px] bg-bg-2 border border-border rounded-lg px-2.5 py-1.5">
                  <span className="text-text truncate">{r.topicName}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning shrink-0 ml-2">P{Math.round(r.priority)}</span>
                </div>
              ))}
              {revisionHighPriority.length === 0 && <p className="text-[10px] text-text3">All caught up!</p>}
            </div>
          </GlassCard>

          {/* PYQs */}
          <GlassCard hover={false} padding="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold text-text uppercase tracking-wider">Today's PYQs</h3>
              <button onClick={() => navigate('/pyq')} className="text-[10px] text-primary hover:underline">Practice</button>
            </div>
            {recommendedPqs.length === 0 ? <p className="text-[10px] text-text3">No weak-topic PYQs pending</p> : (
              <div className="space-y-1.5">
                {recommendedPqs.map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between text-[11px] bg-bg-2 border border-border rounded-lg px-2.5 py-1.5">
                    <span className="text-text truncate">{p.topic || p.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2 ${p.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' : p.difficulty === 'medium' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>{p.difficulty}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Mock */}
          <GlassCard hover={false} padding="p-5">
            <h3 className="text-[10px] font-semibold text-text uppercase tracking-wider mb-3">Mock Test</h3>
            <button onClick={() => navigate('/mocks')} className="w-full text-left bg-bg-2 border border-border rounded-xl px-3 py-2.5 hover:border-primary/30 transition-all">
              <div className="text-xs font-medium text-text">Take a Mock</div>
              <div className="text-[10px] text-text3 mt-0.5">Subject or full-length</div>
            </button>
            {mocks.length > 0 && (
              <div className="mt-2 bg-bg-2 border border-border rounded-xl px-3 py-2">
                <div className="text-[10px] text-text3">Last Score</div>
                <div className="text-sm font-bold text-primary">{mocks[mocks.length - 1].score || '—'}%</div>
              </div>
            )}
          </GlassCard>

          {/* Streak + Goal */}
          <GlassCard hover={false} padding="p-5" glow>
            <div className="text-center">
              <div className="text-[10px] text-text3 uppercase tracking-wider mb-2">GATE 2027</div>
              <div className="text-3xl font-bold font-mono text-primary">{countdown.days}</div>
              <div className="text-xs text-text3 mt-1">days remaining</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-bg-2 border border-border rounded-lg p-2">
                  <div className="text-[9px] text-text3 uppercase">Streak</div>
                  <div className="text-sm font-bold text-orange-400">{dailyStreak || studyStats?.streak?.current || 0}d</div>
                </div>
                <div className="bg-bg-2 border border-border rounded-lg p-2">
                  <div className="text-[9px] text-text3 uppercase">Goal</div>
                  <div className="text-sm font-bold text-green-400">{weeklyTarget}h</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setEditBlock(null); }} title={editBlock ? 'Edit Block' : 'Add Block'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Block Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {BLOCK_TYPES.map(bt => (
                <button key={bt.id} onClick={() => setBlockForm(f => ({ ...f, type: bt.id }))} className={`text-[10px] px-2 py-2 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${blockForm.type === bt.id ? 'border-white/20' : 'border-transparent hover:bg-white/[0.04]'}`} style={blockForm.type === bt.id ? { background: `${bt.color}12`, borderColor: `${bt.color}40`, color: bt.color } : { color: '#94A3B8' }}>
                  <span>{bt.icon}</span>
                  <span>{bt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Subject</label>
              <select value={blockForm.subject} onChange={e => setBlockForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/60">
                <option value="">Select</option>
                {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Topic</label>
              <input value={blockForm.topic} onChange={e => setBlockForm(f => ({ ...f, topic: e.target.value }))} placeholder="Topic name" className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/60" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Start</label>
              <input type="time" value={blockForm.startTime} onChange={e => setBlockForm(f => ({ ...f, startTime: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/60" />
            </div>
            <div>
              <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">End</label>
              <input type="time" value={blockForm.endTime} onChange={e => setBlockForm(f => ({ ...f, endTime: e.target.value }))} className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/60" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Notes</label>
            <input value={blockForm.notes} onChange={e => setBlockForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/60" />
          </div>
          <button onClick={editBlock ? handleEditBlock : handleAddBlock} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all">{editBlock ? 'Update' : 'Add Block'}</button>
        </div>
      </Modal>
    </div>
  );
}
