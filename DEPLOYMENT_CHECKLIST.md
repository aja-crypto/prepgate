# GateNexa Deployment Checklist (v1.0.0-beta)

## Pre-Deployment

### Security (Manual — You)
- [ ] MongoDB Atlas: rotate `monkeydajay0911_db_user` password
- [ ] OpenRouter: revoke old API key, create new one
- [ ] Cloudinary: rotate API secret
- [ ] JWT: generate new `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Update `backend/.env` with all new values
- [ ] Verify `.env` is NOT committed to git

### Build
- [ ] `npm run build` passes (0 errors)
- [ ] `node --check backend/server.js` passes

### Environment
- [ ] `NODE_ENV=production` on deployment
- [ ] `FRONTEND_URL` set to production domain
- [ ] `CORS_ORIGIN` includes production domain
- [ ] `MONGO_URI` uses rotated credentials
- [ ] `JWT_SECRET` updated
- [ ] `OPENROUTER_API_KEY` updated
- [ ] `CLOUDINARY_API_SECRET` updated

## Post-Deployment Verification

### Backend
- [ ] `/api/health` returns `database: "connected"`
- [ ] Auth: login/register works
- [ ] AI Predictor: returns predictions for 50+, 70+, 90 marks
- [ ] File upload: PDF/image upload succeeds

### Frontend
- [ ] Login/register flow works
- [ ] Dashboard loads without errors
- [ ] AI Predictor returns results
- [ ] GateVault loads and practice works
- [ ] Mobile: all pages render without overflow

### Regression
- [ ] Run `tests/predictor-validation-suite.ps1` — all pass
- [ ] Verify RC-1 fixes: sidebar link, tab remount, dashboard sort, etc.

## Beta Launch

### Monitoring
- [ ] Enable backend logging (console/ file)
- [ ] Check error rates after 24h
- [ ] Monitor MongoDB connection pool

### Feedback
- [ ] Activate feedback form or in-app feedback channel
- [ ] Set up email for user reports

### Rollback
- [ ] Previous working build tagged in git
- [ ] Quick rollback procedure documented
