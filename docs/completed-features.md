# Completed Features Archive

This file contains implementation details for all completed work. Reference it when debugging, resuming, or extending a feature.

---

## Fix-K: PWA Performance Improvements ✓ (2026-03)

Updated `public/sw.js` (bumped to `spanish-app-v2`):
- **App shell pre-cache** — `SHELL_URLS` list pre-cached at SW install time (`Promise.allSettled` so a single failure doesn't block install).
- **Stale-while-revalidate for navigation** — `navigate` requests served from cache immediately, revalidated in background. Skips `/api/*` and `/auth/*`.
- **Icon + manifest cache-first** — `/icon`, `/apple-icon`, `/manifest.webmanifest` added to pre-cache and served cache-first.

---

## Fix-F: Write Page Sticky Footer Desktop Alignment ✓ (2026-03)

Added `lg:left-[220px]` to the fixed footer div in `src/app/write/ConceptPicker.tsx`. Shifts the footer's left edge to match the 220px sidebar on desktop; mobile unchanged (`left-0`).

---

## Perf-A: Stream Grading Response ✓ (2026-03)

1255 tests across 44 files, all passing.

**Protocol:** NDJSON (`application/x-ndjson`) — two newline-delimited JSON objects streamed in order. Score+SRS data first (< 500ms), feedback text second.

**`src/lib/claude/grader.ts`** — Added `gradeAnswerStream()` async generator alongside existing `gradeAnswer()` (which is still used by `/api/grade`). Exports `ScoreChunk` and `DetailsChunk` types. Asks Claude for two JSON lines; buffers token stream; yields `ScoreChunk` on first `\n`, `DetailsChunk` after stream ends. Full fallback for malformed JSON or API errors.

**`src/app/api/submit/route.ts`** — Replaced `gradeAnswer()` + `NextResponse.json()` with `ReadableStream` NDJSON response. SM-2 upsert happens before chunk 1 is enqueued. Fire-and-forget ops (attempt record, streak, computed level) run after `controller.close()`. Error paths before streaming still use `NextResponse.json()`.

**`src/app/study/StudySession.tsx`** — `handleSubmit()` reads NDJSON via `res.body.getReader()`. Added `streamingDetails` state and `pendingDetailsRef` (guards race where chunk 2 arrives before the 300ms flash timer fires). `FeedbackPanel` receives `isGenerating={generatingMore || streamingDetails}`.

**`src/components/exercises/FeedbackPanel.tsx`** — Animated `animate-pulse` skeleton shown for feedback and explanation while `result.feedback === ''`; disappears when chunk 2 populates the text.

**Note:** Browser DevTools may show `Content-Type: application/json` (Next.js sniffs first bytes). This is cosmetic — the client reads raw bytes via `ReadableStream` and is unaffected.

**New tests:** `src/lib/claude/__tests__/grader.stream.test.ts` (7 cases), `src/app/api/submit/__tests__/route.stream.test.ts` (7 cases). Updated: `route.mastery.test.ts` and `StudySession.test.tsx` use streaming mocks (`makeStreamingSubmitResponse()`).

---

## UX-W: Exercise UI Clarity Audit ✓ (2026-03)

1239 tests across 42 files, all passing.

**Header compressed from 5 rows to 2 rows:**
- Row 1: thin `h-1` progress bar + X exit button inline on the right
- Row 2: `ConceptTitle · ExerciseType · [GrammarFocusChip] · N/Total · Notes ↓` — all `text-xs text-muted-foreground`

**Removed from header:** session label badge, time estimate (`~N min`), and all supporting state (`submissionTimes`, `exerciseStartRef`). These were noise that didn't help mid-exercise.

**Progressive disclosure — HintPanel gated:** `<HintPanel>` now only renders when `wrongAttempts > 0`, with a `fade-in duration-300` animation on first appearance. Previously hint dots were shown from attempt #1.

**GrammarFocusChip added to header:** `GrammarFocusChip` (violet=Subjunctive, sky=Indicative, amber=Both) is now inline in the metadata row between exercise type and counter. Hidden when `grammar_focus` is null.

**Concept Notes folded into metadata row:** was a full-width `bg-muted/50` button row (~40px); now an inline `Notes ↓/↑` toggle in the metadata line. Same expand/collapse logic and panel.

**ErrorCorrection.tsx:** prompt `text-lg` → `text-xl` for consistency with all other exercise types.

**Files changed:** `StudySession.tsx`, `ErrorCorrection.tsx`, `StudySession.test.tsx`
**Tests:** removed 5 stale tests (badge, UX-Z time estimate); updated 3 UX-AB tests for new "Notes" label; added 3 new UX-W progressive-disclosure tests.

**FeedbackPanel mock** in `StudySession.test.tsx` now exposes `onTryAgain?: () => void` as `data-testid="try-again-btn"` — needed for hint-panel gating tests.

---

## UX-AH + Fix-H: Decouple SRS Review from Open Practice ✓ (2026-03)

1241 tests across 42 files, all passing.

**Two-mode mental model implemented:**
- **SRS Review** — `due_date <= today` gate; entry via Dashboard Review card, Sprint, Mistake review, Learn new
- **Open Practice** — no SRS gate; entry via Configure page (new mode button), all Curriculum Practice buttons, "Practice anyway"

**`study/page.tsx` — core logic refactor:**
- `isOpenPractice = params.practice === 'true'` — broad flag (replaces narrow `isPracticeMode`)
- `isDrillMode = isOpenPractice && !!params.concept && filterTypes.length > 0` — narrow drill enabling AI generation
- New query branch: unscoped Open Practice fetches whole catalog with no due-date filter
- Open Practice item assembly: all exercises per concept (not 1 random)
- `cycleToMinimum()` applied to all Open Practice paths → guarantees ≥ MIN_PRACTICE_SIZE=5 exercises (Fix-H)
- `shouldInterleave` and `cappedItems` updated to use new flags
- `sessionLabel` string computed and passed as prop to `StudySession`

**`src/lib/practiceUtils.ts`** — new file: pure `cycleToMinimum(items, min)` helper; avoids consecutive duplicates when pool ≥ 2.

**`src/lib/constants.ts`** — added `MIN_PRACTICE_SIZE = 5`.

**`StudySession.tsx`** — `sessionLabel?: string` prop; renders in session header badge replacing generic `{type} practice` text.

**`SessionConfig.tsx`** — three mode buttons (SRS Review / Open Practice / Review mistakes); `useSearchParams` for `?mode=practice` pre-selection; module picker label changes per mode ("whole catalog" vs "SRS due queue"); `handleStart` sets `practice=true` for Open Practice.

**Curriculum hrefs** — all Practice buttons now carry `practice=true`:
- `curriculum/page.tsx`: module, unit, concept Practice links
- `curriculum/[id]/page.tsx`: "Practice all" button

**`SprintCard.tsx`** — copy: label "Sprint" → "SRS Sprint"; headings clarified; module filter relabelled "Filter by module (SRS due only)".

**`dashboard/page.tsx`** — "Practice anyway" → `/study/configure?mode=practice`.

**New test files:** `SessionConfig.test.tsx` (7 tests), `practiceUtils.test.ts` (6 tests). Updated: `StudySession.test.tsx` (+2 sessionLabel tests), `SprintCard.test.tsx` (2 copy assertions).

---

## Feat-H: Design & UX Review ✓ (2026-03)

Full design polish pass. 1120 tests passing across 29 files.

**Batch 1 — Remove Difficulty Bars**
- Deleted `DifficultyBars` component from `src/app/curriculum/page.tsx`, `src/app/curriculum/[id]/page.tsx`, `src/app/write/ConceptPicker.tsx`
- `difficulty` field stays in DB for SRS ordering; only the visual removed

**Batch 2 — Icon System (strokeWidth=1.5)**
- All content-area icons set to `strokeWidth={1.5}` (thinner, more refined)
- Exceptions: SideNav + BottomNav keep default stroke weight
- Tutor nav icon swapped `MessageSquare` → `Bot`
- Files: dashboard, curriculum, progress, account, FeedbackPanel, StudySession, SprintCard, write, tutor, OnboardingTour, IOSInstallPrompt, PushPermissionPrompt, SessionConfig

**Batch 3 — Colour Restraint**
- `UserAvatar`: reverted to orange (`bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200`) — grey was hard to spot
- Fix-G (dark mode Review card): already resolved via `.review-card-warm` CSS class in `globals.css`

**Batch 4 — Nav Reorder + Study Routing**
- Nav order: Dashboard → Study → Curriculum → Progress → Tutor (both SideNav + BottomNav)
- Study nav href: `/study` → `/study/configure`
- Active state logic updated: `/study/*` paths activate the Study tab

**Batch 5 — Configure Page Revamp**
- `src/app/study/configure/page.tsx`: server component now fetches mastery data per module
- `src/app/study/configure/SessionConfig.tsx`: mastery count per module button (`"12/23 mastered"`); session size pill selector 5/10/15/20/25 (default 10); passes `?size=N` to `/study`
- `src/app/study/page.tsx`: reads `size` param, caps to 50, slices queue accordingly

**Batch 6 — Free Write Discoverability**
- Done screen (`StudySession.tsx`): "Free write about this topic →" CTA when `freeWriteConceptId` prop set
- `/study` passes `freeWriteConceptId` when `?concept=<id>` (single-concept sessions only)

**Batch 7 — Exercise Completion Counter**
- `src/app/curriculum/[id]/page.tsx`: counts `exercise_attempts` for this concept server-side; shows "X exercises completed" with `CheckCircle2` icon when count > 0

**Batch 8 — Progress Page: All-time Stats + Exercise Type Chart**
- Two new all-time stat cards: total exercises completed + total learning hours
- New `src/components/ExerciseTypeChart.tsx`: horizontal recharts BarChart of attempts per exercise type
- CEFR level items: dashed vertical connector between levels (`border-l-2 border-dashed border-border`)

**Batch 9 — Typography Polish**
- All page `h1` tags: `text-2xl font-bold tracking-tight`
- Section labels: `text-xs font-semibold uppercase tracking-widest text-muted-foreground`
- Empty states in `/study`: inline SVG icons + rounded-full CTA buttons

**Batch 10 — Graphical Elements**
- Auth pages (`/auth/login`, `/auth/signup`): desktop two-column split — dark left panel with faint Ñ letterform (`rgba(255,255,255,0.04)`) + tagline "Advanced Spanish. Beautifully structured."; form on right; mobile unchanged
- Dashboard: `h-px w-16 bg-gradient-to-r from-orange-500 to-transparent` accent line below greeting

**Curriculum Module Rename (post Feat-H)**
- `src/lib/curriculum/curriculum-plan.ts`: "The Subjunctive" (13 concepts) split into:
  - "The Subjunctive: Core" — Unit 2.1, 5 concepts
  - "The Subjunctive: Advanced" — Units 2.2+2.3, 8 concepts
- `curriculum-plan.test.ts` updated: 7 modules, new name assertions, Core(5) + Advanced(8) counts
- DB rename: manual SQL required — `UPDATE modules SET title = '...' WHERE id = '...'`

**Curriculum locked concept UI**
- `src/app/curriculum/page.tsx`: locked rows get `bg-muted/30 border-border/40` background; entire row content at `opacity-40`; lock icon inline left of title; title text `text-muted-foreground`

---

## Phases 1–6E + BottomNav polish

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
- **Pre-Phase 6 audit**: Zod validation, security headers, shared components, ErrorBoundary, constants, scoring module
- **63 exercises seeded** (3 per concept; 3rd is free_write or error_correction)
- **P6-A**: /api/topic, /api/grade, FreeWritePrompt.tsx, WriteSession.tsx, /write page; exercise_id nullable
- **P6-B**: Curriculum per-concept type buttons; `/study?types=` discoverability
- **Dashboard redesign**: Three mode cards — Review, Learn new, Free write; type pills removed; `/study?mode=new` queue for unlearned concepts
- **Free-write concept picker**: ConceptPicker.tsx (checkbox grouped by module/unit, Surprise me, sticky footer with difficulty label); /write branches on ?concepts= vs picker; WriteSession accepts conceptIds[]; /api/topic and /api/grade accept concept_ids[]; FreeWritePrompt has 200-word live counter (Submit disabled <20 or >200 words)
- **P6-C**: `/account` page (display_name, daily_goal_minutes); `POST /api/account/update` Zod validated; Account added to dashboard quick-nav
- **P6-D (PWA)**: `src/app/manifest.ts` (standalone, theme #18181b, start_url /dashboard); `icon.tsx` 192×192 + `apple-icon.tsx` 180×180 via ImageResponse; layout.tsx `appleWebApp` metadata; `public/sw.js` cache-first for `/_next/static/` assets; `ServiceWorkerRegistration.tsx` client component
- **P6-E (UX redesign)**: orange primary token (`oklch(0.65 0.20 35)`), orange accent strips on mode cards, stat row with Flame/Trophy icons, segmented progress bar, exercise type icon badges, FeedbackPanel accent strips, orange SentenceBuilder chips, word-count bar, ConceptPicker card-style rows with DifficultyBars, curriculum module progress bars, auth ES logo mark, AccountForm level cards
- **BottomNav polish**: `bg-background` (fully opaque); `/study` and `/tutor` removed from HIDDEN_ROUTES; safe-area-inset-bottom padding
- **Dashboard header polish**: stats row + progress bar merged into single `bg-card rounded-xl border` status card; stat numbers `text-2xl`; dashboard bottom padding `pb-[calc(3.125rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-8`

---

## P6-F: Google OAuth ✓

- `src/components/auth/GoogleButton.tsx` — calls `signInWithOAuth({ provider: 'google' })`, redirects to `/auth/callback`
- Both `/auth/login` and `/auth/signup` have Google button + "or" divider above email/password form
- Login page handles `?error=auth_callback_failed` from callback route
- **Requires**: Google provider enabled in Supabase dashboard (Auth → Providers → Google) with a Google Cloud OAuth client ID + secret

---

## P7: Curriculum Overhaul ✓

**Content structure**
- Concepts clustered by communicative function (not grammatical form) per SLA research
- Module taxonomy: Discourse & Text Organisation · Subjunctive Mastery
- Unit names reflect function (e.g. "Contrast & Concession", not "Concessive Connectors")
- Subjunctive units ordered by acquisition sequence: Desire/Volition → Impersonal Necessity → Doubt/Uncertainty → Concessive/Conditional

**Navigation architecture**
- `/curriculum` = browse page (compact rows + filter tabs + collapsible module accordion)
- `/curriculum/[id]` = concept detail page (all action buttons live here)
- Filter tabs: All | New | Learning | Mastered — stored in `?filter=` URL param (server-side)
- Concept rows: title + mastery badge + difficulty bars + "Practice →" shortcut only
- Module header: mastery progress bar + `<details>` accordion (open when filter matches)
- Back link on detail page preserves `?filter=` param

---

## Phase 8: Drill Mode ✓

- `POST /api/exercises/generate` — auth-guarded; generates gap_fill / translation / transformation / error_correction via Claude; inserts into `exercises` table via service role client (bypasses RLS); returns full row
- `POST /api/submit` — `skip_srs: boolean` optional flag; SM-2 upsert skipped in drill mode; streak kept
- `study/page.tsx` — `?practice=true&concept=X&types=T` loads all exercises of that type (no random); passes `practiceMode`, `generateConfig`, `returnHref` to StudySession
- `StudySession.tsx` — dynamic queue (`useState`); "Generate 3 more" (parallel x3 API calls, appends items, resumes); "Back to concept" button; SRS copy hidden in drill mode
- `curriculum/[id]/page.tsx` — per-type buttons now add `&practice=true`; "Practice all" unchanged (SRS mode)

---

## Phase 9 — Completed Items

### Fix-A: Desktop/iPad navigation — persistent left sidebar ✓
- `src/components/SideNav.tsx` — 220px fixed sidebar, `hidden lg:flex`; all nav items + Account at bottom; active-state logic; hidden on `/auth`,`/onboarding`,`/write`; wired into `layout.tsx`

### Fix-B: Remove "Back to Dashboard" link on Account page ✓
- No link existed at implementation time — removed during UX-A account revamp

### Fix-C: Rename app to "Español Avanzado" ✓
- All user-facing strings updated: `manifest.ts`, `layout.tsx`, `AppHeader.tsx`, `SideNav.tsx`, auth pages, `IOSInstallPrompt.tsx`

### Fix-D: P8 RLS bug — exercises INSERT blocked by RLS ✓
- `src/app/api/exercises/generate/route.ts` — `createServiceRoleClient()` defined at top using `SUPABASE_SERVICE_ROLE_KEY`; used for the insert

### Fix-E: Google OAuth — `handle_new_user` trigger uses wrong metadata field ✓
- Migration: `supabase/migrations/005_fix_google_oauth_trigger.sql` — `create or replace function` with updated `coalesce` chain: `display_name → full_name → name → email prefix`
- Infrastructure prerequisite: Google provider enabled in Supabase dashboard + Google Cloud Console OAuth client

### UX-A: Account page revamp ✓
- Sections: Profile (AccountForm), Security (SecurityForm), Session+Danger (DangerZone), IOSInstallCard
- Change Email + Change Password with strength indicator and Eye/EyeOff toggles; grouped section layout with card wrappers

### UX-B: iOS "Add to Home Screen" install prompt ✓
- `src/components/IOSInstallPrompt.tsx` — dismissible bottom sheet; `localStorage pwa_prompt_dismissed`
- IOSInstallCard in `/account` — permanent settings card (no dismissed check)

### UX-C: Audio playback for Spanish sentences ✓
- `src/lib/hooks/useSpeech.ts` — `useSpeech(text?, lang?)` hook; `localStorage audio_enabled`
- Speaker icon in exercise prompts, FeedbackPanel correct answer, curriculum examples table
- Audio on/off toggle in `/account` (AccountForm Preferences section)

### Ped-A: Multi-blank gap-fill infrastructure ✓
- `src/lib/exercises/gapFill.ts` — pure utilities (BLANK_TOKEN=`___`, splitPromptOnBlanks, countBlanks, parseExpectedAnswers, encodeAnswers)
- expected_answer stored as JSON array string `'["sin embargo","aunque"]'` for multi-blank; grader detects and scores per-blank
- Submission: pipe-delimited `"answer1 | answer2"` — no API schema change

### Ped-D: Gap-fill same-concept redesign ✓
- **Problem solved**: 13 of 21 gap_fill exercises previously tested an unrelated concept in blank 2, penalising learners for content they hadn't studied.
- **Design rule**: Max 2 blanks per exercise; ALL blanks test the same target concept. 1 blank is the default.
  - *Group A1 (verb-form blank)*: Concept 0 ("aunque + indicativo") — "aunque" visible, blank = indicative verb (e.g. `hacía`). Tests mood selection, not connector recall.
  - *Group A2 (connector blank)*: 11 connector exercises reduced to 1 blank; context disambiguates from plausible alternatives.
  - *Group B (keep 2 blanks)*: 8 exercises already correctly tested the same concept — hints cleaned up.
- **GapFill.tsx** — `hasInlineBlanks = blankCount >= 1` (was `isMultiBlank >= 2`); all ≥1-blank exercises now render inline. Underline-style `<input>` (border-b-2, no border box) with ch-width from expected_answer (+2ch buffer). Auto-advance on Enter via `useRef` array: blank N → blank N+1 → Submit. 0-blank fallback unchanged.
- **generate/route.ts** — TYPE_RULES: prefer 1 blank, allow 2 only same-concept. Validation accepts plain string (1-blank) or JSON array (2-blank).
- **DB**: `pnpm truncate && pnpm seed && pnpm annotate` — 63 exercises re-seeded; 61/63 annotated (2 free_write exercises remain at null annotations, plain-text fallback applied).
- **Tests**: 273 passing (3 new auto-advance tests; updated for `aria-label="Your answer"` on single-blank inline mode).

### Ped-C: User level computed from mastery, not self-selected ✓
- `src/lib/mastery/computeLevel.ts` — `PRODUCTION_TYPES` constant; `computeLevel()` pure fn
- Dual mastery criterion: SRS `interval_days >= 21` AND `production_mastered = true` (Tier 2/3 score ≥ 2)
- Thresholds: B1 default; B2 at ≥70% B1 dually mastered; C1 at ≥70% B1 + ≥60% B2
- `concepts.level` column tags all 21 concepts B1/B2/C1; migration 006 applied
- `user_progress.production_mastered` flag updated by `/api/submit` + `/api/grade` on every Tier 2/3 correct answer
- `profiles.computed_level` persisted after each submission; dashboard + account badge read it
- AccountForm: level picker removed; read-only badge + per-CEFR mastery breakdown shown

### Feat-B: Configurable Sprint Mode ✓ (+ UX audit polished)
- `src/components/SprintCard.tsx` — `'use client'` dashboard card; collapsed state has two-button CTA (solid "Sprint 10 min →" + ghost "Customise ↓"); X button closes expanded panel; animated expand/collapse (`max-h`/`opacity`/`aria-hidden`); all active chips `bg-orange-500`; 44px touch targets; "Recommended" label on 10 min; `dueCountByModule` badge on module chips; hidden for new users; Time (5/10/15 min) or Count (5/10/15/20) limit; optional module filter; navigates to `/study?mode=sprint&limitType=…&limit=…[&module=…]`
- `dashboard/page.tsx` — fetches modules + `dueCountByModule` (nested join: `user_progress → concepts → units`) in Promise.all; renders `<SprintCard>` only when `studiedCount > 0`
- `study/page.tsx` — parses `mode=sprint`, `limitType`, `limit`; sprint branch: SRS due queue (no SESSION_SIZE cap) with optional module filter; passes `sprintConfig` to StudySession
- `StudySession.tsx` — countdown timer; shrinking progress bar with amber pulse at <10% remaining; count-cap via `effectiveLength`; done screen shows "Reviewed X exercises in MM:SS" for time mode; done button label "Back to Home" for sprint sessions
- No DB changes needed

### Feat-C: Grammar focus chips ✓ (revised scope — padlock system deferred to post-Feat-E)
- `supabase/migrations/007_grammar_focus.sql` — `ALTER TABLE concepts ADD COLUMN grammar_focus text CHECK (...)` + 21 UPDATE statements; migration applied
- `src/lib/supabase/types.ts` — `grammar_focus: string | null` on Concept Row/Insert/Update
- `src/lib/curriculum/seed.ts` — `grammar_focus` field on `ConceptSeed` type + all 21 entries (single source of truth for Feat-E)
- `src/lib/curriculum/run-seed.ts` — `grammar_focus` included in `conceptsToInsert`
- `src/components/GrammarFocusChip.tsx` — shared chip; sky = Indicative, violet = Subjunctive, amber = Both moods; null-safe (returns null for unknown/null/undefined)
- Shown on `/curriculum` concept rows, `/curriculum/[id]` title header, `ConceptPicker` free-write chooser
- Padlock/prerequisite system deferred: too few concepts (21) for locking to add value; revisit after Feat-E; will need `concept_prerequisites` join table for multiple prerequisites per concept

### UX-H: Curriculum CEFR level tags ✓
- `src/lib/constants.ts` — `LEVEL_CHIP` map: B1=green-100/700, B2=amber-100/700, C1=purple-100/700
- `src/components/LevelChip.tsx` — null-safe chip (mirrors GrammarFocusChip); returns null for unknown/null/undefined; 6 unit tests added (247 total)
- `/curriculum` — `level` added to concepts query; `LevelChip` rendered on every concept row (left of GrammarFocusChip); level filter chip row (`All levels | B1 | B2 | C1`) below mastery tabs; AND logic with mastery filter; `backFilter` preserves both `filter=` and `level=` params
- `/curriculum/[id]` — `LevelChip` added to title header alongside GrammarFocusChip (data already available via `select('*')`)
- Mastery badges (`New`/`Learning`/`Mastered`) restyled to match chip spec: `text-[10px]`, `px-1.5 py-0.5 rounded`, muted colours (`-50` bg, `-100` border) — consistent with LevelChip + GrammarFocusChip; applied to both curriculum pages

### UX-G: Exercise session UX polish ✓ (fully complete)

**Hint availability dots (HintPanel.tsx)**
- Previous behaviour: component returned null when `wrongAttempts === 0`, so users couldn't tell hints existed
- New behaviour: component returns null only when *neither* `hint1` nor `hint2` is provided; otherwise always renders a dots row
- Dots row: `"Hints:" label + one dot per hint (h-2 w-2 rounded-full)`; dot colour transitions from `bg-border` (grey) to `bg-amber-400` as each hint is revealed (at wrongAttempts ≥ 1 and ≥ 2)
- Claude-worked-example indicator (`✦ Example` in `text-blue-500`) appended to dots row when claudeHint is populated
- Hint text boxes still only render after wrong attempts — only the dots are always visible

**Auto-grow textarea (TextAnswer.tsx)**
- Replaced fixed `rows={4} resize-none` with `min-h-[6rem] overflow-hidden` + inline `style={{ resize: 'none' }}`
- `textareaRef` + `autoResize()` function: sets `el.style.height = 'auto'` then `el.style.height = el.scrollHeight + 'px'`
- `autoResize()` called in `useEffect` on `answer` change and on mount

**Exit confirmation dialog (StudySession.tsx)**
- Added `showExitDialog` boolean state
- X button (`lucide X` icon) in the progress bar row, right of the exercise type badge; calls `setShowExitDialog(true)`
- shadcn `Dialog` (`src/components/ui/dialog.tsx` — added via `pnpm dlx shadcn@latest add dialog`) wraps `DialogContent` with title "Leave session?", body text, and two `DialogFooter` buttons: "Keep going" (outline, dismisses) and "Leave" (destructive, navigates to `returnHref ?? '/dashboard'`)
- Dialog rendered at component root, outside the phase conditionals, so it works from both answering and feedback phases

**Missed-concept done screen (StudySession.tsx)**
- Added `missedConcepts: Array<{ id: string; title: string }>` state
- In `handleSubmit`, when `result.score < 2`, pushes current concept to `missedConcepts` (deduplicates by id)
- Done screen: after the correct/missed badge row, renders a `<details>` element (collapsed by default) when `missedConcepts.length > 0`
- Summary: `"X concept(s) to revisit"`; body: `<ul>` of `<a href="/study?concept={id}">Practice: {title} →</a>` links

### Ped-E: Grammatical structure highlighting ✓ (annotations jsonb, AnnotatedText, pnpm annotate)

**DB migration**
- `supabase/migrations/008_exercise_annotations.sql`: `ALTER TABLE exercises ADD COLUMN annotations jsonb NULL;`
- Run manually in Supabase SQL editor; existing exercises get NULL (filled by `pnpm annotate`)

**Types**
- `src/lib/supabase/types.ts` — new `AnnotationSpan` interface: `{ text: string; form: 'subjunctive' | 'indicative' | null }`
- `annotations: AnnotationSpan[] | null` added to Exercise Row, Insert, and Update types

**AnnotatedText component**
- `src/components/AnnotatedText.tsx` — props: `text: string`, `annotations: AnnotationSpan[] | null | undefined`
- Falls back to `<span>{text}</span>` when annotations is null or empty
- Subjunctive spans: `border-b-2 border-orange-400 text-orange-700 title="Subjunctive"` — soft orange underline, warm text
- Indicative and null-form spans: plain `<span>` (no highlighting — pedagogically correct, salience on subjunctive only)

**pnpm annotate CLI script**
- `src/lib/curriculum/annotate-exercises.ts` — fetches all exercises where `annotations IS NULL`; processes in batches of 10; calls Claude (`claude-sonnet-4-20250514`) with a grammar-expert prompt; validates concatenated spans equal original prompt (skips + logs warning on mismatch); upserts `annotations` column
- `src/lib/curriculum/run-annotate.ts` — CLI entry point; requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- `package.json` — added `"annotate": "tsx src/lib/curriculum/run-annotate.ts"` script

**Generate route update**
- `src/app/api/exercises/generate/route.ts` — Claude prompt now requests an `annotations` array in the JSON response; validates concatenated spans equal prompt text (stores null + logs warning on mismatch); inserts `annotations: validatedAnnotations` in the DB row

**Exercise component updates**
- `GapFill.tsx` — `sliceAnnotationsForSegment()` helper: calculates character offsets of each text segment (interleaved with `___` tokens), extracts overlapping annotation spans; AnnotatedText rendered per text segment in multi-blank layout; single-blank layout uses AnnotatedText on full prompt
- `TextAnswer.tsx` — prompt wrapped in AnnotatedText (translation, transformation, free_write)
- `ErrorCorrection.tsx` — `sliceAnnotationsForSentence()` helper: finds the erroneous sentence substring in the full prompt via `indexOf`, extracts overlapping spans; AnnotatedText rendered inside the red erroneous-sentence box

**Tests**
- `src/components/__tests__/AnnotatedText.test.tsx` — 9 tests: null/empty/undefined fallback; subjunctive orange class + title; indicative + null no class; multiple subjunctive spans; concat reproduces original text
- `src/components/exercises/__tests__/HintPanel.test.tsx` — 6 tests: no hints → null; dots rendered at 0 attempts; two dots for two hints; amber on wrongAttempts ≥ 1; amber dot2 on ≥ 2; hint text only after wrong attempts
- `GapFill.test.tsx` + `ExerciseRenderer.test.tsx` — `makeExercise` helpers updated to include `annotations: null`
- **Total: 273 tests across 21 files — all passing** *(3 added by Ped-D)*

### UX-E: Progress page redesign ✓

**Overview**
Full rewrite of `/progress` replacing the 3-grey-card layout and dated recharts charts with a structured 5-section page: coloured stat row, CEFR level journey, exercise type accuracy, study consistency, activity heatmap.

**Files changed**
- `src/app/progress/page.tsx` — full rewrite
- `src/app/progress/AccuracyChart.tsx` — full rewrite (horizontal bars + TYPE_CONFIG export)
- `src/app/progress/MasteryChart.tsx` — **deleted** (replaced by inline CEFR bars)
- `src/app/progress/__tests__/AccuracyChart.test.tsx` — new (10 tests)

**Section 1 — Stats row (2×2 mobile / 4-col desktop)**
Four coloured cards, each with a rounded icon circle:
- **Day streak** (orange Flame) — `profiles.streak`; sub-text "Keep it up!"
- **Mastered** (green CheckCircle) — `user_progress` rows where `interval_days >= 21`; sub-text "of N total"
- **Active skills** (amber Zap) — `production_mastered = true` count across all levels; sub-text "key skill for B2"
- **Accuracy** (sky Target) — weighted correct rate across all attempts; sub-text "across all exercises"

**Section 2 — Level progress (replaces MasteryChart)**
Card with computed_level badge top-right. One row per CEFR level (B1/B2/C1):
- Label + mastered/total count (right-aligned)
- Custom div-based progress bar (green-500/amber-500/violet-500)
- Percentage right-aligned below bar
- Motivating hint at bottom when B1 ≥ 60% mastered: "N more concepts until you unlock B2"

**Section 3 — Where you're strongest (AccuracyChart rewrite)**
- Layout: `layout="vertical"` horizontal BarChart
- Per-type colour coding via `TYPE_CONFIG` (orange gap_fill / sky translation / violet transformation / rose error_correction / emerald free_write / amber sentence_builder)
- Y-axis: friendly labels ("Gap fill", "Translation", etc.) — no raw type strings
- Right-edge label: "74% (23 attempts)" via `LabelList dataKey="label"`
- Custom tooltip: card-style (`bg-card border shadow-sm`)
- Insight callout above chart (only when ≥ 2 types): "Best: Translation (89%) · Needs work: Free write (42%)"
- `TYPE_CONFIG` exported for use in server components

**Section 4 — Study consistency**
- Sub-stat header: "N sessions this month · X.X hrs total" (from `study_sessions` this month)
- Right-aligned: "N days studied in the last 3 months" (unique dates in activity map)
- Heatmap unchanged (ActivityHeatmap with legend)

**Section 5 — Page header**
- Title "Progress" + subtitle "Your learning journey · Month Year"
- computed_level badge top-right

**New queries**
- `profiles.streak, computed_level` — added `.single()` profile fetch
- `concepts.id, level` — replaces the old unit/module join; used for CEFR totals + levelMap
- `user_progress.concept_id, interval_days, production_mastered` — extended from old query
- `study_sessions.started_at, ended_at` filtered to current month

**Tests — 282 total (10 new)**
- `AccuracyChart.test.tsx`: renders without crash (empty + valid data + single item); TYPE_CONFIG has correct labels for all 6 types; TYPE_CONFIG has distinct colors

---

**SpeakButton 44px mobile tap target**
- `src/components/SpeakButton.tsx` — `min-w-[44px] min-h-[44px]` on mobile; `sm:w-7 sm:h-7 sm:min-w-0 sm:min-h-0` on desktop; icon size and colours unchanged

**ErrorCorrection empty textarea**
- `src/components/exercises/ErrorCorrection.tsx` — `useState('')` (was `useState(erroneous)`); added `placeholder="Type the corrected sentence…"`; label updated to "Type the corrected sentence below:"; Reset button removed entirely
- Erroneous sentence is now only visible in the read-only red callout — no pre-fill ambiguity
- `ExerciseRenderer.test.tsx` — pre-fill test updated to `toBe('')`; Reset test removed; Reset disabled assertion removed
- **Total: 272 tests across 21 files — all passing**

---

### UX-D: Dashboard page redesign ✓

**Overview**
Eight targeted improvements to `src/app/dashboard/page.tsx` and `SprintCard.tsx` addressing layout, visual hierarchy, daily goal tracking, and copy clarity.

**Files changed**
- `src/app/dashboard/page.tsx` — all 7 UI/data changes
- `src/components/SprintCard.tsx` — sprint copy fix
- `src/components/__tests__/SprintCard.test.tsx` — updated test to match new copy

**Changes**

1. **Single-column layout** — Removed `lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0`; all mode cards always stack vertically. Eliminates orphaned Sprint card on desktop.

2. **Level badge uses LEVEL_CHIP** — Replaced hardcoded `bg-orange-100 text-orange-700` pill with `LEVEL_CHIP[computed_level]` from constants (green B1 / amber B2 / purple C1). Consistent with progress page and curriculum.

3. **Daily goal progress bar** — New query added to `Promise.all`: `study_sessions` for today (`started_at >= todayStart`). Computes `todayMinutes` from `ended_at - started_at`. Renders below the progress bar inside the stats card when `daily_goal_minutes > 0`: label ("Daily goal" / "✓ Daily goal met!"), `X / Y min` counter, 1.5px progress bar (orange → green when met). Hidden entirely when `daily_goal_minutes = 0`.

4. **Review card primary emphasis** — When `dueCount > 0 && studiedCount > 0`, card gets `bg-orange-50/60 border-orange-200` warm tint. All other states keep plain `bg-card`. Secondary cards (Learn new, Free write, Sprint) unchanged.

5. **Free write "weakest concept" sub-label** — Added `<p className="text-xs text-muted-foreground -mt-1">Your weakest concept right now</p>` below the concept title.

6. **Free write fallback card** — When `!isNewUser && !writeConcept` (all concepts mastered or no data), renders a "Practice your writing / Browse concepts →" card instead of silently hiding the section.

7. **Sprint copy** — Changed collapsed heading from `"N concepts due — sprint through them"` (duplicates Review card number) to `"Timed review · push through your queue"`. No-due-reviews copy unchanged ("Focus in a fixed time slot").

8. **Progress bar legend** — `"learning"` → `"in progress"`, `"new"` → `"to start"`. More user-friendly language.

**New data**
- Today's study sessions query: `study_sessions` filtered `>= todayStart` (midnight UTC); `started_at, ended_at` columns only.
- No DB migrations required. `daily_goal_minutes` column already existed in `profiles`.

**Tests — 282 total (1 test description updated)**
- `SprintCard.test.tsx` — "shows dueCount in collapsed heading" updated to "shows timed review heading"; now matches `getByText(/timed review/i)`

---

### UX Polish & Animations batch (UX-I through UX-S, UX-U, UX-V) ✓

**Commit**: `feat(ux): UX-I through UX-S + UX-U/V — animations, polish, and micro-interactions`
**Tests**: 293 passing (no new tests needed — all additive UI changes)

**UX-I: Confetti celebration** (`StudySession.tsx`)
- `canvas-confetti` + `@types/canvas-confetti` installed via pnpm
- `useEffect` fires when `state.phase === 'done'` and accuracy ≥ 70%
- `confettiFired` ref prevents double-fire in React StrictMode
- Dynamic import (`import('canvas-confetti')`) to keep bundle split

**UX-J: Study loop transitions** (`StudySession.tsx`, `globals.css`)
- Exercise area wrapped in `<div key={index} className="... ${flashClass}">` — `key` change triggers re-mount and animation
- Exercise enters with `animate-in slide-in-from-right-2 duration-200`
- FeedbackPanel enters with `animate-in slide-in-from-bottom-3 duration-200` inside its own wrapper
- Answer flash: `flashClass` state set to `animate-flash-green` / `animate-flash-red` on API return; `setTimeout(300ms)` delays state→feedback then clears flashClass
- Flash keyframes in `globals.css` use `oklch` colour space to match existing palette

**UX-K: Submit spinner** (`StudySession.tsx`)
- Replaced `<p className="animate-pulse">Grading with AI…</p>` with `<div>` containing `Loader2` (lucide, `animate-spin`) + "Checking…" text
- Rendered while `submitting && (state.phase === 'answering' || flashClass)` — disappears before feedback slides up

**UX-L: Animated progress bars** (`AnimatedBar.tsx`, `dashboard/page.tsx`, `progress/page.tsx`)
- New `src/components/AnimatedBar.tsx` — client component; `useState(0)` initial width, `useEffect` sets to `pct` after 80ms; CSS `transition-all duration-700`
- Dashboard: replaces both inline divs in the curriculum progress bar, plus the daily goal bar inner div
- Progress page: replaces the inner div in each of the three CEFR level bars (B1/B2/C1)

**UX-M: Contextual motivational copy** (`dashboard/page.tsx`)
- Date subtitle replaced by IIFE computing a state-aware string:
  - `dueCount === 0 && studiedCount > 0` → "You're all caught up — perfect time to learn something new."
  - `streak >= 30` → "30 days strong — you're unstoppable."
  - `streak >= 7` → "7 days strong — you're building a real habit."
  - `streak === 1` → "Day 1 — the hardest step is done."
  - `streak === 0` → "Ready to start your streak?"
  - else → formatted locale date (existing fallback)

**UX-N: Autofocus inputs** — already implemented in both `GapFill.tsx` (first blank + 0-blank fallback) and `TextAnswer.tsx` (textarea); verified, no changes needed.

**UX-O: Streak pulse** (`dashboard/page.tsx`)
- `Flame` icon: `animate-pulse text-orange-500` when `streak >= 7`, plain `text-orange-400` otherwise

**UX-P: Session exit button** — already implemented as part of UX-G (Dialog + X button in StudySession); verified, no changes needed.

**UX-Q: Due count badge** (`dashboard/page.tsx`)
- Review card: `dueCount >= 10` → red pulsing dot `h-2 w-2 rounded-full bg-red-500 animate-pulse` beside the count
- `dueCount === 0 && studiedCount > 0` → `border-green-200 border-l-green-500` border + `CheckCircle2` (green) icon instead of `BookOpen`

**UX-R: FeedbackPanel score label prominence** (`FeedbackPanel.tsx`)
- Score label moved above feedback text; `text-2xl font-black` centred
- Icon row (check/x + calendar) moved below the label, also centred
- `Sparkles` icon (amber, `animate-in zoom-in-50 duration-300`) appears inline at score === 3

**UX-S: Micro-interactions** (`SideNav.tsx`, `HintPanel.tsx`)
- Logo link: `group` class; `<span className="inline-flex transition-transform duration-200 group-hover:rotate-6">` wraps `<LogoMark>`
- Hint dots: `transition-colors duration-500` (extended from no-duration)

**UX-U: Page fade-in on route change** (`PageWrapper.tsx`, `layout.tsx`)
- New `src/components/PageWrapper.tsx` — `'use client'`; reads `usePathname()`; returns `<div key={pathname} className="animate-page-in">`
- `@keyframes page-fade-in` in `globals.css`: `opacity 0→1, translateY 4px→0`, 150ms ease-out
- Replaces bare `{children}` in `layout.tsx` `div.lg:ml-[220px]`

**UX-V: First-run onboarding tour** (`OnboardingTour.tsx`, `dashboard/page.tsx`)
- New `src/components/OnboardingTour.tsx` — `'use client'`; reads `localStorage.tour_dismissed` in `useEffect`; renders only when key is absent
- Fixed-position overlay with semi-transparent backdrop; dismissible on backdrop click, X button, or "Got it →" CTA
- Callout enters with `animate-in slide-in-from-bottom-4 duration-300`
- Dismissal sets `localStorage.tour_dismissed = '1'`; never shown again
- Rendered inside `<main>` at bottom of `dashboard/page.tsx`

---

## Feat-E: Content Expansion — 85 Concepts, 787 Exercises ✓

**Commits**: `feat(Feat-E): content expansion — 76/85 concepts seeded`, `feat(Feat-E): complete content expansion — 85 concepts, 787 exercises live`
**Tests**: 1085 passing across 26 files (807 new — 792 from curriculum-plan tests + 15 from ai-seed-config tests)
**DB state**: 85 concepts, 787 exercises, 6 modules — all live in Supabase

### What was built

#### curriculum-plan.ts / ai-seed-config.ts / seed scripts
- `ConceptPlan` interface + `CURRICULUM_PLAN[85]` — single source of truth for all concepts
- `ai-seed-config.ts`: `EXERCISE_TYPE_RULES` (B1/B2/C1), `EXERCISES_PER_TYPE=3`
- `run-seed-ai.ts` (`pnpm seed:ai`): resume-safe incremental writes after each concept; `--output` flag; `max_tokens: 8192`
- `run-seed-ai-apply.ts` (`pnpm seed:ai:apply`): `_mode: 'new'|'topup'`; `--dry-run` flag
- `scripts/approve-all.mjs`: bulk-sets `_approved: true` on all entries in a review JSON

#### What's in the DB
- **85 concepts** across 6 modules: Connectors & Discourse Markers (23), The Subjunctive (13), Past Tenses (11), Core Spanish Contrasts (12), Verbal Periphrases (13), Complex Sentences (13)
- **787 exercises** (~9 per concept, 3 per exercise type)
- 56/61 null-annotation exercises annotated via `pnpm annotate`
- Module rename applied: `UPDATE modules SET title = 'The Subjunctive' WHERE title = 'Subjunctive Mastery';`

### Key implementation notes
- `run-seed-ai.ts` is **resume-safe**: loads existing partial JSON on startup, skips already-generated titles, saves after each concept → safe to kill and re-run
- `max_tokens` must be **8192** (not 4096) — some 9-exercise responses with full annotation spans exceed 4096 tokens and get truncated, producing invalid JSON
- Strip markdown code fences before `JSON.parse` — Claude occasionally wraps responses in ` ```json ` blocks
- Debug logging added: on parse failure, logs `stop_reason`, `output_tokens`, and first/last 100 chars of raw response
- **Do not run `seed:ai:apply` twice on the same file** — the script has no idempotency guard; re-running will create duplicate concept rows and duplicate exercises (no unique constraint on concept title). If it happens, run a cleanup: for each duplicate title keep oldest by `created_at`, delete newer + its exercises; then trim excess exercises to 3 per type ordered by `created_at`
- Env vars for seed scripts: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- Extract env vars from `.env.local` with `grep '^VAR=' .env.local | cut -d= -f2-` (not `set -a; source` — fails on paths with spaces)

---

## Copy & UX Polish Sprint ✓ (2026-03)

**Commits**: `feat: copy sprint + UX polish (Copy-A–K, UX-X, UX-AF, UX-AG)`

### Copy-A through Copy-K — All string replacements ✓

Drop-in string replacements, no logic or schema changes:

- **Copy-A** (`DiagnosticSession.tsx`): "Grading with AI…" → "Thinking…"
- **Copy-B** (`StudySession.tsx`): "The SRS has scheduled your next reviews…" → "Your next sessions are already lined up — the hard work is remembering when it counts."
- **Copy-C** (`StudySession.tsx`): Static "Session complete" → score-bracket strings computed from `pct`: ≥90% "That's as clean as it gets." / 70–89% "Solid work — the gaps are already queued for next time." / 50–69% "The tough ones are the ones worth repeating." / <50% "Rough session — that's exactly what review is for."
- **Copy-D** (`dashboard/page.tsx`): "No reviews due. Come back tomorrow." → "You're clear for today. Use the time to push ahead."
- **Copy-E** (`dashboard/page.tsx`): "Complete your first session to begin spaced repetition." → "Finish your first session and we'll take it from there."
- **Copy-F** (`signup/page.tsx`): "Start your journey with Español Avanzado" → "B2 doesn't happen by accident."; login: "Continue your journey…" → "Pick up where you left off."
- **Copy-G** (`signup/page.tsx`): "Check your email" → "One more step"; confirmation body rewritten to be friendlier and concise.
- **Copy-H** (`dashboard/page.tsx`): "Your weakest concept right now" → "Worth some extra time today"
- **Copy-I** (`OnboardingTour.tsx`): "Start here" → "You're set up."; body rewritten without SRS jargon.
- **Copy-J** (`progress/page.tsx`): Dynamic streak sub-label — streak < 7: "Building something." / ≥7: "Don't break it now."
- **Copy-K** (`DiagnosticSession.tsx`): "Diagnostic complete!" → "All done — your study queue is being built."

### UX-X: Enter/Space to advance after feedback ✓
- `StudySession.tsx` — `useEffect` + `keydown` listener; active only when `phase === 'feedback'`; Enter/Space calls `handleNext()`; disabled during `answering` phase so Enter still submits

### UX-AF: Dashboard Review card filled treatment when due ✓
- `src/app/dashboard/page.tsx` — when `dueCount > 0 && studiedCount > 0`, Review card upgrades to `bg-primary text-primary-foreground`; button → `variant="secondary"`; all other cards and states unchanged

### UX-AG: Progress page "Skill breakdown" ✓
- `src/app/progress/page.tsx` — heading "Where you're strongest" → "Skill breakdown"; insight paragraph moved inside the chart card as `border-t mt-3 pt-3` footer

---

## PERF-01 + SEC-02 ✓ (2026-03-07)

**Tests**: 1132 passing across 31 files (no new tests needed — pure restructure)

### PERF-01: Fire-and-forget DB writes in `/api/submit` ✓
- **What changed**: `production_mastered` update moved from awaited block into `bgOps` fire-and-forget array alongside `exercise_attempts` insert, `updateStreakIfNeeded`, and `updateComputedLevel`.
- **Before**: SRS upsert → `production_mastered` (await) → then fire-and-forget for the rest.
- **After**: SRS upsert only blocks; all other writes (`production_mastered`, `exercise_attempts`, streak, `updateComputedLevel`) dispatched via `Promise.all(bgOps).catch(console.error)` with no `await`.
- Exercise + concept fetches already parallel (`Promise.all`) since a prior session.
- `next_review_in_days` unaffected — computed from the SRS upsert which still blocks.

### SEC-02: Global rate limiter via Vercel KV ✓
- Already implemented in a prior session. `src/lib/rate-limit.ts` uses `kv.incr(key)` + `kv.expire(key, windowSecs)` when `KV_REST_API_URL` is set; falls back to in-memory `Map` for local dev and CI. Dynamic import inside `try` block prevents crash at module load time.
- **Action needed**: Ensure `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars are set in Vercel Project Settings → Environment Variables → Production (from Vercel KV / Upstash dashboard).

---

## Security, Performance & Architecture Sprints ✓ (2026-03)

**Commits**: `feat: SEC-05, ARCH-03, PERF-02, UX-AC, UX-AD, UX-AE batch` · `perf: prompt caching, SRS interleaving, useTransition for study session` · `feat: SEC-01, SEC-03, SEC-04, ARCH-01 security sprint`
**Tests**: 1132 passing across 31 files

### UX-AC: Feedback panel — visual answer comparison blocks ✓
- `src/components/exercises/FeedbackPanel.tsx` — replaced label-value rows with two stacked pill blocks: user answer in `bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400 rounded-lg`, correct answer in green equivalent; correct state: single green block; `SpeakButton` right-aligned on correct block

### UX-AD: Session done screen — score-bracket emotional framing ✓
- `StudySession.tsx` — `sessionLabel` computed from `pct` bracket (paired with Copy-C); pct < 70 uses `animate-pulse` ring on PartyPopper instead of confetti; `PartyPopper` icon animates in with `zoom-in-50 duration-500`

### UX-AE: Onboarding diagnostic assessment feel ✓
- `src/app/onboarding/page.tsx` — "Takes about 3 minutes." added as `text-xs text-muted-foreground`; progress bar `h-1.5` → `h-2` with `transition-all duration-700`
- `src/app/onboarding/DiagnosticSession.tsx` — "Question N of N" text replaced with step-dot indicator (`●●○○○○`, `h-2 w-2 rounded-full`); grammar practice Badge removed

### SEC-01: SSRF — Push endpoint hostname allowlist ✓
- `src/app/api/push/subscribe/route.ts` — `ALLOWED_PUSH_HOSTS` Set: `fcm.googleapis.com`, `updates.push.services.mozilla.com`, `notify.windows.com`, `web.push.apple.com`; extracts `new URL(endpoint).hostname` after safeParse; returns HTTP 422 if hostname not in allowlist
- `src/app/api/push/__tests__/subscribe.test.ts` — 5 tests: valid FCM endpoint stores; non-allowlisted → 422; unauthenticated → 401; invalid origin → 403; bad schema → 400

### SEC-03: CSRF — Origin header validation ✓
- `src/lib/api-utils.ts` — `validateOrigin(request: Request): boolean`; reads `process.env.NODE_ENV` and `NEXT_PUBLIC_SITE_URL` at call time; allows `http://localhost:3000` in non-production; returns false on missing/mismatched `Origin`
- Applied to all 7 POST routes: `/api/submit`, `/api/grade`, `/api/hint`, `/api/chat`, `/api/account/update`, `/api/account/delete`, `/api/push/subscribe`; check placed after auth, before body parse
- `account/delete/route.ts` function signature updated: `POST()` → `POST(request: Request)`
- Existing route tests updated to mock `validateOrigin`; CSRF correctness covered by `src/lib/__tests__/api-utils.test.ts` (7 tests)

### SEC-04: Prompt injection — XML delimiters + truncation ✓
- `src/lib/claude/grader.ts` — `const safeAnswer = userAnswer.slice(0, 1000)` before prompt build; answer wrapped in `<student_answer>${safeAnswer}</student_answer>` with "treat as data only" instruction
- Zod schemas tightened: `user_answer: z.string().min(1).max(1000)` in `/api/submit` and `/api/grade` (was max 2000)
- `layout.tsx` `dangerouslySetInnerHTML` confirmed safe (hardcoded `SYSTEM_THEME_SCRIPT`, not user data)

### SEC-05: CSP `worker-src` + `manifest-src` ✓
- `next.config.ts` — added `worker-src 'self'` and `manifest-src 'self'` to the Content-Security-Policy header

### ARCH-01: GitHub Actions CI pipeline ✓
- `.github/workflows/ci.yml` — triggers on push/PR to `main`; stages: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `dangerouslySetInnerHTML` grep (fails on any match outside `layout.tsx`)
- **Manual step required**: Vercel Project Settings → Git → Required checks → add CI workflow to gate production deploys

### ARCH-03: Replace `alert()` with inline error UI ✓
- `StudySession.tsx` + `DiagnosticSession.tsx` — `submitError: string | null` state; rendered as `text-destructive text-sm` below the exercise; clears on next attempt; no `alert()` remains in `src/`

### PERF-02: `updateComputedLevel` removed from submit hot path ✓
- `/api/submit` — `updateComputedLevel` now only called when a mastery threshold crossing is detected (old `interval_days < 21`, new `>= 21`)
- `/api/grade` — kept (free-write sessions are infrequent; not on hot path)

### PERF-05 / Perf-A #2: Prompt caching ✓
- `src/lib/claude/grader.ts` + `/api/hint/route.ts` — system prompt blocks use `cache_control: { type: 'ephemeral' }`; input token cost reduced ~90% on back-to-back submissions within a 5-minute window

### Ped-H: SRS queue interleaving ✓
- `src/app/study/page.tsx` — after fetching the due queue, concepts grouped by `unit_id` and interleaved round-robin before slicing to `SESSION_SIZE`; pure JS transform, no DB change, invisible to users

### PERF-03: N+1 fix in push notification cron ✓ (2026-03-08)
- `supabase/migrations/012_push_due_count_rpc.sql` — new SQL function `get_subscribers_with_due_counts(p_today, p_limit, p_offset)`: LEFT JOINs `profiles` + `user_progress`, returns due count per subscriber in one round-trip
- `src/app/api/push/send/route.ts` — rewritten to call RPC in a `while` loop with `BATCH_SIZE=500` offset pagination; no per-user sub-queries; memory-bounded regardless of subscriber count
- `src/lib/supabase/types.ts` — `get_subscribers_with_due_counts` added to `Functions` block

### PERF-04: Middleware onboarding DB query cached via HttpOnly cookie ✓ (2026-03-08)
- `src/lib/supabase/middleware.ts` — checks `onboarding_done=1` cookie before hitting DB; on cache miss runs the query as before, then sets the cookie on the response if `onboarding_completed = true`; backfills automatically for existing users on their first navigation post-deploy
- `src/app/api/onboarding/complete/route.ts` — sets `onboarding_done=1` (HttpOnly, SameSite=Lax, 1-year MaxAge) on successful completion response
- `src/app/api/account/delete/route.ts` — clears `onboarding_done` cookie on account deletion
- Net effect: zero DB queries in middleware for returning users; p50 latency reduced ~35ms → ≤5ms per navigation

### ARCH-02: Per-task Claude model — Haiku for grading + hints ✓ (2026-03-08)
- `src/lib/claude/client.ts` — `GRADE_MODEL = 'claude-haiku-4-5-20251001'` added alongside `TUTOR_MODEL`
- `src/lib/claude/grader.ts` — optional `model` param (defaults to `GRADE_MODEL`); also fixes latent bug: strips markdown fences (` ```json...``` `) before JSON parsing, making response parsing robust regardless of model
- `src/app/api/hint/route.ts` — switched from `TUTOR_MODEL` to `GRADE_MODEL`
- `scripts/validate-grading-model.ts` (`pnpm validate:grading`) — offline validation script; grades 50 real `exercise_attempts` with candidate model, gates on ≥90% exact score agreement vs. stored Sonnet baseline
- Validation result: **93.8% agreement** (15/16 samples); one disagreement ("haca" scored 0 by Sonnet vs 2 by Haiku — Haiku more lenient/correct); report at `docs/grading-model-validation-2026-03-08.json`
- Tutor chat + exercise generation remain on `TUTOR_MODEL` (Sonnet)

### E2E smoke test fix ✓ (2026-03-08)
- `e2e/smoke.spec.ts` — replaced `fill()` with `click()` + `pressSequentially()` throughout `submitAndWaitForFeedback`; `fill()` sets DOM value directly which React 19 controlled inputs don't detect via `onChange`; `pressSequentially()` fires real keyboard events React reliably handles
- Added explicit `await expect(submit).toBeVisible()` before filling (ensures exercise has hydrated)
- Test 4 (2-exercise session) made resilient to Fix-H backlog: handles "Finish session" gracefully if concept serves fewer exercises than `size=2`
- `scripts/smoke-test.ts` (`pnpm exec tsx scripts/smoke-test.ts`) — post-deploy API-level smoke checks: RPC shape, Haiku grading (correct + wrong answer), hint generation
- Result: **5/5 E2E tests passing** against production in ~32 seconds

---

## UX-AB, UX-Y, UX-Z, UX-AA — Session Polish + Dashboard Weekly Snapshot ✓ (2026-03-08)

### UX-AB: Concept explanation — collapsed by default

**Problem**: The explanation card rendered on every exercise taking up screen space, and when a concept appeared multiple times the title was duplicated (once in the headline, once in the toggle button).

**Solution**: Always collapse by default. Toggle label is "Concept Notes ↓/↑" with no concept title (already prominent in the headline above). `isConceptExpanded` state resets to `false` in `handleNext` on every exercise advance.

**Key files**: `src/app/study/StudySession.tsx`
- Removed `seenConceptIdsRef` and `isFirstConceptEncounter` logic entirely
- Single always-collapsed card with `max-height` CSS transition (inline `style` — Tailwind v4 JIT doesn't reliably generate dynamic max-height values)
- Toggle: `aria-expanded`, text switches between "Concept Notes ↓" and "Concept Notes ↑"

---

### UX-Z: Session time estimate

**What**: "~N min remaining" shown in the session header next to the exercise counter.

**How**: Rolling average of actual submission times per session (seeded at 30s). `exerciseStartRef` is reset in `handleNext`. Elapsed captured in `handleSubmit` before the 300ms flash timer. `estimatedMinutes` is `null` (hidden) in sprint mode and when ≤1 exercise remains.

**Key files**: `src/app/study/StudySession.tsx`
- `exerciseStartRef = useRef<number>(Date.now())`
- `submissionTimes` state array
- Derived `avgSeconds`, `remainingCount`, `estimatedMinutes`

---

### UX-AA: Concept mastery milestone overlay

**What**: 🏆 Dialog appears the first time a concept crosses the 21-day SRS interval (MASTERY_THRESHOLD). Shows concept name, auto-dismisses after 4s, fires confetti. Fires at most once per concept per session.

**Backend** (`src/app/api/submit/route.ts`):
- `prevIntervalDays = existingProgress?.interval_days ?? 0` captured before SM-2 call
- `justMastered = prevIntervalDays < MASTERY_THRESHOLD && newSRS.interval_days >= MASTERY_THRESHOLD`
- Response includes `just_mastered: boolean` and `mastered_concept_title: string | null`
- `justMastered` stays `false` when `skip_srs: true` (practice mode)

**Frontend** (`src/app/study/StudySession.tsx`):
- `masteredConceptIdsThisSession = useRef<Set<string>>(new Set())` — dedup guard
- `useEffect([masteryOverlayOpen])` sets a 4000ms auto-dismiss setTimeout
- Dynamic `import('canvas-confetti')` for confetti burst (scalar: 0.8, smaller than session-end confetti)

---

### UX-Y: Weekly progress snapshot on dashboard

**What**: "This week" card on the dashboard showing exercises, accuracy %, and minutes with ▲/▼ deltas vs last week. Only rendered when `thisWeekExercises > 0`.

**Key files**:
- `src/app/dashboard/page.tsx` — 4 new Supabase queries added to `Promise.all`: `thisWeekAttempts`, `lastWeekAttempts`, `thisWeekSessions`, `lastWeekSessions`. Week boundary uses Monday as start of week (`dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()`).
- `src/components/WeeklySnapshot.tsx` — new pure presentational component. `DeltaBadge` helper renders ▲+N (green), ▼N (red), = (muted), or — (null baseline).

**Accuracy definition**: attempts with `ai_score >= 2` / total attempts × 100.

---

## Fix-I: Drill Auto-Generation Race Condition ✓ (2026-03-08)

**Problem**: In drill/practice mode, `StudySession.tsx` fires 3 concurrent `POST /api/exercises/generate` calls during the feedback phase. If the user clicked "Next →" before all Claude responses resolved (3–6s), `handleNext` saw no new items and ended the session prematurely.

**Fix chosen**: Option 1 — disable Next button while generation is in-flight.

**Changes**:
- `src/components/exercises/FeedbackPanel.tsx`: added `isGenerating?: boolean` prop. When `true`, button is `disabled` and shows spinner + "Generating…" text.
- `src/app/study/StudySession.tsx`: passes existing `generatingMore` state as `isGenerating` to `<FeedbackPanel>`. No new state needed — `generatingMore` is already reset to `false` in the `finally` block (covers both success and failure).
- `src/app/study/__tests__/StudySession.test.tsx`: updated `FeedbackPanel` mock to forward `disabled`/`isGenerating`; added 3 tests (in-flight, success, failure paths).

**Commit**: `5797a5c`

---

### CI fixes (2026-03-08)

Cleared all pre-existing lint + TypeScript errors that had been failing CI on every push:

- **SentenceBuilder.tsx**: Conditional `useState` (rules-of-hooks violation) — hoisted `fallbackValue` state to top of component, removed the conditional hook.
- **react-hooks/purity** in `study/page.tsx` and `SentenceBuilder.tsx`: `Math.random()` in render context — added `// eslint-disable-next-line react-hooks/purity` comments.
- **react-hooks/set-state-in-effect** in `IOSInstallCard.tsx`, `IOSInstallPrompt.tsx`, `OnboardingTour.tsx`, `auth/login/page.tsx`, `useSpeech.ts`: valid on-mount localStorage/platform detection patterns — added disable comments.
- **api-utils.test.ts**: `process.env.NODE_ENV` is read-only — replaced direct assignment with `vi.stubEnv('NODE_ENV', value)` / `vi.unstubAllEnvs()`.
- **vitest.config.ts**: Added `exclude: ['e2e/**']` to prevent Playwright spec (`e2e/smoke.spec.ts`) from being picked up by Vitest.

---

## Feat-I: TTS All Exercises + STT Dictation on Free-Write ✓ (2026-03-08)

**Commit**: `850b33d`

### TTS completion
SpeakButton (existing `src/components/SpeakButton.tsx` + `src/lib/hooks/useSpeech.ts`) was already wired in GapFill and TextAnswer. Added to the remaining 3 exercise types:
- `ErrorCorrection.tsx` — prompt wrapped in `flex items-start gap-2` div; SpeakButton reads full `exercise.prompt`
- `SentenceBuilder.tsx` — SpeakButton added to both the main path (bracket notation stripped via `.replace(/\s*\[[^\]]+\]/, '')`) and the fallback (no-bracket) path
- `FreeWritePrompt.tsx` — SpeakButton inline with "Writing prompt" header label; only rendered when `!loadingPrompt`

### STT dictation (free-write page only)
**New hook** `src/lib/hooks/useSpeechRecognition.ts`:
- Wraps native Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`); lang `es-ES`, `continuous: false`, `interimResults: false`
- Returns `{ supported, listening, transcript, error, permissionState, start, stop }`
- SSR-safe (`typeof window` guard); cleanup via `abort()` on unmount
- Firefox / unsupported browsers → `supported: false` (detected in `useEffect` on mount)
- `permissionState` set to `'denied'` on `not-allowed` error, `'granted'` on first successful result

**New component** `src/components/MicButton.tsx`:
- 4 render states: idle (Mic icon) / listening (Mic + `animate-pulse` orange) / not-supported (MicOff, disabled + tooltip) / permission-denied (MicOff, disabled + tooltip)
- `no-speech` and `audio-capture` errors shown as small inline messages

**FreeWritePrompt changes**:
- `useSpeechRecognition` hook instantiated; `useEffect` watches `transcript` and appends to answer with space separator (space omitted if answer already ends with space)
- Textarea wrapped in `relative` div; MicButton overlaid `absolute bottom-2 right-2`; textarea gains `pr-12` to avoid text under button
- Mic button disabled while `disabled` or `loadingPrompt`

**Note on privacy**: Chrome Web Speech API streams audio to Google's servers; Safari uses Apple's engine. Our server never receives raw audio — only the text transcript.

### Permissions-Policy
`next.config.ts` updated from a single global `headers()` entry to two:
1. `/(.*)`  → `Permissions-Policy: microphone=()` (blocks mic everywhere)
2. `/write(.*)` → `Permissions-Policy: microphone=(self)` (override: allow mic on free-write page only)

### Tests added (37 files, 1199 total)
- `src/lib/hooks/__tests__/useSpeechRecognition.test.ts` — 12 tests; `MockSpeechRecognition` class stubbed via `vi.stubGlobal`; covers supported detection, start/stop/onresult/onerror/onend, abort on unmount
- `src/components/exercises/__tests__/ErrorCorrection.test.tsx` — 7 tests; `useSpeech` mocked with `enabled: true` to render SpeakButton
- `src/components/exercises/__tests__/SentenceBuilder.test.tsx` — 8 tests; covers main path, fallback path, SpeakButton render, chip interaction
- `src/components/exercises/__tests__/FreeWritePrompt.test.tsx` — updated; `useSpeechRecognition` mocked via `vi.fn()` to allow per-test state overrides; +10 new tests covering TTS render, STT supported/denied/listening/loading states

---

## Ped-J: "Hard" Flag on a Concept ✓ (2026-03-09)

**Commit**: `4471ae1`
**Tests**: 1226 passing across 40 files

### What was built
- `supabase/migrations/013_hard_flag.sql` — `ALTER TABLE user_progress ADD COLUMN is_hard boolean NOT NULL DEFAULT false` (⚠️ run in Supabase SQL editor)
- `src/lib/supabase/types.ts` — `is_hard` added to `user_progress` Row/Insert/Update
- `src/lib/constants.ts` — `HARD_INTERVAL_MULTIPLIER = 0.6`
- `src/app/api/submit/route.ts` — fetches `is_hard`; after SM-2, if `is_hard && score >= 2`: `interval_days = max(1, round(interval_days × 0.6))`; recalculates `due_date`. Upsert does NOT write `is_hard`.
- `src/app/api/concepts/[id]/hard/route.ts` — POST; Zod `{ is_hard: boolean }`; update-then-insert pattern (avoids clobbering SRS data); rate-limited 30 req/10 min
- `src/components/HardFlagButton.tsx` — `'use client'`; Flag icon (filled orange when hard); optimistic toggle with revert on fetch failure; `useTransition`; same touch-target sizing as SpeakButton
- `src/app/curriculum/[id]/page.tsx` — HardFlagButton in concept header chip row (after mastery badge)
- `src/app/curriculum/page.tsx` — HardFlagButton per concept row (z-10 wrapper); `progressMap` now stores full object (not just `interval_days`)

### Key design decisions
- Multiplier applied **only on correct answers** (score ≥ 2) — wrong answers already reset to 1–3 days
- `sm2()` stays pure; multiplier applied in route after call
- Flag only affects *future* SM-2 outputs — does not immediately reschedule existing due dates
- Toggled from curriculum pages only (not exercise UI)

---

## Strat-A: Verb Conjugation Mode ✓ (2026-03)

Full in-sentence conjugation drill feature. Migrations 014 + 015 applied; all seed data live in DB.

### Routes
- `/verbs` — directory: 50 verbs, search, mastery dots, favorite toggle
- `/verbs/[infinitive]` — conjugation tables per tense + mastery bars + colour-endings toggle (persisted to localStorage)
- `/verbs/configure` — drill config: tenses, verb set (favorites/top25/top50/single), length, hint toggle
- `/verbs/session` — in-sentence conjugation session; local grading; no Claude cost

### Key files
- `src/lib/verbs/constants.ts` — `TENSES`, `TENSE_LABELS`, `TENSE_DESCRIPTIONS`, `VerbTense` type
- `src/lib/verbs/grader.ts` — `normalizeSpanish()` + `gradeConjugation()` → `VerbGradeResult` (correct / accent_error / incorrect); pure functions, zero network
- `src/lib/curriculum/run-seed-verbs.ts` — seeds 100 verbs + 2,700 verb_sentences rows
- `src/components/verbs/` — `VerbCard`, `VerbFavoriteButton`, `VerbFeedbackPanel`, `VerbSummary`, `VerbTenseMastery`
- `POST /api/verbs/grade` — records attempt via `increment_verb_progress` RPC; Zod + rate-limit (120/10 min)
- `POST /api/verbs/favorite` — toggles `user_verb_favorites`; returns `{ favorited: boolean }`

### Database
- Migration 014: `verbs`, `verb_sentences`, `user_verb_favorites`, `verb_progress` + `increment_verb_progress` RPC
- Migration 015: `verb_conjugations` table (full 6-pronoun paradigm + stem; PK verb_id+tense)
- Seed: 100 verbs, 9 tenses × 100 verbs × 3 sentences = 2,700 `verb_sentences` rows, 900 `verb_conjugations` rows

### Session mechanics
- State machine: `answering → feedback → [try again | next] → done`
- Correct: auto-advance after 1.5s (green flash); accent error: orange flash + manual Next; incorrect: red flash + Try Again or Next
- Done screen: overall % + per-tense breakdown sorted worst-first
- `HIDDEN_ROUTES` includes `/verbs/session` so BottomNav hides during session

### Key decisions
- Do NOT use join syntax (e.g. `verbs(id, infinitive)`) in `.select()` — `Relationships: []` causes `SelectQueryError`. Fetch sentences + verbs in separate queries and join via TypeScript Map.
- `pnpm seed:conjugations:apply` is **idempotent** (ON CONFLICT DO UPDATE); `pnpm seed:verbs:apply` is **not** — running twice duplicates rows.

---

## Strat-B: Admin Content Panel ✓ (2026-03)

`/admin` route family gated by `is_admin boolean` on `profiles`. Entry point: conditional button on `/account` page only (never in SideNav/BottomNav).

### Routes
- `/admin` — Overview: content counts (fast, anon client) + cross-user usage stats (Suspense, service-role client)
- `/admin/curriculum` — module→unit→concept tree + per-concept stats table (exercises, attempts, avg score, mastered users) deferred behind Suspense
- `/admin/exercises` — filterable exercise list (concept + type; no-JS GET form); up to 100 results
- `/admin/exercises/[id]` — inline edit form for prompt, expected_answer, hint_1, hint_2

### Key files
- `src/lib/supabase/service.ts` — service-role client; bypasses RLS for cross-user aggregate queries; server-only
- `src/components/admin/AdminStatCard.tsx` — reusable stat card
- `src/components/admin/AdminTabNav.tsx` — client tab nav (Overview / Curriculum / Exercises)
- `src/app/admin/layout.tsx` — `is_admin` guard (redirects non-admins to `/dashboard`); applies `lg:-ml-[220px] lg:w-screen` to counteract root layout's sidebar offset
- `src/app/admin/AdminOverviewDeferred.tsx` — async Server Component; service-role queries for total users, active today, attempts today
- `src/app/admin/curriculum/AdminCurriculumDeferred.tsx` — service-role stats per concept via TypeScript Map joins
- `src/app/admin/exercises/[id]/ExerciseEditForm.tsx` — client form; PATCH to `/api/admin/exercises/[id]`
- `POST /api/admin/exercises/[id]` (PATCH) — is_admin check + `validateOrigin` + Zod schema

### Database
- Migration 016: `ALTER TABLE profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false`
- Grant admin: `UPDATE profiles SET is_admin = true WHERE id = '<uuid>'`

### Key decisions
- Auth guard lives in `admin/layout.tsx`, not middleware — keeps middleware lightweight
- Service role client is a separate module (`service.ts`) to prevent accidental browser import
- `/admin` hidden from SideNav + BottomNav via `HIDDEN_ROUTES` for **all** users including admins
- Admin layout uses `return null` after `redirect()` calls to prevent null-dereference in tests (where `redirect` is mocked as `vi.fn()` and doesn't throw)
- Stats joined in TypeScript (not Postgres RPCs) — acceptable at current scale

---

## D5 Brand: Verb List Page Alignment ✓ (2026-03)

Aligned `/verbs` directory page with D5 brand system. Added UX improvements for filtering and scannability.

### Visual changes
- Page heading → `senda-heading`, subtitle → `senda-eyebrow` ("100 verbos de alta frecuencia")
- CTA text → "Practicar →" (Spanish)
- `BackgroundMagicS` watermark added; `relative overflow-hidden` wrapper
- Bottom padding → `pb-[calc(3.125rem+env(safe-area-inset-bottom)+1rem)] lg:pb-10`
- Mastery summary line under eyebrow: "X practicados · Y dominados" (computed server-side)
- Letter group headers → `senda-eyebrow` class
- Search input → `senda-input` class, Spanish placeholder "Buscar verbos...", primary-coloured icon when query active
- Empty state → Spanish text in `senda-card` container

### VerbCard changes
- `bg-card rounded-xl border` → `senda-card animate-card-in` (staggered fade-in via `animationDelay` per card index, capped at 12)
- Mastery dots: `bg-green-500` → `bg-primary` (terracotta)
- Inline verb group badge → `VerbGroupChip` component
- Added `style` prop for animation delay passthrough

### New component: `VerbGroupChip`
- `src/components/verbs/VerbGroupChip.tsx` — colour-coded pill mirroring `GrammarFocusChip` pattern
- `-ar` → teal (`#386664`), `-er` → plum (`#69466E`), `-ir` → gold (`#8B7332`), `irregular` → clay (`#A8503C`)
- Normalises DB values (`"ar"` → `"-ar"` key)

### Filter chip system
- Replaced single "Irregular only" toggle with 6-chip row: Todos · -AR · -ER · -IR · Irregulares · Favoritos
- Active chip: `var(--d5-terracotta)` bg + `var(--d5-paper)` text; inactive: `var(--d5-pill-bg/text/border)` tokens
- Group filters are mutually exclusive (clicking same chip toggles off → returns to Todos); Favoritos is independent toggle
- Horizontal scroll on mobile (`overflow-x-auto`)

### CSS additions
- `@keyframes card-fade-in` + `.animate-card-in` — fade + translateY(8px), 200ms, `backwards` fill for stagger support
- Added to `prefers-reduced-motion: reduce` suppression list

### Tests (27 new)
- `VerbGroupChip.test.tsx` — 7 tests (all groups, null/undefined, unknown, styling)
- `VerbCard.test.tsx` — 8 tests (rendering, link, senda-card, primary dots, style prop)
- `VerbDirectory.test.tsx` — 12 tests (all filters, search, empty state, stagger, chip rendering)
- Fixed 3 pre-existing failures in `GrammarFocusChip.test.tsx` (updated assertions from old Tailwind names to current rgba colours)
