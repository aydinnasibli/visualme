// ============================================================================
// SERIES TYPE → ICON / LABEL
//
// Shared between the FocusPanel chart-type badge and the session sidebar
// thread cards so both surfaces represent a chart with the same icon.
// ============================================================================

import type { EChartsOption } from 'echarts';
import type { ElementType } from 'react';
import {
  BarChart3, LineChart, PieChart, ScatterChart, Sparkle, CandlestickChart,
  AlignEndHorizontal, BoxSelect, Grid3x3, Radar, AlignVerticalSpaceAround,
  Gauge, Filter, Waves, Share2, GitBranch, LayoutGrid, CircleDot, Workflow,
} from 'lucide-react';

export const SERIES_ICON: Record<string, ElementType> = {
  bar: BarChart3, line: LineChart, pie: PieChart, scatter: ScatterChart,
  effectScatter: Sparkle, candlestick: CandlestickChart, pictorialBar: AlignEndHorizontal,
  boxplot: BoxSelect, heatmap: Grid3x3, radar: Radar, parallel: AlignVerticalSpaceAround,
  gauge: Gauge, funnel: Filter, themeRiver: Waves, graph: Share2,
  tree: GitBranch, treemap: LayoutGrid, sunburst: CircleDot, sankey: Workflow,
};

export const SERIES_LABEL: Record<string, string> = {
  bar: 'Bar Chart', line: 'Line Chart', pie: 'Pie Chart', scatter: 'Scatter Plot',
  effectScatter: 'Effect Scatter', candlestick: 'Candlestick', pictorialBar: 'Pictorial Bar',
  boxplot: 'Box Plot', heatmap: 'Heatmap', radar: 'Radar Chart', parallel: 'Parallel Coords',
  gauge: 'Gauge', funnel: 'Funnel', themeRiver: 'Theme River', graph: 'Network Graph',
  tree: 'Tree', treemap: 'Treemap', sunburst: 'Sunburst', sankey: 'Sankey',
};

/** Extracts the primary series `type` from an option (first series if an array). */
export function getSeriesType(option: EChartsOption): string | undefined {
  const s = option.series;
  return s
    ? ((Array.isArray(s) ? s[0] : s) as Record<string, unknown>)?.type as string | undefined
    : undefined;
}

/** Resolves the icon + label representing a chart's primary series type, with sensible fallbacks. */
export function getChartTypeInfo(option: EChartsOption): { Icon: ElementType; label: string } {
  const seriesType = getSeriesType(option);
  const Icon = (seriesType ? SERIES_ICON[seriesType] : undefined) ?? BarChart3;
  const label = (seriesType ? SERIES_LABEL[seriesType] : undefined)
    ?? (seriesType ? seriesType.charAt(0).toUpperCase() + seriesType.slice(1) : 'Chart');
  return { Icon, label };
}
