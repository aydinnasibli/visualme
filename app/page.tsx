'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import {
  Sparkles, ArrowRight, Download, Zap,
  GitFork, BarChart2, Calendar, Brain,
  CheckCircle, ArrowUpRight,
} from 'lucide-react';

/* ── Static product mockup ── */
function ProductMockup() {
  const threadItems = [
    { color: '#8b5cf6', icon: '🧠', label: 'Mind Map', title: 'Machine learning concepts' },
    { color: '#14b8a6', icon: '🔀', label: 'Flowchart', title: 'User auth pipeline', active: true },
    { color: '#06b6d4', icon: '📅', label: 'Timeline', title: 'Product launch plan' },
  ];

  const graphNodes = [
    { x: 50, y: 50, r: 28, label: 'Auth Service', color: '#526efa' },
    { x: 82, y: 22, r: 18, label: 'JWT', color: '#8b5cf6' },
    { x: 82, y: 78, r: 18, label: 'OAuth', color: '#14b8a6' },
    { x: 18, y: 30, r: 16, label: 'User DB', color: '#06b6d4' },
    { x: 18, y: 70, r: 16, label: 'Sessions', color: '#f59e0b' },
  ];

  const edges = [
    [50, 50, 82, 22], [50, 50, 82, 78], [50, 50, 18, 30], [50, 50, 18, 70],
  ];

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#0a0d11', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Titlebar */}
      <div className="flex items-center gap-2 px-4 h-9 border-b border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-3 py-0.5 rounded text-[10px] text-zinc-600" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            app.visualme.ai/dashboard
          </div>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex h-[340px]">
        {/* Left: thread */}
        <div className="w-[180px] flex flex-col shrink-0 border-r border-white/5" style={{ background: '#0f1419' }}>
          <div className="px-3 h-9 flex items-center gap-1.5 border-b border-white/5">
            <Sparkles className="w-3 h-3 text-indigo-400/60" />
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Session</span>
          </div>
          <div className="flex-1 p-2 space-y-1.5">
            {threadItems.map((item, i) => (
              <div
                key={i}
                className="rounded-lg p-2 relative"
                style={{
                  background: item.active ? 'rgba(82,110,250,0.07)' : 'transparent',
                  border: `1px solid ${item.active ? 'rgba(82,110,250,0.28)' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                {item.active && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: item.color }} />
                )}
                <div className="flex items-center gap-1.5 pl-0.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[11px]" style={{ background: `${item.color}18` }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold" style={{ color: item.active ? item.color : '#52525b' }}>{item.label}</p>
                    <p className="text-[9px] text-zinc-500 truncate w-[100px]">{item.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Mock input */}
          <div className="p-2 border-t border-white/5">
            <div className="rounded-lg px-2.5 py-2 text-[9px] text-zinc-700" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              Describe what to visualize...
            </div>
          </div>
        </div>

        {/* Right: viz panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Focus panel header */}
          <div className="h-9 px-3 flex items-center gap-2 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.015)' }}>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
              <span className="text-[10px]">🔀</span>
              <span className="text-[9px] font-semibold text-teal-400">Flowchart</span>
            </div>
            <span className="text-[10px] text-zinc-400 truncate flex-1">User auth pipeline</span>
            <div className="flex items-center gap-1">
              {['Save', 'Export', 'Refine'].map(a => (
                <div key={a} className="px-2 py-0.5 rounded text-[9px] text-zinc-500" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{a}</div>
              ))}
            </div>
          </div>
          {/* Network graph illustration */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <svg viewBox="0 0 100 100" className="w-full h-full max-w-[260px] max-h-[260px]">
              {edges.map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(82,110,250,0.25)" strokeWidth="0.8" />
              ))}
              {graphNodes.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={n.r} fill={`${n.color}18`} stroke={`${n.color}50`} strokeWidth="0.8" />
                  <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle" fill={n.color} fontSize={n.r > 20 ? 4.5 : 3.8} fontWeight="600">{n.label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Viz type grid ── */
const VIZ_TYPES = [
  { icon: '🕸️', label: 'Network Graph', color: '#8b5cf6' },
  { icon: '🧠', label: 'Mind Map',      color: '#a855f7' },
  { icon: '🔀', label: 'Flowchart',     color: '#14b8a6' },
  { icon: '📅', label: 'Timeline',      color: '#06b6d4' },
  { icon: '📊', label: 'Gantt Chart',   color: '#6366f1' },
  { icon: '📈', label: 'Line Chart',    color: '#10b981' },
  { icon: '📊', label: 'Bar Chart',     color: '#f59e0b' },
  { icon: '🥧', label: 'Pie Chart',     color: '#f97316' },
  { icon: '🔥', label: 'Heatmap',       color: '#ef4444' },
  { icon: '🎯', label: 'Radar Chart',   color: '#8b5cf6' },
  { icon: '📋', label: 'Comparison',    color: '#64748b' },
  { icon: '☁️', label: 'Word Cloud',    color: '#06b6d4' },
];

const STEPS = [
  { n: '01', title: 'Describe it', desc: 'Type anything in plain English — a process, data, concept, or idea. No templates, no drag-and-drop.', icon: Sparkles, color: '#526efa' },
  { n: '02', title: 'AI generates it', desc: 'The AI picks the best visualization type and builds it in under 3 seconds. You can always refine.', icon: Zap, color: '#8b5cf6' },
  { n: '03', title: 'Export & share', desc: 'Download as PNG or SVG. Share a link. Use it in any presentation, doc, or report.', icon: Download, color: '#14b8a6' },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Perfect for trying out',
    features: ['10 visualizations / month', '19 visualization types', 'PNG export', 'Public sharing'],
    cta: 'Get started free',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/ month',
    desc: 'For professionals who need more',
    features: ['Unlimited visualizations', '19 visualization types', 'PNG + SVG export', 'Private visualizations', 'AI refinement chat', 'Priority generation'],
    cta: 'Start Pro free',
    href: '/sign-up',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$39',
    period: '/ month',
    desc: 'For teams and organizations',
    features: ['Everything in Pro', 'Up to 10 seats', 'Shared workspace', 'Team history', 'Priority support'],
    cta: 'Contact us',
    href: '/sign-up',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="text-white overflow-hidden" style={{ background: '#0a0d11' }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(10,13,17,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #526efa, #8b5cf6)', boxShadow: '0 4px 16px rgba(82,110,250,0.35)' }}>V</div>
            <span className="text-base font-bold tracking-tight">VisualMe</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how-it-works" className="text-zinc-400 hover:text-white transition-colors">How it works</a>
            <a href="#formats" className="text-zinc-400 hover:text-white transition-colors">Formats</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">Sign in</Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#526efa', boxShadow: '0 4px 16px rgba(82,110,250,0.3)' }}
              >
                Start free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 flex items-center gap-1.5"
                style={{ background: '#526efa', boxShadow: '0 4px 16px rgba(82,110,250,0.3)' }}
              >
                Dashboard <ArrowRight size={14} />
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(82,110,250,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

        <div className="container mx-auto px-6 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: 'rgba(82,110,250,0.1)', border: '1px solid rgba(82,110,250,0.25)', color: '#a5b4fc' }}>
              <Sparkles size={13} />
              19 visualization types · AI-powered · Export ready
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.08]">
              Turn any idea into a<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #526efa 0%, #8b5cf6 50%, #06b6d4 100%)' }}>
                professional diagram
              </span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto mb-10">
              Describe what you want in plain English. VisualMe picks the right format and generates it in seconds — no design skills needed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-[1.02] flex items-center gap-2 shadow-xl w-full sm:w-auto justify-center"
                style={{ background: 'linear-gradient(135deg, #526efa, #7c3aed)', boxShadow: '0 8px 32px rgba(82,110,250,0.35)' }}
              >
                <Sparkles size={16} />
                Start visualizing free
              </Link>
              <a
                href="#how-it-works"
                className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#a1a1aa' }}
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs text-zinc-600">No credit card required · Free tier always available</p>
          </div>

          {/* Product screenshot */}
          <div className="max-w-4xl mx-auto">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(82,110,250,0.03) 0%, transparent 100%)' }} />
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From idea to diagram in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl p-7 relative"
                style={{ background: '#0f1419', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                    <step.icon size={17} style={{ color: step.color }} />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 font-mono">{step.n}</span>
                </div>
                <h3 className="text-base font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Viz format showcase ── */}
      <section id="formats" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">19 formats</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">One tool, every diagram type</h2>
            <p className="text-zinc-500 max-w-md mx-auto text-sm">AI automatically picks the best format for your content. Or choose manually.</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {VIZ_TYPES.map(({ icon, label, color }) => (
              <div
                key={label}
                className="rounded-xl p-4 flex flex-col items-center gap-2 transition-all group"
                style={{ background: '#0f1419', border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}35`; (e.currentTarget as HTMLDivElement).style.background = `${color}08`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.background = '#0f1419'; }}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-[10px] font-medium text-zinc-500 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="py-24" style={{ background: '#0d1117' }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Who uses it</p>
              <h2 className="text-3xl font-bold tracking-tight mb-8">Built for everyone who communicates visually</h2>
              <div className="space-y-5">
                {[
                  { icon: Brain,    color: '#8b5cf6', title: 'Researchers', desc: 'Map complex relationships and knowledge graphs from papers or notes.' },
                  { icon: GitFork,  color: '#14b8a6', title: 'Developers',  desc: 'Generate architecture diagrams and flowcharts from system descriptions.' },
                  { icon: Calendar, color: '#06b6d4', title: 'PMs',         desc: 'Turn project briefs into Gantt charts and roadmaps instantly.' },
                  { icon: BarChart2,color: '#f59e0b', title: 'Analysts',    desc: 'Visualize datasets with charts and comparison tables in seconds.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5">{title}</p>
                      <p className="text-sm text-zinc-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt examples */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-4">Example prompts</p>
              {[
                { prompt: 'Show the microservices architecture of an e-commerce platform', type: 'Network Graph', color: '#8b5cf6' },
                { prompt: 'Create a Gantt chart for a 3-month mobile app launch', type: 'Gantt Chart', color: '#6366f1' },
                { prompt: 'Mind map all the key concepts in quantum computing', type: 'Mind Map', color: '#a855f7' },
                { prompt: 'Compare PostgreSQL, MySQL, and MongoDB', type: 'Comparison Table', color: '#64748b' },
                { prompt: 'Visualize the CI/CD pipeline for a monorepo', type: 'Flowchart', color: '#14b8a6' },
              ].map(({ prompt, type, color }) => (
                <div
                  key={prompt}
                  className="rounded-xl p-4"
                  style={{ background: '#0f1419', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="text-xs text-zinc-300 mb-2 leading-relaxed">&ldquo;{prompt}&rdquo;</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    <span className="text-[10px] font-semibold" style={{ color }}>{type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, honest pricing</h2>
            <p className="text-zinc-500 text-sm">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-7 flex flex-col relative"
                style={{
                  background: plan.highlight ? 'rgba(82,110,250,0.07)' : '#0f1419',
                  border: `1px solid ${plan.highlight ? 'rgba(82,110,250,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: plan.highlight ? '0 0 0 1px rgba(82,110,250,0.15), 0 20px 60px rgba(82,110,250,0.12)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #526efa, #7c3aed)', color: 'white' }}>
                    Most popular
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-zinc-400 mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-zinc-500 text-sm mb-1.5">{plan.period}</span>}
                  </div>
                  <p className="text-xs text-zinc-600">{plan.desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-center transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{
                    background: plan.highlight ? 'linear-gradient(135deg, #526efa, #7c3aed)' : 'rgba(255,255,255,0.06)',
                    color: plan.highlight ? 'white' : '#a1a1aa',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: plan.highlight ? '0 8px 24px rgba(82,110,250,0.3)' : 'none',
                  }}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(82,110,250,0.08) 0%, transparent 70%)' }} />
        <div className="container mx-auto px-6 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
            Stop spending hours on diagrams
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-10 text-sm leading-relaxed">
            VisualMe generates professional visualizations in seconds. Your first 10 are free — no credit card required.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all hover:opacity-90 hover:scale-[1.02] shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #526efa, #7c3aed)', boxShadow: '0 12px 40px rgba(82,110,250,0.4)', color: 'white' }}
          >
            <Sparkles size={18} />
            Get started for free
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#0a0d11' }}>
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: 'linear-gradient(135deg, #526efa, #8b5cf6)' }}>V</div>
            <span className="font-bold text-sm">VisualMe</span>
          </div>
          <div className="flex gap-8 text-xs text-zinc-600">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-zinc-700">© {new Date().getFullYear()} VisualMe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
