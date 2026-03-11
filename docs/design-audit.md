# UX Audit Report — D5 Brand Compliance & Design Consistency

_Date: 2026-03-11_

---

## I. CRITICAL: Heading Style Fragmentation

The `.senda-heading` utility (Lora italic, 600 weight, ink/paper colour) exists in `globals.css:191` but is **bypassed in 3 key pages**:

| Page | Current approach | Issue |
|---|---|---|
| **StudyConfigurePage** | Inline `fontFamily: 'var(--font-lora)'`, `fontSize: 22` | Duplicates `.senda-heading` logic; uses `fontSize: 22` instead of Tailwind size class |
| **Progress page** | Inline `fontFamily: 'var(--font-lora)'`, `fontSize: 28` | Same duplication; `fontSize: 28` differs from configure's `22` — no consistent scale |
| **VerbDetailClient** | Inline `fontSize: 28`, `color: var(--d5-terracotta)` | Overrides colour to terracotta instead of ink — violates `.senda-heading` which uses `--d5-ink` (dark-safe). **Dark mode risk**: terracotta on dark background has lower contrast than paper |
| **StudySession** (fallback) | `text-2xl font-bold tracking-tight` | Generic Tailwind, not Lora italic at all |
| **ConceptPicker** h2 | `text-base font-bold` | No serif, no italic — breaks the heading hierarchy |

**Recommendation:** Every page title should use `.senda-heading` + a Tailwind size class (`text-xl` / `text-2xl`). Remove all inline `fontFamily` / `fontStyle` overrides.

---

## II. HIGH: Inconsistent Container & Spacing Rhythm

There is no unified page rhythm. The `max-width`, padding, and bottom safe-area patterns vary significantly:

| Page | max-width | Padding | Bottom safe-area |
|---|---|---|---|
| Dashboard | `max-w-lg` (32rem) | `px-5 pt-5` | `pb-[calc(3.125rem+...)]` |
| Study | `max-w-xl` (36rem) | `p-6 md:p-10` | `pb-24 lg:pb-10` (hardcoded) |
| StudyConfigure | `max-w-md` (28rem) | header-only `px-4 pt-4` | `pb-[calc(...)]` |
| Curriculum | `max-w-2xl` (42rem) | `p-6 md:p-10` | `pb-[calc(...)]` |
| Progress | `max-w-2xl` (42rem) | `p-6 md:p-10` | `pb-24 lg:pb-10` (hardcoded) |
| Account | `max-w-xl` (36rem) | `p-6 md:p-10` | `pb-[calc(...)]` |
| Write | `max-w-xl` (36rem) | `p-6 md:p-10` | `pb-[calc(...)]` |
| Verbs | `max-w-3xl` (48rem) | `p-6 md:p-10` | `pb-[calc(...)]` |
| VerbDetail | `max-w-2xl` (42rem) | `p-6 md:p-10` | `pb-24 lg:pb-10` (hardcoded) |
| ConceptPicker | (no max-w) | `space-y-4` | `pb-36` (hardcoded!) |

**Issues:**
1. **5 different `max-width` values** — no clear system. Dashboard is narrowest (`lg`), Verbs is widest (`3xl`).
2. **Two bottom-padding strategies** — `pb-[calc(3.125rem+env(safe-area-inset-bottom)+...)]` (correct, adapts to nav bar + notch) vs hardcoded `pb-24` (doesn't account for safe area). Study, Progress, VerbDetail use the hardcoded version.
3. **ConceptPicker uses `pb-36`** — a 9rem fixed pad with no relation to nav height.
4. **Dashboard alone uses `px-5 pt-5`** instead of `p-6 md:p-10` — tighter mobile padding than every other page.

**Recommendation:** Standardise on 2-3 `max-width` tiers (content pages: `max-w-2xl`, narrow forms: `max-w-xl`, grid pages: `max-w-3xl`). Unify bottom padding to the `calc()` pattern everywhere. Align Dashboard padding to `p-6 md:p-10`.

---

## III. HIGH: Section Spacing Has No Scale

Spacing between major sections varies page-to-page:

- **Dashboard:** `mt-2` between WindingPathSeparator and next card (very tight)
- **Progress:** `space-y-8` wrapper (generous)
- **Account:** Alternating `mt-6` / `mt-12` (widest range)
- **Write/Verbs:** `space-y-6` (medium)
- **VerbDetailClient:** Inline `gap: 20` / `gap: 12` / `gap: 8` (mixed inline px values — not on the 4px Tailwind grid)

**Recommendation:** Define a section-spacing scale: `space-y-6` for content pages, `space-y-8` for analytics/progress pages. Dashboard `mt-2` after separators is too tight — increase to `mt-4` or `mt-6` to let sections breathe.

---

## IV. HIGH: `.senda-card` Underutilised

The utility is defined in `globals.css:214` with warm tint, 20px radius, shadow, and dark override. But multiple pages recreate it inline:

| Page | Current approach | Should use `.senda-card` |
|---|---|---|
| **Progress** stats row | `style={{ background: 'rgba(26,17,8,0.04)', borderRadius: 14, padding: '10px' }}` | Yes — but radius is 14px vs 20px |
| **VerbDetailClient** conjugation tables | `style={{ background: 'rgba(140,106,63,0.07)', borderRadius: 16, padding: 16 }}` | Yes — exact same background tint, radius 16 vs 20 |
| **HintPanel** | `bg-[rgba(140,106,63,0.07)]` with `rounded-xl` (12px) | Similar intent, smaller radius |

**Recommendation:** Use `.senda-card` consistently. Where a tighter variant is needed (smaller radius/padding), create `.senda-card-sm` with `border-radius: 14px; padding: 0.75rem;`.

---

## V. HIGH: Title Case Spanish — Inconsistent Application

The D5 direction uses **Title-Case Spanish** for headings and CTAs. Multiple violations found:

### CTAs that should be Title Case:
| Current | Should be |
|---|---|
| "Empezar a escribir" | "Empezar a Escribir" |
| "Buscar verbos..." | "Buscar Verbos..." |
| "Elige uno o más conceptos para escribir." | "Elige Uno o Más Conceptos para Escribir." |
| "sigue practicando" (VerbSummary) | "Sigue Practicando" |

### Dialog titles that should be Title Case:
| Current | Should be |
|---|---|
| "¿Salir de la sesión?" | "¿Salir de la Sesión?" |

### English fallback strings (Study page):
| Current | Issue |
|---|---|
| "All caught up!" | Should be Spanish: "¡Todo al día!" |
| "No concepts are due for review today." | Spanish: "No hay conceptos pendientes hoy." |
| "Practice anyway →" | Spanish: "Practicar de Todos Modos →" |
| "No exercises found" | Spanish: "No se encontraron ejercicios" |

**Rule clarification:** Lowercase articles/prepositions in Title Case (a, de, en, por, para) — standard Spanish practice keeps these lowercase unless first word. So "Empezar a Escribir" is correct, "Salir de la Sesión" is correct.

---

## VI. MEDIUM: Pill/Chip Design Inconsistencies

### Semantic chips (LevelChip, GrammarFocusChip, VerbGroupChip) — **Consistent with each other:**
- All: `rounded` (12px), `px-1.5 py-0.5`, `text-[10px]`, `font-semibold`
- Good internal consistency ✓

### LevelChip — **No differentiation between levels:**
- All three levels (B1/B2/C1) render the same warm yellow `bg-[#fef9c3]` + `text-[#1A1108]`
- The `LEVEL_CHIP` config in `constants.ts` defines different colours but they're all mapped to the same yellow
- **This defeats the purpose of a level indicator**

### Interactive selection pills — **Two sizing tiers, inconsistent:**
| Component | Height | Padding | Font | Radius |
|---|---|---|---|---|
| SessionConfig pills | `minHeight: 44` | `0 16px` | `12px / 700` | `99px` |
| VerbConfig tense pills | `minHeight: 36` | `0 12px` | `11px / 700` | `99px` |
| VerbConfig length pills | `minHeight: 44` | `0 16px` | `12px / 700` | `99px` |
| ConceptPicker filter | (auto) | `px-3 py-1` | `text-xs / semibold` | `rounded-full` |
| VerbDirectory filter | (auto) | `px-3 py-1.5` | `text-xs / medium` | `rounded-full` |

**Issues:** Tense pills are smaller (36px/11px) than other pills (44px/12px). ConceptPicker and VerbDirectory filter pills use CSS classes rather than inline styles — different padding (`py-1` vs `py-1.5`) and weight (`semibold` vs `medium`).

### Score pills — **Two approaches:**
- `.senda-score-pill` (FeedbackPanel, DiagnosticSession) — D5 terracotta, `5px 16px`, `11px/700`
- VerbFeedbackPanel outcome pills — Tailwind green/amber/red, `px-3 py-1`, `text-xs/semibold`

**Recommendation:** Unify all interactive pills to two tiers: **Touch pill** (`minHeight: 44`, `px-4`, `text-xs/700`) and **Compact pill** (`minHeight: 36`, `px-3`, `text-[11px]/600`). VerbFeedbackPanel should use the `.senda-score-pill` pattern or a variant with colour parameter.

---

## VII. MEDIUM: Mastery Badge Duplication

Two separate `MASTERY_BADGE` definitions exist:
1. **`src/lib/mastery/badge.ts`** — inline style objects with `borderRadius: 9999`, `fontSize: 10`, `fontWeight: 600`
2. **`src/app/write/ConceptPicker.tsx`** — Tailwind class strings (`bg-primary/10 text-primary`, `bg-blue-50 text-blue-500`)

They render different visual results for the same semantic concept. The `badge.ts` version uses D5 tokens properly; ConceptPicker's is a Tailwind approximation.

**Recommendation:** Delete the ConceptPicker local definition; import from `badge.ts`.

---

## VIII. MEDIUM: CTA Button Hierarchy Not Codified

Three CTA tiers exist in practice but are implemented differently per page:

**Tier 1 (Primary solid):**
- Dashboard: Inline `style={{ background: 'var(--d5-terracotta)' }}` on `<button>`
- ConceptDetail: Inline style on `<Link>` with `rounded-full text-sm font-semibold`
- VerbDetail: Same Link pattern
- StudySession: `bg-primary text-primary-foreground rounded-xl` (Shadcn class)

**Tier 2 (Secondary outline):**
- Dashboard: Inline `style={{ borderColor: 'var(--d5-terracotta)', color: 'var(--d5-terracotta)' }}`
- ConceptDetail: Inline `style={{ color: 'var(--d5-terracotta)', background: 'rgba(196,82,46,0.08)' }}`
- VerbSummary: `<Button variant="outline" className="rounded-full">`

**Tier 3 (Text link):**
- ConceptDetail: `.senda-eyebrow` + arrow icon
- StudySession: `text-primary hover:underline`

**Recommendation:** Create `.senda-cta` (solid terracotta pill), `.senda-cta-outline` (terracotta border pill), `.senda-cta-text` (terracotta text link) utility classes to replace the inline style variations.

---

## IX. MEDIUM: Dark Mode Gaps

1. **VerbDetailClient h1** uses `color: var(--d5-terracotta)` — this works in dark mode but has lower contrast than `var(--d5-paper)`. The `.senda-heading` utility correctly swaps to paper in dark; bypassing it loses that.
2. **Account page avatar circle** uses `style={{ background: 'rgba(140,106,63,0.10)' }}` — no dark override (will be very subtle on dark backgrounds).
3. **ConceptPicker checkbox** uses `accent-[#C4522E]` — hardcoded hex instead of `accent-primary`.

---

## X. Senior UX Designer Perspective — Rhythm & Feel

### What Works Well
- **WindingPathSeparator** as a section divider is a distinctive brand element that creates visual breathing room
- **`.senda-eyebrow`** uppercase tracking gives a premium editorial feel when used consistently
- **Terracotta as primary** is warm and distinctive — successfully avoids the cold tech-blue cliché
- **Lora italic headings** give an academic warmth appropriate for a language learning context

### What Needs Attention

1. **Vertical rhythm is erratic.** The eye can't predict the next section's position. Dashboard cards sit `mt-2` after separators (cramped), while Account sections use `mt-12` (spacious). This creates a subconscious feeling of inconsistency — the app feels "designed page by page" rather than as a system.

2. **The heading scale is improvised.** At least 4 different heading sizes (22px, 28px, `text-xl`, `text-2xl`) with no clear hierarchy. A well-designed type scale would have: page title (28px), section heading (22px), card heading (18px), and nothing else.

3. **Configure pages feel disconnected.** StudyConfigure uses `max-w-md` (narrowest of all pages), its own padding system, and inline heading styles. It should feel like an extension of the Study page, not a separate app.

4. **The "card" concept is inconsistent.** `.senda-card` has a precise definition (warm tint, 20px radius, shadow), but 3 pages recreate it with subtly different parameters (14px radius, 16px radius, no shadow). This creates visual noise — the user subconsciously registers "these rectangles are _almost_ the same but not quite."

5. **The Study page has English fallback strings.** Every other page uses Spanish UI copy. Hitting "All caught up!" in English breaks immersion for a Spanish learning app.

6. **Interactive pill sizes need consolidation.** Having `minHeight: 36` pills next to `minHeight: 44` pills creates a visual hierarchy that doesn't map to semantic importance — it just looks like a sizing mistake.

---

## Summary: Proposed Fixes (Priority Order)

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | Standardise all headings to `.senda-heading` + Tailwind size class | High | Low |
| 2 | Unify bottom safe-area padding to `calc()` pattern | High | Low |
| 3 | Replace Study page English fallbacks with Spanish | High | Low |
| 4 | Fix Title Case inconsistencies in Spanish CTAs/labels | High | Low |
| 5 | Standardise section spacing scale (space-y-6 content, space-y-8 analytics) | High | Medium |
| 6 | Replace inline card styles with `.senda-card` (+ create `.senda-card-sm`) | Medium | Low |
| 7 | Create `.senda-cta` / `.senda-cta-outline` utility classes | Medium | Medium |
| 8 | Unify interactive pill sizes to 2 tiers | Medium | Medium |
| 9 | Fix LevelChip to show distinct colours per level | Medium | Low |
| 10 | Consolidate mastery badge to single definition | Medium | Low |
| 11 | Align container `max-width` to 2-3 standard tiers | Low | Medium |
| 12 | Fix dark mode gaps (VerbDetail h1, Account avatar, checkbox accent) | Low | Low |
