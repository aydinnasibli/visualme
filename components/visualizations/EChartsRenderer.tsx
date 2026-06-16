"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import ReactECharts from "echarts-for-react";
import { applyBrandTheme, withAppMode } from "@/lib/utils/echarts-theme";
import { applyChartDefaults, applyPreviewOverrides } from "@/lib/utils/chart-defaults";
import type { VisualizationSpec, Annotation } from "@/lib/types/echarts-spec";
import { DEFAULT_SUNSET_THEME } from "@/lib/types/echarts-spec";
import { useMounted } from "@/lib/hooks/useMounted";

interface EChartsRendererProps {
  spec: VisualizationSpec;
  /** Forwarded to the chart container; defaults to filling its parent. */
  className?: string;
  /**
   * Override the app-mode used for theme-syncing instead of deriving it from
   * `resolvedTheme`. Use when the renderer sits in a container with a fixed
   * (non-theme-aware) background, so chart text colors are picked for the
   * background that's actually there, not whatever the global light/dark
   * toggle is set to.
   */
  forceMode?: 'light' | 'dark';
  /**
   * Suppress the chart's own title/subtext — use when the surrounding UI
   * already displays the visualization's title, so it isn't shown twice.
   */
  hideTitle?: boolean;
  /**
   * Drop the default 280×320 minimum canvas size — for small thumbnail/
   * preview contexts (e.g. a library card) where the chart should shrink to
   * fit its container instead of forcing the container to grow.
   */
  compact?: boolean;
}

const EmptyState = () => (
  <div className="w-full h-full flex items-center justify-center">
    <p className="text-ink-faint text-sm">No data to display</p>
  </div>
);

const CARTESIAN_SERIES_TYPES = new Set([
  'bar', 'line', 'scatter', 'effectScatter', 'boxplot',
  'candlestick', 'heatmap', 'custom',
]);

function hasCartesianAxes(series: unknown[]): boolean {
  return series.some(s => {
    const t = (s as Record<string, unknown>).type;
    return typeof t === 'string' && CARTESIAN_SERIES_TYPES.has(t);
  });
}

/** True when xAxis is the value axis (horizontal bar chart — axes are swapped). */
function isHorizontalChart(option: Record<string, unknown>): boolean {
  const xAxes = Array.isArray(option.xAxis) ? option.xAxis : option.xAxis ? [option.xAxis] : [];
  const yAxes = Array.isArray(option.yAxis) ? option.yAxis : option.yAxis ? [option.yAxis] : [];
  const xType = (xAxes[0] as Record<string, unknown> | undefined)?.type;
  const yType = (yAxes[0] as Record<string, unknown> | undefined)?.type;
  return xType === 'value' && yType === 'category';
}

function applyAnnotations(option: Record<string, unknown>, annotations?: Annotation[]): Record<string, unknown> {
  if (!annotations?.length) return option;

  const hlines = annotations.filter(a => a.type === 'hline' && a.value !== undefined);
  const texts  = annotations.filter(a => a.type === 'text'  && a.label);

  let result = { ...option };

  if (hlines.length) {
    const existingSeries = Array.isArray(result.series) ? [...(result.series as unknown[])] : [];
    // Only add reference lines on cartesian charts — pie/radar/treemap have no value axis.
    if (hasCartesianAxes(existingSeries)) {
      // Horizontal bar charts have xAxis as the value axis — use xAxis in markLine.
      const axisKey = isHorizontalChart(result) ? 'xAxis' : 'yAxis';
      const labelPos = isHorizontalChart(result) ? 'insideEndBottom' as const : 'insideEndTop' as const;
      existingSeries.push({
        type: 'line',
        data: [],
        silent: true,
        animation: false,
        legendHoverLink: false,
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          data: hlines.map(a => {
            const label = String(a.label);
            return {
              [axisKey]: a.value,
              name: label,
              lineStyle: { color: a.color ?? '#ef4444', type: 'dashed' as const, width: 1.5 },
              label: {
                show: true,
                position: labelPos,
                fontSize: 11,
                fontWeight: 600 as const,
                // Function formatter avoids template-engine interpolation of user text
                formatter: () => label,
                color: a.color ?? '#ef4444',
              },
            };
          }),
        },
      });
      result = { ...result, series: existingSeries };
    }
  }

  if (texts.length) {
    const existingGraphic = Array.isArray(result.graphic) ? [...(result.graphic as unknown[])] : [];
    texts.forEach(a => {
      existingGraphic.push({
        type: 'text',
        id: `annot-text-${a.id}`,
        left: `${Math.min(Math.max(a.xPct ?? 10, 0), 95)}%`,
        top: `${Math.min(Math.max(a.yPct ?? 10, 0), 95)}%`,
        z: 100,
        style: {
          text: a.label,
          fill: a.color ?? '#f59e0b',
          fontSize: 12,
          fontWeight: 700,
          // strokeFirst ensures the border renders behind the fill
          strokeFirst: true,
          stroke: 'rgba(0,0,0,0.55)',
          lineWidth: 3,
        },
        draggable: false,
      });
    });
    result = { ...result, graphic: existingGraphic };
  }

  return result;
}

/**
 * Single renderer for every chart type — replaces the per-format React
 * components. Structure (`spec.option`) and presentation (`spec.theme`) are
 * composed here so any chart shape can be restyled without regenerating data.
 */
export default function EChartsRenderer({ spec, className, forceMode, hideTitle, compact }: EChartsRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<InstanceType<typeof ReactECharts>>(null);

  // Resolve the live app theme client-side only — `resolvedTheme` is undefined
  // during SSR/first paint, so we fall back to the spec's own mode until the
  // app theme is known, then re-theme the canvas to match it.
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const themedOption = useMemo(() => {
    if (!spec?.option) return null;
    const theme = spec.theme ?? DEFAULT_SUNSET_THEME;
    const appMode = forceMode ?? (mounted && resolvedTheme === 'light' ? 'light' : mounted ? 'dark' : theme.mode);
    const syncedTheme = withAppMode(theme, appMode);
    const structuralOption = applyChartDefaults(spec.option);
    const previewOption = compact ? applyPreviewOverrides(structuralOption) : structuralOption;
    const themed = applyBrandTheme(
      hideTitle ? { ...previewOption, title: undefined } : previewOption,
      syncedTheme,
      spec.styleEffect
    );
    return applyAnnotations(themed, spec.annotations);
  }, [spec, mounted, resolvedTheme, forceMode, hideTitle, compact]);

  // `autoResize` only reacts to `window` resize events — it stays unaware of
  // layout-driven container resizes (sidebar collapse, panel splits, flex
  // reflows), which is what produces a chart stuck rendering at whatever tiny
  // size its container happened to be on first paint. A ResizeObserver tracks
  // the actual container box and tells the ECharts instance to re-measure.
  // RAF-batching the callback prevents multiple rapid resize calls during
  // sidebar open/close animations from causing visible chart flickering.
  //
  // The title/subtitle have no `overflow`/`width` constraint (unlike axis
  // labels, legend, etc.), so a long AI-generated title can render wider than
  // the canvas — clipped with no ellipsis, and briefly visible spilling past
  // the card's rounded border before this first runs. Re-derive a truncation
  // width from the resized canvas every time it changes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const constrainTitleWidth = () => {
      const inst = chartRef.current?.getEchartsInstance();
      const title = inst?.getOption()?.title as Array<Record<string, unknown>> | undefined;
      if (!inst || !title?.[0]?.text) return;
      const width = Math.max(inst.getWidth() - 24, 60);
      inst.setOption({
        title: {
          textStyle: { overflow: 'truncate', width },
          subtextStyle: { overflow: 'truncate', width },
        },
      }, false);
    };

    let raf = 0;
    let attempts = 0;

    // On a client-side route transition the chart can mount before its grid
    // item has settled into its final layout size (react-grid-layout
    // recalculates column widths after mount), so ECharts measures itself at
    // a stale size that no-arg `chart.resize()` doesn't correct. Resizing
    // with the container's *current* dimensions fixes it — but `el` can
    // briefly report 0x0 during that same layout pass, which zrender ignores,
    // so retry on the next frame (a few times) until it has real dimensions
    // and the canvas has actually picked up the new size.
    const tryResize = () => {
      const inst = chartRef.current?.getEchartsInstance();
      const { clientWidth, clientHeight } = el;
      if (!inst || inst.isDisposed() || clientWidth === 0 || clientHeight === 0) {
        if (attempts < 5) { attempts++; raf = requestAnimationFrame(tryResize); }
        return;
      }
      // `clientWidth`/`clientHeight` include this container's own padding (e.g.
      // `p-6`), but the chart div ECharts measures fills only `el`'s *content*
      // box (`width/height: 100%` minus that padding). Resizing to the
      // padding-inclusive size makes the chart `2 * padding` larger than that
      // box, overflowing into the ancestor `overflow-hidden` wrapper and getting
      // its right/bottom edge clipped (axis labels, legend). Subtract `el`'s own
      // padding so the chart matches the box it actually renders into.
      const cs = getComputedStyle(el);
      const width = clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const height = clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      inst.resize({ width, height });
      constrainTitleWidth();
      const canvas = inst.getDom()?.querySelector('canvas');
      const styleW = canvas ? parseFloat(canvas.style.width) : width;
      if (attempts < 5 && styleW !== width) {
        attempts++;
        raf = requestAnimationFrame(tryResize);
      } else {
        attempts = 0;
      }
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      attempts = 0;
      raf = requestAnimationFrame(tryResize);
    });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  if (!themedOption) return <EmptyState />;

  return (
    <div ref={containerRef} className={className ?? "w-full h-full p-6"} style={compact ? undefined : { minHeight: 280, minWidth: 320 }}>
      <ReactECharts
        ref={chartRef}
        option={themedOption}
        notMerge
        lazyUpdate
        opts={{ renderer: "canvas" }}
        style={compact ? { height: "100%", width: "100%" } : { height: "100%", width: "100%", minHeight: 240 }}
      />
    </div>
  );
}
