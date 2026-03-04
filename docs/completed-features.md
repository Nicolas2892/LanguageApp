# Completed Features Archive

This file contains implementation details for all completed work. Reference it when debugging, resuming, or extending a feature.

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
