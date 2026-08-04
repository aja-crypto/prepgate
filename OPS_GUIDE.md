# GateNexa Operations Guide

## Architecture

```
Frontend (Vercel) → Backend (Render/docker) → MongoDB Atlas
                          ↓
                    OpenRouter (AI)
                          ↓
                    Cloudinary (PDFs)
                          ↓
                    SendGrid (Email)
```

## Quick Reference

| Item | Value |
|------|-------|
| Frontend | `https://gatenexa.in` |
| Backend API | `https://gatenexa-api.onrender.com` |
| Health | `GET /health` |
| Readiness | `GET /health/readiness` |
| Metrics | `GET /health/metrics` |
| MongoDB | Atlas M0 free tier |
| Sentry | Configured via `SENTRY_DSN` |

## Deployment

### Backend (Render)
```bash
# Push to main branch triggers auto-deploy
git push origin main

# Manual deploy via Render dashboard
# Settings → Deploy → Clear build cache & deploy
```

### Frontend (Vercel)
```bash
# Push triggers auto-deploy
git push origin main

# Manual
vercel --prod
```

## Startup Validation

On startup, the backend checks:
1. `JWT_SECRET` — must be set, not a placeholder
2. `JWT_REFRESH_SECRET` — must be set, not a placeholder
3. `CORS_ORIGIN` — must be set, not a placeholder
4. `MONGO_URI` — must be set, not a placeholder
5. `BACKEND_URL` — must be set, not a placeholder
6. MongoDB connection — warns if not connected
7. Admin account — warns if missing

The server **exits immediately** if any critical env var is missing.

## Scaling

| Concurrent Users | Pool Size | Backend Instances | Notes |
|-----------------|-----------|-------------------|-------|
| < 100 | 25 | 1 | Default config |
| 100-500 | 50 | 2-3 | Enable Redis |
| 500+ | 100 | 3+ | CDN + S3 required |

## Dependencies

| Service | SLA | Impact if Down | Mitigation |
|---------|-----|----------------|------------|
| MongoDB Atlas | 99.95% | Predictor, auth, study data fail | Local fallback for auth |
| OpenRouter | 99.5% | AI features fall back to heuristic | Built-in fallback |
| Cloudinary | 99.9% | PDF viewing fails | N/A |
| SendGrid | 99.9% | Emails not sent | SMTP errors logged |
| Render | 99.99% | Backend down | Redeploy from dashboard |
| Vercel | 99.99% | Frontend down | Edge network serves cached |
