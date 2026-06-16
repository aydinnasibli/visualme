'use client';

import Link from 'next/link';
import { Bricolage_Grotesque } from 'next/font/google';
import {
  ArrowRight, ArrowUpRight, Check,
  Upload, MessageSquare, Palette, Code2, BarChart3, Share2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import ReactECharts from 'echarts-for-react';
import { CHART_TYPES } from '@/lib/utils/chart-types';
import { useMounted } from '@/lib/hooks/useMounted';
import Header from '@/components/layout/Header';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

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

/* ── Hero mockup — a convincing snapshot of the real product ── */
function HeroMockup() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted ? resolvedTheme !== 'light' : true;

  const heroChartOption = buildOption('bar', isDark);

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
                style={{ background: item.active ? 'oklch(72% 0.13 55 / 0.1)' : 'transparent', borderColor: item.active ? 'oklch(72% 0.13 55)' : 'var(--color-edge)', opacity: item.active ? 1 : 0.55 }}>
                <p className="text-[9px] font-semibold truncate" style={{ color: item.active ? 'var(--color-accent)' : 'var(--color-ink-faint)', maxWidth: 128 }}>{item.label}</p>
                <p className="text-[8px] text-ink-faint mt-0.5">{item.type}</p>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-edge">
            <div className="rounded-lg px-2 py-1.5 text-[8px] text-ink-faint bg-surface-2 border border-edge">Describe what to visualize...</div>
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
  );
}

/* ── Refinement conversation demo ── */
const REFINE_STEPS = [
  {
    prompt: 'Compare Q1–Q4 revenue across product lines',
    reply: 'Grouped bar chart generated with realistic quarterly data across 4 product lines.',
    change: null,
  },
  {
    prompt: 'Make the bars horizontal and sort by Q4 performance',
    reply: 'Switched to horizontal layout, reordered by Q4 value descending.',
    change: 'Layout changed',
  },
  {
    prompt: 'Add a target line at $2M and highlight anything below it',
    reply: 'Added a $2M markLine. Three bars are now flagged in a muted red.',
    change: 'Annotation added',
  },
  {
    prompt: 'Export this as SVG for the board deck',
    reply: 'SVG ready to download — transparent background, 2x resolution.',
    change: 'Exported',
  },
];

/* ── Data ── */
const POWER_FEATURES = [
  {
    Icon: MessageSquare,
    title: 'Refine in plain English',
    body: 'The chart doesn\'t have to be right on the first try. Ask it to change the type, add annotations, reorder, recolor. Each reply updates the chart in place with full context of the conversation.',
  },
  {
    Icon: Upload,
    title: 'Your real data, not demo data',
    body: 'Upload CSV, JSON, or paste raw values. VisualMe parses the structure, understands column types, and generates a chart against your actual numbers — not invented placeholders.',
  },
  {
    Icon: BarChart3,
    title: 'Built-in statistical analysis',
    body: 'Run t-tests, ANOVA, chi-square, and Pearson correlation directly on your dataset — no Python, no R, no AI hallucination. Deterministic, browser-only statistical testing that you can trust.',
  },
  {
    Icon: Palette,
    title: 'Theme the look, keep the data',
    body: 'Palette, typography, and spacing are a separate layer from the chart structure. Change the visual without regenerating. Apply your brand colors to every chart in the session at once.',
  },
  {
    Icon: Code2,
    title: 'Drop into the JSON when you need to',
    body: 'Every chart is a live ECharts option object. Open the JSON editor and modify anything directly — series config, custom marks, axis overrides. Saved and persisted to your dashboard.',
  },
  {
    Icon: Share2,
    title: 'Share or export in any format',
    body: 'PNG, SVG, JSON, CSV, or a shareable link. Public or private. Charts live in your dashboard, versioned with their full refinement history.',
  },
];

const PLANS = [
  {
    name: 'Free', price: '$0', period: '', desc: 'Start building immediately',
    features: ['10 visualizations / month', `${CHART_TYPES.length} chart types`, 'PNG export', 'Public sharing', 'Refinement chat'],
    cta: 'Get started free', href: '/sign-up', highlight: false,
  },
  {
    name: 'Pro', price: '$12', period: '/ month', desc: 'For regular use',
    features: ['Unlimited visualizations', `${CHART_TYPES.length} chart types + variants`, 'PNG + SVG export', 'Private visualizations', 'File upload (CSV, JSON)', 'Statistical analysis', 'Theme editor', 'Priority generation'],
    cta: 'Start Pro', href: '/sign-up', highlight: true,
  },
  {
    name: 'Team', price: '$39', period: '/ month', desc: 'For teams',
    features: ['Everything in Pro', 'Up to 10 seats', 'Shared workspace', 'Team history', 'Priority support'],
    cta: 'Contact us', href: '/sign-up', highlight: false,
  },
];

const USE_CASES = [
  {
    persona: 'You have a CSV and need a chart for a presentation in 20 minutes.',
    how: 'Upload the file. Describe what you want to show. Refine once or twice. Export as PNG.',
  },
  {
    persona: 'You\'re a developer explaining a microservices architecture to stakeholders.',
    how: 'Describe the services and their connections. Get a network graph. Adjust the layout with a follow-up.',
  },
  {
    persona: 'You\'re a PM who needs to visualize a roadmap without opening Figma or Excel.',
    how: 'Describe the timeline. Get a Gantt chart. Add milestones and reorder lanes in plain English.',
  },
  {
    persona: 'You\'re a researcher comparing two datasets and need to run a significance test.',
    how: 'Paste or upload your data. Run a t-test directly in the tool. Visualize the result in the same session.',
  },
];

/* ── Landing page ── */
export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted ? resolvedTheme !== 'light' : true;
  const dotColor = isDark ? 'oklch(22% 0.010 252)' : 'oklch(84% 0.012 252)';

  return (
    <div className={`${bricolage.className} bg-surface-0 text-ink overflow-x-hidden`}>

      <Header />

      {/* ── Hero ── */}
      <section className="relative" style={{ paddingTop: 80, paddingBottom: 96, backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-5 text-ink-muted">
                AI-powered data visualization
              </p>
              <h1 className="font-extrabold leading-none tracking-tight mb-6 text-ink" style={{ fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)', lineHeight: 1.02 }}>
                Describe it.<br />Refine it.<br />Done.
              </h1>
              <p className="mb-4 leading-relaxed text-ink-muted" style={{ fontSize: '1.0625rem', maxWidth: '44ch' }}>
                Write what you want to see. VisualMe picks the right chart, generates it in seconds, and refines it with you in plain English until it&apos;s exactly right.
              </p>
              <p className="mb-10 text-sm text-ink-faint" style={{ maxWidth: '44ch' }}>
                Upload your own data. Run statistical tests. Export as PNG, SVG, or JSON. Share a link.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/sign-up" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors">
                  Start visualizing free <ArrowRight size={14} />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-ink-muted hover:text-ink border border-edge hover:border-surface-3 transition-colors">
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-xs text-ink-faint">Free tier, always available. No credit card.</p>
            </div>
            <div>
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works: the refinement loop ── */}
      <section id="how-it-works" className="bg-surface-1" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-bold tracking-tight mb-5 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
                Most tools give you one shot. VisualMe gives you a conversation.
              </h2>
              <p className="text-ink-muted mb-8 leading-relaxed" style={{ maxWidth: '44ch' }}>
                The first chart is a starting point. Every follow-up message refines it in context: change the type, add annotations, reorder, filter, recolor. The chart updates in place. Your history is saved.
              </p>
              <Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink-muted transition-colors">
                Try the refinement loop <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-0">
              {REFINE_STEPS.map((step, i) => (
                <div key={i} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: 'var(--color-accent)', opacity: i === 0 ? 0.35 : 1 }} />
                    {i < REFINE_STEPS.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'var(--color-edge)' }} />}
                  </div>
                  <div className={`pb-6 ${i === REFINE_STEPS.length - 1 ? '' : ''}`}>
                    <p className="text-sm text-ink mb-1 font-medium">&ldquo;{step.prompt}&rdquo;</p>
                    <p className="text-sm text-ink-faint leading-relaxed">{step.reply}</p>
                    {step.change && (
                      <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-3 border border-edge text-ink-muted">
                        {step.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Power features ── */}
      <section id="features" className="bg-surface-0" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <div className="mb-14">
            <h2 className="font-bold tracking-tight mb-3 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
              More than a chart generator
            </h2>
            <p className="text-ink-muted" style={{ maxWidth: '52ch' }}>
              A full visualization workspace: bring your data, analyze it, style it, and share it — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-edge">
            {POWER_FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="bg-surface-0 p-8">
                <Icon size={20} className="text-ink-muted mb-5" strokeWidth={1.5} />
                <h3 className="font-bold mb-3 text-ink" style={{ fontSize: '1rem' }}>{title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chart types ── */}
      <section className="bg-surface-1" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <div className="mb-12 flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-bold tracking-tight text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
                {CHART_TYPES.length} chart types, every variant
              </h2>
              <p className="mt-3 text-ink-muted" style={{ maxWidth: '50ch' }}>
                AI picks the best type for your content, or you choose manually. Each type has multiple variants — stacked, grouped, radial, force-directed, filled, and more.
              </p>
            </div>
          </div>
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
          <div className="flex flex-wrap gap-2">
            {CHART_TYPES.map(t => (
              <span key={t.series} className="text-xs px-3 py-1.5 rounded-full bg-surface-0 border border-edge text-ink-faint">{t.label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real use cases ── */}
      <section className="bg-surface-0" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <h2 className="font-bold tracking-tight mb-14 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            What it looks like in practice
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {USE_CASES.map(({ persona, how }, i) => (
              <div key={i} className="rounded-xl p-7 bg-surface-1 border border-edge">
                <p className="text-sm font-semibold text-ink mb-4 leading-relaxed">{persona}</p>
                <p className="text-sm text-ink-muted leading-relaxed">{how}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-surface-1" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <div className="mb-14">
            <h2 className="font-bold tracking-tight mb-3 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>Simple, honest pricing</h2>
            <p className="text-ink-muted">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div key={plan.name} className="rounded-2xl p-8 flex flex-col relative border" style={{ background: plan.highlight ? 'var(--color-accent)0D' : 'var(--color-surface-0)', borderColor: plan.highlight ? 'var(--color-accent)' : 'var(--color-edge)' }}>
                {plan.highlight && <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-xs font-bold border border-edge text-ink-muted bg-surface-0">Most popular</span>}
                <div className="mb-7">
                  <p className="text-sm font-semibold mb-1 text-ink-faint">{plan.name}</p>
                  <div className="flex items-end gap-1 mb-1.5">
                    <span className="font-extrabold tracking-tight text-ink" style={{ fontSize: '2.5rem', lineHeight: 1 }}>{plan.price}</span>
                    {plan.period && <span className="mb-1 text-ink-faint text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-xs text-ink-faint">{plan.desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={13} strokeWidth={2.5} className="mt-0.5 shrink-0 text-ink-muted" />
                      <span className="text-sm text-ink-muted">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center flex items-center justify-center gap-2 transition-colors ${plan.highlight ? 'bg-accent hover:bg-accent-hover text-surface-0' : 'bg-surface-2 hover:bg-surface-3 text-ink-muted border border-edge'}`}>
                  {plan.cta} <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative border-t border-b" style={{ paddingTop: 88, paddingBottom: 88, background: 'var(--color-accent)0D', borderColor: 'var(--color-accent)33' }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <div style={{ maxWidth: '52ch' }}>
            <h2 className="font-bold tracking-tight mb-5 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
              Stop fighting chart tools.
            </h2>
            <p className="mb-8 leading-relaxed text-ink-muted">
              Your first 10 visualizations are free. No credit card, no setup. Just type what you want to see.
            </p>
            <Link href="/sign-up" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors">
              Get started free <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-edge bg-surface-0" style={{ paddingTop: 36, paddingBottom: 36 }}>
        <div className="mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ maxWidth: 1120 }}>
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
              <rect x="1"  y="1"  width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.9" />
              <rect x="12" y="1"  width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.4" />
              <rect x="1"  y="12" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.4" />
              <rect x="12" y="12" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.7" />
            </svg>
            <span className="text-sm font-bold text-ink">VisualMe</span>
          </div>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="text-xs text-ink-faint hover:text-ink-muted transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-xs text-ink-faint">© {new Date().getFullYear()} VisualMe</p>
        </div>
      </footer>

    </div>
  );
}
