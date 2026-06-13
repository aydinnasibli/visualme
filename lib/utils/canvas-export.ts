/**
 * Shared helpers for exporting chart canvases to PNG/PDF. Centralizes the
 * "resolve the real on-screen background" logic used by both the single-chart
 * PNG export and the multi-chart dashboard export, so exported images match
 * what's on screen in both light and dark mode.
 */

export interface ResolvedBackground {
  /** CSS color usable as a canvas `fillStyle` (whatever color space the browser reports). */
  css: string;
  /** Opaque RGB triplet (0-255), derived by painting `css` onto a probe canvas — safe for jsPDF's setFillColor/setTextColor, which don't understand oklch()/lab(). */
  rgb: [number, number, number];
}

/**
 * Walks up from `el` to the nearest ancestor with a fully opaque
 * background-color, falling back to white. Computed colors come back as
 * `oklab()`/`lab()` under Tailwind v4, so opacity (and the RGB triplet) is
 * read by painting onto a 1x1 canvas rather than regex-matching `rgb()`/`rgba()`.
 */
export function resolveOpaqueBackground(el: HTMLElement | null): ResolvedBackground {
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { css: '#ffffff', rgb: [255, 255, 255] };

  while (el) {
    const color = getComputedStyle(el).backgroundColor;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 255) return { css: color, rgb: [r, g, b] };
    el = el.parentElement;
  }
  return { css: '#ffffff', rgb: [255, 255, 255] };
}

/**
 * Finds the chart `<canvas>` inside `area` and composites it onto a copy
 * painted with `area`'s resolved opaque background — ECharts renders with
 * `backgroundColor: 'transparent'`, so `canvas.toDataURL()` alone would keep
 * that transparency and leave dark-mode (light-on-dark) text illegible once
 * viewed outside the app.
 */
export function compositeChartCanvas(area: HTMLElement): HTMLCanvasElement | null {
  const canvas = area.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas) return null;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = resolveOpaqueBackground(area).css;
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(canvas, 0, 0);
  return exportCanvas;
}

/** Picks a near-black or near-white text color readable against `bg`. */
export function contrastTextColor(bg: [number, number, number]): [number, number, number] {
  const [r, g, b] = bg;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? [23, 23, 23] : [245, 245, 245];
}

/** Triggers a browser download for a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Filesystem/URL-safe filename fragment derived from a title. */
export function slugifyTitle(title: string, fallback: string): string {
  return title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 60) || fallback;
}
