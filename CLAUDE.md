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

**Test suite: 241 tests across 18 files — all passing.**

Completed: Phases 1–8 (auth, SRS, all exercise types, study session, tutor, progress analytics, curriculum, onboarding, PWA, drill mode), Phase 9 fixes (Fix-A–E), UX improvements (UX-A–C), Ped-A (multi-blank gap-fill), Ped-C (computed level), Feat-B (Sprint Mode), Feat-C (grammar focus chips).

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

**Ped-E: Grammatical structure highlighting in exercise texts**
- **Goal**: In gap-fill prompts and other exercises where a full Spanish sentence or paragraph is displayed to the user (e.g. error_correction, transformation), visually highlight key grammatical structures — specifically **subjunctive vs. indicative verb forms** — to scaffold pattern recognition. Research in SLA (noticing hypothesis, Schmidt 1990) shows that salience of form accelerates acquisition.
- **What to highlight**: Subjunctive verb forms (present + imperfect) in one colour; indicative forms in another (or no highlight, making subjunctive the only salient element). Optionally: connector/discourse marker being studied, for gap-fill prompts.
- **Design constraint**: Highlighting must feel like a subtle learning aid, not a crutch — use muted colours (e.g. soft orange underline for subjunctive, no fill) rather than heavy backgrounds that draw attention away from the task.
- **Research needed**:
  - How to reliably detect subjunctive vs. indicative in a Spanish sentence — options: (a) Claude annotates at seed time and stores span offsets in the exercise row; (b) lightweight NLP library (e.g. `compromise` or `nlp.js` with Spanish model) runs client-side; (c) regex heuristics on known inflection endings (fragile).
  - Option (a) is most accurate: when seeding/generating an exercise, ask Claude to return a list of `{ word, form: 'subjunctive' | 'indicative' | 'connector' }` annotations alongside the prompt text; store in `exercises.annotations jsonb`.
- **Affected components**: `GapFill.tsx`, `TextAnswer.tsx` (for transformation/translation prompts), `ErrorCorrection.tsx`; all need to render annotated spans instead of plain text.
- **Scope**: DB migration to add `exercises.annotations jsonb NULLABLE`; seed script update to generate annotations via Claude; new `AnnotatedText.tsx` component; exercise components consume it.

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

**UX-F: ConceptPicker (free write concept selection) UX overhaul**
- **No collapsible modules** *(critical — user-reported)*: The full hierarchy (Module → Unit → Concepts) is fully expanded, producing a very long list. Apply the same `<details>` accordion pattern as `/curriculum` — modules collapsed by default, opened on tap. This is the single most impactful change.
- **No CEFR level tags on concept rows**: Concepts show difficulty bars but no B1/B2/C1 label. Now that Ped-C is live and `concepts.level` exists, add a small level chip (matching curriculum style) to each row so users can self-select difficulty.
- **No mastery filter**: Unlike curriculum, there's no filter to limit concepts to "New" / "Learning" / "Mastered". Writing about a concept you haven't studied is a valid advanced challenge, but the option to filter to *known* concepts would help intermediate users.
- **"Surprise me" is buried**: Currently appears as a text button in the header area. It should be a more prominent secondary CTA — e.g., a ghost button in the sticky footer alongside "Start writing", or as the top card before the module list.
- **Difficulty label in footer is jargon**: "Focused / Synthesis / Challenge" is not intuitive without a legend. Add a one-line tooltip or subtitle explaining the label (e.g., "Challenge: writing across 3+ concepts tests your ability to blend structures").
- **No back affordance**: There is no visible "Back to dashboard" or breadcrumb if the user changes their mind. The browser back button works, but it should be explicit.
- **Data fetching**: ConceptPicker is client-side but receives all concepts as a prop — verify this scales as concept count grows (Feat-E target: 40+). May need paginated/lazy loading eventually.
- **Implementation**: Needs access to `concepts.level` (already in types after Ped-C); ConceptPicker receives modules/units/concepts from `write/page.tsx` server component — extend the query to include `level` and pass it down.

**UX-G: Exercise session UX audit (StudySession + exercise components)**
- **No exercise type label during session**: Users see a prompt with no header indicating what kind of exercise it is (Gap Fill, Translation, etc.). A small `text-xs uppercase` type label above the prompt (like the dashboard mode card headers) would orient users immediately.
- **Progress bar has no "X of Y" counter**: The linear progress bar shows position but not remaining count. Add an `e.g. "3 / 10"` label — low effort, high value for managing expectations.
- **Hint system progression is invisible**: Users don't know a second hint or "worked example" exists until after their first wrong attempt. Add a subtle "Hints available" indicator (e.g., 2 small dots below the exercise) that fills in as hints are used.
- **TextAnswer textarea is too short**: Fixed at 4 rows for all types including `free_write` (which targets 20–200 words). TextAnswer should auto-grow (`resize-y` is disabled) — replace with a `min-h` + `overflow-auto` approach so the textarea expands as the user types.
- **FeedbackPanel score is raw (0–3)**: The score badge shows a number that means nothing to most users. Replace with labels: `0 = Incorrect`, `1 = Partial`, `2 = Good`, `3 = Perfect` (already in `SCORE_CONFIG` in `src/lib/scoring.ts` — use the label from there).
- **No session exit confirmation**: The X/close button abandons the session with no confirmation dialog. One accidental tap loses all progress. Add a simple modal: "Leave session? Your progress this session won't be saved."
- **Done screen shows no concept breakdown**: Accuracy % is shown, but not which concepts were missed. A collapsed list of missed concepts (with a "Practice →" link each) on the done screen would close the loop perfectly.
- **Multi-blank GapFill keyboard UX on mobile**: After filling one blank, the mobile keyboard doesn't auto-advance to the next blank. Implement `onKeyDown Enter → focus next blank input` for a smoother flow.
- **Audio button tap target**: `SpeakButton` can sit very close to other interactive elements on narrow screens. Ensure a minimum `min-w-[44px] min-h-[44px]` touch target (same standard applied to SprintCard chips).
- **Error correction pre-fill is confusing**: ErrorCorrection pre-populates the textarea with the incorrect sentence and shows a warning banner. Users sometimes read this as the correct answer. Consider showing the erroneous sentence *above* the input (read-only, styled as a blockquote) and keeping the textarea empty — clearer separation between "what's wrong" and "write the fix".

**UX-H: Curriculum page CEFR level tags** *(targeted fix, not a full audit)*
- Add a small `B1` / `B2` / `C1` chip to each concept row in `/curriculum` and `/curriculum/[id]` — the `concepts.level` column already exists (Ped-C).
- Style: same chip style as the dashboard level badge (`px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700`) but use distinct colours per level (e.g., green for B1, orange for B2, red/purple for C1) to create a quick visual difficulty spectrum across the full concept list.
- Also add level filtering as a secondary axis in the filter tabs (or as a separate row of chips below the existing All|New|Learning|Mastered tabs): e.g., `All levels | B1 | B2 | C1`.
- Update `/curriculum/[id]` detail page header to prominently show the level chip alongside the concept title.

#### Design

**Design-A: App logo**
- Babbel-inspired mark: clean pill or rounded-square shape, "EA" monogram or stylised "Ñ", warm tones complementing the orange primary
- Deliverables: updated `icon.tsx` (192×192 ImageResponse), `apple-icon.tsx` (180×180), and an SVG source file at `public/logo.svg` for use in `AppHeader` and auth pages
- Current auth "ES" block and AppHeader text mark should both be replaced

---

## Recommended Next Steps (priority order)

### Immediate — High learning value

1. **Feat-E: Content expansion via AI seeding** — Run `pnpm seed:ai` to draft 3–5 new concepts per unit (output to JSON for human approval before DB insert). Target 40+ concepts across 3 modules. Adds Module 3 (Verb Constructions: ser/estar, reflexive verbs). This is the single highest-leverage action for user retention.

2. **Ped-B: Verify AI-generated exercises enter SRS pool** — Confirm that exercises inserted by `/api/exercises/generate` (drill mode) appear in subsequent SRS sessions. Requires manual testing after a drill session. No code change expected; this is a validation step.

3. **Ped-D: Gap-fill exercise pedagogical rethink** — Current multi-blank format is unfair: non-target gaps have no hints yet count against the score. Research and decide between: (a) single-target gap (cleanest, DELE-aligned), (b) labelled non-target gaps, or (c) partial reveal on wrong answer. Likely requires a `target_blank_index` convention + GapFill.tsx + grader updates + re-seed.

4. **Ped-E: Grammatical structure highlighting** — Highlight subjunctive vs. indicative verb forms in exercise texts to scaffold pattern noticing (Schmidt 1990). Best approach: Claude annotates at seed time → `exercises.annotations jsonb`; new `AnnotatedText.tsx` component; affects GapFill, TextAnswer, ErrorCorrection. Requires research on annotation strategy before implementation.

### Next — Polish & UX quality

5. **UX-H: Curriculum CEFR level tags** *(targeted, low-effort, high-impact)* — Add B1/B2/C1 chip to every concept row in `/curriculum` and `/curriculum/[id]`; distinct colours per level; optional level filter row below existing tabs.

6. **UX-F: ConceptPicker overhaul** — Collapse modules by default (same `<details>` pattern as curriculum); add CEFR level chip per concept row; add mastery filter; make "Surprise me" more prominent; add back affordance; no DB change needed.

7. **UX-G: Exercise session UX polish** — Add exercise type label + "X of Y" counter; hint-system visibility indicator; auto-growing textarea for free_write/TextAnswer; FeedbackPanel score labels (from SCORE_CONFIG); exit confirmation dialog; missed-concept breakdown on done screen.

8. **UX-D: Dashboard UX audit** — Daily goal progress indicator; primary/secondary visual hierarchy across mode cards; level badge treatment; fallback card when `writeConcept` is null; sprint card desktop layout fix.

9. **UX-E: Progress page UX audit** — Coloured stat cards; friendly exercise type labels in accuracy chart; heatmap legend; accessible chart colours; "total time studied" stat; streak history; improved empty state with CTA.

10. **Design-A: App logo** — Replace "ES" auth block and AppHeader text mark with a proper "EA" / "Ñ" SVG mark. Deliverables: `icon.tsx`, `apple-icon.tsx`, `public/logo.svg`.

11. **Feat-A: Daily email reminders** — Supabase Edge Function `send-daily-reminder`; cron 18:00 UTC; personalised streak-at-risk message; `email_reminders boolean` toggle in `/account`. Requires `ALTER TABLE profiles ADD COLUMN email_reminders boolean DEFAULT true`.

12. **Feat-C: Padlock prerequisites** *(deferred to post-Feat-E)* — Revisit once catalogue reaches 40+ concepts. Will need a `concept_prerequisites` join table (multiple prerequisites per concept) rather than a single nullable column.

### Later — Growth features

13. **Feat-D: Web push notifications (Android PWA)** — Push subscription stored in `profiles.push_subscription jsonb`; Edge Function via VAPID; skip on iOS.

14. **Strat-A: Shareable progress card** — `/progress/share` OG image via `ImageResponse`; `navigator.share` button on dashboard.

15. **Strat-B: Admin content panel** — `/admin` gated by `profiles.is_admin`; read-only exercise/concept browser with attempt counts.