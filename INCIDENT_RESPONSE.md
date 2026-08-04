# GateNexa Incident Response Guide

## Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|---------------|---------|
| S0 | Complete outage | 15 min | MongoDB down, backend crash |
| S1 | Major feature broken | 30 min | Predictor returns errors, login broken |
| S2 | Partial degradation | 2 hours | AI chat slow, analytics delayed |
| S3 | Minor issue | 24 hours | UI glitch, typo |

## Runbooks

### S0: Backend Unreachable

**Symptoms**: Health endpoint returns 503, frontend shows 502

**Causes**:
- Render instance crashed
- Out of memory
- Port conflict

**Steps**:
```bash
1. Check Render dashboard → Logs
2. Check Sentry for recent errors
3. Restart backend instance from Render dashboard
4. If persistent, check `MONGO_URI` and `JWT_SECRET` env vars
5. Rollback to previous deploy: Render → Deploy → Last successful deploy
```

### S0: MongoDB Unavailable

**Symptoms**: Health shows `database: disconnected`, auth fails

**Causes**:
- Atlas cluster paused (free tier)
- Network ACL changed
- Credentials rotated without updating .env

**Steps**:
```bash
1. Check Atlas dashboard → Clusters → Security
2. Verify IP whitelist includes Render's IP
3. Check MONGO_URI in Render environment variables
4. Restart backend (triggers reconnect with retry)
5. If Atlas is paused: Resume cluster from Atlas dashboard
```

### S1: Predictor Returning Errors

**Symptoms**: Users report "Prediction failed" or empty results

**Causes**:
- CCMT/Gate dataset missing
- Cache corruption
- Category not found

**Steps**:
```bash
1. Check backend logs for `[Predictor]` or `[Engine]` messages
2. Verify GateYear collection has data: `db.gateyears.find().count()`
3. Verify CcmtCutoff collection has data: `db.ccmtcutoffs.find().count()`
4. Check PredictionCache for corruption: `db.predictioncaches.deleteMany({})`
5. Run seed scripts if data empty: `node src/scripts/seedPredictorData.js`
```

### S1: AI Features Down

**Symptoms**: AI chat returns "AI service error", planner falls back

**Causes**:
- OpenRouter API key expired
- OpenRouter rate limit hit
- Network connectivity

**Steps**:
```bash
1. Check backend logs for `[callAiApi]` messages
2. Verify OPENROUTER_API_KEY env var is set
3. Test key: curl -H "Authorization: Bearer $KEY" https://openrouter.ai/api/v1/auth/key
4. Check OpenRouter dashboard for rate limit status
5. If key expired: generate new key at openrouter.ai/keys
```

### S2: Email Not Sending

**Symptoms**: Password reset, verification emails not received

**Causes**:
- SendGrid API key invalid
- SMTP credentials wrong
- SendGrid daily limit reached

**Steps**:
```bash
1. Check backend logs for `[sendEmail]` errors
2. Verify SMTP_PASS env var
3. Check SendGrid dashboard → Activity feed
4. Test SMTP connection manually
```

### S2: High Memory Usage

**Symptoms**: Backend slow, health shows high RSS

**Causes**:
- Predictor cache growing too large
- Memory leak in AI conversation handler
- Too many concurrent requests

**Steps**:
```bash
1. Check `/health/metrics` for memory values
2. Restart backend instance (clears in-memory caches)
3. If persistent: reduce `MONGODB_MAX_POOL_SIZE`
4. Enable Redis to move caches out of process
```

## Recovery Procedures

### Snapshot Restore (MongoDB Atlas)

```bash
1. Atlas UI → Clusters → Restore
2. Select snapshot (daily, 7-day retention)
3. Choose "Restore to new cluster" or "Restore to current"
4. Wait for restore to complete (5-30 min depending on size)
5. Update MONGO_URI in Render if new cluster
6. Restart backend
```

### Point-in-Time Recovery (if M10+)

```bash
1. Atlas UI → Clusters → Restore
2. Select "Point in Time"
3. Choose timestamp
4. Follow same steps as snapshot restore
```

### Full Application Restore

```bash
1. # Backend
   git checkout <last-known-good-tag>
   docker build -t gatenexa-backend:rollback ./backend
   docker-compose up -d backend

2. # Database
   Restore MongoDB from Atlas snapshot

3. # Verify
   curl https://gatenexa-api.onrender.com/health
   curl https://gatenexa.in/
```

## Communication Templates

### S0 Outage Notice
```
SUBJECT: [GateNexa] Service Outage — Investigating
We are aware that GateNexa is currently unavailable. We are investigating and will provide updates within 15 minutes.
```

### S1 Degradation Notice
```
SUBJECT: [GateNexa] Partial Service Degradation
[Feature] is currently experiencing issues. Affected users may see [symptoms].
We have identified the cause ([brief cause]) and are deploying a fix.
```

### All Clear
```
SUBJECT: [GateNexa] Service Restored
The issue affecting [feature] has been resolved. All systems are operating normally.
Root cause: [cause]
```

## Post-Mortem Template

```markdown
## Incident: [TITLE]
Date: YYYY-MM-DD
Duration: HH:MM
Severity: S0/S1/S2/S3

### Summary
One-line description of what happened.

### Timeline
- HH:MM — First detection (by monitoring/user report)
- HH:MM — Investigation started
- HH:MM — Root cause identified
- HH:MM — Fix deployed
- HH:MM — All clear

### Root Cause
What caused the incident.

### Impact
- Users affected: X
- Downtime: Y minutes
- Data loss: None / Z records

### Action Items
- [ ] Prevent recurrence (engineering fix)
- [ ] Improve detection (monitoring/alert)
- [ ] Improve response time (runbook/training)
```
