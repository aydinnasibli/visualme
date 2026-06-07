---
name: VisualMe
description: AI-powered visualization platform that turns plain-English prompts into diagrams
colors:
  surface-base: "#0f172a"
  surface-card: "#1e293b"
  surface-card-alt: "#18181b"
  surface-deep: "#09090b"
  border-subtle: "rgba(255,255,255,0.08)"
  border-zinc: "#27272a"
  primary-indigo: "#6366f1"
  primary-indigo-hover: "#4f46e5"
  accent-violet: "#8b5cf6"
  accent-purple: "#a855f7"
  text-primary: "#f8fafc"
  text-secondary: "#94a3b8"
  text-muted-zinc: "#71717a"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-indigo}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-indigo-hover}"
  glass-panel:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: VisualMe

## 1. Overview

**Creative North Star: "The Default Dark"**

This document captures the system as it exists today, a snapshot of "before," not a spec to extend. It is the out-of-the-box dark SaaS template look applied without a unifying point of view: a slate-900 base, an indigo accent borrowed from the Tailwind palette, glass-panel blur on every elevated surface, and Space Grotesk dropped onto headings because it reads as "modern." None of these were wrong choices in isolation. The problem is that no one decision was made in relation to the others, so the system never cohered into something that looks like VisualMe rather than any other AI-tool starter.

The clearest symptom is the gray scale: `slate` and `zinc` are both in active use across the same screens, sometimes on adjacent elements, alongside three different purples (`indigo-500`, `violet-500`, `purple-500`) that aren't differentiated by role. Buttons, cards, and panels are templated and interchangeable: the same glass-card-with-blur treatment appears regardless of what it contains or what the user is trying to do there, so nothing on screen is purpose-built. This is exactly what PRODUCT.md names as the problem to solve: not a single bad color choice, but inconsistent execution that reads as assembled rather than designed.

**Key Characteristics:**
- Two competing neutral scales (`slate` and `zinc`) used interchangeably with no rule for which applies where
- Three accent purples (`indigo-500`, `violet-500`, `purple-500`) doing the same job in different places
- Glassmorphism (`backdrop-filter: blur`) as the default elevation strategy for nearly every surface
- Space Grotesk applied inconsistently: present in the theme, used in exactly one class across the codebase
- No shared button/card/input components; each screen reimplements its own version of the same primitives

## 2. Colors

The palette reads as "Tailwind defaults, mostly untouched": built-in slate, zinc, and indigo swatches stacked together with no custom hues and no rule governing which neutral or which purple applies where.

### Primary
- **Indigo Borrow** (#6366f1 / indigo-500): The most-used accent (60 occurrences of `bg-indigo-500`, 64 of `text-indigo-400`). Functions as the de facto primary, but competes directly with violet and purple elsewhere for the same "interactive accent" role.

### Secondary
- **Violet Drift** (#8b5cf6 / violet-500): Appears in resize handles, placeholders, and scattered accents (`rgba(139, 92, 246, ...)` hardcoded directly in CSS rather than as a token). Visually adjacent to the primary indigo, so the two blur into each other rather than reading as distinct roles.

### Tertiary
- **Purple Overflow** (#a855f7 / purple-500): A third accent in the same family, used in 9-16 places with no clear rule distinguishing it from indigo or violet. Three near-identical purples doing one job is the palette's clearest "borrowed, not designed" tell.

### Neutral
- **Slate Base** (#0f172a / slate-900): The page background (`--background`), paired with slate-800 (#1e293b) for elevated surfaces.
- **Zinc Overlay** (#18181b / zinc-900, #27272a / zinc-800): A second, nearly-identical dark neutral family used in parallel with slate across the same component types (33 uses of `bg-zinc-800` versus 57 of `bg-slate-800`), with no documented rule for when one applies over the other.
- **Text Hierarchy** (#f8fafc text-primary, #94a3b8 text-secondary, #71717a zinc-500 muted): Three steps of gray-on-dark text, drawn from two different neutral families, so contrast ratios and "how muted is muted" drift between screens.

### Named Rules
**The Two-Scale Problem.** `slate` and `zinc` are both load-bearing neutral families in this codebase. Wherever you touch a surface, check which scale its siblings use before adding a third option; do not introduce a fourth neutral family.

## 3. Typography

**Display Font:** Space Grotesk (with sans-serif fallback), declared in `@theme` as `--font-display` but applied via `font-display` in exactly one place in the codebase.
**Body Font:** the Tailwind default sans stack (`ui-sans-serif, system-ui`), inherited rather than chosen.
**Label/Mono Font:** `font-mono` (default monospace stack), used 10 times for token counts, IDs, and code-like values.

**Character:** There is no real pairing here. Space Grotesk was selected as a "display" identity but never committed to: the rest of the interface runs on whatever Tailwind ships by default, so headings and body text don't feel like they belong to the same typographic family.

### Hierarchy
- **Display** (700, ~1.5rem, 1.2 line-height): Reserved in theme for hero/heading moments but barely present in shipped UI; Space Grotesk's geometric character isn't actually visible anywhere a user would notice it.
- **Body** (400, 0.875rem, 1.5 line-height): The default sans stack at a fairly small size; carries nearly all UI text including labels, descriptions, and prose content.
- **Label** (500, 0.75rem, 0.02em letter-spacing, monospace): Used for tokens, counts, IDs; the one place a distinct typographic voice actually shows up.

### Named Rules
**The Declared-But-Unused Rule.** A typeface can be declared in the theme and still be functionally absent from the product. Space Grotesk exists in `--font-display` but appears in one class across the entire codebase; a token that isn't applied isn't a system, it's a placeholder.

## 4. Elevation

The system leans on glassmorphism as its default and effectively only elevation strategy: `.glass-panel` and `.glass-button` utility classes apply `backdrop-filter: blur()` plus a translucent surface fill and hairline border to nearly any raised element, regardless of whether that element needs to read as "floating over content" or simply "a distinct region." There is no tonal-layering alternative and no flat-by-default baseline; blur is reached for by reflex.

### Shadow Vocabulary
- **glass-panel** (`background: rgba(25,33,46,0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08)`): The default "elevated surface" treatment, applied broadly.
- **glass-button** (`background: rgba(255,255,255,0.05); backdrop-filter: blur(4px)`): The default interactive-surface treatment; functionally a lighter-weight repeat of `glass-panel`.
- **shadow-2xl / shadow-lg / shadow-xl** (Tailwind defaults, 15 / 10 / 3 occurrences): Layered on top of glass surfaces in some places, producing double-elevation (blur plus shadow) without a stated reason for when one, the other, or both apply.

### Named Rules
**The Reflex Blur Rule.** Glassmorphism is currently the answer to "how should this surface stand out," applied without asking whether the surface needs to feel layered over moving content (its only legitimate use) or simply distinct from its neighbor (which a flat fill and a 1px border accomplish without the performance cost of `backdrop-filter`).

## 5. Components

No shared button, card, or input components exist; `grep` for component files turns up a single one-off (`DeleteVizButton`). Every screen reimplements its own version of these primitives with its own combination of the tokens above, which is the direct mechanism behind "templated and interchangeable": the visual language repeats because everyone copies the nearest example, not because there's a system to draw from.

### Buttons
- **Shape:** `rounded-lg` (8px) is the most common radius (98 occurrences), but `rounded-xl` (16px, 73 occurrences) and `rounded-full` (80, mostly icon/pill buttons) appear at comparable frequency with no rule distinguishing when each applies.
- **Primary:** `bg-indigo-500` / `bg-indigo-600` with white text; padding and exact radius vary by file.
- **Hover / Focus:** `.glass-button` provides one hover pattern (`background: rgba(255,255,255,0.1)`); plain Tailwind buttons elsewhere use `hover:bg-indigo-600` or similar ad hoc rules. No shared focus-ring treatment.
- **Secondary / Ghost:** Approximated ad hoc with `bg-zinc-800` or `bg-slate-800` plus a border; which gray family applies depends on which file you're in.

### Cards / Containers
- **Corner Style:** `rounded-xl` (16px) or `rounded-2xl` (24px), inconsistently.
- **Background:** `.glass-panel` (`rgba(25,33,46,0.7)` + blur) is the default; some surfaces use flat `bg-slate-800` or `bg-zinc-900` instead, with no stated rule for which gets the glass treatment.
- **Shadow Strategy:** See Elevation; blur and Tailwind shadow utilities are sometimes combined.
- **Border:** `1px solid rgba(255,255,255,0.08)` on glass surfaces; `border-zinc-700` / `border-zinc-800` on flat ones.
- **Internal Padding:** Varies file to file; no documented scale.

### Inputs / Fields
- **Style:** Dark fill (`bg-slate-800` or `bg-zinc-900`, depending on the file), thin border, `rounded-lg`.
- **Focus:** Indigo ring (`ring-indigo-500`) appears in 4 places; many inputs have no visible focus treatment at all.

### Navigation
- Sidebar and top-nav surfaces use the same `.glass-panel` treatment as content cards, so navigation chrome doesn't read as structurally distinct from the content it contains.

### Prose / Markdown Content
- **Style:** A dedicated `.prose` block sets its own gray scale (`#d6d3d1`, `#f5f5f4`, `#fafaf9`, drawn from `stone`, a fourth neutral family) and its own link color (`#60a5fa`, `blue-400`, a fifth accent hue), independent of every token declared elsewhere. This is the most isolated subsystem in the codebase.

## 6. Do's and Don'ts

This baseline is being actively replaced. The list below documents what to stop doing, drawn directly from PRODUCT.md's anti-references: the slate-900-and-indigo "AI startup" template look, glass-panel blur cards, gradient buttons, Space Grotesk applied without commitment, and inconsistent execution across pages.

### Do:
- **Do** pick one neutral family (`slate` or `zinc`, not both) before touching any surface, and migrate its neighbors to match rather than adding a third option.
- **Do** collapse the three competing purples (`indigo-500`, `violet-500`, `purple-500`) into a single deliberate accent with named roles, per PRODUCT.md's call for visual confidence and a real point of view.
- **Do** treat `.glass-panel` / `.glass-button` as defaults to question, not defaults to extend; reach for a flat fill plus a hairline border first and reserve blur for surfaces that genuinely float over moving content.
- **Do** either commit to Space Grotesk as a real display voice (used where display type actually appears) or remove it; a declared-but-unused token is worse than no token.

### Don't:
- **Don't** add a sixth color to a palette that already has five competing near-duplicates (two neutral families, three accent purples); subtract before adding.
- **Don't** reach for `backdrop-filter: blur` as the default answer to "how do I make this stand out." That is the single most repeated "AI slop" tell across these screens.
- **Don't** build another one-off button, card, or input. The fact that `DeleteVizButton` is the only named component in the codebase is the root cause of "templated and interchangeable"; new screens should draw from a shared set, not add another local variant.
- **Don't** let `.prose` keep its own isolated palette (`stone` grays, `blue-400` links). Fold it into whatever single neutral and accent system replaces the current mix.
