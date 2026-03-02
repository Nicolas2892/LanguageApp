# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
```

Seed command requires env vars:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed
```
Re-seeding duplicates rows — truncate `exercises`, `concepts`, `units`, `modules` first.

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
| `/progress` | Server + Client | MasteryChart, AccuracyChart, ActivityHeatmap |
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
| `profiles` | One row per user; `streak`, `last_studied_date`, `onboarding_completed` |
| `modules / units / concepts / exercises` | Curriculum hierarchy (publicly readable) |
| `user_progress` | SRS state per user+concept (`ease_factor`, `interval_days`, `due_date`, `repetitions`) |
| `exercise_attempts` | Full attempt history with AI score + feedback |
| `study_sessions` | Session analytics — written by `/api/sessions/complete` |

Migrations (run once in Supabase SQL editor):
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_onboarding_flag.sql`
- `supabase/migrations/003_indexes.sql` — study_sessions index (already applied)
- inline (applied) — `ALTER TABLE exercise_attempts ALTER COLUMN exercise_id DROP NOT NULL;`

### Dashboard Stats
- **Streak**: live from `profiles.streak` (updated on first daily submit)
- **Mastered**: `user_progress` rows where `interval_days >= 21` (matches curriculum mastery threshold)
- **Curriculum progress bar**: mastered / total concepts × 100%
- `isNewUser` flag uses `studiedCount` (any `user_progress` row), not `masteredCount`

### Curriculum Seed Content
- Module 1: Connectors & Discourse Markers (3 units: Concessive, Causal/Consecutive, Adversative)
- Module 2: Subjunctive Mastery (2 units: Present Triggers, Imperfect/Hypotheticals)
- 21 concepts, 3 exercises each = 63 exercises total (3rd exercise is free_write or error_correction)

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

### Completed — Phases 1–6E
- Full auth flow (email/password, Supabase)
- SM-2 SRS engine with Claude-only scoring
- All 6 exercise types with dedicated UI components
- Study session with hint progression and try-again
- Session configure screen (module + exercise type picker)
- Streaming AI tutor chat with context injection
- Progress analytics (mastery chart, accuracy chart, activity heatmap)
- Curriculum browser with mastery badges and direct practice links
- Onboarding diagnostic (6 questions, SRS pre-seeded from scores)
- Streak tracking (profiles.streak updated on first daily submit)
- study_sessions table fully wired (written on session completion)
- Vitest test suite: 122 tests across 8 files — sm2, scoreToInterval, FeedbackPanel, FreeWritePrompt, ExerciseRenderer, ConceptPicker, AccountForm, account/update route
- Mobile polish: h-[100dvh], safe-area-inset-bottom, flex-wrap, overflow-x-auto
- **Pre-Phase 6 audit complete**: Zod validation, security headers, shared components, ErrorBoundary, constants, scoring module
- **63 exercises seeded** (3 per concept; 3rd is free_write or error_correction)
- **P6-A complete**: /api/topic, /api/grade, FreeWritePrompt.tsx, WriteSession.tsx, /write page; exercise_id nullable
- **P6-B complete**: Curriculum per-concept type buttons; `/study?types=` discoverability
- **Dashboard redesign complete**: Three mode cards — Review, Learn new, Free write; type pills removed; `/study?mode=new` queue for unlearned concepts
- **Free-write concept picker complete**: ConceptPicker.tsx (checkbox grouped by module/unit, Surprise me, sticky footer with difficulty label); /write branches on ?concepts= vs picker; WriteSession accepts conceptIds[]; /api/topic and /api/grade accept concept_ids[]; FreeWritePrompt has 200-word live counter (Submit disabled <20 or >200 words)
- **P6-C complete**: `/account` page (display_name, current_level A2/B1/B2, daily_goal_minutes); `POST /api/account/update` Zod validated; Account added to dashboard quick-nav
- **P6-D complete**: PWA — `src/app/manifest.ts` (standalone, theme #18181b, start_url /dashboard); `icon.tsx` 192×192 + `apple-icon.tsx` 180×180 via ImageResponse; layout.tsx `appleWebApp` metadata; `public/sw.js` cache-first for `/_next/static/` assets; `ServiceWorkerRegistration.tsx` client component
- **P6-E complete**: Babbel-inspired UX redesign — orange primary token (`oklch(0.65 0.20 35)`), orange accent strips on mode cards, stat row with Flame/Trophy icons, segmented progress bar, exercise type icon badges, FeedbackPanel accent strips, orange SentenceBuilder chips, word-count bar, ConceptPicker card-style rows with DifficultyBars, curriculum module progress bars, auth ES logo mark, AccountForm level cards

### Phase 6 — Remaining (ordered by priority)

**P6-F: Google OAuth** ✓ complete
- `src/components/auth/GoogleButton.tsx` — calls `signInWithOAuth({ provider: 'google' })`, redirects to `/auth/callback`
- Both `/auth/login` and `/auth/signup` have Google button + "or" divider above email/password form
- Login page handles `?error=auth_callback_failed` from callback route
- **Requires**: Google provider enabled in Supabase dashboard (Auth → Providers → Google) with a Google Cloud OAuth client ID + secret

**P6-G: Email notifications** (lowest priority)
- Supabase Edge Functions for daily reminder emails