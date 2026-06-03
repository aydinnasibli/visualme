---
name: project-overview
description: VisualMe platform overview — stack, features, known patterns
metadata:
  type: project
---

**VisualMe** is an AI-powered visualization platform that converts natural language into 19 professional diagram types.

**Stack**: Next.js (App Router), React 19, TypeScript, OpenAI (gpt-4o-mini / gpt-4o), MongoDB/Mongoose, Clerk auth, Tailwind CSS v4, Framer Motion, Sonner toasts, Recharts, ReactFlow, Markmap, D3, Vis-Timeline.

**19 Visualization types**: network_graph, mind_map, tree_diagram, timeline, gantt_chart, animated_timeline, flowchart, sankey_diagram, swimlane_diagram, line_chart, bar_chart, scatter_plot, heatmap, radar_chart, pie_chart, comparison_table, parallel_coordinates, word_cloud, syntax_diagram.

**Architecture**:
- `app/dashboard/(playground)/page.tsx` — main playground (session-based, VizThread + FocusPanel)
- `components/dashboard/VizThread.tsx` — left panel: session thread list + input
- `components/dashboard/FocusPanel.tsx` — right panel: viz display + edit panel slide-in
- `components/dashboard/EditPanel.tsx` — AI chat + manual JSON edit tabs
- `lib/actions/visualize.ts` — all server actions (generate, save, expand, edit, delete)
- `lib/services/visualization-generator.ts` — OpenAI calls per viz type + VisualizationGeneratorService
- `lib/services/format-selector.ts` — AI selects best viz format from 19 options
- `lib/utils/tokens.ts` — token system (free: 100/mo, pro: 2000/mo)

**Token costs**: Generate=10, Edit=8, Expand=5, Export=1.

**Known patterns**:
- `sanitizeVisualization()` in helpers.ts converts Mongoose docs to plain objects for serialization
- All server actions validate inputs via `lib/utils/validation.ts`
- `<Toaster />` is in root layout (`app/layout.tsx`) — needed for all toast() calls to render

**Why:** Full audit performed 2026-06-03 — fixed 8 bugs across the codebase.
