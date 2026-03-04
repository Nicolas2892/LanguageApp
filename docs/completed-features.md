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

### Ped-A: Harder gap-fill exercises — multi-sentence multi-blank format ✓
- `src/lib/exercises/gapFill.ts` — pure utilities (BLANK_TOKEN=`___`, splitPromptOnBlanks, countBlanks, parseExpectedAnswers, encodeAnswers)
- `GapFill.tsx` — inline multi-blank rendering (≥2 `___` tokens); single-blank (1 token) and legacy fallback (0 tokens) preserved
- expected_answer stored as JSON array string `'["sin embargo","aunque"]'` for multi-blank; grader detects and scores per-blank
- Submission: pipe-delimited `"answer1 | answer2"` — no API schema change
- All 21 gap_fill exercises re-seeded in multi-blank paragraph format

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
