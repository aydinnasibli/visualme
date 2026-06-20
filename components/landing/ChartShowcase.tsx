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
    case 'scatter': return { backgroundColor: 'transparent', grid: { top: 14, right: 14, bottom: 28, left: 38 }, xAxis: { type: 'value', name: '', ...ax, axisLine: { show: false }, min: 10, max: 100 }, yAxis: { type: 'value', name: '', ...ax, axisLine: { show: false }, min: 10, max: 100 }, series: [{ type: 'scatter', data: [[28, 72, 18], [45, 58, 28], [62, 85, 14], [78, 42, 32], [35, 90, 22], [88, 65, 26], [52, 35, 20]], symbolSize: (val: number[]) => val[2], itemStyle: { color: a, opacity: 0.75 } }, { type: 'scatter', data: [[22, 48, 24], [55, 78, 16], [72, 30, 30], [40, 62, 20], [85, 88, 18], [30, 25, 22]], symbolSize: (val: number[]) => val[2], itemStyle: { color: b, opacity: 0.75 } }, { type: 'scatter', data: [[18, 55, 20], [65, 45, 26], [48, 92, 16], [90, 72, 22], [38, 38, 24]], symbolSize: (val: number[]) => val[2], itemStyle: { color: c, opacity: 0.75 } }] };
    case 'pie': return { backgroundColor: 'transparent', color: [a, b, c, d, e], series: [{ type: 'pie', radius: ['38%', '66%'], center: ['50%', '50%'], data: [{ name: 'A', value: 38 }, { name: 'B', value: 26 }, { name: 'C', value: 20 }, { name: 'D', value: 16 }], label: { show: false }, itemStyle: { borderWidth: 2, borderColor: isDark ? '#111827' : '#F0F2F8' } }] };
    case 'radar': return { backgroundColor: 'transparent', radar: { indicator: [{ name: 'Speed', max: 100 }, { name: 'Quality', max: 100 }, { name: 'Coverage', max: 100 }, { name: 'Cost', max: 100 }, { name: 'Scale', max: 100 }], axisName: { color: tx, fontSize: 9 }, splitLine: { lineStyle: { color: gr } }, splitArea: { show: false }, axisLine: { lineStyle: { color: gr } }, radius: '62%' }, series: [{ type: 'radar', data: [{ value: [78, 90, 65, 72, 88], lineStyle: { color: a }, itemStyle: { color: a }, areaStyle: { color: a, opacity: 0.18 } }, { value: [58, 70, 88, 50, 70], lineStyle: { color: b }, itemStyle: { color: b }, areaStyle: { color: b, opacity: 0.18 } }] }] };
    case 'heatmap': {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const hours = ['9am', '11am', '1pm', '3pm', '5pm'];
      const values = [[0,0,8],[0,1,5],[0,2,3],[0,3,7],[0,4,9],[1,0,6],[1,1,4],[1,2,2],[1,3,8],[1,4,7],[2,0,3],[2,1,9],[2,2,6],[2,3,4],[2,4,5],[3,0,7],[3,1,6],[3,2,8],[3,3,3],[3,4,6],[4,0,9],[4,1,8],[4,2,5],[4,3,7],[4,4,4]];
      return { backgroundColor: 'transparent', grid: { top: 14, right: 14, bottom: 28, left: 38 }, xAxis: { type: 'category', data: hours, ...ax, splitArea: { show: false } }, yAxis: { type: 'category', data: days, ...ax, axisLine: { show: false } }, visualMap: { min: 1, max: 9, show: false, inRange: { color: [isDark ? '#1a2744' : '#e8ecf4', isDark ? '#2a4a8c' : '#7ba3d9', a] } }, series: [{ type: 'heatmap', data: values, label: { show: true, fontSize: 9, color: tx }, itemStyle: { borderWidth: 2, borderColor: isDark ? '#111827' : '#F0F2F8', borderRadius: 3 } }] };
    }
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
  { kind: 'scatter', label: 'Customer Segments', subtitle: 'Scatter / Bubble' },
  { kind: 'gauge', label: 'Service Uptime', subtitle: 'Gauge' },
  { kind: 'heatmap', label: 'Weekly Activity', subtitle: 'Heatmap' },
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
