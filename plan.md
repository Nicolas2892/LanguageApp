# Plan: Verb List Page — Spec Compliance + UX Improvements

## Files to change
1. `src/app/verbs/page.tsx` — page header, CTA, separator, BackgroundMagicS, mastery summary
2. `src/app/verbs/VerbDirectory.tsx` — search input, filter chips, sort, sticky search, alphabet headers, empty state, favorites filter
3. `src/components/verbs/VerbCard.tsx` — senda-card, mastery dots colours, verb group badge, Lora italic infinitive, mastery % replacement

## Step-by-step

### Step 1: `page.tsx` — Header & layout
- Import `WindingPathSeparator`, `BackgroundMagicS`
- h1 → `senda-heading text-2xl`
- Subtitle → Spanish sentence case: `"100 verbos de alta frecuencia · Escribe la forma conjugada en contexto"`
- Add mastery summary line: `"X/100 practicados · Y dominados"` (compute from verbItems data)
- CTA → `"Practicar →"`, `rounded-full`, terracotta fill via inline style (matching other pages)
- Add `WindingPathSeparator` between header and VerbDirectory
- Add `BackgroundMagicS` with `relative overflow-hidden` on main
- Pass mastery stats to page (already computed server-side)

### Step 2: `VerbDirectory.tsx` — Search, filters, sort, sticky
- **Search**: Remove `border`, add Dark Cream fill (`bg-[#E8E6E1] dark:bg-[rgba(26,17,8,0.4)]`), `senda-focus-ring`, placeholder → `"Buscar verbos..."`
- **Sticky search**: `sticky top-0 z-10` with paper bg padding
- **Filter chips**: Full spec pill treatment:
  - "Solo irregulares" (Spanish)
  - New "Favoritos" chip
  - Both: transparent bg inactive, `1.5px solid var(--d5-pill-border)`, `text-[var(--d5-warm)]`, 44px min-height, 200ms transition
  - Active: terracotta fill, paper text, font-weight 700
- **Sort toggle**: Add "A–Z" / "Por frecuencia" toggle (needs `frequency_rank` passed through)
  - Add `frequencyRank` to VerbItem interface
  - Sort filtered array by alpha or frequency based on state
- **Alphabet headers**: Use `senda-eyebrow` class (auto-adapts colour)
- **Empty state**: `"No se encontraron verbos."`
- Accept `frequencyRank` in VerbItem

### Step 3: `page.tsx` — Pass frequency_rank
- Add `frequency_rank` to verbItems map
- Verb type already has it from `select('*')`

### Step 4: `VerbCard.tsx` — Card design
- Replace `bg-card rounded-xl border p-4 shadow-sm hover:shadow-md` with `senda-card` + hover shadow enhancement
- Infinitive → Lora italic: `font-[var(--font-lora)] italic` (matching verb detail)
- Verb group badge → `bg-[rgba(184,170,153,0.25)] text-[var(--d5-warm)]` (matching verb detail)
- **Mastery dots** → brand colours: `bg-[var(--d5-terracotta)]` for ≥70%, `bg-[var(--d5-warm)]` for partial, `bg-[var(--d5-muted)]/25` for untouched
- Add "Nuevo" tag for verbs with zero mastery across all tenses
- Replace dots with single aggregate mastery % if any practice exists (cleaner, more scannable)

### Step 5: Tests
- Update existing verb page tests for new text/classes
- Add test for favorites filter, sort toggle, mastery summary

### Step 6: Verify
- `pnpm exec tsc --noEmit`
- `pnpm test`
