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
  top:    { right: 8, orient: 'horizontal' },   // 'top' offset is computed dynamically to clear the title
  bottom: { bottom: 8, left: 'center', orient: 'horizontal' },
  left:   { left: 8, top: 'middle', orient: 'vertical' },
  right:  { right: 8, top: 'middle', orient: 'vertical' },
  none:   null,
};

function baseTextStyle(theme: BrandTheme, size: number, color = theme.textColor) {
  return {
    fontFamily: theme.fontFamily,
    fontSize: size,
    color,
  };
}

/** Merges theme styling into a single axis config without disturbing AI-authored structure (type/data/name). */
function themeAxis(axis: AxisOption | undefined, theme: BrandTheme): AxisOption {
  const a = (axis ?? {}) as Record<string, unknown>;
  return {
    ...a,
    axisLabel: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), ...(a.axisLabel as object) },
    axisLine: { lineStyle: { color: theme.borderColor }, ...(a.axisLine as object) },
    splitLine: { lineStyle: { color: theme.borderColor, type: 'dashed' }, ...(a.splitLine as object) },
    nameTextStyle: { ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor), ...(a.nameTextStyle as object) },
  } as AxisOption;
}

function themeAxes(
  axis: EChartsOption['xAxis'] | EChartsOption['yAxis'],
  theme: BrandTheme
): EChartsOption['xAxis'] | EChartsOption['yAxis'] {
  if (axis === undefined) return undefined;
  if (Array.isArray(axis)) {
    return axis.map((a) => themeAxis(a as AxisOption, theme)) as unknown as EChartsOption['xAxis'];
  }
  return themeAxis(axis as AxisOption, theme) as unknown as EChartsOption['xAxis'];
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

    if (type === 'bar' && theme.borderRadius) {
      themed.itemStyle = {
        borderRadius: theme.borderRadius,
        ...(seriesEntry.itemStyle as object),
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

    if (type === 'graph' || type === 'tree' || type === 'treemap' || type === 'sankey') {
      themed.label = {
        ...baseTextStyle(theme, theme.fontSize.axisLabel),
        ...(seriesEntry.label as object),
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
  const isTopLegend = legendOverride !== null && 'right' in (legendOverride ?? {});
  const hasTitle    = Boolean(original.title);
  const hasSubtext  = hasTitle && Boolean((original.title as Record<string, unknown>)?.subtext);
  const legendTopOffset = isTopLegend && hasTitle ? (hasSubtext ? 68 : 48) : 8;

  const themed: Record<string, unknown> = JSON.parse(JSON.stringify(original));

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

  // Only style a legend if the structural spec already declared one — the
  // theme restyles/repositions it but never decides whether one belongs.
  if (original.legend !== undefined) {
    if (legendOverride) {
      themed.legend = {
        ...legendOverride,
        ...(isTopLegend ? { top: legendTopOffset } : {}),
        textStyle: baseTextStyle(theme, theme.fontSize.legend, theme.mutedTextColor),
        ...(original.legend as object),
      };
    } else {
      themed.legend = { ...(original.legend as object), show: false };
    }
  }

  // Let ECharts automatically hide overlapping labels instead of stacking them —
  // most critical for dense pie charts and scatter plots.
  themed.labelLayout = { hideOverlap: true, ...(original.labelLayout as object) };

  themed.tooltip = {
    backgroundColor: theme.mode === 'dark' ? '#27272a' : '#ffffff',
    borderColor: theme.borderColor,
    textStyle: baseTextStyle(theme, theme.fontSize.tooltip, theme.textColor),
    ...(original.tooltip as object),
  };

  if (original.grid !== undefined || original.xAxis !== undefined || original.yAxis !== undefined) {
    // Guard: ensure the cartesian plot area starts below the title and any top-positioned
    // legend. ECharts doesn't factor these non-grid elements into its layout pass, so
    // without this the chart body can overlap the title row or legend row.
    const topLegendHasContent = isTopLegend && original.legend !== undefined;
    const minTop = (() => {
      if (topLegendHasContent) return legendTopOffset + 28;   // legend bottom edge + gap
      if (hasTitle)            return hasSubtext ? 72 : 52;   // title bottom edge + gap
      return 0;
    })();
    const effectiveGridTop = Math.max(grid.top, minTop);
    themed.grid = { ...grid, top: effectiveGridTop, containLabel: true, ...(original.grid as object) };
  }

  // Radar axis-name overflow — indicator names are often long phrases; truncate
  // them at the axis label level so they don't overrun adjacent spokes.
  if (original.radar !== undefined) {
    const radarArr = Array.isArray(original.radar) ? original.radar : [original.radar];
    themed.radar = radarArr.map((r) => ({
      ...(r as object),
      axisName: {
        overflow: 'truncate',
        width: 80,
        ...baseTextStyle(theme, theme.fontSize.axisLabel, theme.mutedTextColor),
        ...((r as Record<string, unknown>).axisName as object),
      },
    }));
  }

  themed.xAxis = themeAxes(original.xAxis as EChartsOption['xAxis'], theme);
  themed.yAxis = themeAxes(original.yAxis as EChartsOption['yAxis'], theme);
  themed.series = themeSeries(original.series as EChartsOption['series'], theme, styleEffect);

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
