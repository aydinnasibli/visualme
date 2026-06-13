import { compositeChartCanvas, downloadDataUrl } from './canvas-export';

/**
 * Exports the chart `<canvas>` inside `area` as a downloaded PNG, composited
 * onto `area`'s resolved opaque background so the export matches what's on
 * screen in both light and dark mode.
 */
export function exportCanvasAsPNG(area: HTMLElement, filename: string): boolean {
  const exportCanvas = compositeChartCanvas(area);
  if (!exportCanvas) return false;

  downloadDataUrl(exportCanvas.toDataURL('image/png'), filename);
  return true;
}
