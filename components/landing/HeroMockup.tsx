'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import ReactECharts from 'echarts-for-react';
import { useMounted } from '@/lib/hooks/useMounted';

/* ── Typewriter prompts ── */
const TYPEWRITER_PROMPTS = [
  'Compare Q1-Q4 revenue by region...',
  'Show user growth over the last 12 months...',
  'Visualize market share by competitor...',
];
const CHAR_SPEED = 60;   // ms per character
const PAUSE_AT_END = 2000; // ms pause when fully typed

/* ── Typewriter hook ── */
function useTypewriter(prompts: string[]) {
  const [display, setDisplay] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [pausing, setPausing] = useState(false);

  useEffect(() => {
    if (pausing) {
      const t = setTimeout(() => {
        setPausing(false);
        setCharIdx(0);
        setDisplay('');
        setPromptIdx((prev) => (prev + 1) % prompts.length);
      }, PAUSE_AT_END);
      return () => clearTimeout(t);
    }

    const current = prompts[promptIdx];
    if (charIdx >= current.length) {
      setPausing(true);
      return;
    }

    const t = setTimeout(() => {
      setDisplay((prev) => prev + current[charIdx]);
      setCharIdx((prev) => prev + 1);
    }, CHAR_SPEED);
    return () => clearTimeout(t);
  }, [charIdx, promptIdx, pausing, prompts]);

  return display;
}

/* ── ECharts bar option for the hero mockup ── */
function buildHeroBarOption(isDark: boolean) {
  const a = isDark ? '#5B8FFF' : '#1A5DD9';
  const tx = isDark ? '#8899B4' : '#5C7090';
  const gr = isDark ? '#1E2A3C' : '#D4DBE8';
  const ax = { axisLabel: { color: tx, fontSize: 10 }, axisLine: { lineStyle: { color: gr } }, splitLine: { lineStyle: { color: gr, type: 'dashed' as const } }, axisTick: { show: false } };

  return {
    backgroundColor: 'transparent',
    grid: { top: 14, right: 14, bottom: 28, left: 38 },
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], ...ax },
    yAxis: { type: 'value', ...ax, axisLine: { show: false } },
    series: [{
      type: 'bar',
      data: [62, 80, 58, 92, 71],
      itemStyle: { color: a, borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 32,
      animationDuration: 1200,
      animationEasing: 'cubicOut' as const,
      animationDelay: (idx: number) => idx * 150,
    }],
    animationDuration: 1200,
    animationEasing: 'cubicOut' as const,
  };
}

export default function HeroMockup() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted ? resolvedTheme !== 'light' : true;
  const typedText = useTypewriter(TYPEWRITER_PROMPTS);

  const heroChartOption = buildHeroBarOption(isDark);

  const thread = [
    { label: 'Q1–Q4 revenue by region', type: 'Bar Chart', active: false },
    { label: 'Compare PostgreSQL vs MySQL vs Mongo', type: 'Bar Chart', active: true },
    { label: 'Microservices architecture map', type: 'Network Graph', active: false },
  ];

  const chatMessages = [
    { role: 'user' as const, text: 'Make it horizontal and sort by value' },
    { role: 'ai' as const,   text: 'Done — sorted descending, bars now horizontal.' },
    { role: 'user' as const, text: 'Add a reference line at the average' },
  ];

  return (
    <>
      {/* Pulse/glow keyframes for active thread item */}
      <style jsx global>{`
        @keyframes hero-thread-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 oklch(72% 0.13 55 / 0.25);
          }
          50% {
            box-shadow: 0 0 8px 2px oklch(72% 0.13 55 / 0.35);
          }
        }
      `}</style>

      <div className="w-full rounded-xl overflow-hidden border border-edge" style={{ background: 'var(--color-surface-0)' }}>
        {/* Titlebar */}
        <div className="flex items-center gap-2 px-4 h-9 border-b border-edge bg-surface-1">
          <div className="flex gap-1.5">
            {['oklch(56% 0.20 23/0.5)', 'oklch(64% 0.15 92/0.5)', 'oklch(60% 0.15 152/0.5)'].map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="flex-1 flex justify-center">
            <span className="px-3 py-0.5 rounded text-[10px] text-ink-faint bg-surface-2 border border-edge">app.visualme.ai/dashboard</span>
          </div>
        </div>

        {/* 3-panel body */}
        <div className="flex" style={{ height: 320 }}>
          {/* Thread sidebar */}
          <div className="hidden md:flex shrink-0 flex-col border-r border-edge bg-surface-1" style={{ width: 170 }}>
            <div className="px-3 h-8 flex items-center border-b border-edge">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-ink-faint">Thread</span>
            </div>
            <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
              {thread.map((item, i) => (
                <div key={i} className="rounded-lg p-2 border transition-colors"
                  style={{
                    background: item.active ? 'oklch(72% 0.13 55 / 0.1)' : 'transparent',
                    borderColor: item.active ? 'oklch(72% 0.13 55)' : 'var(--color-edge)',
                    opacity: item.active ? 1 : 0.55,
                    ...(item.active ? { animation: 'hero-thread-pulse 2.5s ease-in-out infinite' } : {}),
                  }}>
                  <p className="text-[9px] font-semibold truncate" style={{ color: item.active ? 'var(--color-accent)' : 'var(--color-ink-faint)', maxWidth: 128 }}>{item.label}</p>
                  <p className="text-[8px] text-ink-faint mt-0.5">{item.type}</p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-edge">
              <div className="rounded-lg px-2 py-1.5 text-[8px] text-ink-faint bg-surface-2 border border-edge flex items-center">
                <span className="truncate">{typedText || ' '}</span>
                <span className="inline-block w-px h-[10px] bg-ink-faint ml-0.5 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Chart canvas */}
          <div className="flex-1 flex flex-col min-w-0 md:border-r border-edge">
            <div className="h-8 px-3 flex items-center gap-2 border-b border-edge bg-surface-1">
              <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-surface-3 border border-edge text-ink-muted">Bar Chart</span>
              <span className="text-[9px] flex-1 truncate text-ink-muted">Compare PostgreSQL vs MySQL vs Mongo</span>
              {['Save', 'Share', 'Export'].map(a => (
                <span key={a} className="px-1.5 py-0.5 rounded text-[8px] text-ink-faint bg-surface-2 border border-edge">{a}</span>
              ))}
            </div>
            <div className="flex-1 p-3">
              {mounted ? (
                <ReactECharts option={heroChartOption} notMerge opts={{ renderer: 'canvas' }} style={{ height: '100%', width: '100%' }} />
              ) : (
                <div className="w-full h-full bg-surface-1 rounded animate-pulse" />
              )}
            </div>
          </div>

          {/* Refinement chat */}
          <div className="hidden md:flex shrink-0 flex-col" style={{ width: 180 }}>
            <div className="h-8 px-3 flex items-center border-b border-edge bg-surface-1">
              <span className="text-[9px] font-semibold text-ink-faint">Refine</span>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`rounded-lg px-2 py-1.5 text-[8.5px] leading-relaxed ${msg.role === 'user' ? 'bg-surface-2 border border-edge text-ink-muted ml-2' : 'bg-accent/10 border border-edge text-ink-faint mr-2'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-edge">
              <div className="rounded-lg px-2 py-1.5 text-[8px] text-ink-faint bg-surface-2 border border-edge">Ask or adjust...</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
