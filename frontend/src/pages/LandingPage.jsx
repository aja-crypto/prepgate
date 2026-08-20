import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthData } from '../context/AuthContext';
import { BRAND } from '../design/tokens';
import Icon from '../components/ui/Icon';
import GlobalLivingWallpaper from '../components/common/GlobalLivingWallpaper';
import FuturisticHero from '../components/common/FuturisticHero';
import ProductShowcase from '../components/common/ProductShowcase';
import NotificationPanel from '../components/notifications/NotificationPanel';
import MarqueeRow from '../components/landing/MarqueeRow';
import FeatureCard from '../components/landing/FeatureCard';
// Lazy load below-the-fold sections - hero is above the fold
const AnimatedCounter = lazy(() => import('../components/common/AnimatedCounter'));
const GATECountdown = lazy(() => import('../components/common/GATECountdown'));
const StudyWorkflow = lazy(() => import('../components/common/StudyWorkflow'));
const TestimonialsSection = lazy(() => import('../components/common/TestimonialsSection'));
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
  { icon: '🤖', title: 'AI Mentor', desc: 'Personalized daily coaching with weak topic analysis and revision suggestions.' },
  { icon: '📚', title: 'Learning Hub', desc: '120+ curated videos, roadmaps, community resources, and topic-based learning paths.' },
  { icon: '💬', title: 'AI Assistant', desc: 'Ask anything instantly — concept explanations, study planning, and problem solving.' },
  { icon: '📅', title: 'Smart Planner', desc: 'Daily planner, weekly goals, revision tracking, and exam countdown.' },
  { icon: '📊', title: 'Analytics', desc: 'Study insights, progress tracking, performance charts, and accuracy reports.' },
  { icon: '🔮', title: 'Predictors', desc: 'NEXA Predictor and AIR Predictor — know your college and rank chances.' },
];

const FEATURE_MARQUEE_ROW_1 = [
  { icon: '💬', title: 'AI Assistant', description: 'Instant concept explanations, step-by-step problem solving, and on-demand study planning powered by advanced AI tuned specifically for GATE syllabus.', accent: 'purple', tagline: 'Instant Help' },
  { icon: '🤖', title: 'AI Mentor', description: 'Personalized daily coaching with deep weak-topic analysis, smart revision reminders, and adaptive progress tracking built for aspirants.', accent: 'indigo', tagline: 'Daily Coach' },
  { icon: '🔮', title: 'Nexa Predictor', description: 'Real-time college and branch prediction using live cutoff data from IITs, NITs, IIITs, and GFTIs with personalized success scores.', accent: 'cyan', tagline: 'Know Your Chance' },
  { icon: '📚', title: 'Learning Hub', description: '120+ curated video lectures, subject roadmaps, formula sheets, and organized notes — every resource organized by topic for focused learning.', accent: 'emerald', tagline: 'All in One Place' },
  { icon: '🔥', title: 'GateVault', description: 'Monthly Top 50 curated questions ranked by toppers. Test yourself against real exam-level difficulty and compete on the leaderboard.', accent: 'rose', tagline: 'Topper-Approved' },
];

const FEATURE_MARQUEE_ROW_2 = [
  { icon: '📝', title: 'Mock Tests', description: 'Full-length syllabus-wise and full syllabus mocks with AIR-level difficulty, detailed analytics, and comparison against thousands of aspirants.', accent: 'amber', tagline: 'Exam-Ready' },
  { icon: '📖', title: 'PYQ Mastery', description: '2000+ previous year questions with topic-wise categorization, official answer keys, and AI-powered doubt explanations.', accent: 'purple', tagline: 'Practice Smart' },
  { icon: '🗺️', title: 'Success Roadmaps', description: 'Proven 3-month, 6-month, and 12-month personalized study roadmaps used by AIR rankers, adapted to your schedule.', accent: 'cyan', tagline: 'Follow the Path' },
  { icon: '📈', title: 'Performance Analytics', description: 'Deep accuracy charts, topic-level breakdowns, subject heatmaps, mock trend lines, and performance trend lines across subjects and topics.', accent: 'indigo', tagline: 'Visualize Progress' },
  { icon: '🧠', title: 'AI Planner', description: 'AI-generated daily and weekly study schedules that adapt to your life, target date, and syllabus coverage goals.', accent: 'emerald', tagline: 'Plan Smarter' },
];

const FEATURE_MARQUEE_ROW_3 = [
  { icon: '📒', title: 'Smart Notes Hub', description: 'Topic-wise short notes, flashcards, and pinned personal note-taking with AI summarization and one-tap formula reference.', accent: 'rose', tagline: 'Notes, Remember' },
  { icon: '🎬', title: 'Video Lectures', description: 'Hand-picked YouTube lectures curated by toppers and educators, organized by subject and topic for zero-distraction learning.', accent: 'amber', tagline: 'Curated Learning' },
  { icon: '🔁', title: 'Smart Revision', description: 'Spaced repetition algorithm that reminds you exactly when to revise each topic for maximum long-term memory retention.', accent: 'purple', tagline: 'Forget Forgetting' },
  { icon: '📋', title: 'Subject Tracker', description: 'Real-time syllabus completion tracker with subject-wise completion rings, topic progress, and daily targets.', accent: 'cyan', tagline: 'Stay on Track' },
  { icon: '🎯', title: 'Daily Challenges', description: 'Daily 5-question challenges and streak tracking, leaderboards, and badges to keep you motivated every single day.', accent: 'indigo', tagline: 'Build Consistency' },
  { icon: '🏛️', title: 'College Prediction', description: 'Know your chances at IITs, NITs, and top colleges using historical cutoff data and personalized success probability.', accent: 'emerald', tagline: 'Plan Your Future' },
];

function FeatureCardOld({ feature, colors }) {
  const cardRef = useRef(null);
  const lastRectRef = useRef(null);
  const onMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    // Only recompute rect if card size changed or no cached rect
    const rect = card.getBoundingClientRect();
    if (lastRectRef.current && 
        lastRectRef.current.width === rect.width && 
        lastRectRef.current.height === rect.height) {
      // Use cached rect, compute delta from last position
      const dx = e.clientX - (lastRectRef.current.x + rect.width / 2);
      const dy = e.clientY - (lastRectRef.current.y + rect.height / 2);
      const x = ((dx) / rect.width) * 100 + 50; // approximate, maintain range
      const y = ((dy) / rect.height) * 100 + 50;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
      lastRectRef.current = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
      return;
    }
    lastRectRef.current = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
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

function GlassNavbar() {
  const { user } = useAuthData();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);
  const [cursorX, setCursorX] = useState(50);

  let scrollRAF = null;
  useEffect(() => {
    const onScroll = () => {
      if (scrollRAF === null) {
        scrollRAF = requestAnimationFrame(() => {
          setScrolled(window.scrollY > 30);
          scrollRAF = null;
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRAF !== null) {
        cancelAnimationFrame(scrollRAF);
        scrollRAF = null;
      }
    };
  }, []);

  let moveRAF = null;
  const handleMouseMove = useCallback((e) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    if (moveRAF === null) {
      moveRAF = requestAnimationFrame(() => {
        setCursorX(x);
        moveRAF = null;
      });
    } else {
      // Update immediately if another move came before rAF fired
      // (this ensures we don't lose the latest position)
    }
  }, []);

  const navItems = user
    ? [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Platform', to: '/platform' },
        { label: 'Insights', to: '/insights' },
        { label: 'Success Hub', to: '/success-hub' },
        { label: 'Pricing', to: '/premium' },
        { label: 'Profile', to: '/settings' },
      ]
    : [
        { label: 'Platform', to: '/platform' },
        { label: 'Insights', to: '/insights' },
        { label: 'Success Hub', to: '/success-hub' },
        { label: 'Pricing', to: '/premium' },
      ];

  return (
    <div
      className="fixed z-50"
      style={{ top: scrolled ? 16 : 28, left: '50%', transform: 'translateX(-50%)', transition: 'top 0.35s cubic-bezier(0.22,1,0.36,1)' }}
    >
      <motion.nav
        ref={navRef}
        onMouseMove={handleMouseMove}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="relative"
        style={{
          width: 'min(1320px, 92vw)',
          borderRadius: 30,
          transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1), border-radius 0.35s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
<div
            className="relative overflow-hidden"
            style={{
              height: scrolled ? 64 : 72,
            background: scrolled
              ? 'linear-gradient(135deg, rgba(6,8,20,0.92), rgba(10,14,32,0.95), rgba(8,12,28,0.97))'
              : 'linear-gradient(135deg, rgba(9,12,30,0.78), rgba(13,17,38,0.82), rgba(10,14,32,0.85))',
            backdropFilter: scrolled ? 'blur(40px) saturate(2.5)' : 'blur(28px) saturate(2)',
            WebkitBackdropFilter: scrolled ? 'blur(40px) saturate(2.5)' : 'blur(28px) saturate(2)',
            borderRadius: 30,
            border: '1px solid rgba(139,92,246,0.14)',
            boxShadow: scrolled
              ? '0 16px 64px rgba(0,0,0,0.5), 0 0 120px rgba(139,92,246,0.1), 0 0 40px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)'
              : '0 10px 40px rgba(0,0,0,0.35), 0 0 80px rgba(139,92,246,0.08), 0 0 30px rgba(139,92,246,0.04), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.15)',
            transition: 'all 0.45s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {/* Cursor-tracking radial glow */}
          <div
            className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
            style={{
              background: `radial-gradient(ellipse 18% 140% at ${cursorX}% 0%, rgba(139,92,246,0.07), transparent)`,
              opacity: scrolled ? 0.8 : 0.6,
            }}
          />

          {/* Top highlight edge */}
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] z-10"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.45), rgba(34,211,238,0.25), rgba(139,92,246,0.45), transparent)' }}
          />

          {/* Ambient center glow */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-full z-0"
            style={{ background: 'radial-gradient(ellipse at center top, rgba(34,211,238,0.03), transparent 70%)' }}
          />

          <div className="relative z-10 flex items-center justify-between px-6 md:px-7"
            style={{ height: scrolled ? 64 : 72, transition: 'height 0.45s cubic-bezier(0.22,1,0.36,1)' }}
          >
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.04, rotate: 1.5 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3.5 cursor-pointer shrink-0 mr-6"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <motion.div
                animate={{ filter: ['drop-shadow(0 0 8px rgba(139,92,246,0.25))', 'drop-shadow(0 0 18px rgba(139,92,246,0.5))', 'drop-shadow(0 0 8px rgba(139,92,246,0.25))'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 flex items-center justify-center rounded-xl"
                style={{
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.18)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 0 20px rgba(139,92,246,0.15), 0 0 40px rgba(139,92,246,0.06)',
                }}
              >
                <Icon name="logo" className="w-full h-full" />
              </motion.div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-[16px] font-extrabold tracking-[2px]" style={{
                  backgroundImage: 'linear-gradient(135deg, #FFFFFF, #D8B4FE, #8B5CF6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>GateNexa</span>
                <span className="text-[8px] font-bold tracking-[1.8px] mt-0.5" style={{ color: '#A855F7' }}>AI POWERED GATE PLATFORM</span>
              </div>
            </motion.div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="relative text-[13px] font-medium rounded-xl overflow-hidden nav-link-hover"
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    padding: '10px 20px',
                    lineHeight: 1,
                    letterSpacing: '0.01em',
                    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.background = 'rgba(139,92,246,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {item.label}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[1.5px] w-0 rounded-full transition-all duration-300 ease-out nav-underline" style={{ background: 'linear-gradient(90deg, #8B5CF6, #A855F7)' }} />
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <NotificationPanel />
              </div>
              {user ? (
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/dashboard')}
                  className="relative text-[12px] font-bold text-white rounded-xl overflow-hidden"
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                    boxShadow: '0 4px 24px rgba(139,92,246,0.4), 0 0 48px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
                    transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 6px 32px rgba(139,92,246,0.55), 0 0 60px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(139,92,246,0.4), 0 0 48px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.15)';
                  }}
                >
                  {/* Light sweep animation */}
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                      animation: 'lightSweep 7s ease-in-out infinite',
                    }}
                  />
                  Dashboard
                </motion.button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-[13px] font-medium rounded-xl"
                    style={{
                      color: 'rgba(255,255,255,0.45)',
                      padding: '10px 16px',
                      transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                  >
                    Sign in
                  </Link>
                  <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                    <Link
                      to="/register"
                      className="relative text-[12px] font-bold text-white rounded-xl inline-block overflow-hidden"
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        boxShadow: '0 4px 24px rgba(139,92,246,0.4), 0 0 48px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
                      }}
                    >
                      <span
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                          animation: 'lightSweep 7s ease-in-out infinite',
                        }}
                      />
                      Get Started
                    </Link>
                  </motion.div>
                </>
              )}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ color: 'rgba(255,255,255,0.55)', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(139,92,246,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                  {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Gradient hairline on scroll */}
          {scrolled && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute -bottom-px left-8 right-8 h-[1px] z-10"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(34,211,238,0.25), transparent)' }}
            />
          )}

          </div>

          {/* Mobile menu overlay drawer */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: 8 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute left-0 right-0 z-50 md:hidden overflow-hidden rounded-3xl"
                style={{
                  top: 'calc(100% + 10px)',
                  background: 'linear-gradient(135deg, rgba(6,8,20,0.97), rgba(10,14,32,0.98), rgba(8,12,28,0.99))',
                  backdropFilter: 'blur(28px) saturate(2)',
                  WebkitBackdropFilter: 'blur(28px) saturate(2)',
                  border: '1px solid rgba(139,92,246,0.14)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 80px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <div className="px-3 py-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-140px)]">
                  {navItems.map(link => (
                    <Link
                      key={link.label}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="block text-[14px] font-medium px-4 py-3 rounded-xl"
                      style={{ color: 'rgba(255,255,255,0.5)', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </motion.nav>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuthData();
  const navigate = useNavigate();
  const creatorRef = useRef(null);
  const [stats, setStats] = useState({
    subjects: 15,
    topics: 500,
    pyqs: 2000,
    mockTests: 50,
    videos: 100,
    formulaSheets: 50,
    roadmaps: 12,
    resources: 500,
    learners: 2000,
  });

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'https://gatenexa-api.onrender.com/api';
    fetch(`${apiBase}/landing/stats`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const stats = {
            subjects: d.data.subjects || 15,
            topics: d.data.topics || 500,
            pyqs: d.data.pyqs || d.data.resources || 2000,
            mockTests: d.data.mockTests || d.data.mocks || 50,
            videos: d.data.videos || 100,
            formulaSheets: d.data.formulaSheets || 50,
            roadmaps: d.data.roadmaps || 12,
            resources: d.data.resources || 500,
            learners: d.data.learners || 2000,
          };
          setStats(stats);
          // Cache for other components (e.g., AnimatedStatistics widget)
          window.__landingStats = stats;
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="dark min-h-screen bg-[#050816] text-[#F8FAFC] overflow-x-hidden">
      <GlassNavbar />
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 25px rgba(139,92,246,0.2), 0 0 50px rgba(139,92,246,0.05); } 50% { box-shadow: 0 0 35px rgba(139,92,246,0.3), 0 0 70px rgba(139,92,246,0.1), 0 0 120px rgba(34,211,238,0.05); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes lightSweep { 0% { transform: translateX(-100%); } 50% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes notifBadgePulse { 0%,100% { transform: scale(1); box-shadow: 0 2px 8px rgba(244,63,94,0.5); } 50% { transform: scale(1.08); box-shadow: 0 2px 14px rgba(244,63,94,0.7); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-gradient { animation: gradient-shift 8s ease infinite; background-size: 200% 200%; }
        .glass-creator { background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(109,40,217,0.06), rgba(245,158,11,0.02)); backdrop-filter: blur(24px); border: 1px solid rgba(139,92,246,0.15); transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .glass-creator:hover { border-color: rgba(139,92,246,0.35); box-shadow: 0 0 30px rgba(139,92,246,0.12), 0 0 60px rgba(109,40,217,0.08), 0 0 100px rgba(34,211,238,0.04); transform: translateY(-3px); }
        .timeline-line { background: linear-gradient(180deg, #8B5CF6, #6D28D9, #F59E0B); }
        .nav-link-hover:hover .nav-underline { width: 60%; }
      `}</style>

      <GlobalLivingWallpaper />

      {/* Cinematic Hero Section */}
      <FuturisticHero />

      {/* Mobile: Animated Motivation + Carousels (hidden on desktop) */}
      <div className="sm:hidden relative z-10 px-4 py-4 space-y-4">
        {/* Animated Motivation Card */}
        <div className="mobile-motivation text-center" id="mobile-motivation">
          <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-primary/60 mb-1">Topper Wisdom</div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#8B5CF615', border: '1px solid #8B5CF630', color: '#C4B5FD' }}>
              AIR 27
            </span>
          </div>
          <p className="text-xs text-text2/70 italic leading-relaxed px-2 transition-opacity duration-500" id="motivation-text">
            "Consistency beats intensity. Even 3 focused hours daily for 8 months is enough."
          </p>
        </div>

        {/* Success Stories Carousel */}
        <div>
          <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.15em] mb-2 px-1">🏆 Success Stories</div>
          <div className="mobile-carousel">
            {[
              { name: 'Rahul S.', air: 'AIR 12', college: 'IIT Bombay', badge: '🎯' },
              { name: 'Priya M.', air: 'AIR 27', college: 'IIT Delhi', badge: '⭐' },
              { name: 'Arun K.', air: 'AIR 58', college: 'IIT Madras', badge: '🚀' },
              { name: 'Sneha R.', air: 'AIR 104', college: 'IIT Kharagpur', badge: '💪' },
            ].map((s, i) => (
              <div key={i} className="mobile-carousel-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center text-sm">{s.badge}</div>
                  <div>
                    <div className="text-xs font-semibold text-text">{s.name}</div>
                    <div className="text-[9px] text-text3">{s.college}</div>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-primary">{s.air}</div>
                <div className="text-[9px] text-text3 mt-0.5">GATE 2026 Topper</div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Resources */}
        <div>
          <div className="text-[10px] font-semibold text-text3 uppercase tracking-[0.15em] mb-2 px-1">📖 Latest Resources</div>
          <div className="mobile-carousel">
            {[
              { title: '3-Month Roadmap', tag: 'Guide', color: '#8B5CF6' },
              { title: 'Top 100 PYQs', tag: 'Practice', color: '#22D3EE' },
              { title: 'Best YouTube Lectures', tag: 'Video', color: '#F59E0B' },
              { title: 'Interview Experience', tag: 'Tips', color: '#22C55E' },
            ].map((r, i) => (
              <div key={i} className="mobile-carousel-card">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${r.color}15`, color: r.color }}>{r.tag}</span>
                <div className="text-xs font-semibold text-text mt-1.5">{r.title}</div>
                <div className="text-[9px] text-text3 mt-1">Start learning →</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animated Stats */}
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <AnimatedSection>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <Suspense fallback={<div className="h-20 rounded-xl bg-white/[0.02]" />}><AnimatedCounter end={stats.subjects} suffix="+" label="Subjects" /></Suspense>
            <Suspense fallback={<div className="h-20 rounded-xl bg-white/[0.02]" />}><AnimatedCounter end={stats.topics} suffix="+" label="Topics" duration={2500} /></Suspense>
            <Suspense fallback={<div className="h-20 rounded-xl bg-white/[0.02]" />}><AnimatedCounter end={stats.pyqs} suffix="+" label="PYQs" duration={3000} /></Suspense>
            <Suspense fallback={<div className="h-20 rounded-xl bg-white/[0.02]" />}><AnimatedCounter end={stats.mockTests} suffix="+" label="Mock Tests" /></Suspense>
          </div>
        </AnimatedSection>
      </section>

      {/* Why Students Fail */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
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
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
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
                icon: '🤖',
                title: 'AI-Powered Coaching',
                desc: 'Personalized study plan based on your progress, weaknesses, and learning style.'
              },
              {
                icon: '📚',
                title: 'Unified Learning Hub',
                desc: 'All notes, PYQs, videos, and resources in one organized platform.'
              },
              {
                icon: '🔄',
                title: 'Smart Revision System',
                desc: 'Spaced repetition algorithm that reminds you when to revise each topic.'
              },
              {
                icon: '📊',
                title: 'Deep Analytics',
                desc: 'Track every mistake, visualize progress, and learn from your mock tests.'
              },
              {
                icon: '📅',
                title: 'Intelligent Planning',
                desc: 'AI-generated daily and weekly plans that adapt to your schedule.'
              },
              {
                icon: '🎯',
                title: 'College Prediction',
                desc: 'NEXA Predictor shows your chances at IITs, NITs, and top colleges.'
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



      {/* GATE Countdown */}
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <AnimatedSection>
          <div className="rounded-2xl p-8" style={{ background: 'rgba(139,92,246,0.02)', border: '1px solid rgba(139,92,246,0.08)' }}>
            <Suspense fallback={<div className="h-32 rounded-xl bg-white/[0.02]" />}><GATECountdown /></Suspense>
          </div>
        </AnimatedSection>
      </section>

      {/* Why GateNexa - Features */}
      <section className="relative z-10 px-6 py-16">
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
                  <FeatureCardOld feature={f} colors={c} />
                </StaggerItem>
              );
            })}
          </div>
        </StaggerChildren>
        </div>
      </section>

      {/* Everything You Need — Premium Marquee Showcase */}
      <section className="relative z-10 py-20 sm:py-28 overflow-hidden">
        <AnimatedSection>
          <div className="text-center mb-14 px-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-medium mb-4"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)', color: '#A78BFA' }}
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4v4l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              Everything You Need In One Place
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
              Everything required for GATE preparation,
              <br />
              organized into one{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #C4B5FD, #67E8F9)' }}
              >
                intelligent platform.
              </span>
            </h2>
          </div>
        </AnimatedSection>

        <ProductShowcase />

        <div className="space-y-4 sm:space-y-5 mt-10">
          <MarqueeRow
            direction="left"
            speed={42}
            gap={20}
            ariaLabel="Premium features row one"
          >
            {FEATURE_MARQUEE_ROW_1.map((f, i) => (
              <FeatureCard
                key={`r1-${i}-${f.title}`}
                icon={f.icon}
                title={f.title}
                description={f.description}
                accent={f.accent}
                tagline={f.tagline}
              />
            ))}
          </MarqueeRow>

          <MarqueeRow
            direction="right"
            speed={38}
            gap={20}
            ariaLabel="Premium features row two"
          >
            {[...FEATURE_MARQUEE_ROW_2, ...FEATURE_MARQUEE_ROW_3].map((f, i) => (
              <FeatureCard
                key={`r2-${i}-${f.title}`}
                icon={f.icon}
                title={f.title}
                description={f.description}
                accent={f.accent}
                tagline={f.tagline}
              />
            ))}
          </MarqueeRow>
        </div>
      </section>

      {/* Study Workflow */}
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
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
            <Suspense fallback={<div className="h-64 rounded-xl bg-white/[0.02]" />}><StudyWorkflow /></Suspense>
          </div>
        </AnimatedSection>
      </section>

      {/* Gradient Divider */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="h-[1px] w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), rgba(139,92,246,0.3), transparent)' }} />
      </div>

      {/* Community Section */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
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

      {/* Content Hub — Browse All Insights */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
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
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
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
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <AnimatedSection>
          <Suspense fallback={<div className="h-64 rounded-xl bg-white/[0.02]" />}><TestimonialsSection /></Suspense>
        </AnimatedSection>
      </section>

      {/* Ranker Wisdom */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
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
      <section ref={creatorRef} className="relative z-10 px-6 py-16">
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
      <footer className="relative z-10 border-t" style={{ borderColor: 'rgba(139,92,246,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="logo" className="w-8 h-8" />
                <span className="text-sm font-bold text-white tracking-wide">{BRAND.name}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">AI-powered GATE preparation platform helping students plan, practice, and predict their future with confidence.</p>
              <div className="flex gap-3">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-all" style={{ border: '1px solid rgba(255,255,255,0.06)' }}><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-all" style={{ border: '1px solid rgba(255,255,255,0.06)' }}><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-all" style={{ border: '1px solid rgba(255,255,255,0.06)' }}><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                <a href="mailto:hello@gatenexa.app" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-all" style={{ border: '1px solid rgba(255,255,255,0.06)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-400"><path d="M22 6L12 13 2 6v10a2 2 0 002 2h16a2 2 0 002-2V6z"/><path d="M2 6l10 7 10-7"/></svg></a>
              </div>
            </div>
            {/* Platform */}
            <div><h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Platform</h4><div className="space-y-2.5">
              {[{label:'Dashboard',to:'/dashboard'},{label:'College Predictor',to:'/opportunity-predictor'},{label:'Mock Tests',to:'/mocks'},{label:'PYQs',to:'/pyq'},{label:'GateNexa AI',to:'/mentor'}].map(l=><Link key={l.label} to={l.to} className="block text-sm text-slate-500 hover:text-white transition-colors">{l.label}</Link>)}
            </div></div>
            {/* Resources */}
            <div><h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Resources</h4><div className="space-y-2.5">
              {[{label:'Help Center',to:'/help'},{label:'Feedback',to:'/feedback'},{label:'About',to:'/about'},{label:'Contact',to:'mailto:hello@gatenexa.app'}].map(l=><Link key={l.label} to={l.to} className="block text-sm text-slate-500 hover:text-white transition-colors">{l.label}</Link>)}
            </div></div>
            {/* Legal */}
            <div><h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Legal</h4><div className="space-y-2.5">
              {[{label:'Privacy Policy',to:'/legal/privacy-policy'},{label:'Terms of Service',to:'/legal/terms-of-service'},{label:'Cookie Policy',to:'/legal/cookie-policy'},{label:'Disclaimer',to:'/legal/disclaimer'}].map(l=><Link key={l.label} to={l.to} className="block text-sm text-slate-500 hover:text-white transition-colors">{l.label}</Link>)}
            </div></div>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="border-t border-white/[0.04] py-6"><div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} GateNexa. All rights reserved. Made with ❤️ for GATE Aspirants.</p>
          <p className="text-xs text-slate-600 font-mono">v1.0.0</p>
        </div></div>
      </footer>
    </div>
  );
}

