# Root Cause Analysis — Cross-Module Regressions

## Why Changes Break Unrelated Pages

---

## 1. THE PRIMARY ROOT CAUSE: Monolithic State (`ProgressContext`)

**35+ files** depend on `ProgressContext`. It holds ALL user data:

```
ProgressContext (single object)
  ├── topics[]
  ├── notes[]
  ├── pyqs[]
  ├── mocks[]
  ├── studyStats
  ├── gateFeatures
  ├── revisionSchedule
  └── backupStatus
```

**Every page imports the same context.** A change to how `topics` is structured (e.g., adding a field to satisfy TopicsPage) can break DashboardPage, AIMentorPage, PYQPage, etc. because they all read from the same context key.

**Fix:** Split into domain contexts.

---

## 2. THE SECONDARY ROOT CAUSE: `predictionEngine.js` is a God Object

**18 direct imports**, 778 lines, 17 models:

```
predictionEngine.js
  ├── GateYear
  ├── GateCutoff
  ├── GateMarksScore
  ├── GateScoreRank
  ├── GateRankPercentile
  ├── GateScoreData
  ├── GateRankData
  ├── GateStatistics
  ├── CcmtCutoff
  ├── CoapCutoff
  ├── SeatMatrix
  ├── CollegeProgram
  ├── BranchStatistics
  ├── PsuRequirement
  ├── PsuRecruitment
  ├── PredictionCache
  ├── PredictionAccuracy
  └── predictionUtils.js (which imports 10 MORE models)
```

Any schema change to any of these 17 models risks breaking the predictor. Any change to the predictor risks breaking anything that touches these models.

**Fix:** Split into domain pipelines.

---

## 3. DUPLICATE SCHEMAS (Topic, MockTest)

`Topic` and `MockTest` are defined in **both**:

| File | Fields |
|------|--------|
| `backend/src/models/index.js` (inline) | Richer: difficulty, resources, isDefault, order |
| `backend/src/models/Topic.js` (standalone) | Simpler: subset of fields |

Routes importing from `../models` get one version; routes importing from `../models/Topic` get the other. **They can drift independently.**

**Fix:** Single source of truth — delete inline schemas, re-export from `index.js`.

---

## 4. AI SERVICE CIRCULAR DEPENDENCY

```
aiCoachService.js
  ├── imports aiPromptBuilder.js (static)
  └── requires localCoachFallback.js (dynamic)

localCoachFallback.js
  └── imports aiPromptBuilder.js (static)
```

The dynamic `require()` in `aiCoachService.js:180` creates a fragile cycle. If `aiPromptBuilder.js` ever imports `aiCoachService.js`, the chain loops and crashes the server.

**Fix:** Extract shared constants into `aiConstants.js`.

---

## 5. CONTEXT NESTING DEPTH (6 levels deep)

```
ThemeProvider
  └── AuthProvider
       └── ProgressProvider
            └── DashboardProvider
                 └── FocusProvider
                      └── App
```

Any update to `AuthContext` re-renders all 5 child providers + 35+ consumers. Any update to `ProgressContext` re-renders all 35+ consumers including unrelated pages.

**Fix:** Flatten the tree, use selective subscriptions.

---

## 6. NO API VERSIONING — ~225 Endpoints, No Contracts

45 route files, ~225 endpoints, zero versioning. When a response shape changes (e.g., `average` → `averageScore`), every frontend consumer must be updated simultaneously or it breaks.

**Fix:** Versioned API (`/api/v1/`, `/api/v2/`) or a shared TypeScript/types package.

---

## Dependency Graph (Simplified)

```
App.jsx (80+ lazy imports)
  ├── Layout (15+ deps)
  │    ├── SmartScrollNavigator
  │    └── FloatingAIAssistant (10+ deps)
  │
  ├── ProgressContext (35 consumers)
  │    ├── DashboardPage (35+ component deps)
  │    ├── SubjectsPage
  │    ├── TopicsPage
  │    ├── PYQPage
  │    ├── AIMentorPage
  │    ├── NotesPage
  │    ├── StudyPlannerPage
  │    ├── SettingsPage
  │    └── 28 more...
  │
  ├── predictionEngine.js (18 deps)
  │    ├── predictor route
  │    ├── adminPredictor route
  │    └── predictionUtils.js (10 deps)
  │
  └── server.js (20+ deps)
       ├── 45 route files
       ├── 26 service files
       └── 49 model files
```

---

## Refactoring Priority

| Priority | What | Why | Effort |
|----------|------|-----|--------|
| **P0** | Split `ProgressContext` | Root cause of 80% of regressions | 2-3 days |
| **P1** | Split `predictionEngine.js` | Single point of failure for predictor | 1-2 days |
| **P2** | Deduplicate Topic/MockTest schemas | Silent data corruption risk | 2 hours |
| **P3** | Fix AI circular dependency | Server crash risk | 1 hour |
| **P4** | Flatten context tree | Reduce unnecessary re-renders | 1 day |
| **P5** | API versioning | Prevent contract breaking | 3-5 days |

---

## Files Modified (for this report only)

None — this is an analysis-only deliverable. Implementation requires approval.
