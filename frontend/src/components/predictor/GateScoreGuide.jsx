import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Users, BookOpen, Building2, Award, Shield, BarChart3, Brain, Lock, Star, TrendingUp, GraduationCap } from 'lucide-react';

const FACTOR_CARDS = [
  { icon: Zap, title: 'GATE Score', description: 'Higher scores generally expand your opportunities. Even moderate scores can unlock great institutes through counselling rounds and category benefits.', color: '#8B5CF6' },
  { icon: Users, title: 'Category', description: 'Your reservation category (General, EWS, OBC-NCL, SC, ST, PwD) affects historical closing cutoffs. Category-wise cutoffs differ significantly across institutes.', color: '#06B6D4' },
  { icon: BookOpen, title: 'Preferred Programme', description: 'CSE, AI & ML, Data Science, VLSI, Cyber Security, Power Systems, and other programmes have varying competition levels and seat availability.', color: '#22C55E' },
  { icon: Building2, title: 'Institute Admission Process', description: 'Admission depends on CCMT/COAP counselling, institute-specific rules, seat availability, and multi-year historical cutoff trends.', color: '#F59E0B' },
];

const SCORE_RANGES = [
  { range: '850+', label: 'Excellent', opportunities: 'Excellent chances for top IITs and IISc in many programmes.', examples: ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'IISc Bangalore'], color: '#22C55E', pill: 'green' },
  { range: '750–849', label: 'Very Strong', opportunities: 'Strong chances in many IIT programmes and top NITs.', examples: ['IIT Roorkee', 'IIT Kharagpur', 'IIT Guwahati', 'IIT Hyderabad', 'IIT BHU', 'NIT Trichy', 'NIT Surathkal'], color: '#06B6D4', pill: 'cyan' },
  { range: '650–749', label: 'Strong', opportunities: 'Good opportunities in newer IITs, IIITs, and top NIT programmes.', examples: ['IIT Mandi', 'IIT Ropar', 'IIT Jammu', 'IIT Goa', 'IIT Bhilai', 'IIIT Bangalore', 'IIIT Delhi', 'NIT Warangal', 'NIT Calicut'], color: '#8B5CF6', pill: 'purple' },
  { range: '550–649', label: 'Good', opportunities: 'Good opportunities in many NITs, IIITs, GFTIs, and IIEST.', examples: [], color: '#F59E0B', pill: 'amber' },
  { range: '400–549', label: 'Fair', opportunities: 'Opportunities in mid-tier NITs, IIITs, GFTIs, and state universities depending on programme and category.', examples: [], color: '#F97316', pill: 'orange' },
];

const TRUST_BADGES = [
  { icon: Brain, label: 'AI-Powered Prediction', color: '#8B5CF6' },
  { icon: BarChart3, label: 'Historical Admission Analysis', color: '#06B6D4' },
  { icon: Shield, label: 'Category-wise Analysis', color: '#22C55E' },
  { icon: Award, label: 'IIT \u2022 NIT \u2022 IIIT \u2022 IISc Coverage', color: '#F59E0B' },
  { icon: Lock, label: 'Secure & Private', color: '#8B5CF6' },
  { icon: Star, label: 'Personalized Recommendations', color: '#EC4899' },
];

const PILL_MAP = { '#22C55E': 'green', '#06B6D4': 'cyan', '#8B5CF6': 'purple', '#F59E0B': 'amber', '#F97316': 'orange' };

function FadeInSection({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function GateScoreGuide() {
  return (
    <div className="max-w-5xl mx-auto px-4 space-y-10 pb-10">
      {/* ──── SECTION 1: 4 Key Factors ──── */}
      <FadeInSection>
        <div className="text-center mb-8">
          <span className="glass-pill purple text-[10px] font-semibold uppercase tracking-wider mb-3 inline-block">
            How It Works
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">
            4 Key Factors That Affect Your Prediction
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Understanding what influences your admission chances helps you make informed decisions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FACTOR_CARDS.map((factor, i) => {
            const Icon = factor.icon;
            return (
              <motion.div
                key={i}
                className="glass-card p-5 md:p-6 group"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: '-40px' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="glass-icon-box w-11 h-11"
                    style={{ background: `linear-gradient(135deg, ${factor.color}18, ${factor.color}06)`, borderColor: `${factor.color}20` }}
                  >
                    <Icon size={19} style={{ color: factor.color }} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-sm font-semibold text-white mb-1.5 tracking-tight">{factor.title}</h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                      {factor.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div
          className="mt-5 px-4 py-3.5 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.14)', backdropFilter: 'blur(12px)' }}
        >
          <div className="glass-icon-box w-7 h-7 rounded-lg" style={{ background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.2)' }}>
            <Brain size={13} className="text-purple-400" />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
            These factors are analysed together to generate personalized admission predictions.
          </p>
        </div>
      </FadeInSection>

      {/* ──── SECTION 2: GATE CS Score Mapping Guide ──── */}
      <FadeInSection delay={0.1}>
        <div className="text-center mb-8">
          <span className="glass-pill cyan text-[10px] font-semibold uppercase tracking-wider mb-3 inline-block">
            Score Guide
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">
            GATE CS Score Mapping Guide{' '}
            <span className="text-slate-500 text-sm font-normal">(General Category)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Understand what score ranges typically mean for admission opportunities
          </p>
        </div>

        <div className="glass-card p-1 sm:p-2 overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-3">
            <div className="col-span-2"><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Score</span></div>
            <div className="col-span-5"><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Typical Opportunities</span></div>
            <div className="col-span-3"><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Example Institutes</span></div>
            <div className="col-span-2"><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Confidence</span></div>
          </div>

          <div className="space-y-0.5">
            {SCORE_RANGES.map((row, i) => (
              <motion.div
                key={i}
                className="glass-row rounded-2xl overflow-hidden"
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: '-20px' }}
              >
                {/* Desktop row */}
                <div className="hidden md:grid md:grid-cols-12 gap-3 items-center px-5 py-4">
                  <div className="col-span-2">
                    <span className="text-sm font-bold text-white tabular-nums tracking-tight">{row.range}</span>
                  </div>
                  <div className="col-span-5">
                    <p className="text-xs text-slate-300 leading-relaxed">{row.opportunities}</p>
                  </div>
                  <div className="col-span-3">
                    {row.examples.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.examples.map((ex, j) => (
                          <span
                            key={j}
                            className={`glass-pill ${PILL_MAP[row.color] || ''} text-[10px] px-2 py-0.5`}
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Varies by programme &amp; category</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className={`glass-pill ${PILL_MAP[row.color] || ''} text-[10px] font-semibold`}>
                      {row.label}
                    </span>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="md:hidden px-4 py-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-bold text-white tabular-nums tracking-tight">{row.range}</span>
                    <span className={`glass-pill ${PILL_MAP[row.color] || ''} text-[10px] font-semibold`}>{row.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">{row.opportunities}</p>
                  {row.examples.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {row.examples.map((ex, j) => (
                        <span key={j} className={`glass-pill ${PILL_MAP[row.color] || ''} text-[10px] px-2 py-0.5`}>
                          {ex}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Important note */}
        <div
          className="mt-6 p-4 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.16)', backdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-start gap-3">
            <div className="glass-icon-box w-7 h-7 rounded-full mt-0.5" style={{ background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.25)' }}>
              <TrendingUp size={12} className="text-amber-400" />
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-amber-300">Important Note:</span>{' '}
              These ranges are general guidance based on historical admission trends. Actual admission depends on category, programme, institute policies, counselling rounds (CCMT/COAP), seat availability, and yearly competition. This information does not guarantee admission to any institute.
            </p>
          </div>
        </div>
      </FadeInSection>

      {/* ──── SECTION 3: Trust Badges ──── */}
      <FadeInSection delay={0.2}>
        <div className="glass-card elevate p-6 sm:p-8">
          <div className="text-center mb-6">
            <span className="glass-pill purple text-[10px] font-semibold uppercase tracking-wider mb-3 inline-block">
              <Shield size={11} className="inline mr-1 -mt-px" /> Why Trust GateNexa
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Built on data, validated by results
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TRUST_BADGES.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={i}
                  className="glass-row rounded-xl px-3 py-3 flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  viewport={{ once: true }}
                >
                  <div className="glass-icon-box w-9 h-9 rounded-lg" style={{ background: `${badge.color}12`, borderColor: `${badge.color}20` }}>
                    <Icon size={14} style={{ color: badge.color }} />
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-200 font-medium leading-tight">{badge.label}</span>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 flex flex-col sm:flex-row items-center justify-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <GraduationCap size={13} className="text-slate-500" />
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              GateNexa predictions are based on multi-year CCMT and COAP historical cutoff data.
              Results should be used as guidance alongside official counselling information.
            </p>
          </div>
        </div>
      </FadeInSection>
    </div>
  );
}
