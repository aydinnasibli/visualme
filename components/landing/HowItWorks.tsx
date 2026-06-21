'use client';

import { useTheme } from 'next-themes';
import ReactECharts from 'echarts-for-react';
import { useMounted } from '@/lib/hooks/useMounted';

function StepVisual1({ dark }: { dark: boolean }) {
  const tx = dark ? '#8899B4' : '#5C7090';
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-4">
      <div className="w-full max-w-[240px] space-y-2">
        <div className="rounded-lg border border-edge bg-surface-1 px-3 py-2">
          <p className="text-[10px] text-ink-faint mb-1.5">Prompt</p>
          <p className="text-xs font-medium text-ink">&quot;Compare revenue by quarter across regions&quot;</p>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <div className="h-px flex-1 bg-edge" />
          <span className="text-[9px] font-semibold text-ink-faint uppercase tracking-wider px-2">or</span>
          <div className="h-px flex-1 bg-edge" />
        </div>
        <div className="rounded-lg border border-edge bg-surface-1 px-3 py-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-surface-2 border border-edge flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 13V5h3v8H2Zm4.5 0V3h3v10h-3ZM11 13V7h3v6h-3Z" fill={tx} opacity="0.5"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-ink">sales_data.csv</p>
            <p className="text-[9px] text-ink-faint">24 rows, 4 columns</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepVisual2({ dark }: { dark: boolean }) {
  const a = dark ? '#5B8FFF' : '#1A5DD9';
  const b = dark ? '#3ECFB8' : '#0E9E82';
  const tx = dark ? '#8899B4' : '#5C7090';
  const gr = dark ? '#1E2A3C' : '#D4DBE8';
  const ax = { axisLabel: { color: tx, fontSize: 9 }, axisLine: { lineStyle: { color: gr } }, splitLine: { lineStyle: { color: gr, type: 'dashed' as const } }, axisTick: { show: false } };

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 10, right: 10, bottom: 24, left: 32 },
    xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'], ...ax },
    yAxis: { type: 'value', ...ax, axisLine: { show: false } },
    series: [
      { type: 'bar', data: [62, 80, 58, 92], itemStyle: { color: a, borderRadius: [3, 3, 0, 0] }, barMaxWidth: 24 },
      { type: 'bar', data: [45, 65, 72, 68], itemStyle: { color: b, borderRadius: [3, 3, 0, 0] }, barMaxWidth: 24 },
    ],
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 p-2">
        <ReactECharts option={option} notMerge opts={{ renderer: 'canvas' }} style={{ height: '100%', width: '100%' }} />
      </div>
      <div className="px-3 pb-3 space-y-1">
        <div className="rounded-md bg-surface-2 border border-edge px-2 py-1.5 flex items-start gap-1.5">
          <span className="text-[9px] mt-px shrink-0">💬</span>
          <p className="text-[10px] text-ink-muted">&quot;Make it horizontal and add a target line at 70&quot;</p>
        </div>
      </div>
    </div>
  );
}

function StepVisual3({ dark }: { dark: boolean }) {
  const tx = dark ? '#8899B4' : '#5C7090';
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-4">
      <div className="w-full max-w-[240px] space-y-2">
        {[
          { format: 'PNG', desc: 'High-res image', icon: '🖼' },
          { format: 'SVG', desc: 'Vector graphic', icon: '✏️' },
          { format: 'Share link', desc: 'Anyone can view', icon: '🔗' },
        ].map(({ format, desc, icon }) => (
          <div key={format} className="rounded-lg border border-edge bg-surface-1 px-3 py-2 flex items-center gap-2.5 hover:border-surface-3 transition-colors">
            <span className="text-sm">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink">{format}</p>
              <p className="text-[9px] text-ink-faint">{desc}</p>
            </div>
            <div className="w-5 h-5 rounded bg-surface-2 border border-edge flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 13h10M8 3v7m0 0L5 7m3 3 3-3" stroke={tx} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  {
    number: '01',
    title: 'Describe or upload',
    desc: 'Type what you want to see in plain English, or drop a CSV, JSON, or XLSX file.',
    Visual: StepVisual1,
  },
  {
    number: '02',
    title: 'Refine with AI',
    desc: 'The AI picks the chart type, maps your data, and renders it. Ask for changes in plain English.',
    Visual: StepVisual2,
  },
  {
    number: '03',
    title: 'Export & share',
    desc: 'Download as PNG, SVG, PDF, or HTML. Share a live link. Embed anywhere.',
    Visual: StepVisual3,
  },
] as const;

export default function HowItWorks() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const dark = mounted ? resolvedTheme !== 'light' : true;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STEPS.map(({ number, title, desc, Visual }) => (
        <div key={number} className="rounded-2xl border border-edge bg-surface-0 overflow-hidden flex flex-col">
          <div className="border-b border-edge bg-surface-1" style={{ height: 200 }}>
            {mounted ? (
              <Visual dark={dark} />
            ) : (
              <div className="w-full h-full animate-pulse bg-surface-1" />
            )}
          </div>
          <div className="p-5 flex-1">
            <span className="text-[10px] font-bold text-ink-faint uppercase tracking-widest">{number}</span>
            <h3 className="font-bold text-ink mt-1.5 mb-2" style={{ fontSize: '1.1rem' }}>{title}</h3>
            <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
