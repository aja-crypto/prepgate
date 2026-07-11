# Changelog

## v0.9.0-rc1 — 2026-07-06

### Bug Fixes

- **Sidebar GateNexa AI link** — Fixed case-sensitive route mismatch (`/gatenexa-ai` → `/GateNexa-ai`) that broke sidebar navigation to GateNexa AI page
- **GateNexaAIPage tab remount** — Tab switching destroyed sub-page state (chat history, form inputs). Changed to `display:none` pattern to keep all tabs mounted
- **DashboardPage array mutation** — `subjects.sort()` mutated memoized array during render. Changed to `[...subjects].sort()`
- **DashboardPage misplaced import** — `import { ChevronRight }` moved from middle of file to top
- **DeepFocusPage stale state** — `focusSessions` never updated after new session completed. Added `setFocusSessions`
- **DeepFocusPage undefined crash** — `data.topics.filter()` guarded with `(data.topics || [])`
- **DeepFocusPage memory leak** — Inner `setTimeout` in quote rotation not cleaned up on unmount
- **DeepFocusPage false completion** — Session completion fired on pause (11s elapsed). Now only fires when `timeRemaining === 0`
- **ProductivityPage missing animation** — `@keyframes float` not defined, formulas never animated
- **ProductivityPage Sunday index** — `getDay() - 1` returns `-1` on Sunday. Fixed with `(getDay() || 7) - 1`
- **NotesPage date crash** — `formatDistanceToNow` could throw on missing `updatedAt`. Added null guard
- **TopicsPage undefined id** — `String(t.id)` produced literal `"undefined"` string when id missing. Changed to `String(t.id ?? '')`
- **TopicsPage undefined name crash** — `.split()` crashes when a subject has no name. Added `.filter(Boolean)`
- **MockTestsPage empty state** — Empty test list falsely treated as load error. Added separate `apiSucceeded` flag
- **AnalyticsPage SPA navigation** — `<a href>` changed to `<Link to>` to prevent full page reloads
- **AnalyticsPage wrong pie chart data** — Pie chart used daily `weeklyHours` with subject labels. Fixed to use per-subject `scores`
- **AnalyticsPage falsy score** — `recentScore || readiness` hid a legitimate score of 0. Changed to `mocks.length ? recentScore : readiness`
- **SettingsPage localStorage crash** — Unsafe `JSON.parse` without try/catch could crash page on corrupt data
- **SettingsPage false verification** — `isVerified: true` set prematurely after resending verification email (user did not actually verify). Removed the state mutation
- **App.jsx conflicting admin routes** — Duplicate `/admin` route caused redirect chain. Removed the competing redirect
- **OpportunityPredictorPage typo** — "idos core" → "score is above cutoff" in user-facing text

### Improvements

- **Pre-indexed seat lookups (A4)** — O(N²) → O(1) seat map lookups in prediction engine (~53x speedup, 368ms → 7ms)
- **'Why This College?' explanations (A1)** — Backend generates structured explanations + improvement suggestions; frontend displays explanation cards
- **GateVault polish** — Custom animated vault icon, Known/Review Again buttons, CompletionScreen with accuracy/XP/streak, responsive mobile layout, performance memoization

### Engineering

- **GateNexa Engineering Charter v1.0** — Phase 0 (analysis) → Branch → Isolate → Protect Critical Modules → Full Regression → Commit → Merge
- **express-rate-limit removed** — Custom `rl()` replaces the library (reliably hangs on routes in this project)
- **All changes pass `npm run build`** — 0 errors, 3548 modules

### Known Issues

- Single `ErrorBoundary` wrapping entire route tree — per-section boundaries planned
- Several P2 items: unused imports, missing `useEffect` deps, silent error handling, no error boundaries on sub-pages
- Chunk size warnings for Three.js (767 kB) and export (878 kB) bundles
