# Performance Improvement Plan

**Date:** 2026-03-14
**Status:** Phase 1, 2 & 3 complete
**Revised:** 2026-03-14 (Phase 1 & 2 — commit `1d6b70b`; Phase 3 — commit `9f4d11e`)

---

## 1. Current State

### AI Grading Latency (`/api/submit`) — Full Timeline

```
User taps Submit
  │
  ├─ Network round-trip to server (~50-100ms)
  │
  ├─ Sequential: createClient() + getUser() (~80-150ms)
  ├─ validateOrigin (~0ms)
  ├─ checkRateLimit — KV/Redis call (~30-80ms in prod)
  ├─ Zod parse (~1ms)
  │
  ├─ Parallel: fetch exercise + concept (~50-100ms)
  │
  ├─ Start Claude streaming → wait for first newline (~800-2000ms ← BOTTLENECK)
  │     ├─ Haiku first-token latency: ~300-600ms
  │     └─ Generate score JSON line + newline: ~500-1200ms
  │
  ├─ [SRS path] Parallel: fetch user_progress + profile.timezone (~50-100ms)
  ├─ sm2() calculation (~0ms)
  ├─ Upsert user_progress (~50-80ms)
  │
  ├─ Emit Chunk 1 (score) → client receives
  ├─ Client: 300ms flash animation timer
  │
  ├─ Claude continues generating → details chunk (~300-800ms after score)
  ├─ Emit Chunk 2 (feedback)
  │
  └─ Fire-and-forget: exercise_attempts INSERT + streak RPC + computed_level
```

**Estimated totals:** P50 ~2.0s, P95 ~3.5s from tap to seeing correct/incorrect.

### Page Load Findings

- **Dashboard:** Profile fetched sequentially before 3 parallel queries (timezone dependency). DashboardDeferredSection has 2 sequential query stages before a parallel batch.
- **Progress:** Fetches up to 5,000 `exercise_attempts` rows to compute per-type accuracy. 3 sequential query stages where stages 3-5 could run in parallel.
- **Curriculum:** Well-parallelized (5 queries in one `Promise.all`). No action needed.
- **Verbs:** Well-parallelized (3 queries in one `Promise.all`). Minor `select('*')` over-fetch.

### Exercise-Type-Specific Observations

- **gap_fill:** Single-word answers with exact `expected_answer`. Strong candidate for local grading (exact + fuzzy match safe for short answers).
- **translation / transformation:** Full-sentence answers with `expected_answer` + `answer_variants` (0-1 variants per exercise currently). Only exact case-insensitive match is safe; `normalizeSpanish()` strips accents and is **not safe** for sentences because mood errors (está/esté, pidiera/pidió) are accent-level differences that represent fundamentally wrong grammar. Fuzzy/Levenshtein matching must never be used for full sentences.
- **sentence_builder / error_correction / free_write:** Open-ended, no local grading shortcut available.

---

## 2. Improvement Measures

### Master Table

| # | Measure | Scope | Expected Savings | Risk | Risk Mitigation |
|---|---------|-------|-----------------|------|-----------------|
| **1** ✅ | Pre-fetch SRS data (`user_progress` + `profiles.timezone`) in parallel with Claude call — not fire-and-forget, so `just_mastered` and `next_review_in_days` stay in Chunk 1 | `/api/submit` — all types | **50–100ms** per submit (overlaps SRS fetch with Claude TTFT; only the upsert remains sequential after score arrives) | None — identical Chunk 1 contents, same guarantees | N/A |
| **2** ✅ | Parallelize rate-limit check with exercise+concept DB fetch | `/api/submit` — all types | **30–80ms** per submit | Wasted DB work if rate-limited (0.1% of requests) | Negligible cost; rate-limited users are rare |
| **3** ✅ | Truncate `conceptExplanation` to 100 chars in grading prompt (keep full `conceptTitle`) | `/api/submit` — all types | **30–80ms** TTFT + cost reduction | Slight grading accuracy drop if truncated explanation loses critical rule info | Run `pnpm validate:grading` before/after; revert if agreement drops below 90%; most disambiguation is in the title already (e.g. "aunque (+ subjuntivo)") |
| **4** ✅ | Pass `answer_variants` to Claude prompt | `/api/submit` — translation, transformation | **0ms** latency, but fewer wrong grades → fewer retries | None | — |
| **5** | Optimistic local grading — **exact case-insensitive match only** against `expected_answer` + `answer_variants` (NO `normalizeSpanish`, NO fuzzy) for full-sentence types; exact + accent-normalized for gap_fill | `/api/submit` — all types with `expected_answer` | **~1.5s** for ~15–20% of translation/transformation; ~40% of gap_fill | False positive if a variant in seed data is incorrect | Only fire on exact case-insensitive match for sentences; accent-normalized match only for gap_fill (single-word answers where mood confusion doesn't apply) |
| **6** | Optimistic local grading — **fuzzy** (Levenshtein ≤ 2) for gap_fill only | `/api/submit` — gap_fill only | **~1.5s** for additional ~15% of gap_fill | Mood/accent confusion (está/esté) is 1–2 chars even in single words | Only apply when answer is 1–3 words; never apply to sentence-level types |
| **7** | Optimistic grading: handle Claude disagreement via "Confirmando..." phase | Client UX (StudySession) | Enables #5 and #6 safely | "Correct → actually wrong" correction erodes trust; user sees a Next button they can't press during confirmation | New `optimistic-feedback` session phase: green/red flash shown instantly, Next button shows "Confirmando..." spinner until Claude confirms; if Claude disagrees, orange correction animation + scores array updated retroactively; SRS always uses Claude's score; ~2–5% disagreement rate for exact-match; UX design decision required |
| **8** | Enrich `answer_variants` via Claude batch (seed script) | Offline / seed data | Raises #5 hit rate from ~15–20% → ~35–40% for translation/transformation | Bad variants teach wrong answers; maintenance burden on re-seed | Human review of generated variants; add to `seed:ai` pipeline |
| **9** ✅ | Progress page: replace 5,000-row `exercise_attempts` fetch with aggregate RPC | `/progress` page load | **100–250ms** now; prevents **unbounded growth** as user history accumulates | New migration to deploy; RPC must be maintained alongside schema changes | `--dry-run` test; fallback to current query if RPC missing |
| **10** ✅ | Dashboard: parallelize profile fetch with due/total/studied queries | `/dashboard` page load | **50–100ms** | Timezone wrong on date boundary (UTC vs user TZ) → off-by-one on due count for users near midnight | Only affects users near midnight; self-corrects on next load |
| **11** ✅ | Progress page: parallelize stages 3–5 (activity, sessions, verb progress) with stage 2 | `/progress` page load | **100–200ms** | None — all queries are independent | — |
| **12** ✅ | DashboardDeferredSection: merge weakest-progress query into batch 3 | `/dashboard` deferred section | **50–80ms** | Slightly more complex query logic | Pure refactor; covered by existing tests |
| **13** | Debounce `updateComputedLevel` — only run every 5th submit or on mastery change | `/api/submit` fire-and-forget | Reduces background DB load (~4 queries saved per 5 submits) | Computed level stale by up to 5 exercises | Level only changes at mastery boundaries; 5-submit lag is imperceptible |
| **~~14~~** | ~~Speculative Claude connection warm-up during DB fetch~~ | — | — | **DROPPED:** Anthropic Node SDK creates new HTTP connections per request with no exposed keep-alive or pool config. Would require bypassing the SDK to manage raw HTTPS sockets — fragile, unmaintainable, and fights the abstraction. | — |
| **15** ✅ | In-memory cache for exercise + concept rows (5-min TTL) | `/api/submit` — all types | **50–100ms** per submit (eliminates DB round-trip for static curriculum data) | Stale data if admin edits/deletes exercises via pool dashboard | Invalidate on admin pool mutations; 5-min TTL limits staleness; exercise/concept data changes very rarely |

---

## 3. Impact Summary

### Answer Submission

| Scenario | Before | After | Reduction |
|----------|--------|-------|-----------|
| **Every answer submit (P50)** | ~2.0s | ~1.7–1.8s | **−200–350ms** (items 1–4, 15) |
| **gap_fill with local match (exact + fuzzy)** | ~2.0s | ~50ms | **−1.95s** (items 5–6, ~55% of gap_fill submits) |
| **translation/transformation with exact match** | ~2.0s | ~50ms | **−1.95s** (item 5, ~15–20% of submits) |
| **translation/transformation with enriched variants** | ~2.0s | ~50ms | **−1.95s** (items 5+8, ~35–40% of submits) |
| **translation/transformation, no local match** | ~2.0s | ~1.7–1.8s | **−200–350ms** (items 1–4, 15) |

### Page Loads

| Page | Before | After | Reduction |
|------|--------|-------|-----------|
| **Progress page** | ~800ms+ (grows) | ~500ms (stable) | **−300ms+** (items 9, 11) |
| **Dashboard** | ~400ms | ~300ms | **−100ms** (items 10, 12) |

---

## 4. Translation / Transformation Deep Dive

These are the hardest exercise types to speed up because correctness depends on grammar, word order, and semantic equivalence that only an LLM can fully judge.

### What we have to work with

Each exercise stores:
- `expected_answer`: canonical correct sentence (e.g. `"Aunque está cansado, sigue trabajando."`)
- `answer_variants`: array of acceptable alternates (e.g. `["Sigue trabajando aunque está cansado."]`) — currently 0–1 per exercise

### Why `normalizeSpanish()` is NOT safe for sentences

`normalizeSpanish()` strips all diacritics (accents). This is fine for gap_fill single-word answers where accent errors are minor, but **dangerous for full sentences** where accent differences signal grammatical mood:

- `está` (indicative "is") → `esté` (subjunctive "be") — both normalize to `esta`
- `pidió` (preterite "asked") → `pidiera` (imperfect subjunctive) — different after normalization, but other pairs exist
- `este` (demonstrative "this") → `esté` (subjunctive) — normalize identically

These mood errors are **exactly what B1→B2 exercises test**. A local grader using `normalizeSpanish` would mark `"Aunque esta cansado"` as score=3 when it should be score=0 (wrong mood entirely).

### Optimistic local pre-grading strategy

For **translation / transformation** (full sentences):
```
user.trim().toLowerCase() === expected.trim().toLowerCase()     → score 3, instant
user.trim().toLowerCase() === anyVariant.trim().toLowerCase()   → score 3, instant
else                                                            → unknown, wait for Claude
```

For **gap_fill** (single words / short phrases):
```
user.trim().toLowerCase() === expected.trim().toLowerCase()     → score 3, instant
normalizeSpanish(user) === normalizeSpanish(expected)           → score 2, instant (accent diff)
levenshtein(normalized(user), normalized(expected)) ≤ 2         → score 2, tentative
else                                                            → unknown, wait for Claude
```

### Hit rate estimates

| Type | Variant coverage | % of submits graded locally | Time to verdict |
|------|------------------|-----------------------------|-----------------|
| **gap_fill** | N/A (exact + fuzzy) | ~55% | ~50ms |
| **translation/transformation** | Current (0–1 variants) | ~15–20% | ~50ms |
| **translation/transformation** | After enrichment (3–5 variants) | ~35–40% | ~50ms |
| **All types, no local match** | — | ~45–85% depending on type | ~1.7s (with items 1–4) |

### Claude disagreement handling

When local grader produces a verdict but Claude hasn't confirmed yet:
1. Green/red flash shown instantly based on local verdict
2. Next button shows "Confirmando..." with spinner (new `optimistic-feedback` phase)
3. User cannot advance until Claude confirms (~1-2s wait)
4. If Claude agrees: transition to normal feedback phase
5. If Claude disagrees (~2–5% of locally-graded submissions):
   - Orange correction animation replaces green flash
   - Scores array updated retroactively
   - SRS always uses Claude's score (never the local estimate)

**Design decision needed:** Whether the "Confirmando..." blocker is acceptable UX or whether it makes the optimistic signal feel hollow. Alternative: allow navigation but queue background correction (riskier — score mismatch on done screen).

---

## 5. Implementation Order

| Phase | Items | Effort | Risk | Cumulative Impact |
|-------|-------|--------|------|-------------------|
| **Phase 1** ✅ | 1, 2, 3, 4, 15 | ~1 day | Near-zero | −200–350ms on every submit |
| **Phase 2** ✅ | 10, 11, 12 | ~half day | Near-zero | +−150–300ms on page loads |
| **Phase 3** ✅ | 9 | ~half day | Low (migration) | Progress page stable at ~500ms |
| **Phase 4** | 5, 7 | ~3–3.5 days | Medium (UX complexity, new session phase) | ~15–55% of submits feel instant (varies by type) |
| **Phase 5** | 8 | ~1 day + review | Low (content quality) | Translation/transformation hit rate rises to ~35–40% |
| **Phase 6** | 6, 13 | ~half day | Low | gap_fill fuzzy match; debounced level |

### Key files to modify

- **Phase 1:** `src/app/api/submit/route.ts`, `src/lib/claude/grader.ts`
- **Phase 2:** `src/app/dashboard/page.tsx`, `src/components/DashboardDeferredSection.tsx`, `src/app/progress/page.tsx`
- **Phase 3:** New migration `supabase/migrations/021_accuracy_rpc.sql`, `src/app/progress/page.tsx`
- **Phase 4:** New `src/lib/exercises/localGrader.ts`, `src/app/api/submit/route.ts`, `src/app/study/StudySession.tsx`
- **Phase 5:** New `scripts/enrich-variants.ts`, seed data
- **Phase 6:** `src/lib/exercises/localGrader.ts`, `src/lib/api-utils.ts`

---

## 6. Critical Review Notes (2026-03-14)

Corrections made after re-reading the source code against original estimates:

1. **Item 1 revised:** Original plan proposed fire-and-forget for SRS writes, but `just_mastered` (mastery celebration overlay with confetti) and `next_review_in_days` (shown in FeedbackPanel) both depend on SRS calculation and are in Chunk 1. Moving SRS to fire-and-forget would break both features. Revised to pre-fetch SRS data in parallel with Claude instead — preserves Chunk 1 contents exactly, smaller savings (50–100ms vs 150–250ms).

2. **Item 3 revised:** Original plan proposed removing `conceptExplanation` entirely. Too aggressive — the explanation disambiguates grammar rules for exercises where the title alone isn't sufficient. Revised to truncate to 100 chars (keeps the rule signal, cuts verbose content).

3. **Item 5 revised:** Original plan used `normalizeSpanish()` for sentence matching and claimed ~25–30% hit rate. `normalizeSpanish` strips accents, which masks mood errors (está/esté) that are the core of what this app teaches. Revised to exact case-insensitive match only for sentences. Hit rate drops to ~15–20% but eliminates false-positive risk.

4. **Item 7 revised:** Original plan bundled disagreement handling into Item 5 at "~2 days". Underestimated — requires a new `optimistic-feedback` session phase, "Confirmando..." button state, correction animation, and retroactive score update. Revised to ~1.5 days standalone, making Phase 4 total ~3–3.5 days.

5. **Item 8 revised:** Hit rate improvement was originally ~25% → ~50%. With exact-match-only for sentences (no normalization), enriched variants improve from ~15–20% → ~35–40% (not 50%).

6. **Item 9 revised:** Original estimate of 200–500ms savings was inflated. `exercise_attempts` rows are small (~200 bytes), so 5,000 rows is ~1MB with gzip. Real savings are ~100–250ms, but the scalability argument remains — this query degrades linearly with user history.

7. **Item 14 dropped:** Anthropic's Node SDK creates new HTTP connections per request with no connection pooling or keep-alive API. Implementing speculative warm-up would require raw socket management, which is fragile and unmaintainable.

8. **Item 15 added:** In-memory cache for exercise + concept rows. These are static curriculum data that rarely change. Eliminates a DB round-trip (~50–100ms) on every submit with minimal staleness risk.

9. **Overall submit savings revised:** Original claimed −400ms; revised to −200–350ms (items 1–4, 15). Original total Phase 4 effort was ~2 days; revised to ~3–3.5 days.
