'use client';

import { useTheme } from 'next-themes';
import ReactECharts from 'echarts-for-react';
import { useMounted } from '@/lib/hooks/useMounted';

/* ── ECharts showcase ── */
function buildOption(kind: string, isDark: boolean) {
  const a = isDark ? '#5B8FFF' : '#1A5DD9';
  const b = isDark ? '#3ECFB8' : '#0E9E82';
  const c = isDark ? '#FFC144' : '#C87800';
  const d = isDark ? '#E86452' : '#B83A28';
  const e = isDark ? '#C47CF5' : '#8644E0';
  const tx = isDark ? '#8899B4' : '#5C7090';
  const gr = isDark ? '#1E2A3C' : '#D4DBE8';
  const ax = { axisLabel: { color: tx, fontSize: 10 }, axisLine: { lineStyle: { color: gr } }, splitLine: { lineStyle: { color: gr, type: 'dashed' as const } }, axisTick: { show: false } };

  switch (kind) {
    case 'bar': return { backgroundColor: 'transparent', grid: { top: 14, right: 14, bottom: 28, left: 38 }, xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], ...ax }, yAxis: { type: 'value', ...ax, axisLine: { show: false } }, series: [{ type: 'bar', data: [62, 80, 58, 92, 71], itemStyle: { color: a, borderRadius: [3, 3, 0, 0] }, barMaxWidth: 32 }] };
    case 'line': return { backgroundColor: 'transparent', grid: { top: 14, right: 14, bottom: 28, left: 38 }, xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], ...ax }, yAxis: { type: 'value', ...ax, axisLine: { show: false } }, series: [{ type: 'line', smooth: true, data: [18, 36, 28, 58, 44, 72], itemStyle: { color: a }, lineStyle: { color: a, width: 2 }, areaStyle: { color: a, opacity: 0.12 }, symbolSize: 5 }, { type: 'line', smooth: true, data: [32, 22, 48, 30, 62, 42], itemStyle: { color: b }, lineStyle: { color: b, width: 2 }, areaStyle: { color: b, opacity: 0.12 }, symbolSize: 5 }] };
    case 'graph': return { backgroundColor: 'transparent', series: [{ type: 'graph', layout: 'force', roam: false, animation: false, force: { repulsion: 80, gravity: 0.06, edgeLength: 55 }, data: [{ name: 'Core', symbolSize: 38, itemStyle: { color: a } }, { name: 'API', symbolSize: 22, itemStyle: { color: b } }, { name: 'DB', symbolSize: 22, itemStyle: { color: c } }, { name: 'Auth', symbolSize: 18, itemStyle: { color: d } }, { name: 'Cache', symbolSize: 18, itemStyle: { color: e } }, { name: 'Queue', symbolSize: 18, itemStyle: { color: b } }], links: [{ source: 'Core', target: 'API' }, { source: 'Core', target: 'DB' }, { source: 'Core', target: 'Auth' }, { source: 'Core', target: 'Cache' }, { source: 'Core', target: 'Queue' }, { source: 'API', target: 'Auth' }, { source: 'DB', target: 'Cache' }], label: { show: true, fontSize: 9, color: tx, position: 'inside' }, lineStyle: { color: gr, width: 1.2 }, emphasis: { focus: 'adjacency' } }] };
    case 'pie': return { backgroundColor: 'transparent', color: [a, b, c, d, e], series: [{ type: 'pie', radius: ['38%', '66%'], center: ['50%', '50%'], data: [{ name: 'A', value: 38 }, { name: 'B', value: 26 }, { name: 'C', value: 20 }, { name: 'D', value: 16 }], label: { show: false }, itemStyle: { borderWidth: 2, borderColor: isDark ? '#111827' : '#F0F2F8' } }] };
    case 'radar': return { backgroundColor: 'transparent', radar: { indicator: [{ name: 'Speed', max: 100 }, { name: 'Quality', max: 100 }, { name: 'Coverage', max: 100 }, { name: 'Cost', max: 100 }, { name: 'Scale', max: 100 }], axisName: { color: tx, fontSize: 9 }, splitLine: { lineStyle: { color: gr } }, splitArea: { show: false }, axisLine: { lineStyle: { color: gr } }, radius: '62%' }, series: [{ type: 'radar', data: [{ value: [78, 90, 65, 72, 88], lineStyle: { color: a }, itemStyle: { color: a }, areaStyle: { color: a, opacity: 0.18 } }, { value: [58, 70, 88, 50, 70], lineStyle: { color: b }, itemStyle: { color: b }, areaStyle: { color: b, opacity: 0.18 } }] }] };
    case 'treemap': return { backgroundColor: 'transparent', series: [{ type: 'treemap', width: '98%', height: '92%', top: '4%', left: '1%', roam: false, nodeClick: false, breadcrumb: { show: false }, label: { fontSize: 11, color: '#fff', fontWeight: 600 }, itemStyle: { gapWidth: 2, borderRadius: 3 }, data: [{ name: 'Analytics', value: 42, itemStyle: { color: a } }, { name: 'Reports', value: 32, itemStyle: { color: b } }, { name: 'Dashboards', value: 24, itemStyle: { color: c } }, { name: 'Alerts', value: 18, itemStyle: { color: d } }, { name: 'Exports', value: 14, itemStyle: { color: e } }, { name: 'Settings', value: 10, itemStyle: { color: isDark ? '#4A7FC4' : '#3560A8' } }] }] };
    default: return {};
  }
}

const SHOWCASE = [
  { kind: 'bar', label: 'Bar Chart' }, { kind: 'line', label: 'Line / Area' },
  { kind: 'graph', label: 'Network Graph' }, { kind: 'pie', label: 'Donut / Pie' },
  { kind: 'radar', label: 'Radar' }, { kind: 'treemap', label: 'Treemap' },
] as const;

function ShowcaseChart({ kind }: { kind: string }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <div className="w-full h-full rounded-lg bg-surface-1 animate-pulse" />;
  return <ReactECharts option={buildOption(kind, resolvedTheme !== 'light')} notMerge opts={{ renderer: 'canvas' }} style={{ height: '100%', width: '100%', minHeight: 160 }} />;
}

export default function ChartShowcase() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
      {SHOWCASE.map(({ kind, label }) => (
        <div key={kind} className="group relative rounded-xl overflow-hidden border border-edge bg-surface-0 hover:border-surface-3 transition-colors" style={{ aspectRatio: '4/3' }}>
          <ShowcaseChart kind={kind} />
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-1/90 border-t border-edge">
            <span className="text-xs font-semibold text-ink">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
