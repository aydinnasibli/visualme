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
    label: { show: true },
    emphasis: { focus: 'adjacency', scale: 1.1 },
    force: { repulsion: 120, edgeLength: 90, gravity: 0.1 },
    lineStyle: { curveness: 0.15, opacity: 0.6 },
  },
  tree: {
    roam: true,
    expandAndCollapse: true,
    initialTreeDepth: 2,
    emphasis: { focus: 'descendant' },
  },
  treemap: {
    roam: true,
    breadcrumb: { show: true },
    emphasis: { focus: 'descendant' },
  },
  sunburst: {
    emphasis: { focus: 'ancestor' },
    label: { show: true },
  },
  sankey: {
    draggable: true,
    emphasis: { focus: 'adjacency' },
    lineStyle: { curveness: 0.5, opacity: 0.4 },
  },
  pie: {
    avoidLabelOverlap: true,
    emphasis: { focus: 'self', scale: true, scaleSize: 6 },
  },
  scatter: {
    emphasis: { focus: 'series' },
  },
  effectScatter: {
    emphasis: { focus: 'series' },
  },
  bar: {
    emphasis: { focus: 'series' },
  },
  line: {
    emphasis: { focus: 'series' },
    symbolSize: 6,
  },
  radar: {
    emphasis: { focus: 'self' },
  },
  funnel: {
    emphasis: { focus: 'self', label: { show: true } },
  },
  heatmap: {
    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
  },
  parallel: {
    emphasis: { focus: 'series' },
  },
  themeRiver: {
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
