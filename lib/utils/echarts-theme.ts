// ============================================================================
// BRAND THEME → ECHARTS OPTION TRANSFORM
//
// Takes a structural `option` (produced by AI or hand-written — chart type,
// series, encodings, data) and a `BrandTheme` (palette, typography, layout),
// and returns a themed option ready to render. Keeps the two concerns split
// so a chart's structure can be restyled without touching its data, and vice
// versa — this is the "beautiful + on-brand" personalization layer.
// ============================================================================

import type { EChartsOption } from 'echarts';
import type {
  ComposeOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from 'echarts';
import type { BrandTheme, ChartSpacing, ChartStyleEffect, ThemeMode } from '@/lib/types/echarts-spec';
import { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from '@/lib/types/echarts-spec';

type AxisOption = ComposeOption<XAXisComponentOption | YAXisComponentOption>;

const SPACING_GRID: Record<ChartSpacing, { top: number; bottom: number; left: number; right: number }> = {
  compact:     { top: 48,  bottom: 36, left: 48,  right: 32 },
  comfortable: { top: 64,  bottom: 56, left: 64,  right: 48 },
  spacious:    { top: 88,  bottom: 72, left: 80,  right: 64 },
};

const LEGEND_BY_POSITION: Record<BrandTheme['legendPosition'], Record<string, unknown> | null> = {
  top:    { left: 8, right: 8, orient: 'horizontal' },   // 'top' offset is computed dynamically to clear the title
  bottom: { left: 8, right: 8, bottom: 8, orient: 'horizontal' },
  left:   { left: 8, top: 20, bottom: 20, orient: 'vertical' },
  right:  { right: 8, top: 20, bottom: 20, orient: 'vertical' },
  none:   null,
};

/** Chart types where each series is its own legend entry, keyed by `series.name`. */
const SERIES_NAME_LEGEND_TYPES = new Set(['line', 'bar', 'scatter', 'boxplot']);

/** Chart types where a single series compares multiple entities, each its own legend entry keyed by `data[].name`. */
const DATA_NAME_LEGEND_TYPES = new Set(['radar', 'pie']);

function isNonEmptyName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Safety net for AI-authored specs that compare multiple named series or
 * entities but forgot the `legend` the few-shot examples ask for (e.g. a
 * 3-entity radar comparison with no way to tell which polygon is which
 * product). Only fires when a legend is unambiguously useful — multiple
 * distinctly-named series (line/bar/scatter) or a single radar/pie series
 * with multiple distinctly-named data entries — so it never adds one where
 * the AI deliberately omitted it for a single-entity chart.
 */
function seriesNeedsLegend(series: EChartsOption['series']): boolean {
  if (!Array.isArray(series) || series.length === 0) return false;

  if (series.length >= 2) {
    return series.every((s) => {
      const entry = s as Record<string, unknown>;
      return typeof entry.type === 'string'
        && SERIES_NAME_LEGEND_TYPES.has(entry.type)
        && isNonEmptyName(entry.name);
    });
  }

  const entry = series[0] as Record<string, unknown>;
  const data = entry.data;

  // A themeRiver's distinct streams are otherwise indistinguishable by color alone.
  if (entry.type === 'themeRiver') {
    return Array.isArray(data) && themeRiverStreamNames(data).length >= 2;
  }

  if (typeof entry.type !== 'string' || !DATA_NAME_LEGEND_TYPES.has(entry.type)) return false;
  if (!Array.isArray(data) || data.length < 2) return false;
  return data.every((d) => isNonEmptyName((d as Record<string, unknown> | null)?.name));
}

/** Distinct stream names for a themeRiver series' `[date, value, name]` data tuples, in order of first appearance. */
function themeRiverStreamNames(data: unknown[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const d of data) {
    const name = Array.isArray(d) ? d[2] : (d as Record<string, unknown> | null)?.name;
    if (typeof name === 'string' && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

/**
 * Label strings a themed legend will display — mirrors the sources
 * `seriesNeedsLegend` reads from (per-series names,
 * per-data names, or themeRiver stream names), plus an explicit
 * `legend.data` if the AI supplied one. Used only to estimate a vertical
 * legend's width (see `verticalLegendWidth`); never to decide whether a
 * legend is shown.
 */
function legendEntryLabels(original: Record<string, unknown>): string[] {
  const legendData = (original.legend as Record<string, unknown> | undefined)?.data;
  if (Array.isArray(legendData)) {
    return legendData
      .map((d) => (typeof d === 'string' ? d : (d as Record<string, unknown> | null)?.name))
      .filter(isNonEmptyName);
  }

  const series = original.series as EChartsOption['series'];
  if (!Array.isArray(series) || series.length === 0) return [];

  if (series.length >= 2) {
    return series.map((s) => (s as Record<string, unknown>).name).filter(isNonEmptyName);
  }

  const entry = series[0] as Record<string, unknown>;
  const data = entry.data;
  if (entry.type === 'themeRiver' && Array.isArray(data)) return themeRiverStreamNames(data);
  if (Array.isArray(data)) {
    return data.map((d) => (d as Record<string, unknown> | null)?.name).filter(isNonEmptyName);
  }
  return [];
}

/**
 * Estimated width (px) a left/right legend needs for its widest entry,
 * without measuring text — added to `grid.left`/`grid.right` so the plot
 * area (and its own axis labels) don't render underneath the legend.
 */
function verticalLegendWidth(labels: string[], theme: BrandTheme): number {
  const maxLen = labels.reduce((max, l) => Math.max(max, l.length), 0);
  if (maxLen === 0) return 0;

  return VERTICAL_LEGEND_ICON_WIDTH
    + Math.ceil(maxLen * theme.fontSize.legend * VERTICAL_LEGEND_CHAR_WIDTH)
    + VERTICAL_LEGEND_PADDING_AND_GAP;
}

/** Width (px) of a vertical legend's color icon, per ECharts' default `itemWidth`. */
const VERTICAL_LEGEND_ICON_WIDTH = 25;

/** Rough average glyph width as a fraction of font size — estimates a vertical legend's label column without measuring text. */
const VERTICAL_LEGEND_CHAR_WIDTH = 0.62;

/** Icon-to-label gap plus the legend's own padding plus the gap left between the legend box and the plot area. */
const VERTICAL_LEGEND_PADDING_AND_GAP = 18;

function baseTextStyle(theme: BrandTheme, size: number, color = theme.textColor) {
  return {
    fontFamily: theme.fontFamily,
    fontSize: size,
    color,
  };
}

/**
 * Merges theme styling into a single axis config without disturbing AI-authored
 * structure (type/data/name). ECharts' default `nameLocation: 'end'` renders
 * the name just past the last tick — for a y-axis that's above the grid's top
 * edge (colliding with the title/legend on multi-series charts), and for an
 * x-axis that's to the right of the last tick, which often runs past the
 * canvas edge and gets clipped (e.g. "Months" rendering as "Month").
 * Defaulting named axes to a centered title (`middle`, rotated on the y-axis
 * to sit along the side per the standard dual-axis convention) avoids both.
 * Only backfilled when the AI didn't already specify a placement.
 */
function themeAxis(axis: AxisOption | undefined, theme: BrandTheme, axisType: 'x' | 'y'): AxisOption {
  const a = (axis ?? {}) as Record<string, unknown>;
  const needsNamePlacement = Boolean(a.name) && a.nameLocation === undefined;
  return {
    ...a,
    axisLabel: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), ...(a.axisLabel as object) },
    axisLine: { lineStyle: { color: theme.borderColor }, ...(a.axisLine as object) },
    splitLine: { lineStyle: { color: theme.borderColor, type: 'dashed' }, ...(a.splitLine as object) },
    nameTextStyle: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), ...(a.nameTextStyle as object) },
    ...(needsNamePlacement ? (
      axisType === 'y'
        ? { nameLocation: 'middle', nameGap: 48, nameRotate: a.position === 'right' ? -90 : 90 }
        : { nameLocation: 'middle', nameGap: 28 }
    ) : {}),
  } as AxisOption;
}

function themeAxes(
  axis: EChartsOption['xAxis'] | EChartsOption['yAxis'],
  theme: BrandTheme,
  axisType: 'x' | 'y'
): EChartsOption['xAxis'] | EChartsOption['yAxis'] {
  if (axis === undefined) return undefined;
  if (Array.isArray(axis)) {
    return axis.map((a) => themeAxis(a as AxisOption, theme, axisType)) as unknown as EChartsOption['xAxis'];
  }
  return themeAxis(axis as AxisOption, theme, axisType) as unknown as EChartsOption['xAxis'];
}

/**
 * ECharts sankey series require an acyclic graph — AI-generated specs
 * occasionally produce cyclic links (e.g. A→B→C→A), which crashes the
 * renderer outright with "Sankey is a DAG, the original data has cycle!".
 * Greedily drops the minimal set of links that would close a cycle, in
 * order, so the rest of the AI-authored flow renders intact.
 */
function removeSankeyCycles(links: unknown): unknown {
  if (!Array.isArray(links)) return links;

  const adjacency = new Map<string, Set<string>>();

  const reaches = (from: string, to: string): boolean => {
    const stack = [from];
    const seen = new Set<string>();
    while (stack.length) {
      const node = stack.pop()!;
      if (node === to) return true;
      if (seen.has(node)) continue;
      seen.add(node);
      for (const next of adjacency.get(node) ?? []) stack.push(next);
    }
    return false;
  };

  const kept: unknown[] = [];
  for (const link of links) {
    const entry = link as Record<string, unknown>;
    const source = String(entry?.source);
    const target = String(entry?.target);
    if (!entry || source === target || reaches(target, source)) continue;

    if (!adjacency.has(source)) adjacency.set(source, new Set());
    adjacency.get(source)!.add(target);
    kept.push(link);
  }
  return kept;
}

/** Converts a `#rrggbb` hex color to `rgba(r, g, b, alpha)`; falls back to passing the input through if it isn't 6-digit hex (e.g. already rgba/named/css var). */
function hexToRgba(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Builds an ECharts `linearGradient` color object that fades a base color from
 * translucent (top) to fully transparent (bottom) — the "Gradient Area" line
 * variant's promised effect. Authored here (not by the AI) so the gradient is
 * always valid ECharts graphic syntax and stays on-brand with the series' own
 * palette color, the same color it would otherwise render with solid.
 */
function gradientAreaFill(baseColor: string): Record<string, unknown> {
  return {
    type: 'linear',
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: hexToRgba(baseColor, 0.45) },
      { offset: 1, color: hexToRgba(baseColor, 0) },
    ],
  };
}

/**
 * Applies a variant's deterministic visual effect to one themed series entry.
 * `paletteColor` is the color ECharts would assign this series from the global
 * palette by index — used so the gradient matches what the line itself renders
 * in, rather than introducing an unrelated color.
 */
function applyStyleEffect(
  themed: Record<string, unknown>,
  type: string | undefined,
  styleEffect: ChartStyleEffect | undefined,
  paletteColor: string
): void {
  if (styleEffect === 'gradient-area' && type === 'line' && themed.areaStyle !== undefined) {
    const areaStyle = (themed.areaStyle ?? {}) as Record<string, unknown>;
    const baseColor = typeof areaStyle.color === 'string' ? areaStyle.color : paletteColor;
    themed.areaStyle = { ...areaStyle, color: gradientAreaFill(baseColor) };
  }
}

/** Adds brand-consistent rounding/borders to series that support itemStyle, without overriding AI-authored colors per data point. */
function themeSeries(series: EChartsOption['series'], theme: BrandTheme, styleEffect?: ChartStyleEffect): EChartsOption['series'] {
  if (!series) return series;
  const list = Array.isArray(series) ? series : [series];

  return list.map((s, index) => {
    const seriesEntry = s as Record<string, unknown>;
    const type = seriesEntry.type as string | undefined;
    const themed: Record<string, unknown> = { ...seriesEntry };

    if (styleEffect) {
      applyStyleEffect(themed, type, styleEffect, theme.palette[index % theme.palette.length]);
    }

    if (type === 'bar' && theme.borderRadius != null) {
      themed.itemStyle = {
        ...(seriesEntry.itemStyle as object),
        borderRadius: theme.borderRadius,
      };
    }

    if (type === 'pie' || type === 'sunburst') {
      themed.label = {
        ...baseTextStyle(theme, theme.fontSize.axisLabel),
        ...(seriesEntry.label as object),
      };
      themed.itemStyle = {
        borderColor: theme.background === 'transparent' ? undefined : theme.background,
        borderWidth: 2,
        ...(seriesEntry.itemStyle as object),
      };
    }

    if (type === 'graph' || type === 'tree' || type === 'treemap' || type === 'sankey' || type === 'themeRiver') {
      themed.label = {
        ...baseTextStyle(theme, theme.fontSize.axisLabel),
        ...(seriesEntry.label as object),
      };
    }

    // Treemap: style the breadcrumb navigation trail and upper-level labels.
    if (type === 'treemap') {
      const bc = (seriesEntry.breadcrumb ?? {}) as Record<string, unknown>;
      themed.breadcrumb = {
        ...bc,
        height: bc.height ?? 22,
        itemStyle: {
          textStyle: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.textColor) },
          ...(bc.itemStyle as object),
        },
      };
      const ul = (seriesEntry.upperLabel ?? {}) as Record<string, unknown>;
      themed.upperLabel = {
        ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.textColor),
        ...ul,
      };
    }

    // Gauge: title (the metric name) and detail (the value) need explicit font/color
    // since ECharts doesn't inherit from the global textStyle for these sub-elements.
    if (type === 'gauge') {
      const title = (seriesEntry.title ?? {}) as Record<string, unknown>;
      themed.title = {
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize.axisLabel,
        color: theme.mutedTextColor,
        overflow: 'truncate',
        width: 100,
        ...title,
      };
      const detail = (seriesEntry.detail ?? {}) as Record<string, unknown>;
      themed.detail = {
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize.title,
        fontWeight: theme.fontWeight?.title ?? 600,
        color: theme.textColor,
        overflow: 'truncate',
        width: 100,
        ...detail,
      };
    }

    if (type === 'sankey') {
      themed.links = removeSankeyCycles(seriesEntry.links);
    }

    return themed;
  }) as EChartsOption['series'];
}

/**
 * Keeps a chart's surface colors (background/text/muted/border) in sync with
 * the *live* app shell theme — light, dark, or resolved-from-system — while
 * preserving the chart's own brand choices (palette, typography, spacing,
 * legend). `background` stays `'transparent'` so the canvas always shows
 * through to the dashboard surface beneath it; only the explicit text/border
 * colors (which can't auto-adapt like a transparent background can) need to
 * be swapped to the mode-appropriate set. This is what makes a chart authored
 * in one mode still read correctly after the user switches the app's theme.
 */
export function withAppMode(theme: BrandTheme, appMode: ThemeMode): BrandTheme {
  if (theme.mode === appMode) return theme;
  const surfaces = appMode === 'dark' ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
  return {
    ...theme,
    mode: appMode,
    background: 'transparent',
    textColor: surfaces.textColor,
    mutedTextColor: surfaces.mutedTextColor,
    borderColor: surfaces.borderColor,
  };
}

/**
 * Applies a `BrandTheme` to a structural `option`, returning a new themed
 * option. Theme styling fills in title/legend/tooltip/axis/grid presentation;
 * the original option's chart type, encodings, and data pass through
 * untouched (deep-cloned to avoid mutating AI-cached specs).
 */
export function applyBrandTheme(option: EChartsOption, theme: BrandTheme, styleEffect?: ChartStyleEffect): EChartsOption {
  const grid = SPACING_GRID[theme.spacing];
  const legendOverride = LEGEND_BY_POSITION[theme.legendPosition];
  const original = option as Record<string, unknown>;

  // Compute once — used for both legend placement and grid-top guard below.
  const isTopLegend = theme.legendPosition === 'top';
  const hasTitle    = Boolean(original.title);
  const hasSubtext  = hasTitle && Boolean((original.title as Record<string, unknown>)?.subtext);
  const legendTopOffset = isTopLegend && hasTitle ? (hasSubtext ? 68 : 48) : 8;

  const themed: Record<string, unknown> = structuredClone(original);

  themed.color = theme.palette;
  themed.backgroundColor = theme.background;
  themed.textStyle = { ...baseTextStyle(theme, theme.fontSize.axisLabel), ...(original.textStyle as object) };

  themed.title = hasTitle
    ? {
        ...(original.title as object),
        textStyle: {
          ...baseTextStyle(theme, theme.fontSize.title, theme.textColor),
          fontWeight: theme.fontWeight?.title,
          ...((original.title as Record<string, unknown>).textStyle as object),
        },
        subtextStyle: {
          ...baseTextStyle(theme, theme.fontSize.subtitle, theme.mutedTextColor),
          ...((original.title as Record<string, unknown>).subtextStyle as object),
        },
      }
    : undefined;

  // Style a legend if the structural spec declared one, or backfill a default
  // when the spec omitted it but multiple distinctly-named series make one
  // unambiguously useful (see seriesNeedsLegend) — the theme restyles/repositions
  // a legend but otherwise never decides whether one belongs.
  const effectiveLegend = original.legend !== undefined
    ? original.legend
    : (seriesNeedsLegend(original.series as EChartsOption['series']) ? {} : undefined);

  if (effectiveLegend !== undefined) {
    if (legendOverride) {
      // themeRiver's legend entries can't be auto-collected by ECharts — each
      // data item is a [date, value, name] tuple, not a {name: ...} object —
      // so supply the distinct stream names explicitly.
      const singleSeries = Array.isArray(original.series) ? original.series[0] : original.series;
      const riverEntry = singleSeries as Record<string, unknown> | undefined;
      const riverLegendData = riverEntry?.type === 'themeRiver' && Array.isArray(riverEntry.data)
        ? { data: themeRiverStreamNames(riverEntry.data) }
        : {};

      themed.legend = {
        ...legendOverride,
        ...(isTopLegend ? { top: legendTopOffset } : {}),
        textStyle: baseTextStyle(theme, theme.fontSize.legend, theme.mutedTextColor),
        ...riverLegendData,
        ...(effectiveLegend as object),
        // Always paginate rather than wrap — keeps every legend on a single
        // line/column with prev/next arrows regardless of container size, so
        // a chart that fits at full Playground width doesn't overflow or
        // stack when shown smaller (e.g. a dashboard grid cell).
        type: 'scroll',
        pageIconColor: theme.textColor,
        pageIconInactiveColor: theme.mutedTextColor,
        pageIconSize: 12,
        pageTextStyle: baseTextStyle(theme, theme.fontSize.legend, theme.mutedTextColor),
        pageButtonItemGap: 4,
        pageButtonGap: 8,
      };
    } else {
      themed.legend = { ...(effectiveLegend as object), show: false };
    }
  }

  // Reused below to reserve space for a visible top legend across cartesian
  // grids, radar charts, and pie/sunburst radius.
  const topLegendHasContent = isTopLegend && effectiveLegend !== undefined;

  // Let ECharts automatically hide overlapping labels instead of stacking them —
  // most critical for dense pie charts and scatter plots.
  themed.labelLayout = { hideOverlap: true, ...(original.labelLayout as object) };

  themed.tooltip = {
    backgroundColor: theme.mode === 'dark' ? '#27272a' : '#ffffff',
    borderColor: theme.borderColor,
    textStyle: baseTextStyle(theme, theme.fontSize.tooltip, theme.textColor),
    // Prevent tooltip from overflowing the canvas boundary — important on small containers.
    confine: true,
    ...(original.tooltip as object),
  };

  if (original.grid !== undefined || original.xAxis !== undefined || original.yAxis !== undefined) {
    // Guard: ensure the cartesian plot area starts below the title and any top-positioned
    // legend. ECharts doesn't factor these non-grid elements into its layout pass, so
    // without this the chart body can overlap the title row or legend row.
    const minTop = (() => {
      if (topLegendHasContent) return legendTopOffset + 28;   // legend bottom edge + gap
      if (hasTitle)            return hasSubtext ? 72 : 52;   // title bottom edge + gap
      return 0;
    })();
    const effectiveGridTop = Math.max(grid.top, minTop);

    // A left/right legend renders inside the grid's left/right inset by default —
    // widen that inset by the legend's estimated width so the plot area (and its
    // own axis labels, reserved via containLabel) don't render underneath it.
    const verticalLegendHasContent = effectiveLegend !== undefined
      && (theme.legendPosition === 'left' || theme.legendPosition === 'right');
    const verticalLegendW = verticalLegendHasContent
      ? verticalLegendWidth(legendEntryLabels(original), theme)
      : 0;
    const effectiveGridLeft  = grid.left  + (theme.legendPosition === 'left'  ? verticalLegendW : 0);
    const effectiveGridRight = grid.right + (theme.legendPosition === 'right' ? verticalLegendW : 0);

    const aiGrid = (original.grid ?? {}) as Record<string, unknown>;
    themed.grid = { ...aiGrid, top: effectiveGridTop, bottom: grid.bottom, left: effectiveGridLeft, right: effectiveGridRight, containLabel: true };
  }

  // Radar axis-name overflow — indicator names are often long phrases; truncate
  // them at the axis label level so they don't overrun adjacent spokes.
  //
  // ECharts' default `splitArea` alternates light/dark gray bands designed for
  // a white canvas — on the app's dark surfaces those bands render as a harsh
  // gray "target" pattern. Match the cartesian axes' look instead: themed
  // axis/split lines, no area fill.
  if (original.radar !== undefined) {
    const radarArr = Array.isArray(original.radar) ? original.radar : [original.radar];
    // A top-positioned legend (plus title) overlaps the radar's default
    // center/radius — unlike `grid`, radar has no `top` inset to push it down,
    // so shrink and re-center it to clear the legend/title band instead.
    themed.radar = radarArr.map((r) => {
      const rec = r as Record<string, unknown>;
      return {
        ...rec,
        ...(topLegendHasContent && rec.center === undefined && rec.radius === undefined
          ? { center: ['50%', '61%'], radius: '55%' }
          : {}),
        axisLine: { lineStyle: { color: theme.borderColor }, ...(rec.axisLine as object) },
        splitLine: { lineStyle: { color: theme.borderColor }, ...(rec.splitLine as object) },
        splitArea: { show: false, ...(rec.splitArea as object) },
        axisName: {
          overflow: 'truncate',
          width: 80,
          ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor),
          ...(rec.axisName as object),
        },
      };
    });
  }

  themed.xAxis = themeAxes(original.xAxis as EChartsOption['xAxis'], theme, 'x');
  themed.yAxis = themeAxes(original.yAxis as EChartsOption['yAxis'], theme, 'y');
  themed.series = themeSeries(original.series as EChartsOption['series'], theme, styleEffect);

  // ── Polar coordinate axes (used by polar bar, line, scatter, heatmap variants) ──
  // Without explicit theming these stay at ECharts defaults and look inconsistent.
  if (original.radiusAxis !== undefined) {
    const axes = Array.isArray(original.radiusAxis) ? original.radiusAxis : [original.radiusAxis];
    themed.radiusAxis = axes.map((ax) => ({
      ...(ax as object),
      axisLabel: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), ...(((ax as Record<string, unknown>).axisLabel) as object) },
      axisLine: { lineStyle: { color: theme.borderColor }, ...((ax as Record<string, unknown>).axisLine as object) },
      splitLine: { lineStyle: { color: theme.borderColor, type: 'dashed' }, ...((ax as Record<string, unknown>).splitLine as object) },
      nameTextStyle: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), ...((ax as Record<string, unknown>).nameTextStyle as object) },
    }));
  }
  if (original.angleAxis !== undefined) {
    const axes = Array.isArray(original.angleAxis) ? original.angleAxis : [original.angleAxis];
    themed.angleAxis = axes.map((ax) => ({
      ...(ax as object),
      axisLabel: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), ...(((ax as Record<string, unknown>).axisLabel) as object) },
      axisLine: { lineStyle: { color: theme.borderColor }, ...((ax as Record<string, unknown>).axisLine as object) },
      splitLine: { lineStyle: { color: theme.borderColor, type: 'dashed' }, ...((ax as Record<string, unknown>).splitLine as object) },
    }));
  }

  // ── Parallel coordinates axes ──
  // Each dimension column in a parallel chart is a parallelAxis entry; without
  // theming these render with full-brightness default text that clashes with the
  // dashboard surface.
  if (original.parallelAxis !== undefined) {
    const axes = Array.isArray(original.parallelAxis) ? original.parallelAxis : [original.parallelAxis];
    themed.parallelAxis = axes.map((ax) => ({
      ...(ax as object),
      nameTextStyle: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), overflow: 'truncate', width: 100, ...((ax as Record<string, unknown>).nameTextStyle as object) },
      axisLabel: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), overflow: 'truncate', width: 80, ...((ax as Record<string, unknown>).axisLabel as object) },
      axisLine: { lineStyle: { color: theme.borderColor }, ...((ax as Record<string, unknown>).axisLine as object) },
      nameGap: 28,
      nameLocation: 'end',
    }));
  }

  // ── Single axis (used by single-axis scatter variant) ──
  if (original.singleAxis !== undefined) {
    const axes = Array.isArray(original.singleAxis) ? original.singleAxis : [original.singleAxis];
    themed.singleAxis = axes.map((ax) => ({
      ...(ax as object),
      axisLabel: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), ...((ax as Record<string, unknown>).axisLabel as object) },
      axisLine: { lineStyle: { color: theme.borderColor }, ...((ax as Record<string, unknown>).axisLine as object) },
      nameTextStyle: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), ...((ax as Record<string, unknown>).nameTextStyle as object) },
    }));
  }

  // Style the visualMap (used by heatmaps) so its text adapts to the current theme mode.
  if (original.visualMap !== undefined) {
    const vmList = Array.isArray(original.visualMap) ? original.visualMap : [original.visualMap];
    const themedVms = vmList.map((vm) => ({
      ...(vm as object),
      textStyle: {
        color: theme.mutedTextColor,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize?.axisLabel ?? 11,
        ...((vm as Record<string, unknown>).textStyle as object),
      },
    }));
    themed.visualMap = Array.isArray(original.visualMap) ? themedVms : themedVms[0];
  }

  // Style the calendar component (used by calendar heatmaps).
  if (original.calendar !== undefined) {
    const calList = Array.isArray(original.calendar) ? original.calendar : [original.calendar];
    const themedCals = calList.map((cal) => {
      const c = (cal as Record<string, unknown>);
      return {
        ...c,
        itemStyle: { borderColor: theme.borderColor, ...(c.itemStyle as object) },
        dayLabel: { color: theme.mutedTextColor, fontFamily: theme.fontFamily, ...(c.dayLabel as object) },
        monthLabel: { color: theme.mutedTextColor, fontFamily: theme.fontFamily, ...(c.monthLabel as object) },
        yearLabel: { color: theme.textColor, fontFamily: theme.fontFamily, ...(c.yearLabel as object) },
      };
    });
    themed.calendar = Array.isArray(original.calendar) ? themedCals : themedCals[0];
  }

  return themed as EChartsOption;
}
