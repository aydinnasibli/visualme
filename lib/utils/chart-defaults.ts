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
    label: { show: true, overflow: 'truncate', width: 90 },
    emphasis: { focus: 'adjacency', scale: 1.1 },
    force: { repulsion: 120, edgeLength: 90, gravity: 0.1 },
    lineStyle: { curveness: 0.15, opacity: 0.6 },
  },
  tree: {
    roam: true,
    expandAndCollapse: true,
    initialTreeDepth: 2,
    label: { overflow: 'truncate', width: 110 },
    emphasis: { focus: 'descendant' },
    lineStyle: { curveness: 0.5 },
  },
  treemap: {
    roam: true,
    breadcrumb: { show: true },
    emphasis: { focus: 'descendant' },
    label: { overflow: 'truncate' },
    itemStyle: { borderRadius: 4, gapWidth: 2 },
  },
  sunburst: {
    emphasis: { focus: 'ancestor' },
    // Hide labels on segments too narrow to read — avoids garbled text in the inner rings.
    minAngle: 3,
    label: { show: true, overflow: 'truncate', width: 80 },
    itemStyle: { borderRadius: 6, borderWidth: 1 },
  },
  sankey: {
    draggable: true,
    emphasis: { focus: 'adjacency' },
    lineStyle: { curveness: 0.5, opacity: 0.4 },
    itemStyle: { borderRadius: 2 },
    label: { overflow: 'truncate', width: 120 },
  },
  pie: {
    avoidLabelOverlap: true,
    // Suppress the label entirely on slices too thin to read — prevents a cluster
    // of callout lines on heavily-segmented charts.
    minShowLabelAngle: 4,
    itemStyle: { borderRadius: 6, borderWidth: 2 },
    label: { formatter: '{b}: {d}%', overflow: 'truncate', width: 140 },
    // Shorter leader lines keep labels closer to the chart body and within the
    // canvas bounds — avoids the common "label bleeds off the right/left edge" problem.
    labelLine: { length: 8, length2: 12, smooth: true },
    emphasis: { focus: 'self', scale: true, scaleSize: 6 },
  },
  scatter: {
    symbolSize: 10,
    itemStyle: { opacity: 0.8 },
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series' },
  },
  effectScatter: {
    symbolSize: 14,
    rippleEffect: { brushType: 'stroke' },
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series' },
  },
  bar: {
    barMaxWidth: 48,
    itemStyle: { borderRadius: 4 },
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series' },
  },
  line: {
    smooth: true,
    symbolSize: 6,
    lineStyle: { width: 2.5 },
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series' },
  },
  radar: {
    symbolSize: 4,
    lineStyle: { width: 2 },
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'self' },
  },
  funnel: {
    minSize: '10%',
    maxSize: '100%',
    gap: 2,
    label: { show: true, position: 'inside', overflow: 'truncate', width: 120 },
    emphasis: { focus: 'self', label: { show: true } },
  },
  heatmap: {
    itemStyle: { borderRadius: 2, borderWidth: 0.5, borderColor: 'rgba(128,128,128,0.25)' },
    label: { overflow: 'truncate', width: 60 },
    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
  },
  parallel: {
    lineStyle: { width: 1.5, opacity: 0.5 },
    emphasis: { focus: 'series', lineStyle: { width: 3, opacity: 0.9 } },
  },
  themeRiver: {
    label: { overflow: 'truncate', width: 100 },
    emphasis: { focus: 'series' },
  },
  candlestick: {
    itemStyle: {
      color: '#26A69A',
      color0: '#EF5350',
      borderColor: '#26A69A',
      borderColor0: '#EF5350',
    },
  },
  boxplot: {
    itemStyle: { borderWidth: 1.5 },
    emphasis: { itemStyle: { borderWidth: 2.5 } },
  },
  gauge: {
    progress: { show: true, width: 12 },
    axisLine: { lineStyle: { width: 12 } },
    pointer: { show: true },
    anchor: { show: true, size: 12, itemStyle: { borderWidth: 4 } },
    title: { show: true, overflow: 'truncate', width: 80 },
    detail: { valueAnimation: true, overflow: 'truncate', width: 80 },
  },
  pictorialBar: {
    barCategoryGap: '40%',
    label: { overflow: 'truncate', width: 80 },
    emphasis: { focus: 'series' },
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
