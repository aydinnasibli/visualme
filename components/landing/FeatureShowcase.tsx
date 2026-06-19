'use client';

import { useTheme } from 'next-themes';
import ReactECharts from 'echarts-for-react';
import { useMounted } from '@/lib/hooks/useMounted';
import { useState } from 'react';
import { Check, FileSpreadsheet, Globe, Download, Link2 } from 'lucide-react';

const FONT = 'Inter, system-ui, sans-serif';

function themeAx(dark: boolean) {
  const tx = dark ? '#8899B4' : '#5C7090';
  const gr = dark ? '#1E2A3C' : '#D4DBE8';
  return { axisLabel: { color: tx, fontSize: 9, fontFamily: FONT }, axisLine: { lineStyle: { color: gr } }, splitLine: { lineStyle: { color: gr, type: 'dashed' as const } }, axisTick: { show: false } };
}

// ── Stats feature: mini chart + results overlay ──
function StatsDemo({ dark }: { dark: boolean }) {
  const a = dark ? '#5B8FFF' : '#1A5DD9';
  const b = dark ? '#3ECFB8' : '#0E9E82';
  const option = {
    backgroundColor: 'transparent',
    grid: { top: 10, right: 10, bottom: 24, left: 32 },
    xAxis: { type: 'category', data: ['Control', 'Variant A', 'Variant B'], ...themeAx(dark) },
    yAxis: { type: 'value', ...themeAx(dark), axisLine: { show: false } },
    series: [{ type: 'bar', data: [42, 58, 61], itemStyle: { color: (p: { dataIndex: number }) => p.dataIndex === 0 ? (dark ? '#64748b' : '#94a3b8') : a, borderRadius: [3, 3, 0, 0] }, barMaxWidth: 36 }],
  };
  return (
    <div className="relative w-full h-full">
      <ReactECharts option={option} notMerge opts={{ renderer: 'canvas' }} style={{ height: '100%', width: '100%' }} />
      <div className="absolute top-2 right-2 rounded-lg border border-edge bg-surface-0/95 p-2.5" style={{ minWidth: 140 }}>
        <p className="text-[9px] font-bold uppercase tracking-wider text-accent mb-1.5">Independent t-test</p>
        <div className="space-y-1">
          {[['t-statistic', '2.847'], ['p-value', '0.0042'], ['Result', 'Significant']].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[9px]">
              <span className="text-ink-faint">{k}</span>
              <span className={`font-semibold ${k === 'Result' ? 'text-accent' : 'text-ink'}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Theme feature: same chart in two palettes ──
const PALETTES = {
  Sunset: ['#f97316', '#ef4444', '#f59e0b', '#ec4899'],
  Ocean: ['#0ea5e9', '#06b6d4', '#14b8a6', '#3b82f6'],
  Forest: ['#10b981', '#84cc16', '#22c55e', '#65a30d'],
  Berry: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef'],
};

function ThemeDemo({ dark }: { dark: boolean }) {
  const [palette, setPalette] = useState<keyof typeof PALETTES>('Sunset');
  const colors = PALETTES[palette];
  const bg = dark ? '#111827' : '#F0F2F8';
  const option = {
    backgroundColor: 'transparent',
    color: colors,
    series: [{ type: 'pie', radius: ['42%', '70%'], center: ['50%', '50%'], data: [{ name: 'Direct', value: 38 }, { name: 'Organic', value: 26 }, { name: 'Referral', value: 20 }, { name: 'Social', value: 16 }], label: { show: false }, itemStyle: { borderWidth: 2, borderColor: bg } }],
  };
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-1.5 px-3 pt-3 pb-1">
        {(Object.keys(PALETTES) as (keyof typeof PALETTES)[]).map(name => (
          <button key={name} onClick={() => setPalette(name)}
            className={`px-2 py-1 rounded text-[9px] font-semibold transition-colors ${palette === name ? 'bg-accent/15 text-accent border border-accent/30' : 'text-ink-faint hover:text-ink-muted border border-transparent'}`}>
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: PALETTES[name][0] }} />
            {name}
          </button>
        ))}
      </div>
      <div className="flex-1">
        <ReactECharts key={palette} option={option} notMerge opts={{ renderer: 'canvas' }} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}

// ── Dashboard feature: mini 2x2 chart grid ──
function DashboardDemo({ dark }: { dark: boolean }) {
  const a = dark ? '#5B8FFF' : '#1A5DD9';
  const b = dark ? '#3ECFB8' : '#0E9E82';
  const c = dark ? '#FFC144' : '#C87800';
  const d = dark ? '#E86452' : '#B83A28';
  const tx = dark ? '#8899B4' : '#5C7090';
  const gr = dark ? '#1E2A3C' : '#D4DBE8';
  const ax = { axisLabel: { color: tx, fontSize: 8, fontFamily: FONT }, axisLine: { lineStyle: { color: gr } }, splitLine: { show: false }, axisTick: { show: false } };

  const bar = { backgroundColor: 'transparent', grid: { top: 6, right: 4, bottom: 18, left: 28 }, xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], ...ax }, yAxis: { type: 'value', ...ax, axisLine: { show: false } }, series: [{ type: 'bar', data: [32, 45, 38, 52, 41], itemStyle: { color: a, borderRadius: [2, 2, 0, 0] }, barMaxWidth: 16 }] };
  const line = { backgroundColor: 'transparent', grid: { top: 6, right: 4, bottom: 18, left: 28 }, xAxis: { type: 'category', data: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], ...ax, boundaryGap: false }, yAxis: { type: 'value', ...ax, axisLine: { show: false } }, series: [{ type: 'line', smooth: true, data: [12, 18, 15, 28, 24, 36], itemStyle: { color: b }, lineStyle: { width: 1.5 }, areaStyle: { color: b, opacity: 0.1 }, symbolSize: 3 }] };
  const pie = { backgroundColor: 'transparent', color: [a, b, c, d], series: [{ type: 'pie', radius: ['30%', '60%'], center: ['50%', '50%'], data: [{ value: 38 }, { value: 26 }, { value: 20 }, { value: 16 }], label: { show: false }, itemStyle: { borderWidth: 1, borderColor: dark ? '#111827' : '#F0F2F8' } }] };
  const gauge = { backgroundColor: 'transparent', series: [{ type: 'gauge', center: ['50%', '55%'], radius: '70%', startAngle: 200, endAngle: -20, min: 0, max: 100, progress: { show: true, width: 10, itemStyle: { color: a } }, pointer: { show: false }, axisLine: { lineStyle: { width: 10, color: [[1, gr]] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { valueAnimation: true, fontSize: 16, fontWeight: 700, offsetCenter: [0, 0], color: dark ? '#fff' : '#1a1a2e', formatter: '{value}%' }, data: [{ value: 87 }] }] };

  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1.5 p-2">
      {[bar, line, pie, gauge].map((opt, i) => (
        <div key={i} className="rounded-lg border border-edge bg-surface-0 overflow-hidden">
          <ReactECharts option={opt} notMerge opts={{ renderer: 'canvas' }} style={{ height: '100%', width: '100%' }} />
        </div>
      ))}
    </div>
  );
}

// ── Data flow feature: file types + sheets + export ──
function DataFlowDemo() {
  return (
    <div className="w-full h-full flex flex-col justify-center px-6 py-5 gap-6">
      {/* Input */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2.5">Bring your data</p>
        <div className="flex flex-wrap gap-2">
          {['CSV', 'JSON', 'XLSX', 'PDF', 'TXT'].map(f => (
            <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-2 border border-edge text-ink-muted">
              <FileSpreadsheet size={11} /> {f}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent/10 border border-accent/25 text-accent">
            <Globe size={11} /> Google Sheets (live)
          </span>
        </div>
      </div>
      {/* Output */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2.5">Get it out</p>
        <div className="flex flex-wrap gap-2">
          {['PNG', 'SVG', 'HTML', 'JSON', 'CSV'].map(f => (
            <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-2 border border-edge text-ink-muted">
              <Download size={11} /> {f}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent/10 border border-accent/25 text-accent">
            <Link2 size={11} /> Share link
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main feature showcase ──
const FEATURES = [
  {
    title: 'Statistical analysis, not AI guesses',
    desc: 'Run t-tests, ANOVA, chi-square, and Pearson correlation directly on your dataset. Deterministic, browser-only. Results you can cite.',
    Visual: StatsDemo,
    needsTheme: true,
  },
  {
    title: 'One click, different look',
    desc: '6 palette presets, 4 font families, adjustable spacing, legend position, and corner radius. Change the brand without regenerating the chart.',
    Visual: ThemeDemo,
    needsTheme: true,
  },
  {
    title: 'Compose a dashboard',
    desc: 'Drag, resize, and arrange multiple charts into a single shareable dashboard. Each chart keeps its own data and refinement history.',
    Visual: DashboardDemo,
    needsTheme: true,
  },
  {
    title: 'Data in, charts out',
    desc: 'Upload files or connect a public Google Sheet that refreshes on a schedule. Export finished charts in 5 formats, or share a live link.',
    Visual: DataFlowDemo,
    needsTheme: false,
  },
] as const;

export default function FeatureShowcase() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const dark = resolvedTheme !== 'light';

  return (
    <div className="space-y-4">
      {FEATURES.map(({ title, desc, Visual, needsTheme }, i) => {
        const flipped = i % 2 === 1;
        const textSide = (
          <div key="text" className="p-8 lg:p-10 flex flex-col justify-center">
            <h3 className="font-bold text-ink mb-3" style={{ fontSize: '1.25rem' }}>{title}</h3>
            <p className="text-sm text-ink-muted leading-relaxed" style={{ maxWidth: '40ch' }}>{desc}</p>
          </div>
        );
        const visualSide = (
          <div key="visual" className={`bg-surface-1 border-t lg:border-t-0 ${flipped ? 'lg:border-r' : 'lg:border-l'} border-edge`} style={{ minHeight: 240 }}>
            {mounted ? (
              needsTheme ? <Visual dark={dark} /> : <Visual />
            ) : (
              <div className="w-full h-full animate-pulse bg-surface-1" />
            )}
          </div>
        );
        return (
          <div key={title} className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl border border-edge overflow-hidden bg-surface-0">
            {flipped ? <>{visualSide}{textSide}</> : <>{textSide}{visualSide}</>}
          </div>
        );
      })}
    </div>
  );
}
