# Design Implementation Log

This file tracks which sections of the Senda Master Spec (`docs/senda-master-specs.md`) have been implemented, where, and any deviations or decisions made during implementation.

---

## Dashboard — Senda Master Spec Compliance (2026-03-11)

**Files changed:** `src/app/dashboard/page.tsx`, `src/components/DashboardDeferredSection.tsx`, `src/components/ui/button.tsx`, `src/app/globals.css`, `src/components/__tests__/LevelChip.test.tsx`, `src/components/__tests__/DashboardDeferredSection.test.tsx`

### Fix 1: Heading text invisible in dark mode (Spec §10.1)

All Lora headings used inline `color: 'var(--d5-ink)'` which is always `#1A1108` — invisible on dark ink background. Replaced all inline Lora heading style blocks with `className="senda-heading"` + only a font-size class (`text-2xl`, `text-base`). The `.senda-heading` class (defined in `globals.css`) handles the dark swap via `.dark .senda-heading { color: var(--d5-paper) }`.

Also fixed inline `color: 'var(--d5-ink)'` on the due count stats line — replaced with `className="font-bold text-foreground"` which auto-adapts via Tailwind's dark mode.

**Affected locations:**
- `page.tsx` h1 greeting → `senda-heading text-2xl`
- `page.tsx` card titles (3 variants) → `senda-heading text-base`
- `DashboardDeferredSection.tsx` Escritura Libre titles (2 variants) → `senda-heading text-base`

### Fix 2: Quill SVG invisible in dark mode (Spec §5, §10.3)

Quill icon hardcoded `stroke="#1A1108"`. Replaced with `stroke="currentColor"` on both quill SVG instances. The parent card text colour already adapts via `--card-foreground`.

### Fix 3: Exploración Abierta card missing `.senda-card` (Spec §4)

The card used manual `rounded-[20px]` + inline box-shadow + padding but lacked the warm background tint and dark mode surface. Replaced with `className="senda-card space-y-3"`, removing redundant inline styles.

### Fix 4: Outline button border should be 1.5px (Spec §6)

Spec §6 requires secondary outline buttons have 1.5px border. Changed `border` → `border-[1.5px]` in the `outline` variant of `buttonVariants` in `src/components/ui/button.tsx`. This is a global change — all outline buttons across the app now use 1.5px.

### Fix 5: English copy in Escritura Libre card (Spec §3 — Title Case Spanish)

"Express your thoughts. No limits, just practice." → "Expresa tus ideas. Sin límites, solo práctica."

### Fix 6: `prefers-reduced-motion` support (Spec §8)

Added at end of `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-page-in,
  .animate-exercise-in,
  .animate-flash-green,
  .animate-flash-red,
  .animate-flash-orange,
  .animate-senda-pulse {
    animation: none !important;
  }
}
```

### Fix 7: Header line-height (Spec §3)

Resolved by Fix 1. `.senda-heading` sets `line-height: 1.2` — tighter than the previous inline `1.4`.

### Fix 8: Urgency dot pulse timing (Spec §8)

Replaced Tailwind `animate-pulse` (2s, infinite) with `animate-senda-pulse` (1.4s ease-in-out, already defined). The urgency dot is decorative, so 1.4s matches the D5 motion identity.

### Fix 9: Curriculum module tags (Spec §2 — Dark Cream for secondary tags)

- "Completado": `bg-[var(--d5-cream)]` light / `bg-[rgba(140,106,63,0.12)]` dark, text `var(--d5-warm)`
- "En Progreso": solid `var(--d5-terracotta)` bg, `var(--d5-paper)` text (unchanged)
- "Próximamente": `bg-[rgba(232,230,225,0.5)]` light / `bg-[rgba(140,106,63,0.08)]` dark, text `var(--d5-muted)`
- Module titles: switched from `color: 'var(--d5-ink)'` to `text-foreground` for dark mode safety

**Test updates:** `LevelChip.test.tsx` updated to match D5 warm palette (`#8C6A3F` instead of `amber`). `DashboardDeferredSection.test.tsx` updated to match Spanish copy (`/expresa tus ideas/i`).

---

## Account Page — Senda Master Spec Compliance (2026-03-11)

**Files changed:** `src/app/globals.css`, `src/app/account/page.tsx`, `src/app/account/AccountForm.tsx`, `src/app/account/SecurityForm.tsx`, `src/app/account/DangerZone.tsx`, `src/app/account/IOSInstallCard.tsx`, `src/app/account/loading.tsx`

### Fix 1: New reusable CSS utility classes (Spec §6, §9)

Added four new classes to `globals.css` for account (and future) form use:

| Class | Purpose |
|---|---|
| `.senda-input` | Borderless input with Dark Cream (`--d5-cream`) fill; `0.8125rem` font; terracotta `focus-visible` ring; dark mode uses `rgba(26,17,8,0.40)` sunken fill |
| `.senda-field-label` | `0.625rem` label in `--d5-warm` above inputs |
| `.senda-sub-header` | `0.75rem` section sub-title in `--d5-warm`; dark mode swaps to `--d5-muted` |
| `.senda-focus-ring` | Generic `focus-visible` ring (2px solid terracotta, 2px offset) for bare buttons |

### Fix 2: Hardcoded px → rem throughout (Spec §3)

All inline `fontSize: <number>` replaced with rem strings across all 6 component files:
- `22px` → `1.375rem`, `15px` → `0.9375rem`, `14px` → `0.875rem`, `13px` → `0.8125rem`, `12px` → `0.75rem`, `11px` → `0.6875rem`, `10px` → `0.625rem`, `9px` → `0.5625rem`
- Spacing values also converted: `marginBottom: 12` → `0.75rem`, `gap: 14` → `0.875rem`, etc.

### Fix 3: Inputs — remove CSS borders, use Dark Cream fill (Spec §6)

Removed all three duplicated `bareInputStyle` objects (in `AccountForm.tsx` and `SecurityForm.tsx`) which used:
- `border: '1px solid rgba(26,17,8,0.08)'` ← violates spec (borderless inputs)
- `background: 'rgba(26,17,8,0.04)'` ← too transparent, should be solid Dark Cream

Replaced with `className="senda-input"` — solid `#E8E6E1` fill, no border, proper `focus-visible` ring.

### Fix 4: Dark mode broken on inline rgba styles (Spec §10.1)

Multiple elements used hardcoded `rgba(26,17,8,...)` which is invisible on dark ink backgrounds:
- **Field labels**: `color: 'rgba(26,17,8,0.5)'` → `.senda-field-label` (uses `--d5-warm`)
- **Sub-headers**: `color: 'rgba(26,17,8,0.6)'` → `.senda-sub-header` (swaps to `--d5-muted` in dark)
- **Theme toggle pills**: inline `rgba` bg/color → Tailwind classes with `dark:` variants (`dark:bg-[rgba(184,170,153,0.18)]`, `dark:text-[var(--d5-paper)]`)
- **Audio button**: inline `rgba` bg → className with `dark:` variants
- **Display name**: added `dark:text-[var(--d5-paper)]`
- **Avatar circle**: changed from `rgba(26,17,8,0.08)` to `rgba(140,106,63,0.10)` for brand warmth
- **IOSInstallCard**: text colours get `dark:text-[var(--d5-paper)]` classes

### Fix 5: Skeleton loading uses grey shimmer (Spec §4)

`loading.tsx` replaced:
- `bg-muted animate-pulse` → `senda-skeleton-fill animate-senda-pulse` (brand-aligned 1.4s opacity pulse)
- `bg-card rounded-xl border p-6 shadow-sm` → `senda-card` (removes hard border, uses warm tint fill)

### Fix 6: Excessive WindingPathSeparators (Spec §5)

Reduced from 8 total (6 in `page.tsx` + 2 inside `AccountForm`) to 4 in `page.tsx`:
1. After header/avatar row
2. After AccountForm (before SecurityForm)
3. After SecurityForm (before Notificaciones + DangerZone grouped)
4. Before IOSInstallCard

Internal AccountForm separators replaced with `<div style={{ height: '1.5rem' }} />` spacing dividers. Notificaciones and DangerZone grouped under same macro-section with `0.5rem` gap instead of a separator.

### Fix 7: Missing focus-visible rings on bare elements (Spec §9)

- Theme toggle pills: added `senda-focus-ring` class
- Audio toggle button: added `senda-focus-ring` class
- Password eye toggle buttons: added `senda-focus-ring` class

### Fix 8: Touch targets below 44px (Spec §9)

Theme toggle pills: added `minHeight: '2.75rem'` (44px) to meet spec minimum.

### Fix 9: Transition timing (Spec §8)

- Theme pills: `transition: 'background 150ms'` → `transition-[background,color] duration-200 ease-out`
- Audio button: `transition: 'background 150ms'` → `transition-[background] duration-200 ease-out`

### Fix 10: DangerZone persistent red eyebrow (Spec §2)

- "Zona de peligro" eyebrow: removed `text-red-600` override — now uses default `.senda-eyebrow` colour (Brand Warm), keeping the label neutral while the delete button retains red as a functional danger signal.
- Error message: removed `border border-red-200` — uses `background: rgba(220,38,38,0.06)` only (no hard border per spec).
- Sign-out icon: added `dark:text-[var(--d5-paper)]` for dark mode visibility.

### Fix 11: Level badge uses LEVEL_CHIP constant (Spec §2)

Replaced hardcoded amber badge with `LEVEL_CHIP[computedLevel]?.className` from `src/lib/constants.ts`, which already follows D5 warm palette. Fallback to inline amber style if level not found.

### Fix 12: Eyebrow style mismatch (Spec §3)

Removed three duplicated `eyebrowStyle` inline objects that used `fontSize: 9` (0.5625rem) and `color: 'var(--d5-muted)'`. Replaced with `className="senda-eyebrow"` which uses spec-correct `0.75rem` and `var(--d5-eyebrow)` (adaptive warm/muted).

---

## D5 Brand Direction — Global Implementation (2026-03-10)

**Reference:** Art Direction 5, applied across all production pages.

### Colour System (Spec §2)

Semantic palette tokens defined in `src/app/globals.css` under `:root`:
| Token | Value | Usage |
|---|---|---|
| `--d5-ink` | `#1A1108` | Near-black heading colour |
| `--d5-terracotta` | `#C4522E` | Primary/CTA colour (maps to `--primary`) |
| `--d5-warm` | `#8C6A3F` | Mid-tone body labels, nav inactive (light) |
| `--d5-muted` | `#B8AA99` | Muted text, nav inactive (dark), pronoun cells |
| `--d5-paper` | `#FDFCF9` | Background / button foreground |
| `--d5-cream` | `#E8E6E1` | Secondary tags, form fills |

Adaptive tokens auto-swap in `.dark`:
- `--d5-eyebrow`: warm → muted
- `--d5-separator`: warm → muted
- `--d5-nav-inactive`: warm → muted
- `--d5-magic-stroke`: muted → warm (BackgroundMagicS)
- `--d5-magic-opacity`: 0.03 → 0.05

Shadcn `--primary` mapped to terracotta `oklch(0.54 0.155 38)`.

### Typography (Spec §3)

- Headers: Lora (serif, italic) via `.senda-heading` class
- Body: DM Sans via `--font-dm-sans`
- Eyebrows: `.senda-eyebrow` — 0.75rem, bold, tracking 0.12em, `var(--d5-eyebrow)` colour
- All production UI labels in **Title-Case Spanish** (e.g., "Tu Senda Diaria", "Empezar Repaso")

### Card Surface (Spec §4)

`.senda-card` class in `globals.css`:
- Light: `rgba(140, 106, 63, 0.07)` bg, `0 10px 30px -10px rgba(26, 17, 8, 0.08)` shadow, 20px radius, 16px 20px padding
- Dark: `#241910` bg, `0 10px 30px -10px rgba(0, 0, 0, 0.4)` shadow

No CSS `border` on structural cards — separation via padding, shadows, and SVG paths.

### SVG Atoms (Spec §5)

- `SvgSendaPath.tsx` — inline terracotta S-path; used in SideNav + AppHeader wordmarks
- `WindingPathSeparator.tsx` — calligraphic SVG divider using `--d5-separator`; placed between dashboard sections
- `BackgroundMagicS.tsx` — large watermark S-path (absolute positioned); adaptive stroke/opacity via `--d5-magic-stroke` / `--d5-magic-opacity`

### Button Hierarchy (Spec §6)

- Primary: solid terracotta bg, paper text
- Outline: transparent bg, 1.5px terracotta border, terracotta text; hover `bg-[#C4522E]/10`
- Dark mode outline hover: `bg-[#FDFCF9]/5`
- Focus ring: 2px solid `#C4522E`, 2px offset, offset colour adapts (paper light / ink dark)

### Motion (Spec §8)

CSS custom properties in `globals.css`:
- `--ease-senda: cubic-bezier(0.4, 0, 0.2, 1)`
- `--duration-senda: 200ms`

Animation classes:
| Class | Keyframes | Duration |
|---|---|---|
| `animate-flash-green` | Green wash feedback | 200ms |
| `animate-flash-red` | Red wash feedback | 200ms |
| `animate-flash-orange` | Amber wash (accent error) | 200ms |
| `animate-page-in` | Fade + translateY(4px) | 200ms |
| `animate-exercise-in` | Fade + translateY(6px) | 200ms |
| `animate-senda-pulse` | Opacity pulse (1→0.45→1) | 1.4s infinite |

`prefers-reduced-motion: reduce` suppresses all non-essential animations.

### Skeleton Loading (Spec §4)

- `.senda-skeleton-fill`: `oklch(0.145 0 0 / 0.05)` light, `oklch(0.985 0 0 / 0.07)` dark
- Combined with `.animate-senda-pulse` (1.4s opacity pulse, no scale)

### Navigation (Spec §7)

**SideNav** (desktop, `hidden lg:flex`):
- D5 design: `SvgSendaPath` + DM Serif italic "Senda" wordmark
- Left 3px terracotta accent bar per active item
- `--d5-nav-inactive` for inactive items
- 6 items: Dashboard → Study → Curriculum → Verbs → Progress → Tutor

**BottomNav** (mobile, `lg:hidden`):
- Same 6-tab order
- Active pill: inline `rgba(184,170,153,0.28)` bg
- Hidden on `/verbs/session`

**AppHeader** (mobile, `lg:hidden`):
- Sticky; `SvgSendaPath size={22}` + DM Serif italic "Senda" wordmark
- Hidden on `/auth`, `/study`, `/tutor`, `/onboarding`

### Dark Mode — Night Journal (Spec §10)

| Element | Light | Dark |
|---|---|---|
| Background | `oklch(0.99 0.006 85)` (#FDFCF9) | `oklch(0.115 0.016 52)` (#1A1108) |
| Card surface | Same as bg | `oklch(0.175 0.016 55)` (#241910) |
| Foreground | `oklch(0.145 0 0)` | `oklch(0.91 0.01 75)` (warm cream) |
| Primary | Terracotta (unchanged) | Terracotta (unchanged) |
| Borders | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| Inputs | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` |

`.senda-heading` colour: `--d5-ink` → `--d5-paper` in dark.
`.senda-card` bg: warm tint → `#241910`.
BackgroundMagicS: muted stroke → warm stroke, 0.03 → 0.05 opacity.
WindingPathSeparator: 0.50 → 0.15 opacity, echo 0.10 → 0.04.

### LEVEL_CHIP — Warm Yellow (updated 2026-03-11)

All three CEFR levels (B1/B2/C1) use a unified Warm Yellow chip:
```
bg-[#fef9c3] text-[#1A1108] dark:bg-[#fef9c3] dark:text-[#1A1108]
```
Previously used `bg-[#8C6A3F]/12`; updated to match master spec level chip rule. Border class removed from `LevelChip.tsx`.

---

## Dashboard — Additional Spec Fixes (2026-03-11)

**Files changed:** `src/lib/constants.ts`, `src/components/LevelChip.tsx`, `src/components/SideNav.tsx`, `src/app/globals.css`, `src/components/__tests__/LevelChip.test.tsx`, `src/app/dashboard/page.tsx`

### Fix 1: LevelChip unified Warm Yellow background (Master Spec — Level Chips)

`LEVEL_CHIP` in `constants.ts` changed from `bg-[#8C6A3F]/12` to `bg-[#fef9c3]` with `text-[#1A1108]` in both light and dark mode. Removed `border` class from `LevelChip.tsx`. Affects dashboard, curriculum, and account pages.

### Fix 2: SideNav hardcoded RGBA → CSS tokens (Spec §2)

Replaced 4 hardcoded `rgba(184,170,153,...)` values with new adaptive CSS variables:
- `--d5-nav-border` — light `rgba(184,170,153,0.4)` / dark `rgba(184,170,153,0.25)`
- `--d5-nav-active-bg` — light `rgba(184,170,153,0.25)` / dark `rgba(184,170,153,0.15)`

### Fix 3: SideNav inactive font weight 400 → 500 (Spec §3)

DM Sans body mandate requires weight 500 for labels. Inactive nav items and account link updated.

### Fix 4: SideNav nav gap base-4 grid (Spec §9)

`gap-0.5` (2px) → `gap-1` (4px) for base-4 grid compliance.

### Fix 5: Dashboard "Listos / Esperando" text style unified

Removed `font-bold text-foreground` from the due/new counts so numbers match the same `var(--d5-warm)` colour and normal weight as labels.

### Fix 6: BottomNav icons — brand preview SVGs (Spec §5)

Replaced Lucide `Book` and `Bot` icons with brand-preview custom SVG paths for Study and Tutor tabs. Inactive tab colour set to `#9ca3af`.

---

## Study Configure Page — Spec Compliance (2026-03-11)

**Files changed:** `src/app/study/configure/page.tsx`, `src/app/study/configure/SessionConfig.tsx`, `src/app/globals.css`

### Fix 1: Spacing grid violations → base-4 (Spec §9)

10 arbitrary pixel values replaced:
- `px-[18px]` → `px-4` (16px) — 6 occurrences across both files
- `pb-[10px]` → `pb-3` (12px)
- `gap: 6` → `gap: 8` — 3 occurrences (module pills, size pills, type grid)
- `padding: '10px 14px'` → `'12px 16px'`
- `padding: '0 14px'` → `'0 16px'`
- `padding: '0 18px'` → `'0 16px'`
- `padding: '13px 0'` → `'12px 0'` (CTA button)
- `marginBottom: 10` → `8` (eyebrow style)

### Fix 2: Hardcoded RGBA → CSS tokens (Spec §2)

Added 4 new adaptive CSS tokens to `globals.css` (light / dark):
| Token | Light | Dark |
|---|---|---|
| `--d5-pill-bg` | `rgba(26,17,8,0.03)` | `rgba(253,252,249,0.06)` |
| `--d5-pill-text` | `rgba(26,17,8,0.6)` | `rgba(253,252,249,0.6)` |
| `--d5-pill-text-soft` | `rgba(26,17,8,0.4)` | `rgba(253,252,249,0.4)` |
| `--d5-paper-75` | `rgba(253,252,249,0.75)` | `rgba(253,252,249,0.55)` |

Replaced 10 inline hardcoded `rgba(26,17,8,...)` and `rgba(253,252,249,...)` values.

### Fix 3: Lora font weight 600 (Spec §3)

Added `fontWeight: 600` to page title h1 and mode card titles (both use Lora italic).

### Fix 4: Inactive font weight 400 → 500 (Spec §3)

Session size pills and exercise type grid inactive state changed from `fontWeight: 400` to `500`.

### Fix 5: Eyebrow adaptive token (Spec §3)

Eyebrow style changed from `color: 'var(--d5-muted)'` to `color: 'var(--d5-eyebrow)'` — adapts warm (light) / muted (dark).

### Fix 6: Focus-visible rings on all interactive elements (Spec §9)

`senda-focus-ring` class added to: mode cards, module pills, session size pills, exercise type grid buttons, CTA button (7+ elements total).

### Fix 7: Transition timing on all interactive elements (Spec §8)

`transition: 'background 200ms ease-out, color 200ms ease-out'` added to `pillBase` style, mode card buttons, exercise type buttons, and CTA button.

### Fix 8: Border-radius px → rem (Spec §3)

- Mode cards: `borderRadius: 12` → `'0.75rem'`
- Exercise type grid: `borderRadius: 8` → `'0.5rem'`

### Fix 9: Data locking — bold numerals (Spec §6)

Mistake review mode subtitle changed from static "Conceptos donde fallaste" to `"${mistakeConceptCount} concepto(s) con errores"`, matching the SRS mode's count display pattern.

---

## Curriculum Pages — D5 Master Spec Compliance (2026-03-11)

**Files changed:** `src/app/globals.css`, `src/app/curriculum/CurriculumClient.tsx`, `src/app/curriculum/[id]/page.tsx`, `src/app/curriculum/loading.tsx`, `src/lib/mastery/badge.ts` (new)

### Fix 1: New adaptive CSS tokens (Spec §2, §10.1)

Added two new adaptive tokens to `globals.css`:

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--d5-line` | `rgba(26,17,8,0.12)` | `rgba(184,170,153,0.15)` | Timeline lines, progress bar tracks |
| `--d5-border-subtle` | `rgba(26,17,8,0.15)` | `rgba(184,170,153,0.2)` | Chip borders, node outlines |

### Fix 2: Page heading dark mode + weight (Spec §3, §10.1)

`CurriculumClient.tsx` h1 replaced inline Lora styles (`fontWeight: 700`, `color: var(--d5-ink)`) with `className="senda-heading"` + `fontSize: 26`. Fixes dark mode visibility (`.senda-heading` swaps colour) and corrects weight to 600 per spec.

### Fix 3: Concept title dark mode (Spec §10.1)

Concept row title in `CurriculumClient.tsx` changed from `color: 'var(--d5-ink)'` to `className="text-foreground"` — auto-adapts in dark mode.

### Fix 4: "Nuevo" mastery badge dark mode (Spec §10.1)

"Nuevo" badge used hardcoded `rgba(26,17,8,...)` for text and border — invisible in dark mode. Changed to:
- Text: `var(--d5-pill-text-soft)` (40% ink → 40% paper in dark)
- Border: `var(--d5-border-subtle)` (15% ink → 20% muted in dark)

### Fix 5: Timeline lines & nodes — hardcoded RGBA → tokens (Spec §2, §10.1)

| Element | Before | After |
|---|---|---|
| Line above/below node | `rgba(26,17,8,0.12)` | `var(--d5-line)` |
| Upcoming node border | `rgba(26,17,8,0.25)` | `var(--d5-border-subtle)` |
| "Próximamente" chip text | `rgba(26,17,8,0.35)` | `var(--d5-pill-text-soft)` |
| Meta chip border ("X/Y Dominados") | `rgba(26,17,8,0.15)` | `var(--d5-border-subtle)` |
| Chevron colour | `rgba(26,17,8,0.4)` | `var(--d5-pill-text-soft)` |
| Progress bar track | `rgba(26,17,8,0.08)` | `var(--d5-line)` |

### Fix 6: Concept detail page — `var(--d5-ink)` → `text-foreground` (Spec §10.1)

Four inline `color: 'var(--d5-ink)'` replaced with `className="text-foreground"`:
- Explanation paragraph (line 224)
- Example Spanish text (line 250)
- SRS "Estado de repaso" label (line 281)
- Repetitions count number (line 286)

### Fix 7: Shared mastery module — eliminate duplication

Extracted `getMasteryState()`, `MasteryState` type, and `MASTERY_BADGE` config into new `src/lib/mastery/badge.ts`. Both `CurriculumClient.tsx` and `[id]/page.tsx` now import from this shared module instead of maintaining duplicate definitions.

### Fix 8: `animate-page-in` on both pages (Spec §8)

Added `animate-page-in` class to `<main>` wrapper on both the curriculum list and concept detail pages.

### Fix 9: Loading skeleton fixes

- `max-w-3xl` → `max-w-2xl` to match actual page width
- Removed stale "filter tabs" skeleton row (filter tabs were removed from the page in a prior refactor)

---

## Progress Page — D5 Mockup Alignment (2026-03-11)

**Files changed:** `src/app/progress/page.tsx`, `src/components/verbs/VerbTenseMastery.tsx`, `src/app/progress/ActivityHeatmap.tsx`, `src/components/verbs/__tests__/VerbTenseMastery.test.tsx`

### Restructure 1: Header simplified (Spec §3)

- Title: "Progreso" → "Tu Progreso"
- Subtitle: "Tu Camino De Aprendizaje · {month} {year}" → "Nivel {level} · {totalAttempts} ejercicios"
- Removed level chip badge from header — mockup doesn't include it

### Restructure 2: Stats row — icons removed, labels restyled

Removed `Flame`, `CheckCircle`, `Target` icons from the 3-column stat cards. Labels changed from single-line title case to multi-line lowercase matching mockup:
- Streak: "Días Seguidos" → "días\nseguidos"
- Mastered: "Dominados" → "de {total}\ndominados"
- Accuracy: "Precisión" → "precisión\nglobal"

Uses `whiteSpace: 'pre-line'` for multi-line rendering.

### Restructure 3: Sections removed (reducing visual clutter + DB load)

| Removed section | Component/data | Reason |
|---|---|---|
| "Total" all-time stats | `allTimeAttemptCount`, `allTimeSessions` queries; `ListChecks`, `Clock` icons | Heavy data, not in mockup |
| "Ejercicios Por Tipo" | `ExerciseTypeChart` component; `exerciseTypeCounts` computation | Not in mockup |
| "Desglose De Habilidades" | `AccuracyChart` component; `bestType`/`worstType`/`showInsight` | Not in mockup |

Removed imports: `AccuracyChart`, `ExerciseTypeChart`, `Flame`, `CheckCircle`, `Target`, `ListChecks`, `Clock`, `LEVEL_CHIP`, `ExerciseAccuracy`, `ExerciseTypeCount`.

Files kept on disk for potential reuse — only imports removed from `page.tsx`.

### Restructure 4: CEFR Journey section — bare layout

- Removed `senda-card` wrapper → bare `<section>` with `px-1` padding
- Title replaced with eyebrow: `senda-eyebrow` class, colour `var(--d5-muted)`, text "Tu Camino CEFR"
- Removed dashed connector lines between levels (`border-l-2 border-dashed`)
- Removed duplicate level chip inside section
- Removed percentage row below each bar
- Thinner bars: `h-2` → `h-1` (4px)
- Track background: `bg-muted` → `color-mix(in oklch, var(--d5-muted) 20%, transparent)`
- Labels: "{m} / {t} Conceptos" → "{m} / {t} dominados"
- Removed B2 hint text and related computation (`showB2Hint`, `b1Pct`, `b1Remaining`)

### Restructure 5: Study Consistency section — restyled, kept

- Heading: replaced Lora italic `<h2>` with `senda-eyebrow` class in `var(--d5-muted)`
- Removed `senda-card` wrapper around heatmap → bare layout
- Session/days stats restyled with `--d5-muted` / `--d5-warm` tokens instead of `text-muted-foreground` / `text-foreground`

### Restructure 6: ActivityHeatmap — D5 palette (Spec §2)

Replaced `bg-green-200/400/600` (violated D5 "no green for brand" rule) with D5 warm palette:

| Count | Before | After |
|---|---|---|
| 0 | `bg-muted` | `bg-muted` (unchanged) |
| 1–2 | `bg-green-200` | `var(--d5-muted)` |
| 3–5 | `bg-green-400` | `var(--d5-warm)` |
| 6+ | `bg-green-600` | `var(--d5-terracotta)` |

Refactored `getColor()` → `getColorStyle()` returning `{ className?, style? }` to support CSS custom properties via inline style (Tailwind classes can't reference CSS vars dynamically). Legend updated to match.

### Restructure 7: VerbTenseMastery — full restyle

| Aspect | Before | After |
|---|---|---|
| Title | `<h2>` "Verb Conjugation Mastery" | `senda-eyebrow` "Verbos por Tiempo" in `var(--d5-muted)` |
| Wrapper | `bg-card rounded-xl border p-5 shadow-sm` | Bare `<section>` with `px-1` |
| Bar height | `h-2` | `h-[3px]` |
| Bar track | `bg-muted` | `color-mix(in oklch, var(--d5-muted) 20%, transparent)` |
| Bar colour (≥70%) | `bg-green-500` | `var(--d5-muted)` |
| Bar colour (<70%) | `bg-amber-400` / `bg-rose-400` | `var(--d5-terracotta)` |
| Right label | `{correct}/{attempts} · {pct}%` | `{pct}%` (font-weight 600) |
| Sub-bar text | — | `{attempts} intentos` (9px, muted) |
| Empty state | Returns `null` | Italic serif: "Completa ejercicios de verbos para ver tu progreso." |

### Restructure 8: Footer added

Centered italic serif text at bottom: "tu senda continúa…" with `color-mix(in oklch, var(--d5-ink) 25%, transparent)`.

### Test updates

`VerbTenseMastery.test.tsx`:
- Empty state test: now checks for eyebrow + italic serif message (previously asserted `null`)
- Data rows: assertions updated for new `{pct}%` and `{attempts} intentos` format (previously `{correct}/{attempts} · {pct}%`)
- Heading test: "Verb Conjugation Mastery" → "Verbos por Tiempo"

**Test suite: 1348 tests across 57 files — all passing.**

---

## Concept Detail Page — D5 Mockup Alignment + Master Spec Compliance (2026-03-11)

**Files changed:** `src/app/curriculum/[id]/page.tsx`, `src/app/curriculum/[id]/ConceptDetailClient.tsx` (new), `src/app/curriculum/[id]/ConjugationInsightTable.tsx`, `src/app/globals.css`, `src/app/curriculum/[id]/__tests__/ConceptDetailPage.test.tsx`

Audited against `docs/senda-master-specs.md` and the D5 brand preview mockup (`D5ConceptDetailPage` in `src/app/brand-preview/BrandPreviewClient.tsx`). Hybrid redesign combining the mockup's flat "Vellum & Ink" layout with live-only pedagogical elements.

### Restructure 1: Cards → flat sections with WindingPathSeparator (Spec §1, §5)

Removed all 4 `senda-card` wrappers. Content now floats on the continuous vellum surface, separated by `WindingPathSeparator` between macro-sections (matching the mockup pattern and spec §5 "macro-sections only" rule):
1. Header → separator → Explanation
2. Explanation → separator → Examples
3. Examples → separator → Conjugation insight (if tense-mapped)
4. Last content section → separator → SRS status + CTAs

### Restructure 2: Level chip above title (mockup pattern)

Moved `LevelChip` from inline with metadata chips to its own row above the title. Creates cleaner hierarchy: metadata tag → editorial serif title → secondary chips below.

### Restructure 3: Title row with HardFlagButton

Title `<h1>` and `HardFlagButton` now share a flex row with `items-start gap-2`. Previously the flag was inline with chips below the title.

### Restructure 4: Explanation in tinted container with clamp

New `ExpandableExplanation` client component (`ConceptDetailClient.tsx`):
- Tinted container: `rgba(26,17,8,0.05)` bg, `rounded-2xl`, `1rem 1.25rem` padding (matching mockup)
- 4-line `-webkit-line-clamp` with "Leer más…" / "Mostrar menos" toggle
- Eyebrow changed from "Concepto" to "Cómo funciona" (matching mockup)
- Attempt count moved inside this container

### Restructure 5: Examples — gap spacing replaces WindingPathSeparator

Removed `WindingPathSeparator` between individual example sentences (violated spec §5 — separator was between tightly coupled elements). Replaced with `flex flex-col gap-4`. Examples section is now a bare section (no card wrapper), with border-left accent preserved.

### Restructure 6: CTAs — stacked full-width (mockup pattern)

Replaced 2-column grid + pill grid layout with stacked full-width buttons (matching mockup):
1. Primary: "Practicar este concepto →" (solid terracotta)
2. Secondary: "Escritura libre" (outline)
3. Secondary: "Consultar tutor" (outline)

Exercise type pills moved below CTAs as a less prominent row.

### Fix 1: Hardcoded px → Tailwind rem classes (Spec §3)

All inline `fontSize` px values replaced with Tailwind classes:
| Before | After |
|---|---|
| `fontSize: 22` | `text-xl` (1.25rem) |
| `fontSize: 20` | `text-xl` |
| `fontSize: 16` | `text-base` |
| `fontSize: 14` | `text-sm` |
| `fontSize: 13` | `text-sm` or `text-xs` |
| `fontSize: 12` | `text-xs` |
| `fontSize: 11` | `text-xs` |

Also applied to `ConjugationInsightTable.tsx`: `fontSize: 12` → `text-xs`, `fontSize: 15` → `text-sm`, `padding: '8px 0'` → `py-2`, `minWidth: 80` → `5rem`.

### Fix 2: Off-grid margins → base-4 (Spec §9)

Three `marginBottom: 14` (off-grid) replaced:
- Chips row: `14` → `mb-2` (8px) — tighter coupling to title
- Examples eyebrow: `14` → `mb-3` (12px)
- SRS eyebrow: `14` → `mb-4` (16px)

### Fix 3: Secondary button borders 1px → 1.5px (Spec §6)

All outline buttons changed from `border: '1px solid rgba(196,82,46,0.3)'` to `border: '1.5px solid rgba(196,82,46,0.3)'`.

### Fix 4: Hover states on outline buttons (Spec §6)

Added `hover:bg-[#C4522E]/10` class to all secondary outline buttons (Escritura libre, Consultar tutor, exercise type pills). Added `transition-colors duration-200` for spec §8 compliance.

### Fix 5: `.senda-card` padding p-6 (Spec §7 — global)

`globals.css` `.senda-card` padding changed from `padding: 16px 20px` to `padding: 1.5rem` (24px). Spec §7 requires p-6 (24px) or p-8 (32px). This is a global change affecting all pages using `.senda-card`.

### Fix 6: 44px touch targets on exercise pills (Spec §9)

Exercise type pills: added `minHeight: '2.75rem'` (44px) + `display: inline-flex` + `alignItems: center` to ensure minimum touch target size.

### Test updates

- Added mock for `ConceptDetailClient` (`ExpandableExplanation`)
- Updated assertions: "Tu Progreso" → "Próxima revisión", "card" → "section"
- Added new tests: "Cómo funciona" eyebrow, stacked CTA buttons
- **10 tests, all passing**

---

## GrammarFocusChip — D5 Warm Earth Tones (2026-03-11)

**Files changed:** `src/components/GrammarFocusChip.tsx`

Replaced cold Tailwind palette colours (sky/violet/amber) with warm earth tones complementary to the D5 palette:

| Mood | Before | After (text) | After (bg) |
|---|---|---|---|
| Indicative | `bg-sky-100 text-sky-700` | `#4A6741` (sage) | `rgba(74,103,65,0.10)` |
| Subjunctive | `bg-violet-100 text-violet-700` | `#7B5272` (dusty mauve) | `rgba(123,82,114,0.10)` |
| Both moods | `bg-amber-100 text-amber-700` | `#8B7332` (warm ochre) | `rgba(139,115,50,0.10)` |

Dark mode variants: 20% bg opacity, lighter text (`#8BB880` sage, `#C49AB8` mauve, `#C4AD6A` ochre), 35% border opacity.

---

## SessionConfig — Build Fix (2026-03-11)

**Files changed:** `src/app/study/configure/SessionConfig.tsx`

Removed unused `boldNum` property from mode array objects (lines 77, 80). Property was set but not in the type definition (`{ id: SessionMode; title: string; subtitle: string }`) and never consumed in rendering. Caused Vercel build failure (TypeScript strict mode).

---

## Spec Sections Not Yet Implemented

| Spec Section | Status | Notes |
|---|---|---|
| §3 rem-only typography | Partial | Account page + concept detail fully converted; study configure still uses px inline styles for font-size |
| §6 Form fills (Dark Cream) | Partial | Account page fully converted (`.senda-input` class); auth + onboarding forms not audited |
| §7 Accordion chevrons | Not started | Curriculum accordions lack right-aligned chevron affordance |
| §7 Modal shadows | Not audited | Need to verify modals use deeper shadow formula |
| §9 Base-4 spacing | Done | Dashboard + account + study configure all on grid |
| §9 44px touch targets | Done | Account theme pills, study configure pills all ≥ 44px |
| §9 max-w-prose | Not started | Extended text blocks (tutor chat, explanations) not constrained |
| §9 Focus states | Partial | Account + study configure done; other pages not audited |
