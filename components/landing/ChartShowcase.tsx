'use client';

import { useTheme } from 'next-themes';
import ReactECharts from 'echarts-for-react';
import { useMounted } from '@/lib/hooks/useMounted';

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
    case 'sankey': return { backgroundColor: 'transparent', series: [{ type: 'sankey', left: '8%', right: '8%', top: '8%', bottom: '8%', nodeWidth: 14, nodeGap: 10, layoutIterations: 32, label: { color: tx, fontSize: 9 }, lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.35 }, itemStyle: { borderWidth: 0 }, data: [{ name: 'Organic', itemStyle: { color: a } }, { name: 'Paid', itemStyle: { color: b } }, { name: 'Referral', itemStyle: { color: c } }, { name: 'Signup', itemStyle: { color: d } }, { name: 'Trial', itemStyle: { color: e } }, { name: 'Converted', itemStyle: { color: a } }], links: [{ source: 'Organic', target: 'Signup', value: 40 }, { source: 'Paid', target: 'Signup', value: 30 }, { source: 'Referral', target: 'Signup', value: 15 }, { source: 'Signup', target: 'Trial', value: 60 }, { source: 'Signup', target: 'Converted', value: 25 }, { source: 'Trial', target: 'Converted', value: 35 }] }] };
    case 'funnel': return { backgroundColor: 'transparent', color: [a, b, c, d, e], series: [{ type: 'funnel', left: '15%', right: '15%', top: '8%', bottom: '8%', minSize: '20%', maxSize: '90%', gap: 3, label: { show: true, position: 'inside', color: '#fff', fontSize: 10, fontWeight: 600 }, itemStyle: { borderWidth: 0 }, data: [{ value: 100, name: 'Visitors' }, { value: 72, name: 'Signups' }, { value: 48, name: 'Active' }, { value: 28, name: 'Paid' }, { value: 12, name: 'Enterprise' }] }] };
    case 'gauge': return { backgroundColor: 'transparent', series: [{ type: 'gauge', center: ['50%', '58%'], radius: '80%', startAngle: 200, endAngle: -20, min: 0, max: 100, splitNumber: 5, itemStyle: { color: a }, progress: { show: true, width: 16, itemStyle: { color: a } }, pointer: { show: false }, axisLine: { lineStyle: { width: 16, color: [[1, gr]] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: tx, fontSize: 9, distance: -28 }, title: { show: true, offsetCenter: [0, '30%'], fontSize: 11, color: tx }, detail: { valueAnimation: true, fontSize: 28, fontWeight: 700, offsetCenter: [0, '-5%'], color: isDark ? '#fff' : '#1a1a2e', formatter: '{value}%' }, data: [{ value: 73, name: 'Uptime' }] }] };
    default: return {};
  }
}

const SHOWCASE = [
  { kind: 'bar', label: 'Quarterly Revenue', subtitle: 'Bar Chart' },
  { kind: 'line', label: 'User Growth Trend', subtitle: 'Line / Area' },
  { kind: 'sankey', label: 'Conversion Flow', subtitle: 'Sankey' },
  { kind: 'pie', label: 'Market Share Split', subtitle: 'Donut / Pie' },
  { kind: 'radar', label: 'Team Performance', subtitle: 'Radar' },
  { kind: 'funnel', label: 'Sales Pipeline', subtitle: 'Funnel' },
  { kind: 'graph', label: 'System Architecture', subtitle: 'Network Graph' },
  { kind: 'gauge', label: 'Service Uptime', subtitle: 'Gauge' },
  { kind: 'treemap', label: 'Budget Allocation', subtitle: 'Treemap' },
] as const;

function ShowcaseChart({ kind }: { kind: string }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <div className="w-full h-full rounded-lg bg-surface-1 animate-pulse" />;
  return <ReactECharts option={buildOption(kind, resolvedTheme !== 'light')} notMerge opts={{ renderer: 'canvas' }} style={{ height: '100%', width: '100%', minHeight: 160 }} />;
}

export default function ChartShowcase() {
  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {SHOWCASE.map(({ kind, label, subtitle }) => (
        <div key={kind} className="group relative rounded-xl overflow-hidden border border-edge bg-surface-0 hover:border-surface-3 transition-colors" style={{ aspectRatio: '4/3' }}>
          <ShowcaseChart kind={kind} />
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-linear-to-t from-surface-0/95 to-transparent">
            <span className="text-xs font-semibold text-ink block">{label}</span>
            <span className="text-[10px] text-ink-faint">{subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
