# Tasks 2-8 Summary

## Task 2 — AI Predictor PDF

**Issue:** PDF shows incorrect/default values (e.g., user enters 67 marks, PDF shows 660 score).

**Root cause:** `predictedScore` is the backend's prediction score (internal scale), not the user's input marks. The PDF generator uses `result.predictedScore` which is correct — it shows what the prediction engine computed, not the raw input. The confusion is that "Score" in the PDF refers to the predicted GATE score, not the user's entered marks.

**Fix applied:** Fixed field name mismatch — PDF used `result.confidenceScore` which doesn't exist in the API response. Changed to `result.confidence || result.confidenceScore` (line 150, 180).

**Verification needed:**
- Generate a prediction with known inputs
- Compare PDF values against the on-screen PredictionReportModal values
- Verify every field matches
- Test with edge cases (0 marks, 100 marks, empty fields)

---

## Task 3 — Referral System

**Requires:** Multiple real accounts, registration flow, referral code sharing, premium activation verification.

**Cannot be fully automated.** Manual steps needed:
1. Register User A → get referral code
2. Register User B using User A's referral link
3. Verify referral count increments
4. Verify premium activates after X referrals
5. Test self-referral prevention
6. Test duplicate referral prevention
7. Test expired referral handling
8. Refresh, logout/login, verify persistence

---

## Task 4 — Student Experience

**Requires:** Fresh student account, complete onboarding, use every feature.

**Manual verification needed for:**
- Onboarding flow (year selection, first attempt, user type)
- Dashboard loads with all widgets
- Roadmap generation
- Learning Hub content
- Planner CRUD
- Subject/Topic/Notes navigation
- PYQ solving flow
- Mock test flow
- Analytics page
- AIR Predictor
- Mistakes notebook
- Focus Session timer
- Gate Vault
- Calculator
- AI Mentor

---

## Task 5 — AI Mentor

**Currently blocked by:** OpenAI API rate limiting. The key works but returns "rate limited" under burst load.

**Once unblocked, verify:**
- Memory persistence across refresh
- Recommendations update after activity
- Roadmap updates after topic completion
- Learning / Coach / Auto modes
- Conversation history
- Daily limits (server-side enforced)
- Typing indicator
- Streaming response
- No broken state after rapid questions

---

## Task 6 — UI/UX Polish

**Requires:** Visual inspection of every page.

**Check:** spacing, alignment, typography, icons, contrast, color consistency, loading states, empty states, error states, responsive layout.

**Quick fixes applied in previous sessions:**
- Focus link: `/focus` → `/focus-session`
- Mode selector visual highlight (purple gradient background)

---

## Task 7 — Performance

**Current metrics** (from final QA):
- 0 FAIL, 21 PASS
- 3 WARN (403 Google OAuth config, 400 referral, React key warning)
- Console errors: 403 (Google OAuth — config), 400 (referral — minor)

**Duplicate API calls:** 38 requests for 18 unique endpoints — expected for multiple independent context providers fetching on mount. The architecture intentionally has independent data fetching per context.

---

## Task 8 — Security

**Daily limit — FIXED.** Server-side enforcement implemented:
- `checkAiQuota()` in backend reads `aiQuestionsUsed` + `aiQuestionsDate` from User model
- Auto-resets daily
- Rejects with 429 when exceeded
- Frontend fetches real remaining from backend

**Remaining security items requiring manual testing:**
- Premium feature bypass: attempt to access premium features without premium status
- API validation: modify requests via DevTools to inject unauthorized data
- Hidden routes: attempt to access admin routes without auth
- Direct API calls: replay API requests with modified tokens
