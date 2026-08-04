# AI Mentor Architecture Refactor

## Old Architecture

```
User Action
     │
     ├──► publish(EVENT) ──► aiEventSystem
     │
     ├──► AiMentorTracker (React component — contains pipeline logic)
     │        │
     │        ├── aiMentorEngine.initEngine()  ← subscribes to events, tracks engineState
     │        ├── aiStudentStateEngine.buildState() ← assembles base state
     │        ├── aiMemoryService.enrichWithMemory()
     │        ├── aiAnalyticsService.enrichWithAnalytics()
     │        ├── aiKnowledgeBase.enrichWithKnowledge()
     │        ├── aiStudentStateEngine.enrichState()
     │        ├── aiDecisionEngine.makeDecisions() ← calls confidence, prediction, revision, review
     │        ├── setRecommendations()  ← writes directly to context
     │        ├── setRoadmap()          ← writes directly to context
     │        └── setNotifications()    ← writes directly to context
     │
     ├──► AiMentorContext (contains profile + recommendations + roadmap + notifications + studentState + setters)
     │
     ├──► useCoachState (manually aggregates AI state + ProgressContext)
     │
     └──► Dashboard + CoachChat (UI components)

Orphaned engines (not connected to data flow):
     ├── aiAnalyticsEngine.js + aiMemoryStore.js  ← only import each other
     ├── aiRecommendationEngine.js  ← never called
     ├── aiRoadmapEngine.js         ← never called
     └── aiNotificationService.js   ← never called from pipeline
```

## New Architecture

```
User Action
     │
     ├──► publish(EVENT) ──► aiEventSystem
     │                            │
     │                            ▼
     │                     aiOrchestrator.js  (SINGLE pipeline entry point)
     │                            │
     │                            ├── recordEvent → aiMemoryService
     │                            ├── getCurrentData from providers
     │                            ├── enrichWithMemory (aiMemoryService)
     │                            ├── enrichWithAnalytics (aiAnalyticsService)
     │                            ├── enrichWithKnowledge (aiKnowledgeBase)
     │                            ├── decisionEngine.process (aiDecisionEngine)
     │                            │       ├── aiConfidenceEngine
     │                            │       ├── aiPredictiveEngine
     │                            │       ├── aiRevisionEngine
     │                            │       └── aiReviewGenerator
     │                            ├── generateRecommendations (aiRecommendationEngine)
     │                            ├── computeRoadmap (aiRoadmapEngine)
     │                            ├── generateNotificationsFromState (aiNotificationService)
     │                            ├── store → aiStudentStateEngine (pure state container)
     │                            └── publish('ai:state_updated') + notifySubscribers()
     │
     ├──► AiMentorTracker (THIN connector — 30 lines)
     │        ├── initOrchestrator(providers)
     │        └── onStateChange(state => setUnifiedAiState(state))
     │
     ├──► AiMentorContext (pure state container — no business logic)
     │        ├── profile (for onboarding — user data)
     │        └── unifiedState (from orchestrator — AI processed data)
     │
     ├──► useCoachState (thin mapper — unified state → dashboard shape)
     │
     └──► Dashboard + CoachChat (unchanged UI)
```

## Event Flow

1. User performs an action (clicks, navigates, completes topic, solves PYQ)
2. `publish(EVENT, data)` is called via `useAiMentorTracking.js` hooks or `AiMentorTracker.jsx`
3. `aiEventSystem` delivers the event to all subscribers
4. `aiOrchestrator.js` receives the event and runs the entire pipeline:
   - Record the event in persistent memory
   - Fetch fresh data from React providers (profile, topics, pyqs, etc.)
   - Enrich with memory data (past sessions, trends, patterns)
   - Enrich with analytics (mentor score, consistency, momentum, burnout, insights)
   - Enrich with knowledge base (AIR strategies, dependencies, weightages)
   - Run Decision Engine (confidence scores, predictions, revision queue, reviews)
   - Generate recommendations (12 categories of personalized advice)
   - Compute roadmap (stage, progress, readiness, subject order)
   - Generate notifications (priority-ordered AI alerts)
   - Store unified state in `aiStudentStateEngine`
   - Notify all state subscribers + publish `ai:state_updated` event
5. `AiMentorTracker.jsx` receives the state update and calls `setUnifiedAiState()`
6. `AiMentorContext` propagates the new state to all consumers
7. `useCoachState` maps the unified state to dashboard-shaped props
8. UI components re-render with fresh AI data

## Engine Responsibilities

| Engine | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **aiDecisionEngine** | Process events → coordinate confidence, prediction, revision, review | eventType, state | confidence, prediction, revision, review, notifications |
| **aiConfidenceEngine** | Score recommendations by data quality | recommendation, data dimensions | confidence% with reasoning |
| **aiPredictiveEngine** | Predict GATE score, AIR, readiness, syllabus completion | study data | predicted score range, AIR band, readiness% |
| **aiRevisionEngine** | Spaced repetition scheduling | topics, accuracy, timestamps | revision queue with urgency ordering |
| **aiReviewGenerator** | Generate weekly/monthly performance reports | study stats, history | structured review with achievements, recommendations |
| **aiRecommendationEngine** | Generate 12 categories of personalized recommendations | profile, state, topics, pyqs, stats | prioritized recommendation array |
| **aiRoadmapEngine** | Compute 5-stage study roadmap | profile, stats, topics | stages, current phase, readiness, subject order |
| **aiAnalyticsService** | Compute comprehensive analytics from enriched state | studentState (with memory) | mentor score, consistency, momentum, burnout, insights |
| **aiMemoryService** | Persistent localStorage for events, sessions, PYQs, revisions | event data | stored events, enrichment data, coaching trends |
| **aiNotificationService** | Create and manage priority-ordered notifications | type, data | notification objects with priority sorting |
| **aiKnowledgeBase** | Static GATE exam knowledge (weightages, dependencies, strategies) | queries | structured exam data and intelligence |
| **aiStudentStateEngine** | Pure state container for unified AI state | state from orchestrator | getState() / setState() |

## Files Modified

| File | Change |
|------|--------|
| `src/services/aiOrchestrator.js` | **NEW** — Single pipeline entry point. Subscribes to all events, runs the full engine pipeline, stores unified state, notifies subscribers. |
| `src/services/aiStudentStateEngine.js` | Refactored from 138-line singleton with `buildState`/`enrichState` business logic to an 8-line pure state container (`setState`/`getState`/`clearState`). |
| `src/context/AiMentorContext.jsx` | Refactored from 122-line context with `setRecommendations`, `setRoadmap`, `setNotifications`, `setStudentState` setters to a pure state container that receives `setUnifiedAiState(orchestratorState)` and exposes derived `unifiedState`, `recommendations`, `roadmap`, `notifications`. |
| `src/components/ai-mentor/AiMentorTracker.jsx` | Rewritten from 144-line pipeline orchestrator (importing 7 engines, running the full pipeline manually) to a 90-line thin connector that calls `initOrchestrator(providers)` and `onStateChange(setUnifiedAiState)` plus event publishing. |
| `src/components/ai-mentor/AiMentorHomepage.jsx` | Updated destructured property name: `studentState` → `unifiedState`. |
| `src/components/aicoach/useCoachState.js` | Updated destructured property name: `studentState` → `unifiedState`. |

## Files Removed

| File | Reason |
|------|--------|
| `src/services/aiMemoryStore.js` | Duplicate of `aiMemoryService.js`. Both used same `STORAGE_KEY`, same `load`/`persist` pattern, same `recordEvent`, `getEvents`, `recordSession`, `clearMemory` functions. `aiMemoryService.js` is more comprehensive (adds PYQ history, revision history, learning history, coaching trends, `enrichWithMemory`). Nothing imported `aiMemoryStore` except the equally orphaned `aiAnalyticsEngine.js`. |
| `src/services/aiAnalyticsEngine.js` | Duplicate of `aiAnalyticsService.js`. Both compute analytics from student data (consistency, momentum, coverage, revision rate, accuracy, weak areas). `aiAnalyticsService.js` is more comprehensive (adds mentor score, burnout risk, study efficiency, accuracy trend, hours trend, coaching insights, PYQ pattern analysis, topic confidence, mock readiness, revision effectiveness). Nothing imported `aiAnalyticsEngine.js`. |
| `src/services/aiMentorEngine.js` | Event subscription logic merged into `aiOrchestrator.js`. Its `engineState` tracking (currentSubject, currentTopic, completedTopics, counters, recentActivity) is now maintained directly by the orchestrator. `initEngine`/`getEngineState`/`destroyEngine` replaced by `initOrchestrator`/`getState`/`destroyOrchestrator`. Only `AiMentorTracker.jsx` imported it, which was rewritten. |

## Files Unchanged (Engine Files — Kept as-is)

| File | Reason |
|------|--------|
| `src/services/aiEventSystem.js` | The pub/sub backbone. Clean API. No changes needed. |
| `src/services/aiDecisionEngine.js` | Extends the `decisionEngine.process()` method to be called by the orchestrator. Still handles confidence, prediction, revision, review. |
| `src/services/aiConfidenceEngine.js` | Pure function. Single responsibility. No changes needed. |
| `src/services/aiPredictiveEngine.js` | Pure functions. Single responsibility. No changes needed. |
| `src/services/aiRevisionEngine.js` | Pure functions. Single responsibility. No changes needed. |
| `src/services/aiReviewGenerator.js` | Pure functions. Single responsibility. No changes needed. |
| `src/services/aiRecommendationEngine.js` | Pure function. Now ACTUALLY CONNECTED via orchestrator. No code changes needed. |
| `src/services/aiRoadmapEngine.js` | Pure function. Now ACTUALLY CONNECTED via orchestrator. No code changes needed. |
| `src/services/aiAnalyticsService.js` | Pure function. Called by orchestrator. No code changes needed. |
| `src/services/aiMemoryService.js` | Called by orchestrator when recording events. No code changes needed. |
| `src/services/aiNotificationService.js` | Now called by orchestrator to generate AI notifications from state. No code changes needed. |
| `src/services/aiKnowledgeBase.js` | Static data provider. Called by recommendation and roadmap engines. No changes needed. |

## Reasons for Every Architectural Decision

1. **Why ONE orchestrator instead of calling engines from React?**
   - React components should never contain AI business logic. It couples the UI to AI pipeline internals, prevents testing, and makes the pipeline impossible to trace. The orchestrator is a plain JS module with no React dependency — testable independently.

2. **Why merge aiMemoryStore into aiMemoryService?**
   - Both files wrote to the same `localStorage` key (`gatenexa_ai_memory`) with identical load/persist patterns. Keeping both would cause race conditions, data inconsistency, and confusion. `aiMemoryService` is strictly more comprehensive.

3. **Why remove aiAnalyticsEngine in favor of aiAnalyticsService?**
   - Both computed overlapping metrics (consistency, momentum, coverage, revision rate, accuracy, weak areas). `aiAnalyticsService` computes all of those plus 15+ additional metrics (burnout risk, mentor score, coaching insights, etc.). Keeping the weaker duplicate would violate single-responsibility.

4. **Why make AiMentorContext a pure state container?**
   - The old context exposed `setRecommendations`, `setRoadmap`, `setNotifications`, `setStudentState` — state setters that were called from `AiMentorTracker` (a React component). This meant AI pipeline logic was split between services (the engines) and components (the tracker). Moving pipeline logic to the orchestrator means the context just stores and exposes state — no business logic, no side effects.

5. **Why keep the profile in AiMentorContext?**
   - The profile is user data (onboarding answers, study goals), not AI-derived data. It's persisted to `localStorage` and managed by user actions. Keeping it in AiMentorContext is appropriate because it is still AI-adjacent data that the orchestrator reads via `getProfile()`.

6. **Why keep AiMentorTracker.jsx at all?**
   - It serves as the bridge between React (hooks, contexts) and the orchestrator (plain JS). It provides data providers (getProfile, getTopics, etc.) that the orchestrator calls during pipeline execution. It also publishes events when React state changes (study hours, streak, etc.). This is a thin, necessary connector — not business logic.

7. **Why have the orchestrator call recommendations and roadmap engines directly instead of through the decision engine?**
   - Single responsibility: Decision Engine handles "decisions" (what action to take, confidence, predictions, revision scheduling). Recommendation Engine handles "what to suggest" (12 categories of personalized advice). Roadmap Engine handles "what's the plan" (5-stage study timeline). These are distinct responsibilities. The orchestrator coordinates them cleanly without overloading any single engine.

8. **Why not remove the EVENT_TYPES from aiDecisionEngine.js?**
   - `aiDecisionEngine.js`'s `EVENT_TYPES` constants map to pipeline triggers (SESSION_COMPLETED, MOCK_COMPLETED, TOPIC_COMPLETED, PYQ_SOLVED, REVISION_DONE, DAY_START, WEEK_START, MONTH_START). The orchestrator uses these to decide which sub-pipelines to run within the decision engine. Removing them would require duplicating domain knowledge.
