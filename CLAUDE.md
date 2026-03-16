# [CLAUDE.md](http://CLAUDE.md)

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
pnpm seed:verbs           # Generate verb sentences via Claude Haiku → docs/verb-sentences-YYYY-MM-DD.json
pnpm seed:verbs:apply     # Insert verb_sentences rows from review JSON
pnpm validate:grading     # ARCH-02 offline validation: grade 50 attempts with Haiku vs Sonnet baseline
pnpm push:keygen          # Generate VAPID key pair for push notifications
pnpm backfill:translations # Backfill verb_sentences.english via Claude Haiku (~2700 rows)
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

Seed:verbs command requires env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm seed:verbs
```

Inserts 50 verbs into `verbs` table, then generates 3 sentences per verb × tense (350 combos) via Claude Haiku. Resume-safe — skips combos already written. Then run `pnpm seed:verbs:apply [--dry-run] <file>`. Idempotent — skips combos already in DB.

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
- **Vitest** + **@testing-library/react** — unit + component tests (`src/**/__tests__/`)
- **pnpm** — package manager

### Key Dependency Constraints

- `zod` pinned to **v3** — do NOT upgrade; v4 breaks `@hookform/resolvers@4`
- Supabase types are hand-written in `src/lib/supabase/types.ts` (not CLI-generated). Every table must have a `Relationships: []` array or the SDK types all columns as `never`. After any `.select()` / `.single()`, always cast: `data as MyType`.
- Do NOT use join syntax (e.g. `verbs(id, infinitive)`) in `.select()` calls for tables with `Relationships: []` — the SDK returns `SelectQueryError`. Fetch related data in a separate query and join in TypeScript.
- `idb` v8 — Promise-based IndexedDB wrapper (Feat-F offline storage). `fake-indexeddb` v6 for Vitest tests. IDB stores use `0 | 1` for synced flags (IDB can't index booleans).

### Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_SENTRY_DSN          # Sentry error monitoring (Infra-B)
SENTRY_ORG                      # Sentry org slug (source map upload)
SENTRY_PROJECT                  # Sentry project slug
SENTRY_AUTH_TOKEN               # Sentry auth token (source map upload)
NEXT_PUBLIC_POSTHOG_KEY         # PostHog product analytics (Infra-A)
NEXT_PUBLIC_POSTHOG_HOST        # PostHog ingest host (default: https://us.i.posthog.com)
NEXT_PUBLIC_VAPID_PUBLIC_KEY    # VAPID public key for push subscriptions (Fix-L)
VAPID_PRIVATE_KEY               # VAPID private key for web-push (Fix-L)
VAPID_EMAIL                     # VAPID contact email (mailto:you@example.com) (Fix-L)
OPENAI_API_KEY                  # OpenAI Whisper STT for speech-to-text (Fix-J)
CRON_SECRET                     # Bearer token for cron-triggered push send route
```

### Route Map


| Route                           | Type            | Purpose                                                                                   |
| ------------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| `/`                             | Server          | Redirects → `/dashboard` or `/auth/login`                                                 |
| `/auth/login` `/auth/signup`    | Client          | Email/password auth forms                                                                 |
| `/auth/callback`                | Route handler   | Supabase OAuth code exchange                                                              |
| `/onboarding`                   | Server + Client | 6-question diagnostic for new users; seeds SRS on completion                              |
| `/dashboard`                    | Server          | Due count, streak, mastered count, progress bar, quick-nav                                |
| `/study`                        | Server + Client | Study session — queue fetched server-side, state machine client-side                      |
| `/study/configure`              | Server + Client | Session config — pick module + exercise types before starting                             |
| `/curriculum`                   | Server          | Full concept tree with mastery badges; all concepts/units/modules are clickable           |
| `/progress`                     | Server          | 4-card stats, CEFR level progress bars, AccuracyChart, WeeklyActivityChart, VerbTenseMastery |
| `/tutor`                        | Server + Client | Streaming AI chat; accepts `?concept=<id>` for context                                    |
| `/verbs`                        | Server + Client | Verb directory — 50 verbs, search, mastery dots, favorite toggle                          |
| `/verbs/[infinitive]`           | Server + Client | Conjugation tables per tense + mastery bars + favorite toggle                             |
| `/verbs/configure`              | Server + Client | Verb drill config — tenses, verb set, length, hint toggle                                 |
| `/verbs/session`                | Server + Client | In-sentence conjugation session; local grading; no Claude cost                            |
| `POST /api/submit`              | Route handler   | Grade answer → SM-2 → upsert `user_progress` → insert `exercise_attempts` → update streak |
| `POST /api/hint`                | Route handler   | Claude-generated worked example for stuck users                                           |
| `POST /api/chat`                | Route handler   | Streaming tutor chat (plain text ReadableStream)                                          |
| `POST /api/onboarding/complete` | Route handler   | Bulk SRS seed from diagnostic scores → set `onboarding_completed = true`                  |
| `POST /api/sessions/complete`   | Route handler   | Insert `study_sessions` row with timing + accuracy                                        |
| `/write`                        | Server + Client | AI-generated free-write prompt for a concept; `?concept=<id>` required                    |
| `POST /api/topic`               | Route handler   | Claude generates a writing prompt for a given concept (non-streaming)                     |
| `POST /api/grade`               | Route handler   | Grade free-write answer (no exercise DB row); SM-2 + streak; `exercise_id: null`          |
| `POST /api/concepts/[id]/hard`  | Route handler   | Toggle `is_hard` flag on `user_progress`; update-then-insert pattern                      |
| `POST /api/verbs/grade`         | Route handler   | Record verb conjugation attempt → `increment_verb_progress` RPC; Zod + rate-limit         |
| `POST /api/verbs/favorite`      | Route handler   | Toggle `user_verb_favorites` row; returns `{ favorited: boolean }`                        |
| `POST /api/push/test`           | Route handler   | Admin-only: send self-test push notification via webpush (Fix-L)                          |
| `POST /api/push/subscribe`      | Route handler   | Save/delete push subscription to `profiles.push_subscription`                             |
| `POST /api/push/send`           | Route handler   | Cron-triggered: batch push notifications to subscribers with due exercises                 |
| `POST /api/transcribe`          | Route handler   | OpenAI Whisper STT — accepts FormData with `audio` blob, returns `{ text }` (Fix-J)      |
| `GET /api/offline/module/[id]`   | Route handler   | Download bundle for offline study: exercises, concepts, units, progress, free-write prompts (Feat-F) |
| `GET /api/offline/verbs`        | Route handler   | Full verb data bundle; supports `?version=` for 304 Not Modified (Feat-F)                 |
| `POST /api/offline/grade-batch` | Route handler   | Batch grade queued offline attempts via Claude; creates report + push notification (Feat-F) |
| `POST /api/offline/verb-sync`   | Route handler   | Sync queued verb attempts via `increment_verb_progress` RPC (Feat-F)                      |
| `POST /api/offline/reports/[id]/review` | Route handler | Mark an offline report as reviewed (Feat-F)                                         |
| `/offline/reports`              | Server          | List of offline session reports (unreviewed + reviewed) (Feat-F)                          |
| `/offline/reports/[id]`         | Server          | Report detail: per-attempt scores, feedback, mark reviewed (Feat-F)                       |
| `DELETE /api/admin/exercises/[id]` | Route handler | Admin-only: hard-delete exercise (FK ON DELETE SET NULL preserves attempt history)         |
| `/admin/pool`                   | Server + Client | Admin exercise pool dashboard — concept × type grid with counts, "+" generate button      |


### Middleware Rules (`src/lib/supabase/middleware.ts`)

- Unauthenticated → redirect to `/auth/login` (except `/auth/*`)
- Authenticated + `onboarding_completed = false` → redirect to `/onboarding`
  - **API routes (`/api/`*) are excluded from this redirect** — they must never be redirected to a page
- Both checks skip `/auth/`*

### Study Session Query Params (`/study`)


| Param                                      | Effect                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| *(none)*                                   | Default SRS due queue for today                                                                                 |
| `?practice=true`                           | **Open Practice** — full catalog, no SRS due-date gate; guarantees ≥ MIN_PRACTICE_SIZE exercises via cycling    |
| `?practice=true&concept=<id>`              | Open Practice for a single concept (≥ 5 exercises, cycling)                                                     |
| `?practice=true&concept=<id>&types=<type>` | Narrow drill mode — all exercises of type; enables AI generation                                                |
| `?practice=true&unit=<id>`                 | Open Practice for all concepts in a unit                                                                        |
| `?practice=true&module=<id>`               | Open Practice for all concepts in a module                                                                      |
| `?concept=<id>`                            | Falls through to SRS default — use `practice=true&concept=<id>` for open practice                               |
| `?unit=<id>`                               | All concepts in a unit (SRS path)                                                                               |
| `?module=<id>`                             | All concepts in a module (SRS path)                                                                             |
| `?types=gap_fill,translation,...`          | Filter exercises by type (comma-separated)                                                                      |
| `?mode=new`                                | Unlearned concepts queue (not in `user_progress`), ordered by difficulty; redirects `/dashboard` if none remain |
| `?mode=review`                             | Mistake review — most-recent failed attempt per concept (score ≤ 1)                                             |
| `?mode=sprint`                             | Sprint mode — SRS due queue with time or count cap; see `limitType` + `limit` params                            |


Session configure page (`/study/configure`) builds these params via a UI before redirecting to `/study`. Three modes: **SRS Review**, **Open Practice**, **Review mistakes**. Pre-selects Open Practice when `?mode=practice` is in the configure URL (e.g. from "Practice anyway" on dashboard).

### Verb Session Query Params (`/verbs/session`)


| Param     | Values                                     | Effect                                 |
| --------- | ------------------------------------------ | -------------------------------------- |
| `tenses`  | comma-separated tense keys                 | Which tenses to drill                  |
| `verbSet` | `favorites` | `top25` | `top50` | `top100` | `single` | Which verbs to draw sentences from     |
| `verb`    | infinitive string                          | Used when `verbSet=single`             |
| `length`  | `10` | `20` | `30`                         | Max sentences per session              |
| `hint`    | `1`                                        | Show `[infinitive]` hint next to blank |


### Exercise Types & Components


| Type                                        | Component                    | Notes                                                                               |
| ------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| `gap_fill`                                  | `GapFill.tsx`                | Single-line input; SpeakButton wired                                                |
| `transformation` `translation` `free_write` | `TextAnswer.tsx`             | Multi-line textarea; SpeakButton wired                                              |
| `sentence_builder`                          | `SentenceBuilder.tsx`        | Word chip bank; parses `[w1/w2/w3]` tokens from prompt; SpeakButton wired           |
| `error_correction`                          | `ErrorCorrection.tsx`        | Extracts `"quoted sentence"` from prompt, pre-populates textarea; SpeakButton wired |
| `listening`                                 | `ListeningComprehension.tsx` | PASSAGE/QUESTION format; TTS auto-plays passage; comprehension answer               |
| `proofreading`                              | `Proofreading.tsx`           | TEXT/ERRORS format; user corrects 2–6 grammar errors in 6–8 sentence paragraph      |
| `register_shift`                            | `RegisterShift.tsx`          | Informal→formal register transformation; SOURCE/TARGET/CONTEXT/TEXT format           |
| `free_write` (write page)                   | `FreeWritePrompt.tsx`        | SpeakButton + STT mic dictation (Web Speech API, es-ES)                             |


All routed through shared `ExerciseRenderer` in `src/components/exercises/ExerciseRenderer.tsx`.

### Core Learning Loop

1. `StudySession.tsx` state: `answering → feedback → [try again | next] → done`
2. `POST /api/submit` — Claude grades → SM-2 update → production breadth check → DB writes → streak update (once per day)
3. `POST /api/sessions/complete` — fired (fire-and-forget) when session ends; writes `study_sessions` row
4. `src/lib/srs/index.ts` — pure `sm2(progress, score)` function; scores 0–3 from Claude only
5. New users auto-bootstrapped with 5 easiest concepts on first visit (unless onboarding seeded SRS)

### Mastery Gate (Production Breadth)

Concept mastery requires **both** conditions:
1. **SRS retention**: `interval_days >= 21`
2. **Production breadth**: ≥3 correct attempts on non-gap_fill exercises, across ≥2 different exercise types

`gap_fill` is excluded from production breadth — it tests recognition, not active production.

- `src/lib/mastery/badge.ts` — `getMasteryProgress(intervalDays, correctNonGapFill, uniqueTypes)` returns `MasteryProgress` with `srsReady`, `productionReady`, `mastered`. `getMasteryState(intervalDays, productionMastered?)` accepts optional production flag; when `false`, SRS-met concepts show as `'learning'` not `'mastered'`.
- `user_progress.production_mastered` — cached boolean flag, set to `true` when breadth gate is met (≥3 correct, ≥2 types). Used by curriculum dots, progress CEFR bars, dashboard module state, and `updateComputedLevel()`.
- `/api/submit` — queries non-gap_fill exercises + correct attempts for the concept; includes current attempt in breadth count; `justMastered` requires both gates.
- Concept detail page — shows "Progreso hacia dominio" milestone card (3 rows: SRS, correct count, type variety + chips) when concept is in `learning` state.
- Constants: `PRODUCTION_CORRECT_REQUIRED = 3`, `PRODUCTION_TYPES_REQUIRED = 2`

### Verb Conjugation Loop

1. `VerbSession.tsx` state: `answering → feedback → [try again | next] → done`
2. Grading is **local** — `gradeConjugation()` in `src/lib/verbs/grader.ts`; zero Claude cost
3. Three outcomes: `correct` (auto-advance 1.5s, green flash) · `accent_error` (orange flash, manual Next) · `incorrect` (red flash, Try Again or Next)
4. Fire-and-forget `POST /api/verbs/grade` records attempt in `verb_progress` via `increment_verb_progress` RPC
5. Session done screen shows overall % + per-tense breakdown sorted worst-first
6. Page wrapper: `max-w-2xl mx-auto` with bottom-nav-aware padding; exercise area vertically centered via flexbox
7. `SpeakButton` on sentence (speaks completed sentence with correct form inserted)
8. English translation shown below sentence when `verb_sentences.english` is non-null (gracefully hidden before backfill)
9. `VerbFeedbackPanel` shows `completedSentence` (full sentence with answer) + `tenseRule` on all outcomes (not just incorrect)

### Streak Logic

- Updated in `POST /api/submit` on the **first submission of each calendar day**
- If `last_studied_date == yesterday` → `streak + 1`
- If gap = exactly 1 missed day AND `streak_freeze_remaining > 0` AND `streak > 0` → consume freeze, preserve streak, record `streak_freeze_used_date` (Feat-G)
- If gap > 1 day (or null, or no freeze) → `streak = 1`
- If `last_studied_date == today` → no-op (already counted)
- **Streak freeze** (Feat-G): 1 free freeze per week. Auto-replenishes when `streak_freeze_remaining = 0` and 7+ days since `streak_freeze_last_replenished`. RPC returns `jsonb { freeze_used, freeze_replenished }` (callers currently ignore return).
- Stored in `profiles.streak`, `profiles.last_studied_date`, `profiles.streak_freeze_remaining`, `profiles.streak_freeze_used_date`
- **Timezone-aware** (Audit-E1): streak RPC reads `profiles.timezone` (IANA string, e.g. `America/Los_Angeles`) and uses `NOW() AT TIME ZONE user_tz`. Falls back to UTC when timezone is NULL. Client auto-syncs timezone via `TimezoneSync` component in layout. SRS `sm2()` and all server-side "today" queries also use `userLocalToday(tz)` from `src/lib/timezone.ts`.

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

All routes except `/auth/`* redirect unauthenticated users to `/auth/login`. Profile auto-created on signup via `handle_new_user` Postgres trigger.

### Database Schema


| Table                                    | Purpose                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `profiles`                               | One row per user; `streak`, `last_studied_date`, `onboarding_completed`, `computed_level`, `skip_gap_fill`, `timezone`, `streak_freeze_remaining`, `streak_freeze_used_date` |
| `modules / units / concepts / exercises` | Curriculum hierarchy (publicly readable); `concepts.level` = B1/B2/C1; `exercises.source` = 'seed' or 'ai_generated'     |
| `user_progress`                          | SRS state per user+concept (`ease_factor`, `interval_days`, `due_date`, `repetitions`, `production_mastered`, `is_hard`) |
| `exercise_attempts`                      | Full attempt history with AI score + feedback                                                                            |
| `study_sessions`                         | Session analytics — written by `/api/sessions/complete`                                                                  |
| `verbs`                                  | 50 high-frequency verbs; `infinitive`, `english`, `frequency_rank`, `verb_group`                                         |
| `verb_sentences`                         | 3 sentences per verb × tense (≥1,050 rows); `sentence` contains `_____` blank token; `english` nullable translation      |
| `user_verb_favorites`                    | User ↔ verb many-to-many favorites; unique (user_id, verb_id)                                                            |
| `verb_progress`                          | Per-user accuracy per verb × tense; `attempt_count`, `correct_count`; upserted via RPC                                   |
| `verb_conjugations`                      | Full 6-pronoun paradigm per verb × tense; `stem` = invariant prefix ('' = fully irregular); PK (verb_id, tense)          |
| `offline_reports`                        | Aggregated results from offline batch grading; `reviewed` flag for report-out UI (Feat-F)                                |
| `offline_report_attempts`                | Per-attempt results within an offline report: score, feedback, corrected_version, explanation (Feat-F)                    |


Migrations (run once in Supabase SQL editor):

- `001–009`: initial schema, onboarding flag, indexes, exercise_id nullable, Google OAuth trigger fix, computed_level, grammar_focus, exercise annotations, push_subscription
- `supabase/migrations/010_theme_preference.sql` — `profiles.theme_preference text DEFAULT 'system'`
- `supabase/migrations/011_streak_rpc.sql` — `increment_streak_if_new_day(p_user_id uuid)` atomic RPC
- `supabase/migrations/012_push_due_count_rpc.sql` — `get_subscribers_with_due_counts(...)` RPC
- `supabase/migrations/013_hard_flag.sql` — `user_progress.is_hard boolean NOT NULL DEFAULT false`
- `supabase/migrations/014_verb_conjugation.sql` — `verbs`, `verb_sentences`, `user_verb_favorites`, `verb_progress` tables + `increment_verb_progress(p_user_id, p_verb_id, p_tense, p_correct)` RPC
- `supabase/migrations/015_verb_conjugations.sql` — `verb_conjugations` table (full 6-pronoun paradigm + stem per verb × tense)
- `supabase/migrations/016_is_admin.sql` — `profiles.is_admin boolean NOT NULL DEFAULT false`; run `UPDATE profiles SET is_admin = true WHERE id = '<uuid>'` after applying
- `supabase/migrations/017_skip_gap_fill.sql` — `profiles.skip_gap_fill boolean NOT NULL DEFAULT false`
- `supabase/migrations/018_exercise_pool.sql` — `exercises.source text NOT NULL DEFAULT 'seed'` CHECK IN ('seed','ai_generated'); FK `exercise_attempts.exercise_id` changed to ON DELETE SET NULL
- `supabase/migrations/019_user_timezone.sql` — `profiles.timezone text DEFAULT NULL`; replaces `increment_streak_if_new_day` RPC to use user's IANA timezone (Audit-E1)
- `supabase/migrations/020_streak_freeze.sql` — `profiles.streak_freeze_remaining integer DEFAULT 1`, `streak_freeze_last_replenished text`, `streak_freeze_used_date text`; replaces `increment_streak_if_new_day` RPC (now `RETURNS jsonb`) with freeze logic + auto-replenish. **Note:** must `DROP FUNCTION increment_streak_if_new_day(uuid)` before running (return type change)
- `supabase/migrations/021_accuracy_rpc.sql` — `get_accuracy_by_type(p_user_id uuid)` RPC; returns per-type + `_total` accuracy rows (replaces unbounded exercise_attempts fetch on progress page)
- `supabase/migrations/022_offline_reports.sql` — `offline_reports` + `offline_report_attempts` tables with indexes (Feat-F; applied 2026-03-16)
- `supabase/migrations/023_verb_sentence_english.sql` — `verb_sentences.english text DEFAULT NULL` (UX-Verb; ⚠️ pending — run in Supabase SQL editor)

### Dashboard Stats

- **Streak**: live from `profiles.streak` (updated on first daily submit)
- **Mastered**: `user_progress` rows where `interval_days >= 21 AND production_mastered = true` (dual mastery gate)
- **Curriculum progress bar**: mastered / total concepts × 100%
- `isNewUser` flag uses `studiedCount` (any `user_progress` row), not `masteredCount`
- **Sprint card removed** — Escritura Libre card is the primary deferred action on the dashboard
- Deferred section (`DashboardDeferredSection`) runs 6 queries in two parallelised batches; wrapped in `<Suspense>` with `DashboardDeferredSkeleton`; `WindingPathSeparator` only renders before Revisar Errores when that card is actually present

### Curriculum Seed Content

**Currently in DB** (100 concepts, 924 exercises):

- Module 1: Connectors & Discourse Markers — 4 units, 23 concepts
- Module 2a: The Subjunctive: Core — 1 unit, 5 concepts
- Module 2b: The Subjunctive: Advanced — 2 units, 8 concepts
- Module 3: Past Tenses — 3 units, 11 concepts
- Module 4: Core Spanish Contrasts — 3 units, 12 concepts
- Module 5: Verbal Periphrases — 3 units, 13 concepts
- Module 6: Complex Sentences — 3 units, 13 concepts
- Module 8: Conversational & Pragmatic Markers — 4 units, 15 concepts
- B1: 9 exercises per concept (3 types × 3); B2: 15 (5 types × 3); C1: 18 (6 types × 3)
- 56/61 null-annotation exercises annotated
- Full plan: `src/lib/curriculum/curriculum-plan.ts` (100 concepts); design reference: `docs/curriculum-design.md`
- `pnpm seed:ai:apply` is now idempotent — skips concepts/exercises that already exist. Safe to re-run.

### Verb Seed Content

**Status: LIVE — migrations 014 + 015 applied, all seed data in DB**

- 100 verbs hard-coded in `src/lib/curriculum/run-seed-verbs.ts` (ranks 1–100)
- 9 tenses × 100 verbs × 3 sentences = 2,700 `verb_sentences` rows in DB
- 9 tenses × 100 verbs = 900 `verb_conjugations` rows in DB
- `verb_sentences.english` — nullable English translation column; backfilled via `pnpm backfill:translations` (Claude Haiku, batches of 20, resume-safe)
- `pnpm seed:conjugations` — generates full 6-pronoun paradigm + stem per verb × tense via Claude Haiku → `docs/verb-conjugations-YYYY-MM-DD.json`; resume-safe
- `pnpm seed:conjugations:apply <file>` — upserts `verb_conjugations` rows; idempotent (ON CONFLICT DO UPDATE)

### D5 Design System

Art Direction 5 (D5) is the live brand. Key tokens and utilities defined in `src/app/globals.css`:

**Semantic palette tokens** (`:root`):
- `--d5-ink: #1A1108` — near-black heading colour
- `--d5-terracotta: #C4522E` — primary/CTA colour (maps to `--primary`)
- `--d5-warm: #8C6A3F` — mid-tone; body labels, nav inactive (light)
- `--d5-muted: #B8AA99` — muted; nav inactive (dark), pronoun cells
- `--d5-paper: #FDFCF9` — background / button foreground

**Adaptive tokens** (auto-swap in `.dark`):
- `--d5-eyebrow` — warm in light, muted in dark
- `--d5-separator` — warm in light, muted in dark (WindingPathSeparator stroke)
- `--d5-nav-inactive` — warm in light, muted in dark

**CSS utility classes**:
- `.senda-eyebrow` — 9px, bold, tracking 0.12em, uppercase, `var(--d5-eyebrow)`; font: Plus Jakarta
- `.senda-card` — warm tint fill `rgba(140,106,63,0.07)`, 20px radius, soft box-shadow, 16px 18px padding; dark override auto via `.dark .senda-card`
- `.senda-heading` — DM Serif Display italic, `var(--d5-ink)` / `var(--d5-paper)` in dark

**Rule:** Never hardcode `text-green-*` / `bg-green-*` for brand. Use `text-primary` / `bg-primary` / `border-primary` (all resolve to terracotta). Flash animations keep green/red/orange — they are semantic feedback signals.

**D5 shared SVG atoms**:
- `src/components/SvgSendaPath.tsx` — inline terracotta S-path; props: `size?` (default 20); used in SideNav + AppHeader wordmarks
- `src/components/WindingPathSeparator.tsx` — calligraphic SVG divider; uses `--d5-separator`; place between dashboard sections
- `src/components/BackgroundMagicS.tsx` — large watermark S-path (absolute positioned); parent must be `relative overflow-hidden`; props: `opacity?` (default 0.07)
- `src/components/StreakBadge.tsx` — flame SVG + streak number; `size='sm'` (AppHeader) or `size='md'` (SideNav, shows "día/días" label + "Protegida" when freeze available); terracotta when active, muted when 0; optional `freezeAvailable` prop shows shield icon
- `src/components/StreakFreezeStatus.tsx` — compact inline chip for dashboard greeting; "Protección activa" / "Protección usada"; only renders when streak > 0
- `src/components/StreakFreezeNotification.tsx` — client-side toast notification when streak freeze was used yesterday; localStorage-gated, 6s auto-dismiss; pattern follows `StreakMilestone.tsx`
- `src/components/SplashScreen.tsx` — client-side fullscreen splash overlay; animates S-trail draw (800ms) + logo blur-fade (400ms, 400ms delay) → fade-out at 1200ms → unmount at 1700ms; uses `var(--background)` for dark mode; reduced-motion: static 600ms then fade; renders in `layout.tsx` as last child in `<PostHogProvider>`

### Key Shared Components & Utilities

- `src/lib/timezone.ts` — `userLocalToday(tz?)` returns YYYY-MM-DD in user's IANA timezone; falls back to UTC
- `src/lib/constants.ts` — SESSION_SIZE=10, BOOTSTRAP_SIZE=5, MASTERY_THRESHOLD=21, MIN_PRACTICE_SIZE=5, EXERCISE_CAP_PER_TYPE=15, LEVEL_CHIP, HARD_INTERVAL_MULTIPLIER=0.6
- `src/lib/practiceUtils.ts` — `cycleToMinimum(items, min)` pads Open Practice sessions to at least MIN_PRACTICE_SIZE; avoids consecutive duplicates when pool ≥ 2
- `src/lib/studyUtils.ts` — `biasedExercisePick(exercises, underweight)` (80% gap_fill exclusion in SRS) + `dropGapFillForPractice(items)` (~60% gap_fill drop in Open Practice)
- `src/lib/scoring.ts` — SCORE_CONFIG (score→label/colour map)
- `src/lib/verbs/constants.ts` — `TENSES`, `TENSE_LABELS` (Spanish names), `TENSE_DESCRIPTIONS`, `VerbTense` type
- `src/lib/verbs/grader.ts` — `normalizeSpanish(s)` + `gradeConjugation(userAnswer, correctForm, tenseRule)` → `VerbGradeResult`; pure functions, no network calls
- `src/lib/claude/client.ts` — anthropic client + TUTOR_MODEL + GRADE_MODEL constants
- `src/lib/hooks/useSpeech.ts` — TTS hook; `src/components/SpeakButton.tsx` — speaker button (wired in all 5 exercise types)
- `src/lib/hooks/useSpeechRecognition.ts` — STT hook (MediaRecorder → OpenAI Whisper via `/api/transcribe`, SSR-safe); `src/components/MicButton.tsx` — mic button used in FreeWritePrompt; states: idle, listening, processing, not-supported, denied
- `src/lib/openai/client.ts` — OpenAI client singleton (Whisper STT)
- `src/components/exercises/ExerciseRenderer.tsx` — shared exercise switch
- `src/components/exercises/FreeWritePrompt.tsx` — AI prompt + textarea + SpeakButton + MicButton; used by WriteSession
- `src/components/ErrorBoundary.tsx` — wraps StudySession, DiagnosticSession, WriteSession
- `src/components/HardFlagButton.tsx` — orange Flag icon; optimistic toggle with revert on failure; rate-limited via `/api/concepts/[id]/hard`
- `src/lib/rate-limit.ts` — `checkRateLimit(userId, routeKey, opts)` sliding-window (backed by @vercel/kv)
- `src/lib/mastery/badge.ts` — `getMasteryState(intervalDays, productionMastered?)`, `getMasteryProgress(intervalDays, correctNonGapFill, uniqueTypes)`, `MASTERY_DOT`, `MASTERY_BADGE`; constants `PRODUCTION_CORRECT_REQUIRED=3`, `PRODUCTION_TYPES_REQUIRED=2`
- `src/lib/mastery/computeLevel.ts` — `computeLevel(masteredByLevel, totalByLevel)` + `PRODUCTION_TYPES` array
- `src/lib/api-utils.ts` — `updateStreakIfNeeded` + `updateComputedLevel` shared by submit + grade
- `src/components/verbs/VerbCard.tsx` — verb grid card with mastery dots + favorite button
- `src/components/verbs/VerbFavoriteButton.tsx` — optimistic heart toggle → `POST /api/verbs/favorite`
- `src/components/verbs/VerbFeedbackPanel.tsx` — correct / accent_error / incorrect feedback UI
- `src/components/verbs/VerbSummary.tsx` — session done screen with per-tense breakdown
- `src/components/verbs/VerbTenseMastery.tsx` — progress page section; accuracy bars per tense sorted worst-first

### Navigation

- **SideNav** (`src/components/SideNav.tsx`) — desktop sidebar (`hidden lg:flex`); D5 design: `SvgSendaPath` + DM Serif italic wordmark, left 3px terracotta accent bar per active item (no icons), `--d5-nav-inactive` for inactive items; 6 items: Dashboard → Study → Curriculum → Verbs → Progress → Tutor; hidden on `/auth`, `/onboarding`, `/brand-preview`, `/admin`; `StreakBadge` (md) in bottom section above account link
- **BottomNav** (`src/components/BottomNav.tsx`) — mobile 5-tab bar (`lg:hidden`); Dashboard → Study → Curriculum → Verbs → Progress (Tutor removed — surfaced via AppHeader icon + FeedbackPanel link instead); active pill uses inline `rgba(184,170,153,0.28)` bg; `HIDDEN_ROUTES` includes `/verbs/session`; label font `text-[0.625rem]` (10px, WCAG compliant)
- **AppHeader** (`src/components/AppHeader.tsx`) — sticky mobile header (`lg:hidden`); `SvgSendaPath size={26}`; right side: tutor Bot icon (on `/dashboard`, `/curriculum`, `/verbs` + sub-routes only) + `StreakBadge` (sm) + avatar; hidden on `/auth`, `/study`, `/tutor`, `/onboarding`, `/brand-preview`

### Tutor Entry Points

Tutor (`/tutor`) is a reactive support feature, not a primary nav destination. Entry points:
- **AppHeader** — Bot icon on `/dashboard`, `/curriculum`, `/verbs` (mobile only, 44px touch target)
- **SideNav** — nav item (desktop only)
- **FeedbackPanel** — "Preguntale al tutor →" link when answer is incorrect + `conceptId` provided; links to `/tutor?concept=<id>`
- **Concept detail** (`/curriculum/[id]`) — "Consultar tutor →" link with `?concept=<id>` context
- **Verb detail** (`/verbs/[infinitive]`) — "Consultar tutor →" link (general, no verb context param)

### CSS Animations & Skeleton

- `animate-flash-green` — correct answer flash (green-50 wash, 200ms)
- `animate-flash-red` — incorrect answer flash (red-50 wash, 200ms)
- `animate-flash-orange` — accent error flash (amber-50 wash, 200ms) — verb session
- `animate-page-in` — route transition fade+slide (200ms)
- `animate-exercise-in` — exercise card entrance (200ms)
- `animate-senda-pulse` — skeleton loading opacity pulse (1.4s, no scale); used with `senda-skeleton-fill` class (`oklch(0.145 0 0 / 0.05)` light, `oklch(0.985 0 0 / 0.07)` dark)
- `animate-card-in` — staggered card entrance (used with `animationDelay` in dashboard cards)
- `splash-trail-draw` — stroke-dashoffset draw animation (800ms ease-out); used by SplashScreen S-trail
- `splash-logo-in` — opacity 0→1 + blur(4px)→blur(0) (400ms, 400ms delay); used by SplashScreen logo
- `splash-fade-out` — opacity 1→0 (500ms ease-in-out); applied to SplashScreen container on fade phase
- `splash-vellum` — absolute noise texture overlay (SVG feTurbulence, 0.4 opacity); subtle paper grain

### Loading Skeletons

All 7 main routes have `loading.tsx` files that mirror the real page layout to prevent layout shift during navigation:
- `dashboard/loading.tsx` — greeting bone + level chip, WindingPathSeparators, Tu Senda Diaria card, Exploración Abierta card, 3 deferred section placeholders (matches `DashboardDeferredSkeleton` pattern)
- `progress/loading.tsx` — header, 3-col stats grid (`senda-card-sm`), CEFR bars, verb mastery bars, weekly chart placeholder; WindingPathSeparators between sections
- `curriculum/loading.tsx` — 4 module accordion skeletons with nested concept bones
- `account/loading.tsx` — avatar row, profile form (4 fields), security form (2 fields), notification toggle; WindingPathSeparators between sections
- `tutor/loading.tsx` — full-height flex: real `SvgSendaPath` in header, empty state with logo + starter button bones, input bar at bottom
- `study/loading.tsx` — progress bar, exercise card with input area + submit button
- `verbs/loading.tsx` — header, search bar, 2×6 / 3×4 verb card grid with mastery dot bones

**Rules:** Use `senda-skeleton-fill animate-senda-pulse` for all bone elements (not `bg-foreground/5`). Use `senda-card` / `senda-card-sm` for card containers. Import `WindingPathSeparator` and `SvgSendaPath` freely — they are static SVGs with no data dependencies.

### API Security

- All POST routes validated with Zod v3 schemas
- CSRF protection via `validateOrigin` in `src/lib/api-utils.ts` — set `NEXT_PUBLIC_SITE_URL=https://<domain>` in Vercel env vars to enable strict mode
- `next.config.ts` — CSP, X-Frame-Options, Referrer-Policy, `Permissions-Policy: microphone=()` globally; `/write(.*)` overrides to `microphone=(self)` for STT

### Free-Write Flow

- `/write?concept=<id>` — dedicated page; not part of SRS study queue
- `POST /api/topic` — generates prompt; Claude non-streaming, max_tokens 256
- `POST /api/grade` — grades answer; inserts `exercise_attempts` with `exercise_id: null`
- STT mic button overlaid on textarea; MediaRecorder captures audio → `POST /api/transcribe` (OpenAI Whisper); transcript appended with space separator; permission-denied + unsupported-browser fallbacks; 60s max recording; 20 req/10min rate limit

---

## Current Status

**Test suite: 1952 tests across 110 files — all passing.**

**E2E: Playwright smoke tests** (`pnpm test:e2e`) — 4 scenarios. Requires `.env.e2e` with `E2E_BASE_URL`, `E2E_EMAIL`, `E2E_PASSWORD`.

**CI: Fully green (TypeScript + lint + tests).**

**D5 brand direction applied** across all production pages and components (dashboard, progress, study configure, verbs detail, nav). CSS utility classes (`.senda-card`, `.senda-eyebrow`, `.senda-heading`) + adaptive tokens (`--d5-*`) defined in `globals.css`.

→ Full implementation history: `docs/completed-features.md`

---

## Backlog

Items are ordered by priority within each group. Full details of completed work in `docs/completed-features.md`.

### Observability / Infrastructure

**Infra-A: Product analytics (PostHog)** *(DONE — see completed-features.md)*

**Infra-B: Error monitoring (Sentry)** *(DONE — see completed-features.md)*

**Infra-C: Database migration tooling** *(P3 — reduce manual SQL risk)*

- All migrations are currently run manually in the Supabase SQL editor. No version tracking, no rollback, no CI integration.
- Evaluate lightweight options: `supabase db push` (requires Supabase CLI), `dbmate`, or a custom `migrations` table with a simple runner script.
- **Do not implement without a PM decision on tooling and whether Supabase CLI adoption is acceptable.**

**Infra-E: Custom domain for Supabase Auth (Google OAuth branding)** *(P2 — user-facing trust)*

- Google OAuth consent screen currently shows `<hash>.supabase.co wants to access your Google account` — looks untrustworthy to users.
- Fix: configure a Supabase custom domain (e.g. `auth.senda.app`) via Supabase Dashboard → Settings → Custom Domains (requires Pro plan). Then update Google Cloud Console OAuth credentials (redirect URIs, JS origins) and Supabase Auth provider config to use the custom domain.
- Also configure the Google OAuth consent screen (app name, logo) in Google Cloud Console for a polished branded experience.
- **Requires Supabase Pro plan. Do not implement until custom domain is provisioned and DNS CNAME is verified.**

**Infra-D: A/B testing / feature flag infrastructure** *(P4 — needed before adaptive grading strategy)*

- No feature flag system exists. Required before safely rolling out adaptive grading (Ped-F) or exercise pool changes.
- Options: PostHog feature flags (if Infra-A adopts PostHog), LaunchDarkly, or simple DB-backed flags.
- **Low priority — only needed when we have features that require gradual rollout.**

### Pedagogical / Learning Quality

**Ped-J: Module 8 — Conversational & Pragmatic Markers** *(DONE — see completed-features.md)*

**Ped-F: Shared AI-generated exercise pool** *(DONE — see completed-features.md)*

**Ped-I: Concept explanation content audit** *(very low priority — content only, no code)*

- A "Concept Notes" collapsible already exists in `StudySession.tsx` showing `concept.explanation`. No new column or UI needed.
- Audit whether existing `explanation` values are concise and rule-focused enough to be useful at exercise time, or whether they are too wordy/vague.
- If poor quality: rewrite via a Claude batch script (similar to `pnpm annotate`) — no DB schema change required.
- **Do not implement until the core learning loop is stable and content quality becomes a measurable problem.**

### New Features

**Feat-F: Offline exercise packs (module download)** *(DONE — migration 022 applied)*

- 6-phase implementation: IDB storage layer (`idb` v8), download manager + verb auto-cache, offline session engine, batch grading API, sync engine, report-out UI.
- IndexedDB stores: 15 object stores for exercises, concepts, units, progress snapshots, queued attempts, verb cache, sessions, free-write prompts.
- Download: per-module bundle via `GET /api/offline/module/[id]` with pre-generated free-write prompts (Claude, concurrency=3). Verb data auto-cached on login + `/verbs` visit via `VerbCacheManager`.
- Offline session: neutral "Respuesta registrada" feedback; exercises queued in IDB; SRS-based queue builder across all downloaded modules with module filter option.
- Sync: on reconnect, `SyncBanner` shows progress; `POST /api/offline/grade-batch` grades via Claude (batches of 5), applies SM-2 sequentially with server-wins conflict resolution; creates `offline_reports` + push notification.
- Report-out: `/offline/reports` list + `/offline/reports/[id]` detail with per-attempt scores, feedback, corrected version. Dashboard badge (AppHeader + SideNav) for unread reports.
- Migration 022: `offline_reports` + `offline_report_attempts` tables.

**Feat-G: Streak freeze** *(DONE — migration 020 applied)*

- 1 free streak freeze per week. If user misses exactly 1 day and has a freeze, streak is preserved + freeze consumed. Auto-replenishes after 7 days.
- UI: `StreakBadge` shield icon, `StreakFreezeStatus` dashboard chip, `StreakFreezeNotification` toast.
- Migration 020: 3 new `profiles` columns + updated `increment_streak_if_new_day` RPC (now `RETURNS jsonb`).

**Feat-H: Listening comprehension + proofreading + register shift exercise types** *(DONE)*

- Three new exercise types added: `listening`, `proofreading`, `register_shift`
- Components: `ListeningComprehension.tsx`, `Proofreading.tsx`, `RegisterShift.tsx` — wired in `ExerciseRenderer`
- Seed config: generation rules in `ai-seed-config.ts`; B2 gets `listening` + `proofreading`, C1 gets all three
- Exercise distribution: B1 = 3 types (9 exercises), B2 = 5 types (15 exercises), C1 = 6 types (18 exercises)
- Grader: type-specific rubrics in `grader.ts` for all three new types
- All hardcoded type lists updated: curriculum detail, admin pool, study page, session config, validation script

**Feat-I: i18n architecture (next-intl or JSON dictionaries)** *(P2 — future market expansion)*

- All UI strings are currently hardcoded in Spanish/English. To support additional interface languages (e.g. German, French learners of Spanish), we need an i18n framework.
- Evaluate `next-intl` (App Router native) vs. simple JSON dictionaries with a custom hook.
- **Do not implement until there is a concrete plan to support non-English interface languages.**

**Feat-J: Verb SRS integration** *(P3 — connect verbs to spaced repetition)*

- Verb conjugation drills currently track accuracy (`verb_progress`) but do not feed into the SRS system. Verbs the user struggles with should surface more frequently.
- Requires connecting `verb_progress` to `user_progress` or creating a parallel SRS loop for verbs.
- **Do not implement without a PM decision on whether verbs should share the concept SRS or have their own.**

**Feat-K: Email re-engagement (Resend / Postmark)** *(P3 — retention)*

- Users who drop off have no re-engagement mechanism. Send emails after 3, 7, and 14 days of inactivity with streak status and a "come back" CTA.
- Evaluate Resend (developer-friendly, generous free tier) or Postmark (deliverability focus).
- Requires a cron job or Supabase Edge Function to check `profiles.last_studied_date` and send emails.
- **Do not implement without a PM decision on vendor, email content, and frequency caps.**

**Feat-L: Reading comprehension / passage-based exercises** *(P4 — new modality)*

- Add longer-form reading passages with comprehension questions. Targets B2+ learners who need practice with extended text.
- Could be AI-generated or curated. Exercises would be tied to passages rather than individual concepts.
- **Future consideration — requires content strategy and new DB schema for passages.**

**Feat-M: Vocabulary feature (word-in-context)** *(P4 — new modality)*

- Dedicated vocabulary building beyond grammar concepts. Show words in context sentences, track mastery, and integrate with SRS.
- Could leverage existing `verb_sentences` pattern for vocabulary sentences.
- **Future consideration — requires PM decision on scope and differentiation from grammar exercises.**

**Feat-N: Social / accountability features** *(P4 — retention)*

- Leaderboards, study groups, or accountability partners to increase motivation and retention.
- Requires careful design to avoid toxic competition (e.g. focus on consistency rather than speed).
- **Future consideration — requires PM research on what social features actually drive retention in language apps.**

**Feat-O: Onboarding re-engagement email sequence** *(P3 — activation)*

- Users who complete signup but abandon onboarding (diagnostic quiz) never return. Send a sequence of 2–3 emails encouraging completion.
- Separate from Feat-K (which targets users who completed onboarding but stopped studying).
- Requires tracking `onboarding_completed = false` users and a transactional email provider.
- **Do not implement without Feat-K vendor decision (shared email infrastructure).**

### Bugs / Layout Fixes

**Fix-J: STT — replace Web Speech API with OpenAI Whisper** *(DONE — see completed-features.md)*

**Fix-L: Verify push notifications on iOS PWA** *(DONE — see completed-features.md)*

### Technical Debt

**Debt-A: Seed script idempotency guards** *(DONE — see completed-features.md)*

**Debt-B: Monthly STT usage tracking** *(P4 — billing clarity)*

- Current burst limit (20 req/10min) prevents abuse but doesn't enforce the ~80 min/month budget precisely.
- Would require a `profiles.stt_minutes_used` column + monthly reset cron + duration tracking in `/api/transcribe`.
- **Do not implement unless billing/cost becomes a measurable problem.**

### Audit Findings (2026-03-13)

Full codebase audit: 22 findings, 21 fixed. Full details in `docs/completed-features.md` under "Audit Fixes Batch".

**Audit-E7: SRS due_date UTC assumption** *(DONE — documented in `src/lib/srs/index.ts` and `supabase/migrations/011_streak_rpc.sql`)*

**Audit-E1: Timezone-aware streak & SRS** *(DONE — migration 019)*

**Open items:**
- None remaining from audit

---

## Recommended Next Steps (priority order)

| Priority | Item | Gate |
| -------- | ---- | ---- |
| **P1** | **Audit-E1** — Timezone-aware streak RPC | **DONE** |
| **P1** | **Fix-J** — STT replacement for iOS Safari | **DONE** |
| **P1** | **Fix-L** — Verify push notifications on iOS PWA | **DONE** |
| **P2** | **Feat-G** — Streak freeze | **DONE** |
| **P2** | **Feat-H** — Listening + proofreading + register shift | **DONE** |
| **P2** | **Feat-I** — i18n architecture | PM decision on target languages |
| **P3** | **Infra-C** — Database migration tooling | PM decision on tooling |
| **P3** | **Feat-J** — Verb SRS integration | PM decision on SRS model |
| **P3** | **Feat-K** — Email re-engagement | PM decision on vendor |
| **P3** | **Feat-O** — Onboarding re-engagement emails | Depends on Feat-K |
| **P2** | **Infra-E** — Custom domain for Supabase Auth (Google OAuth branding) | Supabase Pro plan + DNS setup |
| **P4** | **Infra-D** — A/B testing / feature flags | Needed before adaptive grading |
| **P2** | **Feat-F** — Offline exercise packs | **DONE** (migration 022 applied) |
| **P4** | **Feat-L** — Reading comprehension | Content strategy needed |
| **P4** | **Feat-M** — Vocabulary feature | PM scope decision |
| **P4** | **Feat-N** — Social / accountability | PM research needed |

