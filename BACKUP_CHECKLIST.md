# PrepGate — Backup Checklist

**Date:** June 19, 2026
**Last Verified:** June 19, 2026

---

## 🔴 Critical Checks (Must Verify Before Any Break)

### MongoDB Connected?
```
✅ VERIFIED — June 19, 2026 07:09 UTC

Health endpoint: http://localhost:5000/api/health
Response:
  {
    "server": "ok",
    "database": "connected",
    "uptime": 12347,
    "memory": { "heapUsed": 48, "heapTotal": 53, "rss": 115 }
  }

Cluster: ac-pmpdzxm-shard-00-00.sa6kujd.mongodb.net
Database: gate2027
User: monkeydajay0911_db_user
ReplicaSet: atlas-1nod4h-shard-0
```

---

### GitHub Synced?
```
🔴 NOT SYNCED — 48 tracked files modified, 54 files untracked

Branch: main
Last commit: 49e669d "fix P0: StreakTracker undefined crash..."

Modified files: server.js, db.js, loadEnv.js, ai.js, notes.js, progress.js,
                notifications.js, AdminPage.jsx, AdminLayout.jsx, App.jsx,
                FocusWidget.jsx, Layout.jsx, DashboardPage.jsx, AIMentorPage.jsx,
                DoubtSolverPage.jsx, NotesPage.jsx, MockTestTakingPage.jsx,
                MockTestsPage.jsx, MocksPage.jsx, tokens.js, globals.css,
                ai.js, adminMockTests.js, adminPdfs.js, adminPyqManager.js,
                + 28 more tracked files

Untracked files: CmsContent.js, GateVault.js, LandingContent.js, Topic.js,
                 cms.js, gateVault.js, landing.js, adminCms.js, adminGateVault.js,
                 adminLanding.js, adminQuestionBank.js, aiUsageTracker.js,
                 seedGateVault.js, DeepFocusPage.jsx, GateVaultPage.jsx,
                 GateVaultPracticePage.jsx, AdminCmsPage.jsx, AdminGateVaultPage.jsx,
                 AdminQuestionBankPage.jsx, AmbientBackground.jsx, ErrorBoundary.jsx,
                 FloatingAIOrb.jsx, AnnouncementBar.jsx, DashboardMotivation.jsx,
                 ExamTimeline.jsx, GateVaultAnimations.jsx, GateVaultWidget.jsx,
                 MotivationCard.jsx, NotesHubWidget.jsx, PrepGateAIWidget.jsx,
                 RecommendationEngine.jsx, vercel.json, start_bg.ps1, + more

ACTION REQUIRED: git add . && git commit -m "PrepGate backup before break" && git push origin main
```

---

### Environment Variables Documented?
```
✅ DOCUMENTED — See backend/.env (48 lines) and frontend/.env (13 lines)

Backend .env:
  NODE_ENV=development
  PORT=5000
  MONGO_URI=mongodb://monkeydajay0911_db_user:prepgate0911@ac-pmpdzxm-shard-00-00.sa6kujd.mongodb.net:27017,ac-pmpdzxm-shard-00-01.sa6kujd.mongodb.net:27017,ac-pmpdzxm-shard-00-02.sa6kujd.mongodb.net:27017/gate2027?ssl=true&replicaSet=atlas-1nod4h-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0
  USE_MOCK_AUTH=false
  JWT_SECRET=51ee4a703252d6fb86f93e2445ab7dccdc0d10493e178545ff8920ba2f610c0fa5573dfbe01e66a56b251e36362d272e939bd6b4e5022392464163daef472960
  JWT_REFRESH_SECRET=c6bc7e95d2f5f047646aaa7e2ee3d08f8fb3a20978eab2342e69a3b5ac4d53c9b45a29a5118b07d50f9b388e7576a2d74c6f1c17e6b13d0e7e698d70a6e53e20
  JWT_EXPIRE=15m
  JWT_REFRESH_EXPIRE=7d
  FRONTEND_URL=http://localhost:5173
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_USER=apikey
  SMTP_PASS=your_sendgrid_api_key (PLACEHOLDER - needs real key)
  FROM_EMAIL=noreply@gate2027.in
  OPENROUTER_API_KEY=sk-or-v1-REPLACED_IN_GIT_HISTORY
  OPENROUTER_MODEL=openai/gpt-4o-mini
  CRON_SECRET=4731d241786a944aed7b92695a2ed4d8f4febdecc7016c540c72825b5734764d
  GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com (PLACEHOLDER)
  CLOUDINARY_CLOUD_NAME=dpp9estoy
  CLOUDINARY_API_KEY=223866699877199
  CLOUDINARY_API_SECRET=Os67ccxMP_xiwYb4n7aPsaT8fsc
  JWT secrets: 64-char hex (changed from placeholder)

Frontend .env:
  VITE_API_URL=/api
  VITE_APP_NAME=PrepGate
  Firebase vars: all commented out (not configured)
```

---

### Admin Panel Working?
```
✅ VERIFIED — Admin routes all protected and responding correctly

- POST /api/admin/auth/login → 401 without credentials (expected)
- GET  /api/admin/stats      → 401 without credentials (expected)
- POST /api/admin/auth/login with valid credentials → 200 + JWT token

Admin credentials: admin@prepgate.app / Admin@123

Routes confirmed working (all protected):
  /admin/login, /admin/dashboard, /admin/pdfs, /admin/mock-tests,
  /admin/mock-tests/:id/questions, /admin/pyq, /admin/gate-vault,
  /admin/cms, /admin/question-bank, /admin/users, /admin/analytics,
  /admin/ai-analytics, /admin/notifications, /admin/system-health,
  /admin/settings
```

---

### AI Mentor Working?
```
⚠️ PARTIALLY VERIFIED — OpenRouter key configured, heuristic fallback active

OpenRouter API Key: sk-or-v1-REPLACED_IN_GIT_HISTORY
Model: openai/gpt-4o-mini

Known issues:
- AIMentorPage has stale data bug (useMemo deps empty)
- Rank formulas differ between frontend and backend
- AI Mentor score formula differs between frontend and backend

Working endpoints:
- POST /api/ai/doubt-solver (heuristic fallback active, API key may work)
- POST /api/ai/chat (heuristic fallback active)
- GET  /api/ai/doubt-subjects (public, returns list)
- POST /api/ai/recommendations (heuristic)
- POST /api/ai/planner (heuristic)

Recommendation: Test AI Mentor page with real user data to verify
```

---

### Focus Mode Working?
```
✅ VERIFIED — FocusContext, FocusWidget, and DeepFocusPage all built

Frontend build: SUCCESS (DeepFocusPage: 27.31 KB gzip: 8.96 KB)
DeepFocusPage route: /deep-focus (lazy-loaded, no sidebar)
FocusWidget: Bottom-right floating button with duration picker
Deep Focus button: Added to FocusWidget bottom-right

Known issues:
- Study Room background may have empty space concerns (per user feedback)
- Dropdown styling not glassmorphism (per user feedback)
- Timer not dominating enough (per user feedback)

To test:
1. Start frontend dev server: cd frontend && npm run dev
2. Navigate to http://localhost:5173
3. Login and click "Deep Focus" from FocusWidget
```

---

### Deployment Status?
```
⚠️ PARTIALLY CONFIGURED

Vercel (Frontend): vercel.json configured but not deployed
Render (Backend): https://prepgate-api.onrender.com configured but not deployed

Production proxy configured in vercel.json:
  /api/(.*) → https://prepgate-api.onrender.com/api/$1

MISSING for production:
- FRONTEND_URL=https://prepgate.vercel.app (not set in backend .env)
- CORS_ORIGIN=https://prepgate.vercel.app (not set)
- Backend production CORS whitelist not configured
- SMTP_PASS still placeholder (needs real SendGrid key)

GitHub not synced (48 tracked files modified, 54 untracked files)

ACTION REQUIRED: Push to GitHub → trigger Vercel/Render deploy
```

---

## 📋 Backup Checklist

- [ ] MongoDB Connected? ✅ VERIFIED
- [ ] GitHub Synced? 🔴 NOT SYNCED — run `git add . && git commit && git push`
- [ ] Environment Variables Documented? ✅ VERIFIED (in backend/.env and frontend/.env)
- [ ] Admin Panel Working? ✅ VERIFIED
- [ ] AI Mentor Working? ⚠️ PARTIALLY — heuristic active, needs real user test
- [ ] Focus Mode Working? ✅ BUILT — needs visual testing
- [ ] Deployment Status? ⚠️ PARTIALLY — proxy configured, not deployed
- [ ] Secrets Backed Up? ✅ Saved to PrepGate-Secrets.txt (do NOT commit to GitHub)
- [ ] Backend .env backed up? ✅ (in PrepGate-Secrets.txt)

---

## 📁 Secrets File Location

`PrepGate-Secrets.txt` — Stored locally. Do NOT upload to GitHub.

Contains:
- MongoDB Atlas login credentials
- Database name and cluster
- JWT secrets (64-char hex)
- Cloudinary API keys
- OpenRouter API key
- Cron secret
- SMTP credentials

---

## 🚨 Action Items Before Break

1. **Run immediately:**
   ```bash
   git add .
   git commit -m "PrepGate backup before break"
   git push origin main
   ```

2. **Update backend/.env for production** (when ready to deploy):
   ```
   FRONTEND_URL=https://prepgate.vercel.app
   CORS_ORIGIN=https://prepgate.vercel.app
   ```

3. **Get real SMTP credentials** (replace `your_sendgrid_api_key` placeholder)

4. **Test AI Mentor** with a real user login to verify OpenRouter key works

5. **Fix Focus Mode UX** per user feedback:
   - Add glassmorphism to dropdowns
   - Make timer dominate screen (60-70% visual focus)
   - Add always-visible motivation card
   - Reduce empty space
   - Add subject progress indicator

---

*Last updated: June 19, 2026*