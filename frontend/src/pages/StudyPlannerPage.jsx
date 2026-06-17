// Study Planner Calendar – monthly/weekly study session planning
import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { useProgress } from '../context/ProgressContext';
import { aiService } from '../services/api';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const SUBJECTS = ['Engineering Mathematics', 'Digital Logic', 'Computer Organization', 'Programming & DS', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', 'Theory of Computation', 'Compiler Design', 'Aptitude'];

export default function StudyPlannerPage() {
  const { gateFeatures, updateGateFeatures, topics, pyqs, mocks, studyStats } = useProgress();
  const [view, setView] = useState('month');
  const [showAiPlan, setShowAiPlan] = useState(false);
  const [aiPlan, setAiPlan] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: SUBJECTS[0], topic: '', hours: 2, notes: '' });
  const [editId, setEditId] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) });
  }, []);

  const getPlans = (date) => {
    const key = format(date, 'yyyy-MM-dd');
    return gateFeatures.studyPlans[key] || [];
  };

  const openAdd = (date) => {
    setSelectedDate(date);
    setForm({ subject: SUBJECTS[0], topic: '', hours: 2, notes: '' });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (date, plan) => {
    setSelectedDate(date);
    setForm({ subject: plan.subject, topic: plan.topic, hours: plan.hours, notes: plan.notes || '' });
    setEditId(plan.id);
    setShowModal(true);
  };

  const savePlan = () => {
    if (!selectedDate || !form.topic.trim()) return;
    const key = format(selectedDate, 'yyyy-MM-dd');
    updateGateFeatures((gf) => {
      const existing = gf.studyPlans[key] || [];
      const plan = { id: editId || Date.now(), ...form, hours: +form.hours };
      const updated = editId
        ? existing.map((p) => (p.id === editId ? plan : p))
        : [...existing, plan];
      return { ...gf, studyPlans: { ...gf.studyPlans, [key]: updated } };
    });
    setShowModal(false);
  };

  const generateAiPlan = async () => {
    try {
      const res = await aiService.generatePlan({
        subjects: studyStats.subjects || [],
        topics: topics || [],
        pyqs: pyqs || [],
        mocks: mocks || [],
        dailyHours: gateFeatures.dailyTarget?.hours || 8,
        period: 'week',
      });
      const { plan, source, aiError } = res.data?.data || {};
      setAiPlan(plan || []);
      setShowAiPlan(true);
      if (source === 'gpt') {
        toast.success('AI study plan generated');
      } else if (aiError) {
        toast(aiError, { icon: '🤖' });
      } else {
        toast('Smart plan generated', { icon: '📋' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to generate plan';
      toast.error(msg);
    }
  };

  const applyAiPlan = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const newPlans = { ...gateFeatures.studyPlans };
    aiPlan.forEach((day, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const key = format(date, 'yyyy-MM-dd');
      const tasks = Array.isArray(day.tasks) ? day.tasks : [];
      newPlans[key] = [{
        id: Date.now() + i,
        subject: day.subject,
        topic: day.topic,
        hours: day.hours,
        notes: tasks.join(' · '),
      }];
    });
    updateGateFeatures((gf) => ({ ...gf, studyPlans: newPlans }));
    setShowAiPlan(false);
    toast.success('AI study plan applied to calendar');
  };

  const deletePlan = (date, id) => {
    const key = format(date, 'yyyy-MM-dd');
    updateGateFeatures((gf) => {
      const updated = (gf.studyPlans[key] || []).filter((p) => p.id !== id);
      const plans = { ...gf.studyPlans };
      if (updated.length) plans[key] = updated;
      else delete plans[key];
      return { ...gf, studyPlans: plans };
    });
  };

  const DayCell = ({ date, inMonth = true }) => {
    const plans = getPlans(date);
    const hasPlans = plans.length > 0;
    return (
      <button
        onClick={() => openAdd(date)}
        className={`min-h-[72px] md:min-h-[90px] p-1.5 rounded-lg border text-left transition-all ${
          !inMonth ? 'opacity-30' : 'hover:border-primary/30'
        } ${isToday(date) ? 'border-primary/40 bg-primary/5' : 'border-border'} ${hasPlans ? 'bg-bg-2' : 'bg-surface'}`}
      >
        <div className={`text-xs font-mono mb-1 ${isToday(date) ? 'text-primary font-bold' : 'text-text3'}`}>
          {format(date, 'd')}
        </div>
        {plans.slice(0, 2).map((p) => (
          <div key={p.id} onClick={(e) => { e.stopPropagation(); openEdit(date, p); }}
            className="text-[9px] truncate px-1 py-0.5 rounded mb-0.5 bg-primary/15 text-primary cursor-pointer hover:bg-primary/25">
            {p.subject.split(' ')[0]} · {p.hours}h
          </div>
        ))}
        {plans.length > 2 && <div className="text-[9px] text-text3">+{plans.length - 2} more</div>}
      </button>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">📅 Study Planner</h1>
          <p className="text-sm text-text3 mt-0.5">Plan study sessions by subject and date</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={generateAiPlan} className="text-xs px-3 py-1.5 rounded-lg border bg-primary/10 border-primary/20 text-primary hover:bg-primary/15">🤖 AI Planner</button>
          <button onClick={() => setView('month')} className={`text-xs px-3 py-1.5 rounded-lg border ${view === 'month' ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}>Month</button>
          <button onClick={() => setView('week')} className={`text-xs px-3 py-1.5 rounded-lg border ${view === 'week' ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-bg-2 border-border text-text3'}`}>Week</button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="bg-surface border border-border rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-text3 hover:text-text px-2">←</button>
            <h2 className="text-sm font-semibold text-text">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-text3 hover:text-text px-2">→</button>
          </div>
          <div className="grid grid-cols-7 gap-[2px] sm:gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-[9px] sm:text-[10px] text-text3 text-center uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-[2px] sm:gap-1">
            {days.map((date) => (
              <DayCell key={date.toISOString()} date={date} inMonth={isSameMonth(date, currentMonth)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {weekDays.map((date) => {
            const plans = getPlans(date);
            return (
              <div key={date.toISOString()} className={`bg-surface border rounded-xl p-4 ${isToday(date) ? 'border-primary/30' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className={`text-sm font-semibold ${isToday(date) ? 'text-primary' : 'text-text'}`}>{format(date, 'EEEE, MMM d')}</div>
                    {isToday(date) && <span className="text-[10px] text-primary">Today</span>}
                  </div>
                  <button onClick={() => openAdd(date)} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-lg border border-primary/20 hover:bg-primary/15">+ Add</button>
                </div>
                {plans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.15)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-primary">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-text mb-2">No Study Plans Yet</h3>
                    <p className="text-sm text-text3 max-w-xs leading-relaxed">Plan your day by adding study sessions. Click a time slot to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {plans.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 bg-bg-2 border border-border rounded-lg p-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-text">{p.topic}</div>
                          <div className="text-[11px] text-text3">{p.subject} · {p.hours}h</div>
                          {p.notes && <div className="text-[11px] text-text3 mt-1">{p.notes}</div>}
                        </div>
                        <button onClick={() => openEdit(date, p)} className="text-xs text-primary hover:underline">Edit</button>
                        <button onClick={() => deletePlan(date, p.id)} className="text-xs text-red-400 hover:underline">Del</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showAiPlan} onClose={() => setShowAiPlan(false)} title="🤖 AI Study Planner">
        <p className="text-xs text-text3 mb-4">Personalized weekly schedule based on weak subjects and incomplete topics.</p>
        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
          {aiPlan.map((day) => (
            <div key={day.day} className="bg-bg-2 border border-border rounded-lg p-3">
              <div className="text-xs font-semibold text-primary">{day.day}</div>
              <div className="text-sm text-text">{day.topic} — {day.subject}</div>
              <div className="text-[10px] text-text3">{day.hours}h · {(Array.isArray(day.tasks) ? day.tasks : []).join(' · ')}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAiPlan(false)} className="flex-1 bg-bg-2 border border-border text-text2 py-2.5 rounded-lg text-sm">Cancel</button>
          <button onClick={applyAiPlan} className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold">Apply to Calendar</button>
        </div>
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? '✏️ Edit Study Plan' : '📅 Add Study Plan'}>
        {selectedDate && <p className="text-xs text-text3 mb-4">Date: {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Subject</label>
            <select value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60">
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Topic / Focus</label>
            <input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder="e.g. Process Scheduling"
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Hours</label>
            <input type="number" min="0.5" max="12" step="0.5" value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60" />
          </div>
          <div>
            <label className="text-xs text-text2 uppercase tracking-wider font-semibold block mb-1.5">Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes"
              className="w-full bg-bg-2 border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary/60" />
          </div>
          <button onClick={savePlan} className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold text-sm hover:opacity-90 mt-1">
            {editId ? 'Update Plan' : 'Save Plan'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
