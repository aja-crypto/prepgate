import { motion } from 'framer-motion';

function ProgressBar({ value, label, max = 100, color = '#8B5CF6', suffix = '%', showValue = true }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-medium text-text3/70 w-28 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
        />
      </div>
      {showValue && <span className="text-[11px] font-bold text-white w-12">{value}{suffix}</span>}
    </div>
  );
}

function RankingBar({ rank, label, value, color, unit = '' }) {
  const maxVal = 100;
  const pct = Math.min(Math.max((value / maxVal) * 100, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-text3/50 w-6 text-right shrink-0">#{rank}</span>
      <div className="flex-1 flex items-center gap-2">
        <span className="text-[10px] font-medium text-text2/80 w-24 shrink-0 truncate">{label}</span>
        <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: rank * 0.08, ease: 'easeOut' }}
            className="h-full rounded-full flex items-center justify-end px-1"
            style={{ background: `linear-gradient(90deg, ${color}44, ${color})` }}
          >
            <span className="text-[7px] font-bold text-white drop-shadow-md">{value}{unit}</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function DifficultyMeter({ label, level, maxLevel = 5, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-medium text-text3/70 w-28 shrink-0 text-right">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: maxLevel }).map((_, i) => (
          <div
            key={i}
            className="w-5 h-2 rounded-full transition-all"
            style={{ background: i < level ? color : 'rgba(255,255,255,0.06)' }}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${color}18`, color }}>
        {level}/{maxLevel}
      </span>
    </div>
  );
}

function StatBadge({ icon, label, value, accent }) {
  return (
    <div className="rounded-xl p-3 text-center flex flex-col items-center gap-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-bold text-white">{value}</span>
      <span className="text-[8px] text-text3/60 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ROICard({ name, roiScore, fee, avgCtc, rank, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-text3/50">#{rank}</span>
          <span className="text-xs font-bold text-white">{name}</span>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${accent}18`, color: accent }}>
          {roiScore}/10 ⭐
        </span>
      </div>
      <ProgressBar value={roiScore} label="ROI Score" max={10} suffix="/10" color={accent} />
      <div className="flex gap-2 mt-1">
        <div className="flex-1 text-[10px] text-text3/60">Fee: <span className="text-text2 font-medium">{fee}</span></div>
        <div className="flex-1 text-[10px] text-text3/60">Avg CTC: <span className="text-text2 font-medium">{avgCtc}</span></div>
      </div>
    </motion.div>
  );
}

function PlacementRow({ name, avgPkg, highPkg, pct, accent }) {
  return (
    <div className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-[10px] font-medium text-text2/80 w-24 shrink-0">{name}</span>
      <div className="flex-1">
        <ProgressBar value={pct} label="" max={100} color={accent} showValue={false} />
      </div>
      <span className="text-[10px] font-bold text-text2 w-16 text-right">{avgPkg}</span>
      <span className="text-[9px] text-text3/50 w-16 text-right">{highPkg}</span>
    </div>
  );
}

const INSIGHT_VISUALS = {
  'Best ROI Colleges': {
    icon: '💰',
    accent: '#F59E0B',
    render: (data, accent) => {
      const colleges = [
        { name: 'NIT Trichy', roiScore: 9.8, fee: '₹1.4L', avgCtc: '₹24 LPA' },
        { name: 'NIT Surathkal', roiScore: 9.6, fee: '₹1.5L', avgCtc: '₹23 LPA' },
        { name: 'NIT Warangal', roiScore: 9.3, fee: '₹1.6L', avgCtc: '₹22 LPA' },
        { name: 'MNNIT Allahabad', roiScore: 9.1, fee: '₹1.4L', avgCtc: '₹20 LPA' },
        { name: 'NIT Calicut', roiScore: 8.5, fee: '₹1.5L', avgCtc: '₹19 LPA' },
      ];
      return (
        <div className="space-y-2">
          {colleges.map((c, i) => <ROICard key={c.name} {...c} rank={i + 1} accent={accent} />)}
        </div>
      );
    }
  },
  'Top NIT Placements': {
    icon: '🏆',
    accent: '#3B82F6',
    render: (data, accent) => {
      const placements = [
        { name: 'MNNIT Allahabad', avgPkg: '₹27.7L', highPkg: '₹72L', pct: 100 },
        { name: 'NIT Surathkal', avgPkg: '₹26.8L', highPkg: '₹65L', pct: 97 },
        { name: 'NIT Jamshedpur', avgPkg: '₹25.1L', highPkg: '₹144L', pct: 91 },
        { name: 'NIT Trichy', avgPkg: '₹24.5L', highPkg: '₹64L', pct: 89 },
        { name: 'NIT Warangal', avgPkg: '₹22.0L', highPkg: '₹127L', pct: 80 },
      ];
      return (
        <div>
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[9px] text-text3/50 uppercase">College</span>
            <span className="text-[9px] text-text3/50 uppercase text-right">Avg / Highest</span>
          </div>
          {placements.map(p => <PlacementRow key={p.name} {...p} accent={accent} />)}
        </div>
      );
    }
  },
  'Highest Closing Scores': {
    icon: '📈',
    accent: '#FBBF24',
    render: (data) => {
      const scores = [
        { rank: 1, label: 'IIT Bombay', value: 870, unit: '', color: '#FBBF24' },
        { rank: 2, label: 'IIT Madras', value: 850, unit: '', color: '#FBBF24' },
        { rank: 3, label: 'IIT Delhi', value: 830, unit: '', color: '#FBBF24' },
        { rank: 4, label: 'IIT Kanpur', value: 810, unit: '', color: '#F59E0B' },
        { rank: 5, label: 'IIT Kharagpur', value: 790, unit: '', color: '#F59E0B' },
        { rank: 6, label: 'IIT Roorkee', value: 770, unit: '', color: '#F59E0B' },
        { rank: 7, label: 'IIT Guwahati', value: 750, unit: '', color: '#10B981' },
        { rank: 8, label: 'IIT BHU', value: 730, unit: '', color: '#10B981' },
      ].map(s => ({ ...s, value: Math.round((s.value / 900) * 100) }));
      return (
        <div className="space-y-2">
          <div className="text-[9px] text-text3/50 mb-2">GATE Score (out of 900)</div>
          {scores.map(s => <RankingBar key={s.label} {...s} />)}
        </div>
      );
    }
  },
  'Category Trends': {
    icon: '📊',
    accent: '#8B5CF6',
    render: (data, accent) => {
      const categories = [
        { label: 'General (UR)', value: 30, max: 100, color: '#8B5CF6' },
        { label: 'OBC-NCL', value: 27, max: 100, color: '#A78BFA' },
        { label: 'EWS', value: 25, max: 100, color: '#C4B5FD' },
        { label: 'SC', value: 20, max: 100, color: '#6D28D9' },
        { label: 'ST', value: 20, max: 100, color: '#5B21B6' },
        { label: 'PwD', value: 20, max: 100, color: '#4C1D95' },
      ];
      return (
        <div className="space-y-2">
          <div className="text-[9px] text-text3/50 mb-2">GATE 2026 Qualifying Marks</div>
          {categories.map(c => (
            <ProgressBar key={c.label} label={c.label} value={c.value} max={c.max} color={c.color} suffix=" marks" />
          ))}
          <div className="mt-3 rounded-xl p-3" style={{ background: `${accent}08`, border: `1px solid ${accent}15` }}>
            <span className="text-[10px] text-text3/70">Reserved categories get <strong className="text-text2">200–800 rank relaxation</strong> in competitive DA programs.</span>
          </div>
        </div>
      );
    }
  },
  'Safest IIT Programmes': {
    icon: '🎯',
    accent: '#34D399',
    render: (data, accent) => {
      const programmes = [
        { name: 'Newer IITs (CSE)', difficulty: 2, score: '650–700', intake: 'Moderate', competition: 'Low' },
        { name: 'Mid/Lower NITs (CSE)', difficulty: 2, score: '600–650', intake: 'High', competition: 'Low' },
        { name: 'Top IIITs (Non-CSE)', difficulty: 3, score: '650–720', intake: 'Low', competition: 'Moderate' },
        { name: 'Adjacent Specializations', difficulty: 3, score: '650–750', intake: 'Moderate', competition: 'Moderate' },
        { name: 'IIIT Allahabad/Gwalior', difficulty: 4, score: '700–780', intake: 'Low', competition: 'High' },
        { name: 'Old IITs (Non-CSE)', difficulty: 4, score: '750–820', intake: 'Low', competition: 'High' },
      ];
      return (
        <div className="space-y-3">
          <div className="text-[9px] text-text3/50 mb-1">Difficulty to get in →</div>
          {programmes.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white">{p.name}</span>
                <span className="text-[10px] font-bold" style={{ color: accent }}>{p.score}</span>
              </div>
              <DifficultyMeter label="Difficulty" level={p.difficulty} color={accent} />
              <div className="flex gap-3 mt-2 text-[10px] text-text3/60">
                <span>Intake: <strong className="text-text2">{p.intake}</strong></span>
                <span>Competition: <strong className="text-text2">{p.competition}</strong></span>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }
  },
  'AI & Data Science Demand': {
    icon: '🤖',
    accent: '#06B6D4',
    render: (data, accent) => {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <StatBadge icon="📈" label="GATE DA Registrations" value="91,764" accent={accent} />
            <StatBadge icon="📊" label="Growth since 2024" value="+76%" accent={accent} />
            <StatBadge icon="🏭" label="Projected Demand" value="1.4M+" accent={accent} />
            <StatBadge icon="🎓" label="CS Candidates (×DA)" value="3×" accent={accent} />
          </div>
          <ProgressBar label="GATE DA Candidates 2024" value={52000} max={92000} color={accent} suffix="" />
          <ProgressBar label="GATE DA Candidates 2026" value={91764} max={92000} color={accent} suffix="" />
          <div className="rounded-xl p-3 text-[10px] text-text3/70 leading-relaxed" style={{ background: `${accent}08`, border: `1px solid ${accent}15` }}>
            NASSCOM projects India will need over <strong className="text-text2">1.4 million data professionals</strong> in coming years. DA seats accepting GATE DA scores are expanding year-over-year.
          </div>
        </div>
      );
    }
  },
  'Most Competitive': {
    icon: '📚',
    accent: '#EF4444',
    render: (data, accent) => {
      const programmes = [
        { name: 'GATE DA', difficulty: 5, qualifyRate: '15-20%', candidates: '57,000', color: '#EF4444' },
        { name: 'IIT Bombay CSE', difficulty: 5, qualifyRate: '<5%', candidates: '~8,000', color: '#F97316' },
        { name: 'IIT Delhi CSE', difficulty: 4.5, qualifyRate: '<8%', candidates: '~7,000', color: '#F59E0B' },
        { name: 'IIT Madras CSE', difficulty: 4, qualifyRate: '<10%', candidates: '~6,000', color: '#EAB308' },
        { name: 'Core DA/AI Programs', difficulty: 4, qualifyRate: '<12%', candidates: 'Limited', color: '#84CC16' },
      ];
      return (
        <div className="space-y-2">
          {programmes.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white">{p.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${p.color}18`, color: p.color }}>
                  {p.difficulty}/5 🔥
                </span>
              </div>
              <DifficultyMeter label="Competition" level={p.difficulty} maxLevel={5} color={p.color} />
              <div className="flex gap-3 mt-2 text-[10px] text-text3/60">
                <span>Qualify Rate: <strong className="text-text2">{p.qualifyRate}</strong></span>
                <span>Candidates: <strong className="text-text2">{p.candidates}</strong></span>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }
  },
  'Counselling Timeline': {
    icon: '📅',
    accent: '#F97316',
    render: (data, accent) => {
      const rounds = [
        { name: 'COAP R1', date: 'May 11–13', type: 'IITs & IISc', status: 'done' },
        { name: 'COAP R2', date: 'May 17–20', type: 'IITs & IISc', status: 'done' },
        { name: 'COAP R3', date: 'May 24–27', type: 'IITs & IISc', status: 'done' },
        { name: 'COAP R4', date: 'May 31–Jun 3', type: 'IITs & IISc', status: 'done' },
        { name: 'CCMT Registration', date: 'May 15', type: 'NITs/IIITs/GFTIs', status: 'done' },
        { name: 'CCMT R1 Allotment', date: 'Jun 12', type: 'NITs/IIITs/GFTIs', status: 'done' },
        { name: 'CCMT NSR', date: 'Aug 1–11', type: 'NITs/IIITs/GFTIs', status: 'upcoming' },
        { name: 'GATE 2027 Results', date: '~Mar 2027', type: 'Exam', status: 'future' },
      ];
      return (
        <div className="space-y-1">
          {rounds.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 rounded-xl px-3 py-2"
              style={{ background: r.status === 'future' ? `${accent}08` : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', opacity: r.status === 'future' ? 0.6 : 1 }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.status === 'future' ? '#6B7280' : r.status === 'upcoming' ? accent : '#34D399' }} />
              <span className="text-[10px] font-semibold text-text2 w-28 shrink-0">{r.name}</span>
              <span className="text-[10px] text-text3/70 flex-1">{r.date}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${accent}12`, color: accent }}>{r.type}</span>
            </motion.div>
          ))}
        </div>
      );
    }
  },
};

export default function InsightVisualCard({ topic }) {
  const visual = INSIGHT_VISUALS[topic.title];
  const accent = visual?.accent || '#8B5CF6';

  if (!visual) return null;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: `linear-gradient(135deg, ${accent}06, transparent)`, border: `1px solid ${accent}12` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{visual.icon}</span>
        <h2 className="text-sm font-bold text-white">{topic.title}</h2>
      </div>
      {visual.render(topic, accent)}
    </div>
  );
}
