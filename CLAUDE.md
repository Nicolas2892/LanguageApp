# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

### General comments
You are an Expert in Product Management work, Coding and UX Research, alongside being a world-class language teacher and learner who is really experienced in Spanish. Your job is to make a great app to help advanced Spanish learners go from B1 to B2 and eventually C1 through offering advanced exercises specifically targeted on active recall. We cover a market gap here as existing applications (DuoLingo, Babbel) offer too simplistic exercises not challenging enough and other solutions such as KwizIQ do not offer sufficient variation in exercises (most being multiple choice). Our Design has to be sleek and modern. The main usage point will be as an application on iOS and in the Browser (comparable to Babbel) - so we always need that cross-device functionality. No progress should ever be stored on the device, it should all live in the cloud.

- If you have questions for clarification that woud help improve your work, always ask them to the user before starting your work or edits.
- Always add Unit Tests for newly created features when writing them so we can test the application well. 
- Keep a best in class code hygiene and syntax to make the code as easy to maintain as possible.

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

### Completed — Phases 1–6E + BottomNav polish
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
- **BottomNav polish complete**: `bg-background` (fully opaque, no content bleed); `/study` and `/tutor` removed from HIDDEN_ROUTES — tab bar now always visible; study page `pb-24 lg:pb-10`; tutor page outer container `pb-[calc(3.125rem+env(safe-area-inset-bottom))] lg:pb-0`
- **Dashboard header polish complete**: stats row + progress bar merged into a single `bg-card rounded-xl border` status card for visual cohesion; stat numbers `text-4xl` → `text-2xl` so greeting h1 dominates; icons `h-7` → `h-5`; dashboard bottom padding changed from `pb-24` to `pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-8` (dynamic — mirrors nav height + one space-y-3 gap above BottomNav)
- **P7 complete**: Curriculum overhaul — `/curriculum` redesigned with filter tabs (All|New|Learning|Mastered, `?filter=` URL param), collapsible module accordion (`<details>` server-side), compact concept rows (title + mastery badge + difficulty bars + "Practice →" shortcut); new `/curriculum/[id]` concept detail page (explanation, examples table, SRS status, all action buttons)

### Phase 6 — Remaining (ordered by priority)

**P6-F: Google OAuth** ✓ complete
- `src/components/auth/GoogleButton.tsx` — calls `signInWithOAuth({ provider: 'google' })`, redirects to `/auth/callback`
- Both `/auth/login` and `/auth/signup` have Google button + "or" divider above email/password form
- Login page handles `?error=auth_callback_failed` from callback route
- **Requires**: Google provider enabled in Supabase dashboard (Auth → Providers → Google) with a Google Cloud OAuth client ID + secret

**P6-G: Email notifications** (lowest priority)
- Supabase Edge Functions for daily reminder emails

### P7: Curriculum overhaul ✓ complete

**Content structure**
- Cluster concepts by communicative function (not grammatical form) per SLA research
- Module taxonomy: Discourse & Text Organisation · Subjunctive Mastery
- Unit names must reflect function (e.g. "Contrast & Concession", not "Concessive Connectors")
- Subjunctive units ordered by acquisition sequence: Desire/Volition → Impersonal Necessity → Doubt/Uncertainty → Concessive/Conditional

**Navigation architecture**
- `/curriculum` = browse page (compact rows + filter tabs + collapsible module accordion)
- `/curriculum/[id]` = NEW concept detail page (all action buttons live here)
- Filter tabs: All | New | Learning | Mastered — stored in `?filter=` URL param (server-side)
- Concept rows: title + mastery badge + difficulty bars + "Practice →" shortcut only
- Module header: mastery progress bar + `<details>` accordion (open when filter matches)
- Bottom padding: `pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-10`

**`src/app/curriculum/[id]/page.tsx`** (new file)
- Server component; reads concept id from params + `?filter=` from searchParams
- Renders: breadcrumb, title, explanation, examples table (es|en), SRS status (next review in N days), all exercise type buttons (filtered to types with DB rows), free write link, ask tutor link
- Back link preserves `?filter=` param

### Phase 8 — Drill Mode ✓ complete
- `POST /api/exercises/generate` — auth-guarded; generates gap_fill / translation / transformation / error_correction via Claude; inserts into `exercises` table; returns full row
- `POST /api/submit` — `skip_srs: boolean` optional flag; SM-2 upsert skipped in drill mode; streak kept
- `study/page.tsx` — `?practice=true&concept=X&types=T` loads all exercises of that type (no random); passes `practiceMode`, `generateConfig`, `returnHref` to StudySession
- `StudySession.tsx` — dynamic queue (`useState`); "Generate 3 more" (parallel x3 API calls, appends items, resumes); "Back to concept" button; SRS copy hidden in drill mode
- `curriculum/[id]/page.tsx` — per-type buttons now add `&practice=true`; "Practice all" unchanged (SRS mode)
- **Known bug (Fix-D below):** `exercises` RLS has no INSERT policy for authenticated users — generate route uses service role client fix needed

---

### Phase 9 — Backlog

Items are grouped by type and roughly ordered by priority within each group. Implement bugs/fixes first, then UX, then pedagogical improvements, then new features.

#### Bugs & Fixes (implement first)

**Fix-A: Desktop/iPad navigation — persistent left sidebar**
- BottomNav is `lg:hidden`; desktop/iPad have zero navigation
- Solution: **Option A — persistent left sidebar** (~220 px, always visible on `lg:`)
  - Logo at top, vertical nav links (Home / Study / Tutor / Progress / Curriculum / Account)
  - Mirrors BottomNav active-state logic and HIDDEN_ROUTES
  - `layout.tsx`: on `lg:` wrap `{children}` in a flex row with the sidebar; main content gets `lg:ml-[220px]`
  - Sidebar component lives alongside BottomNav in `src/components/`

**Fix-B: Remove "Back to Dashboard" link on Account page**
- One-line deletion in `src/app/account/page.tsx`

**Fix-C: Rename app to "Español Avanzado"**
- Replace all instances of "Spanish B1→B2" / "Spanish B1 -> B2" across: page titles, manifest name/short_name, auth card descriptions, dashboard greeting, `layout.tsx` metadata, `README`
- Correct Spanish: **Español Avanzado** (nivel is masculine)

**Fix-D: P8 RLS bug — exercises INSERT blocked by RLS**
- `exercises` table only has `service_role` INSERT policy; authenticated user session cannot insert
- Fix: create a service role Supabase client (using `SUPABASE_SERVICE_ROLE_KEY`) and use it only for the insert step in `POST /api/exercises/generate`
- Do NOT add a broad authenticated-user INSERT policy — keeps exercises write-protected outside the generate endpoint

**Fix-E: Google OAuth — `handle_new_user` trigger uses wrong metadata field**
- Google sends name as `raw_user_meta_data->>'full_name'` (sometimes `'name'`), not `'display_name'`
- Current trigger falls back to email prefix for all Google sign-ups
- Fix: SQL migration — update `coalesce()` to: `coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(new.email, '@', 1))`
- Also requires: Google provider enabled in Supabase dashboard (Auth → Providers → Google) + Google Cloud Console OAuth client with correct redirect URI — this is an infrastructure/config step, not code

#### UX Improvements

**UX-A: Account page revamp**
- Add **Change Email** section: input + confirm → calls `supabase.auth.updateUser({ email })` → shows "Check your inbox to confirm" message
- Add **Change Password** section: current password + new password + confirm → calls `supabase.auth.updateUser({ password })` after re-authenticating
- General UX polish: group into labelled sections (Profile, Security, Preferences), add section dividers, destructive actions (sign out, delete account) at bottom separated visually
- Remove the manual level picker from this page (level becomes computed — see Ped-C)

**UX-B: iOS "Add to Home Screen" install prompt**
- PWA manifest + service worker already built (P6-D); iOS Safari doesn't fire `beforeinstallprompt`
- Detect iOS Safari via `navigator.userAgent` in a client component
- Show a dismissible bottom sheet on first post-login visit: "Install this app on your iPhone — tap Share → Add to Home Screen" with a simple diagram
- Persist dismissal in `localStorage` (`pwa_prompt_dismissed = true`)
- Also add a permanent "Install app" card in `/account` with same instructions

**UX-C: Audio playback for Spanish sentences**
- Use browser `SpeechSynthesis` API (`lang: 'es-ES'`) — zero cost, zero dependencies
- Add speaker icon button next to: exercise prompts, Spanish column in examples table (`/curriculum/[id]`), correct answer in FeedbackPanel
- Shared `useSpeech(text, lang)` hook in `src/lib/hooks/`
- Audio on/off toggle in `/account` (stored in `localStorage`)

#### Pedagogical / Learning Quality

**Ped-A: Harder gap-fill exercises — multi-sentence multi-blank format**
- Current format is trivial: one sentence, one blank, obviously the connector being drilled
- New format: 2–3 connected sentences in a paragraph; **multiple blanks**; learner must decide where the target connector belongs *and* fill remaining blanks with other appropriate connectors
- Requires: new prompt format for seeded and AI-generated gap_fill exercises; `GapFill.tsx` needs to handle multiple `___` tokens and collect multiple answers; grading prompt updated to evaluate all blanks together
- Seed script must be updated to produce this richer format; existing seeded gap_fill exercises should be re-seeded

**Ped-B: AI-generated exercises enter the SRS review pool automatically**
- P8 generate route already inserts into `exercises` table permanently (reusable)
- SRS queue already picks a random exercise per concept from all available — AI-generated ones are included automatically once inserted; no architecture change needed
- Benefit: pool grows over time, reducing repetition and token waste; user cannot memorise specific phrasings
- Action: confirm Fix-D is applied (so inserts succeed), then verify in testing that generated exercises appear in subsequent SRS sessions

**Ped-C: User level computed from mastery, not self-selected**
- Inspired by KwizIQ's tested-knowledge approach (not self-report)
- Proposed calculation: weighted % of concepts mastered (`interval_days >= 21`) across modules, factoring in difficulty
  - A2: < 25% mastered; B1: 25–55%; B2: 55–85%; C1: 85%+
- Remove manual level picker from account settings (or keep as optional override with a "reset to computed" button)
- Computed level shown on dashboard and account page; recalculated on each `POST /api/submit`
- May require a `computed_level` column on `profiles` or a pure computation on read

#### New Features

**Feat-A: Daily email reminders (P6-G)**
- Supabase Edge Function `send-daily-reminder`: cron at 18:00 local (or fixed UTC), queries profiles where `last_studied_date < today` AND `streak > 0`
- Personalised content: "{name}, your {N}-day streak is at risk — {X} concepts due today"
- Add `email_reminders boolean DEFAULT true` to `profiles`; expose toggle in `/account`
- Migration: `ALTER TABLE profiles ADD COLUMN email_reminders boolean DEFAULT true`

**Feat-B: Sprint / timed mode (5-minute sessions)**
- Add `?mode=sprint` to `/study`
- 5-minute countdown timer shown in progress bar area; session ends at 0
- Add "5-min sprint" as a 4th mode card on dashboard
- No DB changes needed

**Feat-C: Concept prerequisites / unlock progression**
- Add `prerequisite_concept_id uuid NULLABLE` to `concepts` table
- Concepts with unmet prerequisites show padlock icon in curriculum; practice buttons disabled
- `/curriculum/[id]`: show "Unlock after mastering [prerequisite]" with a link
- Update seed data with prerequisite relationships for harder concepts in each unit
- Locking is UI-only (not server-enforced); users who navigate directly can still practice

**Feat-D: Web push notifications (Android PWA)**
- Complements email reminders for Android PWA users (iOS does not support Web Push)
- Add `push_subscription jsonb` column to `profiles`
- Client: prompt for notification permission after first completed study session (not on load)
- Service worker: handle `push` event, display notification with due count + streak
- Backend: Supabase Edge Function sends push via Web Push API (VAPID keys in env vars)
- Detect and skip prompt on iOS

**Feat-E: Content expansion via AI seeding script**
- `pnpm seed:ai` script: uses Claude to draft 3–5 new concepts per unit with 3 exercises each
- Output to a JSON review file first; human approval before DB insert
- New module candidates: Verb Constructions (ser/estar in context, reflexive verbs, subjunctive triggers)
- Target: 40+ total concepts across 3 modules

#### Strategic / Long-term

**Strat-A: Shareable progress card** *(deferred — implement after content depth is sufficient)*
- `/progress/share` route: server-rendered OG image (via Next.js `ImageResponse`) showing streak, mastered count, level
- "Share my progress" button on dashboard + `/progress`; triggers `navigator.share` or copies URL

**Strat-B: Admin content panel** *(deferred — implement when content iteration becomes a bottleneck)*
- `/admin` route gated by `is_admin boolean` on `profiles`
- Read-only v1: list all concepts/exercises with attempt counts
- Stretch: inline edit for concept explanation and exercise prompt text

#### Design

**Design-A: App logo**
- Babbel-inspired mark: clean pill or rounded-square shape, "EA" monogram or stylised "Ñ", warm tones complementing the orange primary
- Deliverables: updated `icon.tsx` (192×192 ImageResponse), `apple-icon.tsx` (180×180), and an SVG source file at `public/logo.svg` for use in `AppHeader` and auth pages
- Current auth "ES" block and AppHeader text mark should both be replaced