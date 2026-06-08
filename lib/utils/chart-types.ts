// ============================================================================
// CHART TYPE GALLERY — canonical catalog
//
// Source of truth for the "choose a chart type" picker. Each entry maps a
// human-facing name to the underlying ECharts series `type` so a selection
// can both (a) render a representative icon in the gallery and (b) be turned
// into an explicit instruction that overrides the AI's own type judgment for
// that one request. The `tuned` flag marks types that already have baseline
// interaction/emphasis defaults in chart-defaults.ts (SERIES_DEFAULTS) — those
// render most consistently since AI gaps are backfilled in code.
//
// Many types also carry `variants` — well-known stylistic forms of that same
// series (e.g. a bar chart can be vertical, horizontal, stacked, or grouped).
// Variants don't change the ECharts `series.type`; they change how the AI
// shapes the option (orientation, stacking, layout) — so each variant carries
// its own `instruction` fragment appended to the forced-type instruction.
//
// Catalog mirrors the categories in the official ECharts examples gallery
// (https://echarts.apache.org/examples/en/index.html): basic charts, statistical
// charts, and graph/hierarchy/flow charts.
// ============================================================================

export interface ChartTypeVariant {
  /** Stable slug, also shown alongside the type name in the selection chip. */
  value: string;
  /** Human-facing variant name shown in the variant picker and the chip. */
  label: string;
  /** One-line description of how this variant differs from the base form. */
  description: string;
  /** Instruction fragment appended to the forced-type instruction — tells the AI exactly how to shape this variant. */
  instruction: string;
}

export interface ChartTypeOption {
  /** ECharts series `type` — what gets injected into the forced-type instruction. */
  series: string;
  /** Human-facing name shown in the gallery and the selection chip. */
  label: string;
  /** One-line description of what the chart type is best at. */
  description: string;
  /** Lucide icon name — resolved to a component by the gallery/chip via ICONS_BY_NAME. */
  icon: string;
  /** Has baseline interaction/emphasis defaults in chart-defaults.ts — renders most consistently. */
  tuned: boolean;
  /** Well-known stylistic forms of this series — selecting the type first routes to a variant picker when present. */
  variants?: ChartTypeVariant[];
}

/** A finalized choice from the gallery — a type, optionally narrowed to one of its variants. */
export interface ChartSelection {
  type: ChartTypeOption;
  variant?: ChartTypeVariant;
}

const BAR_VARIANTS: ChartTypeVariant[] = [
  { value: 'vertical', label: 'Vertical Bars', description: 'Standard column chart', instruction: "Use vertical bars (category axis on x, value axis on y)." },
  { value: 'horizontal', label: 'Horizontal Bars', description: 'Bars extend left to right — good for long category labels', instruction: "Use horizontal bars (value axis on x, category axis on y)." },
  { value: 'stacked', label: 'Stacked Bars', description: 'Segments stack to show part-to-whole per category', instruction: "Stack the series on top of each other using the same `stack` id, so each bar shows its segments summing to a total." },
  { value: 'grouped', label: 'Grouped Bars', description: 'Side-by-side bars compare multiple series per category', instruction: "Place multiple series side by side within each category (do not stack them) for direct comparison." },
  { value: 'waterfall', label: 'Waterfall', description: 'Running total builds up or down step by step', instruction: "Build a waterfall effect using stacked bars — one transparent base series to offset each bar, plus positive/negative series so each step shows its contribution to the running total." },
  { value: 'negative', label: 'Negative Values', description: 'Bars extend below zero to show deficits or decreases', instruction: "Allow values to be negative so bars extend below (or left of) the zero baseline, contrasting gains and losses." },
  { value: 'polar', label: 'Polar / Radial Bars', description: 'Bars radiate from a center point on a circular grid', instruction: "Place the bars on a polar coordinate system (polar radiusAxis/angleAxis) so they radiate radially instead of on a cartesian grid." },
];

const LINE_VARIANTS: ChartTypeVariant[] = [
  { value: 'basic', label: 'Basic Line', description: 'Straight segments between data points', instruction: "Use straight line segments (smooth: false)." },
  { value: 'smooth', label: 'Smoothed Line', description: 'Curved interpolation between points', instruction: "Smooth the line curve (smooth: true)." },
  { value: 'area', label: 'Area Chart', description: 'Filled region under the line emphasizes volume', instruction: "Fill the area under each line (areaStyle) to emphasize volume/magnitude." },
  { value: 'gradient-area', label: 'Gradient Area', description: 'Area fill fades from solid to transparent', instruction: "Fill the area under the line with a top-to-bottom linear gradient (areaStyle.color as a linearGradient) that fades to transparent." },
  { value: 'stacked', label: 'Stacked Lines', description: 'Lines stack so each sits on top of the one before', instruction: "Stack the line series using the same `stack` id (without area fill) so each line builds on the previous one's values." },
  { value: 'stacked-area', label: 'Stacked Area', description: 'Filled areas stack to show cumulative totals', instruction: "Stack the series with filled areas (stack id + areaStyle) so they sum to a cumulative total." },
  { value: 'step', label: 'Step Line', description: 'Right-angle steps between values', instruction: "Render the line as steps between data points (step: 'middle')." },
  { value: 'polar', label: 'Polar Line', description: 'Line drawn around a circular polar grid', instruction: "Draw the line on a polar coordinate system (polar radiusAxis/angleAxis) so it wraps around a circular grid instead of a cartesian one." },
];

const PIE_VARIANTS: ChartTypeVariant[] = [
  { value: 'basic', label: 'Basic Pie', description: 'Classic full-circle proportions', instruction: "Render as a standard full-circle pie." },
  { value: 'donut', label: 'Donut / Ring', description: 'Hollow center for a label or total', instruction: "Render as a donut chart with a hollow center (radius: ['40%', '70%'])." },
  { value: 'half-donut', label: 'Half Donut', description: 'Semicircle gauge-like proportion display', instruction: "Render as a half-donut spanning 180 degrees (startAngle: 180, endAngle: 0) — like a gauge-style proportion display." },
  { value: 'rose', label: 'Rose / Nightingale', description: 'Radius encodes value for dramatic comparison', instruction: "Render as a rose/nightingale chart where each slice's radius (not just angle) encodes its value (roseType: 'radius')." },
  { value: 'nested', label: 'Nested Pies', description: 'Concentric rings compare totals to breakdowns', instruction: "Render as nested concentric pies (multiple series with different radius ranges) so an outer ring breaks down an inner ring's totals." },
];

const SCATTER_VARIANTS: ChartTypeVariant[] = [
  { value: 'basic', label: 'Basic Scatter', description: 'Uniform points plotted by two values', instruction: "Use uniform-sized points plotted by two numeric dimensions." },
  { value: 'bubble', label: 'Bubble Chart', description: 'Point size encodes a third dimension', instruction: "Vary each point's symbolSize by a third data dimension, turning it into a bubble chart." },
  { value: 'single-axis', label: 'Single-Axis Scatter', description: 'Points plotted along one axis only', instruction: "Plot the points along a single axis (singleAxis) rather than two crossed axes — useful for one-dimensional distributions." },
  { value: 'regression', label: 'Scatter with Trend Line', description: 'A fitted line overlays the points to show correlation', instruction: "Overlay a fitted regression/trend line (a second `line` series computed from the data) on top of the scattered points to highlight the correlation." },
];

const GRAPH_VARIANTS: ChartTypeVariant[] = [
  { value: 'force', label: 'Force-Directed', description: 'Physics simulation spaces nodes by connection', instruction: "Use force-directed layout (layout: 'force') so connected nodes naturally cluster." },
  { value: 'circular', label: 'Circular Layout', description: 'Nodes arranged evenly around a ring', instruction: "Use circular layout (layout: 'circular') arranging nodes evenly around a ring." },
  { value: 'cartesian', label: 'Graph on Cartesian', description: 'Nodes positioned by explicit x/y coordinates on a grid', instruction: "Position nodes by explicit x/y data values on a cartesian grid (layout: 'none' with coordinateSystem: 'cartesian2d') instead of an automatic layout." },
  { value: 'none-fixed', label: 'Fixed Layout', description: 'Nodes stay at manually specified positions', instruction: "Use a fixed layout (layout: 'none') with explicit x/y on each node so positions stay exactly where specified, without simulation." },
];

const HEATMAP_VARIANTS: ChartTypeVariant[] = [
  { value: 'cartesian', label: 'Cartesian Grid', description: 'Intensity across two categorical axes', instruction: "Plot on a cartesian grid with categorical x/y axes and a visualMap for color intensity." },
  { value: 'calendar', label: 'Calendar Heatmap', description: 'Daily intensity laid over a calendar grid', instruction: "Plot on a calendar coordinate system, one cell per day, colored by a visualMap." },
  { value: 'polar', label: 'Polar Heatmap', description: 'Intensity cells arranged on a circular grid', instruction: "Plot the cells on a polar coordinate system (polar radiusAxis/angleAxis) so intensity is arranged radially, colored by a visualMap." },
];

const RADAR_VARIANTS: ChartTypeVariant[] = [
  { value: 'outline', label: 'Outline Only', description: 'Just the connecting lines between axes', instruction: "Show only the outline connecting each series' values across axes (no fill)." },
  { value: 'filled', label: 'Filled Area', description: 'Shaded area emphasizes overall shape/coverage', instruction: "Fill the area enclosed by each series' line (areaStyle) to emphasize its overall shape." },
  { value: 'multiple', label: 'Multiple Radars', description: 'Several radar grids compare separate groups side by side', instruction: "Render several separate radar coordinate systems side by side (an array of `radar` + matching `series` entries) so each group gets its own grid for direct comparison." },
];

const FUNNEL_VARIANTS: ChartTypeVariant[] = [
  { value: 'basic', label: 'Basic Funnel', description: 'Single funnel narrowing top to bottom', instruction: "Render a single funnel narrowing from top (widest/first stage) to bottom (narrowest/last stage)." },
  { value: 'compare', label: 'Funnel Compare', description: 'Two funnels mirrored to compare two processes', instruction: "Render two funnels facing each other (one ascending, one descending, or mirrored left/right) so two processes or cohorts can be compared stage by stage." },
  { value: 'multiple', label: 'Multiple Funnels', description: 'Several small funnels shown side by side', instruction: "Render several smaller funnels side by side (an array of funnel series with distinct positions) to compare several processes at a glance." },
];

const GAUGE_VARIANTS: ChartTypeVariant[] = [
  { value: 'basic', label: 'Basic Gauge', description: 'Classic dial with a single pointer and value', instruction: "Render a classic semicircular/circular dial gauge with a single pointer and a centered value label." },
  { value: 'progress', label: 'Progress Gauge', description: 'Thick arc fills proportionally to the value', instruction: "Render as a progress gauge — a thick circular arc (progress: { show: true }) that fills proportionally to the value, without a traditional needle." },
  { value: 'ring', label: 'Ring Gauge', description: 'Multiple thin rings compare several values at once', instruction: "Render as concentric ring gauges — multiple thin circular progress arcs (one per metric) nested at different radii for at-a-glance comparison." },
  { value: 'grade', label: 'Grade / Tiered Gauge', description: 'Color bands across the dial mark performance tiers', instruction: "Divide the dial into colored grade/tier bands (axisLine.lineStyle.color as color stops) so the pointer's position reads against named performance tiers." },
];

const SANKEY_VARIANTS: ChartTypeVariant[] = [
  { value: 'horizontal', label: 'Horizontal Flow', description: 'Flows run left to right across levels', instruction: "Lay the diagram out horizontally (orient: 'horizontal') with flows running left to right through levels." },
  { value: 'vertical', label: 'Vertical Flow', description: 'Flows run top to bottom across levels', instruction: "Lay the diagram out vertically (orient: 'vertical') with flows running top to bottom through levels." },
  { value: 'levels', label: 'Leveled / Aligned Nodes', description: 'Nodes snap to explicit columns or alignment', instruction: "Assign nodes explicit `depth` levels and align them (nodeAlign: 'left' or 'right') so each stage forms a clean column." },
];

const TREE_VARIANTS: ChartTypeVariant[] = [
  { value: 'left-right', label: 'Left → Right', description: 'Root on the left, branches grow rightward', instruction: "Orient the tree left-to-right (orient: 'LR') with the root on the left and children branching rightward." },
  { value: 'top-bottom', label: 'Top → Bottom', description: 'Root on top, branches grow downward', instruction: "Orient the tree top-to-bottom (orient: 'TB') with the root at the top and children branching downward." },
  { value: 'radial', label: 'Radial Tree', description: 'Root at the center, branches radiate outward', instruction: "Lay the tree out radially (layout: 'radial') with the root at the center and branches radiating outward in a circle." },
];

export const CHART_TYPES: ChartTypeOption[] = [
  // ── Basic charts ──
  { series: 'bar', label: 'Bar Chart', description: 'Compare values across categories', icon: 'BarChart3', tuned: true, variants: BAR_VARIANTS },
  { series: 'line', label: 'Line Chart', description: 'Show trends over a continuous axis', icon: 'LineChart', tuned: true, variants: LINE_VARIANTS },
  { series: 'pie', label: 'Pie Chart', description: 'Show proportions of a whole', icon: 'PieChart', tuned: true, variants: PIE_VARIANTS },
  { series: 'scatter', label: 'Scatter Plot', description: 'Reveal correlation between two variables', icon: 'ScatterChart', tuned: true, variants: SCATTER_VARIANTS },
  { series: 'effectScatter', label: 'Effect Scatter', description: 'Animated scatter for highlighting key points', icon: 'Sparkle', tuned: true },
  { series: 'candlestick', label: 'Candlestick', description: 'Open/high/low/close price movement', icon: 'CandlestickChart', tuned: true },
  { series: 'pictorialBar', label: 'Pictorial Bar', description: 'Symbol-based bars for expressive comparisons', icon: 'AlignEndHorizontal', tuned: true },

  // ── Statistical charts ──
  { series: 'boxplot', label: 'Box Plot', description: 'Summarize distribution via quartiles and outliers', icon: 'BoxSelect', tuned: true },
  { series: 'heatmap', label: 'Heatmap', description: 'Show intensity across two dimensions', icon: 'Grid3x3', tuned: true, variants: HEATMAP_VARIANTS },
  { series: 'radar', label: 'Radar Chart', description: 'Compare multiple variables on shared axes', icon: 'Radar', tuned: true, variants: RADAR_VARIANTS },
  { series: 'parallel', label: 'Parallel Coordinates', description: 'Compare many dimensions side by side', icon: 'AlignVerticalSpaceAround', tuned: true },
  { series: 'gauge', label: 'Gauge', description: 'Show a single value against a range', icon: 'Gauge', tuned: true, variants: GAUGE_VARIANTS },
  { series: 'funnel', label: 'Funnel', description: 'Visualize stages of a narrowing process', icon: 'Filter', tuned: true, variants: FUNNEL_VARIANTS },
  { series: 'themeRiver', label: 'Theme River', description: 'Show how themes ebb and flow over time', icon: 'Waves', tuned: true },

  // ── Graph, hierarchy & flow charts ──
  { series: 'graph', label: 'Network Graph', description: 'Map relationships and connections between entities', icon: 'Share2', tuned: true, variants: GRAPH_VARIANTS },
  { series: 'tree', label: 'Tree Diagram', description: 'Show hierarchical parent-child structure', icon: 'GitBranch', tuned: true, variants: TREE_VARIANTS },
  { series: 'treemap', label: 'Treemap', description: 'Show nested proportions as area', icon: 'LayoutGrid', tuned: true },
  { series: 'sunburst', label: 'Sunburst', description: 'Show nested hierarchy as concentric rings', icon: 'CircleDot', tuned: true },
  { series: 'sankey', label: 'Sankey Diagram', description: 'Trace flow and volume through stages', icon: 'Workflow', tuned: true, variants: SANKEY_VARIANTS },
];

/**
 * Turns a chosen chart type (optionally narrowed to a variant) into an
 * explicit instruction prepended to the user's prompt — overriding the AI's
 * own "pick the best primitive for this data" judgment for this one request,
 * without changing any function signatures along the generation pipeline
 * (mirrors composePromptWithAttachment).
 */
export function composePromptWithChartType(text: string, selection: ChartSelection | null): string {
  if (!selection) return text;
  const { type, variant } = selection;
  const trimmed = text.trim();

  const lines = [
    `[The user has explicitly chosen the chart type "${type.label}"${variant ? ` — ${variant.label}` : ''} (ECharts series type: "${type.series}"). Generate the visualization using this series type — do not substitute a different one even if the data might otherwise suggest a different chart. Shape the data and option structure to fit a ${type.series} series well.`,
  ];
  if (variant) lines.push(variant.instruction);
  lines[lines.length - 1] += ']';

  const instruction = lines.join(' ');
  const fallbackSubject = variant ? `${variant.label.toLowerCase()} (${type.label.toLowerCase()})` : type.label.toLowerCase();

  return trimmed
    ? `${instruction}\n\n${trimmed}`
    : `${instruction}\n\nVisualize this as a ${fallbackSubject}.`;
}
