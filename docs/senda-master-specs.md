Senda Brand Design Master Spec
Version: 1.0.0
Core Aesthetic: Senda Craft (Vellum & Ink)

This document explains guidelines for how we want to design brand language and UX of our App.

1. Core Philosophy & Aesthetic
The Senda interface operates on a strict "Vellum & Ink" metaphor, avoiding the rigid, boxy containers typical of generic SaaS applications in favor of an Organic Spatial Architecture.

The Vellum: The environment acts as a continuous sheet of premium paper.

The Stack: UI elements are layered utilizing depth, padding, and soft ambient shadows rather than harsh CSS borders.

The Journey: Backgrounds feature a layered stack incorporating a winding path SVG, visually anchoring the pedagogical journey of language acquisition.

2. The Color System
All UI elements must strictly adhere to this exact hex palette.

Brand Ink (#1A1108): Primary Typography, Icons, and Shadow Base.
Brand Paper (#FDFCF9): Main Background Surface.
Brand Terracotta (#C4522E): Primary CTAs and Micro-tag dots.
Brand Warm (#8C6A3F): Secondary Accents and Navigation states.
Brand Muted (#B8AA99): Subtext, Placeholders, and Disabled states.
Dark Cream (#E8E6E1): Indented Form Fills and Secondary Tags.

Contrast Note: Brand Muted (#B8AA99) does not meet WCAG AA contrast on Brand Paper. It is acceptable for placeholder text, disabled states, and decorative labels. For subtext that must be readable (e.g., exercise instructions, hint copy), use Brand Warm (#8C6A3F) which meets the 4.5:1 threshold.

Semantic Feedback Colours

These are functional signals, not brand accents. They are reserved exclusively for transient exercise feedback and form validation — never for static UI or branding.

Correct: Green wash (e.g., oklch(0.97 0.05 145)) — used in flash animations only.
Incorrect: Red wash (e.g., oklch(0.97 0.05 20)) — used in flash animations only.
Partial/Accent Error: Orange/amber wash (e.g., oklch(0.97 0.05 75)) — used for near-miss feedback.

These must never appear as persistent backgrounds, borders, or text colours.

## 3. Typography, Casing & Sizing Rules
Hierarchy & Brand Authority

Headers (Editorial Serif): 'Lora'

Role: High-contrast "Ink" strokes for structural authority. Lora was chosen over DM Serif Display for its superior italic quality, optical size range down to text-base (16px), and full weight axis (400–700) — DM Serif Display is single-weight (400) which causes faux-bolding.

Mandate: Must be rendered in Brand Ink (#1A1108). Weight: 600 (semi-bold). Style: italic. Tracking: normal.

Body & UI Controls (Geometric Grotesk): 'DM Sans'

Role: Clean workhorse for all instructional and interactive text.

Mandate: Primary Labels (e.g., "Nombre") must use Weight 500 (Medium). Body text uses Weight 450.

The Senda Sizing Scale (REM Only)
Hardcoded pixel values are strictly forbidden. All sizes must follow this relative scale:

text-xs (0.75rem): Micro-metadata and tags.

text-sm (0.875rem): Primary Labels and UI Hints. (Must be weight 500/Medium for contrast).

text-base (1rem): Standard UI controls, inputs, and short paragraphs.

text-lg (1.125rem): Narrative blocks and pedagogical explanations.

text-xl (1.25rem): Card titles and secondary page sections (Lora).

text-2xl (1.5rem): Standard Page Titles (Lora).

text-3xl (1.875rem): Hero Headers (e.g., "Hola, Nicolas").

Casing, Leading & Contrast

Casing: Strict Sentence/Title Case globally. Uppercase is strictly reserved for metadata tags.

Leading: Headers use leading-tight. Body text uses leading-relaxed for maximum legibility.

The Ink Protocol (Contrast): All structural headers and page section labels must use Brand Ink (#1A1108). Utilizing Brand Warm or Muted for structural text is prohibited to ensure a minimum 7:1 contrast ratio against the Vellum.

4. Surface & Elevation (The "Lift")
The "Paper Stack" Layout
- Standard CSS borders (border-gray-200, border-b, etc.) are prohibited for structural containers. Content separation must rely entirely on spatial padding, custom SVG paths, and elevation.
- Ambient Occlusion Shadow: Apply a wide, soft shadow using the Brand Ink base (RGB: 26, 17, 8).
- Standard Card Formula: box-shadow: 0 10px 30px -10px rgba(26, 17, 8, 0.08).

Skeleton Loading

Loading placeholders must use a faint Brand Ink tint (5% opacity in light mode, 7% Brand Paper in dark mode) with a gentle opacity pulse (1.4s ease-in-out, no scale transform). Grey or blue shimmer effects are prohibited.

5. Iconography & SVGs
Standard Iconography System

Library Sourcing: All standard UI icons must be sourced from a consistent, stroke-adjustable library (e.g., Lucide or Phosphor). Solid-fill icons or heavy, pre-styled SVGs are strictly prohibited.

Color & Stroke: Must inherit Brand Ink (#1A1108). Base stroke weight is strictly 1.5px to mimic calligraphic ink. This may scale to 2px only if required to maintain WCAG contrast on smaller mobile viewports.

Sizing & Alignment: > * Structural/List Icons: Must utilize a strict 24x24px bounding box (e.g., w-6 h-6) to ensure perfect vertical alignment across list items.

Inline Icons: Must scale relative to the surrounding text size (e.g., w-1em h-1em).

Functional Affordance

Chevrons: Clickable parent rows (accordions, page links) must include a right-aligned chevron (>). This specific functional icon must utilize Brand Ink (#1A1108) at 30-40% opacity to stay subtle and avoid competing with the text.

Proprietary SVG Registry

senda_background_magic.svg: An absolute-positioned background trail. Opacity is controlled by the adaptive CSS token `--d5-magic-opacity` (0.03 light, 0.05 dark). Do not hardcode opacity props — let the token handle light/dark adaptation.

senda_path_separator.svg: A structural divider. Restricted to dividing macro-sections (e.g., separating entirely different functional blocks). It must never be used between tightly coupled elements like adjacent form inputs.

6. Component UX Rules
Button Hierarchy & States

Primary Action: Solid Brand Terracotta (#C4522E) background with Brand Paper (#FDFCF9) text. Reserved exclusively for the core daily habit loop.

Secondary Actions: Outline style. Transparent background, 1.5px Brand Terracotta border, and Brand Terracotta text.

Interaction: Secondary outline buttons must utilize a bg-[#C4522E]/10 (Brand Terracotta at 10% opacity) fill on hover/active states for haptic-visual feedback.

Forms & Inputs

Forms & Inputs: Input fields must not use harsh borders or bottom underlines. Apply a faint background fill utilizing Dark Cream (#E8E6E1) instead.

Metadata Tags

Micro-tags must use the exact structural format: [ • B2/1 • Subjuntivo ]

The separator dot must be rendered at 4px utilizing the Brand Terracotta (#C4522E) color.

Level Chips (B1 / B2 / C1)

The CEFR level chip displayed on the dashboard, account page, and curriculum must always use a fixed Warm Yellow (#fef9c3) background — regardless of level (B1, B2, or C1) and regardless of light/dark mode. Text colour must remain Brand Ink (#1A1108) for contrast. Per-level colour differentiation (green/amber/purple) is removed in favour of a single, unified chip treatment.

Data Locking

Key numerical data points (e.g., "18 concepts due") must be weighted in Bold DM Sans to ensure immediate scannability against regular subtext.

7. Layout Architecture & Hidden UI
Vertical Rhythm & Spatial Gaps
To prevent "UI Collapse," the spacing between elements must follow a strict hierarchical rhythm:

Macro-Section Gaps: Space between major distinct modules (e.g., separating "Perfil" from "Seguridad"): gap-y-12 (3rem). This provides the "editorial breath" needed for clarity.

Header-to-Content Gaps: Space between a Section Header and its first input/element: gap-y-2 (0.5rem). This keeps the header tightly coupled with its content.

Standard Component Gaps: Space between individual inputs or secondary rows: gap-y-6 (1.5rem).

Card Structure & Gestalt Grouping
Structural Containers: Cards are the primary containers. They must utilize ample internal padding (p-6 or p-8) to prevent content from crowding the edges.

Proximity Rule: Tightly related items (like Email and Password inputs) must be grouped via spatial proximity (gap-y-4) within the card. Do not divide related items with SVG separators.

Expandable UI (Accordions & Dropdowns)
Hierarchy Collapse Prevention: When an accordion expands, the children must not share the same visual weight as the parent. Children must utilize DM Sans at a smaller size or lighter opacity to ensure the parent header remains the focal point.

Indentation & Affordance: Nested items must sit on a slightly indented track. Every clickable parent row must include a subtle right-aligned chevron (>) utilizing Brand Ink (#1A1108) at 30-40% opacity to clearly signal depth without competing with the label.

Modals & Overlays
Elevation Mapping: Modals require a deeper ambient occlusion shadow to communicate Z-index distance from the Vellum: box-shadow: 0 20px 40px -10px rgba(26, 17, 8, 0.15).

Scrim Protocol: Background scrims (the dark overlay) must utilize a blurred, low-opacity Brand Ink (#1A1108) wash. Pure black or high-opacity overlays are prohibited as they destroy the "Paper Stack" aesthetic.

8. Motion & Transitions
The Kinetic Identity
Senda's animations must feel like paper sliding or ink appearing. They must be smooth, deliberate, and grounded. Spring, bounce, or elastic physics are strictly prohibited.

Speed & Easing: All interactive transitions (hover states, color fades) must use a standard duration of 200ms (duration-200) and an ease-out timing function.

Structural Motion: Modals, accordions, and page transitions should use a slightly longer 300ms duration (duration-300) to allow the user's eye to track the spatial change.

Reduced Motion: When the user's system preference is prefers-reduced-motion: reduce, all non-essential animations (page transitions, flash feedback, skeleton pulses) must be suppressed or replaced with instant state changes. Essential state indicators (e.g., a loading spinner) may remain.

9. Spacing Rhythm & Accessibility
The Spatial Grid

Base-4 Enforcement: All margins, padding, and gaps must align to a strict 4pt/8pt grid (Tailwind's default spacing scale: 4, 8, 12, 16, 24, 32px). Arbitrary spacing values (e.g., 17px or mb-[13px]) are forbidden.

Touch Targets: All interactive elements (buttons, links, toggles, tappable rows) must maintain a minimum touch target of 44×44px, regardless of visual size. If the visible element is smaller (e.g., an icon button), expand the tappable area with padding or an invisible hit zone.

Typographic Line Length: To ensure maximum reading comprehension for language learners, extended text blocks (Narrative Explanations, Articles) must be constrained to a comfortable reading width. Apply max-w-prose (approx. 65 characters) to body text containers to prevent eye fatigue on larger screens.

Focus States (A11y)

Default browser focus rings (the bright blue outline) must be suppressed globally.

Custom Focus Ring: When navigating via keyboard, interactive elements must receive a 2px solid outline utilizing Brand Terracotta (#C4522E), coupled with a 2px offset. Light mode: focus-visible:ring-offset-[#FDFCF9] (Brand Paper). Dark mode: focus-visible:ring-offset-[#1A1108] (Brand Ink).

Section 10: Night Journal Protocol (Dark Mode)

10.1 Semantic Mapping Logic
Senda utilizes a semantic color system for Dark Mode. To maintain the "Night Journal" aesthetic, engineers must adhere to the following functional inversions:

Primary Background: Use Brand Ink (#1A1108). This replaces the Brand Paper base.

Elevated Card Surface: Use Custom Dark Card (#241910). This creates the "Paper Stack" depth against the darker background.

Primary Typography: Use Brand Paper (#FDFCF9). This ensures high-contrast readability, acting as "Light Ink/Chalk."

Secondary Typography: Use Brand Muted (#B8AA99). Used for subtext and hints.

Primary CTA: Maintain Brand Terracotta (#C4522E).

Indented Fills (Forms): Use Brand Ink (#1A1108) at 40% opacity. This creates a "sunken" effect into the dark surface.

10.2 Elevation & Depth

The Stack Inversion: In Dark Mode, depth is communicated by lightening the surface relative to the background. The primary background is the darkest layer (#1A1108), while cards resting "on top" must use the slightly warmer/lighter #241910.

Shadows: Ambient occlusion shadows must shift to a deeper black with higher opacity to remain visible: box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.4).

10.3 SVG & Visual Artifacts

The Magic Trail: The senda_background_magic.svg must switch its stroke/fill to Brand Warm (#8C6A3F) with a global opacity of 0.05.

Separators: Section dividers (senda_path_separator.svg) must utilize Brand Muted (#B8AA99) at 15% opacity.

10.4 Interaction States

Hover States: Secondary outline buttons in Dark Mode should utilize a subtle Brand Paper (#FDFCF9) ghost fill at 5% opacity on hover to provide tactile feedback without over-brightening the UI.