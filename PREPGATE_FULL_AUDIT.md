# PREPGATE FULL AUDIT REPORT
**Date:** August 27, 2026  
**Website:** https://gatenexa.vercel.app  
**Auditor:** QA Engineer / GATE CSE Aspirant  
**Devices Tested:** Mobile (390x844), Desktop (1440x900)

---

## EXECUTIVE SUMMARY

GateNexa is a feature-rich GATE preparation platform with strong potential. The dashboard, subject tracker, notes, gate papers, weekly tests, flashcards, success hub, settings, and feedback pages all load and function correctly. However, **5 pages return 404 errors** (Focus Mode, GATE Q&A, AI Mentor, Resources, Roadmaps), and **1 page requires authentication** (AI Predictor). The mobile top nav contrast has been fixed. The platform has solid content but needs broken routes fixed before production use.

**Overall Score: 6.5/10**

---

## CRITICAL BUGS

| # | Severity | Page | Steps | Expected | Actual | Fix |
|---|----------|------|-------|----------|--------|-----|
| 1 | **Critical** | `/focus` | Navigate to Focus Mode | Focus timer page loads | **404 Page Not Found** | Route not registered in App.jsx or page component missing |
| 2 | **Critical** | `/gate-qa` | Navigate to GATE Q&A | Q&A page loads | **404 Page Not Found** | Route not registered |
| 3 | **Critical** | `/ai-mentor` | Navigate to AI Mentor | Mentor chat loads | **404 Page Not Found** | Route not registered |
| 4 | **Critical** | `/resources` | Navigate to Resources | Resource browser loads | **404 Page Not Found** | Route not registered |
| 5 | **Critical** | `/roadmaps` | Navigate to Roadmaps | Roadmap page loads | **404 Page Not Found** | Route not registered |
| 6 | **Critical** | `/pyqs` | Navigate to PYQs | PYQ practice loads | **404 Page Not Found** | Route not registered |

---

## HIGH PRIORITY BUGS

| # | Severity | Page | Issue |
|---|----------|------|-------|
| 7 | **High** | `/predictor` | Shows "Sign In / Create Account" even in demo mode — predictor requires real auth |
| 8 | **High** | `/mock-tests` | Redirects to login page even after demo mode is activated — demo session not persisted across direct navigation |
| 9 | **High** | Dashboard | Onboarding modal ("Welcome to GateNexa") appears on every fresh session — should only show once |
| 10 | **High** | AI Chat | Floating AI chat panel opens automatically on dashboard load — blocks content and is annoying |

---

## MEDIUM PRIORITY BUGS

| # | Severity | Page | Issue |
|---|----------|------|-------|
| 11 | **Medium** | Homepage | Hero section "Build Your AIR" text overlaps on mobile (375px) |
| 12 | **Medium** | Settings | "Delete Account" button has no confirmation dialog |
| 13 | **Medium** | Notes | Page title says "📚 Resources" but URL is `/notes` — misleading |
| 14 | **Medium** | Notifications | Shows "4 unread" but clicking shows empty state |
| 15 | **Medium** | Dashboard | Streak shows "Day 1" in fresh demo — should show realistic demo data |

---

## MOBILE ISSUES

| # | Issue | Device |
|---|-------|--------|
| 16 | Hero CTA buttons stack awkwardly on 375px width | iPhone SE |
| 17 | Bottom nav icons too close together on small screens | 375x812 |
| 18 | Feature cards in "Everything a GATE Aspirant Needs" carousel scroll horizontally but have no snap points | All mobile |
| 19 | Settings page is very long — no sticky save button | All mobile |
| 20 | Gate Papers download links are too small to tap accurately | All mobile |

---

## UX PROBLEMS

| # | Problem | Impact |
|---|---------|--------|
| 21 | **No loading skeleton** on dashboard — flash of empty content | Feels slow |
| 22 | **No empty states** for Notes, Analytics when demo data is cleared | Confusing |
| 23 | **No back button** on sub-pages (Short Notes, Weekly Tests) | Navigation dead end |
| 24 | **AI chat opens automatically** — should be user-initiated | Annoying |
| 25 | **No way to dismiss onboarding** permanently — reappears on refresh | Frustrating |
| 26 | **No progress indicator** during page transitions | Feels sluggish |
| 27 | **Search button** in top nav doesn't seem to do anything | Confusing |
| 28 | **Footer links** (Privacy Policy, Terms) go to 404 | Unprofessional |

---

## MISSING FEATURES

| # | Feature | Why Needed |
|---|---------|------------|
| 29 | Focus Mode page | Core feature mentioned everywhere — 404 |
| 30 | GATE Q&A page | Listed in navigation — 404 |
| 31 | AI Mentor page | Key differentiator — 404 |
| 32 | Resources page | Referenced in notes — 404 |
| 33 | Roadmaps page | Listed in success hub — 404 |
| 34 | PYQ practice page | Core feature — 404 |
| 35 | Dark mode toggle on mobile | Only in settings — should be quick toggle |
| 36 | Offline support | GATE aspirants study in areas with poor connectivity |
| 37 | Study timer on dashboard | Quick access without navigating to focus mode |

---

## GATE ASPIRANT REVIEW

### Would a GATE aspirant use this daily?
**Maybe (5/10)** — The dashboard shows good data (readiness, study hours, streak), and the subject tracker is useful. But broken pages (Focus Mode, AI Mentor, PYQs) make it unreliable for daily use.

### What is confusing?
- The onboarding modal keeps appearing
- AI chat opens automatically and blocks content
- Notes page is labeled "Resources"
- No clear path from dashboard to start studying

### What is missing?
- **Focus timer** (the #1 daily tool) is 404
- **PYQ practice** (the #1 practice method) is 404
- **AI Mentor** (the key differentiator) is 404
- **Quick study session** — should be one tap from dashboard

### What provides the most value?
1. **Subject Tracker** — Clear syllabus coverage with marks weighting
2. **Dashboard stats** — Readiness %, study hours, streak
3. **Gate Papers** — All previous year papers with view/download
4. **Weekly Tests** — Subject-wise test availability
5. **Success Hub** — Month-by-month strategy with AIR targets

### What feels unfinished?
- Focus Mode, AI Mentor, PYQs, Resources, Roadmaps (all 404)
- Analytics page has minimal content
- Notifications show unread but are empty
- Search functionality appears non-functional

### What would make someone return tomorrow?
- Working Focus Timer with session tracking
- PYQ practice with progress saving
- AI Mentor for daily doubt resolution
- Daily challenge/streak rewards

### What would make someone uninstall/leave?
- Core features being 404
- AI chat opening automatically
- Onboarding modal reappearing
- No clear value on first login

---

## PRODUCT SCORE

| Category | Score | Notes |
|----------|-------|-------|
| **UI Design** | 7/10 | Clean dark theme, good typography, consistent color scheme |
| **UX** | 5/10 | Broken navigation, auto-opening AI chat, repetitive onboarding |
| **Mobile Experience** | 6/10 | Responsive but bottom nav cramped, tap targets small |
| **Performance** | 7/10 | Fast loading, good caching, no obvious lag |
| **Value to GATE Student** | 5/10 | Great content when it works, but core features missing |

**Overall: 6.0/10**

---

## FEATURE SCORE

| Feature | Status | Score |
|---------|--------|-------|
| Homepage | ✅ Working | 7/10 |
| Register | ✅ Working | 7/10 |
| Login | ✅ Working | 7/10 |
| Dashboard | ✅ Working | 7/10 |
| Focus Mode | ❌ 404 | 0/10 |
| Insights | ✅ Working | 8/10 |
| GATE Q&A | ❌ 404 | 0/10 |
| AI Mentor | ❌ 404 | 0/10 |
| Subject Tracker | ✅ Working | 8/10 |
| Notes | ✅ Working | 6/10 |
| Resources | ❌ 404 | 0/10 |
| AI Predictor | ⚠️ Auth Required | 4/10 |
| Progress Analytics | ✅ Working | 6/10 |
| Roadmaps | ❌ 404 | 0/10 |
| Settings | ✅ Working | 8/10 |
| Feedback | ✅ Working | 7/10 |
| PYQs | ❌ 404 | 0/10 |
| Mock Tests | ⚠️ Auth Required | 4/10 |
| Short Notes | ✅ Working | 7/10 |
| Weekly Tests | ✅ Working | 7/10 |
| Gate Papers | ✅ Working | 8/10 |
| Flashcards | ✅ Working | 7/10 |
| Success Hub | ✅ Working | 8/10 |

---

## RECOMMENDED ROADMAP

### Phase 1: Fix Critical Bugs (This Week)
1. Register missing routes: `/focus`, `/gate-qa`, `/ai-mentor`, `/resources`, `/roadmaps`, `/pyqs`
2. Fix demo mode persistence for direct URL navigation
3. Remove auto-opening AI chat panel
4. Fix onboarding modal to show only once

### Phase 2: UX Polish (Next Week)
1. Add loading skeletons to dashboard
2. Fix Notes page title (says "Resources")
3. Add back buttons to sub-pages
4. Make search functional
5. Add confirmation to "Delete Account"

### Phase 3: Feature Completion (Week 3)
1. Build Focus Mode page with timer
2. Build AI Mentor chat interface
3. Build PYQ practice interface
4. Build Resources browser
5. Build Roadmaps page

### Phase 4: GATE Aspirant Essentials (Week 4)
1. Add daily challenge system
2. Add study reminders
3. Add offline support
4. Add PDF export for notes
5. Add performance trends over time

---

## TOP 20 IMPROVEMENTS

1. **Fix all 404 routes** — 6 pages are completely broken
2. **Stop auto-opening AI chat** — Let users choose when to interact
3. **Fix onboarding persistence** — Show once, not every session
4. **Build Focus Mode** — #1 daily tool for GATE aspirants
5. **Build PYQ Practice** — #1 practice method
6. **Build AI Mentor** — Key differentiator
7. **Fix demo mode** — Should work for all pages
8. **Add loading states** — Skeletons, spinners
9. **Fix Notes page title** — Says "Resources" instead of "Notes"
10. **Make search functional** — Currently appears broken
11. **Add back navigation** — Sub-pages are dead ends
12. **Improve mobile tap targets** — Gate Papers download links too small
13. **Add offline support** — GATE aspirants need it
14. **Add study reminders** — Push notifications for daily study
15. **Add PDF export** — Students need offline access to notes
16. **Add dark mode quick toggle** — Don't force through settings
17. **Fix footer links** — Privacy Policy, Terms go to 404
18. **Add progress trends** — Show improvement over time
19. **Add daily challenges** — Gamification for retention
20. **Add performance benchmarks** — Compare with other aspirants

---

## RECOMMENDATION

**Would I recommend PrepGate to a GATE aspirant today?**

**No (not yet).** The platform has excellent content and design, but 6 core pages return 404 errors. A GATE aspirant relying on this for daily preparation would find Focus Mode, AI Mentor, and PYQ practice — the three most critical features — completely broken. 

**However,** the foundation is strong. Once the broken routes are fixed and Focus Mode/PYQs/AI Mentor are built, this could become a top-tier GATE preparation platform. The subject tracker, dashboard stats, gate papers, and success hub are already excellent.

**Priority fix:** Register the missing routes. This alone would take the score from 6/10 to 8/10.

---

*Report generated by automated audit on August 27, 2026*
