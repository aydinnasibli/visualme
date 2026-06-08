# VisualMe — New Direction (Idea Capture)

This document captures the pivot in direction discussed on 2026-06-07, based directly on answers given in conversation (not assumptions).

## The Pivot

Move away from a fixed catalog of ~19 hardcoded visualization "types" (each with bespoke render/customization code) toward an **AI-driven, spec-based generation system**: the AI composes a declarative chart specification (e.g., an ECharts `option` JSON) from primitives — marks, encodings, series, styling — rather than picking from a closed enum. This removes the structural ceiling that's been making the existing "refine" feature unreliable, and opens the door to a much larger and more flexible visual vocabulary (including specialized chart types like Gantt, Sankey, treemap, network graphs).

Rendering engine direction: **Apache ECharts** (Apache 2.0 license — free for commercial use), chosen for its broad native chart-type coverage, single declarative JSON schema (good fit for AI generation), and existing ecosystem of AI-to-ECharts tooling.

## Target User

**General public** — not a niche of data professionals or researchers. The emphasis is on people who want a result that looks genuinely good (**"general public but nice visual"**), not a power-user analytics tool. This shapes everything downstream: the product should feel approachable and the output should look premium, not like a default chart-library export.

## Core Differentiation / Positioning

**"Beautiful + on-brand"** is the #1 selling point — chosen explicitly over "smart + statistically trustworthy" or "effortless end-to-end" as the primary pitch (though those remain part of the long-term vision; see below). The product's core promise is: *visuals that look like they belong to your brand/your product*, not generic AI-startup chart output.

This directly addresses the competitive concern raised earlier: "AI turns your data into a chart" is already commoditized (ChatGPT Advanced Data Analysis, Julius AI, Polymer, BI copilots, etc.). What's comparatively rare is a tool that treats the *visual craft and personalization* of the output as the central feature rather than an afterthought.

## What Users Should Be Able to Customize

Confirmed in scope for the personalization/branding layer:
- **Color palette / theme** — brand colors, gradients, light/dark variants
- **Typography** — fonts, sizes, weights across titles, labels, legends
- **Layout & composition** — spacing, chart size/aspect ratio, legend/label placement, annotations

(Export/branding assets — logos, watermarks, PNG/SVG/PDF export — was *not* selected as in-scope for this pass; revisit later if it comes up.)

## Statistical / Analytical Layer

**Confirmed: a core feature for the eventual product**, not a throwaway idea — but explicitly *not* the first priority to build (see MVP below).

Important constraint carried over from earlier discussion: actual statistical computations (t-tests, p-values, ANOVA, regression, etc.) **must be computed in code via a real statistics library**, not delegated to the LLM's own "reasoning" — LLMs are unreliable at exact numerical/statistical computation and will produce plausible-but-wrong numbers. The intended flow is: parse data → run real computations in code → feed verified numeric results to the AI → AI builds the visualization (with annotations, error bars, significance markers, etc.) around real numbers.

## Data Input Methods (in scope)

- **File upload** (CSV / Excel / JSON / PDF, etc.) — partially built already (existing 10MB limit)
- **Plain-language prompt only** — user describes what they want in words; AI generates/visualizes from that description
- **Paste / manual entry** — user pastes raw text/table data directly into the app

(Live external connections — DB/API/Sheets — was *not* selected as in scope for now.)

## Monetization

**Pure subscription, no free tier** (possibly with a trial period — not yet specified). This is a deliberate choice to position the product as a paid, premium tool from day one rather than freemium or usage-based credits.

## MVP Priority

Of the three pillars of the "smart pipeline" (visual rendering & branding / statistical computation / AI orchestration & chart selection), the confirmed first priority is:

**Visual rendering & branding** — get the ECharts integration and the theming/customization layer right first. Make outputs genuinely good-looking and on-brand before investing in the statistical computation layer or deeper AI orchestration intelligence. This aligns with the "beautiful + on-brand" positioning being the lead differentiator.

## Open Questions / Not Yet Decided

- Trial period details for the subscription model
- Whether/when to bring export & branding-asset features (logos, watermark, multi-format export) into scope
- Specific statistical tests to prioritize once that layer is built
- Whether live data connections (DB/API/Sheets) become relevant later
