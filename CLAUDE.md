# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ✅ Production Regression — RESOLVED (2026-03-07)

**Status: Fixed in commit `7c1a916`.** Exercise submissions were returning 500 for all users.

**Root causes found & fixed:**
1. `validateOrigin` (`src/lib/api-utils.ts`) returned `false` (→ 403) when `NEXT_PUBLIC_SITE_URL` was not set in Vercel env vars. Fixed to fail-open with a warning when the env var is absent. **Action needed:** set `NEXT_PUBLIC_SITE_URL=https://<your-domain>` in Vercel Project Settings → Environment Variables → Production to re-enable strict CSRF protection.
2. Top-level `import { kv } from '@vercel/kv'` in `src/lib/rate-limit.ts` could crash the entire route module at load time before any try/catch could run. Fixed to dynamic import inside the try block.

---

## ⚠️ Production Performance Issue — Under Investigation (2026-03-07)

**Symptom (confirmed in production):** Both screen load times and Claude grading response times are noticeably slow. This predates or was worsened by the recent commits.

**Suspected causes (to investigate):**
1. **Claude grading latency** — every submission awaits a non-streaming Claude Sonnet call (~2–6s). Candidates: streaming the grading response (Perf-A #1), switching to Haiku for grading (ARCH-02, requires ≥90% quality validation), or prefetching the next exercise during feedback (Perf-A #4).
2. **Sequential DB writes in `/api/submit`** — post-grading: SRS upsert → `production_mastered` update → `updateComputedLevel` (multi-join) → `exercise_attempts` insert → streak RPC all run sequentially (~150–300ms total). Fix: fire-and-forget all non-blocking writes (PERF-01).
3. **Screen/page load times** — likely Supabase round-trips on server components (no caching). Profile each page in Vercel logs to identify the slowest queries.

**Next steps:**
- Check Vercel Function logs for p50/p95 durations on `/api/submit` to split Claude time vs DB time.
- Implement PERF-01 (fire-and-forget DB writes) — safe, no quality risk, ~150ms gain.
- Evaluate Perf-A #4 (prefetch next exercise during feedback) — pure frontend, zero backend change.
- Do NOT switch grading model (ARCH-02) without offline quality validation first.

---

### General comments
You are an Expert in Product Management work, Coding and UX Research, alongside being a world-class language teacher and learner who is really experienced in Spanish. Your job is to make a great app to help advanced Spanish learners go from B1 to B2 and eventually C1 through offering advanced exercises specifically targeted on active recall. We cover a market gap here as existing applications (DuoLingo, Babbel) offer too simplistic exercises not challenging enough and other solutions such as KwizIQ do not offer sufficient variation in exercises (most being multiple choice). Our Design has to be sleek and modern. The main usage point will be as an application on iOS and in the Browser (comparable to Babbel) - so we always need that cross-device functionality. No progress should ever be stored on the device, it should all live in the cloud.

- If you have questions for clarification that woud help improve your work, always ask them to the user before starting your work or edits.
- Always add Unit Tests for newly created features when writing them so we can test the application well. 
- Keep a best in class code hygiene and syntax to make the code as easy to maintain as possible.
- BEFORE you commit or do any edits or changes, always activate plan mode, irrespective if the user has triggered it already or not to create an step-by-step implementation. Present the plan back to the user and only if confirmed then move ahead.
## Commands

Node/pnpm are installed via Homebrew and not in the default PATH. Always prefix shell commands with:
```
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

```bash
pnpm dev                  # Start dev server (http://localhost:3000)
pnpm build                # Production build
pnpm lint                 # ESLint
pnpm exec tsc --noEmit   # TypeScript check
pnpm test                 # Vitest unit tests (one-shot)
pnpm test:watch           # Vitest watch mode
pnpm seed                 # Seed curriculum data into Supabase (requires env vars)
pnpm annotate             # Annotate exercises with grammatical spans via Claude (requires env vars)
pnpm seed:ai              # Generate new concepts + top-up existing → docs/curriculum-review-YYYY-MM-DD.json
pnpm seed:ai:apply        # Apply approved entries from review JSON to Supabase
```

Seed command requires env vars:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed
```
Re-seeding duplicates rows — truncate `exercises`, `concepts`, `units`, `modules` first.

Annotate command requires env vars:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm annotate
```
Annotates all exercises where `annotations IS NULL`; safe to re-run (skips already-annotated rows).

Seed:ai command requires env vars:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm seed:ai
```
Queries DB for existing exercise counts; generates missing exercises for new and existing concepts; writes review JSON to `docs/`. Set `_approved: true` on entries, then run `pnpm seed:ai:apply [--dry-run] <file>`.

## Git / GitHub Workflow

After every meaningful change or completed work step:
1. Stage specific files (never `git add -A` blindly)
2. Commit with a clear conventional message (`feat:`, `fix:`, `chore:` etc.)
3. Push to `origin main` (`git push origin main`)

Remote: `https://github.com/Nicolas2892/LanguageApp.git`

## Architecture

### Tech Stack
- **Next.js 16** (App Router, `src/` layout, TypeScript, Server + Client Components)
- **Supabase** — Postgres + Auth + RLS (no Supabase CLI; migrations run manually in SQL editor)
- **Claude API** (`claude-sonnet-4-20250514`) — grades every exercise response; no user self-rating
- **shadcn/ui** + Tailwind v4 (Neutral theme)
- **recharts** — progress analytics charts
- **Vitest** + **@testing-library/react** — unit + component tests (`src/**/__tests__/`)
- **pnpm** — package manager

### Key Dependency Constraints
- `zod` pinned to **v3** — do NOT upgrade; v4 breaks `@hookform/resolvers@4`
- Supabase types are hand-written in `src/lib/supabase/types.ts` (not CLI-generated). Every table must have a `Relationships: []` array or the SDK types all columns as `never`. After any `.select()` / `.single()`, always cast: `data as MyType`.

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
```

### Route Map
| Route | Type | Purpose |
|---|---|---|
| `/` | Server | Redirects → `/dashboard` or `/auth/login` |
| `/auth/login` `/auth/signup` | Client | Email/password auth forms |
| `/auth/callback` | Route handler | Supabase OAuth code exchange |
| `/onboarding` | Server + Client | 6-question diagnostic for new users; seeds SRS on completion |
| `/dashboard` | Server | Due count, streak, mastered count, progress bar, quick-nav |
| `/study` | Server + Client | Study session — queue fetched server-side, state machine client-side |
| `/study/configure` | Server + Client | Session config — pick module + exercise types before starting |
| `/curriculum` | Server | Full concept tree with mastery badges; all concepts/units/modules are clickable |
| `/progress` | Server | 4-card stats, CEFR level progress bars, horizontal AccuracyChart, ActivityHeatmap |
| `/tutor` | Server + Client | Streaming AI chat; accepts `?concept=<id>` for context |
| `POST /api/submit` | Route handler | Grade answer → SM-2 → upsert `user_progress` → insert `exercise_attempts` → update streak |
| `POST /api/hint` | Route handler | Claude-generated worked example for stuck users |
| `POST /api/chat` | Route handler | Streaming tutor chat (plain text ReadableStream) |
| `POST /api/onboarding/complete` | Route handler | Bulk SRS seed from diagnostic scores → set `onboarding_completed = true` |
| `POST /api/sessions/complete` | Route handler | Insert `study_sessions` row with timing + accuracy |
| `/write` | Server + Client | AI-generated free-write prompt for a concept; `?concept=<id>` required |
| `POST /api/topic` | Route handler | Claude generates a writing prompt for a given concept (non-streaming) |
| `POST /api/grade` | Route handler | Grade free-write answer (no exercise DB row); SM-2 + streak; `exercise_id: null` |

### Middleware Rules (`src/lib/supabase/middleware.ts`)
- Unauthenticated → redirect to `/auth/login` (except `/auth/*`)
- Authenticated + `onboarding_completed = false` → redirect to `/onboarding`
  - **API routes (`/api/*`) are excluded from this redirect** — they must never be redirected to a page
- Both checks skip `/auth/*`

### Study Session Query Params (`/study`)
| Param | Effect |
|---|---|
| _(none)_ | Default SRS due queue for today |
| `?concept=<id>` | Practice a single concept (ignores due date) |
| `?unit=<id>` | All concepts in a unit |
| `?module=<id>` | All concepts in a module |
| `?types=gap_fill,translation,...` | Filter exercises by type (comma-separated) |
| `?mode=new` | Unlearned concepts queue (not in `user_progress`), ordered by difficulty; redirects `/dashboard` if none remain |

Session configure page (`/study/configure`) builds these params via a UI before redirecting to `/study`.

### Exercise Types & Components
| Type | Component | Notes |
|---|---|---|
| `gap_fill` | `GapFill.tsx` | Single-line input |
| `transformation` `translation` `free_write` | `TextAnswer.tsx` | Multi-line textarea |
| `sentence_builder` | `SentenceBuilder.tsx` | Word chip bank; parses `[w1/w2/w3]` tokens from prompt |
| `error_correction` | `ErrorCorrection.tsx` | Extracts `"quoted sentence"` from prompt, pre-populates textarea with warning |

All routed through shared `ExerciseRenderer` in `src/components/exercises/ExerciseRenderer.tsx`.

### Core Learning Loop
1. `StudySession.tsx` state: `answering → feedback → [try again | next] → done`
2. `POST /api/submit` — Claude grades → SM-2 update → DB writes → streak update (once per day)
3. `POST /api/sessions/complete` — fired (fire-and-forget) when session ends; writes `study_sessions` row
4. `src/lib/srs/index.ts` — pure `sm2(progress, score)` function; scores 0–3 from Claude only
5. New users auto-bootstrapped with 5 easiest concepts on first visit (unless onboarding seeded SRS)

### Streak Logic
- Updated in `POST /api/submit` on the **first submission of each calendar day**
- If `last_studied_date == yesterday` → `streak + 1`
- If gap > 1 day (or null) → `streak = 1`
- If `last_studied_date == today` → no-op (already counted)
- Stored in `profiles.streak` and `profiles.last_studied_date`

### Hint System
Wrong attempt 1 → shows `hint_1`. Wrong attempt 2 → shows `hint_2`. Wrong attempt 3+ → "Show worked example" button → calls `POST /api/hint` → Claude generates a fresh example. Resets on each new exercise.

### AI Tutor
- `src/lib/claude/tutor.ts` — `buildTutorSystemPrompt(ctx)` injects user name, level, current concept, up to 5 recent error feedbacks
- `POST /api/chat` streams plain text chunks; client reads via `response.body.getReader()`
- `TutorChat.tsx` appends tokens to the last assistant message as they arrive

### Supabase Clients
- `src/lib/supabase/client.ts` — browser client (`'use client'` components)
- `src/lib/supabase/server.ts` — server client (Server Components + Route Handlers)
- `src/lib/supabase/middleware.ts` — session refresh + auth/onboarding gating, consumed by `src/middleware.ts`

All routes except `/auth/*` redirect unauthenticated users to `/auth/login`. Profile auto-created on signup via `handle_new_user` Postgres trigger.

### Database Schema
| Table | Purpose |
|---|---|
| `profiles` | One row per user; `streak`, `last_studied_date`, `onboarding_completed`, `computed_level` |
| `modules / units / concepts / exercises` | Curriculum hierarchy (publicly readable); `concepts.level` = B1/B2/C1 |
| `user_progress` | SRS state per user+concept (`ease_factor`, `interval_days`, `due_date`, `repetitions`, `production_mastered`) |
| `exercise_attempts` | Full attempt history with AI score + feedback |
| `study_sessions` | Session analytics — written by `/api/sessions/complete` |

Migrations (run once in Supabase SQL editor):
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_onboarding_flag.sql`
- `supabase/migrations/003_indexes.sql` — study_sessions index (already applied)
- inline (applied) — `ALTER TABLE exercise_attempts ALTER COLUMN exercise_id DROP NOT NULL;`
- `supabase/migrations/005_fix_google_oauth_trigger.sql` — fixed handle_new_user trigger for Google OAuth
- `supabase/migrations/006_computed_level.sql` — `concepts.level`, `user_progress.production_mastered`, `profiles.computed_level`; seeds 21 concept CEFR tags; grandfathers existing production attempts
- `supabase/migrations/007_grammar_focus.sql` — `concepts.grammar_focus text CHECK ('indicative'|'subjunctive'|'both')`; seeded for all 21 concepts
- `supabase/migrations/008_exercise_annotations.sql` — `exercises.annotations jsonb NULL`; filled by `pnpm annotate` after running

### Dashboard Stats
- **Streak**: live from `profiles.streak` (updated on first daily submit)
- **Mastered**: `user_progress` rows where `interval_days >= 21` (matches curriculum mastery threshold)
- **Curriculum progress bar**: mastered / total concepts × 100%
- `isNewUser` flag uses `studiedCount` (any `user_progress` row), not `masteredCount`

### Curriculum Seed Content
**Currently in DB** (85 concepts, 787 exercises — Feat-E complete):
- Module 1: Connectors & Discourse Markers — 4 units, 23 concepts
- Module 2a: The Subjunctive: Core — 1 unit, 5 concepts
- Module 2b: The Subjunctive: Advanced — 2 units, 8 concepts
- Module 3: Past Tenses — 3 units, 11 concepts
- Module 4: Core Spanish Contrasts — 3 units, 12 concepts
- Module 5: Verbal Periphrases — 3 units, 13 concepts
- Module 6: Complex Sentences — 3 units, 13 concepts
- ~9 exercises per concept (3 per exercise type); 56/61 null-annotation exercises annotated
- Full plan: `src/lib/curriculum/curriculum-plan.ts`; design reference: `docs/curriculum-design.md`
- ⚠️ Do NOT re-run `pnpm seed:ai:apply` on an existing review file — no idempotency guard, will create duplicate concept rows. See `docs/completed-features.md` Feat-E for cleanup procedure.

### Shared Modules (added in pre-Phase 6 audit)
- `src/lib/constants.ts` — SESSION_SIZE=10, BOOTSTRAP_SIZE=5, MASTERY_THRESHOLD=21
- `src/lib/scoring.ts` — SCORE_CONFIG (score→label/colour map used by FeedbackPanel + DiagnosticSession)
- `src/components/exercises/ExerciseRenderer.tsx` — shared exercise switch (used by StudySession + DiagnosticSession)
- `src/components/exercises/FreeWritePrompt.tsx` — AI prompt display + textarea; used by WriteSession
- `src/components/ErrorBoundary.tsx` — wraps StudySession, DiagnosticSession, WriteSession
- `src/lib/curriculum/run-truncate.ts` — deletes curriculum tables in FK order; `pnpm truncate`

### Free-Write Flow (P6-A)
- `/write?concept=<id>` — dedicated page; not part of SRS study queue
- `POST /api/topic` — generates prompt; Claude non-streaming, max_tokens 256
- `POST /api/grade` — grades answer; mirrors `/api/submit` but no exercise lookup; inserts `exercise_attempts` with `exercise_id: null`
- `exercise_attempts.exercise_id` is nullable in DB and in `src/lib/supabase/types.ts`
- Dashboard shows "Free write" card pointing to weakest unmastered concept (hidden for new users)

### API Security (added in pre-Phase 6 audit)
- All 5 POST routes validated with Zod v3 schemas (submit, hint, chat, onboarding/complete, sessions/complete)
- `/api/hint` cross-validates exercise.concept_id === requested concept_id
- `/api/chat` ReadableStream has try/catch for mid-stream errors
- `next.config.ts` — reactStrictMode=true + X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy

## Current Status

**Test suite: 1132 tests across 31 files — all passing.**

Completed: Phases 1–8 (auth, SRS, all exercise types, study session, tutor, progress analytics, curriculum, onboarding, PWA, drill mode), Phase 9 fixes (Fix-A–E), UX improvements (UX-A–C, UX-D, UX-E, UX-G, UX-H, UX-I through UX-S, UX-U, UX-V, UX-X, UX-AC–AE, UX-AF, UX-AG), Ped-A (multi-blank gap-fill), Ped-C (computed level), Ped-D (gap-fill same-concept redesign), Ped-E (grammatical highlighting), Ped-H (SRS interleaving), Feat-B (Sprint Mode), Feat-C (grammar focus chips), **Feat-E (content expansion — 85 concepts, 787 exercises live across 7 modules)**, **Feat-C (guided CEFR progression — B1→B2→C1 unlock in automatic queue)**, **Feat-H (Design & UX review)**, Copy-A–K (copy sprint), **Security sprint (SEC-01, SEC-03, SEC-04, SEC-05)**, **Architecture (ARCH-01, ARCH-03)**, **Performance (PERF-02, PERF-05)**.

→ Full implementation details of all completed work: `docs/completed-features.md`

---

### Phase 9 — Backlog

Items are grouped by type and roughly ordered by priority within each group. Completed items moved to `docs/completed-features.md`.

#### Pedagogical / Learning Quality

**Ped-B** ✅ *Complete — see `docs/completed-features.md`*

**Ped-D: Gap-fill same-concept redesign** ✅ *Complete — see `docs/completed-features.md`*

**Ped-F: Shared AI-generated exercise pool + adaptive grading strategy** *(requires PM/UX research before implementation)*
- **Problem statement**: Currently, drill mode generates exercises per-user on demand, wasting tokens and producing fragmented, non-reusable content. As the concept pool grows (Feat-E target: 40+ concepts), individual per-user generation is unsustainable.
- **Core idea**: AI-generated exercises should be inserted into the shared `exercises` table (already done via service role in `/api/exercises/generate`) and served to ALL users — not regenerated per user. Before generating, the route should check whether sufficient exercises already exist for that concept (e.g. ≥ N exercises) and skip generation entirely if so.
- **Token efficiency rule**: Define a per-concept exercise cap (e.g. 10–15 exercises). If `COUNT(exercises WHERE concept_id = X) >= cap`, return existing exercises randomly rather than generating new ones. This prevents unbounded growth and eliminates duplicate token spend.
- **Grading strategy open question**: As the pool grows from 3 → 10–15 exercises per concept, the current implicit model of "pass all exercises = mastered" breaks down. Two candidate approaches:
  1. **Relative mastery**: SM-2 SRS already operates per-concept, not per-exercise — grading is already relative (a score feeds into ease_factor and interval regardless of how many exercises exist). This may already be correct and no change needed.
  2. **Stratified sampling**: Ensure each study session samples exercises proportionally across exercise types (gap_fill, translation, transformation, free_write, etc.) so a growing pool doesn't skew toward the most-common type.
- **UX open question**: Should users see which exercises are "shared" vs. "seeded"? Or is the pool fully transparent? Does the user get any agency over generation (e.g. "Generate a new variation")?
- **Research needed before implementation**:
  - Define the per-concept exercise cap and the trigger condition for generation (e.g. always top-up to N)
  - Decide whether exercise deduplication is needed (similar prompts from different generation runs)
  - Confirm the grading model is truly concept-level (SRS) and not exercise-level — review `/api/submit` and SM-2 logic
  - Consider admin tooling (Strat-B) to review and curate AI-generated exercises before they enter the shared pool
- **Do not implement without a written PM decision on cap, dedup, and grading model.**

**Ped-E: Grammatical structure highlighting** ✅ *Complete — see `docs/completed-features.md`*

**Ped-G: Mistake review mode**
- Research: Serfaty & Serrano (2024) showed learners who completed 3+ relearning sessions on previously-wrong items scored dramatically higher on delayed posttests. Error-targeted relearning is the single highest-ROI study activity.
- Pull from `exercise_attempts WHERE score <= 1` for the current user, re-queue those exercises as a dedicated study mode ("Review mistakes").
- Surface as a card on dashboard (when mistake count > 0) and as an option in `/study/configure`.
- No new DB schema needed — data already exists in `exercise_attempts`.
- Dedup: show each concept at most once per review session (pick the most-recent failed attempt per concept).

**Ped-H: Interleaving in SRS queue** ✅ *Complete — see `docs/completed-features.md`*

**Ped-I: Concept grammar cheat-sheet**
- Before the first exercise of a concept in a session, show a collapsed/expandable accordion with a 2–3 sentence grammar rule summary. Fills the gap between the full tutor (chat) and zero context.
- This differentiates us from Clozemaster (no context) and KwizIQ (static help pages) — learners get just-in-time reference at the moment of practice.
- Requires `grammar_summary text` column added to `concepts` table (migration). Seed via a script that uses Claude to generate summaries for all 85 concepts (similar to `pnpm annotate` pattern).
- Show summary as a collapsible card at the top of the exercise; collapsed by default after first concept in session.

**Ped-J: "Hard" flag on a concept**
- User can mark a concept as "always include more of these." Feeds a weighted sampling so flagged concepts appear more frequently in SRS queue even if not technically due.
- Implementation: `is_hard boolean DEFAULT false` on `user_progress`. Toggle via a button (e.g., flag icon) in the study session feedback panel and on the curriculum concept row.
- Weight rule: if `is_hard = true`, treat due_date as always today (or halve the interval multiplier). Simple, no new API route needed — just modify SRS query.

#### New Features

**Feat-A: Daily email reminders** *(deferred — not wanted)*

**Feat-C: Guided CEFR progression** ✅ *Complete — see `docs/completed-features.md`*

**Feat-D: Web push notifications** ✅ *Complete — see `docs/completed-features.md`*

**Feat-E: Content expansion via AI seeding script** ✅ *Complete — see `docs/completed-features.md`*

**Feat-F: Offline exercise packs (module download)**
- User downloads a full module's exercises to IndexedDB for offline use
- `gap_fill` + `sentence_builder` graded locally (deterministic string match, accent-normalised)
- `translation` / `transformation` / `error_correction` answers queued locally; batch-submitted + AI-graded on reconnect
- `free_write` always excluded — always requires AI grading; not available offline
- SRS updates queued locally, flushed when `navigator.onLine` is true; conflict resolution needed for multi-device offline scenarios (last-write-wins or merge by most-recent timestamp)
- "One right answer" assumption holds well for gap_fill/sentence_builder; breaks for open-ended types — those must stay online-only for AI grading
- Migration: no schema change needed; offline queue lives entirely in IndexedDB on the client
- **Do not implement without a written PM decision on conflict resolution strategy and UI for queued/pending sync state.**

**Feat-G: Full Architecture and Security Review** ✅ *Complete — audit conducted 2026-03, tickets filed as SEC-01–05, PERF-01–05, ARCH-01–03 below*

#### Security

**SEC-01: SSRF via unvalidated push subscription endpoint** ✅ *Complete — see `docs/completed-features.md`*

**SEC-02: In-memory rate limiter is instance-scoped, not global** *(Critical)*
- **Vulnerability**: `src/lib/rate-limit.ts` uses a module-scope `Map`. Vercel runs multiple concurrent instances per region; each maintains an independent counter. A user can submit 60×N requests (N = warm instances) before being rate-limited — effectively bypassing the limit entirely against the Anthropic API.
- **Fix**: Replace with Vercel KV (Upstash Redis). Pattern: `await kv.incr(key)` + `kv.expire(key, windowSeconds)`. Alternatively a Supabase RPC-backed atomic counter. Remove the in-memory `Map` entirely.
- **Acceptance criteria**: Rate limit counters are consistent across all function instances. `/api/submit` returns HTTP 429 after exactly 60 requests/10 min regardless of which instance handles each request. Check adds ≤ 20ms latency at p95.

**SEC-03: No CSRF protection on state-mutating API routes** ✅ *Complete — see `docs/completed-features.md`*

**SEC-04: Prompt injection via unescaped `user_answer` in grading prompt** ✅ *Complete — see `docs/completed-features.md`*

**SEC-05: CSP missing `worker-src` and `manifest-src` directives** ✅ *Complete — see `docs/completed-features.md`*

#### Performance (from audit)

**PERF-01: Sequential DB writes block `/api/submit` response** *(High)*
- **Bottleneck**: After Claude returns, 6 DB operations execute sequentially: fetch user_progress → upsert user_progress → update production_mastered → `updateComputedLevel` (multi-join) → insert exercise_attempts → streak RPC. Each Supabase round-trip adds ~20–50ms. Total post-grading DB latency: ~150–300ms.
- **Fix**: Two-phase restructure. Phase A (blocking, needed for response): SRS upsert only. Phase B (fire-and-forget, non-blocking): `production_mastered` update, `updateComputedLevel`, `exercise_attempts` insert, streak RPC — dispatched via `Promise.all([...]).catch(console.error)` without `await`. Also parallelise the initial exercise + concept fetches into `Promise.all`.
- **Acceptance criteria**: Exercise + concept fetches are parallel. `exercise_attempts`, `updateComputedLevel`, `updateStreakIfNeeded` are fire-and-forget. `next_review_in_days` remains correct. P50 post-Claude latency reduces by ≥ 150ms.

**PERF-02: `updateComputedLevel` called on every exercise submission** ✅ *Complete — see `docs/completed-features.md`*

**PERF-03: N+1 query pattern in `/api/push/send` cron** *(High)*
- **Bottleneck**: Fetches all subscribers (1 query), then executes a separate `user_progress` count query per user. With N subscribers → N+1 queries. No pagination — at 10,000 users, loads all JSONB push_subscription blobs into memory.
- **Fix**: Single SQL query with LEFT JOIN/subquery to get subscribers + due counts in one round-trip. Process in batches of ≤ 500 with pagination.
- **Acceptance criteria**: Cron executes exactly 1 DB query regardless of subscriber count. Batches of ≤ 500 processed. Cron completes in < 10 seconds for 1,000 subscribers.

**PERF-04: Middleware DB query on every authenticated page navigation** *(Medium)*
- **Bottleneck**: `supabase/middleware.ts` queries `profiles.onboarding_completed` on every non-public page load (~20–40ms per navigation). Redundant for the 99%+ of users who completed onboarding long ago.
- **Fix**: Cache `onboarding_completed = true` in a short-lived `HttpOnly; SameSite=Lax` cookie set by `/api/onboarding/complete`. Middleware checks cookie first; only hits DB on cache miss.
- **Acceptance criteria**: Users with completed onboarding: zero DB queries in middleware. Onboarding redirect still fires correctly for new users. P50 middleware latency reduces from ~35ms to ≤ 5ms for returning users.

**PERF-05: Claude prompt caching not used on grading system prompt** ✅ *Complete — see `docs/completed-features.md`*

#### Architecture (from audit)

**ARCH-01: No CI/CD pipeline — untested code ships directly to production** ✅ *Complete — see `docs/completed-features.md`*
- **Note**: Vercel production gate must be configured manually in Project Settings → Git → Required checks.

**ARCH-02: Single Claude model for all AI tasks — suboptimal cost/speed tradeoff** *(Medium)*
- **Debt**: `TUTOR_MODEL = 'claude-sonnet-4-20250514'` used for grading (structured JSON, 512 tokens), hints (short generation, 256 tokens), tutor chat (reasoning, 1024 tokens), and exercise generation (creative, 8192 tokens). Grading and hints don't require Sonnet's reasoning capacity. Haiku 4.5 is 3–5× faster and ~10× cheaper for structured tasks.
- **Fix**: Define `GRADE_MODEL = 'claude-haiku-4-5-20251001'` for grading + hints. Keep `TUTOR_MODEL = 'claude-sonnet-4-20250514'` for chat + generation. **Prerequisite**: offline quality validation — grade 50 sample exercises with both models, confirm ≥ 90% score agreement before switching.
- **Acceptance criteria**: `grader.ts` + `/api/hint` use `GRADE_MODEL`. `tutor.ts` + exercise generate use `TUTOR_MODEL`. Offline validation test passes ≥ 90% agreement. Anthropic cost per session reduces by ≥ 60%.

**ARCH-03: `alert()` used for production error handling** ✅ *Complete — see `docs/completed-features.md`*

**Feat-H: Another Design & UX Review** ✅ *Complete — see `docs/completed-features.md`*

**Feat-I: TTS audio for exercise prompts**
- B2→C1 learners need listening exposure, but the app currently has zero audio. Even basic text-to-speech adds a listening dimension that is currently entirely absent.
- The `useSpeech` hook already exists in the codebase (used by `IOSInstallPrompt`). Wire a speaker icon button to it in GapFill, TextAnswer, and ErrorCorrection — clicking reads the prompt text aloud in Spanish using the Web Speech API (`speechSynthesis`, es-ES voice).
- Zero infrastructure cost, works cross-platform (iOS Safari, Chrome, Firefox). No new API route or DB change needed.
- UX detail: auto-play on first render of each exercise is optional (could be a user preference); manual tap is the safe default.
- Stretch: highlight the word being spoken in sync with `SpeechSynthesisUtterance.onboundary` events.

**Feat-J: Personal concept notes**
- Users want to add a personal mnemonic or note per concept (e.g., "remember: ojalá ALWAYS subjunctive"). Reduces dependency on the tutor for basic rule reminders.
- Implementation: `user_notes text` column on `user_progress` (or a separate `user_concept_notes` table if multi-note support is wanted). Simple textarea shown in a popover/drawer on the concept curriculum page and optionally in the study session footer.
- No Claude call needed — pure user text, stored in Supabase.

**Perf-A: Grading latency / time-to-answer improvements**
- **Problem**: Every exercise submission calls Claude (non-streaming) for grading. Claude Sonnet 4.6 TTFT is ~2 seconds; p95 end-to-end can be 4–6 seconds. Users sit watching a spinner after every answer, breaking flow.
- **Candidate approaches (remaining)**:
  1. **Stream the grading response** — Switch `/api/submit` to a streaming response. Send score + short label first (< 10 tokens), then stream the full feedback. Biggest UX win.
  2. ~~Prompt caching~~ ✅ *Done (PERF-05)*
  3. **Switch to Haiku for grading** — Requires offline quality validation (≥ 90% score agreement vs. Sonnet on 50 exercises) before switching. See ARCH-02.
  4. **Prefetch next exercise** — While the user reads feedback, silently fetch the next exercise data in the background. Pure frontend, no API change.
  5. **Optimistic local score for gap_fill** — Client-side accent-normalised string match for single-blank gap_fill; show "Correct!" immediately, still send to Claude async for SM-2 scoring.
- **Do not implement #3 (model switch) without an offline quality validation test.**

#### Strategic / Long-term

**Strat-A: Mirror some of Ella Verbs features by implementing a dedicated conjugation mode** 
- Enable user to run conjugation drills applying the same drill customization features also provided by ella verbs
- Enable a dictionary/list of 50/100/250 most frequent verbs including subpages for conjugation tables
- ability to 'favorite' verbs into a custom training list. 
- Conjugation should happen in sentence context
- No use of Claude for grading, everything should be prestored, rather challenge the user to fill in right conjugation in-context sentences. As a result should enable offline mode.
- Ideally mix some of the connectors/concepts that trigger subjunctive vs. indicative into pre-generated sentences to enable cross-learning. 
- Grading Model for Tense Mastery (independent of module mastery in curriculum)
- Again do indepth research as a PM And UX Designer how Ella verbs works and how we can copy the same approach they and all related features we need

**Strat-B: Admin content panel** *(deferred — implement when content iteration becomes a bottleneck)*
- `/admin` route gated by `is_admin boolean` on `profiles`
- Read-only v1: list all concepts/exercises with attempt counts
- Stretch: inline edit for concept explanation and exercise prompt text

#### Bugs / Layout Fixes

**Fix-G: Review card has wrong background in dark mode** *(implemented — `dark:bg-card` override; root cause: opacity-modified Tailwind class specificity in Tailwind v4)*

**Fix-F: Write page sticky footer misaligned on desktop (deferred)**
- **Problem**: On desktop, the sticky footer ("Start writing →" button) in `ConceptPicker.tsx` is centered against the full viewport width, while the module cards above are centered within the content area to the right of the 220px sidebar. This makes the button appear shifted left compared to the content.
- **Cause**: The footer uses `position: fixed; left: 0; right: 0`, so it spans the full viewport and ignores the `lg:ml-[220px]` wrapper in `layout.tsx`. Attempts to fix via `lg:left-[220px]` (Tailwind arbitrary responsive class — not reliably generated in Tailwind v4 without tailwind.config.js) and a `--sidebar-width` CSS variable both introduced new regressions.
- **Do not attempt again without a clear plan.** Proper fix likely requires either: (a) restructuring the footer to render outside `ConceptPicker` as a page-level element that is naturally inside the `lg:ml-[220px]` layout wrapper but uses `sticky`/`fixed` positioning, or (b) a JavaScript-based approach that reads the sidebar width at runtime.
- **Current state**: Footer is `left-0 right-0` (full width) — misaligned on desktop but functional. Mobile is unaffected.

#### UX Audits & Polish

**UX-W: Exercise UI clarity audit**
- **Problem**: The exercise screen currently renders a lot of simultaneous information: progress counter, concept name, unit breadcrumb, exercise type chip, grammar focus chip, level chip (B1/B2/C1), annotated prompt, input area, hint dots, and submit button. This is high cognitive overhead before the learner has even read the question.
- **Research**: Duolingo's 2024 home screen redesign research showed that reducing visible UI elements per screen improved task completion and reduced abandonment. Cognitive load theory (Sweller) confirms that extraneous visual elements consume working memory that should be spent on the learning task.
- **Principles to apply**:
  1. **Progressive disclosure**: show minimum needed to do the task; reveal metadata only on request.
  2. **Single focal point**: the prompt + input should be the only high-contrast elements. Everything else should be low-contrast/secondary.
  3. **Collapse metadata into one row**: merge exercise type chip, grammar focus chip, and level chip into a single compact metadata row using muted text, not coloured chips, to reduce visual noise.
  4. **Show level chip only once per concept per session** (not on every card) — after the first card, the user knows what level they're on.
  5. **Hint system**: hint dots can be hidden until the first wrong attempt (don't show 3 empty dots before the user has tried).
- **Audit tasks**:
  - Read `src/components/exercises/GapFill.tsx`, `TextAnswer.tsx`, `ErrorCorrection.tsx`, `SentenceBuilder.tsx`, and `StudySession.tsx` to inventory every UI element rendered per exercise.
  - Produce a before/after element count and propose which elements to hide, collapse, or demote to secondary styling.
  - Prototype the change in `StudySession.tsx` header area first before touching individual exercise components.
- **Do not implement without a design review of the proposed element inventory reduction.**

**UX-D: Dashboard page UX audit** ✅ *Complete — see `docs/completed-features.md`*
- Single-column layout (removed lg:grid-cols-2); LEVEL_CHIP badge; daily goal progress bar; Review card warm tint when due; Free write sub-label + fallback card; Sprint copy fix; legend "in progress" / "to start".

**UX-E: Progress page UX audit** ✅ *Complete — see `docs/completed-features.md`*
- 4-card coloured stat row (Streak/Mastered/Active skills/Accuracy); CEFR Level Journey replaces MasteryChart; horizontal colour-coded AccuracyChart; study consistency section (session count + hrs); header with subtitle + level badge; MasteryChart deleted.

**UX-F: ConceptPicker (free write concept selection) UX overhaul** ✅ *Complete — see `docs/completed-features.md`*

**UX-G: Exercise session UX audit** ✅ *Complete — see `docs/completed-features.md`*

#### Design

**Design-A: App logo** ✅ *Complete*
- Speech bubble + Ñ mark; updated `icon.tsx`, `apple-icon.tsx`, `public/logo.svg`; replaces "ES" auth block and AppHeader text mark

---

#### UX Polish & Animations

**UX-I through UX-V, UX-T** ✅ *All complete — see `docs/completed-features.md`*

**UX-X: Enter/Space to advance after feedback** ✅ *Complete — see `docs/completed-features.md`*

**UX-Y: Weekly progress snapshot on dashboard**
- Show a compact "This week" row on the dashboard: exercises completed, new concepts introduced, accuracy %, alongside a small sparkline trend vs. last week.
- Research: Duolingo's weekly recap feature measurably improved W4 retention by closing the loop on longer-term progress without requiring a full progress page visit.
- Implementation: aggregate query on `exercise_attempts` filtered to `created_at >= current_week_start`. Dashboard-only, client component. No new DB schema needed.

**UX-Z: Session time estimate**
- Show "~N min remaining" in the study session header based on a rolling average of per-exercise submission times (client-side, reset each session).
- Reduces mid-session abandonment: users who don't know how long it'll take quit early. Knowing "2 min left" creates commitment.
- Pure client-side, no backend. Rolling average seeded with a 30-second default for the first exercise.

**UX-AA: Concept mastery milestone moment**
- When a concept's `interval_days` crosses the `MASTERY_THRESHOLD` (21 days) for the first time, show a brief congratulatory overlay (beyond the session-end confetti) that names the specific concept mastered: "You've mastered *El subjuntivo con ojalá*!"
- Bridges the gap between short-term feedback (confetti on session end) and long-term identity ("I am mastering Spanish"). Research on intrinsic motivation shows named milestones build stronger long-term engagement than generic rewards.
- Implementation: check in `/api/submit` response whether `interval_days` just crossed 21 (was < 21, now ≥ 21). Return a `mastered: true` flag. `StudySession.tsx` shows the milestone overlay before advancing.

**UX-AB: Concept explanation card — collapse on repeat exercises**
- **Problem**: The "Concept" explanation card renders on every exercise, including the 5th time a user sees the same concept in a session. On mobile it pushes the exercise prompt below the fold.
- **Solution**: Track the current concept ID across the session. Show the full card only on the **first exercise of each concept** per session. On subsequent exercises for the same concept, collapse to a single-line `"[Concept title]  ↓ remind me"` toggle that expands inline on tap.
- **Implementation**: In `StudySession.tsx`, add a `seenConceptIds` ref (Set) that persists across renders. Before rendering the explanation card, check if `current.concept.id` is already in the set. Add it on first render. Collapse state drives a `max-height` transition (200ms ease-in) — no display:none.
- **Acceptance criteria**: First exercise of each new concept → full card visible. Repeat concept → single-line collapsed toggle. Expand/collapse animates in 200ms. No layout shift.

**UX-AC: Feedback panel — visual answer comparison blocks** ✅ *Complete — see `docs/completed-features.md`*

**UX-AD: Session done screen — score-bracket emotional framing** ✅ *Complete — see `docs/completed-features.md`*

**UX-AE: Onboarding diagnostic — assessment feel, not pop quiz** ✅ *Complete — see `docs/completed-features.md`*

**UX-AF: Dashboard primary action card — filled treatment when reviews are due** ✅ *Complete — see `docs/completed-features.md`*

**UX-AG: Progress page — fix "Where you're strongest" section** ✅ *Complete — see `docs/completed-features.md`*

---

#### Copy & Tone

**Copy-A through Copy-K** ✅ *All complete — see `docs/completed-features.md`*

---

## Recommended Next Steps (priority order)

### Security & performance (remaining)
1. SEC-02 — Global rate limiter (Vercel KV / Upstash Redis) — replace in-memory Map
2. PERF-01 — Parallelise + fire-and-forget DB writes in `/api/submit`
3. ARCH-02 — Per-task Claude model (Haiku for grading; validate ≥90% agreement first)
4. PERF-03 — N+1 fix in push cron (single JOIN + pagination)
5. PERF-04 — Middleware onboarding check cache (HttpOnly cookie)

### Polish & effectiveness
1. Perf-A #4 — Prefetch next exercise during feedback (pure frontend)
2. Ped-G — Mistake review mode (`exercise_attempts WHERE score <= 1`)
3. UX-AB — Concept explanation collapse on repeat exercises
4. UX-W — Exercise UI clarity audit (design review before implementing)
5. Ped-I — Grammar cheat-sheet (`grammar_summary` column + collapsible card)
6. Feat-I — TTS audio (wire `useSpeech` to exercise prompts)
7. UX-AA — Concept mastery milestone overlay
8. UX-Y — Weekly progress snapshot on dashboard
9. UX-Z — Session time estimate
10. Ped-J — "Hard" flag on a concept

### Growth features (deferred)
- Strat-A — Conjugation mode (mirror Ella Verbs)
- Strat-B — Admin content panel (`/admin` gated by `is_admin`)
- Feat-F — Offline exercise packs (IndexedDB; PM decision needed first)
- Feat-A — Daily email reminders *(not wanted — deferred indefinitely)*