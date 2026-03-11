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

3. Typography, Casing & Sizing Rules
Hierarchy
Headers (Custom Serif): Lora

Body & Subtext (Geometric Grotesk): DM Sans

Casing Mandate
Strict Sentence/Title Case: Applied globally across all headers, body copy, and UI labels.

Uppercase Restriction: Wide-tracked uppercase is strictly forbidden for standard labels, form inputs, and headers. It is exclusively reserved for micro-metadata tags (e.g., [ • B2/1 • Subjuntivo ]). Section eyebrow labels (e.g., "Tu Senda Diaria") follow Title Case and are not considered micro-metadata.

Relative Sizing Scale & Leading (rem only)
Hardcoded pixel (px) values are strictly forbidden for typography to ensure fluid scaling. The root is established as text-base (1rem).

text-xs (0.75rem): Micro-metadata and labels.

text-sm (0.875rem): Secondary subtext and UI hints.

text-base (1rem): Standard UI controls and short paragraphs.

text-lg (1.125rem): Primary reading size for pedagogical explanations (Narrative Blocks).

text-xl to text-3xl: Reserved exclusively for Lora headers.

Leading & Tracking:

Headers must use tight leading (leading-tight) with normal or tight tracking to maintain the density of the serif strokes.

Body text must use open leading (leading-relaxed) with standard tracking to ensure maximum legibility for learners reading extended Spanish text.

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

senda_background_magic.svg: An absolute-positioned background trail. Must be set to an ultra-low opacity watermark of 0.03.

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

Data Locking

Key numerical data points (e.g., "18 concepts due") must be weighted in Bold DM Sans to ensure immediate scannability against regular subtext.

7. Layout Architecture & Hidden UI
Card Structure & Gestalt Grouping

Cards act as the primary structural containers. They must utilize ample internal padding (e.g., p-6 or p-8) to let content breathe.

Proximity Rule: Tightly related items (like Email and Password inputs) must be grouped via spatial proximity (gap-4 or gap-6) within the same card. Do not divide related items with SVG separators.

Expandable UI (Accordions & Dropdowns)

Hierarchy Collapse Prevention: When an accordion expands, the expanded children must not share the same visual weight as the parent header.

Indentation & Affordance: Nested items must sit on a slightly indented track. Every clickable parent row must include a subtle right-aligned chevron (>) utilizing Brand Ink (#1A1108) at 30-40% opacity to clearly signal hidden depth.

Modals & Overlays: Modals require a deeper ambient occlusion shadow to communicate Z-index distance: box-shadow: 0 20px 40px -10px rgba(26, 17, 8, 0.15).

Scrims: Background scrims (the dark overlay behind a modal) must utilize a blurred, low-opacity Brand Ink (#1A1108) wash rather than a harsh, solid black.

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