// ============================================================================
// PER-CHART-TYPE STRUCTURAL DEFAULTS
//
// The AI composes chart structure freely (lib/services/spec-generator.ts) but
// often omits the interaction/sizing baselines that make a chart feel
// "production grade" — pannable/zoomable graphs, draggable sankey nodes,
// sensible emphasis/focus behavior, readable label thresholds. Rather than
// relying on prompt instructions (which drift across requests and produce
// inconsistent results), this module fills those gaps in code: every
// AI-authored value wins, and only genuinely missing keys are backfilled from
// a baseline template keyed by `series[].type`. This is what keeps charts of
// the same type feeling consistent regardless of how the AI composed them.
// ============================================================================

import type { EChartsOption } from 'echarts';

/** Recursively backfills missing keys from `defaults` without touching any key the source already defines. */
function backfill<T>(target: T, defaults: Partial<T>): T {
  const result = { ...(target as object) } as Record<string, unknown>;
  const src = target as Record<string, unknown>;
  const def = defaults as Record<string, unknown>;

  for (const key of Object.keys(def)) {
    if (src[key] === undefined) {
      result[key] = def[key];
    } else if (
      typeof src[key] === 'object' && src[key] !== null && !Array.isArray(src[key]) &&
      typeof def[key] === 'object' && def[key] !== null && !Array.isArray(def[key])
    ) {
      result[key] = backfill(src[key], def[key] as object);
    }
  }
  return result as T;
}

/** Baseline structural defaults per series type — interaction, emphasis, and label behavior that should feel consistent across every chart of that type. */
const SERIES_DEFAULTS: Record<string, Record<string, unknown>> = {
  graph: {
    roam: true,
    draggable: true,
    // Labels outside the node symbol prevent text being clipped by the symbol border.
    label: { show: true, position: 'right', overflow: 'truncate', width: 80 },
    // Right-positioned labels on nodes packed close together vertically would
    // otherwise stack on top of each other — shift them apart instead of
    // letting them collide.
    labelLayout: { hideOverlap: false, moveOverlap: 'shiftY' },
    emphasis: { focus: 'adjacency', scale: 1.15, itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.3)' } },
    force: { repulsion: 140, edgeLength: [60, 120], gravity: 0.08 },
    lineStyle: { curveness: 0.2, opacity: 0.5 },
  },
  tree: {
    roam: true,
    expandAndCollapse: true,
    initialTreeDepth: 3,
    // Labels adjacent to the node symbol rather than inside keep them readable at any zoom.
    label: { overflow: 'truncate', width: 120 },
    // Densely nested branches place sibling labels close together vertically.
    labelLayout: { hideOverlap: false, moveOverlap: 'shiftY' },
    leaves: { label: { overflow: 'truncate', width: 120 } },
    emphasis: { focus: 'descendant', itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.25)' } },
    lineStyle: { curveness: 0.5 },
    // Symbol size slightly larger so small labels don't clip into the node.
    symbolSize: 7,
  },
  treemap: {
    roam: true,
    breadcrumb: { show: true, height: 22 },
    emphasis: { focus: 'descendant' },
    // width required so truncation activates — without it cells just clip silently.
    label: { overflow: 'truncate', width: 120, ellipsis: true },
    upperLabel: { show: true, height: 22, overflow: 'truncate', width: 120 },
    itemStyle: { borderRadius: 3, gapWidth: 2, borderWidth: 1 },
  },
  sunburst: {
    emphasis: { focus: 'ancestor' },
    // Stop thin slices rendering phantom lines — minAngle suppresses the wedge itself.
    minAngle: 4,
    // minShowLabelAngle > minAngle means labels vanish before the slice does.
    label: { show: true, overflow: 'truncate', width: 72, rotate: 'radial' },
    itemStyle: { borderRadius: 4, borderWidth: 1 },
  },
  sankey: {
    draggable: true,
    emphasis: { focus: 'adjacency', itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.25)' } },
    lineStyle: { curveness: 0.5, opacity: 0.35 },
    itemStyle: { borderRadius: 3 },
    label: { overflow: 'truncate', width: 160 },
    // Nodes packed tightly within a column would otherwise render labels on
    // top of each other — shift them apart instead of letting them collide.
    labelLayout: { hideOverlap: false, moveOverlap: 'shiftY' },
    nodeGap: 12,
    nodeWidth: 16,
  },
  pie: {
    avoidLabelOverlap: true,
    // minAngle stops zero-area wedges from producing orphaned label lines.
    minAngle: 3,
    // Suppress labels on slices too narrow to read — set slightly above minAngle so
    // labels disappear before the wedge disappears (no dangling callout lines).
    minShowLabelAngle: 6,
    itemStyle: { borderRadius: 5, borderWidth: 2 },
    label: { formatter: '{b}: {d}%', overflow: 'truncate', width: 130 },
    // Short leader lines keep labels close to the chart body — prevents labels
    // bleeding outside the canvas on charts with many small slices.
    labelLine: { length: 8, length2: 10, smooth: true, minTurnAngle: 135 },
    emphasis: { focus: 'self', scale: true, scaleSize: 5 },
  },
  scatter: {
    symbolSize: 9,
    symbol: 'circle',
    itemStyle: { opacity: 0.75 },
    // Position above the point prevents the label sitting on top of the symbol.
    label: { position: 'top', overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series', scale: true },
  },
  effectScatter: {
    symbolSize: 12,
    symbol: 'circle',
    rippleEffect: { brushType: 'stroke', scale: 2.5 },
    label: { position: 'top', overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series' },
  },
  bar: {
    barMaxWidth: 52,
    itemStyle: { borderRadius: 4 },
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series', itemStyle: { shadowBlur: 4, shadowColor: 'rgba(0,0,0,0.2)' } },
  },
  line: {
    smooth: true,
    // Smaller symbol keeps dense time-series clean; circle is the most legible form.
    symbolSize: 4,
    symbol: 'circle',
    lineStyle: { width: 2.5 },
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series' },
  },
  radar: {
    symbolSize: 4,
    symbol: 'circle',
    lineStyle: { width: 2 },
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'self', scale: true },
  },
  funnel: {
    minSize: '5%',
    maxSize: '100%',
    gap: 3,
    // Inside labels for upper (wide) stages; labelLine for bottom (narrow) ones.
    label: { show: true, position: 'inside', overflow: 'truncate', width: 120 },
    labelLine: { length: 12, lineStyle: { width: 1 } },
    emphasis: { focus: 'self', label: { show: true } },
    itemStyle: { borderRadius: 3 },
  },
  heatmap: {
    itemStyle: { borderRadius: 2, borderWidth: 0.5, borderColor: 'rgba(128,128,128,0.15)' },
    label: { overflow: 'truncate', width: 56 },
    emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.35)' } },
  },
  parallel: {
    lineStyle: { width: 1, opacity: 0.45 },
    emphasis: { focus: 'series', lineStyle: { width: 2.5, opacity: 0.95 } },
  },
  themeRiver: {
    // In-stream text labels get cramped wherever streams start thin — the
    // legend (always shown for themeRiver, see seriesNeedsLegend) identifies
    // each stream by color instead, keeping the chart itself clean.
    label: { show: false },
    labelLayout: { hideOverlap: false, moveOverlap: 'shiftY' },
    emphasis: { focus: 'series' },
    boundaryGap: ['10%', '10%'],
  },
  candlestick: {
    barMaxWidth: 20,
    // Semantic up/down colors — intentionally not palette-driven so the trading
    // convention (green = up, red = down) is always preserved regardless of brand.
    itemStyle: {
      color: '#26a69a',
      color0: '#ef5350',
      borderColor: '#26a69a',
      borderColor0: '#ef5350',
      borderWidth: 1,
    },
  },
  boxplot: {
    itemStyle: { borderWidth: 1.5, opacity: 0.85 },
    emphasis: { itemStyle: { borderWidth: 2.5, opacity: 1, shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.25)' } },
  },
  gauge: {
    progress: { show: true, width: 14, roundCap: true },
    axisLine: { lineStyle: { width: 14 } },
    axisTick: { show: false },
    splitLine: { length: 10, lineStyle: { width: 2 } },
    axisLabel: { distance: 16 },
    pointer: { show: true, length: '60%', width: 6 },
    anchor: { show: true, size: 10, itemStyle: { borderWidth: 3 } },
    title: { show: true, overflow: 'truncate', width: 100, offsetCenter: [0, '72%'] },
    detail: { valueAnimation: true, overflow: 'truncate', width: 100, offsetCenter: [0, '40%'] },
  },
  pictorialBar: {
    barCategoryGap: '40%',
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series', itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.2)' } },
  },
};

/**
 * Backfills production-grade interaction/emphasis/sizing defaults onto an
 * AI-authored `option`, keyed by each series' `type`. AI-authored values
 * always win — this only fills genuine gaps, so the same chart type renders
 * with consistent baseline behavior (zoomable graphs, draggable flows,
 * readable emphasis) no matter how the AI composed the rest of the option.
 */
export function applyChartDefaults(option: EChartsOption): EChartsOption {
  const original = option as Record<string, unknown>;
  const series = original.series;
  if (!series) return option;

  const list = Array.isArray(series) ? series : [series];
  const merged = list.map((s) => {
    const entry = s as Record<string, unknown>;
    const type = entry.type as string | undefined;
    const defaults = type ? SERIES_DEFAULTS[type] : undefined;
    return defaults ? backfill(entry, defaults) : entry;
  });

  return {
    ...original,
    series: Array.isArray(series) ? merged : merged[0],
  } as EChartsOption;
}
