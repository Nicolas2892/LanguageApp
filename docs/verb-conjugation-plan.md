# Strat-A: Verb Conjugation Mode — Full Implementation Plan

> Reference document for future sessions. Decisions are final unless noted as open.

---

## Context

Advanced Spanish learners (B1→B2→C1) need high-frequency verb conjugation fluency that existing SRS exercises don't specifically target. This is a **separate, lower-prominence training tool** — not part of the main SRS study queue. It mirrors Ella Verbs' highest-rated feature: typing the conjugated form of a verb inside a real Spanish sentence (gap-fill), forcing tense/mood disambiguation from context.

**Scope**: in-sentence gap-fill only (no flashcards, no multiple choice, no listening/speaking). Local string-match grading — zero Claude API cost per attempt.

**Feature set**:
1. Verb directory with full conjugation tables
2. Verb favorites / personal practice list
3. In-sentence conjugation session (gap-fill, typed answer)
4. Tense mastery tracking on the Progress page

---

## PM Requirements

### User Stories
- As a learner, I can browse a directory of high-frequency Spanish verbs and open any verb's full conjugation table.
- As a learner, I can favorite a verb to build a personal practice list.
- As a learner, I can start a conjugation session filtered to my favorited verbs, top 25, or top 50.
- As a learner, I type the conjugated form inside a real sentence, getting instant local feedback.
- As a learner, I see per-tense mastery (accuracy %) on the Progress page so I know where my gaps are.
- As a learner, I see tense mastery indicators directly on the verb detail page.

### Acceptance Criteria
- **Directory** (`/verbs`): grid of all 50 verbs, searchable, mastery dots per verb.
- **Detail page** (`/verbs/[infinitive]`): 7-tense conjugation tables (all 6 pronouns), per-tense mastery bars, favorite toggle, "Practice this verb" button.
- **Favorites**: `user_verb_favorites` table; heart icon on directory + detail page; "My Favorites" option in config.
- **Config** (`/verbs/configure`): tenses (7 available), verb set (My Favorites / Top 25 / Top 50), session length (10/20/30), infinitive hint toggle.
- **Session** (`/verbs/session`): sentence + blank + hint; 3 grading outcomes; auto-advance on correct (1.5s).
- **Done screen**: overall %, per-tense breakdown table.
- **Progress page**: new "Verb Conjugation" section — accuracy bar per tense (only tenses with ≥1 attempt).
- **Sentences**: minimum 3 per verb per tense (different pronouns across the 3).

---

## UX Flows

### Screen 1 — Verb Directory (`/verbs`)

Entry point from "Verbs" nav item. Layout: `max-w-3xl mx-auto`.

```
┌────────────────────────────────────────┐
│  Verb Conjugation                      │
│  [🔍 Search verbs...]   [Start Practice]│
├────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │  hablar  │ │  tener   │ │  ser     ││
│  │  to speak│ │  to have │ │  to be   ││
│  │  ● ● ○ ○ │ │  ● ○ ○ ○ │ │  ○ ○ ○ ○ ││
│  │  [♡]     │ │  [♥]     │ │  [♡]     ││
│  └──────────┘ └──────────┘ └──────────┘│
│  ...                                   │
└────────────────────────────────────────┘
```

- Verb cards: infinitive, English translation, mastery dots (filled = tense accuracy ≥ 70%), favorite icon.
- Search filters cards client-side by infinitive or English translation.
- "Start Practice" button → `/verbs/configure`.
- Click verb card → `/verbs/[infinitive]`.
- Favorite icon toggles immediately (optimistic update).

### Screen 2 — Verb Detail Page (`/verbs/[infinitive]`)

```
┌─────────────────────────────────────────────┐
│ ← Back     hablar — to speak        [♡ Save]│
│            Regular -ar verb                 │
├─────────────────────────────────────────────┤
│  [Practice this verb]                       │
├─────────────────────────────────────────────┤
│  PRESENT INDICATIVE          Mastery: 82% ████░│
│  ┌──────────┬──────────────────────────────┐│
│  │ yo       │ hablo                        ││
│  │ tú       │ hablas                       ││
│  │ él/ella  │ habla                        ││
│  │ nosotros │ hablamos                     ││
│  │ vosotros │ habláis                      ││
│  │ ellos    │ hablan                       ││
│  └──────────┴──────────────────────────────┘│
│                                             │
│  PRETERITE                   Mastery: 64% ██░░░│
│  [table...]                                 │
│                                             │
│  [... 5 more tense tables]                  │
└─────────────────────────────────────────────┘
```

- Mastery bar per tense = `correct_count / attempt_count` from `verb_progress`. Only shown if ≥ 1 attempt.
- "Practice this verb" → `/verbs/configure?verb=hablar`.
- Conjugation forms sourced from `verb_sentences.correct_form` grouped by tense + pronoun.

### Screen 3 — Config (`/verbs/configure`)

```
┌─────────────────────────────────┐
│  Verb Drills                    │
│  In-sentence conjugation        │
├─────────────────────────────────┤
│  TENSES                         │
│  Indicative:                    │
│  [✓Present] [Preterite] [Imp.]  │
│  [Future] [Conditional]         │
│  Subjunctive:                   │
│  [Pres. Subj.] [Imp. Subj.]     │
├─────────────────────────────────┤
│  VERBS                          │
│  ● My Favorites (12)            │  ← only shown if user has ≥1 favorite
│  ○ Top 25                       │
│  ○ Top 50                       │
│  ○ hablar  [if ?verb= in URL]   │
├─────────────────────────────────┤
│  LENGTH   ● 10  ○ 20  ○ 30      │
├─────────────────────────────────┤
│  ☑ Show infinitive hint         │
├─────────────────────────────────┤
│  [        Start Practice      ] │
└─────────────────────────────────┘
```

Navigates to: `/verbs/session?tenses=present_indicative,...&verbSet=favorites&length=10&hints=true`

### Screen 4 — Session (`/verbs/session`)

BottomNav hidden on this route (added to `HIDDEN_ROUTES`).

```
┌─────────────────────────────────┐
│  [✕]  ─────────────── Q 3/10   │
│                                 │
│  "Ayer yo _____ al mercado      │
│   con mi familia."              │
│                                 │
│  Hint: [ir]  · Preterite · yo   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ fui                      │   │
│  └──────────────────────────┘   │
│                                 │
│            [   Check →   ]      │
└─────────────────────────────────┘
```

**Feedback states:**
| Outcome | Flash | Message | Advance |
|---------|-------|---------|---------|
| Correct | Green (300ms) | "✓ Correct!" + correct form | Auto after 1.5s |
| Accent error | Orange (300ms) | "~ Almost — check your accents" + correct form | Manual Next |
| Incorrect | Red (300ms) | "✗ Incorrect" + correct form + tense rule | Try Again / Next |

### Screen 5 — Session Done

Overall % (large), correct/incorrect counts, per-tense breakdown table (worst first), [Practice Again] → config, [Browse Verbs] → `/verbs`.

### Progress Page Addition (`/progress`)

New section appended after existing charts:

```
Verb Conjugation Mastery
──────────────────────────────────────────
Present Indicative    ████████░░  82%  (143/174)
Preterite             ██████░░░░  61%  (89/146)
Imperfect             ████░░░░░░  43%  (31/72)
[tenses with 0 attempts not shown]
```

SQL query for this section:
```sql
SELECT tense, SUM(correct_count) AS correct, SUM(attempt_count) AS attempts
FROM verb_progress
WHERE user_id = $1 AND attempt_count > 0
GROUP BY tense ORDER BY tense
```

---

## Technical Architecture

### New DB Tables — `supabase/migrations/014_verb_conjugation.sql`

```sql
-- ─── verbs ─────────────────────────────────────────────────────────────────
CREATE TABLE verbs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infinitive     text NOT NULL UNIQUE,
  english        text NOT NULL,
  frequency_rank integer NOT NULL,
  verb_group     text NOT NULL,  -- 'ar' | 'er' | 'ir' | 'irregular'
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE verbs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verbs_public_read" ON verbs FOR SELECT USING (true);
CREATE INDEX idx_verbs_rank ON verbs (frequency_rank);

-- ─── verb_sentences ────────────────────────────────────────────────────────
-- Minimum 3 rows per (verb_id, tense) combination — different pronouns
CREATE TABLE verb_sentences (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verb_id      uuid NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
  tense        text NOT NULL,
  -- 'present_indicative' | 'preterite' | 'imperfect' |
  -- 'future' | 'conditional' | 'present_subjunctive' | 'imperfect_subjunctive'
  pronoun      text NOT NULL,   -- 'yo' | 'tu' | 'el' | 'nosotros' | 'vosotros' | 'ellos'
  sentence     text NOT NULL,   -- full sentence with '_____' as blank token
  correct_form text NOT NULL,
  tense_rule   text NOT NULL,   -- short rule shown on incorrect answer
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE verb_sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verb_sentences_public_read" ON verb_sentences FOR SELECT USING (true);
CREATE INDEX idx_verb_sentences_combo ON verb_sentences (verb_id, tense);

-- ─── user_verb_favorites ───────────────────────────────────────────────────
CREATE TABLE user_verb_favorites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verb_id    uuid NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, verb_id)
);
ALTER TABLE user_verb_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_owner" ON user_verb_favorites FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_favorites_user ON user_verb_favorites (user_id);

-- ─── verb_progress ─────────────────────────────────────────────────────────
CREATE TABLE verb_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verb_id         uuid NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
  tense           text NOT NULL,
  attempt_count   integer NOT NULL DEFAULT 0,
  correct_count   integer NOT NULL DEFAULT 0,
  last_practiced  timestamptz,
  UNIQUE (user_id, verb_id, tense)
);
ALTER TABLE verb_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verb_progress_owner" ON verb_progress FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_verb_progress_user ON verb_progress (user_id);

-- ─── Atomic upsert RPC ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_verb_progress(
  p_user_id uuid, p_verb_id uuid, p_tense text, p_correct boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO verb_progress (user_id, verb_id, tense, attempt_count, correct_count, last_practiced)
    VALUES (p_user_id, p_verb_id, p_tense,
            1, CASE WHEN p_correct THEN 1 ELSE 0 END, now())
  ON CONFLICT (user_id, verb_id, tense) DO UPDATE SET
    attempt_count  = verb_progress.attempt_count + 1,
    correct_count  = verb_progress.correct_count + CASE WHEN p_correct THEN 1 ELSE 0 END,
    last_practiced = now();
END;
$$;
```

### Supabase Types (`src/lib/supabase/types.ts`)

Add 4 new table blocks (each with `Relationships: []`) and convenience aliases:
```typescript
export type Verb = Database['public']['Tables']['verbs']['Row']
export type VerbSentence = Database['public']['Tables']['verb_sentences']['Row']
export type UserVerbFavorite = Database['public']['Tables']['user_verb_favorites']['Row']
export type VerbProgress = Database['public']['Tables']['verb_progress']['Row']
```

Add `increment_verb_progress` to `Database['public']['Functions']`.

### File Map

```
src/
  app/
    verbs/
      page.tsx                     ← Server: fetches all verbs + user favorites + verb_progress
      VerbDirectory.tsx            ← 'use client': search, grid, favorite toggle
      [infinitive]/
        page.tsx                   ← Server: fetch verb + sentences + user verb_progress
        VerbDetailClient.tsx       ← 'use client': conjugation tables + mastery bars + favorite
      configure/
        page.tsx                   ← Server shell
        VerbConfig.tsx             ← 'use client': config form + router.push to session
      session/
        page.tsx                   ← Server: reads searchParams, fetches shuffled sentences
        VerbSession.tsx            ← 'use client': state machine
  components/
    verbs/
      VerbCard.tsx                 ← directory card (infinitive, english, mastery dots, heart)
      VerbFavoriteButton.tsx       ← 'use client': optimistic heart toggle → POST /api/verbs/favorite
      VerbFeedbackPanel.tsx        ← feedback display (3 outcome states)
      VerbSummary.tsx              ← session done screen + tense breakdown
      VerbTenseMastery.tsx         ← section for /progress page (accuracy bars per tense)
  lib/
    verbs/
      grader.ts                    ← pure functions: normalizeSpanish + gradeConjugation
      constants.ts                 ← TENSES array, TENSE_LABELS map, VerbTense union type
  app/
    api/
      verbs/
        grade/
          route.ts                 ← POST: auth + rate-limit + Zod + increment_verb_progress RPC
        favorite/
          route.ts                 ← POST: toggle favorite (insert or delete)
  lib/
    curriculum/
      run-seed-verbs.ts            ← pnpm seed:verbs
      run-seed-verbs-apply.ts      ← pnpm seed:verbs:apply
```

### Grading Utility — `src/lib/verbs/grader.ts`

```typescript
export type VerbGradeOutcome = 'correct' | 'accent_error' | 'incorrect'

export interface VerbGradeResult {
  outcome: VerbGradeOutcome
  userAnswer: string
  correctForm: string
  tenseRule: string
}

/** Strips diacritics, lowercases, trims. Used for accent-tolerant comparison. */
export function normalizeSpanish(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Grade a conjugation attempt:
 * - exact match (trim + lowercase)    → 'correct'
 * - match after accent stripping      → 'accent_error'
 * - no match                          → 'incorrect'
 */
export function gradeConjugation(
  userAnswer: string,
  correctForm: string,
  tenseRule: string,
): VerbGradeResult
```

### API Routes

#### `POST /api/verbs/grade`

Zod v3 body:
```typescript
z.object({
  verb_id:    z.string().uuid(),
  tense:      z.enum(['present_indicative','preterite','imperfect',
                      'future','conditional',
                      'present_subjunctive','imperfect_subjunctive']),
  is_correct: z.boolean(),
})
```

Flow: `auth check` → `validateOrigin` (reuse from `src/lib/api-utils.ts`) → `checkRateLimit(userId, 'verbs_grade', { maxRequests: 120, windowMs: 600_000 })` → Zod validate → call `increment_verb_progress` RPC → return `{ ok: true }`.

#### `POST /api/verbs/favorite`

Zod v3 body:
```typescript
z.object({ verb_id: z.string().uuid() })
```

Flow: `auth check` → `validateOrigin` → `checkRateLimit(userId, 'verbs_favorite', { maxRequests: 30, windowMs: 600_000 })` → Zod → SELECT existing row → if exists: DELETE; if not: INSERT → return `{ favorited: boolean }`.

Pattern reference: `src/app/api/concepts/[id]/hard/route.ts`.

### VerbSession State Machine

```typescript
type VerbSessionState =
  | { phase: 'answering' }
  | { phase: 'feedback'; result: VerbGradeResult; autoAdvance: boolean }
  | { phase: 'done'; correct: number; total: number; tenseStats: TenseStat[] }

interface TenseStat {
  tense: string
  tenseLabel: string
  correct: number
  attempts: number
}
```

**Transitions:**
- `answering → feedback`: call `gradeConjugation()` locally. If `!attemptRecordedRef.current.has(index)`: fire `POST /api/verbs/grade` (fire-and-forget), mark index in ref Set, update local `scores` map. Apply 300ms flash class, then set feedback state with `autoAdvance = (outcome === 'correct')`.
- `feedback (correct, autoAdvance)`: `useEffect` → `setTimeout(advance, 1500)`.
- `feedback (accent_error / incorrect)`: manual Next button.
- `feedback (incorrect only)`: Try Again → reset to `answering` without advancing index. No re-POST.
- `advance`: if `index + 1 >= items.length` → compute tenseStats → `done`; else increment index → `answering`.

**Key state fields:**
```typescript
const [index, setIndex] = useState(0)
const [state, setState] = useState<VerbSessionState>({ phase: 'answering' })
const [flashClass, setFlashClass] = useState<string | null>(null)
const [scores, setScores] = useState<Record<string, { correct: number; attempts: number }>>({})
const [showExitDialog, setShowExitDialog] = useState(false)
const attemptRecordedRef = useRef<Set<number>>(new Set())
```

### VerbTenseMastery Component (`src/components/verbs/VerbTenseMastery.tsx`)

Receives aggregated stats as props (computed server-side in `/progress/page.tsx`):

```typescript
interface TenseSummary {
  tense: string
  tenseLabel: string
  correct: number
  attempts: number
  pct: number  // correct / attempts * 100
}
interface Props { summaries: TenseSummary[] }
```

Renders using `AnimatedBar` component (`src/components/AnimatedBar.tsx` — already exists).

### Navigation Changes

**`src/components/SideNav.tsx`** — add after Curriculum:
```typescript
{ href: '/verbs', label: 'Verbs', icon: BookMarked }
// Active check: pathname.startsWith('/verbs')
```

**`src/components/BottomNav.tsx`** — same tab addition. Add `/verbs/session` to `HIDDEN_ROUTES`:
```typescript
const HIDDEN_ROUTES = ['/auth', '/onboarding', '/write', '/brand-preview', '/verbs/session']
```

Import `BookMarked` from `lucide-react` (already installed).

**6th tab note**: Currently 5 tabs → 6. At 320px minimum iPhone width (~53px/tab), workable. Monitor on device.

### CSS Addition (`src/app/globals.css`)

Add `animate-flash-orange` (amber.100 wash) mirroring the existing `animate-flash-green` / `animate-flash-red` pattern.

---

## Seed Scripts

### Data Size
- 50 high-frequency verbs × 7 tenses × 3 sentences = **1,050 minimum sentences**
- Each of the 3 sentences per verb+tense uses a different pronoun: yo, tú, él/ella
- For the conjugation table on detail pages: all 6 pronouns needed. Either:
  - **Option A**: Hard-coded static `CONJUGATIONS` map in `constants.ts` (2,100 forms) — used for display only.
  - **Option B**: Expand seed to 6 sentences per verb+tense (2,100 sentences) — single source of truth.
  - _Decision pending_ — either works; Option B is cleaner but doubles seed cost (~$0.05–0.10 for Haiku, trivial).

### `pnpm seed:verbs` (`src/lib/curriculum/run-seed-verbs.ts`)

1. Hard-coded `VERB_DATA` array: 50 entries `{ infinitive, english, frequency_rank, verb_group }`.
2. Insert into `verbs` table → capture UUIDs.
3. For each verb (50) × tense (7) = 350 combos:
   - Call Claude Haiku with structured prompt → 3 sentences (yo, tú, él).
   - 300ms delay between calls.
   - Write result incrementally to `docs/verb-sentences-YYYY-MM-DD.json`.
   - Resume-safe: skip combos already written.
4. ~350 Claude Haiku calls, ~$0.02–0.05 total.

**Prompt template** (per verb + tense):
```
Generate exactly 3 natural Spanish sentences using the verb "{infinitive}" in the {tense_label} tense.
Use 3 different subject pronouns: yo, tú, él/ella.
Each sentence must contain exactly one blank (written as "_____") where the conjugated verb goes.

Return a JSON array of 3 objects:
[
  {
    "pronoun": "yo",
    "sentence": "Ayer yo _____ al mercado con mi familia.",
    "correct_form": "fui",
    "tense_rule": "ir/ser are irregular in preterite: fui, fuiste, fue, fuimos, fuisteis, fueron"
  },
  { "pronoun": "tu", ... },
  { "pronoun": "el", ... }
]
Only return the JSON array. No other text.
```

Pattern reference: `src/lib/curriculum/run-seed-ai.ts` (env validation, Anthropic client, delay, incremental JSON write, resume-safe).

### `pnpm seed:verbs:apply` (`src/lib/curriculum/run-seed-verbs-apply.ts`)

Reads JSON, inserts `verb_sentences` rows. `--dry-run` flag. Pattern: `run-seed-ai-apply.ts`.

### `package.json` additions
```json
"seed:verbs":       "tsx src/lib/curriculum/run-seed-verbs.ts",
"seed:verbs:apply": "tsx src/lib/curriculum/run-seed-verbs-apply.ts"
```

---

## Implementation Phases

| # | Phase | Key Files |
|---|-------|-----------|
| 1 | **DB migration** — run `014_verb_conjugation.sql` in Supabase SQL editor | `supabase/migrations/014_verb_conjugation.sql` |
| 2 | **Supabase types** — 4 new tables + RPC + convenience aliases | `src/lib/supabase/types.ts` |
| 3 | **Grading core** — `grader.ts` + `constants.ts` + unit tests | `src/lib/verbs/grader.ts`, `constants.ts` |
| 4 | **API routes** — `/api/verbs/grade` + `/api/verbs/favorite` + unit tests | `src/app/api/verbs/grade/route.ts`, `favorite/route.ts` |
| 5 | **Seed scripts** — write, run `seed:verbs`, review JSON, run `seed:verbs:apply` | `src/lib/curriculum/run-seed-verbs*.ts`, `package.json` |
| 6 | **Verb directory** — `/verbs` page + `VerbDirectory` client + `VerbCard` + `VerbFavoriteButton` | `src/app/verbs/page.tsx`, `VerbDirectory.tsx`, `src/components/verbs/*` |
| 7 | **Verb detail page** — `/verbs/[infinitive]` + conjugation tables + mastery bars | `src/app/verbs/[infinitive]/page.tsx`, `VerbDetailClient.tsx` |
| 8 | **Config + session** — `VerbConfig` + `VerbSession` + `VerbFeedbackPanel` + `VerbSummary` | `src/app/verbs/configure/*`, `session/*`, `src/components/verbs/*` |
| 9 | **Progress page** — `VerbTenseMastery` component + add to `/progress` | `src/components/verbs/VerbTenseMastery.tsx`, `src/app/progress/page.tsx` |
| 10 | **CSS + Navigation** — `animate-flash-orange` + `SideNav` + `BottomNav` | `src/app/globals.css`, `src/components/SideNav.tsx`, `BottomNav.tsx` |
| 11 | **Tests** — `VerbSession`, `VerbFeedbackPanel`, `VerbFavoriteButton`, `VerbTenseMastery`, API routes | `src/**/__tests__/` |

---

## Key Reference Files During Implementation

| File | Purpose |
|------|---------|
| `src/app/study/StudySession.tsx` | VerbSession state machine pattern, flash timing, exit dialog, done screen |
| `src/app/api/submit/route.ts` | Auth, validateOrigin, rate-limit, Zod, Supabase pattern |
| `src/components/exercises/GapFill.tsx` | Input + submit UI pattern |
| `src/lib/curriculum/run-seed-ai.ts` | Seed script pattern (env validation, delay, incremental write, resume-safe) |
| `src/components/AnimatedBar.tsx` | Reuse for tense mastery bars |
| `src/components/SideNav.tsx` | Nav item structure + active state pattern |
| `src/app/progress/page.tsx` | Append `VerbTenseMastery` section here |
| `src/app/api/concepts/[id]/hard/route.ts` | Toggle API route pattern (for favorites) |
| `src/lib/constants.ts` | Pattern for new constants file |

---

## Verification Checklist

- [ ] DB: `SELECT COUNT(*) FROM verbs` → 50; `SELECT COUNT(*) FROM verb_sentences` → ≥ 1,050
- [ ] `pnpm test` → all 1255 existing + new tests green
- [ ] `pnpm exec tsc --noEmit` → zero errors
- [ ] `pnpm lint` → zero errors
- [ ] **Manual flow**:
  - [ ] Nav → Verbs → 50 verb cards visible; search filters client-side
  - [ ] Click verb → detail page shows 7 conjugation tables; mastery bars absent (no attempts yet)
  - [ ] Heart icon favorites verb; appears in My Favorites section of config
  - [ ] Config: select tenses + My Favorites + 10 questions + hints ON → Start
  - [ ] Session: sentence with `_____`, infinitive hint, pronoun + tense label
  - [ ] Correct answer → green flash → auto-advance 1.5s
  - [ ] Answer without accent (e.g. `llegue` for `llegué`) → orange flash → "Watch your accents"
  - [ ] Wrong answer → red flash → correct form + tense rule → Try Again / Next
  - [ ] Complete session → done screen with tense breakdown
  - [ ] Progress page → "Verb Conjugation Mastery" section with accuracy bars
  - [ ] Supabase: `verb_progress` rows updated; `user_verb_favorites` row present
- [ ] **Mobile**: 6-tab BottomNav renders on iPhone; `/verbs/session` hides BottomNav

---

## Open Decision

**Conjugation table data source for detail pages** — two options:

| | Option A | Option B |
|-|----------|----------|
| **Approach** | Hard-coded static `CONJUGATIONS` map (all 6 pronouns × 7 tenses × 50 verbs = 2,100 entries) as a TypeScript constant | Expand seed to 6 sentences per verb+tense (one per pronoun) = 2,100 sentences; detail page pulls from `verb_sentences` |
| **Single source of truth** | No (map + sentences separate) | Yes |
| **Seed cost** | Unchanged | ~$0.05–0.10 extra (trivial) |
| **Maintenance** | Static map must be manually maintained | All data in DB, expandable via admin |
| **Recommendation** | — | **Option B preferred** |
