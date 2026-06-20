'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import ReactECharts from 'echarts-for-react';
import { BarChart3, TrendingUp, PieChart, Sparkles, Send, ArrowRight } from 'lucide-react';
import type { EChartsOption } from 'echarts';
import { useMounted } from '@/lib/hooks/useMounted';

const PALETTE = ['#fb923c', '#f97316', '#f43f5e', '#ec4899', '#fbbf24', '#ef4444'];
const FONT = 'Inter, system-ui, -apple-system, sans-serif';

function themeColors(dark: boolean) {
  return {
    text: dark ? '#fdf1ea' : '#1a1a2e',
    muted: dark ? '#cba696' : '#6b7280',
    border: dark ? '#4a3327' : '#d1d5db',
    tooltip: dark ? '#2a1a10' : '#ffffff',
    areaFill: dark ? 'rgba(251,146,60,0.3)' : 'rgba(251,146,60,0.15)',
    pieGap: dark ? 'transparent' : '#ffffff',
  };
}

function ax(dark: boolean) {
  const c = themeColors(dark);
  return {
    axisLabel: { color: c.muted, fontSize: 11, fontFamily: FONT },
    axisLine: { lineStyle: { color: c.border } },
    splitLine: { lineStyle: { color: c.border, type: 'dashed' as const } },
    axisTick: { show: false },
  };
}

interface Msg { role: 'user' | 'assistant'; content: string }
interface Scenario {
  id: string;
  label: string;
  icon: typeof BarChart3;
  option: EChartsOption;
  messages: Msg[];
}

const MESSAGES = {
  sales: [
    { role: 'user' as const, content: 'Show quarterly revenue by product line.' },
    { role: 'assistant' as const, content: 'Grouped bar chart ready. Software grew 41% Q1→Q4. Hardware is declining steadily.' },
    { role: 'user' as const, content: 'Sort by Q4 and make it horizontal.' },
    { role: 'assistant' as const, content: 'Done — reordered by Q4 revenue, bars now horizontal. Want a target line or different palette?' },
  ],
  growth: [
    { role: 'user' as const, content: 'Plot monthly active users over the past year.' },
    { role: 'assistant' as const, content: 'Your MAU grew from 1.2K to 28.4K — a 23x increase. Exponential growth kicked in around August.' },
    { role: 'user' as const, content: 'Add new user signups per month.' },
    { role: 'assistant' as const, content: 'Dashed line shows new signups. Retention is strong — total users grow faster than new signups alone.' },
  ],
  survey: [
    { role: 'user' as const, content: 'Show customer satisfaction survey as a donut chart.' },
    { role: 'assistant' as const, content: '72% are satisfied or very satisfied. Only 10.6% reported dissatisfaction — a strong signal overall.' },
    { role: 'user' as const, content: 'Highlight the dissatisfied segments.' },
    { role: 'assistant' as const, content: 'I can pull out those slices or use a contrasting red. Say the word and I\'ll update the chart.' },
  ],
};

function buildScenarios(dark: boolean): Scenario[] {
  const c = themeColors(dark);
  const tt = { backgroundColor: c.tooltip, borderColor: c.border, textStyle: { color: c.text, fontSize: 12 } };
  return [
    {
      id: 'sales', label: 'Sales Report', icon: BarChart3,
      option: {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', ...tt },
        legend: { data: ['Software', 'Services', 'Hardware'], top: 8, textStyle: { color: c.muted, fontSize: 11 } },
        grid: { top: 44, right: 16, bottom: 28, left: 46 },
        xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'], ...ax(dark) },
        yAxis: { type: 'value', ...ax(dark), axisLabel: { color: c.muted, fontSize: 11, fontFamily: FONT, formatter: '${value}' }, axisLine: { show: false } },
        series: [
          { name: 'Software', type: 'bar', data: [182000, 201000, 224000, 256000], itemStyle: { color: PALETTE[0], borderRadius: [3, 3, 0, 0] }, barMaxWidth: 24 },
          { name: 'Services', type: 'bar', data: [64000, 71000, 79000, 88000], itemStyle: { color: PALETTE[2], borderRadius: [3, 3, 0, 0] }, barMaxWidth: 24 },
          { name: 'Hardware', type: 'bar', data: [41000, 38000, 35000, 33000], itemStyle: { color: PALETTE[4], borderRadius: [3, 3, 0, 0] }, barMaxWidth: 24 },
        ],
      },
      messages: MESSAGES.sales,
    },
    {
      id: 'growth', label: 'User Growth', icon: TrendingUp,
      option: {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', ...tt },
        legend: { data: ['Total Users', 'New Users'], top: 8, textStyle: { color: c.muted, fontSize: 11 } },
        grid: { top: 44, right: 16, bottom: 28, left: 46 },
        xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], ...ax(dark), boundaryGap: false },
        yAxis: { type: 'value', ...ax(dark), axisLine: { show: false } },
        series: [
          { name: 'Total Users', type: 'line', smooth: true, data: [1200, 1800, 2900, 4100, 5800, 7200, 9100, 11400, 14200, 17800, 22100, 28400], itemStyle: { color: PALETTE[0] }, lineStyle: { color: PALETTE[0], width: 2.5 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: c.areaFill }, { offset: 1, color: 'rgba(251,146,60,0.02)' }] } }, symbolSize: 5 },
          { name: 'New Users', type: 'line', smooth: true, data: [1200, 620, 1150, 1280, 1750, 1480, 1950, 2380, 2900, 3700, 4450, 6500], itemStyle: { color: PALETTE[4] }, lineStyle: { color: PALETTE[4], width: 2, type: 'dashed' }, symbolSize: 4 },
        ],
      },
      messages: MESSAGES.growth,
    },
    {
      id: 'survey', label: 'Survey Results', icon: PieChart,
      option: {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', ...tt, formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'horizontal', bottom: 4, textStyle: { color: c.muted, fontSize: 11 } },
        series: [{
          type: 'pie', radius: ['38%', '66%'], center: ['50%', '48%'], avoidLabelOverlap: true,
          itemStyle: { borderRadius: 5, borderColor: c.pieGap, borderWidth: 2 },
          label: { show: true, color: c.muted, fontSize: 11, formatter: '{d}%' },
          labelLine: { lineStyle: { color: c.border } },
          emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' }, itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.25)' } },
          data: [
            { value: 142, name: 'Very Satisfied', itemStyle: { color: PALETTE[0] } },
            { value: 218, name: 'Satisfied', itemStyle: { color: PALETTE[4] } },
            { value: 87, name: 'Neutral', itemStyle: { color: PALETTE[1] } },
            { value: 34, name: 'Dissatisfied', itemStyle: { color: PALETTE[2] } },
            { value: 19, name: 'Very Dissatisfied', itemStyle: { color: PALETTE[5] } },
          ],
        }],
      },
      messages: MESSAGES.survey,
    },
  ];
}

export default function InteractiveDemo() {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const [activeId, setActiveId] = useState('sales');
  const [visible, setVisible] = useState(0);

  const dark = resolvedTheme !== 'light';
  const scenarios = useMemo(() => buildScenarios(dark), [dark]);
  const scenario = scenarios.find(s => s.id === activeId)!;

  useEffect(() => {
    setVisible(0);
    const total = scenario.messages.length;
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < total; i++) {
      timers.push(setTimeout(() => setVisible(i + 1), 250 + i * 350));
    }
    return () => timers.forEach(clearTimeout);
  }, [activeId, scenario.messages.length]);

  return (
    <div className="rounded-2xl border border-edge overflow-hidden bg-surface-0">
      {/* Scenario tabs */}
      <div className="border-b border-edge px-4 py-2.5 flex gap-2 overflow-x-auto bg-surface-0">
        {scenarios.map(s => {
          const Icon = s.icon;
          const active = s.id === activeId;
          return (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-1 border border-transparent'
              }`}
            >
              <Icon size={13} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Split content */}
      <div className="flex flex-col lg:flex-row" style={{ minHeight: 380 }}>
        {/* Chat */}
        <div className="lg:w-[340px] xl:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r border-edge flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 260 }}>
            {scenario.messages.map((msg, i) => (
              <div
                key={`${activeId}-${i}`}
                className="transition-all duration-300"
                style={{ opacity: i < visible ? 1 : 0, transform: i < visible ? 'translateY(0)' : 'translateY(6px)' }}
              >
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[88%] bg-accent/15 border border-accent/20 rounded-2xl rounded-br-md px-3.5 py-2">
                      <p className="text-sm text-ink leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-[88%] bg-surface-1 border border-edge rounded-2xl rounded-bl-md px-3.5 py-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Sparkles size={10} className="text-accent" />
                        <span className="text-[9px] font-semibold text-accent uppercase tracking-wider">Visuologia</span>
                      </div>
                      <p className="text-sm text-ink-muted leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Fake input */}
          <div className="border-t border-edge px-3 py-2.5">
            <Link
              href="/sign-up"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-surface-1 border border-edge hover:border-accent/30 hover:bg-surface-2 transition-all group"
            >
              <Send size={13} className="text-ink-faint group-hover:text-accent transition-colors shrink-0" />
              <span className="text-sm text-ink-faint group-hover:text-ink-muted transition-colors">
                Sign up to try with your data...
              </span>
            </Link>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 flex flex-col bg-surface-1">
          <div className="px-4 py-2.5 border-b border-edge flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">{scenario.label}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              Live chart
            </span>
          </div>
          <div className="flex-1 p-3 lg:p-4 flex items-center justify-center">
            {mounted ? (
              <div className="w-full h-full rounded-lg border border-edge bg-surface-0 overflow-hidden" style={{ minHeight: 320 }}>
                <ReactECharts
                  key={activeId}
                  option={scenario.option}
                  notMerge
                  lazyUpdate
                  opts={{ renderer: 'canvas' }}
                  style={{ height: '100%', width: '100%', minHeight: 320 }}
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-lg bg-surface-0 border border-edge animate-pulse" style={{ minHeight: 320 }} />
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-edge flex items-center justify-between flex-wrap gap-2">
            <p className="text-[11px] text-ink-faint">Hover the chart for details. This is a demo — sign up to use your own data.</p>
            <Link href="/sign-up" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors shrink-0">
              Create yours free <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
