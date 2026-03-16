# Performance Improvement Plan

**Date:** 2026-03-14
**Status:** Complete (Phases 1–3 & 6 implemented; Phases 4–5 dropped)
**Revised:** 2026-03-16 (Phases 4–5 dropped per PM decision — local grading scratched entirely; Phase 6 completed)

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

**Local grading feasibility matrix** (revised after Feat-H added `listening`, `proofreading`, `register_shift`):

| Type | User Input | Answer Space | Local Grading | Notes |
|------|-----------|--------------|:---:|-------|
| `gap_fill` | Text field(s) per blank | Closed (single correct form + variants) | **Yes** | Exact + accent-normalized match; multi-blank via pipe-delimited parsing |
| `sentence_builder` | Chip bank assembly | Closed (word bank is finite set) | **Yes** | Exact match against `expected_answer`; user assembles from given tokens |
| `translation` | Textarea | Open (many valid translations) | No | Synonym substitution, word order, register variations |
| `transformation` | Textarea | Open (many valid paraphrases) | No | Semantic equivalence required |
| `error_correction` | Textarea (pre-populated) | Semi-open (correction quality) | No | Must detect which errors fixed, whether new errors introduced |
| `free_write` | Textarea + mic | Open (discourse-level) | No | Communicative intent + grammar correctness |
| `listening` | Textarea | Open (comprehension inference) | No | Grading is on inference/synthesis, not dictation |
| `proofreading` | Textarea (pre-populated) | Semi-open (2–6 distributed errors) | No | Must identify, categorize, and evaluate each error fix |
| `register_shift` | Textarea | Open (socio-pragmatic) | No | Pronoun politeness, discourse markers, lexical formality |

**Key constraint:** `normalizeSpanish()` strips all diacritics. Safe for gap_fill (single-word, accent errors are minor) but **dangerous for sentences** where accent differences signal grammatical mood (está/esté, pidió/pidiera). These mood errors are exactly what B1→B2 exercises test.

**Offline-mode alignment (Feat-F):** The local grading boundary directly maps to the offline boundary — types that can be graded locally work offline; types that require Claude queue for grading on reconnect. This is a deliberate architectural decision (see Section 7).

---

## 2. Improvement Measures

### Master Table

| # | Measure | Scope | Expected Savings | Risk | Risk Mitigation |
|---|---------|-------|-----------------|------|-----------------|
| **1** ✅ | Pre-fetch SRS data (`user_progress` + `profiles.timezone`) in parallel with Claude call — not fire-and-forget, so `just_mastered` and `next_review_in_days` stay in Chunk 1 | `/api/submit` — all types | **50–100ms** per submit (overlaps SRS fetch with Claude TTFT; only the upsert remains sequential after score arrives) | None — identical Chunk 1 contents, same guarantees | N/A |
| **2** ✅ | Parallelize rate-limit check with exercise+concept DB fetch | `/api/submit` — all types | **30–80ms** per submit | Wasted DB work if rate-limited (0.1% of requests) | Negligible cost; rate-limited users are rare |
| **3** ✅ | Truncate `conceptExplanation` to 100 chars in grading prompt (keep full `conceptTitle`) | `/api/submit` — all types | **30–80ms** TTFT + cost reduction | Slight grading accuracy drop if truncated explanation loses critical rule info | Run `pnpm validate:grading` before/after; revert if agreement drops below 90%; most disambiguation is in the title already (e.g. "aunque (+ subjuntivo)") |
| **4** ✅ | Pass `answer_variants` to Claude prompt | `/api/submit` — translation, transformation | **0ms** latency, but fewer wrong grades → fewer retries | None | — |
| **~~5~~** | ~~**Authoritative** local grading for `gap_fill` + `sentence_builder`~~ | — | — | **DROPPED (2026-03-16):** PM decision to scratch local grading entirely. Claude grading quality is more important than latency savings for a learning app — incorrect local grades undermine trust in the pedagogical loop. | — |
| **~~6~~** | ~~Optimistic local grading — fuzzy (Levenshtein ≤ 2) for gap_fill only~~ | — | — | **DROPPED (see Section 7, note 3):** Levenshtein ≤ 2 catches mood-significant accent pairs (está/esté = distance 1) even in single words. Risk outweighs the ~15% incremental hit rate. Can revisit if `answer_variants` enrichment (Item 8) closes the gap instead. | — |
| **~~7~~** | ~~Optimistic grading: handle Claude disagreement via "Confirmando..." phase~~ | — | — | **DROPPED (see Section 7, note 1):** Contradicts offline-mode architecture (Feat-F). Adds a third grading category ("tentative local") that doesn't exist offline. Trust-eroding UX ("correct → actually wrong"). ~3.5 days effort for a pattern that would be ripped out when offline lands. | — |
| **~~8~~** | ~~Enrich `answer_variants` via Claude batch (seed script)~~ | — | — | **DROPPED (2026-03-16):** Depended on Item 5 (local grading) which was scratched. No consumer for enriched variants. | — |
| **9** ✅ | Progress page: replace 5,000-row `exercise_attempts` fetch with aggregate RPC | `/progress` page load | **100–250ms** now; prevents **unbounded growth** as user history accumulates | New migration to deploy; RPC must be maintained alongside schema changes | `--dry-run` test; fallback to current query if RPC missing |
| **10** ✅ | Dashboard: parallelize profile fetch with due/total/studied queries | `/dashboard` page load | **50–100ms** | Timezone wrong on date boundary (UTC vs user TZ) → off-by-one on due count for users near midnight | Only affects users near midnight; self-corrects on next load |
| **11** ✅ | Progress page: parallelize stages 3–5 (activity, sessions, verb progress) with stage 2 | `/progress` page load | **100–200ms** | None — all queries are independent | — |
| **12** ✅ | DashboardDeferredSection: merge weakest-progress query into batch 3 | `/dashboard` deferred section | **50–80ms** | Slightly more complex query logic | Pure refactor; covered by existing tests |
| **13** ✅ | Debounce `updateComputedLevel` — only run every 5th submit or on mastery change | `/api/submit` fire-and-forget | Reduces background DB load (~4 queries saved per 5 submits) | Computed level stale by up to 5 exercises | Level only changes at mastery boundaries; 5-submit lag is imperceptible |
| **~~14~~** | ~~Speculative Claude connection warm-up during DB fetch~~ | — | — | **DROPPED:** Anthropic Node SDK creates new HTTP connections per request with no exposed keep-alive or pool config. Would require bypassing the SDK to manage raw HTTPS sockets — fragile, unmaintainable, and fights the abstraction. | — |
| **15** ✅ | In-memory cache for exercise + concept rows (5-min TTL) | `/api/submit` — all types | **50–100ms** per submit (eliminates DB round-trip for static curriculum data) | Stale data if admin edits/deletes exercises via pool dashboard | Invalidate on admin pool mutations; 5-min TTL limits staleness; exercise/concept data changes very rarely |

---

## 3. Impact Summary

### Answer Submission

| Scenario | Before | After | Reduction |
|----------|--------|-------|-----------|
| **Every answer submit (P50)** | ~2.0s | ~1.7–1.8s | **−200–350ms** (items 1–4, 15) |
| **gap_fill with local match** | ~2.0s | ~50ms | **−1.95s** (item 5, ~40–55% of gap_fill submits) |
| **sentence_builder with local match** | ~2.0s | ~50ms | **−1.95s** (item 5, ~30–40% of sentence_builder submits) |
| **gap_fill / sentence_builder, no local match** | ~2.0s | ~1.7–1.8s | **−200–350ms** (falls through to Claude) |
| **All other types (7 of 9)** | ~2.0s | ~1.7–1.8s | **−200–350ms** (items 1–4, 15 only — always Claude) |

**Overall local-grade hit rate by level** (after Feat-H exercise distribution):

| Level | Locally-gradable types | % of exercise pool | Effective local-grade rate |
|-------|----------------------|-------------------|--------------------------|
| B1 | gap_fill, sentence_builder | 2 of 3 types (~67%) | ~25–35% of submits |
| B2 | gap_fill, sentence_builder | 2 of 5 types (~40%) | ~15–22% of submits |
| C1 | gap_fill, sentence_builder | 2 of 6 types (~33%) | ~12–18% of submits |

### Page Loads

| Page | Before | After | Reduction |
|------|--------|-------|-----------|
| **Progress page** | ~800ms+ (grows) | ~500ms (stable) | **−300ms+** (items 9, 11) |
| **Dashboard** | ~400ms | ~300ms | **−100ms** (items 10, 12) |

---

## 4. Local Grading Architecture (Revised)

### Design principle: authoritative, not optimistic

The original plan (Items 5–7) proposed an **optimistic** pattern: show a local verdict instantly, then confirm with Claude in the background, and correct retroactively if Claude disagrees. This was dropped (see Section 7) in favour of an **authoritative** pattern:

```
localGrade(exercise, userAnswer) → LocalGradeResult | null
```

- **Non-null return** = the grade is final. No Claude call. No confirmation step. The `StudySession` state machine is unchanged — it just receives the result faster.
- **Null return** = the local grader cannot determine correctness. Fall through to Claude as today.

This binary split directly maps to offline mode (Feat-F): types that return non-null work offline; types that return null queue for grading on reconnect. No third "tentative" category exists.

### Why NOT optimistic-with-confirmation

1. **Offline contradiction:** Offline mode needs "local = authoritative" for gap_fill/sentence_builder. An optimistic pattern trains users on "local = tentative, Claude = real" — the opposite mental model.
2. **Trust erosion:** "You got it right! ...wait, actually wrong" (~2–5% of locally-graded submissions) is worse than waiting 1.7s for a definitive answer.
3. **Effort/impact mismatch:** ~3.5 days of work (new session phase, correction animations, retroactive score updates) for a pattern that would be dismantled when offline mode ships.
4. **State machine complexity:** New `optimistic-feedback` phase in `StudySession.tsx` adds a state that interacts with try-again, hint gating, and done-screen score arrays — high surface area for bugs.

### Why NOT local grading for translation / transformation

The original plan included exact case-insensitive match for these types (~15–20% hit rate). Dropped because:

- **Low ROI:** Users rarely type the exact `expected_answer` for open-ended sentence types. The match rate doesn't justify the code paths.
- **No offline benefit:** These types require Claude for the ~80–85% non-matching cases anyway, so they can never work offline. Adding local grading for the small matching slice creates a mixed-mode type that complicates Feat-F.
- **Variant enrichment dependency:** To raise the hit rate meaningfully (Item 8), we'd need 3–5 reviewed variants per exercise — a content effort with ongoing maintenance burden, all to locally-grade a type that still needs Claude most of the time.

### Local grading strategy per type

**gap_fill** (single-word / short phrase):
```
exact case-insensitive match (expected + variants)              → score 3
normalizeSpanish(user) === normalizeSpanish(expected/variant)   → score 2 (accent error)
else                                                            → null (fall through to Claude)
```

Multi-blank exercises: parse `expected_answer` as JSON array, split user answer on pipe delimiter, grade each blank independently. All blanks must match for a local grade; any miss → null.

**sentence_builder** (word chip assembly):
```
exact case-insensitive match against expected_answer            → score 3
else                                                            → null (fall through to Claude)
```

The word bank is a closed set parsed from the prompt (`[w1/w2/w3]`). The user assembles from given tokens, so the answer space is constrained. No accent normalization needed — chips are pre-spelled.

**All other types** (7 of 9): always return null → Claude.

### Hit rate estimates (revised post Feat-H)

| Type | Match strategy | % of submits graded locally | Time to verdict |
|------|---------------|----------------------------|-----------------|
| **gap_fill** | Exact + accent-normalized | ~40–55% | <1ms |
| **sentence_builder** | Exact | ~30–40% | <1ms |
| **All other types (7)** | — | 0% (always Claude) | ~1.7s |

### Offline-mode alignment (Feat-F)

The `localGrade()` interface is the **exact same function** Feat-F needs:

| Mode | localGrade returns result | localGrade returns null |
|------|--------------------------|------------------------|
| **Online** | Use result, skip Claude, save API cost | Call Claude as today |
| **Offline** | Show result, works without network | Queue for grading on reconnect |

No adaptation layer, no mode-specific branching. The grader is environment-agnostic.

### Why `normalizeSpanish()` is NOT safe for sentences (unchanged)

`normalizeSpanish()` strips all diacritics. Dangerous for full sentences where accent differences signal grammatical mood:

- `está` (indicative "is") → `esté` (subjunctive "be") — both normalize to `esta`
- `pidió` (preterite "asked") → `pidiera` (imperfect subjunctive)
- `este` (demonstrative "this") → `esté` (subjunctive) — normalize identically

These mood errors are exactly what B1→B2 exercises test. This is why accent normalization is restricted to gap_fill (single-word answers where mood confusion is rare) and never applied to sentence-level types.

### Feedback generation for locally-graded exercises

When the local grader returns a result, we skip Claude entirely — meaning no AI-generated `feedback`, `corrected_version`, or `explanation`. For locally-graded exercises:

- **score 3 (correct):** Feedback = `"¡Correcto!"`. No corrected version needed. No explanation needed — the user got it right.
- **score 2 (accent error, gap_fill only):** Feedback = `"Casi — revisa los acentos."`. Corrected version = `expected_answer`. No explanation needed — the error type is self-evident.
- These fixed strings are sufficient because local grading only fires on near-exact matches. The pedagogical value of AI feedback is highest when the answer is wrong or creative — exactly the cases that still go to Claude.

---

## 5. Implementation Order

| Phase | Items | Effort | Risk | Cumulative Impact |
|-------|-------|--------|------|-------------------|
| **Phase 1** ✅ | 1, 2, 3, 4, 15 | ~1 day | Near-zero | −200–350ms on every submit |
| **Phase 2** ✅ | 10, 11, 12 | ~half day | Near-zero | +−150–300ms on page loads |
| **Phase 3** ✅ | 9 | ~half day | Low (migration) | Progress page stable at ~500ms |
| **~~Phase 4~~** | ~~5 (revised)~~ | — | — | **DROPPED** — local grading scratched per PM decision (2026-03-16) |
| **~~Phase 5~~** | ~~8~~ | — | — | **DROPPED** — depended on Phase 4 |
| **Phase 6** ✅ | 13 | ~half day | Low | Debounced computed level |

### Phase 4 — Detailed Breakdown

| Sub-task | Description | Effort | Files |
|----------|-------------|--------|-------|
| **4a** | `localGrader.ts` — gap_fill grading (exact + accent-normalized, single + multi-blank, variant support) | ~0.5 day | New `src/lib/exercises/localGrader.ts` |
| **4b** | `localGrader.ts` — sentence_builder grading (exact match) | ~0.25 day | Same file |
| **4c** | Wire into `/api/submit` — if `localGrade()` returns non-null, skip Claude call, return immediately with fixed feedback strings; SRS update still runs | ~0.5 day | `src/app/api/submit/route.ts` |
| **4d** | Unit tests for localGrader (exact, accent, multi-blank, variants, null fallthrough per type) + submit route short-circuit tests | ~0.5 day | New `src/lib/exercises/__tests__/localGrader.test.ts`, `src/app/api/submit/__tests__/route.test.ts` |

**Not modified:** `src/app/study/StudySession.tsx` — no new session phase, no UI changes. The client receives the same response shape whether the grade came from local or Claude.

### Key files to modify

- **Phase 1:** `src/app/api/submit/route.ts`, `src/lib/claude/grader.ts`
- **Phase 2:** `src/app/dashboard/page.tsx`, `src/components/DashboardDeferredSection.tsx`, `src/app/progress/page.tsx`
- **Phase 3:** New migration `supabase/migrations/021_accuracy_rpc.sql`, `src/app/progress/page.tsx`
- **Phase 4:** New `src/lib/exercises/localGrader.ts`, `src/app/api/submit/route.ts`
- **Phase 5:** New `scripts/enrich-variants.ts`, seed data
- **Phase 6:** `src/lib/api-utils.ts`

---

## 6. Critical Review Notes (2026-03-14, initial)

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

---

## 7. Phase 4 Re-scope Notes (2026-03-14, post Feat-H audit)

Full re-audit of Items 5–7 after Feat-H added three new exercise types (`listening`, `proofreading`, `register_shift`) and considering forward-compatibility with offline mode (Feat-F). Changes:

1. **Item 7 dropped — "Confirmando..." optimistic UX.** Four reasons: (a) Contradicts offline-mode architecture — offline needs a binary "local = authoritative" / "cloud = queued" split, not a third "tentative local" category. Building the optimistic pattern now means dismantling it when Feat-F ships. (b) Trust-eroding UX — "correct → actually wrong" corrections (~2–5%) are worse than a 1.7s wait for a definitive answer. (c) State machine complexity — new `optimistic-feedback` phase interacts with try-again, hint gating, and done-screen score arrays. (d) Effort/impact mismatch — ~3.5 days for a transitional pattern. Phase 4 drops from ~3.5 days to ~1.5–2 days.

2. **Item 5 re-scoped — authoritative local grading for gap_fill + sentence_builder only.** Translation/transformation exact-match dropped: ~15–20% hit rate doesn't justify the code paths, and these types can never work offline (Claude needed for the ~80–85% non-matching cases). Sentence_builder added: word bank is a closed set (user assembles from given tokens), so exact match is reliable. The `localGrade()` function returns `result | null` — the exact interface Feat-F needs with zero adaptation.

3. **Item 6 dropped — fuzzy Levenshtein matching for gap_fill.** Even in single words, Levenshtein ≤ 2 catches mood-significant accent pairs (está/esté = edit distance 1). The ~15% incremental hit rate doesn't justify the false-positive risk for a B1→B2 grammar app. If gap_fill hit rates need improvement, Item 8 (variant enrichment) is the safer path — adding reviewed variants rather than loosening match criteria.

4. **New exercise types assessed — all Claude-only.** `listening` requires comprehension inference (not dictation accuracy). `proofreading` requires detecting and evaluating 2–6 distributed errors in a paragraph. `register_shift` requires socio-pragmatic judgment (pronoun politeness, discourse marker register, lexical formality). None have a deterministic answer space suitable for string matching.

5. **Local-grade hit rate revised downward.** With 3 new Claude-only types in the exercise pool, locally-gradable types (gap_fill + sentence_builder) represent a smaller share: ~67% of B1 exercises, ~40% of B2, ~33% of C1. Effective local-grade rate across all submits: ~12–35% depending on level (down from the original 15–55% estimate which assumed translation/transformation exact-match and only 5 exercise types).

6. **Feedback for locally-graded exercises.** No Claude call means no AI-generated feedback. For score 3 (correct): `"¡Correcto!"`. For score 2 (accent error): `"Casi — revisa los acentos."` + `corrected_version = expected_answer`. These fixed strings are sufficient because local grading only fires on near-exact matches — the pedagogical value of AI feedback is highest when the answer is wrong or creative, which still routes to Claude.

7. **`StudySession.tsx` unchanged.** No new session phase, no UI changes. The client receives the same NDJSON response shape whether the grade came from local or Claude. The speed improvement is transparent to the frontend.

### Open questions (decide before Phase 4 implementation)

1. **`exercise_attempts` — grading source column.** Currently the fire-and-forget path inserts an `exercise_attempts` row with `ai_score`, `ai_feedback`, etc. For locally-graded exercises, the feedback is a fixed string (`"¡Correcto!"`) and there is no Claude attribution. Should we add a `grading_source: 'local' | 'claude'` column now? This matters for analytics accuracy (distinguishing AI-graded vs locally-graded accuracy) and for Feat-F offline mode (queued attempts synced on reconnect will need a similar distinction). Adding it now avoids a migration later; leaving it means we can't distinguish grading methods in historical data. **PM decision required.**

2. **Item 8 (variant enrichment) — re-scope or drop.** The original plan targeted translation/transformation variants to raise their local-grade hit rate from ~15–20% → ~35–40%. With local grading dropped for those types, Item 8 as written has no consumer. Options: (a) Re-scope to gap_fill variants only — directly improves local hit rate from ~40–55% → ~60–70%. (b) Drop entirely — gap_fill already hits ~40–55% without enrichment, and the maintenance burden of reviewed variants may not be worth the incremental gain. (c) Keep for Claude grading quality — richer variants in the prompt help Claude grade faster/more accurately even without local grading. **PM decision required.**
