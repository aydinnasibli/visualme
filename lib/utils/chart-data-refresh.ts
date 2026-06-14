// ============================================================================
// CHART DATA REFRESH — patches an existing chart's `option` with fresh values
// from a connected live sheet, WITHOUT calling the AI. Used by the scheduled
// dashboard digest: cheap, deterministic, and safe to run for every connected
// chart on a schedule without consuming a user's AI usage quota.
//
// Only handles chart shapes common enough to patch safely:
//   - Cartesian (bar/line, any variant): category axis + named series
//   - Pie/donut: {name, value}[] series data
// Anything else (scatter, graph, tree, sankey, treemap, heatmap, radar,
// funnel, gauge, etc.) is reported as not-refreshable — those keep their
// existing AI-edit "Refresh now" flow.
// ============================================================================

import type { EChartsOption } from 'echarts';
import type { ColumnSchema } from '@/lib/utils/csv-schema';

export interface RefreshSheet {
  headers: string[];
  rows: Record<string, unknown>[];
  schema: ColumnSchema[];
}

export interface ChartRefreshResult {
  option: EChartsOption;
  refreshed: boolean;
  summary: string;
}

const NOT_REFRESHABLE = 'Chart type too complex for automatic refresh — open it to refresh manually.';

type AnyRecord = Record<string, unknown>;

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeName(s: unknown): string {
  return typeof s === 'string' ? s.trim().toLowerCase() : '';
}

function stringifyCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

/** Sum a series' `data` array, tolerating plain numbers or `{value}` objects. */
function sumSeriesData(data: unknown): number {
  if (!Array.isArray(data)) return 0;
  return data.reduce((acc: number, v) => {
    if (typeof v === 'number') return acc + v;
    if (v && typeof v === 'object' && typeof (v as AnyRecord).value === 'number') {
      return acc + ((v as AnyRecord).value as number);
    }
    return acc;
  }, 0);
}

/** How many of `existing` (case-insensitive) appear among `values`. */
function overlapScore(existing: string[], values: string[]): number {
  const set = new Set(values.map(v => v.toLowerCase()));
  let hits = 0;
  for (const e of existing) if (set.has(e.toLowerCase())) hits++;
  return hits;
}

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

/** "before → after (+x.x%)" / "before → after" if before is 0. */
function formatDelta(before: number, after: number): string {
  if (before === 0) return `${formatNumber(before)} → ${formatNumber(after)}`;
  const pct = ((after - before) / Math.abs(before)) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${formatNumber(before)} → ${formatNumber(after)} (${sign}${pct.toFixed(1)}%)`;
}

function getTitleText(option: EChartsOption): string {
  const titles = asArray(option.title as AnyRecord | AnyRecord[] | undefined);
  const text = titles[0]?.text;
  return typeof text === 'string' ? text : '';
}

/** Find the category axis (type:'category' with non-empty `data`) across xAxis/yAxis. */
function findCategoryAxis(option: EChartsOption): { axis: AnyRecord; key: 'xAxis' | 'yAxis' } | null {
  for (const key of ['xAxis', 'yAxis'] as const) {
    for (const axis of asArray(option[key] as AnyRecord | AnyRecord[] | undefined)) {
      if (axis?.type === 'category' && Array.isArray(axis.data) && axis.data.length > 0) {
        return { axis, key };
      }
    }
  }
  return null;
}

function axisLabels(axis: AnyRecord): string[] {
  return (axis.data as unknown[]).map(d =>
    d && typeof d === 'object' ? stringifyCell((d as AnyRecord).value) : stringifyCell(d)
  );
}

/** Pick the best date/categorical column for chart categories. */
function pickCategoryColumn(schema: ColumnSchema[], rows: AnyRecord[], existingLabels: string[]): ColumnSchema | null {
  const candidates = schema.filter(c => c.type === 'date' || c.type === 'categorical');
  if (candidates.length === 0) return null;

  let best: ColumnSchema | null = null;
  let bestScore = 0;
  for (const col of candidates) {
    const values = rows.map(r => stringifyCell(r[col.name]));
    const score = overlapScore(existingLabels, values);
    if (score > bestScore) {
      bestScore = score;
      best = col;
    }
  }
  if (best) return best;

  // No textual overlap with existing labels — fall back to the first
  // date column (most likely to be a time axis), then first categorical.
  return candidates.find(c => c.type === 'date') ?? candidates[0];
}

/** Patch a cartesian (bar/line) chart in place. */
function refreshCartesian(option: EChartsOption, sheet: RefreshSheet): ChartRefreshResult {
  const categoryAxisLoc = findCategoryAxis(option);
  if (!categoryAxisLoc) {
    return { option, refreshed: false, summary: 'No category axis found — open it to refresh manually.' };
  }

  const existingLabels = axisLabels(categoryAxisLoc.axis);
  const categoryCol = pickCategoryColumn(sheet.schema, sheet.rows, existingLabels);
  if (!categoryCol) {
    return { option, refreshed: false, summary: 'Sheet has no date/category column to use for chart categories.' };
  }

  const newCategories = sheet.rows.map(r => stringifyCell(r[categoryCol.name]));
  const valueByCategory = (colName: string) => {
    const map = new Map<string, number>();
    for (const row of sheet.rows) {
      const v = row[colName];
      if (typeof v === 'number') map.set(stringifyCell(row[categoryCol.name]).toLowerCase(), v);
    }
    return map;
  };

  const numericCols = sheet.schema.filter(c => c.type === 'numeric');
  const series = asArray(option.series as AnyRecord | AnyRecord[] | undefined);

  const matched: { name: string; before: number; after: number }[] = [];

  for (const s of series) {
    if (s.type !== 'bar' && s.type !== 'line') continue;
    const col = numericCols.find(c => normalizeName(c.name) === normalizeName(s.name));
    if (!col) continue;

    const before = sumSeriesData(s.data);
    const map = valueByCategory(col.name);
    const newData = newCategories.map(cat => map.get(cat.toLowerCase()) ?? null);
    s.data = newData;
    matched.push({ name: typeof s.name === 'string' ? s.name : col.name, before, after: sumSeriesData(newData) });
  }

  if (matched.length === 0) {
    return { option, refreshed: false, summary: 'No series matched a column in the sheet — open it to refresh manually.' };
  }

  categoryAxisLoc.axis.data = newCategories;

  const primary = matched[0];
  const extra = matched.length > 1 ? `, +${matched.length - 1} more series` : '';
  return {
    option,
    refreshed: true,
    summary: `${primary.name}: ${formatDelta(primary.before, primary.after)}${extra}, ${sheet.rows.length} rows`,
  };
}

/** Patch a pie/donut chart's `{name, value}[]` data in place. */
function refreshPie(option: EChartsOption, sheet: RefreshSheet): ChartRefreshResult {
  const series = asArray(option.series as AnyRecord | AnyRecord[] | undefined);
  const pie = series[0];
  const data = Array.isArray(pie?.data) ? (pie.data as unknown[]) : [];
  const existingNames = data
    .map(d => (d && typeof d === 'object' ? stringifyCell((d as AnyRecord).name) : ''))
    .filter(Boolean);

  if (existingNames.length === 0) {
    return { option, refreshed: false, summary: 'No segment data found — open it to refresh manually.' };
  }

  const nameCol = pickCategoryColumn(sheet.schema, sheet.rows, existingNames);
  if (!nameCol) {
    return { option, refreshed: false, summary: 'Sheet has no category column to use for segment names.' };
  }

  const numericCols = sheet.schema.filter(c => c.type === 'numeric');
  if (numericCols.length === 0) {
    return { option, refreshed: false, summary: 'Sheet has no numeric column to use for segment values.' };
  }

  const pieName = normalizeName(pie.name) || normalizeName(getTitleText(option));
  const valueCol =
    numericCols.find(c => normalizeName(c.name) === pieName) ?? numericCols[0];

  const before = sumSeriesData(data);

  const newData = sheet.rows
    .map(r => ({ name: stringifyCell(r[nameCol.name]), value: typeof r[valueCol.name] === 'number' ? r[valueCol.name] : 0 }))
    .filter(d => d.name);

  pie.data = newData;
  const after = sumSeriesData(newData.map(d => d.value));

  return {
    option,
    refreshed: true,
    summary: `${valueCol.name}: ${formatDelta(before, after)}, ${newData.length} segments`,
  };
}

/**
 * Patch `option` with fresh values from `sheet`, matching series names /
 * existing labels to sheet columns. Returns a new option object (input is
 * not mutated) plus whether the patch applied and a one-line digest summary.
 */
export function refreshChartData(option: EChartsOption, sheet: RefreshSheet): ChartRefreshResult {
  // Deep clone via JSON round-trip — chart specs are plain JSON (no
  // functions/Dates), so this is a cheap, safe way to avoid mutating input.
  const clone = JSON.parse(JSON.stringify(option)) as EChartsOption;

  const series = asArray(clone.series as AnyRecord | AnyRecord[] | undefined);
  const primaryType = series[0]?.type;

  if (primaryType === 'bar' || primaryType === 'line') {
    return refreshCartesian(clone, sheet);
  }
  if (primaryType === 'pie') {
    return refreshPie(clone, sheet);
  }
  return { option: clone, refreshed: false, summary: NOT_REFRESHABLE };
}
