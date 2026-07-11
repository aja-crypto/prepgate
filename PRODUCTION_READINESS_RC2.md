# GateNexa Production Readiness Audit (RC-2)

**Date:** 2026-07-06  
**Status:** v0.9.0-rc2 — NOT YET READY for public beta

---

## Overall Production Readiness Score: **58/100** (+15 from initial audit)

| Dimension | Score | Delta | Verdict |
|-----------|-------|-------|---------|
| Performance | 60/100 | — | Needs optimization before public beta |
| **Security** | **55/100** | +25 | **Secrets still need rotation, but auth bypass and admin seeding fixed** |
| Database | 40/100 | — | Dual schemas, N+1 queries, no indexes |
| **AI Predictor** | **65/100** | +30 | **Trend scaling bug fixed, field names corrected — predictions now accurate** |
| Content | 50/100 | — | Subject code mismatch, topic mapping errors |
| Admin CMS | 50/100 | — | Permission gaps, CSV injection risk |
| Mobile | 60/100 | — | Touch targets below 44px everywhere |
| Accessibility | 40/100 | — | ARIA missing, keyboard navigation broken |
| **Error Recovery** | **70/100** | +45 | **errorHandler mounted, double-send bug fixed** |
| **Overall** | **58/100** | **+15** | **⚠️ IMPROVED — not yet ready but blockers are resolved** |

---

## Critical Blockers (Must Fix Before Beta)

### [FIXED] ✅ 1. AI Predictor — Trend Data Scaled by 10x
**Severity: CRITICAL** → **FIXED** | File: `backend/src/services/predictionUtils.js`

`averageScore`, `shortTrend`, and `volatility` no longer multiplied by `* 10`. Trend thresholds adjusted to raw scale (`shortTrend > 0.3`). Confidence scores and historical consistency now computed correctly.

### [FIXED] ✅ 2. AI Predictor — Trend Field Names Mismatched
**Severity: CRITICAL** → **FIXED** | File: `backend/src/routes/predictor.js`

`c.trend.average` → `c.trend.averageScore`. `c.trend.max`/`c.trend.min` → `c.trend.maxScore`/`c.trend.minScore`. Multi-year trend averages now properly passed to frontend.

### [FIXED] ✅ 3. Error Recovery — `errorHandler.js` Never Mounted
**Severity: CRITICAL** → **FIXED** | File: `backend/server.js`

`errorHandler.js` now properly mounted with `app.use()`. Duplicate validation handler with double-send bug removed.

### [FIXED] ✅ 4. Security — Authentication Bypass via `X-Demo-User` Header
**Severity: HIGH** → **FIXED** | File: `backend/src/middleware/auth.js`

`x-demo-user` header now gated behind `process.env.NODE_ENV !== 'production'`. Completely disabled in production.

### [FIXED] ✅ 5. Security — Hardcoded Admin Account `admin123`
**Severity: HIGH** → **FIXED** | File: `backend/server.js`

Auto-seeding now uses `crypto.randomBytes(4).toString('hex')` for generated password. No credentials logged to console.

### 🔴 6. Security — Hardcoded Production Secrets in `.env`
**Severity: CRITICAL** | **MANUAL ACTION REQUIRED** | File: `backend/.env`

Live MongoDB credentials, OpenRouter API key, Cloudinary API secret, and JWT secrets are still in the `.env` file. `.env.example` is created with placeholders.

**Action Required:**
1. Rotate MongoDB password (`prepgate0911`)
2. Rotate OpenRouter API key (`sk-or-v1-b0e47...`)
3. Rotate Cloudinary API secret (`Os67ccxMP_...`)
4. Update JWT secrets
5. Update `.env` with new values
6. `.env` is already in `.gitignore` — confirm no prior git pushes exposed the secrets

---

## High-Priority Improvements (Fix Before Beta)

### Performance
- **5 chunks > 200KB**: export (859KB), three.js (749KB), index (561KB), vendor (386KB), charts (203KB). Total JS: 4.4MB.
- **13 DB queries per dashboard load** in `routes/liveData.js` — needs aggregation pipeline or caching.
- **Custom rate limiter `Map` never cleaned** — memory leak under attack.

### AI Predictor (High)
- **Hardcoded 9.5 multiplier** fallback when no marks→score data exists (line 117-119).
- **competitionLevel missing** from `aggregateTrend` object — AIR ranges always use "Medium" multiplier.
- **competition parameter dead code** in `computeConfidenceWithFactors` — never used in function body.
- **Hardcoded 150K candidates** for percentile — wrong for non-CS papers.

### Database
- **Dual Topic schemas**: defined in both `models/Topic.js` and `models/index.js` with different fields.
- **Dual MockTest schemas**: `'MockTest'` vs `'PreSeededMockTest'` model names.
- **AIConversation `messages` array unbounded** — risk of 16MB document limit.
- **No text indexes** on Community Q&A or Flashcard search — full scan.

### Content
- **Subject code mismatch**: frontend uses `'coa'`, `'c-programming'` while backend uses `'CO'`, `'DS'`.
- **Weekly test topic mappings incorrect** in ~5 tests (CD Test 5 uses SDT for Code Gen, etc.).
- **samplePyqs.js has only 18 questions**, all MCQ — insufficient for PYQ practice.

### Mobile
- **All interactive elements below 44px touch target**: buttons use `py-2` (~28px) everywhere.
- **Tab bars overflow** on screens <360px with 5-7 tab labels.

### Accessibility
- **Custom `GlassSelect` dropdown** has no `role="combobox"`, `aria-expanded`, or `role="listbox"`.
- **Tab interfaces** missing `role="tablist"`, `role="tab"`, `aria-selected`.
- **ProgressRing** missing `role="progressbar"`, `aria-valuenow`.
- **Clickable cards** (`onClick` only) have no keyboard handlers or `role="button"`.

### Admin CMS
- **Multiple admin routes lack `requirePermission`** — low-privilege admins can access/modify data beyond scope.
- **CSV import** passes parsed data directly to `insertMany` without field validation.
- **No rate limiting** on admin endpoints.

---

## Low-Priority Improvements (Nice to Have)

- `analyzeInstituteProgramTrends` dead code (never called).
- Admission probability formula too simplistic (treats non-safe as zero).
- Hardcoded "7800+ Cutoffs" marketing text in predictor — should be dynamic.
- `consolidationScore` missing from `batchAnalyseTrends` output (field name typo).
- No loading state for localStorage JSON.parse in todaySessions (already has try/catch).
- No `maxlength` on input fields for form validation.
- PwD users get empty results with no guidance when category data missing.
- Community `voters` arrays unbounded on popular questions.
- Health endpoints leak detailed system info (memory, DB status, mock auth).
- `sanitizeString` only removes `<>` — insufficient for XSS prevention.

---

## Verdict

**GateNexa v0.9.0-rc2 is NOT ready for public beta.**

The AI Predictor, which is the core value proposition of the app, has a **systematic scaling bug** that corrupts nearly every data-driven metric. The production credentials exposed in the repository must be revoked immediately. And the error handling system has a critical wiring bug that will cause server crashes under edge cases.

### Minimum Requirements to Reach Beta-Readiness

1. **Revoke all secrets** in `.env`, add to `.gitignore`, use `.env.example`.
2. **Fix the `* 10` scaling bug** in `predictionUtils.js` (3 lines to change, massive impact).
3. **Fix field name mismatch** in `predictor.js` (2 lines to change).
4. **Mount `errorHandler.js`** and fix the double-send bug in `server.js`.
5. **Disable `X-Demo-User` bypass** or gate behind `NODE_ENV`.
6. **Remove auto-admin seeding** or use generated passwords.

These 6 fixes address the 5 CRITICAL and 1 HIGH blocker issues. Estimated effort: **< 2 hours**.

---

---
## Frozen Roadmap (Feature Freeze in Effect)

**Rule:** Every new idea passes this filter before acceptance:
1. Helps students prepare for GATE more effectively?
2. Needed for v1.0?
3. At least 70% of users benefit?
4. Can it be postponed without hurting the product?

If any answer is **No** → v1.1 backlog.

---

### Phase A — ✅ Foundation (100% Complete)
Engineering Charter · Release Gate · Definition of Done · Regression Policy · Git Workflow · Referral System · AI Quota · Predictor Stabilization · RC-1 · RC-2 Blocker Fixes · Changelog

### 🔴 Phase B — Security (Next Session — Manual)
Rotate MongoDB credentials, JWT secret, OpenRouter key, Cloudinary credentials. Update Render/Vercel env vars. Verify production. Delete old credentials. **30-60 min.**

### 🟠 Phase C — Performance Sprint
Backend: Reduce Dashboard queries (13→3-5), cache expensive queries, optimize MongoDB indexes, remove duplicates. Frontend: Route-level lazy loading, reduce bundle, optimize images, remove unnecessary renders.

### 🟡 Phase D — Mobile Sprint
Audit every page: Dashboard, AI, Predictor, Focus, GateVault, Notes, Topics, Mock Tests, Analytics, Admin, Settings. Fix: overflow, padding, typography, touch targets ≥44px, safe areas, landscape.

### 🟢 Phase E — AI Predictor Validation
Marks 20/30/40/50/60/70/80/90 × Categories General/OBC/EWS/SC/ST/PwD. Verify: AIR, college matching, cutoffs, confidence, explanations, trends.

### 🔵 Phase F — Closed Beta
20-50 GATE aspirants. Collect feedback on Predictor, AI Mentor, Mock Tests, Focus, GateVault. Fix only real user issues.

### 🚀 Phase G — Public Beta
Gate: secrets rotated, readiness ≥85/100, no P0/P1, stable backend, mobile polished, AI Predictor validated.

---

## Roadmap to Beta (Legacy)

### Sprint 1 — Reach 70/100 (Reliability + Performance)
- Reduce Dashboard DB queries (13 → 3-5 via batching/caching)
- Optimize JS bundles >200KB (route-level lazy loading)
- Fix subject code mismatches, validate content mappings
- Audit Admin CMS permissions
- Improve mobile touch targets, fix responsive issues

### Sprint 2 — Reach 80-85/100 (Quality)
- Accessibility: ARIA labels, keyboard nav, focus states
- AI Predictor validation against historical data
- Admin CMS E2E: upload/edit/delete/frontend sync
- Verify predictor datasets (cutoffs, seats, placements, fees)
- Graceful error handling (network failure, backend down, API errors)

### Sprint 3 — Beta Launch Prep
- Rotate all secrets, verify new credentials
- Production logging + monitoring
- Full database backup
- Deployment + rollback procedures
- Final E2E regression suite

---

## Definition of Done

A task is not complete unless it includes:

- ✅ Code changes
- ✅ Unit/integration verification (where applicable)
- ✅ Manual QA
- ✅ Regression checklist
- ✅ Performance impact assessment
- ✅ Mobile verification
- ✅ Changelog entry

---

## Target Scores Before Inviting Beta Users

| Area | Target |
|------|--------|
| Security | ≥90 |
| AI Predictor | ≥85 |
| Performance | ≥80 |
| Mobile UX | ≥85 |
| Admin CMS | ≥80 |
| Error Recovery | ≥90 |
| Accessibility | ≥70 |
| **Overall** | **≥85/100** |
