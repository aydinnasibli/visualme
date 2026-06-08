// ============================================================================
// SPEC-BASED VISUALIZATION TYPES
//
// Replaces the closed catalog of ~19 hardcoded visualization types with a
// declarative ECharts `option` plus a brand theme. The AI composes the
// `option` from primitives (series, encodings, marks); the theme carries the
// "beautiful + on-brand" personalization layer (palette, typography, layout).
// ============================================================================

import type { EChartsOption } from 'echarts';

export type ThemeMode = 'light' | 'dark';

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export type ChartSpacing = 'compact' | 'comfortable' | 'spacious';

/**
 * Personalization/branding layer. Applied on top of a raw `option` by
 * `applyBrandTheme` — never hand-authored into the option itself, so the
 * same chart structure can be restyled without regenerating data.
 */
export interface BrandTheme {
  mode: ThemeMode;

  /** Ordered series colors — first entries used for primary series/segments. */
  palette: string[];

  background?: string;
  textColor?: string;
  mutedTextColor?: string;
  borderColor?: string;

  fontFamily: string;
  fontSize: {
    title: number;
    subtitle: number;
    axisLabel: number;
    legend: number;
    tooltip: number;
  };
  fontWeight?: {
    title: number | string;
    label: number | string;
  };

  /** Controls grid/legend padding and gaps between chart elements. */
  spacing: ChartSpacing;
  legendPosition: LegendPosition;

  /** Corner rounding applied to bars, nodes, and tooltips where supported. */
  borderRadius?: number;
}

/**
 * What the AI generates and what the renderer consumes: a structural
 * `option` (chart type, series, encodings, raw data) plus the brand theme
 * that personalizes its appearance.
 */
export interface VisualizationSpec {
  /** Structural chart definition — series types, encodings, raw data. Theme-agnostic. */
  option: EChartsOption;
  theme: BrandTheme;
  title?: string;
}

// ============================================================================
// DEFAULT THEMES
// ============================================================================

export const DEFAULT_LIGHT_THEME: BrandTheme = {
  mode: 'light',
  palette: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6'],
  background: '#ffffff',
  textColor: '#18181b',
  mutedTextColor: '#71717a',
  borderColor: '#e4e4e7',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: { title: 18, subtitle: 13, axisLabel: 12, legend: 12, tooltip: 12 },
  fontWeight: { title: 600, label: 400 },
  spacing: 'comfortable',
  legendPosition: 'top',
  borderRadius: 4,
};

export const DEFAULT_DARK_THEME: BrandTheme = {
  mode: 'dark',
  palette: ['#818cf8', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#2dd4bf'],
  background: 'transparent',
  textColor: '#e4e4e7',
  mutedTextColor: '#a1a1aa',
  borderColor: '#3f3f46',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: { title: 18, subtitle: 13, axisLabel: 12, legend: 12, tooltip: 12 },
  fontWeight: { title: 600, label: 400 },
  spacing: 'comfortable',
  legendPosition: 'top',
  borderRadius: 4,
};

/**
 * Default brand theme for newly generated charts — a warm, dark "sunset"
 * palette (oranges/reds/ambers/pinks) over the dashboard's dark surfaces,
 * matching the `Sunset` preset in `ThemePanel`'s palette gallery.
 */
export const DEFAULT_SUNSET_THEME: BrandTheme = {
  mode: 'dark',
  palette: ['#fb923c', '#f97316', '#f43f5e', '#ec4899', '#fbbf24', '#ef4444', '#facc15', '#e11d48'],
  background: 'transparent',
  textColor: '#fdf1ea',
  mutedTextColor: '#cba696',
  borderColor: '#4a3327',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: { title: 18, subtitle: 13, axisLabel: 12, legend: 12, tooltip: 12 },
  fontWeight: { title: 600, label: 400 },
  spacing: 'comfortable',
  legendPosition: 'top',
  borderRadius: 6,
};
