/**
 * Export Service
 * Handles exporting visualizations in various formats (PNG, SVG, PDF, JSON, CSV, HTML)
 */

import type {
  SavedVisualization,
  ExportFormat,
  ExportOptions,
  LineChartData,
  BarChartData,
  RadarChartData,
  ScatterPlotData,
  PieChartData,
  ComparisonTableData,
  HeatmapData,
} from '../types/visualization';
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
 * Export visualization data as JSON
 */
export function exportAsJSON(visualization: SavedVisualization, options?: ExportOptions): string {
  const exportData = {
    type: visualization.type,
    data: visualization.data,
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
 * Export visualization data as CSV
 * Only works for numerical/tabular data formats
 */
export function exportAsCSV(visualization: SavedVisualization): string {
  const { type, data } = visualization;

  // Only certain types can be exported as CSV
  const supportedTypes = [
    'line_chart',
    'bar_chart',
    'scatter_plot',
    'heatmap',
    'radar_chart',
    'pie_chart',
    'comparison_table',
  ];

  if (!supportedTypes.includes(type)) {
    throw new Error(`CSV export not supported for ${type}`);
  }

  try {
    let rows: string[] = [];

    if (
      type === 'line_chart' ||
      type === 'bar_chart' ||
      type === 'radar_chart'
    ) {
      const chartData = data as LineChartData | BarChartData | RadarChartData;
      if (chartData.data && Array.isArray(chartData.data)) {
        // Get headers from first data point
        const headers = Object.keys(chartData.data[0] || {});
        rows.push(headers.join(','));

        // Add data rows
        chartData.data.forEach((row: Record<string, any>) => {
          const values = headers.map((h) => String(row[h] || ''));
          rows.push(values.join(','));
        });
      }
    } else if (type === 'scatter_plot') {
      const scatterData = data as ScatterPlotData;
      if (scatterData.data && Array.isArray(scatterData.data)) {
        rows.push('x,y,z,name,category');
        scatterData.data.forEach((point) => {
          rows.push(
            `${point.x || ''},${point.y || ''},${point.z || ''},${point.name || ''},${point.category || ''}`
          );
        });
      }
    } else if (type === 'pie_chart') {
      const pieData = data as PieChartData;
      if (pieData.data && Array.isArray(pieData.data)) {
        rows.push('name,value');
        pieData.data.forEach((slice) => {
          rows.push(`${slice.name},${slice.value}`);
        });
      }
    } else if (type === 'comparison_table') {
      const tableData = data as ComparisonTableData;
      if (tableData.columns && tableData.data) {
        const headers = tableData.columns.map((col) => col.header);
        rows.push(headers.join(','));

        tableData.data.forEach((row) => {
          const values = tableData.columns.map((col) =>
            String(row[col.accessorKey] || '')
          );
          rows.push(values.join(','));
        });
      }
    } else if (type === 'heatmap') {
      const heatmapData = data as HeatmapData;
      if (heatmapData.data && Array.isArray(heatmapData.data)) {
        rows.push('x,y,value');
        heatmapData.data.forEach((cell) => {
          rows.push(`${cell.x},${cell.y},${cell.value}`);
        });
      }
    }

    return rows.join('\n');
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('Failed to export as CSV');
  }
}

/**
 * Generate HTML for standalone interactive visualization
 * This creates a complete HTML file that can be opened in any browser
 */
export function exportAsHTML(visualization: SavedVisualization): string {
  const { type, data, title } = visualization;

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
    .visualization {
      background: white;
      border-radius: 8px;
      padding: 20px;
      min-height: 400px;
    }
    .metadata {
      color: #ccc;
      font-size: 0.875rem;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title || 'Visualization'}</h1>
    <p>Type: ${type.replace(/_/g, ' ').toUpperCase()}</p>
  </div>

  <div class="container">
    <div class="visualization">
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>

    <div class="metadata">
      <p><strong>Format:</strong> ${type}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Note:</strong> This is a standalone HTML export. For full interactivity, use the web application.</p>
    </div>
  </div>

  <script>
    // Data is embedded for potential client-side rendering
    const visualizationData = ${JSON.stringify({ type, data }, null, 2)};
    console.log('Visualization data:', visualizationData);

    // You can add library-specific rendering code here
    // For example, load Recharts, D3, etc. from CDN and render the visualization
  </script>
</body>
</html>`;
}

/**
 * Validate export format for given visualization type
 */
export function canExportAs(visualizationType: string, exportFormat: ExportFormat): boolean {
  const csvCompatibleTypes = [
    'line_chart',
    'bar_chart',
    'scatter_plot',
    'heatmap',
    'radar_chart',
    'pie_chart',
    'comparison_table',
  ];

  const svgCompatibleTypes = [
    'network_graph',
    'tree_diagram',
    'force_directed_graph',
    'timeline',
    'flowchart',
    'sankey_diagram',
    'line_chart',
    'bar_chart',
    'scatter_plot',
    'heatmap',
    'radar_chart',
    'pie_chart',
  ];

  switch (exportFormat) {
    case 'csv':
      return csvCompatibleTypes.includes(visualizationType);
    case 'svg':
      return svgCompatibleTypes.includes(visualizationType);
    case 'png':
    case 'pdf':
    case 'html':
    case 'json':
      return true; // All types support these formats
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
