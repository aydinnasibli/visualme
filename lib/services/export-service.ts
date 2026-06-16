/**
 * Export Service
 * Handles exporting visualizations in various formats (PNG, SVG, PDF, JSON, CSV, HTML)
 */

import type { SavedVisualization, ExportOptions } from '../types/visualization';
import { generateShareId } from '../utils/helpers';
import { applyBrandTheme } from '../utils/echarts-theme';
import { applyChartDefaults } from '../utils/chart-defaults';

/**
 * Generate a shareable link for a visualization
 */
export async function generateShareLink(): Promise<{ shareId: string; shareUrl: string }> {
  const shareId = generateShareId();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/share/${shareId}`;

  // Note: The actual database update to save the shareId
  // will be done in the API route that calls this function

  return {
    shareId,
    shareUrl,
  };
}

/**
 * Export visualization as JSON — the full spec (structure + theme).
 */
export function exportAsJSON(visualization: SavedVisualization, options?: ExportOptions): string {
  const exportData = {
    spec: visualization.spec,
    metadata: options?.includeMetadata
      ? {
          title: visualization.title,
          createdAt: visualization.createdAt,
          ...visualization.metadata,
        }
      : undefined,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Wraps a CSV cell value in quotes if it contains commas, quotes, or newlines.
 */
function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Export visualization series data as CSV.
 * Handles indexed bar/line series by joining with xAxis.data category labels.
 * Falls back to JSON for relational types (graph, tree, sankey) whose data
 * isn't meaningfully tabular.
 */
type SeriesShape = 'named-value' | 'indexed' | 'array' | 'empty';

function detectSeriesShape(data: unknown[]): SeriesShape {
  for (const point of data) {
    if (point === null || point === undefined) continue;
    if (typeof point === 'object' && !Array.isArray(point)) {
      const p = point as Record<string, unknown>;
      return 'value' in p && 'name' in p ? 'named-value' : 'indexed';
    }
    if (Array.isArray(point)) return 'array';
    if (typeof point === 'number' || typeof point === 'string') return 'indexed';
  }
  return 'empty';
}

export function exportAsCSV(visualization: SavedVisualization): string {
  const { option } = visualization.spec;
  const series = Array.isArray(option.series) ? option.series : option.series ? [option.series] : [];

  if (!series.length) return exportAsJSON(visualization);

  // Pull x-axis category labels for indexed bar/line series (data: number[])
  const xAxisRaw = (option as Record<string, unknown>).xAxis;
  const primaryXAxis = (Array.isArray(xAxisRaw) ? xAxisRaw[0] : xAxisRaw) as Record<string, unknown> | undefined;
  const xCategories = Array.isArray(primaryXAxis?.data) ? (primaryXAxis!.data as unknown[]).map(String) : null;

  // Pre-scan all series shapes. Mixed shapes (e.g. one named-value series and
  // one indexed series) would produce rows that disagree with a single header —
  // fall back to JSON rather than emitting a misleading CSV.
  const shapes = series
    .map(s => detectSeriesShape(((s as Record<string, unknown>).data as unknown[]) ?? []))
    .filter((shape): shape is Exclude<SeriesShape, 'empty'> => shape !== 'empty');
  const uniqueShapes = new Set(shapes);
  if (uniqueShapes.size > 1) return exportAsJSON(visualization);

  try {
    const rows: string[] = [];
    let header = '';
    let wroteAny = false;

    for (const s of series) {
      const entry = s as Record<string, unknown>;
      const seriesName = String(entry.name ?? entry.type ?? 'series');
      const data = entry.data;
      if (!Array.isArray(data)) continue;

      for (let i = 0; i < data.length; i++) {
        const point = data[i];

        if (point !== null && point !== undefined && typeof point === 'object' && !Array.isArray(point)) {
          const p = point as Record<string, unknown>;
          if ('value' in p) {
            // Radar value is an array — join readable
            const val = Array.isArray(p.value) ? p.value.join(' | ') : p.value;
            if ('name' in p) {
              if (!header) { header = 'series,name,value'; rows.push(header); }
              rows.push(`${csvCell(seriesName)},${csvCell(p.name)},${csvCell(val)}`);
            } else {
              // Indexed point with a style override, e.g. { value, itemStyle } — treat like a plain value
              if (!header) {
                header = xCategories ? 'series,category,value' : 'series,index,value';
                rows.push(header);
              }
              const cat = xCategories ? (xCategories[i] ?? i) : i;
              rows.push(`${csvCell(seriesName)},${csvCell(cat)},${csvCell(val)}`);
            }
            wroteAny = true;
          }
        } else if (Array.isArray(point)) {
          if (!header) {
            header = 'series,' + point.map((_, idx) => `col${idx + 1}`).join(',');
            rows.push(header);
          }
          rows.push(`${csvCell(seriesName)},${point.map(csvCell).join(',')}`);
          wroteAny = true;
        } else if (typeof point === 'number' || typeof point === 'string') {
          // Indexed series — join with x-axis category if available
          if (!header) {
            header = xCategories ? 'series,category,value' : 'series,index,value';
            rows.push(header);
          }
          const cat = xCategories ? (xCategories[i] ?? i) : i;
          rows.push(`${csvCell(seriesName)},${csvCell(cat)},${csvCell(point)}`);
          wroteAny = true;
        }
      }
    }

    return wroteAny ? rows.join('\n') : exportAsJSON(visualization);
  } catch {
    return exportAsJSON(visualization);
  }
}

/**
 * Escape HTML special characters to prevent injection when embedding
 * user-controlled strings (e.g. titles) into a generated HTML document.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate a standalone HTML file for the visualization.
 * Pre-applies the full brand theme server-side so the exported file looks
 * identical to the in-app chart — no partial theme re-application needed.
 */
export function exportAsHTML(visualization: SavedVisualization): string {
  const { spec, title } = visualization;
  const themedOption = applyBrandTheme(applyChartDefaults(spec.option), spec.theme, spec.styleEffect);
  const bg = spec.theme.background === 'transparent' ? '#09090b' : (spec.theme.background ?? '#09090b');
  // Chart data (labels, names, tooltips) can contain arbitrary strings from
  // AI-generated specs — break any `</script>` sequence so it can't escape
  // the inline <script> block when this file is opened.
  const optionJson = JSON.stringify(themedOption).replace(/<\/script/gi, '<\\/script');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || 'Visualization')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${bg};
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    #chart {
      width: 100%;
      max-width: 1200px;
      height: 600px;
      border-radius: 12px;
    }
    .footer {
      margin-top: 16px;
      font-size: 11px;
      color: rgba(255,255,255,0.3);
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head>
<body>
  <div id="chart"></div>
  <div class="footer">Generated by VisualMe &middot; ${new Date().toLocaleDateString()}</div>
  <script>
    var option = ${optionJson};
    var chart = echarts.init(document.getElementById('chart'), null, { renderer: 'canvas' });
    chart.setOption(option);
    window.addEventListener('resize', function() { chart.resize(); });
  </script>
</body>
</html>`;
}
