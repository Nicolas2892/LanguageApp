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

**Test suite: 270 tests across 21 files — all passing.**

Completed: Phases 1–8 (auth, SRS, all exercise types, study session, tutor, progress analytics, curriculum, onboarding, PWA, drill mode), Phase 9 fixes (Fix-A–E), UX improvements (UX-A–C, UX-G, UX-H), Ped-A (multi-blank gap-fill), Ped-C (computed level), Ped-E (grammatical highlighting), Feat-B (Sprint Mode), Feat-C (grammar focus chips).

→ Full implementation details of all completed work: `docs/completed-features.md`

---

### Phase 9 — Backlog

Items are grouped by type and roughly ordered by priority within each group. Completed items moved to `docs/completed-features.md`.

#### Pedagogical / Learning Quality

**Ped-B: AI-generated exercises enter the SRS review pool automatically**
- P8 generate route already inserts into `exercises` table permanently (reusable)
- SRS queue already picks a random exercise per concept from all available — AI-generated ones are included automatically once inserted; no architecture change needed
- Benefit: pool grows over time, reducing repetition and token waste; user cannot memorise specific phrasings
- Fix-D is applied (service role insert in generate route); verify in testing that generated exercises appear in subsequent SRS sessions

**Ped-D: Gap-fill exercise pedagogical rethink**
- **Problem**: Current multi-blank format (typically 2 gaps) requires the user to fill ALL blanks correctly to pass, but only one blank tests the target concept. The other gaps (surrounding context words, auxiliary verbs, etc.) are essentially trivia — there are no hints for them, making the exercise feel unfair and frustrating even when the learner correctly places the connector/structure being studied.
- **Pedagogical goal**: The gap-fill should test *acquisition of the target concept*, not ability to reconstruct the full sentence from memory.
- **Options to research and decide between**:
  1. **Single-target gap**: Always keep exactly 1 blank (the target connector/structure); all other blanks become visible text or are pre-filled as read-only. Cleanest; mirrors standard DELE/SIELE cloze format.
  2. **Labelled gaps**: Multiple blanks, but non-target gaps have a visible label/placeholder (e.g. `[verb]`, `[preposition]`) so the user knows what type of word is expected — reduces guessing.
  3. **Partial reveal on wrong answer**: On first wrong attempt, reveal the non-target gap answers and let the user retry focusing only on the target blank.
- **UX considerations**: Touch-friendly blank navigation, clear visual distinction between target gap and context gaps (if multiple kept), inline error highlighting per blank.
- **Likely implementation**: Introduce a `target_blank_index` field on `exercises` (or infer it from a convention in `expected_answer`) so the grader knows which blank is the primary assessment criterion; score based only on target blank; display other gaps differently.
- **Scope**: Requires re-seeding exercise data (or a migration to mark target blank), updates to `GapFill.tsx`, grader logic, and possibly the AI generate route.

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

**Feat-A: Daily email reminders (P6-G)**
- Supabase Edge Function `send-daily-reminder`: cron at 18:00 local (or fixed UTC), queries profiles where `last_studied_date < today` AND `streak > 0`
- Personalised content: "{name}, your {N}-day streak is at risk — {X} concepts due today"
- Add `email_reminders boolean DEFAULT true` to `profiles`; expose toggle in `/account`
- Migration: `ALTER TABLE profiles ADD COLUMN email_reminders boolean DEFAULT true`

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

#### Bugs / Layout Fixes

**Fix-F: Write page sticky footer misaligned on desktop (deferred)**
- **Problem**: On desktop, the sticky footer ("Start writing →" button) in `ConceptPicker.tsx` is centered against the full viewport width, while the module cards above are centered within the content area to the right of the 220px sidebar. This makes the button appear shifted left compared to the content.
- **Cause**: The footer uses `position: fixed; left: 0; right: 0`, so it spans the full viewport and ignores the `lg:ml-[220px]` wrapper in `layout.tsx`. Attempts to fix via `lg:left-[220px]` (Tailwind arbitrary responsive class — not reliably generated in Tailwind v4 without tailwind.config.js) and a `--sidebar-width` CSS variable both introduced new regressions.
- **Do not attempt again without a clear plan.** Proper fix likely requires either: (a) restructuring the footer to render outside `ConceptPicker` as a page-level element that is naturally inside the `lg:ml-[220px]` layout wrapper but uses `sticky`/`fixed` positioning, or (b) a JavaScript-based approach that reads the sidebar width at runtime.
- **Current state**: Footer is `left-0 right-0` (full width) — misaligned on desktop but functional. Mobile is unaffected.

#### UX Audits & Polish

**UX-D: Dashboard page UX audit**
- **Daily goal progress missing**: `profiles.daily_goal_minutes` exists but no indicator of whether the user has hit their goal today. A subtle ring or progress bar on the streak card would close this loop and reinforce habit formation.
- **No visual hierarchy across mode cards**: All 4 cards (Review, Learn new, Free write, Sprint) share the same `border-l-4 border-l-orange-500` style — the primary action (Review) should feel visually dominant (e.g., filled background vs. outline cards for secondaries).
- **Free write card lacks context**: Shows the weakest concept title with no explanation of why. Add a "weakest concept" micro-label below the title ("Your weakest concept right now") to help users understand the recommendation logic.
- **Level badge is too subtle**: `text-xs` orange pill next to the greeting is easy to miss. As Ped-C makes this meaningful, consider a slightly larger treatment or a separate "Your level" line under the greeting.
- **Sprint card discoverability**: On desktop 2-col grid, SprintCard can end up alone in the last row (after an odd number of other cards), looking orphaned. Consider always pairing it or using a different grid strategy for desktop.
- **No empty-state for Free write card (non-new users without a weakest concept)**: If `writeConcept` is null for a non-new user, the card silently disappears. Add a fallback "Pick a concept to write about" card instead.
- **No skip-to-action affordance**: First-time visit with due reviews buries the CTA below the greeting block + stats card. On small phones this requires scrolling.

**UX-E: Progress page UX audit**
- **Stat cards lack color differentiation**: "Mastered", "In progress", "Accuracy" are three grey cards — no visual distinction despite representing very different data types. Consider: orange for Mastered (goal), amber for In Progress, neutral for Accuracy.
- **Exercise type labels are developer strings**: The accuracy chart uses raw type names (`gap_fill`, `sentence_builder`, `free_write`). Replace with friendly labels: "Gap fill", "Sentence builder", "Free write", "Translation", etc.
- **Activity heatmap has no legend**: Color intensity scale is unexplained. Add a `0 ←→ X sessions` legend below the heatmap, same pattern as GitHub's contribution graph.
- **Module mastery chart legend**: Color-only legend; inaccessible to colorblind users. Add pattern fills or text labels directly on bars.
- **No time-invested stat**: Users are motivated by total time spent; `study_sessions` table has timing data — surface a "Total time studied" or "Avg session length" stat.
- **No streak history**: Only current streak appears on the dashboard. A sparkline or "longest streak" badge on the Progress page adds longitudinal motivation.
- **Page header is bare**: Just "Progress" with no date context or greeting. A subtitle like "Your learning since [join date]" adds warmth and context.
- **Empty state needs a CTA**: When a user has no data, the empty state should link directly to `/study`, not just say "no data yet".

**UX-F: ConceptPicker (free write concept selection) UX overhaul** ✅ *Complete — see `docs/completed-features.md`*

**UX-G: Exercise session UX audit** — Partially complete ✅ / Remaining items below
- ✅ Exercise type label (EXERCISE_TYPE_META in StudySession)
- ✅ "X / Y" progress counter
- ✅ FeedbackPanel score labels (SCORE_CONFIG)
- ✅ Hint dots (HintPanel — always visible when hints exist)
- ✅ Auto-grow textarea (TextAnswer — scrollHeight ref)
- ✅ Exit confirmation dialog (X button + shadcn Dialog)
- ✅ Missed-concept done screen (collapsible list with practice links)
- **Multi-blank GapFill keyboard UX on mobile** *(remaining)*: After filling one blank, mobile keyboard doesn't auto-advance. Implement `onKeyDown Enter → focus next blank input`.
- **Audio button tap target** *(remaining)*: `SpeakButton` may sit too close to other elements on narrow screens. Ensure `min-w-[44px] min-h-[44px]` touch target.
- **Error correction pre-fill** *(remaining)*: ErrorCorrection pre-populates textarea with the incorrect sentence — users sometimes read this as the correct answer. Consider showing erroneous sentence read-only above an empty textarea.

#### Design

**Design-A: App logo**
- Babbel-inspired mark: clean pill or rounded-square shape, "EA" monogram or stylised "Ñ", warm tones complementing the orange primary
- Deliverables: updated `icon.tsx` (192×192 ImageResponse), `apple-icon.tsx` (180×180), and an SVG source file at `public/logo.svg` for use in `AppHeader` and auth pages
- Current auth "ES" block and AppHeader text mark should both be replaced

---

## Recommended Next Steps (priority order)

### Immediate — DB + content

1. **Run migration 008** in Supabase SQL editor: `ALTER TABLE exercises ADD COLUMN annotations jsonb NULL;`

2. **Run `pnpm annotate`** to populate annotations on all 63 existing exercises: `NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm annotate`

3. **Feat-E: Content expansion via AI seeding** — Run `pnpm seed:ai` to draft 3–5 new concepts per unit (output to JSON for human approval before DB insert). Target 40+ concepts across 3 modules. Adds Module 3 (Verb Constructions: ser/estar, reflexive verbs). This is the single highest-leverage action for user retention.

### Next — Learning quality

4. **Ped-B: Verify AI-generated exercises enter SRS pool** — Confirm that exercises inserted by `/api/exercises/generate` (drill mode) appear in subsequent SRS sessions. Requires manual testing after a drill session. No code change expected; this is a validation step.

5. **Ped-D: Gap-fill exercise pedagogical rethink** — Current multi-blank format is unfair: non-target gaps have no hints yet count against the score. Research and decide between: (a) single-target gap (cleanest, DELE-aligned), (b) labelled non-target gaps, or (c) partial reveal on wrong answer. Likely requires a `target_blank_index` convention + GapFill.tsx + grader updates + re-seed.

### Polish & UX quality

6. **UX-G remaining items** — Multi-blank GapFill keyboard auto-advance on mobile; SpeakButton 44px tap target; ErrorCorrection empty-textarea redesign.

7. **UX-D: Dashboard UX audit** — Daily goal progress indicator; primary/secondary visual hierarchy across mode cards; level badge treatment; fallback card when `writeConcept` is null; sprint card desktop layout fix.

8. **UX-E: Progress page UX audit** — Coloured stat cards; friendly exercise type labels in accuracy chart; heatmap legend; accessible chart colours; "total time studied" stat; streak history; improved empty state with CTA.

9. **Design-A: App logo** — Replace "ES" auth block and AppHeader text mark with a proper "EA" / "Ñ" SVG mark. Deliverables: `icon.tsx`, `apple-icon.tsx`, `public/logo.svg`.

10. **Feat-A: Daily email reminders** — Supabase Edge Function `send-daily-reminder`; cron 18:00 UTC; personalised streak-at-risk message; `email_reminders boolean` toggle in `/account`. Requires `ALTER TABLE profiles ADD COLUMN email_reminders boolean DEFAULT true`.

11. **Feat-C: Padlock prerequisites** *(deferred to post-Feat-E)* — Revisit once catalogue reaches 40+ concepts. Will need a `concept_prerequisites` join table (multiple prerequisites per concept) rather than a single nullable column.

### Later — Growth features

12. **Feat-D: Web push notifications (Android PWA)** — Push subscription stored in `profiles.push_subscription jsonb`; Edge Function via VAPID; skip on iOS.

13. **Strat-A: Shareable progress card** — `/progress/share` OG image via `ImageResponse`; `navigator.share` button on dashboard.

14. **Strat-B: Admin content panel** — `/admin` gated by `profiles.is_admin`; read-only exercise/concept browser with attempt counts.