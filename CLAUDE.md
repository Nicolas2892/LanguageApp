# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
pnpm validate:grading     # ARCH-02 offline validation: grade 50 attempts with Haiku vs Sonnet baseline
```

Post-deploy API smoke check (requires env vars):
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm exec tsx scripts/smoke-test.ts
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
- **Claude API** — `claude-sonnet-4-20250514` (TUTOR_MODEL) for tutor + exercise generation; `claude-haiku-4-5-20251001` (GRADE_MODEL) for grading + hints (validated 93.8% score agreement vs Sonnet)
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
| `POST /api/concepts/[id]/hard` | Route handler | Toggle `is_hard` flag on `user_progress`; update-then-insert pattern |

### Middleware Rules (`src/lib/supabase/middleware.ts`)
- Unauthenticated → redirect to `/auth/login` (except `/auth/*`)
- Authenticated + `onboarding_completed = false` → redirect to `/onboarding`
  - **API routes (`/api/*`) are excluded from this redirect** — they must never be redirected to a page
- Both checks skip `/auth/*`

### Study Session Query Params (`/study`)
| Param | Effect |
|---|---|
| _(none)_ | Default SRS due queue for today |
| `?practice=true` | **Open Practice** — full catalog, no SRS due-date gate; guarantees ≥ MIN_PRACTICE_SIZE exercises via cycling |
| `?practice=true&concept=<id>` | Open Practice for a single concept (≥ 5 exercises, cycling) |
| `?practice=true&concept=<id>&types=<type>` | Narrow drill mode — all exercises of type; enables AI generation |
| `?practice=true&unit=<id>` | Open Practice for all concepts in a unit |
| `?practice=true&module=<id>` | Open Practice for all concepts in a module |
| `?concept=<id>` | Falls through to SRS default — use `practice=true&concept=<id>` for open practice |
| `?unit=<id>` | All concepts in a unit (SRS path) |
| `?module=<id>` | All concepts in a module (SRS path) |
| `?types=gap_fill,translation,...` | Filter exercises by type (comma-separated) |
| `?mode=new` | Unlearned concepts queue (not in `user_progress`), ordered by difficulty; redirects `/dashboard` if none remain |
| `?mode=review` | Mistake review — most-recent failed attempt per concept (score ≤ 1) |
| `?mode=sprint` | Sprint mode — SRS due queue with time or count cap; see `limitType` + `limit` params |

Session configure page (`/study/configure`) builds these params via a UI before redirecting to `/study`. Three modes: **SRS Review**, **Open Practice**, **Review mistakes**. Pre-selects Open Practice when `?mode=practice` is in the configure URL (e.g. from "Practice anyway" on dashboard).

### Exercise Types & Components
| Type | Component | Notes |
|---|---|---|
| `gap_fill` | `GapFill.tsx` | Single-line input; SpeakButton wired |
| `transformation` `translation` `free_write` | `TextAnswer.tsx` | Multi-line textarea; SpeakButton wired |
| `sentence_builder` | `SentenceBuilder.tsx` | Word chip bank; parses `[w1/w2/w3]` tokens from prompt; SpeakButton wired |
| `error_correction` | `ErrorCorrection.tsx` | Extracts `"quoted sentence"` from prompt, pre-populates textarea; SpeakButton wired |
| `free_write` (write page) | `FreeWritePrompt.tsx` | SpeakButton + STT mic dictation (Web Speech API, es-ES) |

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
`HintPanel` is gated behind `wrongAttempts > 0` — not rendered on first attempt (progressive disclosure). Wrong attempt 1 → shows `hint_1`. Wrong attempt 2 → shows `hint_2`. Wrong attempt 3+ → "Show worked example" button → calls `POST /api/hint` → Claude generates a fresh example. Resets on each new exercise.

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
| `user_progress` | SRS state per user+concept (`ease_factor`, `interval_days`, `due_date`, `repetitions`, `production_mastered`, `is_hard`) |
| `exercise_attempts` | Full attempt history with AI score + feedback |
| `study_sessions` | Session analytics — written by `/api/sessions/complete` |

Migrations (run once in Supabase SQL editor):
- `001–009`: initial schema, onboarding flag, indexes, exercise_id nullable, Google OAuth trigger fix, computed_level, grammar_focus, exercise annotations, push_subscription
- `supabase/migrations/010_theme_preference.sql` — `profiles.theme_preference text DEFAULT 'system'`
- `supabase/migrations/011_streak_rpc.sql` — `increment_streak_if_new_day(p_user_id uuid)` atomic RPC
- `supabase/migrations/012_push_due_count_rpc.sql` — `get_subscribers_with_due_counts(...)` RPC
- `supabase/migrations/013_hard_flag.sql` — `user_progress.is_hard boolean NOT NULL DEFAULT false`

### Dashboard Stats
- **Streak**: live from `profiles.streak` (updated on first daily submit)
- **Mastered**: `user_progress` rows where `interval_days >= 21` (matches curriculum mastery threshold)
- **Curriculum progress bar**: mastered / total concepts × 100%
- `isNewUser` flag uses `studiedCount` (any `user_progress` row), not `masteredCount`

### Curriculum Seed Content
**Currently in DB** (85 concepts, 787 exercises):
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

### Key Shared Components & Utilities
- `src/lib/constants.ts` — SESSION_SIZE=10, BOOTSTRAP_SIZE=5, MASTERY_THRESHOLD=21, MIN_PRACTICE_SIZE=5, LEVEL_CHIP, HARD_INTERVAL_MULTIPLIER=0.6
- `src/lib/practiceUtils.ts` — `cycleToMinimum(items, min)` pads Open Practice sessions to at least MIN_PRACTICE_SIZE; avoids consecutive duplicates when pool ≥ 2
- `src/lib/scoring.ts` — SCORE_CONFIG (score→label/colour map)
- `src/lib/claude/client.ts` — anthropic client + TUTOR_MODEL + GRADE_MODEL constants
- `src/lib/hooks/useSpeech.ts` — TTS hook; `src/components/SpeakButton.tsx` — speaker button (wired in all 5 exercise types)
- `src/lib/hooks/useSpeechRecognition.ts` — STT hook (Web Speech API, es-ES, SSR-safe); `src/components/MicButton.tsx` — mic button used in FreeWritePrompt
- `src/components/exercises/ExerciseRenderer.tsx` — shared exercise switch
- `src/components/exercises/FreeWritePrompt.tsx` — AI prompt + textarea + SpeakButton + MicButton; used by WriteSession
- `src/components/ErrorBoundary.tsx` — wraps StudySession, DiagnosticSession, WriteSession
- `src/components/HardFlagButton.tsx` — orange Flag icon; optimistic toggle with revert on failure; rate-limited via `/api/concepts/[id]/hard`
- `src/lib/rate-limit.ts` — `checkRateLimit(userId, routeKey, opts)` sliding-window (backed by @vercel/kv)
- `src/lib/api-utils.ts` — `updateStreakIfNeeded` + `updateComputedLevel` shared by submit + grade

### API Security
- All POST routes validated with Zod v3 schemas
- CSRF protection via `validateOrigin` in `src/lib/api-utils.ts` — set `NEXT_PUBLIC_SITE_URL=https://<domain>` in Vercel env vars to enable strict mode
- `next.config.ts` — CSP, X-Frame-Options, Referrer-Policy, `Permissions-Policy: microphone=()` globally; `/write(.*)` overrides to `microphone=(self)` for STT

### Free-Write Flow
- `/write?concept=<id>` — dedicated page; not part of SRS study queue
- `POST /api/topic` — generates prompt; Claude non-streaming, max_tokens 256
- `POST /api/grade` — grades answer; inserts `exercise_attempts` with `exercise_id: null`
- STT mic button overlaid on textarea; transcript appended with space separator; permission-denied + unsupported-browser (Firefox) fallbacks

---

## Current Status

**Test suite: 1239 tests across 42 files — all passing.**

**E2E: Playwright smoke tests** (`pnpm test:e2e`) — 4 scenarios. Requires `.env.e2e` with `E2E_BASE_URL`, `E2E_EMAIL`, `E2E_PASSWORD`.

**CI: Fully green (TypeScript + lint + tests).**

→ Full implementation history: `docs/completed-features.md`

---

## Backlog

Items are ordered by priority within each group. Full details of completed work in `docs/completed-features.md`.

### Pedagogical / Learning Quality

**Ped-F: Shared AI-generated exercise pool + adaptive grading strategy** *(PM research required before implementation)*
- Currently, drill mode generates exercises per-user on demand, wasting tokens. AI-generated exercises should insert into the shared `exercises` table and be served to all users.
- Define a per-concept exercise cap (e.g. 10–15). If `COUNT >= cap`, return existing exercises randomly rather than generating new ones.
- Open questions: deduplication strategy, whether stratified sampling by exercise type is needed, admin tooling (Strat-B) for curation.
- **Do not implement without a written PM decision on cap, dedup, and grading model.**

**Ped-I: Concept explanation content audit** *(very low priority — content only, no code)*
- A "Concept Notes" collapsible already exists in `StudySession.tsx` showing `concept.explanation`. No new column or UI needed.
- Audit whether existing `explanation` values are concise and rule-focused enough to be useful at exercise time, or whether they are too wordy/vague.
- If poor quality: rewrite via a Claude batch script (similar to `pnpm annotate`) — no DB schema change required.
- **Do not implement until the core learning loop is stable and content quality becomes a measurable problem.**

### New Features

**Feat-F: Offline exercise packs (module download)** *(PM decision required first)*
- `gap_fill` + `sentence_builder` graded locally (accent-normalised string match); open-ended types (`translation`, `transformation`, `error_correction`) queued for AI grading on reconnect; `free_write` always excluded.
- SRS updates queued in IndexedDB, flushed when `navigator.onLine` is true; conflict resolution strategy needed.
- **Do not implement without a written PM decision on conflict resolution and sync UI.**

**Feat-A: Daily email reminders** *(deferred — not wanted)*

### Bugs / Layout Fixes

**Fix-F: Write page sticky footer misaligned on desktop** *(deferred)*
- Footer uses `position: fixed; left: 0; right: 0`, ignoring the `lg:ml-[220px]` sidebar layout wrapper.
- Proper fix: restructure footer to render inside the layout wrapper using `sticky`, or read sidebar width at runtime via JS.
- Do not attempt again without a clear plan — previous fixes introduced regressions.

### Performance

**Perf-A: Stream grading response** *(remaining item)*
- Switch `/api/submit` to streaming: send score + label first (< 10 tokens), then stream full feedback. Biggest latency UX win remaining.
- Also consider: optimistic local score for single-blank `gap_fill` (client-side accent-normalised match → show "Correct!" immediately, submit to Claude async for SM-2).

### Strategic / Long-term

**Strat-A: Conjugation mode (mirror Ella Verbs)**
- Conjugation drills in sentence context; dictionary of 50/100/250 most-frequent verbs with conjugation table subpages; favourite verbs list; pre-generated sentences mixing subjunctive/indicative triggers for cross-learning; local grading (no Claude); tense mastery model independent of SRS.
- Research needed: deep PM/UX audit of Ella Verbs feature set before implementation.

**Strat-B: Admin content panel** *(deferred — implement when content iteration becomes a bottleneck)*
- `/admin` route gated by `is_admin boolean` on `profiles`; read-only v1 (concept/exercise list with attempt counts); stretch: inline edit.

**Strat-C: Evaluate Claude API audio for pronunciation exercises** *(future research only)*
- Current STT (Web Speech API) is optimised for fluent native speech. For a future pronunciation exercise type, evaluate `claude-sonnet-4-6` native audio input (MP3/WAV/WebM) for combined transcription + accuracy scoring.
- Trade-offs: higher accuracy on learner speech; +1–3s latency; per-call cost; needs `/api/transcribe` + `MediaRecorder`.
- **Do not implement without a defined pronunciation exercise type and PM decision on accuracy requirements.**

**Fix-J: STT (speech-to-text) broken on free-write page — investigate and replace Web Speech API** *(bug + research)*
- Current implementation uses the Web Speech API (`useSpeechRecognition.ts` / `MicButton.tsx`) which is Chromium-only (Chrome, Edge, Arc). Not supported on Safari or Firefox.
- iPhone users (Safari) cannot use dictation at all — this is a critical gap given iOS is a primary target platform.
- **Investigation needed**: reproduce the Edge bug (mic icon present but STT produces no transcript); confirm whether it's a permissions issue, CSP header conflict, or API availability.
- **Replacement candidates to evaluate**:
  1. **Google Cloud Speech-to-Text API** — broad browser/device support via `MediaRecorder` + server-side `/api/transcribe`; cost ~$0.006/15s; requires `GOOGLE_STT_API_KEY` env var.
  2. **OpenAI Whisper API** — high accuracy on learner speech; similar `MediaRecorder` pattern; $0.006/min; already in Vercel infra pattern.
  3. **Claude API audio input** — see Strat-C; higher latency but no extra vendor.
- **Acceptance criteria**: STT works on iOS Safari + Chrome + Edge; graceful fallback (hidden mic button) on unsupported environments.
- **Do not implement without a PM decision on vendor, cost model, and whether to keep Web Speech API as a fast-path for Chrome.**

---

## Recommended Next Steps (priority order)

### Polish & effectiveness
1. Perf-A — Stream grading response

### Growth features (deferred)
- Strat-A — Conjugation mode (deep PM/UX research first)
- Strat-B — Admin content panel
- Feat-F — Offline exercise packs (PM decision on conflict resolution first)
- Feat-A — Daily email reminders *(not wanted — deferred indefinitely)*
