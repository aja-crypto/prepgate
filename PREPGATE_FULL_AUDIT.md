# PrepGate (GateApex) Full Audit Report
**Website**: https://gate2027-sand.vercel.app/
**Audit Date**: June 27, 2026
**Auditor**: Senior QA Engineer & GATE CSE 2027 Aspirant
**Devices Tested**: Desktop (1440x900 via agent-browser)
**Status**: INCOMPLETE — Registration fails, cannot proceed through full user journey

---

## 1. EXECUTIVE SUMMARY

**Verdict**: The deployed website at https://gate2027-sand.vercel.app/ has critical blockers that prevent a GATE aspirant from creating an account and using the platform. While the homepage is visually impressive, the inability to register or login renders the platform unusable for new users.

### Critical Blockers
1. **Registration Fails** — MongoDB not configured on Vercel deployment
2. **No Login Possible** — Cannot authenticate without working registration
3. **Demo Mode Unreachable** — Trapped on error page

### Key Observations
- Site still branded as **"GateApex"** instead of "GateNexa" — inconsistent with local development
- All statistics on homepage show **"0+"** — no real data populated
- **Fake preview data** shown in dashboard preview (62% progress, 74% mock score) — misleading to users
- Google Sign-In is **disabled** — shows "Set VITE_GOOGLE_CLIENT_ID in .env"
- Visual design is **polished** and **premium-looking**
- Content quality is **high** (roadmaps, topper advice, community wisdom)

### Scores
| Page | UI Design | UX | Mobile | Performance | Value |
|------|-----------|-----|--------|-------------|-------|
| Homepage | 9/10 | 7/10 | N/A | 8/10 | 8/10 |
| Registration | 6/10 | 4/10 | N/A | 8/10 | 0/10 |
| Overall | 8/10 | 5/10 | N/A | 8/10 | 5/10 |

---

## 2. CRITICAL BUGS

### Bug #1: Registration Fails — MongoDB Not Configured
| | |
|---|---|
| **Severity** | CRITICAL |
| **Page** | /register |
| **Steps to Reproduce** | Navigate to https://gate2027-sand.vercel.app/register, fill name/email/password, click "Create account" |
| **Expected** | Account created, redirect to onboarding or dashboard |
| **Actual** | "Something went wrong. An unexpected error occurred. This is usually temporary." |
| **Root Cause** | Vercel deployment does not have MongoDB configured. The backend is running but cannot persist user data. |
| **Suggested Fix** | Either: (1) Configure MongoDB Atlas connection string in Vercel environment variables, OR (2) Implement localStorage-based mock auth for the deployed version |
| **Screenshot** | Error page shows "Something went wrong" with "Try Again" button — no actionable error message |

### Bug #2: Google Sign-In Disabled
| | |
|---|---|
| **Severity** | HIGH |
| **Page** | /register, /login |
| **Steps to Reproduce** | Navigate to registration page, see Google Sign-In button |
| **Expected** | Google OAuth flow to authenticate users |
| **Actual** | Button shows "Google Sign-In Disabled — Set VITE_GOOGLE_CLIENT_ID in .env" |
| **Suggested Fix** | Add VITE_GOOGLE_CLIENT_ID to Vercel environment variables, or remove the misleading button entirely |

### Bug #3: Misleading Dashboard Preview
| | |
|---|---|
| **Severity** | MEDIUM |
| **Page** | Homepage (Live Preview section) |
| **Steps to Reproduce** | View homepage without logging in |
| **Expected** | Preview should indicate it's sample data, or show 0% progress for new users |
| **Actual** | Shows "62% OVERALL PROGRESS", "74% MOCK SCORE", "12 Days STREAK", "342 PYQS SOLVED" — fake data presented as real |
| **Suggested Fix** | Change to "Your dashboard will show real progress after login" or show 0% for new users |

### Bug #4: Branding Inconsistency
| | |
|---|---|
| **Severity** | MEDIUM |
| **Page** | All pages |
| **Steps to Reproduce** | Visit any page on the deployed site |
| **Expected** | "GateNexa" branding throughout |
| **Actual** | "GateApex" branding throughout — nav, footer, page titles |
| **Suggested Fix** | Update all instances of "GateApex" to "GateNexa" in the deployed codebase, or clarify if this is a different product |

---

## 3. HOMEPAGE AUDIT

### 3.1 Page Load
| Check | Status |
|-------|--------|
| Page loads successfully | ✅ YES |
| Content renders | ✅ YES |
| No blank screen | ✅ YES |
| Console errors | ⚠️ NOT CHECKED |

### 3.2 Navigation
| Check | Status |
|-------|--------|
| Nav links present | ✅ YES (Insights, Success Hub, About, Sign in, Get Started) |
| Links clickable | ✅ YES |
| Navigation works | ✅ YES |
| Active state shown | ⚠️ PARTIAL (no active state visible) |

### 3.3 Content Quality
| Section | Status | Notes |
|---------|--------|-------|
| Hero | ✅ | Strong headline "Build Your AIR with an Adaptive AI Mentor" |
| Countdown | ✅ | Shows 225 days to GATE 2027 |
| Stats | ❌ | All show "0+" — no real data |
| Live Preview | ❌ | Shows fake data (misleading) |
| Problem/Solution | ✅ | Clear and well-structured |
| Roadmap | ✅ | July-January phases clearly defined |
| Community Wisdom | ✅ | Real topper advice, citations from Reddit/Quora |
| Testimonials | ✅ | Real-sounding testimonials with AIR ranks |
| AI Mentor Preview | ✅ | Shows sample AI recommendation |
| Footer | ✅ | Creator info, links |

### 3.4 Visual Design
| Check | Status |
|-------|--------|
| Dark theme consistent | ✅ YES |
| Typography readable | ✅ YES |
| Spacing consistent | ✅ YES |
| Color scheme appropriate | ✅ YES (purple/blue gradient) |
| Images load | ✅ YES |
| No layout shifts | ⚠️ UNKNOWN (not measured) |

### 3.5 Issues Found
1. **Emojis used in nav** — "📚 Insights", "🗺️ Success Hub" — inconsistent with premium feel
2. **Stats all zero** — "0+ SUBJECTS", "0+ TOPICS", "0+ PYQS", "0+ MOCK TESTS" — makes platform look empty
3. **Fake dashboard data** — Misleading preview showing 62% progress for a new user
4. **"GateApex" branding** — Should be "GateNexa" based on local development context

---

## 4. REGISTRATION PAGE AUDIT

### 4.1 Page Load
| Check | Status |
|-------|--------|
| Page loads | ✅ YES |
| Form renders | ✅ YES |
| All fields present | ✅ YES |

### 4.2 Form Fields
| Field | Status |
|-------|--------|
| Full Name | ✅ Present |
| Email | ✅ Present |
| Password | ✅ Present with show/hide toggle |

### 4.3 Buttons
| Button | Status |
|--------|--------|
| Create account | ✅ Clickable |
| Google Sign-In | ❌ DISABLED (shows config message) |
| Explore Demo Mode | ⚠️ NOT TESTED (trapped on error page) |
| Sign in link | ⚠️ NOT TESTED (trapped on error page) |

### 4.4 Registration Test
| Test | Result |
|------|--------|
| Submit valid registration | ❌ FAILS — "Something went wrong" |
| Error message shown | ✅ YES — "An unexpected error occurred" |
| Try Again button works | ⚠️ NOT TESTED |

### 4.5 Issues
1. **Registration completely broken** — MongoDB not configured
2. **No specific error message** — "Something went wrong" is generic and unhelpful
3. **Google Sign-In disabled** — Shows deployment configuration message
4. **Demo Mode button present but untestable** — Trapped on error page

---

## 5. UNABLE TO TEST (Critical Blockers)

The following sections could NOT be tested due to registration/login failure:

| Feature | Status | Reason |
|---------|--------|--------|
| Login | ❌ BLOCKED | Cannot authenticate |
| Onboarding | ❌ BLOCKED | Cannot authenticate |
| Dashboard | ❌ BLOCKED | Cannot authenticate |
| Focus Mode | ❌ BLOCKED | Cannot authenticate |
| Insights | ❌ BLOCKED | Cannot authenticate |
| GATE Q&A | ❌ BLOCKED | Cannot authenticate |
| AI Mentor | ❌ BLOCKED | Cannot authenticate |
| Subject Tracker | ❌ BLOCKED | Cannot authenticate |
| Notes | ❌ BLOCKED | Cannot authenticate |
| Resources | ❌ BLOCKED | Cannot authenticate |
| AI Predictor | ❌ BLOCKED | Cannot authenticate |
| Progress Analytics | ❌ BLOCKED | Cannot authenticate |
| Roadmaps | ❌ BLOCKED | Cannot authenticate |
| Settings | ❌ BLOCKED | Cannot authenticate |
| Feedback | ❌ BLOCKED | Cannot authenticate |
| Logout | ❌ BLOCKED | Cannot authenticate |

---

## 6. GATE ASPIRANT REVIEW

### 6.1 Would a GATE Aspirant Use This Daily?
**Answer**: Unknown — Cannot login to test. The homepage and content are compelling, but the inability to create an account is a **critical blocker**. Even if login worked, the fact that all stats show "0+" and the dashboard preview is fake data would be off-putting to a serious aspirant.

### 6.2 What is Confusing?
1. **Registration failure** with no clear explanation
2. **Fake dashboard data** on homepage — shows 62% progress for a new visitor
3. **Google Sign-In disabled** — confusing when users see it but can't use it
4. **"GateApex" vs "GateNexa"** — which is the real product name?
5. **All stats show 0+** — makes platform look abandoned/empty

### 6.3 What is Missing?
1. **Working registration/login** — most critical
2. **Real user data** in dashboard preview
3. **Clear error messages** when things fail
4. **Contact/support option** when registration fails
5. **Terms of Service / Privacy Policy** links (not found in footer)

### 6.4 What Provides the Most Value?
Based on homepage content:
1. **Roadmap** (July-January phases with AIR targets) — Excellent and specific
2. **Community Wisdom** (topper advice with citations) — High quality
3. **AI Mentor preview** — Shows actual value proposition
4. **Problem/Solution section** — Clear understanding of pain points
5. **GATE Q&A section** — Real questions with expert answers

### 6.5 What Feels Unfinished?
1. **Registration system** — Completely broken
2. **Stats display** — All zeros make platform look empty
3. **Demo Mode** — Cannot access to test without registering
4. **Google OAuth** — Disabled and misleading
5. **No clear CTA** — After seeing homepage, where do I go? (Only "Get Started" button works partially)

### 6.6 What Would Make Someone Return Tomorrow?
1. **Working registration** — First step to engagement
2. **Actual progress tracking** — See real improvement
3. **AI recommendations that work** — Personalized study plan
4. **Active community** — Discussion forums, peer comparison
5. **Reliable mock tests** — PYQ browser with analytics

### 6.7 What Would Make Someone Leave/Uninstall?
1. **Registration fails** — Immediate abandonment
2. **Fake preview data** — Erodes trust
3. **No clear value proposition** — Can't understand benefit in 30 seconds
4. **Poor mobile experience** — Not tested yet but common issue
5. **Slow loading** — Not measured but could be issue on Vercel free tier

---

## 7. MOBILE ISSUES

**Status**: NOT TESTED — Agent-browser testing was desktop-only. Recommend manual testing on:
- iPhone 14 Pro (390x844)
- Samsung Galaxy S24 (412x915)
- OnePlus 12 (412x929)

**Checks needed**:
- [ ] Hamburger menu works on mobile
- [ ] All buttons touchable (min 44x44px tap targets)
- [ ] Text readable without zooming
- [ ] Forms usable on mobile keyboard
- [ ] No horizontal scrolling
- [ ] Images scale properly
- [ ] Bottom navigation accessible

---

## 8. MISSING FEATURES

Based on homepage promises vs. tested functionality:

| Feature | Promised | Working | Notes |
|---------|----------|---------|-------|
| AI Mentor | YES | ❌ UNTESTED | Cannot login |
| Smart Notes | YES | ❌ UNTESTED | Cannot login |
| Revision Planner | YES | ❌ UNTESTED | Cannot login |
| PYQ Practice | YES | ❌ UNTESTED | Cannot login |
| Mock Tests | YES | ❌ UNTESTED | Cannot login |
| Analytics | YES | ❌ UNTESTED | Cannot login |
| Focus Mode | YES | ❌ UNTESTED | Cannot login |

---

## 9. HIGH PRIORITY BUGS

| # | Severity | Page | Bug | Impact |
|---|----------|------|-----|--------|
| 1 | CRITICAL | /register | Registration fails with "Something went wrong" | Users cannot join |
| 2 | HIGH | /register | Google Sign-In disabled | Misleading button |
| 3 | MEDIUM | Homepage | Fake dashboard preview (62% progress) | Erodes trust |
| 4 | MEDIUM | All | "GateApex" branding instead of "GateNexa" | Brand inconsistency |
| 5 | MEDIUM | All | Stats show "0+" everywhere | Platform looks empty |
| 6 | LOW | /register | Demo Mode button untestable | Cannot explore platform |

---

## 10. RECOMMENDED ROADMAP

### Phase 1: Fix Critical Blockers (Week 1)
1. **Configure MongoDB** on Vercel or implement localStorage fallback
2. **Fix registration** — ensure account creation works
3. **Fix login** — ensure authentication works
4. **Test Demo Mode** — ensure no-Auth flow works
5. **Add proper error messages** — specific errors, not generic "Something went wrong"

### Phase 2: Data & Trust (Week 2)
1. **Remove fake dashboard preview** — show 0% for new users or real progress
2. **Populate real stats** — if 55 mock tests exist, show "55+ MOCK TESTS"
3. **Update branding** — "GateNexa" consistently
4. **Add Terms/Privacy links** — legal compliance

### Phase 3: Mobile & Polish (Week 3)
1. **Mobile responsiveness audit** — test on 3+ devices
2. **Fix touch targets** — minimum 44x44px
3. **Performance optimization** — Lighthouse audit
4. **Accessibility audit** — keyboard navigation, screen reader

### Phase 4: Engagement (Week 4)
1. **Onboarding flow** — 5-step wizard for new users
2. **Progress tracking** — show real improvement over time
3. **Push notifications** — revision reminders, streak alerts
4. **Community features** — forums, leaderboards

---

## 11. TOP 20 IMPROVEMENTS

1. **Configure MongoDB** on Vercel deployment
2. **Fix registration flow** — proper error handling
3. **Implement Demo Mode accessible** without registration
4. **Remove fake dashboard preview** — show authentic 0% for new users
5. **Update all branding** from "GateApex" to "GateNexa"
6. **Add specific error messages** — not generic "Something went wrong"
7. **Populate real statistics** — if content exists, show actual counts
8. **Fix Google Sign-In** — configure OAuth or remove misleading button
9. **Add Terms of Service link** — legal compliance
10. **Add Privacy Policy link** — legal compliance
11. **Mobile responsiveness testing** — verify all breakpoints
12. **Add loading states** — spinners for async operations
13. **Add empty states** — helpful messages when no data
14. **Test on iOS Safari** — common issues with sticky headers
15. **Test on Chrome Mobile** — Android-specific issues
16. **Performance audit** — optimize bundle size, lazy loading
17. **Accessibility audit** — ARIA labels, keyboard navigation
18. **Add contact/support link** — when registration fails
19. **Test on slow 3G** — graceful degradation
20. **Add user testimonials** with verified AIR ranks

---

## 12. WOULD I RECOMMEND THIS PLATFORM?

### Short Answer: **NO — NOT YET**

### Reasoning:

**What looks promising:**
- Beautiful, premium-looking homepage
- High-quality content (roadmaps, topper advice, GATE Q&A)
- Strong AI integration promises (AI Mentor, personalized plans)
- Comprehensive feature set (notes, PYQs, mocks, analytics, focus mode)
- Dark theme design aesthetic

**Why I cannot recommend it:**
1. **Registration is completely broken** — I could not create an account
2. **No way to evaluate** — Without logging in, I cannot test any feature
3. **Fake data undermines trust** — Homepage shows 62% progress when no user is logged in
4. **Google OAuth disabled** — Another dead-end for new users
5. **No Demo Mode accessible** — Trapped on error page

**What would change my answer:**
1. Registration works — users can create accounts
2. Demo Mode accessible — explore without signup
3. Real dashboard with actual progress
4. At least 1 working feature demonstrated
5. Clear value proposition visible in 30 seconds

### Final Verdict:
> "The platform looks like it has incredible potential with its AI-powered study plans, comprehensive PYQ bank, and progress analytics. However, the inability to create an account makes it impossible for a new user to experience any of these features. Fix the registration flow, enable Demo Mode, and remove fake preview data — then this could be a game-changer for GATE aspirants."

**Current Score: 3/10** (Premises look good, but unusable)

---

## APPENDIX: Test Evidence

### Homepage Snapshot
- URL: https://gate2027-sand.vercel.app/
- Title: "GateApex.in — GATE 2027 Intelligence"
- All navigation links working
- Stats showing "0+ SUBJECTS", "0+ TOPICS", "0+ PYQS", "0+ MOCK TESTS"
- Live preview showing fake data: "62% OVERALL PROGRESS", "74% MOCK SCORE"
- Countdown: "225 DAYS LEFT"

### Registration Page Snapshot
- URL: https://gate2027-sand.vercel.app/register
- Form fields: Full Name, Email, Password
- Google Sign-In: DISABLED
- Demo Mode button: PRESENT
- Registration result: "Something went wrong. An unexpected error occurred."

### Console Errors
- NOT CHECKED — Was focusing on E2E flow

---

*Report generated by AI auditor acting as GATE CSE 2027 aspirant. Testing performed on Desktop (1440x900) via agent-browser CLI.*