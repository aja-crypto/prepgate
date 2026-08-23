import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthData } from '../context/AuthContext';
import { predictorService, referralService } from '../services/api';
import toast from 'react-hot-toast';
import GuestGate from '../components/common/GuestGate';
import {
  Target, TrendingUp, Award, MapPin, Building2, GraduationCap,
  ChevronDown, ChevronRight, Search, Star, AlertCircle, CheckCircle2,
  Clock, History, BarChart3, Zap, Brain, ArrowRight, X, Loader2,
  Sparkles, Shield, Globe, BookOpen, ListOrdered, GitCompare, FileText,
  Database
} from 'lucide-react';
import EnhancedCollegeCard from '../components/predictor/EnhancedCollegeCard';
import CollegeComparisonModal from '../components/predictor/CollegeComparisonModal';
import ChoiceFillingAssistant from '../components/predictor/ChoiceFillingAssistant';
import PredictionReportModal from '../components/predictor/PredictionReportModal';
import GateScoreGuide from '../components/predictor/GateScoreGuide';

const CATEGORIES = ['General', 'EWS', 'OBC-NCL', 'SC', 'ST', 'PwD'];
const ADMISSION_TYPES = ['M.Tech', 'MS Research', 'PhD', 'PSU', 'No Preference'];
const COLLEGE_TYPES = ['Any', 'IIT / IISc', 'NIT', 'IIIT', 'GFTI'];
const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'];

const INSTITUTE_DISPLAY_ORDER = ['IISc', 'IIT', 'NIT', 'IIIT', 'IIEST', 'GFTI', 'Other'];

const INSTITUTE_SECTION_CONFIG = {
  IIT: { icon: '\uD83C\uDFC6', title: 'IIT Opportunities', subtitle: 'Your Dream IIT Opportunities based on your current score.' },
  NIT: { icon: '\uD83C\uDFDB\uFE0F', title: 'NIT Opportunities', subtitle: 'Your Best NIT Opportunities.' },
  IIIT: { icon: '\uD83D\uDCBB', title: 'IIIT Opportunities', subtitle: 'Your Best IIIT Opportunities.' },
  IISc: { icon: '\uD83D\uDD2C', title: 'IISc Opportunities', subtitle: 'Indian Institute of Science.' },
  IIEST: { icon: '\uD83C\uDFEB', title: 'IIEST Opportunities', subtitle: 'Indian Institute of Engineering Science and Technology.' },
  GFTI: { icon: '\uD83C\uDF93', title: 'GFTI Opportunities', subtitle: 'Other centrally funded institutes.' },
  Other: { icon: '\uD83C\uDFDB\uFE0F', title: 'Other Institutes', subtitle: 'Additional options.' },
};

function instituteSortKey(type) {
  const idx = INSTITUTE_DISPLAY_ORDER.indexOf(type);
  return idx >= 0 ? idx : 99;
}

const CHANCE_CONFIG = {
  High: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', label: 'High Chance', icon: '🟢' },
  Moderate: { color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)', label: 'Moderate Chance', icon: '🟡' },
  Competitive: { color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', label: 'Competitive', icon: '🟠' },
  Low: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', label: 'Low Chance', icon: '🔴' },
};

// 5-tier path config (Priority 8)
const PATH_CONFIG = {
  'Very High Chance': { color: '#16A34A', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.25)', label: 'Very High Chance', icon: '⭐', description: 'Strong chance — score well above cutoff' },
  'High Chance': { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', label: 'High Chance', icon: '🟢', description: 'Good chance — score is above cutoff' },
  'Good Chance': { color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)', label: 'Good Chance', icon: '🔵', description: 'Moderate chance — score around or slightly above cutoff' },
  'Competitive': { color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', label: 'Competitive', icon: '🟠', description: 'Competitive — score below cutoff but within range' },
  'Dream': { color: '#A855F7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', label: 'Dream', icon: '✨', description: 'Aspirational — significant score improvement needed' },
  Safe: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', label: 'Safe', icon: '🛡️', description: 'Your score has consistently been above the cutoff' },
  Target: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', label: 'Target', icon: '🎯', description: 'Strong probability based on historical data' },
  Low: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', label: 'Stretch', icon: '🔴', description: 'Score below historical cutoff' },
};

// 4-tier college block config (Elite → High → Safe → Backup)
const BLOCK_CONFIG = {
  dream_elite: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'Dream Elite Institutes', icon: '👑', description: 'IISc & Top 7 IITs — the most prestigious institutes. Even low probability here is a great achievement.' },
  high_chance_iit: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', label: 'High Chance IITs', icon: '🚀', description: 'Other IITs where you have a realistic shot at admission.' },
  safe_nit: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', label: 'Safe NITs', icon: '🛡️', description: 'NITs with high probability — strong backup options.' },
  backup: { color: '#64748B', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', label: 'Backup Colleges', icon: '📋', description: 'Additional options including IIITs and GFTIs.' },
};

const LOADING_STEPS = [
  { text: 'Validating input parameters...', icon: CheckCircle2, duration: 90 },
  { text: 'Loading official GATE datasets...', icon: BookOpen, duration: 120 },
  { text: 'Calculating estimated score (official formula)...', icon: TrendingUp, duration: 150 },
  { text: 'Predicting All India Rank from historical data...', icon: BarChart3, duration: 180 },
  { text: `Matching programmes against CCMT cutoffs...`, icon: Building2, duration: 210 },
  { text: 'Ranking opportunities by confidence score...', icon: Target, duration: 120 },
  { text: 'Prediction Ready', icon: CheckCircle2, duration: 120 },
];

function GlassSelect({ label, value, onChange, options, icon: Icon, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => (typeof o === 'string' ? o : o.value) === value);
  const displayLabel = typeof selected === 'string' ? selected : selected?.label || value;

  return (
    <div ref={ref} className="relative">
      <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none flex items-center justify-between gap-2 transition-all"
        style={{
          background: disabled ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
          opacity: disabled ? 0.7 : 1,
          boxShadow: open ? '0 0 20px rgba(139,92,246,0.1)' : 'none',
        }}
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-slate-500" />}
          <span className={disabled ? 'text-slate-400' : 'text-white'}>{displayLabel}</span>
        </span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl overflow-hidden max-h-60 overflow-y-auto"
            style={{ background: 'rgba(15,20,35,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          >
            {options.map((opt, i) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const lbl = typeof opt === 'string' ? opt : opt.label;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => { onChange(val); setOpen(false); }}
                  className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 transition-all ${value === val ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${value === val ? 'bg-purple-400' : 'bg-transparent'}`} />
                  {lbl}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    if (step >= LOADING_STEPS.length) { setDone(true); return; }
    const d = LOADING_STEPS[step].duration;
    const t = setTimeout(() => setStep(s => s + 1), d);
    setTotalDuration(prev => prev + d);
    return () => clearTimeout(t);
  }, [step]);

  const progressPct = Math.min(100, (step / LOADING_STEPS.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="max-w-lg mx-auto py-12"
    >
      <div className="rounded-2xl p-6" style={{ background: 'rgba(5,10,25,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <div className="flex items-center gap-3 mb-5">
          <motion.div
            animate={{ rotate: done ? 0 : 360 }}
            transition={{ duration: 2, repeat: done ? 0 : Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: done ? 'linear-gradient(135deg, #22C55E, #16A34A)' : 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))' }}
          >
            {done ? <CheckCircle2 size={20} className="text-white" /> : <Loader2 size={20} className="text-purple-400" />}
          </motion.div>
          <div>
            <h3 className="text-sm font-bold text-white">{done ? 'Prediction Complete' : 'Processing Prediction...'}</h3>
            <p className="text-[10px] text-slate-500">
              {done ? `Completed in ${(totalDuration / 1000).toFixed(1)}s` : 'Analyzing your inputs against historical data'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full mb-5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progressPct}%` }}
            style={{ background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)' }}
          />
        </div>

        {/* Step list */}
        <div className="space-y-1.5">
          {LOADING_STEPS.slice(0, step + 1).map((s, i) => {
            const isComplete = i < step || done;
            const isCurrent = i === step && !done;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{
                  background: isComplete ? 'rgba(34,197,94,0.06)' : isCurrent ? 'rgba(139,92,246,0.08)' : 'transparent',
                  border: `1px solid ${isComplete ? 'rgba(34,197,94,0.12)' : isCurrent ? 'rgba(139,92,246,0.15)' : 'transparent'}`,
                }}
              >
                <span className="shrink-0">
                  {isComplete ? (
                    <CheckCircle2 size={14} className="text-green-400" />
                  ) : isCurrent ? (
                    <Loader2 size={14} className="text-purple-400 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  )}
                </span>
                <span className={`text-[11px] ${isComplete ? 'text-green-300/80' : isCurrent ? 'text-white' : 'text-slate-600'}`}>
                  {s.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function RadialGauge({ value = 0, max = 100, label, color = '#8B5CF6', size = 140 }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  const circumference = 2 * Math.PI * 50; // ≈ 314.16
  const safePct = Number.isFinite(pct) ? pct : 0;
  const offset = circumference * (1 - safePct / 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="50" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference}
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000 ease-out"
            style={{ strokeDashoffset: offset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white font-mono">{value}</span>
          <span className="text-[9px] text-slate-500 uppercase">{label}</span>
        </div>
      </div>
    </div>
  );
}

function PredictionForm({ onSubmit, loading, disabled = false }) {
  const [form, setForm] = useState({
    name: '', expectedMarks: '', category: 'General', paper: 'CS',
    admissionType: 'M.Tech', preferredState: '', collegeType: 'Any',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    if (!form.expectedMarks || form.expectedMarks < 0 || form.expectedMarks > 100) {
      toast.error('Enter valid marks (0-100)');
      return;
    }
    onSubmit({ ...form, expectedMarks: parseFloat(form.expectedMarks) });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass-card rounded-3xl p-6 md:p-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))' }}>
          <Target size={20} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Start Your Prediction</h2>
          <p className="text-[11px] text-slate-500">Enter your details below to estimate your rank and college chances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="pred-name" className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">Candidate Name</label>
          <input id="pred-name" name="candidateName" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name"
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div>
          <label htmlFor="pred-marks" className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">Expected Marks (out of 100) *</label>
          <input id="pred-marks" name="expectedMarks" type="number" min="0" max="100" step="0.1" value={form.expectedMarks} onChange={e => set('expectedMarks', e.target.value)} placeholder="e.g., 55"
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-purple-500/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">GATE Paper</label>
          <input value="Computer Science & Information Technology" disabled
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)', opacity: 0.7 }} />
        </div>
        <GlassSelect
          label="Category *"
          value={form.category}
          onChange={(v) => set('category', v)}
          options={CATEGORIES}
          icon={Shield}
        />
        <GlassSelect
          label="Preferred Admission"
          value={form.admissionType}
          onChange={(v) => set('admissionType', v)}
          options={ADMISSION_TYPES}
          icon={GraduationCap}
        />
        <GlassSelect
          label="Preferred College Type"
          value={form.collegeType}
          onChange={(v) => set('collegeType', v)}
          options={COLLEGE_TYPES}
          icon={Building2}
        />
        <div className="md:col-span-2">
          <GlassSelect
            label="Preferred State (optional)"
            value={form.preferredState}
            onChange={(v) => set('preferredState', v)}
            options={[{ value: '', label: 'All States' }, ...INDIAN_STATES.map(s => ({ value: s, label: s }))]}
            icon={Globe}
          />
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={loading || disabled}
        whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(139,92,246,0.5)' }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 relative overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          boxShadow: '0 4px 30px rgba(139,92,246,0.4)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <Sparkles size={16} className="relative z-10" />
        <span className="relative z-10">🚀 Predict My Rank</span>
      </motion.button>
    </motion.form>
  );
}

function TransparencyPanel({ result }) {
  const [open, setOpen] = useState(false);
  const formula = result.formula || result.gateFormula;
  const hasAirData = result.airRange || result.air;
  const airRange = result.airRange || result.air?.range;
  const midAIR = airRange ? Math.round((airRange.low + airRange.high) / 2) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}
      className="rounded-2xl overflow-hidden mb-4" style={{ background: 'rgba(10,15,30,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-purple-400" />
          <span className="text-xs font-semibold text-white">How This Was Predicted</span>
          <span className="text-[9px] text-slate-500">Formula · Data Sources · Confidence</span>
        </div>
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
              {/* AIR Explanation */}
              {airRange && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                  <div className="text-[10px] text-cyan-400 font-semibold mb-2">All India Rank: {airRange.low} – {airRange.high}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    <div className="flex items-center gap-1.5"><span className="text-green-400">✓</span><span className="text-slate-400">2024 Score Distribution</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-green-400">✓</span><span className="text-slate-400">Historical AIR Mapping</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-green-400">✓</span><span className="text-slate-400">CS Paper</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-green-400">✓</span><span className="text-slate-400">General Category</span></div>
                  </div>
                  {midAIR && <div className="text-[9px] text-slate-500 mt-2">Most Likely: ~{midAIR} · ±25% range from interpolation</div>}
                </div>
              )}

              {/* Formula */}
              {formula && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <div className="text-[10px] text-purple-400 font-semibold mb-2">Score Formula (Official GATE)</div>
                  <div className="text-[11px] font-mono text-purple-200/80 mb-2">{formula.expression}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
                    <div><span className="text-slate-500">Sq = </span><span className="text-slate-300">{formula.Sq}</span></div>
                    <div><span className="text-slate-500">St = </span><span className="text-slate-300">{formula.St}</span></div>
                    <div><span className="text-slate-500">Mq = </span><span className="text-slate-300">{formula.Mq}</span></div>
                    <div><span className="text-slate-500">Mt = </span><span className="text-slate-300">{formula.Mt}</span></div>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-2">
                    Mq (qualifying) = {formula.Mq} · Mt (top 0.1% avg) = {formula.Mt} · Marks = {result.predictedScore} → Score
                  </div>
                </div>
              )}

              {/* Data Sources */}
              <div className="rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <div className="text-[10px] text-green-400 font-semibold mb-2">Data Sources</div>
                <div className="space-y-1 text-[10px]">
                  {(result.officialData || []).map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5"><span className="text-green-400">✓</span><span className="text-slate-300">{s}</span><span className="text-[8px] px-1 py-0.5 rounded bg-green-500/10 text-green-400">Official</span></div>
                  ))}
                  {(result.estimatedData || []).map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5"><span className="text-yellow-400">⚠</span><span className="text-slate-300">{s}</span><span className="text-[8px] px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-400">Estimated</span></div>
                  ))}
                </div>
              </div>

              {/* Confidence breakdown */}
              <div className="rounded-lg p-3" style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.1)' }}>
                <div className="text-[10px] text-yellow-400 font-semibold mb-2">Confidence: {result.confidence} ({result.confidenceScore}%)</div>
                <div className="h-1.5 rounded-full mb-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${result.confidenceScore}%`, background: 'linear-gradient(90deg, #EAB308, #22C55E)' }} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5"><span className="text-green-400/60">✓</span><span className="text-slate-500">Official Formula</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-green-400/60">✓</span><span className="text-slate-500">Official Qualifying Marks</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-yellow-400/60">⚠</span><span className="text-slate-500">Estimated Mt</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-green-400/60">✓</span><span className="text-slate-500">Historical AIR</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ResultsView({ result, onReset, form, blurred, referralCode, referralProgress, referralCount }) {
  const [activeTab, setActiveTab] = useState('performance');
  const [filterPath, setFilterPath] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('confidence');
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showChoiceOrder, setShowChoiceOrder] = useState(false);
  const navigate = useNavigate();
  const [choiceOrderResult, setChoiceOrderResult] = useState(null);
  // Display limits: track how many items to show per block/type
  const [blockLimits, setBlockLimits] = useState({});
  const INITIAL_BLOCK_LIMIT = 10;
  const LOAD_MORE_INCREMENT = 10;

  const tabs = [
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'paths', label: 'Dream / Target / Safe', icon: Target },
    { id: 'colleges', label: 'All Colleges', icon: Building2 },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'choice', label: 'Choice Order', icon: ListOrdered },
    { id: 'career', label: 'Career', icon: GraduationCap },
    { id: 'tips', label: 'Tips', icon: Brain },
  ];

  const handleToggleCompare = (opp) => {
    setCompareList(prev => {
      const exists = prev.find(c => c.college === opp.college && c.program === opp.program);
      if (exists) return prev.filter(c => c.college !== opp.college || c.program !== opp.program);
      if (prev.length >= 5) { toast.error('Max 5 colleges for comparison'); return prev; }
      return [...prev, opp];
    });
  };

  const filteredOpps = useMemo(() => {
    return (result.opportunities || []).filter(o => {
      if (filterPath !== 'All' && o.path !== filterPath) return false;
      // Handle "IIT / IISc" filter — match both IIT and IISc
      if (filterType !== 'All') {
        if (filterType === 'IIT / IISc') {
          if (o.collegeType !== 'IIT' && o.collegeType !== 'IISc') return false;
        } else {
          if (o.collegeType !== filterType) return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const typeOrder = instituteSortKey(a.collegeType) - instituteSortKey(b.collegeType);
      if (typeOrder !== 0) return typeOrder;
      const BLOCK_PRIORITY = { dream_elite: 0, high_chance_iit: 1, safe_nit: 2, backup: 3 };
      const blockOrder = (BLOCK_PRIORITY[a.collegeBlock] ?? 99) - (BLOCK_PRIORITY[b.collegeBlock] ?? 99);
      if (blockOrder !== 0) return blockOrder;
      switch (sortBy) {
        case 'confidence': return (b.probability || 0) - (a.probability || 0);
        case 'match': return (b.matchScore || b.probability || 0) - (a.matchScore || a.probability || 0);
        case 'package': return (b.avgPlacement || 0) - (a.avgPlacement || 0);
        case 'fees': return (a.fees || Infinity) - (b.fees || Infinity);
        case 'roi': return (b.roiScore || 0) - (a.roiScore || 0);
        case 'tier': return (a.tier || 99) - (b.tier || 99);
        default: return (b.probability || 0) - (a.probability || 0);
      }
    });
  }, [result.opportunities, filterPath, filterType, sortBy]);

  // Group by path
  const groupedByPath = useMemo(() => {
    const groups = {};
    filteredOpps.forEach(o => {
      const p = o.path || 'Low';
      if (!groups[p]) groups[p] = [];
      groups[p].push(o);
    });
    return groups;
  }, [filteredOpps]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35 }} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
        <AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-yellow-300/80 leading-relaxed">
          <strong>Disclaimer:</strong> Predictions are based on previous years' official GATE results and admission trends. They are intended for guidance only and do not guarantee admission or rank. All data is from verified historical datasets uploaded by administrators.
        </p>
      </motion.div>

      {/* Executive Summary Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4, ease: [0.16,1,0.3,1] }}
        className="glass-card elevate rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: result.isQualified ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
                <span className="text-sm">{result.isQualified ? '✅' : '❌'}</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Prediction Summary</h2>
                <p className="text-[10px] text-slate-500">{result.isQualified ? 'You are eligible for CCMT counselling' : 'Below qualifying cutoff'}</p>
              </div>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${result.isQualified ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {result.isQualified ? 'Qualified' : 'Not Qualified'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-fr">
            {[
              { label: 'GATE Score', value: String(result.predictedScore || '—'), sub: 'out of 1000', color: '#8B5CF6' },
              { label: 'Est. AIR', value: result.airRange ? `${result.airRange.low}-${result.airRange.high}` : '—', sub: 'All India Rank', color: '#06B6D4' },
              { label: 'Confidence', value: `${result.confidence || '—'}${result.confidenceScore ? ` (${result.confidenceScore}%)` : ''}`, sub: 'Based on historical data', color: '#22C55E' },
              { label: 'Database', value: result.databaseStats ? `${result.databaseStats.totalProgrammes} Programmes` : `${result.databaseCoverage || '—'}`, sub: result.databaseStats ? `${result.databaseStats.totalInstitutes} Institutes · IIT ${result.databaseStats.instituteBreakdown?.IIT||0} NIT ${result.databaseStats.instituteBreakdown?.NIT||0}` : `IIT:${result.totalIITs||0} NIT:${result.totalNITs||0}`, color: '#EAB308' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease: [0.16,1,0.3,1] }}
                className="rounded-xl p-4 text-center flex flex-col items-center justify-center min-h-[100px]" style={{ background: `${item.color}08`, border: `1px solid ${item.color}15` }}>
                <div className="text-lg font-bold font-mono text-white leading-none mb-1">{item.value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{item.label}</div>
                <div className="text-[9px] text-slate-600 mt-0.5">{item.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-3 mt-3 text-[9px] text-slate-600 flex-wrap">
            <span className="flex items-center gap-1">✓ Official CCMT/COAP data</span>
            <span className="flex items-center gap-1">✓ GATE 2024 Formula</span>
            <span className="flex items-center gap-1">🤖 AI Confidence Analysis</span>
            <span className="flex items-center gap-1">⚡ Prediction Engine v2.0</span>
          </div>
        </div>
      </motion.div>

      {/* Transparency Panel */}
      <TransparencyPanel result={result} />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.35 }}
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all shrink-0 ${activeTab === tab.id ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
            <tab.icon size={14} className="shrink-0" /> <span className="truncate">{tab.label}</span>
          </button>
        ))}
        <button onClick={onReset}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-medium text-slate-500 hover:text-slate-300 border border-transparent ml-auto shrink-0">
          <Target size={14} className="shrink-0" /> New Prediction
        </button>
      </motion.div>

      {/* Premium content — blurred when curiosity mode active */}
      <div className="relative">
        <div className="transition-all duration-500 group/blur hover:blur-[8px]" style={{ filter: blurred ? 'blur(10px)' : 'none', opacity: blurred ? 0.85 : 1 }}>

      {result.lowMarksGuidance && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="widget-card rounded-2xl p-5 mb-6" style={{ borderColor: 'rgba(234,179,8,0.15)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-yellow-300 mb-1">Low Score Guidance</h4>
              <p className="text-xs text-slate-400 mb-2">{result.lowMarksGuidance.message}</p>
              <p className="text-xs text-yellow-400/80 mb-2">{result.lowMarksGuidance.improvementNote}</p>
              <ul className="space-y-1">
                {result.lowMarksGuidance.suggestions?.map((s, i) => (
                  <li key={i} className="text-[11px] text-slate-500 flex items-start gap-1">
                    <span className="text-yellow-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'performance' && (
          <motion.div key="perf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
            <div className="rounded-2xl p-5 text-center flex flex-col items-center justify-center" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <RadialGauge value={result.predictedScore || 0} max={1000} label="Score" color="#8B5CF6" size={110} />
            </div>
            <div className="rounded-2xl p-5 text-center flex flex-col items-center justify-center" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
              {result.airRange ? (
                <>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Expected AIR Range</div>
                  <div className="text-lg font-bold text-white font-mono leading-none">{result.airRange.low} – {result.airRange.high}</div>
                  <div className="text-[10px] text-cyan-400 mt-2">Most Likely: {Math.round((result.airRange.low + result.airRange.high) / 2)}</div>
                  <div className="text-[9px] text-slate-500 mt-1">Based on cutoff variance</div>
                </>
              ) : (
                <RadialGauge value={result.predictedRank || 0} max={50000} label="AIR" color="#06B6D4" size={110} />
              )}
            </div>
            <div className="rounded-2xl p-5 text-center flex flex-col items-center justify-center" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
              {result.airRange ? (
                <>
                  <div className="text-2xl font-bold text-white font-mono leading-none mb-1">{result.predictedPercentile || '—'}%</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Estimated Percentile</div>
                  <div className="text-[9px] text-green-400/60">Based on GATE CSE historical data</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white font-mono leading-none mb-1">{result.predictedPercentile || '—'}%</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Percentile</div>
                </>
              )}
            </div>
            <div className="rounded-2xl p-5 text-center flex flex-col items-center justify-center" style={{ background: result.isQualified ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${result.isQualified ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}` }}>
              <div className={`text-2xl font-bold leading-none mb-1 ${result.isQualified ? 'text-green-400' : 'text-red-400'}`}>
                {result.isQualified ? '✓' : '✗'}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">{result.isQualified ? 'Qualified' : 'Not Qualified'}</div>
              <div className="text-[10px] text-slate-500 mt-1">Cutoff: {result.qualifyingCutoff}</div>
            </div>
          </motion.div>
        )}

        {activeTab === 'paths' && (
          <motion.div key="paths" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* 5-tier path summary cards (Priority 8) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 auto-rows-fr">
              {['Very High Chance', 'High Chance', 'Good Chance', 'Competitive', 'Dream'].map(path => {
                const cfg = PATH_CONFIG[path];
                const count = (result.opportunities || []).filter(o => o.path === path).length;
                return (
                  <motion.div key={path} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl p-4 text-center cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center min-h-[120px]"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    onClick={() => setFilterPath(filterPath === path ? 'All' : path)}>
                    <div className="text-xl mb-1 leading-none">{cfg.icon}</div>
                    <div className="text-xl font-bold font-mono leading-none mb-1" style={{ color: cfg.color }}>{count}</div>
                    <div className="text-[10px] uppercase font-semibold leading-tight" style={{ color: cfg.color }}>{cfg.label}</div>
                    <div className="text-[9px] text-slate-500 mt-1 hidden md:block leading-tight">{cfg.description}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Path filters - horizontally scrollable on mobile */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex-shrink-0 self-center">Filter:</span>
                {['All', 'Very High Chance', 'High Chance', 'Good Chance', 'Competitive', 'Dream'].map(p => {
                  const cfg = PATH_CONFIG[p];
                  return (
                    <button key={p} onClick={() => setFilterPath(p)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filterPath === p ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-500 border border-white/5 hover:text-white'}`}>
                      {p === 'All' ? 'All' : `${cfg?.icon || ''} ${cfg?.label || p}`}
                    </button>
                  );
                })}
              </div>
              <style>{`.filter-scroll::-webkit-scrollbar { display: none; }`}</style>
            </div>
            
            {/* Institute filters - horizontally scrollable on mobile */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {['All', 'IIT / IISc', 'NIT', 'IIIT', 'GFTI'].map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filterType === t ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 border border-white/5 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sort filters - horizontally scrollable on mobile */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex-shrink-0 self-center">Sort:</span>
                {['match','confidence','package','fees','roi','tier'].map(k => (
                  <button key={k} onClick={() => setSortBy(k)}
                    className={`flex-shrink-0 px-2 py-1.5 rounded text-[10px] font-medium ${sortBy===k ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 border border-white/5 hover:text-white'}`}>
                    {k==='match'?'Best Match':k==='confidence'?'Admission':k==='package'?'Pkg':k==='fees'?'Low Fee':k==='roi'?'ROI':'Tier'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] text-slate-500">
                {(() => {
                  const types = INSTITUTE_DISPLAY_ORDER.filter(type => filteredOpps.some(o => (o.collegeType || 'Other') === type));
                  let visibleTotal = 0;
                  types.forEach(type => {
                    const opps = filteredOpps.filter(o => (o.collegeType || 'Other') === type);
                    const limitKey = `all_${type}`;
                    const limit = blockLimits[limitKey] ?? INITIAL_BLOCK_LIMIT;
                    visibleTotal += Math.min(opps.length, limit);
                  });
                  return `Showing ${visibleTotal} of ${filteredOpps.length} opportunities`;
                })()}
              </div>
              <div className="flex gap-2">
                {compareList.length > 0 && (
                  <button onClick={() => setShowCompare(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all">
                    <GitCompare size={12} /> Compare ({compareList.length})
                  </button>
                )}
                {filteredOpps.length > 0 && (
                  <button onClick={() => setShowChoiceOrder(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all">
                    <ListOrdered size={12} /> Choice Order
                  </button>
                )}
              </div>
            </div>

            {/* 4-tier College Blocks — Recommendation View */}
            {result.collegeBlocks && (
              <div className="mb-8 space-y-6">
                {['dream_elite', 'high_chance_iit', 'safe_nit', 'backup'].map(blockKey => {
                  const rawBlock = result.collegeBlocks[blockKey];
                  const cfg = BLOCK_CONFIG[blockKey];
                  if (!rawBlock || rawBlock.length === 0) return null;
                  const block = rawBlock.filter(o => {
                    if (filterPath !== 'All' && o.path !== filterPath) return false;
                    // Handle "IIT / IISc" filter — match both IIT and IISc
                    if (filterType !== 'All') {
                      if (filterType === 'IIT / IISc') {
                        if (o.collegeType !== 'IIT' && o.collegeType !== 'IISc') return false;
                      } else {
                        if (o.collegeType !== filterType) return false;
                      }
                    }
                    return true;
                  });
                  if (block.length === 0) return null;
                  const limit = blockLimits[blockKey] ?? INITIAL_BLOCK_LIMIT;
                  const hasMore = block.length > limit;
                  const showLoadMore = () => setBlockLimits(prev => ({ ...prev, [blockKey]: (prev[blockKey] ?? INITIAL_BLOCK_LIMIT) + LOAD_MORE_INCREMENT }));
                  const showAll = () => setBlockLimits(prev => ({ ...prev, [blockKey]: block.length }));
                  return (
                    <div key={blockKey}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{cfg.icon}</span>
                        <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-[10px] text-slate-600">({block.length})</span>
                      </div>
                      <p className="text-[9px] text-slate-600 mb-3 ml-0.5 leading-relaxed">{cfg.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {block.slice(0, limit).map((opp, idx) => (
                          <EnhancedCollegeCard key={idx} opportunity={opp} onCompare={handleToggleCompare} inCompareList={compareList.some(c => c.college === opp.college && c.program === opp.program)} />
                        ))}
                      </div>
                      {hasMore && (
                        <div className="flex items-center justify-center gap-3 mt-3">
                          <button onClick={showLoadMore} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-slate-400 border border-white/10 hover:text-white hover:border-white/20 transition-all">
                            Load More ({limit} of {block.length})
                          </button>
                          <button onClick={showAll} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-purple-400 border border-purple-500/20 hover:bg-purple-500/10 transition-all">
                            View All ({block.length})
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 5-tier path grouping (below blocks) */}
            {Object.entries(groupedByPath).length === 0 && !result.collegeBlocks ? (
              <div className="text-center py-12 px-4">
                <p className="text-slate-500 text-sm mb-2">
                  {form.category === 'PwD'
                    ? 'PwD-specific counselling data is currently unavailable for this dataset. We cannot generate a reliable prediction for this category at this time.'
                    : 'No matching opportunities found. Try adjusting filters.'}
                </p>
                {form.category === 'PwD' && (
                  <p className="text-slate-600 text-[11px]">You may try selecting a different category for approximate results, or check back when PwD data becomes available.</p>
                )}
              </div>
            ) : Object.entries(groupedByPath).length > 0 ? (
              <>
                {['Very High Chance', 'High Chance', 'Good Chance', 'Competitive', 'Dream'].filter(p => groupedByPath[p]).map(path => {
                  const cfg = PATH_CONFIG[path];
                  const opps = groupedByPath[path];
                  const groupedByType = {};
                  opps.forEach(o => {
                    const t = o.collegeType || 'Other';
                    if (!groupedByType[t]) groupedByType[t] = [];
                    groupedByType[t].push(o);
                  });
                  const hasSubGroups = INSTITUTE_DISPLAY_ORDER.some(t => groupedByType[t]?.length > 0);
                  return (
                    <div key={path} className="mb-6">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">{cfg?.icon}</span>
                        <span className="text-xs font-semibold" style={{ color: cfg?.color }}>{cfg?.label}</span>
                        <span className="text-[10px] text-slate-600">({opps.length})</span>
                      </div>
                      <div className="text-[9px] text-slate-600 mb-3 ml-0.5 leading-relaxed">{cfg?.description}</div>
                      {hasSubGroups ? INSTITUTE_DISPLAY_ORDER.filter(t => groupedByType[t]?.length).map(type => {
                        const subLimitKey = `sub_${path}_${type}`;
                        const subLimit = blockLimits[subLimitKey] ?? INITIAL_BLOCK_LIMIT;
                        const subHasMore = groupedByType[type].length > subLimit;
                        const showSubLoadMore = () => setBlockLimits(prev => ({ ...prev, [subLimitKey]: (prev[subLimitKey] ?? INITIAL_BLOCK_LIMIT) + LOAD_MORE_INCREMENT }));
                        const showSubAll = () => setBlockLimits(prev => ({ ...prev, [subLimitKey]: groupedByType[type].length }));
                        return (
  <div key={path + type} className="mb-4">
    <div className="flex items-center gap-2 mb-2 ml-2">
      <span className="text-xs font-semibold text-slate-300">{INSTITUTE_SECTION_CONFIG[type]?.icon || ''} {cfg?.label} {type}{type !== 'Other' ? 's' : ''}</span>
      <span className="text-[10px] text-slate-600">({groupedByType[type].length})</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {groupedByType[type].slice(0, subLimit).map((opp, idx) => (
        <EnhancedCollegeCard key={idx} opportunity={opp} onCompare={handleToggleCompare} inCompareList={compareList.some(c => c.college === opp.college && c.program === opp.program)} />
      ))}
    </div>
    {subHasMore && (
      <div className="flex items-center justify-center gap-3 mt-2">
        <button onClick={showSubLoadMore} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-slate-400 border border-white/10 hover:text-white hover:border-white/20 transition-all">
          Load More ({subLimit} of {groupedByType[type].length})
        </button>
        <button onClick={showSubAll} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-purple-400 border border-purple-500/20 hover:bg-purple-500/10 transition-all">
          View All ({groupedByType[type].length})
        </button>
      </div>
    )}
  </div>
);
})
: (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {(() => {
      const nonSubLimitKey = `nonSub_${path}`;
      const nonSubLimit = blockLimits[nonSubLimitKey] ?? INITIAL_BLOCK_LIMIT;
      return opps.slice(0, nonSubLimit).map((opp, idx) => (
        <EnhancedCollegeCard key={idx} opportunity={opp} onCompare={handleToggleCompare} inCompareList={compareList.some(c => c.college === opp.college && c.program === opp.program)} />
      ));
    })()}
  </div>
)}
                    </div>
                  );
                })}
                {/* Legacy paths for backward compatibility */}
                {['Safe', 'Target', 'Low'].filter(p => groupedByPath[p]).map(path => {
                  const cfg = PATH_CONFIG[path];
                  const opps = groupedByPath[path];
                  return (
                    <div key={path} className="mb-6">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">{cfg?.icon}</span>
                        <span className="text-xs font-semibold" style={{ color: cfg?.color }}>{cfg?.label}</span>
                        <span className="text-[10px] text-slate-600">({opps.length})</span>
                      </div>
                      <div className="text-[9px] text-slate-600 mb-3 ml-0.5 leading-relaxed">{cfg?.description}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {opps.slice(0, 12).map((opp, idx) => (
                          <EnhancedCollegeCard key={idx} opportunity={opp} onCompare={handleToggleCompare} inCompareList={compareList.some(c => c.college === opp.college && c.program === opp.program)} />
                        ))}
                      </div>
                      {opps.length > 12 && (
                        <div className="text-[10px] text-slate-600 mt-2 text-center">+ {opps.length - 12} more {cfg?.label} options</div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : null}
          </motion.div>
        )}

        {activeTab === 'colleges' && (
          <motion.div key="col" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Path filters - horizontally scrollable on mobile */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {['All', 'Very High Chance', 'High Chance', 'Good Chance', 'Competitive', 'Dream'].map(p => {
                  const cfg = PATH_CONFIG[p];
                  return (
                    <button key={p} onClick={() => setFilterPath(p)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filterPath === p ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-500 border border-white/5 hover:text-white'}`}>
                      {p === 'All' ? 'All' : `${cfg?.icon || ''} ${cfg?.label || p}`}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Institute filters - horizontally scrollable on mobile */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {['All', 'IIT / IISc', 'NIT', 'IIIT', 'GFTI'].map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filterType === t ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 border border-white/5 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sort filters - horizontally scrollable on mobile */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex-shrink-0 self-center">Sort:</span>
                {['match','confidence','package','fees','roi','tier'].map(k => (
                  <button key={k} onClick={() => setSortBy(k)}
                    className={`flex-shrink-0 px-2 py-1.5 rounded text-[10px] font-medium ${sortBy===k ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 border border-white/5 hover:text-white'}`}>
                    {k==='match'?'Best Match':k==='confidence'?'Admission':k==='package'?'Pkg':k==='fees'?'Low Fee':k==='roi'?'ROI':'Tier'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] text-slate-500">
                {(() => {
                  const types = INSTITUTE_DISPLAY_ORDER.filter(type => filteredOpps.some(o => (o.collegeType || 'Other') === type));
                  let visibleTotal = 0;
                  types.forEach(type => {
                    const opps = filteredOpps.filter(o => (o.collegeType || 'Other') === type);
                    const limitKey = `all_${type}`;
                    const limit = blockLimits[limitKey] ?? INITIAL_BLOCK_LIMIT;
                    visibleTotal += Math.min(opps.length, limit);
                  });
                  return `Showing ${visibleTotal} of ${filteredOpps.length} opportunities`;
                })()}
              </div>
              <div className="flex gap-2">
                {compareList.length > 0 && (
                  <button onClick={() => setShowCompare(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all">
                    <GitCompare size={12} /> Compare ({compareList.length})
                  </button>
                )}
                {filteredOpps.length > 0 && (
                  <button onClick={() => setShowChoiceOrder(true)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all">
                    <ListOrdered size={12} /> Choice Order
                  </button>
                )}
              </div>
            </div>

            {filteredOpps.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-slate-500 text-sm mb-2">
                  {form.category === 'PwD'
                    ? 'PwD-specific counselling data is currently unavailable for this dataset. We cannot generate a reliable prediction for this category at this time.'
                    : 'No matching opportunities found. Try adjusting filters.'}
                </p>
                {form.category === 'PwD' && (
                  <p className="text-slate-600 text-[11px]">You may try selecting a different category for approximate results, or check back when PwD data becomes available.</p>
                )}
              </div>
            ) : (
              INSTITUTE_DISPLAY_ORDER.filter(type => filteredOpps.some(o => (o.collegeType || 'Other') === type)).map(type => {
                const opps = filteredOpps.filter(o => (o.collegeType || 'Other') === type);
                const cfg = INSTITUTE_SECTION_CONFIG[type] || { icon: '🏛️', title: type, subtitle: '' };
                const limitKey = `all_${type}`;
                const limit = blockLimits[limitKey] ?? INITIAL_BLOCK_LIMIT;
                const hasMore = opps.length > limit;
                const showLoadMore = () => setBlockLimits(prev => ({ ...prev, [limitKey]: (prev[limitKey] ?? INITIAL_BLOCK_LIMIT) + LOAD_MORE_INCREMENT }));
                const showAll = () => setBlockLimits(prev => ({ ...prev, [limitKey]: opps.length }));
                return (
                  <div key={type} className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{cfg.icon}</span>
                      <span className="text-sm font-bold text-white">{cfg.title}</span>
                      <span className="text-[10px] text-slate-600">({opps.length})</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-3 ml-1">{cfg.subtitle}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {opps.slice(0, limit).map((opp, idx) => (
                        <EnhancedCollegeCard key={idx} opportunity={opp} onCompare={handleToggleCompare} inCompareList={compareList.some(c => c.college === opp.college && c.program === opp.program)} />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="flex items-center justify-center gap-3 mt-3">
                        <button onClick={showLoadMore} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-slate-400 border border-white/10 hover:text-white hover:border-white/20 transition-all">
                          Load More ({limit} of {opps.length})
                        </button>
                        <button onClick={showAll} className="text-[10px] px-3 py-1.5 rounded-lg font-medium text-purple-400 border border-purple-500/20 hover:bg-purple-500/10 transition-all">
                          View All ({opps.length})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === 'compare' && (
          <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {compareList.length < 2 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3 opacity-30"><GitCompare size={48} className="mx-auto text-slate-500" /></div>
                <p className="text-sm text-slate-500">Select at least 2 colleges from the paths or colleges tabs to compare.</p>
                <p className="text-[11px] text-slate-600 mt-1">Click the "Compare" button on any college card to add it.</p>
                {compareList.length === 1 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500">Currently selected: <span className="text-purple-300">{compareList[0].college}</span></p>
                    <p className="text-[10px] text-slate-600">Add 1 more college to start comparison.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-500">{compareList.length} colleges selected for comparison</p>
                  <button onClick={() => setShowCompare(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all">
                    <GitCompare size={14} /> View Full Comparison
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {compareList.map((opp, idx) => (
                    <EnhancedCollegeCard key={idx} opportunity={opp} onCompare={handleToggleCompare} inCompareList={true} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'choice' && (
          <motion.div key="choice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ChoiceFillingAssistant opportunities={result.opportunities || []} predictorService={predictorService} onClose={() => setActiveTab('paths')} score={result.predictedScore} onOrderGenerated={setChoiceOrderResult} />
          </motion.div>
        )}

        {activeTab === 'career' && (
          <motion.div key="career" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 auto-rows-fr">
              {[
                { label: 'IIT Programs', count: result.totalIITs || result.eligibleIITs || 0, icon: '🏛️', color: '#8B5CF6', sub: result.eligibleIITs ? `${result.eligibleIITs} institutes` : '' },
                { label: 'IISc Programs', count: result.totalIISc || 0, icon: '🔬', color: '#7C3AED', sub: result.eligibleIISc ? `${result.eligibleIISc} institute` : '' },
                { label: 'NIT & IIEST', count: (result.totalNITs || 0) + (result.totalIIEST || 0) || result.eligibleNITs || 0, icon: '🏫', color: '#06B6D4' },
                { label: 'IIIT Programs', count: result.totalIIITs || result.eligibleIIITs || 0, icon: '💻', color: '#22C55E' },
                { label: 'GFTI & Other', count: (result.totalGFTIs || 0) + (result.totalPrivate || 0) + (result.totalOther || 0), icon: '🎓', color: '#EAB308' },
                { label: 'Total Opportunities', count: result.totalOpportunities || result.opportunities?.length || 0, icon: '🎯', color: '#EC4899' },
              ].map((item, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.08 }}
                  className="rounded-2xl p-5 text-center flex flex-col items-center justify-center min-h-[140px]" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                  <div className="text-2xl mb-1.5 leading-none">{item.icon}</div>
                  <div className="text-xl font-bold text-white font-mono leading-none mb-1">{item.count}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{item.label}</div>
                  {item.sub && <div className="text-[9px] text-slate-600 mt-0.5">{item.sub}</div>}
                </motion.div>
              ))}
            </div>

            {result.eligiblePsus && result.eligiblePsus.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">🏭 Eligible PSUs</h3>
                <div className="space-y-2">
                  {result.eligiblePsus.map((psu, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div className="text-sm font-semibold text-white">{psu.name}</div>
                        <div className="text-[10px] text-slate-500">{psu.discipline} · {psu.location}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-orange-400">Cutoff: {psu.cutoffScore}</div>
                        <div className="text-[10px] text-slate-500">{psu.totalPosts} posts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'tips' && (
          <motion.div key="tips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {(result.recommendations || []).map((rec, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <ArrowRight size={14} className="text-purple-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">{rec}</span>
              </motion.div>
            ))}
            {(!result.recommendations || result.recommendations.length === 0) && (
              <div className="text-center py-12 text-slate-500 text-sm">No specific recommendations. Keep studying!</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-2 flex-wrap">
        <span className="text-slate-400">Prediction Confidence:</span>
        <span className={`px-2 py-0.5 rounded-full font-medium ${result.confidence === 'High' ? 'bg-green-500/10 text-green-400' : result.confidence === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
          {result.confidence}
        </span>
        {result.confidenceScore && <span className="text-slate-600">({result.confidenceScore}/100)</span>}
        <div className="flex gap-3 ml-2 text-[9px] text-slate-600">
          <span>✓ {result.totalDataPoints || 0} data points</span>
          <span>✓ {result.year || '—'} data</span>
          <span>✓ Multi-year trends</span>
        </div>
        <button onClick={() => navigate('/report', { state: { result, compareList, choiceOrder: choiceOrderResult } })} className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-all ml-2">
          <FileText size={12} /> Download Report
        </button>
      </div>

      {/* Trust System — show data sources */}
      <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2 mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-400"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Prediction Based On</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
          {[
            { label: 'CCMT Cutoffs', value: `${result.totalDataPoints || '—'} data points`, color: '#8B5CF6' },
            { label: 'Years', value: '2022 – 2026', color: '#06B6D4' },
            { label: 'Seat Matrix', value: 'IITs · NITs · IIITs · GFTIs', color: '#22C55E' },
            { label: 'Trend Analysis', value: `${result.datasetsUsed?.find(d => d.name === 'CCMT Cutoffs')?.entries || 0}+ cutoffs tracked`, color: '#F97316' },
          ].map((s, i) => (
            <div key={i} className="rounded-lg p-2.5 text-center" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
              <div className="text-[9px] text-slate-500 mb-0.5">{s.label}</div>
              <div className="text-[11px] font-medium" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 mt-2 text-[9px] text-slate-600">
          <span>✓ Verified data</span>
          <span>✓ No black box</span>
          <span>✓ Every recommendation explained</span>
        </div>
      </div>
        </div>
        {/* Dark translucent overlay — preserves card silhouettes while hiding text */}
        {blurred && (
          <div className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(5,8,22,0.65) 0%, rgba(5,8,22,0.75) 50%, rgba(5,8,22,0.85) 100%)',
              backdropFilter: 'blur(1px)',
            }}
          />
        )}
        {/* Curiosity mode CTA overlay */}
        {blurred && (
          <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: 'rgba(5,8,22,0.3)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="rounded-2xl p-6 sm:p-8 w-full max-w-sm mx-auto text-center relative overflow-hidden"
              style={{
                background: 'rgba(18,24,40,0.97)',
                border: '1px solid rgba(139,92,246,0.3)',
                boxShadow: '0 0 80px rgba(139,92,246,0.2), 0 0 160px rgba(139,92,246,0.06)',
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 60%)' }} />

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      background: i % 3 === 0 ? '#8B5CF6' : i % 3 === 1 ? '#3B82F6' : '#EC4899',
                      left: `${5 + (i * 8)}%`,
                      top: `${10 + (i * 7)}%`,
                    }}
                    animate={{
                      y: [0, -24, 0],
                      opacity: [0.15, 0.5, 0.15],
                      scale: [1, 1.4, 1],
                    }}
                    transition={{ duration: 2.5 + (i % 4) * 0.4, repeat: Infinity, delay: i * 0.25 }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                <motion.div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(59,130,246,0.2))',
                    border: '1px solid rgba(139,92,246,0.3)',
                  }}
                  whileHover={{ scale: 1.08, boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}
                  animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.2)', '0 0 35px rgba(139,92,246,0.35)', '0 0 20px rgba(139,92,246,0.2)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-purple-400"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="16" r="1.2" fill="currentColor" />
                  </motion.svg>
                </motion.div>

                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">Unlock GateNexa Premium</h3>
                <p className="text-white/45 text-xs mb-4 leading-relaxed">
                  Refer <strong className="text-purple-400 font-semibold">{2 - (referralCount || 0)} friend{(2 - (referralCount || 0)) !== 1 ? 's' : ''}</strong> and unlock Premium for FREE.
                </p>

                {/* Premium feature grid */}
                <div className="grid grid-cols-2 gap-2 mb-5 text-left">
                  {[
                    { icon: '🏛️', label: 'IIT Predictions' },
                    { icon: '🏫', label: 'NIT & IIIT List' },
                    { icon: '📊', label: 'College Compare' },
                    { icon: '📋', label: 'Choice Filling' },
                    { icon: '💳', label: 'Premium Report' },
                    { icon: '🤖', label: 'AI Mentor' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-[11px] sm:text-xs text-white/55">
                      <span className="shrink-0">{item.icon}</span> {item.label}
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-[11px] text-white/45 mb-1.5">
                    <span>Referral Progress</span>
                    <span className="text-purple-400 font-semibold">{referralCount || 0} / 2</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((referralCount || 0) / 2) * 100}%` }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)', boxShadow: '0 0 8px rgba(139,92,246,0.3)' }}
                    />
                  </div>
                </div>

                <motion.button
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    boxShadow: '0 4px 24px rgba(139,92,246,0.45)',
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '0 6px 32px rgba(139,92,246,0.6)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  Refer & Unlock
                </motion.button>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/35">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Free
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/35">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Instant
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <CollegeComparisonModal isOpen={showCompare} onClose={() => setShowCompare(false)} colleges={compareList} />
      {null}

      {/* Data source footer */}
      {result.datasetInfo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl text-[10px]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="flex items-center gap-1 text-slate-500">
              <Database size={10} /> Data Source:
            </span>
            <span className="text-slate-300">
              {result.datasetInfo.datasets?.[0]?.name || 'CCMT'} ({result.datasetInfo.datasets?.[0]?.records || 0} verified records)
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">Updated {result.datasetInfo.lastUpdated || '—'}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function HowItWorksSection() {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden mb-6 max-w-4xl mx-auto"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-white">How GateNexa AI Predicts Your Admission Chances</span>
        </div>
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 space-y-5">
              {/* Steps */}
              {[
                { num: '1', title: 'Profile Analysis', desc: 'We analyze your GATE details, including marks, paper, category, preferred specialization, and admission preferences.' },
                { num: '2', title: 'Official Data Verification', desc: 'Your profile is compared against verified admission information collected from official counselling authorities and participating institutes.' },
                { num: '3', title: 'Historical Admission Analysis', desc: 'Our AI evaluates historical admission patterns, institute requirements, programme competitiveness, and category-wise trends to estimate eligibility.' },
                { num: '4', title: 'Smart Recommendation Engine', desc: 'Instead of recommending only the easiest colleges, GateNexa balances multiple factors to identify institutions that best match your academic profile.' },
                { num: '5', title: 'Personalized College Ranking', desc: 'Each recommendation is ranked using multiple academic and institutional factors to help you identify Dream, Target, and Safe opportunities.' },
                { num: '6', title: 'AI Admission Report', desc: 'You receive a detailed report containing predicted GATE Score, Estimated AIR Range, Qualification Status, College Recommendations, Admission Confidence, Overall Match Score, Institute Comparison, and Choice Filling Guidance.' },
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                      {step.num}
                    </div>
                    {i < 5 && <div className="w-px flex-1 mt-1" style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(139,92,246,0.05))' }} />}
                  </div>
                  <div className="pb-4">
                    <h4 className="text-xs font-semibold text-white mb-1">{step.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}

              {/* Trust indicators */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield size={14} className="text-green-400" /> Why You Can Trust GateNexa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Built using verified historical admission data',
                    'Category-aware recommendations',
                    'Personalized for every student',
                    'Transparent recommendation explanations',
                    'Regularly updated admission database',
                    'Recommendations based on multiple academic factors',
                    'Designed to support decision-making, not replace official counselling',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] text-slate-400">
                      <CheckCircle2 size={12} className="text-green-400 shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Important note */}
              <div className="rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed" style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.1)' }}>
                <strong className="text-yellow-400">Important Note:</strong> GateNexa provides AI-assisted admission predictions based on historical admission information and available institutional data. Admission decisions are ultimately determined by official counselling authorities and participating institutes. Use GateNexa alongside the latest official CCMT, COAP, and institute notifications.
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '341+ Verified Records', color: '#8B5CF6' },
                  { label: '82+ Institutes', color: '#06B6D4' },
                  { label: 'IIT/NIT/IIIT Support', color: '#22C55E' },
                  { label: 'Category-wise Analysis', color: '#EAB308' },
                  { label: 'AI-Powered Engine', color: '#F97316' },
                  { label: 'Updated Data', color: '#EC4899' },
                  { label: 'PDF Report', color: '#14B8A6' },
                  { label: 'Secure & Private', color: '#A855F7' },
                ].map((badge, i) => (
                  <span key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium"
                    style={{ background: `${badge.color}10`, border: `1px solid ${badge.color}20`, color: badge.color }}
                  >
                    <CheckCircle2 size={10} /> {badge.label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FloatingParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 2 === 0 ? 'rgba(139,92,246,0.3)' : 'rgba(6,182,212,0.3)',
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function OpportunityPredictorPage() {
  const { user, isPremium, referralCode, referralProgress, referralCount } = useAuthData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [predictorUnlocked, setPredictorUnlocked] = useState(false);
  const [testingUsed, setTestingUsed] = useState(0);
  const [testingRemaining, setTestingRemaining] = useState(10);
  const [testingLimit, setTestingLimit] = useState(10);
  const [testingActive, setTestingActive] = useState(false);

  useEffect(() => {
    if (user && !user.isGuest) {
      predictorService.getUnlockStatus().then(r => {
        const d = r.data.data;
        setPredictorUnlocked(d.isUnlocked);
        if (d.testingAccess && !d.isPremium) {
          setTestingUsed(d.testingUsed || 0);
          setTestingRemaining(d.testingRemaining ?? 10);
          setTestingLimit(d.testingLimit || 10);
          setTestingActive(true);
        } else {
          setTestingActive(false);
        }
      }).catch(() => {});
    }
  }, [user, isPremium]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await predictorService.getHistory({ limit: 20 });
      setHistory(res.data.data || []);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handlePredict = async (input) => {
    setLoading(true);
    setShowLoading(true);
    const minLoadTime = new Promise(r => setTimeout(r, 1100)); // keep pipeline animation smooth without artificial delay
    try {
      const res = await predictorService.predict(input);
      const data = res.data.data;
      setResult(data);
      if (data?.testingAccess) {
        setTestingUsed(data.testingUsed || 0);
        setTestingRemaining(data.testingRemaining ?? 10);
        setTestingLimit(data.testingLimit || 10);
      }
      toast.success('Prediction generated!');
      fetchHistory();
    } catch (e) {
      const status = e.response?.status;
      const serverMsg = e.response?.data?.message;
      const errorCode = e.response?.data?.code;
      const errData = e.response?.data;
      if (errorCode === 'PREDICTOR_TEST_LIMIT_REACHED') {
        setTestingUsed(errData?.testingUsed ?? 10);
        setTestingRemaining(errData?.testingRemaining ?? 0);
        setTestingLimit(errData?.testingLimit ?? 10);
        toast.error(serverMsg || "You've used all 10 free testing predictions.");
      } else if (status === 403 && errorCode === 'PREMIUM_REQUIRED') {
        toast.error('Premium feature. Upgrade your account to access this.');
      } else if (status === 400) toast.error(serverMsg || 'Invalid input. Check marks (0-100) and category.');
      else if (status === 503) toast.error(serverMsg || 'Prediction service unavailable. Database may be disconnected.');
      else if (status === 401) toast.error('Session expired. Please login again.');
      else if (status === 500) toast.error(serverMsg || 'Server error. Try again later.');
      else toast.error(serverMsg || 'Prediction failed. Check that predictor datasets are uploaded in Admin CMS.');
    } finally {
      setLoading(false);
      await minLoadTime; // wait for pipeline animation to complete
      setTimeout(() => setShowLoading(false), 200);
    }
  };

  const handleViewHistory = async (id) => {
    try {
      const res = await predictorService.getPrediction(id);
      setResult(res.data.data?.results);
      setShowHistory(false);
    } catch (e) {
      toast.error('Failed to load prediction.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] pb-12">
      {(!user || user.isGuest) ? (
        <GuestGate context="predictor">
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Target size={48} className="text-purple-400/30 mx-auto mb-4" />
              <p className="text-white/30 text-sm">Sign in to use the GATE Predictor</p>
            </div>
          </div>
        </GuestGate>
      ) : (
      <div className="contents">
      {/* Hero — compact */}
      {!result && !showLoading && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative text-center mb-6 overflow-hidden rounded-2xl p-6 md:p-8"
          style={{ background: 'rgba(10,15,30,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <FloatingParticles />

          <div className="absolute top-0 left-1/4 w-48 h-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-0 right-1/4 w-36 h-36 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4), transparent)', filter: 'blur(60px)' }} />

          <div className="relative z-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}
              className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))', boxShadow: '0 0 40px rgba(139,92,246,0.15)' }}>
              <Target size={24} className="text-purple-400" />
            </motion.div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Predict Your <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">GATE Rank</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
              {isPremium ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                  ⭐ PREMIUM
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  BASIC
                </span>
              )}
              {testingActive && !isPremium && (
                testingRemaining > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  🧪 Testing Access · {testingRemaining} / {testingLimit}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  Testing limit reached — you've used all {testingLimit} predictions
                </span>
              )
            )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed mb-4">
              AIR, college chances, cutoff trends — based on verified GATE data.
            </p>

            {/* Stats badges */}
            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
              {[
                { label: '5 Years Data', icon: '📊', color: '#8B5CF6' },
                { label: '7800+ Cutoffs', icon: '🏛️', color: '#06B6D4' },
                { label: '78 Colleges', icon: '🎓', color: '#22C55E' },
                { label: '7 PSUs', icon: '🏭', color: '#F97316' },
              ].map((stat, i) => (
                <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium"
                  style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}20`, color: stat.color }}>
                  {stat.icon} {stat.label}
                </motion.span>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-slate-400 hover:text-white transition-all border border-white/5 hover:border-white/15">
                <History size={12} /> History ({history.length})
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* How It Works — always visible */}
      <HowItWorksSection />

      {/* Prediction Form */}
      {!result && !showLoading && (
        <div className="mb-6">
          {testingActive && !isPremium && testingRemaining <= 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto mb-4 rounded-xl p-4 text-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertCircle size={16} className="text-red-400" />
                <span className="text-sm font-semibold text-red-300">Testing limit reached</span>
              </div>
              <p className="text-[11px] text-red-300/70">
                You've used all 10 free testing predictions. Upgrade to Premium for unlimited access.
              </p>
            </motion.div>
          )}
          <PredictionForm
            onSubmit={handlePredict}
            loading={loading}
            disabled={testingActive && !isPremium && testingRemaining <= 0}
          />
        </div>
      )}

      {/* GATE Score Guide — educational guidance, does not affect predictions */}
      {!result && !showLoading && <GateScoreGuide />}

      {/* Loading Screen */}
      <AnimatePresence>
        {showLoading && !result && (
          <LoadingScreen />
        )}
      </AnimatePresence>

      {/* History panel */}
      <AnimatePresence>
        {showHistory && !result && !showLoading && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card max-w-4xl mx-auto mb-8 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white">Prediction History</span>
              <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white"><X size={14} /></button>
            </div>
            {history.length === 0 ? (
              <p className="text-[11px] text-slate-500 text-center py-4">No predictions yet. Make your first prediction above!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map(h => (
                  <button key={h._id} onClick={() => handleViewHistory(h._id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all text-left">
                    <div>
                      <div className="text-xs text-white">{h.input?.expectedMarks} marks · {h.input?.category}</div>
                      <div className="text-[10px] text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-purple-400">Score: {h.output?.predictedScore}</div>
                      <div className="text-[10px] text-slate-500">Rank: {h.output?.predictedRank}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results — show immediately when data arrives */}
      {result && (user?.role === 'owner' ? (
        <ResultsView result={result} onReset={() => setResult(null)} form={result.input || {}} />
      ) : (
        <ResultsView
          result={result}
          onReset={() => setResult(null)}
          form={result.input || {}}
          blurred={!predictorUnlocked && !result?.testingAccess}
          referralCode={referralCode}
          referralProgress={referralProgress}
          referralCount={referralCount}
        />
      ))}
      </div>
    )}
    </div>
  );
}
