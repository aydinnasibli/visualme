import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

/**
 * Exports an ECharts option as a downloaded .svg file by spinning up a
 * temporary off-screen ECharts SVG-renderer instance, serializing the
 * resulting <svg> DOM node, and triggering a download. Runs entirely
 * client-side; never call from a server context.
 */
export function exportChartAsSVG(option: EChartsOption, filename: string): boolean {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:900px;height:560px;';
  document.body.appendChild(div);
  let chart: echarts.ECharts | null = null;
  try {
    chart = echarts.init(div, null, { renderer: 'svg', width: 900, height: 560 });
    chart.setOption(option);
    const svgString = chart.renderToSVGString({ useViewBox: true });
    if (!svgString) return false;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  } finally {
    chart?.dispose();
    document.body.removeChild(div);
  }
}
