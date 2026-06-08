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
import type { BrandTheme, ChartSpacing, ThemeMode } from '@/lib/types/echarts-spec';
import { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from '@/lib/types/echarts-spec';

type AxisOption = ComposeOption<XAXisComponentOption | YAXisComponentOption>;

const SPACING_GRID: Record<ChartSpacing, { top: number; bottom: number; left: number; right: number }> = {
  compact:     { top: 48,  bottom: 36, left: 48,  right: 32 },
  comfortable: { top: 64,  bottom: 56, left: 64,  right: 48 },
  spacious:    { top: 88,  bottom: 72, left: 80,  right: 64 },
};

// 'top' sits in the top-right corner — titles default to top-left, so this
// avoids the two colliding regardless of whether a subtitle is present.
const LEGEND_BY_POSITION: Record<BrandTheme['legendPosition'], Record<string, unknown> | null> = {
  top:    { top: 8, right: 8, orient: 'horizontal' },
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

/** Adds brand-consistent rounding/borders to series that support itemStyle, without overriding AI-authored colors per data point. */
function themeSeries(series: EChartsOption['series'], theme: BrandTheme): EChartsOption['series'] {
  if (!series) return series;
  const list = Array.isArray(series) ? series : [series];

  return list.map((s) => {
    const seriesEntry = s as Record<string, unknown>;
    const type = seriesEntry.type as string | undefined;
    const themed: Record<string, unknown> = { ...seriesEntry };

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
export function applyBrandTheme(option: EChartsOption, theme: BrandTheme): EChartsOption {
  const grid = SPACING_GRID[theme.spacing];
  const legendOverride = LEGEND_BY_POSITION[theme.legendPosition];
  const original = option as Record<string, unknown>;

  const themed: Record<string, unknown> = JSON.parse(JSON.stringify(original));

  themed.color = theme.palette;
  themed.backgroundColor = theme.background;
  themed.textStyle = { ...baseTextStyle(theme, theme.fontSize.axisLabel), ...(original.textStyle as object) };

  themed.title = original.title
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
    themed.legend = legendOverride
      ? {
          ...legendOverride,
          textStyle: baseTextStyle(theme, theme.fontSize.legend, theme.mutedTextColor),
          ...(original.legend as object),
        }
      : { ...(original.legend as object), show: false };
  }

  themed.tooltip = {
    backgroundColor: theme.mode === 'dark' ? '#27272a' : '#ffffff',
    borderColor: theme.borderColor,
    textStyle: baseTextStyle(theme, theme.fontSize.tooltip, theme.textColor),
    ...(original.tooltip as object),
  };

  if (original.grid !== undefined || original.xAxis !== undefined || original.yAxis !== undefined) {
    themed.grid = { ...grid, containLabel: true, ...(original.grid as object) };
  }

  themed.xAxis = themeAxes(original.xAxis as EChartsOption['xAxis'], theme);
  themed.yAxis = themeAxes(original.yAxis as EChartsOption['yAxis'], theme);
  themed.series = themeSeries(original.series as EChartsOption['series'], theme);

  return themed as EChartsOption;
}
