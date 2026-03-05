# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- Module 2: The Subjunctive — 3 units, 13 concepts
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

**Test suite: 1111 tests across 28 files — all passing.**

Completed: Phases 1–8 (auth, SRS, all exercise types, study session, tutor, progress analytics, curriculum, onboarding, PWA, drill mode), Phase 9 fixes (Fix-A–E), UX improvements (UX-A–C, UX-D, UX-E, UX-G, UX-H, UX-I through UX-S, UX-U, UX-V), Ped-A (multi-blank gap-fill), Ped-C (computed level), Ped-D (gap-fill same-concept redesign), Ped-E (grammatical highlighting), Feat-B (Sprint Mode), Feat-C (grammar focus chips), **Feat-E (content expansion — 85 concepts, 787 exercises live across 6 modules)**, **Feat-C (guided CEFR progression — B1→B2→C1 unlock in automatic queue)**.

→ Full implementation details of all completed work: `docs/completed-features.md`

---

### Phase 9 — Backlog

Items are grouped by type and roughly ordered by priority within each group. Completed items moved to `docs/completed-features.md`.

#### Pedagogical / Learning Quality

**Ped-B: AI-generated exercises enter the SRS review pool automatically** ✅ *Complete*
- `/api/exercises/generate` inserts into `exercises` table via service role; SRS queue picks randomly from all available exercises per concept — AI-generated ones included automatically
- `max_tokens` raised to 2048 (was 512 — caused JSON truncation → parse failures → "Failed to generate exercises"); markdown fence stripping added as defensive measure
- "Generate 3 more" button hidden for `sentence_builder` and `free_write` (unsupported by generate route's Zod schema)
- Verified working in production (2026-03)

**Ped-D: Gap-fill same-concept redesign** ✅ *Complete — see `docs/completed-features.md`*
- All 21 gap_fill exercises redesigned: 13 reduced to 1 blank (same-concept only); 8 already-correct 2-blank exercises cleaned up. Inline underline inputs with ch-width sizing + Enter auto-advance. DB re-seeded and re-annotated.

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
- `exercises.annotations jsonb` (migration 008), `AnnotatedText.tsx`, `pnpm annotate` CLI, generate route stores annotations, GapFill/TextAnswer/ErrorCorrection use AnnotatedText

#### New Features

**Feat-A: Daily email reminders** *(deferred — not wanted)*

**Feat-C: Guided CEFR progression** ✅ *Complete*
- `src/lib/curriculum/prerequisites.ts` — `computeUnlockedLevels()` + `computeUnlockProgress()` helpers
- `LEVEL_UNLOCK_THRESHOLD = 0.8` in constants; B2 unlocks when ≥80% of B1 concepts attempted; C1 unlocks when ≥80% of B2 attempted
- `mode=new` queue filtered to unlocked levels only; bootstrap always B1-only
- Curriculum page: informational `Lock` icon badge on locked concepts + progress banner; Practice buttons always remain active (no hard gates)
- 13 new tests in `prerequisites.test.ts`

**Feat-D: Web push notifications** ✅ *Complete — see `docs/completed-features.md`*
- VAPID-based push via `web-push`; `profiles.push_subscription jsonb` (migration 009)
- SW push + notificationclick handlers; `PushPermissionPrompt` in study done screen
- `NotificationSettings` on account page; `/api/push/subscribe` (POST/DELETE) + `/api/push/send` cron route
- `vercel.json` daily cron 18:00 UTC; `CRON_SECRET` auth on send route

**Feat-E: Content expansion via AI seeding script** ✅ *Complete — see `docs/completed-features.md`*
- 85 concepts, 787 exercises live across 6 modules; Module 2 renamed to "The Subjunctive"
- `scripts/approve-all.mjs` for bulk approval; `max_tokens: 8192` required to avoid truncation

**Feat-F: Offline exercise packs (module download)**
- User downloads a full module's exercises to IndexedDB for offline use
- `gap_fill` + `sentence_builder` graded locally (deterministic string match, accent-normalised)
- `translation` / `transformation` / `error_correction` answers queued locally; batch-submitted + AI-graded on reconnect
- `free_write` always excluded — always requires AI grading; not available offline
- SRS updates queued locally, flushed when `navigator.onLine` is true; conflict resolution needed for multi-device offline scenarios (last-write-wins or merge by most-recent timestamp)
- "One right answer" assumption holds well for gap_fill/sentence_builder; breaks for open-ended types — those must stay online-only for AI grading
- Migration: no schema change needed; offline queue lives entirely in IndexedDB on the client
- **Do not implement without a written PM decision on conflict resolution strategy and UI for queued/pending sync state.**

**Feat-G: Full Architecture and Security Review**
- Conduct a full review of current app architecture and security to suggest both performance and security improvements to enhance it.

**Feat-H: Another Design & UX Review ***
- Run another iteration of all UX Screens and Menus and suggest another set of improvements based on best practices. The goal should be to make the design feel elegant and polished without feeling playful. So closer to Babbel than to Dulingo.
- Put specific focus on reviewing navigation structure, menu sequencing/navigation flows for users and layout to see if there are opportunities to improve app setup.
- Put specific focus as well on ability to add any graphical elements that would enhance the app appearance to give it its own branding and character. 
- Lastly review the icons used and check if there are any more polished appearing icon themes we might want to use to improve design.

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

**Fix-G: Review card has wrong background in dark mode**
- **Problem**: The Review card on the dashboard shows a muddy brownish-gray tint in dark mode instead of matching the other dark cards. Visible in screenshot — the card is clearly lighter/warmer than "Learn new" and "Free write".
- **Cause**: The warm tint is applied via `bg-orange-50/60` (orange-50 at 60% opacity). At 60% opacity over a dark background this composites into a brownish-gray. The `dark:bg-card` override added in UX-T does not appear to take effect — likely a Tailwind v4 CSS specificity or class-scanning issue with opacity-modified background classes inside dynamic ternary strings.
- **Attempted fix**: `dark:bg-card` added to the ternary class string in `src/app/dashboard/page.tsx` — did not work.
- **Suggested approach**: Move the warm tint to a conditional inline style (`style={{ backgroundColor: 'oklch(...)' }}`) so it only applies in light mode, or replace `bg-orange-50/60` with a solid non-opacity class like `bg-orange-50` and add `dark:bg-card` — removing the opacity modifier which is likely the root cause of the override failing.

**Fix-F: Write page sticky footer misaligned on desktop (deferred)**
- **Problem**: On desktop, the sticky footer ("Start writing →" button) in `ConceptPicker.tsx` is centered against the full viewport width, while the module cards above are centered within the content area to the right of the 220px sidebar. This makes the button appear shifted left compared to the content.
- **Cause**: The footer uses `position: fixed; left: 0; right: 0`, so it spans the full viewport and ignores the `lg:ml-[220px]` wrapper in `layout.tsx`. Attempts to fix via `lg:left-[220px]` (Tailwind arbitrary responsive class — not reliably generated in Tailwind v4 without tailwind.config.js) and a `--sidebar-width` CSS variable both introduced new regressions.
- **Do not attempt again without a clear plan.** Proper fix likely requires either: (a) restructuring the footer to render outside `ConceptPicker` as a page-level element that is naturally inside the `lg:ml-[220px]` layout wrapper but uses `sticky`/`fixed` positioning, or (b) a JavaScript-based approach that reads the sidebar width at runtime.
- **Current state**: Footer is `left-0 right-0` (full width) — misaligned on desktop but functional. Mobile is unaffected.

#### UX Audits & Polish

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

Items from full UX research audit (2026-03). Ordered by effort/impact. First 7 are **low-effort / high-impact** and should be tackled as a batch.

**UX-I: Session-complete confetti celebration** ✅ *Complete — see `docs/completed-features.md`*
- `canvas-confetti` burst on done screen when accuracy ≥ 70%; StrictMode-safe ref guard

**UX-J: Study loop transitions** ✅ *Complete — see `docs/completed-features.md`*
- Slide-in-right on exercise advance; slide-up FeedbackPanel; green/red flash before feedback appears

**UX-K: Submit button loading state** ✅ *Complete — see `docs/completed-features.md`*
- `Loader2` spinner + "Checking…" text shown while Claude grades

**UX-L: Progress bars animate-in** ✅ *Complete — see `docs/completed-features.md`*
- `AnimatedBar` client component; 80ms mount delay then 700ms CSS transition from 0→target

**UX-M: Contextual dashboard copy** ✅ *Complete — see `docs/completed-features.md`*
- State-aware subtitle based on streak + dueCount

**UX-N: Autofocus inputs** ✅ *Already implemented* — GapFill + TextAnswer had `autoFocus`; verified

**UX-O: Streak pulse** ✅ *Complete — see `docs/completed-features.md`*
- `animate-pulse` on Flame icon at streak ≥ 7

**UX-P: Session exit button** ✅ *Already implemented as part of UX-G* — Dialog + X button in StudySession

**UX-Q: Due count badge** ✅ *Complete — see `docs/completed-features.md`*
- Red dot badge at dueCount ≥ 10; green CheckCircle2 + green border when dueCount = 0

**UX-R: FeedbackPanel score label prominence** ✅ *Complete — see `docs/completed-features.md`*
- `text-2xl font-black` centred; Sparkles icon at score = 3

**UX-S: Micro-interactions** ✅ *Complete — see `docs/completed-features.md`*
- Logo hover:rotate-6; hint dot transition-colors duration-500

**UX-T: Dark mode semantic color fixes** *(deferred — risk of visual regressions; tackle as dedicated session)*

**UX-U: Page fade-in transitions** ✅ *Complete — see `docs/completed-features.md`*
- `PageWrapper` client component uses `usePathname` as key; 150ms fade+slide on route change

**UX-V: First-run onboarding tour** ✅ *Complete — see `docs/completed-features.md`*
- `OnboardingTour` dismissible overlay; `localStorage.tour_dismissed` flag

---

## Recommended Next Steps (priority order)

### Polish & UX quality

2. **UX-T: Dark mode color fixes** — Replace hardcoded orange/amber backgrounds with CSS variable-based classes. Key files: Review card warm tint, UserAvatar, hint boxes in HintPanel, FeedbackPanel accent strip.

### Later — Growth features (deferred)

3. **Strat-A: Shareable progress card** — `/progress/share` OG image via `ImageResponse`; `navigator.share` button on dashboard.

4. **Strat-B: Admin content panel** — `/admin` gated by `profiles.is_admin`; read-only exercise/concept browser with attempt counts.

5. **Feat-A: Daily email reminders** *(not wanted — deferred indefinitely)*