import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../design/tokens';
import Icon from '../components/ui/Icon';

function useIntersection(rootMargin = '-80px', threshold = 0.15) {
  const [entries, setEntries] = useState({});
  const observerRef = useRef(null);

  const observe = useCallback((el) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (observed) => {
          observed.forEach((entry) => {
            if (entry.isIntersecting) {
              setEntries((prev) => ({ ...prev, [entry.target.dataset.section]: true }));
            }
          });
        },
        { rootMargin, threshold }
      );
    }
    if (el) observerRef.current.observe(el);
  }, [rootMargin, threshold]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { entries, observe };
}

function ScrollReveal({ children, section, observe, entries, className = '' }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) observe(ref.current); }, [observe]);

  return (
    <div
      ref={ref}
      data-section={section}
      className={`scroll-reveal ${entries[section] ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export default function AboutPage() {
  const [readingProgress, setReadingProgress] = useState(0);
  const { entries, observe } = useIntersection();

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="about-page dark">
      <div className="reading-progress">
        <div className="progress-fill" style={{ height: `${readingProgress}%` }} />
      </div>

      {/* Background effects */}
      <div className="bg-neural" aria-hidden="true" />
      <div className="bg-gradient-blur" aria-hidden="true" />
      <div className="bg-dots" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />

      <nav className="about-nav">
        <Link to="/" className="nav-logo">
          <Icon name="logo" className="nav-logo-img" />
          <div className="logo-text">
            <span className="logo-name">{BRAND.name}</span>
            <span className="logo-year">GATE 2027</span>
          </div>
        </Link>
        <Link to="/dashboard" className="nav-back">Dashboard</Link>
      </nav>

      {/* Hero — Founder card left + Content right */}
      <section className="hero-section">
        <div className="hero-layout">
          <div className="founder-card">
            <div className="founder-card-inner">
              <div className="fc-banner">
                <div className="fc-banner-profile">
                  <div className="fc-dp-wrap">
                    <img src="/images/my dp.jpg" alt="Purru Ajay Kumar" className="fc-dp-sm" />
                  </div>
                  <div className="fc-banner-text">
                    <h2 className="fc-banner-name">PURRU AJAY KUMAR</h2>
                    <p className="fc-banner-sub">Full Stack Web Developer</p>
                    <p className="fc-banner-sub">Exploring AI &amp; Education</p>
                  </div>
                </div>
              </div>

              <div className="fc-details">
                <div className="fc-detail-row">
                  <span className="fc-detail-tag-em">🎓 B.Tech Final Year Student</span>
                  <span className="fc-detail-tag-em">💻 Full Stack Developer</span>
                  <span className="fc-detail-tag-em">📚 GATE 2027 Aspirant</span>
                  <span className="fc-detail-tag-em">🤖 Exploring AI &amp; Education</span>
                </div>
                <div className="fc-quote">
                  Helping GATE aspirants spend less time searching<br />and more time learning, revising, and improving.
                </div>

                <a href="/about" className="fc-btn-glass">About the Founder &rarr;</a>
              </div>
            </div>
          </div>

          <div className="hero-content">
            <div className="hc-badge">About GateApex</div>
            <h1 className="hc-heading">
              One Platform.<br />Every Resource.<br />Complete Preparation.
            </h1>
            <p className="hc-sub">
              Organizing notes, PYQs, revision resources, formula sheets, mock tests, and AI assistance into one structured platform so aspirants can focus on preparation instead of searching.
            </p>
            <div className="hc-stats">
              <div className="st-item"><span className="st-icon">&#128218;</span><span className="st-num">5000+</span><span className="st-label">Resources Organized</span></div>
              <div className="st-item"><span className="st-icon">&#128221;</span><span className="st-num">1000+</span><span className="st-label">PYQs Indexed</span></div>
              <div className="st-item"><span className="st-icon">&#129302;</span><span className="st-num">24/7</span><span className="st-label">AI Assistance</span></div>
              <div className="st-item"><span className="st-icon">&#127891;</span><span className="st-num">Student</span><span className="st-label">First &middot; Built for Aspirants</span></div>
            </div>
          </div>
        </div>
      </section>

      <main className="about-content">

        {/* ── MISSION ── */}
        <ScrollReveal section="mission" observe={observe} entries={entries}>
          <div className="mission-block">
            <h2 className="mission-heading">Our Mission</h2>
            <p className="mission-text">
              Preparation should be challenging because of concepts, not because resources are difficult to find.
            </p>
            <p className="mission-text">
              GateApex exists to make preparation more organized, accessible, and efficient for every aspirant.
            </p>
            <div className="mission-accent" />
          </div>
        </ScrollReveal>

        {/* ── WHY I BUILT GateApex ── */}
        <ScrollReveal section="why" observe={observe} entries={entries}>
          <div className="why-card">
            <div className="why-quote-icon">"</div>
            <div className="why-particles" aria-hidden="true">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="why-particle" style={{ animationDelay: `${i * 0.4}s` }} />
              ))}
            </div>
            <h2 className="why-heading">Why I Built GateApex</h2>
            <p className="why-text">
              Most students waste countless hours searching for notes, PDFs, PYQs, and resources 
              across Telegram, YouTube, blogs, and websites. I experienced this firsthand.
            </p>
            <p className="why-text">
              GateApex was built to organize everything in one place so aspirants can focus on 
              preparation instead of searching. Every feature exists because I wished it existed 
              when I was preparing.
            </p>
            <p className="why-text why-em">
              "Built by a student who understood the struggle. Designed for aspirants who deserve better."
            </p>
          </div>
        </ScrollReveal>

        {/* ── WHAT YOU WILL FIND HERE ── */}
        <ScrollReveal section="resources" observe={observe} entries={entries}>
          <div className="resources-block">
            <h2 className="section-heading">What You Will Find Here</h2>
            <p className="section-sub">
              Everything on GateApex is designed around one goal — helping you prepare with clarity, consistency, and confidence.
            </p>
            <div className="resource-grid">
              {[
                { icon: '📓', title: 'Subject-wise Notes', desc: 'Structured notes for every GATE CSE subject' },
                { icon: '📊', title: 'Formula Sheets', desc: 'Quick reference for formulas and key concepts' },
                { icon: '📋', title: 'PYQs', desc: 'Previous year questions with community stats' },
                { icon: '✍️', title: 'Mock Tests', desc: '55+ pre-seeded tests with detailed analytics' },
                { icon: '📖', title: 'Revision Materials', desc: 'Short notes and summaries for last-minute revision' },
                { icon: '🤖', title: 'AI Assistance', desc: 'Smart mentor, coach, and doubt solver' },
              ].map((item, i) => (
                <div key={i} className="resource-card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="rc-icon">{item.icon}</span>
                  <h3 className="rc-title">{item.title}</h3>
                  <p className="rc-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ── RESOURCE ATTRIBUTION ── */}
        <ScrollReveal section="attribution" observe={observe} entries={entries}>
          <div className="attr-block">
            <h2 className="section-heading">Resource Attribution</h2>
            <p className="section-sub">
              We believe quality educational content deserves recognition. Sources and creators are always credited.
            </p>
            <div className="attr-timeline">
              <div className="attr-line" />
              {[
                { icon: '▶️', label: 'YouTube Channels', desc: 'Free lectures and tutorials from educators' },
                { icon: '🌐', label: 'Websites', desc: 'Curated links to trusted educational sites' },
                { icon: '📚', label: 'Open Learning', desc: 'OER content and public domain resources' },
                { icon: '💬', label: 'Community', desc: 'Discussions and shared knowledge from aspirants' },
                { icon: '👥', label: 'Student Contributions', desc: 'Notes and materials shared by fellow students' },
              ].map((item, i) => (
                <div key={i} className="attr-node" style={{ animationDelay: `${i * 0.15}s` }}>
                  <span className="attr-dot" />
                  <span className="attr-icon">{item.icon}</span>
                  <div className="attr-text">
                    <strong>{item.label}</strong>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ── COPYRIGHT ── */}
        <ScrollReveal section="copyright" observe={observe} entries={entries}>
          <div className="copyright-card">
            <div className="cp-icon">&#169;</div>
            <div>
              <h2 className="section-heading" style={{ marginBottom: 8 }}>Copyright &amp; Content Policy</h2>
              <p className="cp-text">
                If any creator would like content removed, updated, or attributed differently, requests are reviewed respectfully and promptly. We respect the work of educators, creators, coaching institutes, and content publishers. Our goal is to support the GATE community while respecting intellectual property rights.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* ── FEEDBACK ── */}
        <ScrollReveal section="feedback" observe={observe} entries={entries}>
          <div className="feedback-block">
            <h2 className="section-heading">Feedback &amp; Suggestions</h2>
            <p className="section-sub">GateApex is continuously improving. Help us make it better.</p>
            <div className="feedback-grid">
              {[
                { icon: '🔍', title: 'Missing Resources', desc: 'Found something we should add?' },
                { icon: '🔗', title: 'Broken Links', desc: 'Spot a dead link? Let us know.' },
                { icon: '💡', title: 'Feature Requests', desc: 'Have an idea for a new feature?' },
                { icon: '✅', title: 'Corrections', desc: 'Found incorrect information?' },
              ].map((item, i) => (
                <div key={i} className="feedback-card">
                  <span className="fb-icon">{item.icon}</span>
                  <h3 className="fb-title">{item.title}</h3>
                  <p className="fb-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ── PERSONAL NOTE ── */}
        <ScrollReveal section="founder" observe={observe} entries={entries}>
          <div className="founder-card-premium">
            <div className="fc-spotlight" aria-hidden="true" />
            <div className="fc-premium-inner">
              <div className="fc-premium-avatar">
                <img src="/images/my dp.jpg" alt="Purru Ajay Kumar" />
              </div>
              <div className="fc-premium-body">
                <h3 className="fc-premium-name">Purru Ajay Kumar</h3>
                <div className="fc-premium-tags">
                  <span>B.Tech Final Year</span>
                  <span>Full Stack Developer</span>
                  <span>GATE 2027 Aspirant</span>
                </div>
                <p className="fc-premium-text">
                  I built GateApex because I lived the struggle of GATE preparation myself. The scattered resources, 
                  the endless Telegram channels, the fear of missing a good PDF or a mock test — I experienced it all. 
                  This platform is my attempt to solve that problem for every aspirant who follows. Every feature, 
                  every resource, every line of code was written with one question in mind: 
                  "Would this have helped me when I was preparing?"
                </p>
                <p className="fc-premium-text">
                  GateApex is free, open, and always will be. Because quality preparation should not depend 
                  on how much you can spend.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ── ENDING ── */}
        <section className="ending-section">
          <div className="ending-content">
            <p className="ending-line" style={{ animationDelay: '0s' }}>Spend less time searching.</p>
            <p className="ending-line" style={{ animationDelay: '0.3s' }}>Spend more time learning.</p>
            <p className="ending-line" style={{ animationDelay: '0.6s' }}>Focus on revision.</p>
            <p className="ending-line" style={{ animationDelay: '0.9s' }}>Stay consistent.</p>
            <p className="ending-tagline" style={{ animationDelay: '1.5s' }}>
              Built by a student. For students.
            </p>
            <p className="ending-signature" style={{ animationDelay: '2s' }}>
              — Purru Ajay Kumar
            </p>
          </div>
        </section>

      </main>

      <footer className="about-footer">
        <p>&copy; {new Date().getFullYear()} {BRAND.name}. Built by PURRU AJAY KUMAR.</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;800&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        .about-page {
          min-height: 100vh;
          background: #030514;
          color: #F8FAFC;
          overflow-x: hidden;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ── Reading Progress Line ── */
        .reading-progress {
          position: fixed;
          left: 0;
          top: 0;
          width: 3px;
          height: 100vh;
          z-index: 100;
          background: rgba(139,92,246,0.08);
        }
        .progress-fill {
          width: 100%;
          background: linear-gradient(180deg, #8B5CF6, #A855F7);
          transition: height 0.1s linear;
          border-radius: 0 0 4px 4px;
        }

        /* ── Background ── */
        .bg-neural {
          position: fixed; inset: 0;
          background:
            radial-gradient(circle at 20% 30%, rgba(139,92,246,0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(139,92,246,0.02) 0%, transparent 50%);
          pointer-events: none; z-index: 0;
        }
        .bg-gradient-blur {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse at 50% -20%, rgba(139,92,246,0.04) 0%, transparent 60%);
          pointer-events: none; z-index: 0;
        }
        .bg-dots {
          position: fixed; inset: 0;
          background-image: radial-gradient(rgba(139,92,246,0.06) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none; z-index: 0;
        }
        .bg-noise {
          position: fixed; inset: 0;
          opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 256px 256px;
          pointer-events: none; z-index: 0;
        }

        /* ── Navigation ── */
        .about-nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; max-width: 900px; margin: 0 auto;
        }
        .nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; transition: opacity 0.25s; }
        .nav-logo:hover { opacity: 0.85; }
        .nav-logo-img {
          width: 36px; height: 36px; border-radius: 10px;
          object-fit: contain;
        }
        .logo-text { display: flex; flex-direction: column; }
        .logo-name { font-size: 13px; font-weight: 700; color: #fff; }
        .logo-year { font-size: 10px; color: #A78BFA; }
        .nav-back {
          font-size: 12px; color: #6B7280; text-decoration: none;
          padding: 6px 14px; border-radius: 8px; transition: color 0.25s;
        }
        .nav-back:hover { color: #fff; }

        /* ── Hero ── */
        .hero-section {
          position: relative; z-index: 10;
          max-width: 1100px; margin: 0 auto;
          padding: 60px 24px 60px;
        }
        .hero-layout {
          display: flex;
          align-items: center;
          gap: 64px;
        }
        .hero-content {
          flex: 1;
          text-align: center;
          padding-top: 12px;
        }

        /* ── Floating Tech Stack ── */
        .tech-stack {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .tech-chip {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
          color: rgba(196,181,253,0.5);
          background: rgba(139,92,246,0.05);
          border: 1px solid rgba(139,92,246,0.1);
          animation: techFloat 3s ease-in-out infinite;
          pointer-events: none;
        }
        .tech-chip:nth-child(1) { animation-delay: 0s; }
        .tech-chip:nth-child(2) { animation-delay: 0.5s; }
        .tech-chip:nth-child(3) { animation-delay: 1s; }
        .tech-chip:nth-child(4) { animation-delay: 1.5s; }

        /* ── Founder Card ── */
        .founder-card {
          flex-shrink: 0;
          width: 420px;
        }
        .founder-card-inner {
          border-radius: 20px;
          border: 1px solid rgba(139,92,246,0.15);
          box-shadow: 0 10px 40px rgba(139,92,246,0.12), 0 0 80px rgba(139,92,246,0.04);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
          background: linear-gradient(170deg, rgba(8,12,32,0.92), rgba(5,8,22,0.95));
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .founder-card-inner:hover {
          transform: translateY(-4px);
          border-color: rgba(139,92,246,0.35);
          box-shadow: 0 12px 50px rgba(139,92,246,0.2), 0 0 100px rgba(139,92,246,0.06);
        }

        /* ── Banner ── */
        .fc-banner {
          position: relative;
          width: 100%;
          height: 320px;
          background-image: url('/images/batman.png');
          background-size: cover;
          background-position: 50% 30%;
          background-repeat: no-repeat;
        }
        /* Layered gradient overlay: darkens left edge for readability, fades to clear for Batman */
        .fc-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, rgba(3,5,20,0.55) 0%, rgba(3,5,20,0.25) 40%, transparent 65%),
            linear-gradient(180deg, rgba(3,5,20,0.2) 0%, transparent 40%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }
        /* Subtle purple accent glow at top-left */
        .fc-banner::after {
          content: '';
          position: absolute;
          top: -60px;
          left: -60px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Profile overlay — no glass, directly on wallpaper */
        .fc-banner-profile {
          position: absolute;
          top: 50%;
          left: 24px;
          transform: translateY(-50%);
          z-index: 1;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .fc-dp-wrap {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(96,165,250,0.1));
          box-shadow: 0 0 16px rgba(139,92,246,0.08);
        }
        .fc-dp-sm {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid rgba(139,92,246,0.08);
        }
        .fc-banner-text {
          display: flex;
          flex-direction: column;
          padding-top: 4px;
        }
        .fc-banner-name {
          margin: 0;
          font-size: clamp(20px, 2.5vw, 26px);
          font-weight: 800;
          letter-spacing: 0.02em;
          line-height: 1.2;
          white-space: nowrap;
          background: linear-gradient(135deg, #0A0A0A, #8B5CF6, #E2E8F0, #0A0A0A, #FBBF24, #8B5CF6);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: nameShine 6s ease infinite;
          filter: drop-shadow(0 0 8px rgba(0,0,0,0.9)) drop-shadow(0 0 20px rgba(0,0,0,0.4));
          position: relative;
          display: inline-block;
        }
        .fc-banner-name::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, rgba(255,255,255,0.5), rgba(147,197,253,0.2));
          border-radius: 2px;
          animation: underlineGrow 1.2s ease 0.5s forwards;
        }
        .fc-banner-sub {
          margin: 0;
          font-size: clamp(12px, 1.4vw, 14px);
          font-weight: 500;
          line-height: 1.5;
          color: rgba(226,232,240,0.85);
          text-shadow:
            0 0 6px rgba(0,0,0,0.7),
            0 0 20px rgba(0,0,0,0.3);
          white-space: nowrap;
        }
        .fc-banner-sub:first-of-type {
          margin-top: 8px;
        }

        /* ── Founder Details ── */
        .fc-details {
          padding: 20px 20px 24px;
          text-align: center;
        }
        .fc-detail-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-bottom: 14px;
        }
        .fc-detail-tag-em {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 10.5px;
          font-weight: 600;
          color: #C4B5FD;
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.15);
          backdrop-filter: blur(4px);
          transition: transform 0.25s ease, border-color 0.25s ease;
          cursor: default;
        }
        .fc-detail-tag-em:hover {
          transform: translateY(-2px);
          border-color: rgba(139,92,246,0.35);
        }
        .fc-quote {
          font-size: 12px;
          line-height: 1.7;
          color: rgba(196,181,253,0.55);
          font-style: italic;
          margin: 0 0 8px;
          max-width: 90%;
          margin-left: auto;
          margin-right: auto;
        }

        /* ── Glass Button ── */
        .fc-btn-glass {
          display: block;
          width: fit-content;
          margin: 16px auto 0;
          padding: 10px 28px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: #C4B5FD;
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.2);
          backdrop-filter: blur(8px);
          text-decoration: none;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
          cursor: pointer;
        }
        .fc-btn-glass:hover {
          transform: translateY(-2px);
          border-color: rgba(139,92,246,0.5);
          background: rgba(139,92,246,0.1);
          box-shadow: 0 0 28px rgba(139,92,246,0.18);
        }

        /* ── Hero Content (Premium AI Startup) ── */
        .hc-badge {
          display: inline-block;
          font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
          color: #A78BFA; text-transform: uppercase;
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.15);
          padding: 6px 18px; border-radius: 100px;
          animation: fadeIn 0.8s ease forwards;
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .hc-heading {
          font-size: clamp(30px, 4.5vw, 48px);
          font-weight: 800; letter-spacing: -0.02em;
          line-height: 1.1;
          background: linear-gradient(135deg, #8B5CF6, #3B82F6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 20px 0 16px;
          animation: slideUp 0.8s ease 0.2s both;
          filter: drop-shadow(0 0 30px rgba(139,92,246,0.15));
          font-family: 'Sora', system-ui, sans-serif;
        }
        .hc-sub {
          font-size: clamp(14px, 1.6vw, 16px);
          color: #94A3B8; line-height: 1.8;
          max-width: 500px; margin: 0 auto;
          animation: fadeIn 0.8s ease 0.5s both;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .hc-stats {
          display: flex; justify-content: center; gap: 36px;
          margin-top: 36px;
          animation: fadeIn 0.8s ease 0.8s both;
          flex-wrap: wrap;
        }
        .st-item { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 100px; }
        .st-icon { font-size: 20px; margin-bottom: 2px; opacity: 0.4; }
        .st-num { font-size: 22px; font-weight: 800; color: #fff; font-family: 'Sora', system-ui, sans-serif; }
        .st-label { font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; font-family: 'Space Grotesk', system-ui, sans-serif; }

        /* ── Content Area ── */
        .about-content {
          position: relative; z-index: 10;
          max-width: 720px; margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* ── Scroll Reveal ── */
        .scroll-reveal {
          opacity: 0; transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .scroll-reveal.visible {
          opacity: 1; transform: translateY(0);
        }

        /* ── Section Shared ── */
        .section-heading {
          font-size: clamp(20px, 2.8vw, 28px);
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #FFFFFF;
          margin: 0 0 12px;
          font-family: 'Sora', system-ui, sans-serif;
        }
        .section-sub {
          font-size: 15px;
          line-height: 1.8;
          color: #94A3B8;
          margin: 0 0 32px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── MISSION ── */
        .mission-block {
          padding: 60px 40px 48px;
          text-align: center;
          position: relative;
          border-left: 3px solid rgba(139,92,246,0.15);
          border-radius: 0 16px 16px 0;
          background: rgba(10,15,35,0.3);
        }
        .mission-heading {
          font-size: clamp(28px, 3.5vw, 40px);
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 24px;
          background: linear-gradient(135deg, #8B5CF6, #3B82F6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 24px rgba(139,92,246,0.2));
          font-family: 'Sora', system-ui, sans-serif;
        }
        .mission-text {
          font-size: 15px;
          line-height: 1.8;
          color: #94A3B8;
          margin: 0 auto 16px;
          max-width: 580px;
          opacity: 0;
          animation: fadeIn 0.8s ease forwards;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .mission-text:nth-child(2) { animation-delay: 0.2s; }
        .mission-text:nth-child(3) { animation-delay: 0.4s; }
        .mission-accent {
          width: 60px; height: 3px;
          margin: 24px auto 0;
          background: linear-gradient(90deg, #8B5CF6, #3B82F6);
          border-radius: 4px;
          animation: glowPulse 3s ease infinite;
        }

        /* ── WHY I BUILT GateApex ── */
        .why-card {
          position: relative;
          padding: 48px 40px;
          border-radius: 20px;
          border: 1px solid rgba(139,92,246,0.12);
          background: linear-gradient(165deg, rgba(15,20,40,0.7), rgba(8,12,30,0.8));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 40px rgba(139,92,246,0.06);
          overflow: hidden;
        }
        .why-quote-icon {
          position: absolute;
          top: 20px; right: 28px;
          font-size: 64px;
          line-height: 1;
          color: rgba(139,92,246,0.08);
          font-family: Georgia, serif;
          user-select: none;
        }
        .why-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .why-particle {
          position: absolute;
          width: 3px; height: 3px;
          background: rgba(139,92,246,0.3);
          border-radius: 50%;
          animation: particleFloat 6s ease-in-out infinite;
        }
        .why-particle:nth-child(1) { top: 20%; left: 10%; }
        .why-particle:nth-child(2) { top: 60%; left: 80%; }
        .why-particle:nth-child(3) { top: 30%; left: 70%; }
        .why-particle:nth-child(4) { top: 70%; left: 20%; }
        .why-particle:nth-child(5) { top: 80%; left: 50%; }
        .why-particle:nth-child(6) { top: 15%; left: 40%; }
        .why-heading {
          font-size: clamp(20px, 2.8vw, 28px);
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #FFFFFF;
          margin: 0 0 20px;
          position: relative;
          z-index: 1;
          font-family: 'Sora', system-ui, sans-serif;
        }
        .why-text {
          font-size: 15px;
          line-height: 1.8;
          color: #94A3B8;
          margin: 0 0 16px;
          position: relative;
          z-index: 1;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .why-text:last-child { margin-bottom: 0; }
        .why-em {
          color: rgba(196,181,253,0.6);
          font-style: italic;
          border-left: 2px solid rgba(139,92,246,0.2);
          padding-left: 16px;
          margin-top: 24px;
        }

        /* ── RESOURCE GRID ── */
        .resources-block {
          padding: 0;
        }
        .resource-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .resource-card {
          padding: 28px 24px;
          border-radius: 16px;
          border: 1px solid rgba(139,92,246,0.08);
          background: rgba(10,15,35,0.4);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          cursor: default;
          opacity: 0;
          animation: fadeIn 0.6s ease forwards;
        }
        .resource-card:hover {
          transform: translateY(-6px);
          border-color: rgba(139,92,246,0.35);
          box-shadow: 0 12px 40px rgba(139,92,246,0.1);
        }
        .rc-icon { font-size: 28px; display: block; margin-bottom: 12px; }
        .rc-title {
          font-size: 15px; font-weight: 700; color: #fff;
          margin: 0 0 6px;
          font-family: 'Sora', system-ui, sans-serif;
        }
        .rc-desc {
          font-size: 13px; line-height: 1.6;
          color: #64748B; margin: 0;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── ATTRIBUTION TIMELINE ── */
        .attr-block {
          padding: 0;
        }
        .attr-timeline {
          position: relative;
          padding-left: 36px;
        }
        .attr-line {
          position: absolute;
          left: 14px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: linear-gradient(180deg, rgba(139,92,246,0.3), rgba(59,130,246,0.1));
          border-radius: 4px;
        }
        .attr-node {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 28px;
          opacity: 0;
          animation: fadeIn 0.6s ease forwards;
        }
        .attr-node:last-child { margin-bottom: 0; }
        .attr-dot {
          position: absolute;
          left: -30px;
          top: 6px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: rgba(139,92,246,0.4);
          border: 2px solid rgba(139,92,246,0.15);
          box-shadow: 0 0 12px rgba(139,92,246,0.1);
        }
        .attr-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
        .attr-text strong {
          display: block;
          font-size: 15px;
          color: #E2E8F0;
          margin-bottom: 2px;
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .attr-text p {
          font-size: 13px;
          line-height: 1.6;
          color: #64748B;
          margin: 0;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── COPYRIGHT CARD ── */
        .copyright-card {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          padding: 32px 32px;
          border-radius: 16px;
          border: 1px solid rgba(139,92,246,0.15);
          border-left: 3px solid rgba(139,92,246,0.4);
          background: rgba(10,15,35,0.3);
        }
        .cp-icon {
          font-size: 24px;
          color: rgba(139,92,246,0.3);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .cp-text {
          font-size: 14px;
          line-height: 1.8;
          color: #94A3B8;
          margin: 0;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── FEEDBACK ── */
        .feedback-block {
          padding: 0;
        }
        .feedback-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .feedback-card {
          padding: 24px 22px;
          border-radius: 14px;
          border: 1px solid rgba(139,92,246,0.08);
          background: rgba(10,15,35,0.35);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          cursor: default;
        }
        .feedback-card:hover {
          transform: translateY(-4px);
          border-color: rgba(139,92,246,0.3);
          box-shadow: 0 8px 30px rgba(139,92,246,0.08);
        }
        .fb-icon { font-size: 22px; display: block; margin-bottom: 10px; }
        .fb-title {
          font-size: 14px; font-weight: 700; color: #E2E8F0;
          margin: 0 0 4px;
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .fb-desc {
          font-size: 13px; line-height: 1.5;
          color: #64748B; margin: 0;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── PERSONAL NOTE (Premium Founder Card) ── */
        .founder-card-premium {
          position: relative;
          border-radius: 20px;
          border: 1px solid rgba(139,92,246,0.12);
          background: linear-gradient(165deg, rgba(15,20,42,0.6), rgba(8,12,30,0.7));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(139,92,246,0.04);
        }
        .fc-spotlight {
          position: absolute;
          top: -100px; right: -80px;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .fc-premium-inner {
          display: flex;
          gap: 28px;
          padding: 36px 32px;
          align-items: flex-start;
        }
        .fc-premium-avatar {
          flex-shrink: 0;
          width: 72px; height: 72px;
          border-radius: 50%;
          padding: 2.5px;
          background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.1));
        }
        .fc-premium-avatar img {
          width: 100%; height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid rgba(139,92,246,0.08);
        }
        .fc-premium-body { flex: 1; }
        .fc-premium-name {
          font-size: 18px; font-weight: 800;
          color: #fff; margin: 0 0 8px;
          font-family: 'Sora', system-ui, sans-serif;
        }
        .fc-premium-tags {
          display: flex; flex-wrap: wrap;
          gap: 6px; margin-bottom: 16px;
        }
        .fc-premium-tags span {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px; font-weight: 600;
          color: rgba(196,181,253,0.7);
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.1);
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .fc-premium-text {
          font-size: 14px;
          line-height: 1.8;
          color: #94A3B8;
          margin: 0 0 12px;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .fc-premium-text:last-child { margin-bottom: 0; }

        /* ── ENDING SECTION ── */
        .ending-section {
          min-height: 60vh;
          display: flex; align-items: center; justify-content: center;
          padding: 80px 24px;
        }
        .ending-content {
          text-align: center;
          max-width: 550px;
        }
        .ending-line {
          font-size: clamp(22px, 3.5vw, 34px);
          font-weight: 300;
          color: #94A3B8;
          margin: 0 0 6px;
          opacity: 0;
          animation: fadeSlideIn 0.8s ease forwards;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .ending-tagline {
          font-size: 14px;
          font-weight: 700;
          color: rgba(139,92,246,0.5);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 32px 0 20px;
          opacity: 0;
          animation: fadeSlideIn 0.8s ease forwards;
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .ending-signature {
          font-size: 18px;
          font-weight: 400;
          color: #64748B;
          margin: 0;
          opacity: 0;
          animation: fadeSlideIn 0.8s ease forwards;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-style: italic;
        }

        /* ── Footer ── */
        .about-footer {
          position: relative; z-index: 10;
          border-top: 1px solid rgba(139,92,246,0.06);
          text-align: center; padding: 24px;
          font-size: 11px; color: #475569;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Keyframes ── */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 18px rgba(168,85,247,0.2)); }
          50% { filter: drop-shadow(0 0 30px rgba(168,85,247,0.35)) drop-shadow(0 0 60px rgba(96,165,250,0.1)); }
        }
        @keyframes underlineGrow {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes techFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes nameShine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes particleFloat {
          0%, 100% { opacity: 0.2; transform: translateY(0) scale(1); }
          50% { opacity: 0.6; transform: translateY(-20px) scale(1.3); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Section Spacing ── */
        .scroll-reveal { margin-bottom: 120px; }
        .scroll-reveal:last-of-type { margin-bottom: 0; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .hero-layout { flex-direction: column; gap: 40px; }
          .founder-card { width: 100%; max-width: 380px; }
          .resource-grid { grid-template-columns: 1fr; }
          .feedback-grid { grid-template-columns: 1fr; }
          .fc-premium-inner { flex-direction: column; align-items: center; text-align: center; }
          .fc-premium-tags { justify-content: center; }
        }
        @media (max-width: 640px) {
          .hc-stats { gap: 20px; }
          .st-item { min-width: 80px; }
          .st-num { font-size: 20px; }
          .hc-sub { max-width: 100%; }
          .mission-block { padding: 40px 24px 32px; }
          .why-card { padding: 32px 24px; }
          .resource-card { padding: 22px 18px; }
          .copyright-card { padding: 24px 20px; flex-direction: column; gap: 12px; }
          .fc-premium-inner { padding: 28px 20px; }
          .hero-section { padding: 32px 16px 36px; }
          .reading-progress { width: 2px; }
          .founder-card { width: 100%; max-width: 100%; }
          .fc-banner { height: 220px; }
          .fc-dp-wrap { width: 56px; height: 56px; padding: 2px; }
          .fc-banner-name { font-size: 24px; }
          .hc-heading { font-size: clamp(26px, 8vw, 34px); }
          .hero-layout { gap: 24px; }
          .about-nav { padding: 14px 16px; }
          .about-content { padding: 0 16px 60px; }
          .scroll-reveal { margin-bottom: 80px; }
          .ending-section { padding: 60px 16px; }
          .attr-timeline { padding-left: 28px; }
          .attr-dot { left: -23px; width: 8px; height: 8px; }
        }
      `}</style>
    </div>
  );
}

