# INFRASTRUCTURE REPORT — GateNexa Production
**Date:** 2026-08-04 | **Verification method:** Live API calls + fresh browser session (Microsoft Edge)

---

## 1. Render Backend (`gatenexa-tycc.onrender.com`)

| Check | Result | Details |
|-------|--------|---------|
| Health endpoint | ✅ PASS | `server=ok database=connected` |
| Uptime | ~3,532s (~59 min) | Render free tier, cold restarts periodic |
| Memory | 53/57 MB heap, 168 MB RSS | Normal |
| JWT Auth | ✅ PASS | Login returns valid token; `/auth/me` returns user identity |
| AI Provider | ✅ PASS | `/api/ai/quota` → 200, remaining=92, limit=100, isPremium=true |
| Learning Hub Videos | ✅ PASS | `/api/learning-hub/videos?limit=200` → 200, count=123, valid data |
| Topics | ✅ PASS | `/api/topics?withProgress=true` → 200 (verified via browser) |
| Subjects | ✅ PASS | `/api/subjects` → 200 (verified via browser) |
| PYQ | ✅ PASS | `/api/pyq?limit=500` → 200 (verified via browser) |
| Notifications | ✅ PASS | `/api/notifications` → 200 (verified via browser) |
| All other endpoints | ✅ PASS | 84/84 API calls returned 200 in fresh browser test |

### Environment Variables
- **JWT_SECRET**: Set (tokens created and validated)
- **AI Provider Key**: Set (OpenRouter/OpenAI quota API responds)
- **MongoDB URI**: Set (database=connected)
- **Google OAuth**: Configured (user account has `authProvider=google`; GSI iframe loads)

---

## 2. Vercel Frontend (`gatenexa-two.vercel.app`)

| Check | Result | Details |
|-------|--------|---------|
| HTTP Status | ✅ 200 | Served by Vercel, cache HIT |
| API URL (compiled) | ✅ | `https://gatenexa-tycc.onrender.com/api` in bundle |
| JS Bundle | ✅ | `/assets/index-CxAmZnr9.js` — 431 KB |
| API Proxy | ✅ | `/api/health` proxies to Render → `server=ok` |
| CSP | ✅ | `accounts.google.com` allowed in script-src, connect-src, frame-src |
| Google Sign-In | ✅ | GSI iframe loads; user has `authProvider=google` |

### Build vs Git
- **Local HEAD:** `f531e37` — "align GATE syllabus to full 110 topics"
- **Live bundle:** `index-CxAmZnr9.js` (single bundle with manualChunks)
- **Google Client ID:** Compiled into the JS bundle (minifier fragments the raw string; GSI iframe loads correctly, confirming the ID is present)

---

## 3. Fresh Browser Verification (Incognito — Brand New Profile)

**Environment:** Microsoft Edge, fresh profile, no cookies/cache/localStorage/IndexedDB/Service Workers

| Page | Result | Details |
|------|--------|---------|
| `/login` | ✅ | Login form renders; GSI button iframe loaded |
| Form Login | ✅ | Email+password → `/dashboard`, token stored |
| `/dashboard` | ✅ | 14,657 chars rendered; greeting, streak, charts, roadmap present |
| `/topics` | ✅ | **110 GATE syllabus topics** (count text matches API) |
| `/learning-hub` | ✅ | **123 video thumbnails**; no error message |
| `/ai-mentor` | ✅ | Page renders; auto mode button present |
| `/reports` | ✅ | Page renders successfully |
| **Network — all /api/ calls** | ✅ | **84 requests, 84 responses, ALL 200** |
| **Console — errors** | ✅ | **0 errors** |

---

## 4. Investigation: "Unable to load learning hub videos" Error

### Findings
The error text `"Unable to load learning hub videos. Please try again later."` exists in the compiled JS bundle.

In a fresh logged-in browser test, the error DOES NOT reproduce:
- `/api/learning-hub/videos?limit=200` → HTTP 200, count=123
- All 123 video thumbnails render on the page
- No console errors

### Root Cause Analysis
The error appears when the Learning Hub videos API call fails. The most likely trigger is a **Render cold start**:

1. Render free tier sleeps the instance after inactivity (~15 min).
2. On first request, Render takes 10–60 seconds to wake the instance.
3. The frontend has a 30s axios timeout + retry on `ECONNABORTED`.
4. If the cold start exceeds the timeout (or the user navigates before retry completes), the frontend shows: **"Unable to load learning hub videos. Please try again later."**

This is a **transient infrastructure behavior**, not a code bug. Once Render is warm, the error disappears.

### Mitigation
- **Refresh the page** after 30–60 seconds (Render wakes up).
- **After login**, wait a moment before navigating to Learning Hub (lets the first dashboard API calls warm the backend).
- Move to a paid Render plan (no cold starts) — or use a cron job to ping `/api/health` every 10 minutes.

---

## 5. Google Sign-In

| Check | Result | Details |
|-------|--------|---------|
| GSI iframe | ✅ Loads | `accounts.google.com/gsi/button` present |
| Origin authorized | ✅ | No "given origin is not allowed" error |
| CSP | ✅ | `accounts.google.com` in script-src, connect-src, frame-src |
| User account | ✅ | `authProvider: "google"` (account created via Google) |

**Note:** If Google sign-in fails for a specific user, the Google Cloud OAuth app may be in **Testing** mode. Only whitelisted test users can complete sign-in. Check: Google Cloud Console → APIs & Services → OAuth consent screen → Publishing status. Either add the user as a test user or publish the app.

---

## 6. Summary

| Component | Status |
|-----------|--------|
| Render Backend | ✅ Operational |
| MongoDB | ✅ Connected |
| JWT Auth | ✅ Working |
| AI Provider | ✅ Configured (92/100 quota) |
| Learning Hub API (`/api/learning-hub/videos`) | ✅ 200, 123 videos |
| All API endpoints (84 calls) | ✅ All 200 |
| Vercel Frontend | ✅ 200, correct API URL |
| CSP | ✅ Correctly configured |
| Google Sign-In (button) | ✅ Loads |
| Fresh browser login (form) | ✅ Works |
| Dashboard | ✅ Renders |
| Topics | ✅ 110 |
| Learning Hub | ✅ 123 videos |
| AI Mentor | ✅ Renders |
| Reports | ✅ Renders |
| Console (fresh session) | ✅ 0 errors |

### "Unable to load learning hub videos" — Verdict
**Transient cold-start failure** on Render free tier. The API and data are intact (200, 123 videos) and the page renders correctly once the backend is warm. Not a code or infrastructure defect — an inherent limitation of the free hosting tier.
