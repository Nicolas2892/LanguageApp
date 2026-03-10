# Brand Identity Audit — Español Avanzado
*Conducted 2026-03-06. Deferred for implementation after other backlog items.*

---

## Part 1 — Holistic Brand & UI Critique

### Logo / App Icon

**Speech bubble shape (critical flaw)**
The speech bubble is the single most overused shape in language and communication software. Duolingo, Babbel, Google Translate, Rosetta Stone, DeepL, and hundreds of lesser-known apps all use it. It signals "language" in the most generic way possible — there is zero differentiation. A mark this common does not build brand recognition; it actively erodes it by making the app visually indistinguishable in an App Store grid.

**Three-container icon composition ("element placed in a box" anti-pattern)**
The current icon stacks three nested containers: gradient background → white rounded-rect bubble → orange Ñ letterform. This is the icon equivalent of a poster that reads "POSTER" in a box labeled "TEXT." The Ñ is the most distinctive element, but it is surrounded by two layers of chrome that dilute rather than amplify it. Every layer added to an icon reduces visual weight at small sizes.

**System font renders the Ñ differently on every device**
The Ñ is rendered using `fontFamily: 'sans-serif'` in both `icon.tsx` and `apple-icon.tsx`. On macOS this resolves to SF Pro. On iOS it resolves to SF Pro. On Windows it resolves to Segoe UI. On Android it resolves to Roboto. The brand's most distinctive letterform looks different on every platform — the opposite of a brand identity.

**Generic orange gradient**
The gradient `#f97316 → #c2410c` (Tailwind orange-500 → orange-700) is the default warm-brand palette chosen by thousands of edtech, fintech, and productivity apps built with Tailwind. It is recognisable as "Tailwind orange," not as anything specific to Spanish, learning, culture, or elevation. Orange is not wrong as a brand colour — the connotation of warmth and energy is appropriate — but the specific value and application is off-the-shelf.

### Wordmark & Typography

**No typographic decision has been made**
"Español Avanzado" appears in `text-sm font-bold` inside `SideNav.tsx` — system sans-serif at 14px bold. This is not a wordmark; it is default text. There is no display typeface, no letter-spacing decision, no weight contrast, no brand typography of any kind. The app currently has one font at varying weights (system sans) throughout every expressive moment: headers, labels, scores, onboarding, auth screens.

**No typographic hierarchy signals advancement or sophistication**
The app targets B1→C1 learners — an educated, motivated demographic who reads literary Spanish. This audience responds to typographic sophistication. The current implementation signals the same visual language as a to-do list app.

### UI Colour Expression

**Orange-only brand expression inside UI**
The app's brand colour appears only in specific functional moments: active nav states, left-border card treatments, progress bars, the submit button, score labels. Everything else is stock `shadcn/ui` Neutral — pure greys. This creates a UI that reads as "grey app with orange accents" rather than as a cohesive branded experience. The brand colour does not create atmosphere; it only marks interactive states.

**Left-border card treatment (wrong genre signal)**
The 4px orange left border on Dashboard cards (`border-l-4 border-l-orange-500`) is a direct visual reference to Notion and Linear — productivity tools. In learning contexts, this pattern signals task management rather than learning progression. It is also applied inconsistently: some cards have it, some don't, with no clear rule governing when the accent appears.

### Summary Scoring (1–5 scale)

| Dimension | Score | Note |
|---|---|---|
| Distinctiveness | 1/5 | Speech bubble + Tailwind orange = anonymous |
| Consistency | 2/5 | Brand colour applied inconsistently |
| Appropriateness for audience | 2/5 | Generic edtech, nothing specific to advanced Spanish |
| Technical execution | 3/5 | SVG is clean; system-font Ñ is a real flaw |
| Typographic sophistication | 1/5 | No type decision made |
| Scalability (icon at 16px) | 2/5 | Three nested layers collapse at small sizes |

---

## Part 2 — Backlog Evaluation & PM Tickets

### Assessment of Existing Brand Tickets

The five tickets added to CLAUDE.md (Brand-A through Brand-E) are correctly scoped and sequenced. Brand-A (naming/wordmark) must precede Brand-B (type system) which must precede Brand-C (icon redesign). Brand-D (colour tokens) can run in parallel with Brand-B. Brand-E (empty states/illustration) is a downstream dependency of all four.

No gaps identified in the ticket structure. Full ticket specifications below.

### Brand-A — App Naming & Wordmark Definition

**Problem**: "Español Avanzado" is a description, not a name. It is also grammatically ambiguous (is it the user who is advanced, or the Spanish?). No wordmark exists — the name is displayed in system sans at 14px with no typographic treatment.

**Decision required before any other brand work**:
1. Is the app name "Español Avanzado" (keep, formalise as wordmark) or something new?
2. If keeping: what is the correct typographic treatment — weight, spacing, case, any accent marks as brand device?
3. If renaming: candidates that encode elevation and cultural specificity (e.g., "Nivel C", "Avanzado", "La Lengua", "Acento") — requires user decision.

**Deliverable**: Final app name + a CSS/font specification for the wordmark that can be implemented without a custom typeface (Google Fonts compatible).

### Brand-B — Typography System (Two-Weight Type Pairing)

**Problem**: System sans-serif at varying weights is the entire type system. No display face, no editorial register, no typographic personality.

**Recommended approach**: Two-typeface pairing using Google Fonts (no hosting cost, no FOUT risk with `font-display: swap`):
- Display face for headers, score labels, module titles: something with personality — e.g., a high-contrast serif (Playfair Display, Cormorant Garamond) or a geometric sans with distinctive character (DM Sans, Plus Jakarta Sans)
- Body/UI face: remain on system-ui for performance, or adopt Inter as explicit choice

**Deliverable**: Specific Google Fonts selection + Tailwind `fontFamily` config + usage rules (which elements use display, which use UI face).

### Brand-C — App Icon Redesign

**Problem**: Speech bubble + nested containers + system-font Ñ = anonymous, poorly scaling icon.

**Dependency**: Brand-A (name/positioning) and Brand-D (colour tokens) must be resolved first so the icon reflects the final brand direction.

**Deliverable**: New `icon.tsx`, `apple-icon.tsx`, and `public/logo.svg` implementing one of the three creative directions defined in Part 3 of this document.

### Brand-D — Colour System with Semantic Tokens

**Problem**: Tailwind orange-500/700 used as primary everywhere. No secondary, no accent, no neutral-warm variant. No cultural rationale.

**Approach**: Define 4–6 brand colour tokens in `globals.css` as CSS custom properties (`--color-brand-primary`, `--color-brand-secondary`, `--color-brand-surface`, etc.) so they can be changed in one place and propagate everywhere. Colours should have cultural rationale tied to Spanish context (Mediterranean palette, terracotta, azulejo blue, parchment, gold).

**Deliverable**: CSS token definitions + Tailwind config mapping + migration guide for replacing hardcoded `orange-*` class references.

### Brand-E — Empty States & Illustration Language

**Problem**: Empty states (no concepts started, no mastered concepts, etc.) use plain text with no visual support. No illustration style has been defined. The app has zero expressive moments beyond functional UI.

**Approach**: Define a consistent illustration language — could be as simple as monoline SVG spot illustrations (2–3 per screen) or a systematic use of large typographic treatments (oversized letterforms, supergraphics). Avoid stock icon libraries; create original or commission original.

**Deliverable**: Style guide for empty states + SVG components for the 3 most common empty states (dashboard new user, curriculum no filter match, progress no data).

---

## Part 3 — Three Creative Directions

---

### Direction 1: The Acute Accent

**Concept statement**: The app teaches advanced Spanish. The defining mark of written Spanish — what distinguishes it typographically from all other Romance languages — is the acute accent. A single tilted stroke. Nothing more. The brand is built from this mark alone.

**Icon composition**:
- Square canvas (1024×1024) with deep terracotta background: `#9B3422`
- No speech bubble. No container. No letterform.
- A single calligraphic acute accent stroke, rendered as a high-contrast cream/parchment SVG path: `#F5EDD8`
- The stroke has weight variation — thick at centre, tapering at both ends — executed as a cubic bezier, not a line segment
- Positioned slightly right of centre, slightly above centre, at ~35° angle
- Occupies roughly 40% of the icon area — confident, not tiny

**Colour palette**:
| Token | Hex | Usage |
|---|---|---|
| Brand Primary | `#9B3422` | CTAs, active states |
| Brand Warm | `#C4522E` | Hover states, progress bars |
| Brand Surface | `#FFF8EE` | Card backgrounds in light mode |
| Brand Accent | `#F5EDD8` | Highlight text, icon stroke |
| Brand Muted | `#6B3020` | Pressed states |

**Wordmark**: "Avanzado" (shortened name) in Cormorant Garamond 600 weight, spaced at `letter-spacing: 0.15em`, all lowercase except the A. The acute accent in the wordmark replaced with the brand stroke colour.

**UI expression**: Replace left-border card treatment with a subtle `before:` pseudo-element acute stroke at card top-left corner. Terracotta appears only in active/highlight moments. Surface cards use warm parchment `#FFF8EE` in light mode.

**Strengths**: Highly distinctive, culturally specific, no competitor uses this. Scales perfectly at any icon size — a single stroke reads at 16px. The accent mark is universally understood as "Spanish" without being a cliché.

**Risk**: Might read as too minimal or too abstract for users who expect "language app" iconography. The terracotta could skew toward Italian/Mediterranean ambiguity.

---

### Direction 2: The Ñ Redesigned

**Concept statement**: The Ñ is the brand's existing differentiator — but it is being rendered in system sans-serif, which destroys its potential. This direction keeps the Ñ as the hero element but builds it in a bespoke high-contrast display serif that makes it unmistakably the brand's own mark.

**Icon composition**:
- Square canvas (1024×1024) with azulejo blue background: `#1B3A6B` (the blue of Spanish ceramic tile, Moorish architecture, the Spanish passport)
- Single oversized Ñ letterform in warm cream `#F2E8D0`, rendered in a high-contrast display serif (Cormorant Garamond or similar) at approximately 70% of icon width
- The tilde (~) above the N is rendered in gold: `#D4A84B` — fractionally thicker than the typeface default, making it a deliberate brand mark
- No container, no bubble, no gradient background. Letter on colour.

**Colour palette**:
| Token | Hex | Usage |
|---|---|---|
| Brand Primary | `#1B3A6B` | CTAs, active states, headers |
| Brand Gold | `#D4A84B` | Accents, scores, tilde mark |
| Brand Cream | `#F2E8D0` | Light mode surfaces, icon letterform |
| Brand Blue Light | `#2E5BA8` | Hover states |
| Brand Muted | `#8BA3C7` | Secondary text on dark bg |

**Wordmark**: "Español Avanzado" in Cormorant Garamond 700 (display) + "Avanzado" in the same face at 400 weight, creating weight contrast within the wordmark. The tilde in "Español" is rendered in `#D4A84B`.

**UI expression**: Blue appears in the sidebar active state and primary buttons. Gold appears in score labels, streak numbers, mastery badges. Cards remain on Neutral with blue left-border treatment in the module/learning context (appropriate: Spanish "azulejo" tiles have a lesson-unit feel). The tilde mark appears as a divider element between sections.

**Strengths**: Azulejo blue has deep Spanish cultural resonance (Talavera ceramics, Moorish Spain, Barcelona architecture). The Ñ in a display serif is ownable — no language app uses a serif Ñ as its icon. High contrast between navy and cream reads extremely well at small sizes.

**Risk**: Blue + gold is the colour pairing of approximately 40% of financial institutions. The cultural reading depends on execution quality — poor font choice collapses it into generic "European elegance."

---

### Direction 3: The Ink Mark

**Concept statement**: The fastest path to B2/C1 is writing. The app is fundamentally a writing and production app — not a multiple-choice quiz machine. This direction makes the act of writing — the ink mark on paper — the brand's visual language.

**Icon composition**:
- Square canvas (1024×1024) with warm off-white background: `#FEFBF4` (not pure white — has warmth)
- A single confident calligraphic stroke in near-black `#1A1108` (warm black, not RGB 000000)
- The stroke is an abstracted letter — could read as a stylised "A" or as a pure gestural mark, depending on viewing distance
- Executed at approximately 45° diagonal, thick downstroke, thin hairline upstroke
- The mark occupies 50–60% of the icon area
- No colour fill. No gradient. Ink on paper.

**Colour palette**:
| Token | Hex | Usage |
|---|---|---|
| Brand Ink | `#1A1108` | Primary text, CTA buttons, icon stroke |
| Brand Paper | `#FEFBF4` | All surface backgrounds |
| Brand Warm Mid | `#8C6A3F` | Secondary UI elements, icons |
| Brand Accent | `#C4522E` | Sparse emphasis: scores, streak, active nav |
| Brand Muted | `#B8AA99` | Disabled states, secondary text |

**Wordmark**: "Avanzado" in DM Serif Display (italic) — a typeface that reads as a confident editorial voice without being stuffy. Kerned tightly, warm black, no additional decoration. Optionally: a fine rule (1px) above the wordmark in warm-mid brown.

**UI expression**: Paper `#FEFBF4` replaces pure white for all card and page backgrounds — creates warmth without colour. The ink mark appears as a section divider motif. Terracotta `#C4522E` used sparingly: streak flame, score 3 sparkle, mastery trophy — never as a background. The app reads as a premium language journal rather than a gamified quiz tool.

**Strengths**: Completely distinct from any language app on the market. Signals editorial quality and intellectual seriousness — perfectly calibrated for the B1→C1 audience. Ink-on-paper metaphor is culturally neutral (no risk of geographic ambiguity). Extremely scalable — the mark reads at 16px, 512px, or printed on a tote bag.

**Risk**: May read as too austere to new users who associate learning apps with playful, colourful design. Requires disciplined application — if the accent colour (`#C4522E`) creeps into too many places, the restraint that makes the direction work is destroyed.

---

## Implementation Sequencing (when the time comes)

1. **Brand-A** — Decide on app name. If keeping "Español Avanzado": formalise. If renaming: do it before any other brand work.
2. **Brand-D** — Define colour tokens from chosen direction. Implement as CSS custom properties in `globals.css`.
3. **Brand-B** — Select Google Fonts pair. Add to `next/font` config + Tailwind `fontFamily`.
4. **Brand-C** — Redesign `icon.tsx`, `apple-icon.tsx`, `src/components/LogoMark.tsx` using bespoke SVG path for the chosen direction's mark. Eliminate `fontFamily: 'sans-serif'`.
5. **Brand-E** — Define empty state illustration style. Create SVG components for top 3 empty states.

**Do not start Brand-C before Brand-A and Brand-D are resolved.** The icon must reflect the final colour system and positioning — premature icon work creates rework.
