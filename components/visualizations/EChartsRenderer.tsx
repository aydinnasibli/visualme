"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import ReactECharts from "echarts-for-react";
import { applyBrandTheme, withAppMode } from "@/lib/utils/echarts-theme";
import { applyChartDefaults } from "@/lib/utils/chart-defaults";
import type { VisualizationSpec } from "@/lib/types/echarts-spec";
import { DEFAULT_SUNSET_THEME } from "@/lib/types/echarts-spec";

interface EChartsRendererProps {
  spec: VisualizationSpec;
  /** Forwarded to the chart container; defaults to filling its parent. */
  className?: string;
}

const EmptyState = () => (
  <div className="w-full h-full flex items-center justify-center">
    <p className="text-zinc-500 text-sm">No data to display</p>
  </div>
);

/**
 * Single renderer for every chart type — replaces the per-format React
 * components. Structure (`spec.option`) and presentation (`spec.theme`) are
 * composed here so any chart shape can be restyled without regenerating data.
 */
export default function EChartsRenderer({ spec, className }: EChartsRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<InstanceType<typeof ReactECharts>>(null);

  // Resolve the live app theme client-side only — `resolvedTheme` is undefined
  // during SSR/first paint, so we fall back to the spec's own mode until the
  // app theme is known, then re-theme the canvas to match it.
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const themedOption = useMemo(() => {
    if (!spec?.option) return null;
    const theme = spec.theme ?? DEFAULT_SUNSET_THEME;
    const appMode = mounted && resolvedTheme === 'light' ? 'light' : mounted ? 'dark' : theme.mode;
    const syncedTheme = withAppMode(theme, appMode);
    return applyBrandTheme(applyChartDefaults(spec.option), syncedTheme, spec.styleEffect);
  }, [spec, mounted, resolvedTheme]);

  // `autoResize` only reacts to `window` resize events — it stays unaware of
  // layout-driven container resizes (sidebar collapse, panel splits, flex
  // reflows), which is what produces a chart stuck rendering at whatever tiny
  // size its container happened to be on first paint. A ResizeObserver tracks
  // the actual container box and tells the ECharts instance to re-measure.
  // RAF-batching the callback prevents multiple rapid resize calls during
  // sidebar open/close animations from causing visible chart flickering.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        chartRef.current?.getEchartsInstance().resize();
      });
    });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  if (!themedOption) return <EmptyState />;

  return (
    <div ref={containerRef} className={className ?? "w-full h-full p-6"} style={{ minHeight: 280, minWidth: 320 }}>
      <ReactECharts
        ref={chartRef}
        option={themedOption}
        notMerge
        lazyUpdate
        opts={{ renderer: "canvas" }}
        style={{ height: "100%", width: "100%", minHeight: 240 }}
      />
    </div>
  );
}
