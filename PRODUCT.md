# Product

## Register

product

## Users

Mixed: data professionals/analysts who generate visualizations frequently as part of reporting workflows, and generalist knowledge workers (PMs, founders, marketers, researchers) who drop in occasionally to turn an idea or a spreadsheet into something presentable without learning a charting tool. The dashboard has to stay dense and fast for the former — including composing several charts into a shareable Dashboard — without intimidating the latter. Public-facing surfaces (landing, share links) are often a casual user's first and only touchpoint.

## Product Purpose

VisualMe turns a description, a pasted table, or an uploaded file (CSV/JSON) into one of 19 ECharts-backed visualization types — chosen automatically by AI, or forced via the type/variant gallery. The first result is a starting point, not a final answer: every follow-up message in the same thread refines the existing chart in place (re-type, restack, annotate, recolor, filter), so the product is positioned as a conversation, not a one-shot generator — "most tools give you one shot, VisualMe gives you a conversation." A separate branding/theme layer (palette, typography, spacing, legend placement, corner radius) restyles any chart instantly without touching its data or structure — "beautiful and on-brand" is the core differentiator against commodity "AI makes you a chart" tools. Real statistical tests (t-test, ANOVA, chi-square, Pearson correlation) run via a deterministic stats library against the user's actual data, not LLM-estimated, and surface as a copyable "verified result" next to the chart. A chart isn't limited to a one-time upload — connecting a live Google Sheet keeps its data refreshing on an interval and can drive a weekly email digest, so it stays current without manual regeneration. Visualizations save to a history, can be composed into multi-chart Dashboards, and exported/shared (PNG, PDF, JSON, CSV, HTML, link). Success is a user going from "I have an idea or a spreadsheet" to "I have a chart that looks like mine" in under a minute — then trusting the conversation enough to keep refining instead of starting over.

## Brand Personality

Sharp, expressive, distinctive — and as of the June 2026 redesign, actually executed rather than aspirational. The system replaced the generic dark-SaaS default (slate/zinc neutrals, three competing purples, glassmorphism everywhere, one display typeface doing every job) with: a single cool neutral family (slate-blue, oklch hue 252) spanning light and dark mode at inverted lightness; one deliberate warm-copper accent (oklch hue 55) chosen explicitly away from "generic AI indigo"; flat surfaces with hairline borders instead of blur, reserving elevation effects for things that actually float over content; and two typographic voices — Space Grotesk for headline/display moments only, system sans for dense UI, labels, and data, so the tool "disappears into the task." Voice is direct and unpretentious: it shows the result, it doesn't oversell it.

## Anti-references

**Resolved, do not reintroduce:** the pre-redesign build — a slate-900 background with a separate zinc neutral family running in parallel, three competing accent purples (indigo-500/violet-500/purple-500) with no assigned roles, `backdrop-filter: blur` glass-panel treatment as the default elevation for every card/button/input, and Space Grotesk inherited onto the entire `<body>` so it carried dense forms and data alongside headlines. This was the documented "Default Dark" template look (see DESIGN.md) and has been replaced — don't let any of it creep back in piecemeal (e.g. a new component reaching for `bg-zinc-800`, `backdrop-filter`, or `text-indigo-400` out of habit).

**New risk to watch:** the chart-facing Theme Panel deliberately offers users brand palette presets that *include* indigo/violet/purple (Indigo, Berry, etc.) for their own charts — that's correct and expected. Keep that user-data layer visually separate from the product's own UI chrome (slate-blue + copper); don't let a user's chosen chart palette bleed into navigation, buttons, or panels, and don't let the product chrome quietly drift back toward those hues just because they're "already in the palette."

**Not yet migrated — a known gap, not a regression:** the redesign above covers the dashboard, builder, saved-page shell, settings, and landing (the screens named in Design Principles below). The public share views (`SharedVisualizationView`, `SharedDashboardView`), the visualization modal opened from Saved, sign-in/sign-up, and the admin dashboard still run the pre-redesign slate/zinc/indigo + glass-panel look described above almost verbatim. Share links and sign-up are exactly the "casual user's first and only touchpoint" surfaces called out in Users above — finishing the migration there is the highest-leverage remaining work, not a nice-to-have. Don't read "Resolved" above as "done everywhere."

## Design Principles

- **The product proves the pitch**: a visualization tool whose own UI has no visual point of view is not credible. Every screen should look like it was designed by people who care about how information is presented.
- **The conversation is the product**: the chart is never "done" on the first response — the refinement thread (re-type, restyle, annotate, filter via plain English) is the primary interaction model, not a fallback. The thread/composer UI deserves the same craft as the chart canvas itself.
- **Branding is a layer, not a regeneration**: palette, typography, and layout changes apply instantly and independently of chart structure/data. The Theme Panel should feel like a live, low-friction dial — not a form you submit and wait on.
- **Density without intimidation**: serve the power user's need for speed and information density (Figma-grade execution rigor: deliberate spacing, weight, alignment, hierarchy) while keeping entry points calm enough for a first-time visitor.
- **Consistency over novelty per-screen**: rigorous, repeatable spacing/type/color decisions across dashboard, builder, saved, settings, and landing — not a different idea per page.
- **Show, don't sell**: real ECharts output and real product moments (the hero mockup, the chart-type showcase) carry the visual weight on the landing page; minimize generic marketing scaffolding.

## Accessibility & Inclusion

Standard good practice (sufficient contrast, keyboard reachability, respecting reduced-motion) is the bar, not a blocker for shipping design changes. With light and dark mode both live via the oklch token pairs in `app/globals.css`, contrast checks need to hold in *both* modes, not just the dark mode the product originally shipped with.
