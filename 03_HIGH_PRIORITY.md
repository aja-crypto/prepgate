# 03_HIGH_PRIORITY.md

# High Priority Bugs — GateNexa Audit

**11 High Priority Bugs Found | 0 Fixed During Audit | 11 Remaining**

---

## HIGH PRIORITY BUGS (Not Fixed in This Audit)

---

### Bug #H1: `saveUsersToDisk()` Silently Swallows Write Errors

| | |
|---|---|
| **File** | `backend/src/store/mockStore.js:17-24` |
| **Severity** | HIGH |
| **Status** | NOT FIXED |
| **Line** | `catch (err) { console.error('Failed to save mock users:', err.message); }` — No re-throw |

**Problem**: When `mock_users.json` cannot be written (disk full, permission denied, file locked), the error is logged but **not re-thrown**. Calling code assumes `save()` succeeded. Data loss is silent and undetected.

**Current code**:
```javascript
function saveUsersToDisk() {
  try {
    const data = Array.from(usersById.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save mock users:', err.message);
    // No re-throw — calling code thinks save succeeded
  }
}
```

**Suggested fix**:
```javascript
} catch (err) {
  console.error('Failed to save mock users:', err.message);
  throw err; // Re-throw so calling code knows the save failed
}
```

---

### Bug #H2: No SIGINT/SIGTERM Handler for Notes/Progress Data

| | |
|---|---|
| **File** | `backend/src/store/localDataStore.js:146-155` |
| **Severity** | HIGH |
| **Status** | NOT FIXED |

**Problem**: Only flashcards have an exit handler that calls `saveToDisk(true)` for immediate flush. Notes and progress data are not flushed on shutdown. If the server receives SIGINT/SIGTERM, pending note updates within the 1-second debounce window are lost.

**Current code**:
```javascript
// Only flashcards have exit handler:
process.on('SIGINT', () => {
  saveToDisk(true); // ← Only saves flashcard data (FLASHCARDS_FILE)
  process.exit(0);
});
```

**Suggested fix**: The existing `saveToDisk()` function DOES save notes and progress (to `DATA_FILE`), so the SIGINT handler actually DOES flush notes/progress because it calls `saveToDisk(true)`. **This bug may be a false positive** — the SIGINT handler calls `saveToDisk(true)` which includes notes and progress in the save. The flashcards file is saved separately.

**Verification needed**: Confirm `saveToDisk(true)` includes notes and progress in the JSON output.

---

### Bug #H3: AI Context Built from Wrong Data Source in FloatingAIAssistant

| | |
|---|---|
| **File** | `frontend/src/components/common/FloatingAIAssistant.jsx:144-152` |
| **Severity** | HIGH |
| **Status** | NOT FIXED |

**Problem**: Component uses `useAuth().user` to build AI context, but `user` from `useAuth()` contains authentication data (name, email, role) — NOT progress data (weakSubjects, strongSubjects, topics). The AI coach gets an empty/wrong context for personalization.

**Current code**:
```javascript
const { user } = useAuth(); // user has { name, email, role } — NOT { weakSubjects, ... }
const ctx = {
  weakSubjects: user?.weakSubjects || [], // Always empty!
  strongSubjects: user?.strongSubjects || [], // Always empty!
  ...
};
```

**Suggested fix**: Build context from `useProgress()` data:
```javascript
const { topics, pyqs, mocks, studyStats, gateFeatures } = useProgress();
const ctx = {
  weakSubjects: computeWeakSubjects(topics, pyqs),
  strongSubjects: computeStrongSubjects(topics, pyqs),
  ...
};
```

---

### Bug #H4: No Maximum Delay Cap in OCR Retry Backoff

| | |
|---|---|
| **File** | `backend/src/services/ocrService.js:16-32` |
| **Severity** | HIGH |
| **Status** | NOT FIXED |

**Problem**: `retryWithBackoff` uses exponential backoff without a maximum cap. For a permanently failing endpoint, retries continue with delays of 2s, 4s, 8s, 16s, 32s... potentially reaching 8+ minutes of waiting.

**Current code**:
```javascript
const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
// No maximum cap — grows indefinitely
```

**Suggested fix**:
```javascript
const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + Math.random() * 500, 30000);
// Cap at 30 seconds
```

---

### Bug #H5: Progress Updates Use Debounced Save — Data Loss Risk

| | |
|---|---|
| **File** | `backend/src/store/localDataStore.js:314-327` |
| **Severity** | HIGH |
| **Status** | NOT FIXED |

**Problem**: `updateProgress()` calls `saveToDisk()` (debounced) for every progress update. If the server crashes within the 1-second window, all progress since the last save is lost.

**Current code**:
```javascript
function updateProgress(userId, topicId, updates) {
  localProgress.set(key, next);
  saveToDisk(); // Debounced — progress can be lost on crash
  return next;
}
```

**Suggested fix**: For critical progress data, call `saveToDisk(true)` for immediate persistence, or accept the debounce and document the risk.

---

### Bug #H6: OCR Service Retries All HTTP Errors, Not Just Transient

| | |
|---|---|
| **File** | `backend/src/services/ocrService.js:35-62` |
| **Severity** | MEDIUM (escalated to HIGH due to resource waste) |
| **Status** | NOT FIXED |

**Problem**: `callMistralOcr` wraps all fetch calls in `retryWithBackoff`, but throws immediately on ALL HTTP errors (400, 401, 404, 500). This wastes retries on permanent failures (401 auth error, 404 not found).

**Current code**:
```javascript
if (!response.ok) {
  const err = await response.text();
  throw new Error(`Mistral OCR failed (${response.status}): ${err}`); // Retries ALL failures
}
```

**Suggested fix**: Only retry on 429, 500, 502, 503, 504; immediately fail on 400, 401, 404.

---

### Bug #H7: `/chat` Endpoint Returns HTTP 200 for Errors

| | |
|---|---|
| **File** | `backend/src/routes/ai.js:516-525` |
| **Severity** | MEDIUM |
| **Status** | NOT FIXED |

**Problem**: When the `/chat` endpoint encounters an exception, it calls `res.json({ success: false })` with default status 200. This misleads frontend clients into thinking the request succeeded.

**Current code**:
```javascript
} catch (e) {
  aiUsage.increment(false, Date.now() - chatStart);
  res.json({ // ← Missing status(500)
    success: false,
    message: 'AI chat error',
    ...
  });
}
```

**Suggested fix**:
```javascript
res.status(500).json({
  success: false,
  message: 'AI chat error',
  ...
});
```

---

### Bug #H8: Stale `lastAiError` in AI Mentor Endpoint

| | |
|---|---|
| **File** | `backend/src/routes/ai.js:775-780` |
| **Severity** | MEDIUM |
| **Status** | NOT FIXED |

**Problem**: If `callAiApi` returns `null` due to a transient error (rate limit, timeout), `lastAiError` stores the error message. On the **next** successful request where the API key is valid, `lastAiError` still holds the old error value, causing the stale error message to be shown instead of the real AI response.

**Current code**:
```javascript
if (lastAiError) {
  return {
    text: `⚠️ **AI Mentor Error**: ${lastAiError}...`, // Shows old error
    suggestions: [...]
  };
}
```

**Suggested fix**: Clear `lastAiError` at the start of each successful API response:
```javascript
if (lastAiError && !apiKey) {
  return { text: `⚠️ **AI Mentor Error**: ${lastAiError}...`, ... };
}
```

---

### Bug #H9: `getMe` Missing `next` Parameter

| | |
|---|---|
| **File** | `backend/src/controllers/authController.js:529-534` |
| **Severity** | MEDIUM |
| **Status** | NOT FIXED |

**Problem**: The `getMe` handler is declared as `async (req, res)` without the `next` parameter. If any code inside throws, Express has no error handler.

**Current code**:
```javascript
exports.getMe = async (req, res) => { // ← No next
  res.json({
    success: true,
    data: { user: req.user },
  });
};
```

**Suggested fix**: Remove `async` (no await) or add `next`:
```javascript
exports.getMe = (req, res) => { // No async needed
  res.json({ success: true, data: { user: req.user } });
};
```

---

### Bug #H10: `refreshToken` Silently Catches All Errors

| | |
|---|---|
| **File** | `backend/src/controllers/authController.js:519-521` |
| **Severity** | LOW |
| **Status** | NOT FIXED |

**Problem**: The catch block returns 401 but doesn't log the error, making debugging production issues difficult.

**Current code**:
```javascript
} catch (error) {
  return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
}
```

**Suggested fix**: Add logging:
```javascript
} catch (error) {
  console.error('[refreshToken]', error.message);
  return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
}
```

---

### Bug #H11: Mock Test Difficulty Filter Ignored for `topic` Type

| | |
|---|---|
| **File** | `backend/src/store/localDataStore.js:490-495` |
| **Severity** | LOW |
| **Status** | NOT FIXED |

**Problem**: When `testType === 'topic'`, questions are selected by topic keyword match but the `difficulty` filter is completely ignored.

**Current code**:
```javascript
if (t.testType === 'topic') {
  const exact = pool.filter(q => q.topic === t.topic);
  pool = exact.length >= 2 ? exact : pool.filter(q =>
    t.topic?.split('&').some(kw => q.topic?.toLowerCase().includes(kw.trim().toLowerCase()))
  );
  // ← difficulty filter skipped for topic type!
} else {
  const byDiff = pool.filter(q => q.difficulty === t.difficulty);
  pool = byDiff.length >= 3 ? byDiff : pool;
}
```

**Suggested fix**: Apply difficulty filter within topic type pool:
```javascript
if (t.testType === 'topic') {
  let topicPool = pool.filter(q => q.topic === t.topic);
  if (topicPool.length < 2) topicPool = pool.filter(q =>
    t.topic?.split('&').some(kw => q.topic?.toLowerCase().includes(kw.trim().toLowerCase()))
  );
  const byDiff = topicPool.filter(q => q.difficulty === t.difficulty);
  pool = byDiff.length >= 3 ? byDiff : topicPool;
}
```

---

## HIGH PRIORITY SUMMARY TABLE

| # | File | Line | Severity | Description | Fixed? |
|---|------|------|----------|-------------|--------|
| H1 | mockStore.js | 17 | HIGH | Silent write error swallowing | No |
| H2 | localDataStore.js | 146 | HIGH | No SIGINT flush for notes/progress | Pending |
| H3 | FloatingAIAssistant.jsx | 144 | HIGH | Wrong data source for AI context | No |
| H4 | ocrService.js | 16 | HIGH | No max backoff cap | No |
| H5 | localDataStore.js | 314 | HIGH | Debounced progress saves | No |
| H6 | ocrService.js | 35 | MEDIUM | Retry all HTTP errors | No |
| H7 | ai.js | 516 | MEDIUM | HTTP 200 for errors | No |
| H8 | ai.js | 775 | MEDIUM | Stale lastAiError | No |
| H9 | authController.js | 529 | MEDIUM | Missing next param | No |
| H10 | authController.js | 519 | LOW | Silent error catch | No |
| H11 | localDataStore.js | 490 | LOW | Difficulty filter ignored for topic type | No |

---

## RECOMMENDED IMMEDIATE ACTIONS

1. **Fix H1** — Silent error swallowing is the most dangerous pattern — data loss is invisible
2. **Fix H3** — AI context is the core value proposition; broken context degrades AI quality
3. **Fix H7** — HTTP 200 for errors breaks API contract and causes frontend confusion
4. **Fix H4** — Uncapped backoff could cause 8+ minute delays on OCR failures
5. **Fix H9** — Missing `next` param could crash the server on unhandled exceptions