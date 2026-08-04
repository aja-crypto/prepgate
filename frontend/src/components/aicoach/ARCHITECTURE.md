# GateNexa AI Coach — Architecture

## Overview

The AI Coach is a single-page coaching dashboard at `/mentor`. It is the first tab in the GateNexa AI hub and serves as the student's daily coaching companion.

## File Structure

```
frontend/src/components/aicoach/
├── AiCoachDashboard.jsx          # Page shell — reads useCoachState(), renders sections
├── AiCoachHeader.jsx             # Hero section: greeting + status + summary + actions
├── AiStatusIndicator.jsx         # Status chip (Ready, Preparing, Offline, etc.)
├── GreetingMessage.jsx           # Time-aware greeting (morning/afternoon/evening)
├── CoachSummary.jsx              # "Today's plan:" one-paragraph summary
├── CoachActionButtons.jsx        # "Continue Today's Journey" + "Ask My Coach"
├── CoachCard.jsx                 # Reusable card primitive (16px radius, glass, hover)
├── CoachErrorBoundary.jsx        # Per-section error boundary
├── CoachChat.jsx                 # Chat widget with demo fallback + real AI
├── LiveTimer.jsx                 # Session overview from FocusContext
├── WhatIKnowCard.jsx             # Student profile memory display
├── MemoryItem.jsx                # Reusable memory field (icon + label + value)
├── TodaysJourneyCard.jsx        # Daily step timeline
├── JourneyStep.jsx              # Individual journey step
├── JourneyConnector.jsx         # Step connector with "Done/Next" label
├── JourneyProgress.jsx          # Progress bar + motivational text
├── JourneyFooter.jsx            # Completion state with CTAs
├── ProgressCard.jsx             # 6-metric analytics display
├── RoadmapCard.jsx              # Roadmap timeline with profile type selector
├── RoadmapStage.jsx             # Individual roadmap stage
├── RecommendationsCard.jsx      # Evidence-based recommendations
├── coachTokens.js               # Centralized design tokens
├── useCoachState.js             # Unified state hook
├── coachPromptBuilder.js        # AI chat context builder
└── CoachActionButtons.jsx       # Header action buttons
```

## Data Flow

```
User Action (page load / session / mock)
  ↓
useCoachState() ← reads useAiMentor() + useProgress()
  ↓
DecisionEngine.process(event, state)
  ├── ConfidenceEngine (confidence % + evidence)
  ├── PredictiveEngine (score range, AIR range, completion)
  ├── RevisionEngine (spaced repetition queue)
  ├── ReviewGenerator (weekly/monthly reports)
  └── Notifications (streak, overdue, recommendations)
  ↓
AiCoachDashboard renders sections with props
  ↓
Each section wrapped in CoachErrorBoundary
```

## AI Chat Context

```
CoachChat
  → buildCoachContext(coachState) → builds profile + analytics + roadmap + session
  → buildSystemPrompt(coachContext) → builds system prompt with all student data
  → aiService.askCoach(message, context) → sends context to backend
  → Backend calls OpenRouter with system prompt + user message
```

## Session Architecture

```
FocusContext (global, single source of truth)
  ├── startSession(duration, subject) → begins timer
  ├── pauseSession() → pauses
  ├── resumeSession() → resumes
  ├── stopSession() → stops, creates history record
  ├── persistState() → saves to localStorage
  └── loadPersistedState() → restores on page load

LiveTimer (AI Coach) ← reads FocusContext state
FocusSessionPage (/focus-session) ← writes FocusContext
CoachActionButtons → navigate('/focus-session')
```

## Engines (frontend services)

| Engine | File | Purpose |
|---|---|---|
| Decision | `aiDecisionEngine.js` | Orchestrates all engines, event-driven |
| Confidence | `aiConfidenceEngine.js` | Confidence % from evidence count + data quality |
| Predictive | `aiPredictiveEngine.js` | Score range, AIR range, completion date |
| Revision | `aiRevisionEngine.js` | Spaced repetition at 1/3/7/15/30 days |
| Review | `aiReviewGenerator.js` | Weekly and monthly reports |
| Recommendation | `aiRecommendationEngine.js` | Generates study recommendations |
| Roadmap | `aiRoadmapEngine.js` | Computes roadmap stages |
| Analytics | `aiAnalyticsService.js` | Enriches student state with analytics |
| Memory | `aiMemoryService.js` | localStorage-based memory with snapshots |

## Design System

All visual tokens live in `coachTokens.js`:
- Colors (bg, card, accent, success, warning, danger, info)
- Spacing (4/8/12/16/20/24/28/32/40/48)
- Typography (hero, greeting, sectionTitle, cardTitle, body, caption, label, stat)
- Radius (8/12/16/20/full)
- Shadows (card, hover, glow)
- Animation durations + easings

Each component imports `coachTokens` — no hardcoded spacing or colors.

## Accessibility

- All buttons have `tabIndex`, `aria-label`, `onFocus`/`onBlur` focus rings
- Cards with `onClick` handler have `role="button"` and keyboard support
- Memory grids have `role="list"` and `aria-label`
- Chat input has `aria-label`
- Sufficient contrast ratios (text #F1F5F9 on card bg ≈ 14:1)
- Motion disabled when `prefers-reduced-motion` is active

## Production Considerations

- Each section has an independent error boundary
- Zero AI API calls in demo mode (contextual fallbacks)
- Session state persists through page reload
- All predictions return ranges (never exact promises)
- Recommendations include confidence + evidence
- Timer is shared via FocusContext (single source of truth)
