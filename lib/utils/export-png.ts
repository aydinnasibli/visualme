/**
 * Walks up from `el` to the nearest ancestor with a fully opaque
 * background-color, falling back to white. Computed colors come back as
 * `oklab()`/`lab()` under Tailwind v4, so opacity is checked by painting
 * onto a 1x1 canvas (which parses any CSS color space) and reading the
 * resulting alpha channel rather than regex-matching `rgb()`/`rgba()`.
 */
function resolveOpaqueBackground(el: HTMLElement | null): string {
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '#ffffff';

  while (el) {
    const color = getComputedStyle(el).backgroundColor;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const alpha = ctx.getImageData(0, 0, 1, 1).data[3];
    if (alpha === 255) return color;
    el = el.parentElement;
  }
  return '#ffffff';
}

/**
 * Exports the chart `<canvas>` inside `area` as a downloaded PNG. ECharts
 * renders the canvas with `backgroundColor: 'transparent'` so the chart
 * blends into the dashboard surface — `canvas.toDataURL()` alone would keep
 * that transparency, leaving dark-mode (light-on-dark) text illegible once
 * viewed outside the app. Composited here onto the nearest opaque ancestor
 * background so the export matches what's on screen.
 */
export function exportCanvasAsPNG(area: HTMLElement, filename: string): boolean {
  const canvas = area.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas) return false;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return false;

  ctx.fillStyle = resolveOpaqueBackground(area);
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(canvas, 0, 0);

  const link = document.createElement('a');
  link.download = filename;
  link.href = exportCanvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
