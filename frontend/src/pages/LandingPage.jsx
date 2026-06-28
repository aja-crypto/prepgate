import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../design/tokens';
import Icon from '../components/ui/Icon';
import GlobalLivingWallpaper from '../components/common/GlobalLivingWallpaper';
import AnimatedCounter from '../components/common/AnimatedCounter';
import GATECountdown from '../components/common/GATECountdown';
import StudyWorkflow from '../components/common/StudyWorkflow';
import TestimonialsSection from '../components/common/TestimonialsSection';
import FuturisticHero from '../components/common/FuturisticHero';
import { BrandName } from '../components/ui/BrandText';
import { ROADMAP_PHASES, AIR_ROADMAPS } from '../data/successRoadmap';
import { COMMUNITY_INSIGHTS } from '../data/communityInsights';

function StaggerChildren({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

function StaggerItem({ children, index = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setVisible(true), prefersReducedMotion.current ? 0 : index * 40); o.disconnect(); } },
      { threshold: 0.1 }
    );
    o.observe(el);
    return () => o.disconnect();
  }, [index]);
  return (
    <div ref={ref} className={`transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: '🤖', title: 'AI Mentor', desc: 'Personalized study plans, weak area analysis, and daily action recommendations.' },
  { icon: '📚', title: 'Smart Notes', desc: 'Create, pin, and organize short revision notes with formula sheets.' },
  { icon: '🔄', title: 'Revision Planner', desc: 'Spaced repetition schedules and automated revision reminders.' },
  { icon: '🎯', title: 'PYQ Practice', desc: 'Year-wise browser with mistake tagging and pattern analysis.' },
  { icon: '🧪', title: 'Mock Tests', desc: 'Full-length GATE mocks with detailed performance breakdowns.' },
  { icon: '📊', title: 'Analytics', desc: 'Subject strength charts, AIR predictor, and study pace tracking.' },
];

function FeatureCard({ feature, colors }) {
  const cardRef = useRef(null);
  const onMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current?.style.setProperty('--mx', x + '%');
    cardRef.current?.style.setProperty('--my', y + '%');
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      className="group relative rounded-2xl p-6 transition-all duration-250 hover:-translate-y-1.5 overflow-hidden"
      style={{ background: 'rgba(139,92,246,0.02)', border: `1px solid rgba(139,92,246,0.08)` }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-250 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), ${colors.glow}, transparent 60%)`,
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-8 right-8 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-250" style={{ background: `linear-gradient(90deg, transparent, ${colors.text}, transparent)` }} />

      {/* Icon */}
      <div
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-all duration-250 group-hover:scale-110 group-hover:-translate-y-0.5"
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
      >
        {feature.icon}
      </div>

      <h3 className="relative text-sm font-bold text-white mb-2 transition-colors duration-200">{feature.title}</h3>
      <p className="relative text-xs leading-relaxed transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.4)' }}>{feature.desc}</p>

      {/* Bottom decorative dot */}
      <div className="absolute bottom-3 right-3 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-250" style={{ background: colors.text, boxShadow: `0 0 6px ${colors.text}` }} />
    </div>
  );
}

function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-250 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </div>
  );
}

function DemoBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const samples = [
    { icon: '🎯', title: '243 Days to GATE 2027', msg: 'Every question you solve today is a mark you won\'t lose tomorrow.', color: '#A78BFA', type: 'motivation' },
    { icon: '🏆', title: 'AIR 4 GATE CSE Tip', msg: 'I made a mistake notebook and reviewed it every Sunday.', color: '#FBBF24', type: 'ranker_quote' },
    { icon: '🤖', title: 'AI Coach Recommendation', msg: 'Your weakest topic is Pipeline Hazards. Spend 25 minutes on it today.', color: '#818CF8', type: 'ai_coach' },
    { icon: '🔥', title: 'Keep Your Streak Alive', msg: 'Study at least 30 minutes today to keep your streak going.', color: '#FB923C', type: 'streak' },
  ];
  return (
    <div ref={ref} className="relative hidden sm:block">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-xl hover:bg-white/5 transition-colors duration-200">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-400"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: '#F43F5E' }}>4</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden z-50 shadow-2xl" style={{ background: '#0F1119', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <span className="text-xs font-bold text-white">Notifications</span>
            <span className="text-[8px] text-gray-500">Mark all read</span>
          </div>
          {samples.map((s, i) => (
            <div key={i} className="px-4 py-2.5 border-l-2 transition-colors hover:bg-white/[0.02]" style={{ borderLeftColor: s.color }}>
              <div className="flex items-start gap-2.5">
                <span>{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-semibold text-white truncate">{s.title}</span>
                    <span className="text-[7px] text-gray-500 flex-shrink-0">now</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-relaxed mt-0.5">{s.msg}</p>
                  <span className="text-[7px] px-1 py-0.5 rounded-full mt-1 inline-block capitalize" style={{ background: `${s.color}15`, color: s.color }}>{s.type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const creatorRef = useRef(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="dark min-h-screen bg-[#050816] text-[#F8FAFC] overflow-x-hidden">
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 25px rgba(139,92,246,0.2), 0 0 50px rgba(139,92,246,0.05); } 50% { box-shadow: 0 0 35px rgba(139,92,246,0.3), 0 0 70px rgba(139,92,246,0.1), 0 0 120px rgba(34,211,238,0.05); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-gradient { animation: gradient-shift 8s ease infinite; background-size: 200% 200%; }
        .glass-creator { background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(109,40,217,0.06), rgba(245,158,11,0.02)); backdrop-filter: blur(24px); border: 1px solid rgba(139,92,246,0.15); transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .glass-creator:hover { border-color: rgba(139,92,246,0.35); box-shadow: 0 0 30px rgba(139,92,246,0.12), 0 0 60px rgba(109,40,217,0.08), 0 0 100px rgba(34,211,238,0.04); transform: translateY(-3px); }
        .timeline-line { background: linear-gradient(180deg, #8B5CF6, #6D28D9, #F59E0B); }
      `}</style>

      <GlobalLivingWallpaper />

      {/* Sticky Nav — Futuristic Purple Theme */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'py-2' : 'py-4'}`} style={{
        background: navScrolled ? 'rgba(5,8,22,0.92)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(24px) saturate(1.8)' : 'none',
        borderBottom: navScrolled ? '1px solid rgba(139,92,246,0.1)' : 'none',
      }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 transition-all duration-300 group-hover:scale-105">
              <Icon name="logo" className="w-full h-full" />
            </div>
            <div className="flex flex-col justify-center">
              <BrandName size="24px" fontWeight={600} letterSpacing="4px" />
              <div className="text-[10px] font-semibold tracking-[2px] mt-0.5" style={{ color: '#A855F7' }}>GATE 2027</div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="relative text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 hidden sm:inline-block group" style={{ color: '#A78BFA' }}>
                  <span className="group-hover:text-white transition-colors">Dashboard</span>
                  <span className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300" style={{ background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)' }} />
                </Link>
                <Link to="/insights" className="relative text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 hidden sm:inline-block group" style={{ color: '#A78BFA' }}>
                  <span className="group-hover:text-white transition-colors">Insights</span>
                  <span className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300" style={{ background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)' }} />
                </Link>
                <Link to="/settings" className="relative text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 hidden sm:inline-block group" style={{ color: '#A78BFA' }}>
                  <span className="group-hover:text-white transition-colors">Profile</span>
                  <span className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300" style={{ background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)' }} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/insights" className="relative text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 hidden sm:inline-block group" style={{ color: '#A78BFA' }}>
                  <span className="group-hover:text-white transition-colors">Insights</span>
                  <span className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300" style={{ background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)' }} />
                </Link>
                <Link to="/success-hub" className="relative text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 hidden sm:inline-block group" style={{ color: '#FBBF24' }}>
                  <span className="group-hover:text-white transition-colors">Success Hub</span>
                  <span className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300" style={{ background: 'linear-gradient(90deg, #FBBF24, #8B5CF6)' }} />
                </Link>
                <Link to="/about" className="relative text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 hidden sm:block group" style={{ color: '#A78BFA' }}>
                  <span className="group-hover:text-white transition-colors">About</span>
                  <span className="absolute bottom-0 left-0 w-0 h-px group-hover:w-full transition-all duration-300" style={{ background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)' }} />
                </Link>
              </>
            )}

            {/* Separator */}
            <div className="w-px h-4 mx-1 hidden sm:block" style={{ background: 'rgba(139,92,246,0.15)' }} />

            <DemoBell />
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="text-[10px] font-bold text-white px-4 py-2 rounded-lg transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 2px 15px rgba(139,92,246,0.35)' }}>
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="text-[10px] font-medium transition-all duration-300 hover:-translate-y-0.5 px-3 py-2" style={{ color: '#A78BFA' }}>
                  <span className="hover:text-white">Sign in</span>
                </Link>
                <Link to="/register" className="text-[10px] font-bold text-white px-5 py-2 rounded-lg transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 2px 20px rgba(139,92,246,0.4)' }}>
                  Get Started →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Nav styles */}
        <style>{`
          .nav-link:hover { background: rgba(139,92,246,0.18) !important; border-color: rgba(139,92,246,0.4) !important; box-shadow: 0 0 20px rgba(139,92,246,0.12), 0 0 40px rgba(139,92,246,0.04); }
        `}</style>
      </nav>

      {/* Cinematic Hero Section */}
      <FuturisticHero />

      {/* Animated Stats */}
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <AnimatedSection>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <AnimatedCounter end={15} suffix="+" label="Subjects" />
            <AnimatedCounter end={500} suffix="+" label="Topics" duration={2500} />
            <AnimatedCounter end={2000} suffix="+" label="PYQs" duration={3000} />
            <AnimatedCounter end={50} suffix="+" label="Mock Tests" />
          </div>
        </AnimatedSection>
      </section>

      {/* Why Students Fail */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-medium mb-4" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#F87171' }}>
              ⚠️ The Problem
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
              Why Most GATE Aspirants Fail
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">We've analyzed what holds students back — and fixed every single point.</p>
          </div>
        </AnimatedSection>
        <StaggerChildren>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '🔍',
                title: 'Wasting Time Searching',
                desc: 'Hours looking for notes, PYQs, and resources instead of studying.'
              },
              {
                icon: '📊',
                title: 'No Clear Strategy',
                desc: 'Studying random topics without knowing what to prioritize.'
              },
              {
                icon: '🔄',
                title: 'No Revision Plan',
                desc: 'Forgetting what you learned because you don\'t have a spaced repetition system.'
              },
              {
                icon: '🎯',
                title: 'No Mock Analysis',
                desc: 'Taking mocks but not learning from your mistakes.'
              },
              {
                icon: '😰',
                title: 'Burnout & Stress',
                desc: 'Studying too much without breaks and losing motivation.'
              },
              {
                icon: '❓',
                title: 'No Personalization',
                desc: 'Following generic plans that don\'t fit your learning style.'
              },
            ].map((item, i) => (
              <StaggerItem key={item.title} index={i}>
                <div className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'rgba(244,63,94,0.02)', border: '1px solid rgba(244,63,94,0.08)' }}>
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerChildren>
      </section>

      {/* How GateNexa Fixes It */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-medium mb-4" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#4ADE80' }}>
              ✨ The Solution
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
              How GateNexa Fixes It All
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">Every feature is designed to solve these problems directly.</p>
          </div>
        </AnimatedSection>
        <StaggerChildren>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '📚',
                title: 'Organized Library',
                desc: 'All notes, PYQs, and resources in one place — no more searching.'
              },
              {
                icon: '🧠',
                title: 'AI-Powered Plan',
                desc: 'Personalized study plan based on your progress and weaknesses.'
              },
              {
                icon: '🔄',
                title: 'Smart Revision',
                desc: 'Spaced repetition algorithm that reminds you when to revise.'
              },
              {
                icon: '📊',
                title: 'Detailed Analytics',
                desc: 'Track every mistake and learn from your mock tests.'
              },
              {
                icon: '⚡',
                title: 'Focus Mode',
                desc: 'Built-in productivity tools to avoid burnout and stay focused.'
              },
              {
                icon: '🎯',
                title: 'Personalized Coaching',
                desc: 'AI mentor that adapts to your learning style and goals.'
              },
            ].map((item, i) => (
              <StaggerItem key={item.title} index={i}>
                <div className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.08)' }}>
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerChildren>
      </section>



      {/* Gradient Divider */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="h-[1px] w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(34,211,238,0.3), transparent)' }} />
      </div>

      {/* GATE Countdown */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <AnimatedSection>
          <div className="rounded-2xl p-8" style={{ background: 'rgba(139,92,246,0.02)', border: '1px solid rgba(139,92,246,0.08)' }}>
            <GATECountdown />
          </div>
        </AnimatedSection>
      </section>

      {/* Why GateNexa - Features */}
      <section className="relative z-10 px-6 py-20">
        <AnimatedSection>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-medium mb-4" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
              <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4v4l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              GATE Command Center
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
              Everything a GATE Aspirant{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #F8FAFC, #C4B5FD)' }}>
                Needs
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">One platform to plan, track, practice, and revise — powered by AI.</p>
          </div>
        </AnimatedSection>
        <div className="flex justify-center">
        <StaggerChildren>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl w-full">
            {FEATURES.map((f, i) => {
              const colors = [
                { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', glow: 'rgba(99,102,241,0.15)', text: '#818CF8' },
                { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', glow: 'rgba(139,92,246,0.15)', text: '#A78BFA' },
                { bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.2)', glow: 'rgba(34,211,238,0.15)', text: '#22D3EE' },
                { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', glow: 'rgba(245,158,11,0.15)', text: '#FBBF24' },
                { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', glow: 'rgba(34,197,94,0.15)', text: '#4ADE80' },
                { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.2)', glow: 'rgba(236,72,153,0.15)', text: '#F472B6' },
              ];
              const c = colors[i];
              return (
                <StaggerItem key={f.title} index={i}>
                  <FeatureCard feature={f} colors={c} />
                </StaggerItem>
              );
            })}
          </div>
        </StaggerChildren>
        </div>
      </section>

      {/* Study Workflow */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22D3EE' }}>
              🚀 Your Study Workflow
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
              From Learning to{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #8B5CF6, #22D3EE)' }}>
                Success
              </span>
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto text-sm">A proven pipeline followed by every successful GATE aspirant.</p>
          </div>
        </AnimatedSection>
        <AnimatedSection>
          <div className="max-w-md mx-auto">
            <StudyWorkflow />
          </div>
        </AnimatedSection>
      </section>

      {/* Gradient Divider */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="h-[1px] w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), rgba(139,92,246,0.3), transparent)' }} />
      </div>

      {/* Community Section */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <AnimatedSection>
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: '#F472B6' }}>
              🔥 Community Wisdom
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight leading-tight">
            What the{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #8B5CF6, #22D3EE)' }}>
              GATE Community
            </span>{' '}
            Says
          </h2>
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-gray-400">Real questions, real answers — from Reddit, YouTube, Quora, and Telegram.</p>
            <Link to="/insights" className="text-[10px] font-medium flex-shrink-0 ml-4" style={{ color: '#F472B6' }}>View all {COMMUNITY_INSIGHTS.length} →</Link>
          </div>
        </AnimatedSection>

        <StaggerChildren>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COMMUNITY_INSIGHTS.slice(0, 8).map((item, i) => (
              <StaggerItem key={item.id} index={i}>
                <div className="rounded-xl p-4 h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'rgba(139,92,246,0.02)', border: '1px solid rgba(139,92,246,0.08)' }}>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full self-start" style={{ background: 'rgba(236,72,153,0.1)', color: '#F472B6' }}>{item.category}</span>
                  <h4 className="text-xs font-semibold text-white mt-2 mb-1 leading-relaxed">{item.q}</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed flex-1">{item.a}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[8px] text-gray-600">— {item.source}</span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerChildren>
      </section>

      {/* AI Mentor Preview */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <AnimatedSection>
          <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(34,211,238,0.04))', border: '1px solid rgba(139,92,246,0.12)' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-medium mb-4" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
              🤖 AI Mentor
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Ask Anything About GATE</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              "How should I prepare DBMS?" "What are my weak topics?" 
              "Create a study plan for this week."
            </p>
            <div
              className="max-w-lg mx-auto rounded-xl p-4 text-left mb-5"
              style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.08)' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0" style={{ background: 'rgba(139,92,246,0.2)' }}>
                  🤖
                </div>
                <div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Based on your recent progress, I recommend focusing on <span className="text-white font-semibold">Operating Systems</span> this week. 
                    Your OS completion is at 42% and your PYQ accuracy dropped from 82% to 65%. 
                    Solve 20 OS PYQs and revise the process synchronization chapter.
                  </p>
                  <span className="text-[9px] text-gray-600 mt-2 block">AI Mentor · Just now</span>
                </div>
              </div>
            </div>
            <Link
              to={user ? '/mentor' : '/register'}
              className="inline-flex items-center gap-2 text-xs font-medium px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white' }}
            >
              {user ? 'Open AI Mentor' : 'Try AI Mentor Free'} →
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* Content Hub — Browse All Insights */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
              📚 Explore All Content
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
              Everything You Need in{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #A78BFA, #22D3EE)' }}>
                One Place
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              Strategy guides, topper advice, DSA in real life, roadmaps, GATE facts, community Q&A, and more.
            </p>
          </div>
        </AnimatedSection>

        <StaggerChildren>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Success Blueprint', desc: '18 success principles curated from toppers and experts', icon: '🏆', link: '/insights', color: '#34D399' },
            { title: 'GATE Q&A', desc: '21 most-asked questions with expert answers', icon: '💡', link: '/insights', color: '#FBBF24' },
            { title: 'Community Insights', desc: '24 real questions from Reddit, YouTube & Quora', icon: '🔥', link: '/insights', color: '#F472B6' },
            { title: 'Strategy Insights', desc: 'Deep-dive topper strategies with phase breakdowns', icon: '📚', link: '/insights', color: '#22D3EE' },
            { title: 'DSA in Real Life', desc: '15 data structures explained through real-world apps', icon: '🧠', link: '/insights', color: '#818CF8' },
            { title: 'GATE Roadmap', desc: 'Month-by-month plan with AIR targets & principles', icon: '🗺️', link: '/success-hub', color: '#F59E0B' },
            { title: 'GATE Facts', desc: '25 did-you-know facts about GATE & CS concepts', icon: '🧐', link: '/success-hub', color: '#22D3EE' },
            { title: 'Topper Advice', desc: 'Most repeated advice from successful rankers', icon: '🏆', link: '/success-hub', color: '#6366F1' },
            { title: 'Common Mistakes', desc: '10 pitfalls that cost students their rank', icon: '🚨', link: '/success-hub', color: '#F43F5E' },
          ].map((item, idx) => (
            <StaggerItem key={item.title} index={idx}>
            <Link to={item.link}>
              <div className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 h-full" style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.08)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-white mb-0.5">{item.title}</h3>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                  <span className="text-gray-600 text-xs mt-1">→</span>
                </div>
              </div>
            </Link>
            </StaggerItem>
          ))}
        </div>
        </StaggerChildren>
      </section>

      {/* Roadmap Section */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <AnimatedSection>
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#FBBF24' }}>
              🗺️ GATE Roadmap
            </div>
          </div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight leading-tight">
                Your July → January{' '}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #FBBF24, #8B5CF6)' }}>
                  Journey
                </span>
              </h2>
              <p className="text-sm text-gray-400">A phased roadmap followed by every successful GATE aspirant.</p>
            </div>
            <Link to="/success-hub" className="text-[10px] font-medium flex-shrink-0 ml-4" style={{ color: '#FBBF24' }}>Full roadmap →</Link>
          </div>
        </AnimatedSection>

        {/* Timeline phases */}
        <StaggerChildren>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {ROADMAP_PHASES.map((phase, i) => (
            <StaggerItem key={phase.id} index={i}>
              <div className="rounded-xl p-5 h-full transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'rgba(139,92,246,0.02)', border: '1px solid rgba(139,92,246,0.08)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: `${phase.color}15` }}>
                    {phase.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{phase.title}</div>
                    <div className="text-[9px]" style={{ color: phase.color }}>{phase.subtitle}</div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-3">{phase.focus}</p>
                <ul className="space-y-1">
                  {phase.tasks.slice(0, 3).map((t, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-[9px] text-gray-500">
                      <span style={{ color: phase.color }}>◆</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
          </div>
        </StaggerChildren>

        {/* AIR Target Cards */}
        <AnimatedSection>
          <h3 className="text-sm font-bold text-white mb-4 text-center">AIR Target Ranges</h3>
          <StaggerChildren>
          <div className="grid sm:grid-cols-3 gap-4">
            {AIR_ROADMAPS.map((r, i) => (
              <StaggerItem key={r.rank} index={i}>
              <div className="rounded-xl p-5 text-center transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'rgba(139,92,246,0.02)', border: '1px solid rgba(139,92,246,0.08)' }}>
                <div className="text-2xl mb-2">{r.icon}</div>
                <h4 className="text-sm font-bold text-white mb-1">{r.rank}</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-3">{r.description}</p>
                <div className="grid grid-cols-2 gap-1.5 text-center">
                  {Object.entries(r.stats).map(([k, v]) => (
                    <div key={k} className="rounded-lg py-1.5" style={{ background: 'rgba(139,92,246,0.03)' }}>
                      <div className="text-[10px] font-bold text-white">{v}</div>
                      <div className="text-[7px]" style={{ color: r.color }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </StaggerItem>
            ))}
          </div>
        </StaggerChildren>
        </AnimatedSection>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <AnimatedSection>
          <TestimonialsSection />
        </AnimatedSection>
      </section>

      {/* Ranker Wisdom */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#FBBF24' }}>
              🏆 Ranker Wisdom
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight leading-tight">
              Advice from{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #FBBF24, #8B5CF6)' }}>
                Those Who Made It
              </span>
            </h2>
            <p className="text-sm text-gray-400">Daily wisdom from GATE toppers and rankers.</p>
          </div>
        </AnimatedSection>

        {/* Featured Quote of the Day */}
        <AnimatedSection>
          <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(139,92,246,0.04))', border: '1px solid rgba(245,158,11,0.12)' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-medium mb-3" style={{ background: 'rgba(245,158,11,0.1)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.2)' }}>
              ✨ Quote of the Day
            </div>
            <p className="text-sm text-gray-200 italic leading-relaxed max-w-2xl mx-auto">
              "{[
                { rank: 'AIR 1', text: 'Consistency beats motivation. Even 3 focused hours daily for 8 months can outperform random 10-hour study days.' },
                { rank: 'AIR 5', text: 'I revised every subject at least 4 times. Revision was more important than learning new topics.' },
                { rank: 'AIR 12', text: 'PYQs are the closest thing to the actual exam. Never skip them.' },
                { rank: 'AIR 3', text: 'Understanding the why behind each concept matters more than memorizing solutions.' },
                { rank: 'AIR 8', text: 'Your mock test scores don\'t define you — your analysis after each mock does.' },
                { rank: 'AIR 2', text: 'Solve every PYQ from the last 10 years at least twice. Patterns repeat.' },
                { rank: 'AIR 15', text: 'Don\'t collect resources. Master one book per subject completely.' },
                { rank: 'AIR 7', text: 'The last 30 days are not for learning new topics. They are for revision and confidence.' },
                { rank: 'AIR 4', text: 'I made a mistake notebook and reviewed it every Sunday. That alone improved my score by 15 marks.' },
                { rank: 'AIR 10', text: 'Mathematics is not a subject to memorize — it is a subject to practice every single day.' },
                { rank: 'AIR 6', text: 'Your competition is not other students. Your competition is your own procrastination.' },
                { rank: 'AIR 20', text: 'Sleep is not a waste of time. A fresh brain solves problems faster.' },
              ][new Date().getDate() % 12].text}"
            </p>
            <p className="text-[10px] text-gray-500 mt-2">— {[
                { rank: 'AIR 1', name: 'GATE CSE' },
                { rank: 'AIR 5', name: 'GATE CSE' },
                { rank: 'AIR 12', name: 'GATE CSE' },
                { rank: 'AIR 3', name: 'GATE DA' },
                { rank: 'AIR 8', name: 'GATE CSE' },
                { rank: 'AIR 2', name: 'GATE CSE' },
                { rank: 'AIR 15', name: 'GATE CSE' },
                { rank: 'AIR 7', name: 'GATE CSE' },
                { rank: 'AIR 4', name: 'GATE CSE' },
                { rank: 'AIR 10', name: 'GATE DA' },
                { rank: 'AIR 6', name: 'GATE CSE' },
                { rank: 'AIR 20', name: 'GATE CSE' },
              ][new Date().getDate() % 12].rank} {[
                { rank: 'AIR 1', name: 'GATE CSE' },
                { rank: 'AIR 5', name: 'GATE CSE' },
                { rank: 'AIR 12', name: 'GATE CSE' },
                { rank: 'AIR 3', name: 'GATE DA' },
                { rank: 'AIR 8', name: 'GATE CSE' },
                { rank: 'AIR 2', name: 'GATE CSE' },
                { rank: 'AIR 15', name: 'GATE CSE' },
                { rank: 'AIR 7', name: 'GATE CSE' },
                { rank: 'AIR 4', name: 'GATE CSE' },
                { rank: 'AIR 10', name: 'GATE DA' },
                { rank: 'AIR 6', name: 'GATE CSE' },
                { rank: 'AIR 20', name: 'GATE CSE' },
              ][new Date().getDate() % 12].name}</p>
            <Link to="/success-hub" className="inline-block text-[9px] font-medium mt-3 transition-colors" style={{ color: '#FBBF24' }}>
              View all topper advice →
            </Link>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { rank: 'AIR 1', name: 'GATE CSE', text: 'Consistency beats motivation. Even 3 focused hours daily for 8 months can outperform random 10-hour study days.', color: '#FBBF24' },
            { rank: 'AIR 5', name: 'GATE CSE', text: 'I revised every subject at least 4 times. Revision was more important than learning new topics.', color: '#A78BFA' },
            { rank: 'AIR 12', name: 'GATE CSE', text: 'PYQs are the closest thing to the actual exam. Never skip them.', color: '#22D3EE' },
            { rank: 'AIR 3', name: 'GATE DA', text: 'Understanding the why behind each concept matters more than memorizing solutions.', color: '#34D399' },
            { rank: 'AIR 8', name: 'GATE CSE', text: 'Your mock test scores don\'t define you — your analysis after each mock does.', color: '#F472B6' },
            { rank: 'AIR 2', name: 'GATE CSE', text: 'Solve every PYQ from the last 10 years at least twice. Patterns repeat.', color: '#FB923C' },
            { rank: 'AIR 15', name: 'GATE CSE', text: 'Don\'t collect resources. Master one book per subject completely.', color: '#818CF8' },
            { rank: 'AIR 7', name: 'GATE CSE', text: 'The last 30 days are not for learning new topics. They are for revision and confidence.', color: '#22D3EE' },
          ].map((q, i) => (
            <AnimatedSection key={i}>
              <div className="rounded-xl p-5 h-full transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'rgba(139,92,246,0.02)', border: '1px solid rgba(139,92,246,0.08)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🏆</span>
                  <span className="text-[10px] font-bold" style={{ color: q.color }}>{q.rank} {q.name}</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed italic">"{q.text}"</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Meet the Creator */}
      <section ref={creatorRef} className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#FBBF24' }}>
                👨‍💻 Meet the Creator
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
                Built for{' '}
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #8B5CF6, #22D3EE)' }}>
                  GATE Aspirants
                </span>
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto text-sm">
                Every line of code, every feature, and every pixel was crafted with one mission — to make GATE preparation smarter.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-5 gap-8">
            <AnimatedSection className="md:col-span-2">
              <div className="glass-creator rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }} />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)' }} />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold mb-6 badge-glow" style={{ color: '#FBBF24', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(245,158,11,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
                  🚀 Built by PURRU AJAY KUMAR
                </div>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
                  PA
                </div>
                <h3 className="text-xl font-bold text-white mb-1">PURRU AJAY KUMAR</h3>
                <p className="text-sm mb-4" style={{ color: '#818CF8' }}>Founder & Developer of {BRAND.name}</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-5">
                  {BRAND.name} is an AI-powered GATE preparation platform created to help aspirants manage syllabus tracking, revision planning, PYQs, mock tests, notes, and study analytics in a single platform.
                </p>
                <a href="mailto:darkknight.dev@gmail.com" className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-[1.02]" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <span style={{ color: '#818CF8' }}>✉ darkknight.dev@gmail.com</span>
                </a>
                <div className="mt-6 pt-5 border-t" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>
                  <p className="text-[10px] text-gray-500">Built with React · Node.js · MongoDB · AI</p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection className="md:col-span-3">
              <div className="glass-creator rounded-3xl p-8 h-full">
                <h4 className="text-sm font-bold text-white mb-2">Development Journey</h4>
                <p className="text-[10px] text-gray-500 mb-8">From concept to launch</p>
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-[2px] timeline-line rounded-full" />
                  <div className="space-y-8">
                    {[
                      { date: 'Idea & Research', desc: 'Identified gaps in GATE prep tools — fragmented resources, no AI guidance, poor progress tracking.' },
                      { date: 'Architecture Design', desc: 'Designed full-stack: React frontend, Node.js API, MongoDB with in-memory fallback.' },
                      { date: 'Core Development', desc: 'Built auth, tracking, PYQ engine, mock test runner, and analytics engine.' },
                      { date: 'AI Integration', desc: 'GPT-powered mentor, personalized planner, and intelligent coach chat.' },
                      { date: 'Testing & Polish', desc: 'Responsive design, dark mode, performance optimization, UX refinement.' },
                      { date: 'Launch', desc: 'GateNexa goes live — AI-powered unified platform for GATE aspirants.' },
                    ].map((t, i) => (
                      <div key={i} className="relative pl-8 group">
                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 transition-all duration-300 group-hover:scale-125`} style={{ borderColor: i < 5 ? '#8B5CF6' : '#F59E0B', background: i < 5 ? 'rgba(139,92,246,0.2)' : 'rgba(245,158,11,0.2)' }}>
                          <div className="absolute inset-1 rounded-full" style={{ background: i < 5 ? '#8B5CF6' : '#F59E0B' }} />
                        </div>
                        <div className="group-hover:translate-x-1 transition-transform duration-300">
                          <div className="text-xs font-bold text-white mb-1">{t.date}</div>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{t.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t px-6 py-12" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name="logo" className="w-9 h-9" style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.15))' }} />
            <div>
              <div className="text-sm font-bold text-white/90" style={{ fontSize: '13px' }}>{BRAND.name}</div>
              <div style={{ color: '#A855F7', fontSize: '9px', fontWeight: 600, letterSpacing: '1px' }}>GATE 2027</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/insights" className="text-[10px] font-medium transition-colors" style={{ color: '#A78BFA' }}>Insights</Link>
            <span className="text-[10px] text-gray-600">·</span>
            <Link to="/success-hub" className="text-[10px] font-medium transition-colors" style={{ color: '#FBBF24' }}>Success Hub</Link>
            <span className="text-[10px] text-gray-600">·</span>
            <Link to="/about" className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">About</Link>
            <span className="text-[10px] text-gray-600">|</span>
            <p className="text-[10px] text-gray-500">© {new Date().getFullYear()} {BRAND.name}. Built by PURRU AJAY KUMAR.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

