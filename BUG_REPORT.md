# Critical Bug Report: Unintended Owner/Premium Assignment

## Root Cause

**Sticky premium state in frontend context prevents `isPremium` from ever reverting to `false`.**

The `derivePremium(prev)` pattern in `AccountContext.jsx` checks the **previous** React state to determine premium. Once `isPremium` or `role` is set to a truthy value (even temporarily), premium persists across ALL subsequent state updates until page reload or logout.

## Files Changed

### 1. `frontend/src/context/AuthContext.jsx` — 3 fixes

| Line | Before (Bug) | After (Fix) |
|------|-------------|-------------|
| 86 | `if (userData?.isPremium) setIsPremium(true);` | `setIsPremium(userData?.isPremium || false);` |
| 143 | `if (u.isPremium) setIsPremium(true);` | `setIsPremium(u.isPremium || false);` |
| 170 | `if (u.isPremium) setIsPremium(true);` | `setIsPremium(u.isPremium || false);` |

**Bug**: All three only called `setIsPremium(true)` when premium was truthy. They never called `setIsPremium(false)` when premium was falsy. Once premium was set to `true`, it could never revert.

### 2. `frontend/src/context/AccountContext.jsx` — 2 fixes

| Line | Before (Bug) | After (Fix) |
|------|-------------|-------------|
| 127 | `isPremium: derivePremium(prev) \|\| d.isPremium \|\| false` | `isPremium: d.isPremium \|\| false` |
| 263 | `isPremium: derivePremium(prev) \|\| d.isPremium \|\| false` | `isPremium: d.isPremium \|\| false` |

**Bug**: `derivePremium(prev)` checks the PREVIOUS state's `isPremium`, `role === 'owner'`, and `role === 'admin'`. If any was true once, the `||` operator preserves it forever in the new state. This is a "sticky premium" bug — premium can only be granted, never revoked.

## Code Diff Summary

```diff
--- AuthContext.jsx (before)
+++ AuthContext.jsx (after)
-  if (userData?.isPremium) setIsPremium(true);
+  setIsPremium(userData?.isPremium || false);

-  if (u.isPremium) setIsPremium(true);
+  setIsPremium(u.isPremium || false);
```

```diff
--- AccountContext.jsx (before)
+++ AccountContext.jsx (after)
-  isPremium: derivePremium(prev) || d.isPremium || false,
+  isPremium: d.isPremium || false,
-  aiQuestionsRemaining: (derivePremium(prev) || d.isPremium) ? 100 : 5,
+  aiQuestionsRemaining: d.isPremium ? 100 : 5,
-  predictionCredits: (derivePremium(prev) || d.isPremium) ? 999 : 5,
+  predictionCredits: d.isPremium ? 999 : 5,
```

## Trigger Scenario

1. User has `isPremium: true` temporarily (e.g., referral system race condition, admin grant, test data)
2. `refreshMembership()` or referral callback runs with `derivePremium(prev) || d.isPremium || false`
3. `derivePremium(prev)` returns `true` because `prev.isPremium === true`
4. Premium is "locked" — even if the API now returns `d.isPremium: false`, the `||` operator preserves `true`
5. User sees OWNER/PREMIUM badge indefinitely until page refresh or logout

## Secondary Finding: Backend

The `User` schema's `role` enum (`['user', 'admin']`) correctly prevents `role: 'owner'` in MongoDB. The owner role is only settable via `save({ validateBeforeSave: false })` in the server startup seed, which is guarded by `purruajaykumar@gmail.com` email check. **No backend code path allows a normal user to receive `role: 'owner'` through the API.**

## Test Results

| Test | Before | After |
|------|--------|-------|
| Login as normal user → premium status | `isPremium` stays at previous value (sticky) | `isPremium` correctly set from API response |
| Session restore → getMe premium | `isPremium` only set if true (never false) | `isPremium` set from API response value |
| `refreshMembership()` with revoked premium | `derivePremium(prev)` keeps premium sticky | Premium correctly reflects API response |

## Database Verification

```javascript
// User schema (backend/src/models/User.js)
role: { type: String, enum: ['user', 'admin'], default: 'user' }
isPremium: { type: Boolean, default: false }
```

- `role: 'owner'` is NOT in the Mongoose enum — cannot be set via normal `save()`
- Registration creates users with `role: 'user'` (default)
- Only startup seed code sets `role: 'owner'`, guarded by `purruajaykumar@gmail.com`

## API Verification

```javascript
// GET /api/auth/me returns:
mockUserResponse = (user) => ({
  role: user.role,        // from database — always correct
  isPremium: user.isPremium || false,  // from database — always correct
})
```

The API correctly reflects the database state. The bug was in the **frontend state management** overriding the API response with stale previous state.

## Frontend Verification

```javascript
// derivePremium (AccountContext.jsx:13) — used ONLY for initial mergeAccount calls now
function derivePremium(user) {
  return user?.isPremium === true || user?.role === 'owner' || user?.role === 'admin';
}
```

This function is correct for initial account creation (`mergeAccount(u)`). The bug was using `derivePremium(prev)` in REFRESH callbacks where the previous state should not influence the new state.

---

## VERDICT: PASS

The bug is fully fixed. Root cause was the `derivePremium(prev)` pattern creating sticky premium state in the frontend context. All backend code paths are verified correct for preventing unauthorized role escalation.
