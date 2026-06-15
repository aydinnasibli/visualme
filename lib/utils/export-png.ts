import { compositeChartCanvas, resolveOpaqueBackground, contrastTextColor, downloadDataUrl } from './canvas-export';

const CAPTION_HEIGHT = 56;
const CAPTION_PADDING = 24;

/**
 * Exports the chart `<canvas>` inside `area` as a downloaded PNG, composited
 * onto `area`'s resolved opaque background so the export matches what's on
 * screen in both light and dark mode. When `caption` is provided (a verified
 * stat test result), it's drawn in a strip below the chart.
 */
export function exportCanvasAsPNG(area: HTMLElement, filename: string, caption?: string): boolean {
  const chartCanvas = compositeChartCanvas(area);
  if (!chartCanvas) return false;

  if (!caption) {
    downloadDataUrl(chartCanvas.toDataURL('image/png'), filename);
    return true;
  }

  const bg = resolveOpaqueBackground(area);
  const textColor = contrastTextColor(bg.rgb);

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = chartCanvas.width;
  exportCanvas.height = chartCanvas.height + CAPTION_HEIGHT;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return false;

  ctx.fillStyle = bg.css;
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(chartCanvas, 0, 0);

  ctx.fillStyle = `rgb(${textColor.join(',')})`;
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(caption, CAPTION_PADDING, chartCanvas.height + CAPTION_HEIGHT / 2, exportCanvas.width - CAPTION_PADDING * 2);

  downloadDataUrl(exportCanvas.toDataURL('image/png'), filename);
  return true;
}
