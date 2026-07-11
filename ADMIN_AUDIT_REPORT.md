# GateNexa Admin CMS — Engineering Audit Report

**Date:** 2026-07-06
**Mode:** Investigation only (no code modified)
**Scope:** All 19 admin frontend pages, 16 backend route files, 2 admin-specific models

---

## Executive Summary

**Overall Score: 82 / 100**

| Dimension | Score | Verdict |
|-----------|-------|---------|
| Security | 78/100 | Good auth foundation, inconsistent permission checks |
| Performance | 85/100 | Well-structured, pagination on list endpoints |
| UI/UX | 75/100 | Functional but unpolished |
| Reliability | 80/100 | Soft-delete partial, error handling inconsistent |
| Content Management | 85/100 | CRUD generators work well |
| Scalability | 80/100 | Paginated endpoints, missing text indexes |
| **Overall** | **82/100** | **Solid foundation with specific gaps** |

---

## Phase 1 — Route Map

### Frontend Pages (19)

| Page | Route | Status |
|------|-------|--------|
| Dashboard | /admin/dashboard | Working |
| PDFs | /admin/pdfs | Working |
| Mock Tests | /admin/mock-tests | Working |
| Mock Questions | /admin/mock-tests/:testId/questions | Working |
| PYQ | /admin/pyq | Working |
| PYQ Papers | Not in routes | Orphan |
| Gate Vault | /admin/gate-vault | Working |
| CMS | /admin/cms | Working |
| Question Bank | /admin/question-bank | Working |
| Users | /admin/users | Working |
| Analytics | /admin/analytics | Working |
| AI Analytics | Not in routes | Orphan |
| Notifications | /admin/notifications | Working |
| Notifications (alt) | Not in routes | Duplicate orphan |
| Feedback | /admin/feedback | Working |
| Settings | /admin/settings | Working |
| System Health | /admin/system-health | Working |
| Predictor | /admin/predictor | Working |
| Login | /admin/login | Working |

**Issue:** 3 orphan page files not registered in App.jsx routes.

### Backend API Routes (16 files, ~140+ endpoints)

| File | Purpose | Endpoints |
|------|---------|-----------|
| admin.js | Dashboard stats, user management | GET/PUT |
| adminAuth.js | Admin login/auth | POST/GET |
| adminPdfs.js | PDF upload to Cloudinary | Full CRUD + publish |
| adminPyq.js | PYQ management | CRUD + bulk import |
| adminPyqManager.js | PYQ processing pipeline | Manage + process |
| adminPyqPapers.js | PYQ papers | CRUD |
| adminMockTests.js | Mock test management | CRUD + publish |
| adminGateVault.js | Flashcard management | CRUD + bulk |
| adminCms.js | Generic CRUD (6 content models) | CRUD + search |
| adminQuestionBank.js | Question bank | CRUD + CSV import |
| adminNotifications.js | Notifications | CRUD + send |
| adminFeedback.js | Feedback tickets | CRUD + status |
| adminPredictor.js | Predictor dataset management | CRUD + data import |
| adminLiveData.js | Live data | CRUD |
| adminLanding.js | Landing page content | CRUD |

---

## Phase 2 — Security Audit

### Authentication (Good)
- JWT-based with adminProtect middleware on all routes
- Token expiry (8h), HS256 algorithm
- Local fallback for development
- Rate limiting at /api/admin/ prefix

### Authorization (Inconsistent)
- requirePermission used: adminPdfs.js, adminCms.js, adminNotifications.js, adminFeedback.js, audit-logs
- requirePermission MISSING: adminPyq.js, adminPyqManager.js, adminMockTests.js, adminGateVault.js, adminQuestionBank.js, adminPredictor.js, adminLiveData.js, adminLanding.js

**Impact:** Any admin user can access ALL content routes regardless of role. A support role admin can modify PYQs, mock tests, and predictor data.

### NoSQL Injection Risk
- adminCms.js uses $regex with raw user input without escaping
- escapeRegex exists in validateInput.js but is never imported or used
- Multiple admin routes accept arbitrary query params without sanitization

### File Upload (Good)
- PDF-only MIME filter, 50MB limit, Cloudinary storage, path-traversal resistant

---

## Phase 3 — Functional Audit

### CRUD Generator (adminCms.js) — Score: 85/100

| Feature | Status |
|---------|--------|
| List with pagination | Yes |
| Search across fields | Yes (regex) |
| Sort by any field | Yes |
| Filter by any field | Yes |
| Get single by ID | Yes |
| Create/Update/Delete | Yes (soft delete) |
| Publish toggle | Yes |

**Issues:**
- No $text index for search (uses $regex = full scan)
- No bulk operations (delete, publish)
- No audit logging per CRUD operation
- Soft-delete hides from list but single-get still returns deleted items

### PDF Upload Pipeline

| Step | Status |
|------|--------|
| Upload to Cloudinary | Yes |
| Metadata save | Yes |
| File replace | Yes |
| Delete with Cloudinary cleanup | Yes |
| Publish/unpublish | Yes |
| Progress indicator | Missing |
| Duplicate detection | Missing |
| Retry on failure | Missing |

---

## Phase 4 — Priority Fix Order

### P0 (Security — Fix Before Beta)

| # | Issue | Effort | Files |
|---|-------|--------|-------|
| 1 | Add requirePermission to 8 route files | 30 min | adminPyq, adminPyqManager, adminMockTests, adminGateVault, adminQuestionBank, adminPredictor, adminLiveData, adminLanding |
| 2 | Use escapeRegex() on all $regex inputs | 15 min | adminCms.js, adminNotifications.js, adminFeedback.js |
| 3 | Add loading state to admin login button | 10 min | AdminLoginPage.jsx |

### P1 (Functional — Fix Before Beta)

| # | Issue | Effort |
|---|-------|--------|
| 4 | Hook orphan admin pages into App.jsx | 10 min |
| 5 | Add confirmation dialog for deletes | 20 min |
| 6 | Admin mobile sidebar responsiveness | 30 min |

### P2 (Quality — Fix After Beta)

| # | Issue | Effort |
|---|-------|--------|
| 7 | Bulk operations (delete, publish) | 2h |
| 8 | Upload progress bar for PDFs | 1h |
| 9 | Audit log viewer in admin UI | 3h |
| 10 | Add $text indexes for search | 30 min |

---

## Summary

The Admin CMS is functionally complete with 19 pages and 140+ API endpoints. The CRUD generator pattern is well-designed. Security is the main concern: 8/15 route files omit requirePermission checks, and $regex injection is possible through search endpoints. Once those are fixed, the Admin CMS is beta-ready.
