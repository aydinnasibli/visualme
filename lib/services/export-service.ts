/**
 * Export Service
 * Handles exporting visualizations in various formats (PNG, SVG, PDF, JSON, CSV, HTML)
 */

import type { SavedVisualization, ExportFormat, ExportOptions } from '../types/visualization';
import { generateShareId } from '../utils/helpers';

/**
 * Generate a shareable link for a visualization
 */
export async function generateShareLink(
  visualizationId: string,
  userId: string,
  options: {
    expiresIn?: number;
    password?: string;
    isPublic: boolean;
  }
): Promise<{ shareId: string; shareUrl: string }> {
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
 * Export visualization series data as CSV.
 * Flattens each ECharts series' data array into rows — works for any
 * category/value-shaped series (bar, line, pie, scatter, radar, etc).
 * Falls back to a JSON dump for series shapes that don't flatten cleanly
 * (graphs, trees, sankeys — structurally relational, not tabular).
 */
export function exportAsCSV(visualization: SavedVisualization): string {
  const { option } = visualization.spec;
  const series = Array.isArray(option.series) ? option.series : option.series ? [option.series] : [];

  if (!series.length) return exportAsJSON(visualization);

  try {
    const rows: string[] = ['series,name,value'];
    let wroteAny = false;

    for (const s of series) {
      const entry = s as Record<string, unknown>;
      const seriesName = String(entry.name ?? entry.type ?? 'series');
      const data = entry.data;
      if (!Array.isArray(data)) continue;

      for (const point of data) {
        if (point && typeof point === 'object' && !Array.isArray(point)) {
          const p = point as Record<string, unknown>;
          if ('name' in p && 'value' in p) {
            rows.push(`${seriesName},${String(p.name)},${String(p.value)}`);
            wroteAny = true;
          }
        } else if (Array.isArray(point)) {
          rows.push(`${seriesName},,${point.join(' / ')}`);
          wroteAny = true;
        } else if (typeof point === 'number' || typeof point === 'string') {
          rows.push(`${seriesName},,${String(point)}`);
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
 * Generate HTML for a standalone visualization snapshot.
 * Embeds the raw spec — for full interactivity, use the web application.
 */
export function exportAsHTML(visualization: SavedVisualization): string {
  const { spec, title } = visualization;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Visualization'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    .header {
      text-align: center;
      color: white;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .container {
      width: 100%;
      max-width: 1200px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }
    #chart {
      background: white;
      border-radius: 8px;
      min-height: 480px;
    }
    .metadata {
      color: #ccc;
      font-size: 0.875rem;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head>
<body>
  <div class="header">
    <h1>${title || 'Visualization'}</h1>
  </div>

  <div class="container">
    <div id="chart"></div>

    <div class="metadata">
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Note:</strong> This is a standalone HTML snapshot. For full interactivity and editing, use the web application.</p>
    </div>
  </div>

  <script>
    const option = ${JSON.stringify(spec.option)};
    const theme = ${JSON.stringify(spec.theme)};
    option.color = theme.palette;
    option.backgroundColor = theme.background;
    const chart = echarts.init(document.getElementById('chart'), null, { renderer: 'canvas', height: 480 });
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
  </script>
</body>
</html>`;
}

/**
 * Validate export format for a visualization. Every spec is a single
 * ECharts option now, so format support is uniform across all charts.
 */
export function canExportAs(_visualizationType: string, exportFormat: ExportFormat): boolean {
  switch (exportFormat) {
    case 'csv':
    case 'svg':
    case 'png':
    case 'pdf':
    case 'html':
    case 'json':
      return true;
    default:
      return false;
  }
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: ExportFormat): string {
  return format;
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: ExportFormat): string {
  const mimeTypes: Record<ExportFormat, string> = {
    png: 'image/png',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    json: 'application/json',
    csv: 'text/csv',
    html: 'text/html',
  };

  return mimeTypes[format];
}
