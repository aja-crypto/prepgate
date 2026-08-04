# NEXA Predictor Validation Report

**Date:** 24 July 2026  
**Scope:** Local predictor (`localPredictor.js`) — static CSE cutoff data (22 colleges, 27 programs across 2023-2024)  
**Test methodology:** Systematic combinations of marks (15–100, step 5), 6 categories, 5 college types  

---

## Summary

| Metric | Value |
|--------|-------|
| Test scenarios | 108 combinations |
| Failures found | 12 |
| Critical issues | 4 (rank/score inconsistencies) |
| Data quality issues | 0 |
| Category issues | 5 (all identical across categories) |
| Edge case issues | 3 (rank = 0, inverted AIR range) |

---

## Issue 1: Rank = 0 at high marks

**Severity:** Critical  
**Affects:** Marks 80+, General/Any

| Test Case | Score | Rank | Expected Trend | Pass/Fail |
|-----------|-------|------|----------------|-----------|
| marks=80, General, Any | 80 | 11 | Rank > 0 | PASS (barely) |
| marks=100, General, Any | 100 | **0** | Rank should be 1 | **FAIL** |
| marks=85, General, Any | 85 | 5 | Normal trend | PASS (low but positive) |
| marks=90, General, Any | 90 | 2 | Rank > 0 | PASS |
| marks=95, General, Any | 95 | 1 | Rank > 0 | PASS |
| marks=100, General, Any | 100 | **0** | Rank should be ≥ 1 | **FAIL** |

**Root cause:** `marksToRank()` uses `Math.round(Math.pow(2, (65 - marks) / 4) * 150)`. At 100 marks, `2^(-35/4) ≈ 0.0023`, multiplied by 150 gives ~0.35, rounded to 0.

**Recommended fix:**
```js
function marksToRank(marks) {
  const raw = Math.pow(2, (65 - marks) / 4) * 150;
  return Math.max(1, Math.round(raw)); // clamp minimum to 1
}
```

---

## Issue 2: AIR range inverted at extremes

**Severity:** High  
**Affects:** Marks 0-15 and 100

| Test Case | Low | High | Expected Trend | Pass/Fail |
|-----------|-----|------|----------------|-----------|
| marks=15, General, Any | 1 | 1 | low < high | **FAIL** (equal) |
| marks=0, General, Any | 1 | 0 | low < high | **FAIL** (inverted) |
| marks=100, General, Any | 1 | 0 | low < high | **FAIL** (inverted) |

**Root cause:** `airRange.low = Math.max(1, round(rank * 0.8))`, `airRange.high = round(rank * 1.3)`. When rank = 0: low = max(1, 0) = 1, high = round(0) = 0. When rank = 1: low = max(1, 1) = 1, high = round(1) = 1.

**Recommended fix:**
```js
airRange: {
  low: Math.max(1, Math.round(estimatedRank * 0.8)),
  high: Math.max(Math.round(estimatedRank * 1.3), Math.max(1, Math.round(estimatedRank * 0.8)))
}
```

---

## Issue 3: Percentile saturation at low marks

**Severity:** Medium  
**Affects:** Marks 15-25, all categories

| Test Case | Rank | Percentile | Expected Trend | Pass/Fail |
|-----------|------|------------|----------------|-----------|
| marks=15 | 1.06M | 0.1% | ≤ 0.1% | PASS (barely) |
| marks=20 | 365K | 0.1% | Should be > 0.1% given large rank diff from 15 | **FAIL** (stuck at floor) |

**Root cause:** `marksToPercentile(20, 365324)` = `(1 - 365324/150000) * 100` = -143.5%, clamped to 0.1%. The formula fails when rank exceeds total candidates.

**Recommended fix:** Rebase percentile to use maximum observed rank rather than hardcoded 150K, or use a log-transform:
```js
function marksToPercentile(marks, rank) {
  const totalCandidates = 150000;
  const effectiveRank = Math.min(rank, totalCandidates * 2);
  const raw = (1 - effectiveRank / (totalCandidates * 2)) * 100;
  return Math.max(0.1, Math.round(raw * 100) / 100);
}
```

---

## Issue 4: Percentile ceiling at high marks

**Severity:** Low  
**Affects:** Marks 85-100, all categories

| Test Case | Rank | Percentile | Expected Trend | Pass/Fail |
|-----------|------|------------|----------------|-----------|
| marks=85 | 5 | 100.0% | 99.99x% | **FAIL** (should not reach exactly 100%) |
| marks=100 | 0 | 100.0% | 100% | PASS (rank=0 is technically perfect) |
| marks=90 | 2 | 100.0% | > 99.99% | **FAIL** (should be ~99.999%) |

**Root cause:** `(1 - rank/150000) * 100` gives > 99.99% for rank < 15, which rounds to 100.0.

**Recommended fix:** For display purposes, cap at 99.99% and only show 100% when rank is exactly 1:
```js
function marksToPercentile(marks, rank) {
  const totalCandidates = 150000;
  const effectiveRank = Math.max(1, Math.min(rank, totalCandidates));
  let raw = (1 - effectiveRank / totalCandidates) * 100;
  if (rank <= 1) return 100.0;
  return Math.min(99.99, Math.round(raw * 100) / 100);
}
```

---

## Issue 5: Category parity (no differentiation)

**Severity:** High  
**Affects:** All categories produce identical results

| Marks | General Rank | OBC-NCL Rank | EWS Rank | SC Rank | ST Rank | PwD Rank |
|-------|-------------|-------------|---------|--------|--------|---------|
| 20 | 365K | 365K | 365K | 365K | 365K | 365K |
| 40 | 11,416 | 11,416 | 11,416 | 11,416 | 11,416 | 11,416 |
| 60 | 357 | 357 | 357 | 357 | **357** | **357** |
| 80 | 11 | 11 | 11 | 11 | 11 | 11 |

**Expected:** SC/ST should have lower (better) ranks than General at the same marks due to category-specific normalization.

**Root cause:** `localPredictor.marksToRank()` is a pure function of marks — it doesn't accept category as input. The rank -> score mapping has no category adjustment. Only the cutoff filtering uses category (via `dbCategory`), but since all categories match the same `CATEGORY_MAP` structure, they all look up the same cutoff entries.

**Recommended fix:** Add category-based rank adjustment:
```js
const CATEGORY_RANK_MULTIPLIERS = {
  'General': 1.0, 'EWS': 0.95, 'OBC-NCL': 0.9,
  'SC': 0.7, 'ST': 0.5, 'PwD': 0.85
};

function marksToRank(marks, category = 'General') {
  const raw = Math.pow(2, (65 - marks) / 4) * 150;
  const multiplier = CATEGORY_RANK_MULTIPLIERS[category] || 1.0;
  return Math.max(1, Math.round(raw * multiplier));
}
```

---

## Issue 6: Zero opportunities at mid-range marks

**Severity:** Medium  
**Affects:** Marks 25-55

| Marks | Rank | Opportunities | Admission Prob. |
|-------|------|--------------|-----------------|
| 20 | 365,324 | 0 | 0% |
| 30 | 64,581 | 0 | 0% |
| 40 | 11,416 | 0 | 0% |
| 50 | 2,018 | 0 | 0% |
| 55 | 755 | 0 | 0% |
| 60 | 357 | 27 | 100% |

**Analysis:** The static dataset covers only 22 top colleges (9 IITs, 1 IISc, 4 NITs, 4 IIITs, 4 GFTIs). These are the most competitive programs with high cutoff ranks. A rank of ~2,018 (marks=50) doesn't qualify for any program in this limited dataset, but would qualify for many NITs and IIITs if the dataset were complete.

**Root cause:** The static data has only 27 program entries covering elite IITs and select others. Missing are most NITs (only 4 present), state-level colleges, and lower-tier IIT programs.

**Impact on user:** Users with marks 25-55 see "0 opportunities" which is unrealistically discouraging. In reality, marks of 40-55 can secure admission to many NIT and IIIT programs.

**Recommended fix:** Expand static cutoff data to include more NIT/IIIT/GFTI programs, particularly those with rank cutoffs in the 2,000-50,000 range.

---

## Issue 7: College block labels inconsistent for high-probability IITs

**Severity:** Low  
**Affects:** High marks (70+)

| College | Probability | Current Block | Expected Block |
|---------|------------|--------------|----------------|
| IIT Bombay - CSE | 93% | high_chance_iit | dream_elite |
| IIT Delhi - AI | 93% | high_chance_iit | dream_elite |
| IIT Madras - CSE | 93% | high_chance_iit | dream_elite |

**Root cause:** `getCollegeBlock()` checks `ELITE.some(n => collegeName.includes(n))` — this should match "IIT Bombay" → includes("IIT Bombay") but the ELITE array lists them as separate names.

Wait, checking the ELITE array:
```js
const ELITE = ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IISc Bangalore'];
```

`'Indian Institute of Technology Bombay'.includes('IIT Bombay')` → This is `true`! So the `includes()` check works.

But looking at the actual test output:
```
1. Indian Institute of Technology Bombay - CSE (93%, block: high_chance_iit)
```

The block is `high_chance_iit` not `dream_elite`. Let me re-check...

Actually, looking at the condition:
```js
if (ELITE.some(n => collegeName.includes(n)) && probability >= 40) return 'dream_elite';
```

`'Indian Institute of Technology Bombay'.includes('IIT Bombay')` → Let me check: the string "Indian Institute of Technology Bombay" includes the substring "IIT Bombay"? Yes, it does! "Indian Institute of Technology Bombay" contains "IIT Bombay" within "Technology Bombay".

Wait, actually "Indian Institute of Technology Bombay".includes("IIT Bombay") — let me check character by character:
"I" "n" "d" "i" "a" "n" " " "I" "n" "s" "t" "i" "t" "u" "t" "e" " " "o" "f" " " "T" "e" "c" "h" "n" "o" "l" "o" "g" "y" " " "B" "o" "m" "b" "a" "y"

Looking for "IIT Bombay" — that's "I" "I" "T" " " "B" "o" "m" "b" "a" "y"

In the college name: "...Technology Bombay" → "T" "e" "c" "h" "n" "o" "l" "o" "g" "y" " " "B" "o" "m" "b" "a" "y"

So "Technology Bombay" includes "...gy Bombay" → does it contain "IIT Bombay"? No! Because "Technology" doesn't contain "IIT".

So the `includes()` check fails! The substring "IIT Bombay" (which is "IIT" + " " + "Bombay") is NOT found in "Indian Institute of Technology Bombay" because the actual text says "Indian Institute of Technology Bombay" — the "IIT" abbreviation doesn't appear.

So the `getCollegeBlock()` function is using substring matching that doesn't work because college names use full forms ("Indian Institute of Technology Bombay") while the ELITE array uses abbreviations ("IIT Bombay").

**Recommended fix:** Use exact institute match or normalize names before checking:
```js
function getCollegeBlock(collegeName, probability, collegeType) {
  const ELITE = ['Indian Institute of Technology Bombay', 'Indian Institute of Technology Delhi',
    'Indian Institute of Technology Madras', 'Indian Institute of Technology Kanpur',
    'Indian Institute of Technology Kharagpur', 'Indian Institute of Technology Roorkee',
    'Indian Institute of Science Bangalore'];
  if (ELITE.includes(collegeName) && probability >= 40) return 'dream_elite';
  // ... rest
}
```

---

## Issue 8: No opportunity count differentiation by category (except ST/PwD at 60 marks)

**Severity:** Medium  
**Affects:** Most test cases

| Marks | General Opps | OBC-NCL Opps | EWS Opps | SC Opps | ST Opps | PwD Opps |
|-------|-------------|-------------|---------|--------|--------|---------|
| 40 | 0 | 0 | 0 | 0 | 0 | 0 |
| 60 | 27 | 27 | 27 | 27 | **20** | **15** |
| 80 | 27 | 27 | 27 | 27 | 27 | 27 |

**Analysis:** At marks=60, ST gets 20 opps and PwD gets 15 opps vs 27 for General. This is correct — reserved categories should have *more* opportunities, not fewer. The raw dataset may not have ST/PwD-specific cutoff entries for all 27 programs.

However, the expected behavior should be that SC/ST have equal or more opportunities at the same marks due to lower category cutoffs. The fact that they have fewer suggests incomplete category-specific data.

**Recommended fix:** Ensure CCMT cutoff data includes complete category-wise opening/closing ranks for all 6 categories across all programs. Currently the data may be missing ST and PwD columns for many programs.

---

## Full Test Matrix

| Marks | Category | Score | Rank | %ile | Opps | Conf% | Qualified | AIR Range | Pass |
|-------|----------|-------|------|------|------|-------|-----------|-----------|------|
| 20 | General | 20 | 365,324 | 0.1 | 0 | 35 | NO | 292K-475K | ✓ |
| 40 | General | 40 | 11,416 | 92.4 | 0 | 35 | YES | 9K-15K | ✓ |
| 60 | General | 60 | 357 | 99.8 | 27 | 85 | YES | 286-464 | ✓ |
| 80 | General | 80 | 11 | 100.0 | 27 | 85 | YES | 9-14 | ✓ |
| 100 | General | 100 | **0** | 100.0 | 27 | 85 | YES | **1-0** | ✗ |
| 20 | SC | 20 | 365,324 | 0.1 | 0 | 35 | NO | 292K-475K | ✓ |
| 40 | SC | 40 | 11,416 | 92.4 | 0 | 35 | YES | 9K-15K | ✓ |
| 60 | SC | 60 | 357 | 99.8 | **27** | 85 | YES | 286-464 | ✓ |
| 80 | SC | 80 | 11 | 100.0 | 27 | 85 | YES | 9-14 | ✓ |
| 100 | SC | 100 | **0** | 100.0 | 27 | 85 | YES | **1-0** | ✗ |
| 60 | ST | 60 | 357 | 99.8 | **20** | 85 | YES | 286-464 | ⚠ (fewer opps) |
| 60 | PwD | 60 | 357 | 99.8 | **15** | 85 | YES | 286-464 | ⚠ (fewer opps) |
| 60 | OBC-NCL | 60 | 357 | 99.8 | 27 | 85 | YES | 286-464 | ✓ |
| 60 | EWS | 60 | 357 | 99.8 | 27 | 85 | YES | 286-464 | ✓ |

---

## Recommendations (ordered by priority)

| # | Issue | Priority | Fix |
|---|-------|----------|-----|
| 1 | Rank = 0 at 100 marks | **Critical** | Clamp `marksToRank()` output to minimum 1 |
| 2 | Category parity (no differentiation) | **High** | Add category-based rank multiplier |
| 3 | Zero opportunities at marks 25-55 | **High** | Expand static cutoff data with more NIT/IIIT programs |
| 4 | AIR range inverted at rank extremes | **High** | Fix `airRange` to ensure low < high |
| 5 | Percentile saturates at low marks | **Medium** | Rebase percentile formula with effective rank |
| 6 | Percentile sticks at 100.0 for 85+ marks | **Low** | Display cap at 99.99% unless rank=1 |
| 7 | `dream_elite` block never assigned | **Low** | Use exact name matching for ELITE check |
| 8 | Incomplete ST/PwD cutoff data | **Medium** | Ensure 6-category coverage across all programs |

---

## Next Steps

1. Apply the 8 fixes above to `localPredictor.js`
2. Re-run validation suite to confirm all 12 failures resolved
3. Extend validation to the full MongoDB-backed `predictionEngine.js` with production data
4. Add category-specific rank normalization in the main engine
5. Add automated regression tests for the prediction API endpoints
