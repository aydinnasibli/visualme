import Link from 'next/link';
import { Bricolage_Grotesque } from 'next/font/google';
import {
  ArrowRight, ArrowUpRight, Check,
  Upload, MessageSquare, Palette, Code2, BarChart3, Share2,
} from 'lucide-react';
import { CHART_TYPES } from '@/lib/utils/chart-types';
import Header from '@/components/layout/Header';
import HeroBg from '@/components/landing/HeroBg';
import HeroMockup from '@/components/landing/HeroMockup';
import ChartShowcase from '@/components/landing/ChartShowcase';
import InteractiveDemo from '@/components/landing/InteractiveDemo';
import type { Metadata } from 'next';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

/* ── SEO metadata ── */
export const metadata: Metadata = {
  title: 'VisualMe — AI-Powered Data Visualization',
  description:
    'Describe what you want to see. VisualMe picks the right chart, generates it in seconds, and refines it with you in plain English. Upload CSV, JSON, or connect Google Sheets. Free to use.',
  openGraph: {
    title: 'VisualMe — AI-Powered Data Visualization',
    description:
      'Describe it. Refine it. Done. AI-powered charts, dashboards, and statistical analysis from plain English.',
    type: 'website',
    url: 'https://visualme.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VisualMe — AI-Powered Data Visualization',
    description:
      'Describe it. Refine it. Done. AI-powered charts, dashboards, and statistical analysis from plain English.',
  },
};

/* ── Refinement conversation demo ── */
const REFINE_STEPS = [
  {
    step: '1',
    prompt: 'Compare Q1–Q4 revenue across product lines',
    reply: 'Grouped bar chart generated with realistic quarterly data across 4 product lines.',
    change: null,
    tag: 'Generate',
  },
  {
    step: '2',
    prompt: 'Make the bars horizontal and sort by Q4 performance',
    reply: 'Switched to horizontal layout, reordered by Q4 value descending.',
    change: 'Layout changed',
    tag: 'Refine',
  },
  {
    step: '3',
    prompt: 'Add a target line at $2M and highlight anything below it',
    reply: 'Added a $2M markLine. Three bars are now flagged in a muted red.',
    change: 'Annotation added',
    tag: 'Annotate',
  },
  {
    step: '4',
    prompt: 'Export this as SVG for the board deck',
    reply: 'SVG ready to download — transparent background, 2x resolution.',
    change: 'Exported',
    tag: 'Export',
  },
];

/* ── FAQ ── */
const FAQS = [
  {
    q: 'Is my data sent to AI?',
    a: 'Your data is sent to OpenAI to generate the chart structure. It is not stored by OpenAI or used for training. Statistical tests run entirely in your browser — no data leaves the page.',
  },
  {
    q: 'Can I use charts commercially?',
    a: 'Yes. Everything you create with VisualMe is yours. Export as PNG, SVG, or HTML and use it in presentations, reports, publications, or dashboards — free and Pro plans alike.',
  },
  {
    q: 'What happens when I hit my token limit?',
    a: 'Your tokens reset on the 1st of each month. You can still view, export, and share existing charts. You just can\'t generate new ones until the reset — or you can upgrade to Pro for more capacity.',
  },
  {
    q: 'Do I need to know how to code?',
    a: 'No. Describe what you want in plain English. The AI picks the chart type, maps your data, and renders it. If something is off, tell it what to change — no code, no formulas, no config files.',
  },
  {
    q: 'What file formats can I upload?',
    a: 'CSV, JSON, XLSX, TXT, and PDF. You can also paste raw data directly into the prompt, or connect a public Google Sheet for live-updating charts.',
  },
  {
    q: 'How is this different from ChatGPT + code interpreter?',
    a: 'VisualMe is purpose-built for visualization. You get persistent sessions, iterative refinement, brand theming, export in 5 formats, live Google Sheets, statistical tests, and dashboards — in a dedicated workspace, not a chat window.',
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
    title: 'Live data from Google Sheets',
    body: 'Connect a public Google Sheet and your chart refreshes automatically. Set an interval — hourly, every 6 hours, or daily — and get a weekly email digest summarizing what changed.',
  },
  {
    Icon: Share2,
    title: 'Share or export in any format',
    body: 'PNG, SVG, HTML, JSON, CSV, or a shareable link. Public or private. Charts live in your dashboard, versioned with their full refinement history.',
  },
];

const ALL_FEATURES = [
  `${CHART_TYPES.length} chart types + variants`,
  'PNG, SVG & HTML export',
  'Refinement chat',
  'File upload (CSV, JSON, XLSX)',
  'Statistical analysis (t-test, ANOVA, chi-square)',
  'Brand kit & theme editor',
  'Live data from Google Sheets',
  'Weekly email digests',
  'Dashboard builder',
  'Public & private sharing',
];

const PLANS = [
  {
    name: 'Free', price: '$0', period: '', desc: 'All features included',
    features: ['~18 AI generations / month', 'Up to 50 saved visualizations', 'All features — no restrictions'],
    cta: 'Get started free', href: '/sign-up', highlight: false,
  },
  {
    name: 'Pro', price: '$12', period: '/ month', desc: 'More capacity, same features',
    features: ['~490 AI generations / month', 'Up to 1,000 saved visualizations', 'All features — no restrictions'],
    cta: 'Start Pro', href: '/sign-up', highlight: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', desc: 'For organizations',
    features: ['~2,450 AI generations / month', 'Unlimited saved visualizations', 'Dedicated support'],
    cta: 'Contact us', href: 'mailto:aydinnasibli7@gmail.com', highlight: false,
  },
];


/* ── Landing page ── */
export default function LandingPage() {
  return (
    <div className={`${bricolage.className} bg-surface-0 text-ink overflow-x-hidden`}>

      <Header />

      {/* ── Hero ── */}
      <HeroBg>
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
                Upload your data. Connect live Google Sheets. Run statistical tests. Build dashboards. Export as PNG, SVG, HTML, or JSON. Every feature free.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/sign-up" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20">
                  Create your first chart free <ArrowRight size={14} />
                </Link>
                <a href="#try-it" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium text-ink-muted hover:text-ink border border-edge hover:border-surface-3 transition-colors">
                  Try it live
                </a>
              </div>
              <p className="mt-4 text-xs text-ink-faint">Free forever. No credit card. Sign up in 10 seconds.</p>
            </div>
            <div>
              <HeroMockup />
            </div>
          </div>
        </div>
      </HeroBg>

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
                  {/* Step number + timeline */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border" style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)', opacity: i === 0 ? 0.5 : 1 }}>
                      {step.step}
                    </div>
                    {i < REFINE_STEPS.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'var(--color-edge)' }} />}
                  </div>
                  <div className="pb-7">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-accent bg-accent/10">{step.tag}</span>
                    </div>
                    <p className="text-sm text-ink mb-1 font-medium">&ldquo;{step.prompt}&rdquo;</p>
                    <p className="text-sm text-ink-faint leading-relaxed">{step.reply}</p>
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

      {/* ── Mid-page CTA ── */}
      <section className="bg-surface-1 border-y border-edge" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ maxWidth: 1120 }}>
          <p className="text-ink-muted text-sm text-center sm:text-left" style={{ maxWidth: '44ch' }}>
            All of this is free. No credit card, no trial period, no feature gates. Just sign up and start.
          </p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors shrink-0">
            Start visualizing free <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Chart types ── */}
      <section className="bg-surface-0" style={{ paddingTop: 88, paddingBottom: 88 }}>
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
          <ChartShowcase />
          <div className="flex flex-wrap gap-2">
            {CHART_TYPES.map(t => (
              <span key={t.series} className="text-xs px-3 py-1.5 rounded-full bg-surface-0 border border-edge text-ink-faint">{t.label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chart showcase CTA ── */}
      <section className="bg-surface-1 border-y border-edge" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="mx-auto px-6 text-center" style={{ maxWidth: 1120 }}>
          <p className="text-ink-muted text-sm mb-4">Pick your chart type, or let the AI decide. Either way, it takes seconds.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors">
            Try it yourself <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Interactive demo ── */}
      <section id="try-it" className="bg-surface-0" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <div className="mb-10">
            <h2 className="font-bold tracking-tight mb-3 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
              Try it right here
            </h2>
            <p className="text-ink-muted" style={{ maxWidth: '52ch' }}>
              Click a scenario, watch the conversation unfold, hover the chart for details. This is exactly how VisualMe works — just with your own data.
            </p>
          </div>
          <InteractiveDemo />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-surface-1" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <div className="mb-10">
            <h2 className="font-bold tracking-tight mb-3 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>Simple, honest pricing</h2>
            <p className="text-ink-muted">Every feature is available on every plan. You only pay for more capacity.</p>
          </div>

          {/* All features list */}
          <div className="rounded-xl border border-edge bg-surface-0 p-6 mb-8">
            <p className="text-sm font-semibold text-ink mb-4">Included on all plans — including Free</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {ALL_FEATURES.map(f => (
                <div key={f} className="flex items-start gap-2.5">
                  <Check size={13} strokeWidth={2.5} className="mt-0.5 shrink-0 text-accent" />
                  <span className="text-sm text-ink-muted">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div key={plan.name} className="rounded-2xl p-8 flex flex-col relative border" style={{ background: plan.highlight ? 'oklch(72% 0.13 55 / 0.05)' : 'var(--color-surface-0)', borderColor: plan.highlight ? 'var(--color-accent)' : 'var(--color-edge)' }}>
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

      {/* ── FAQ ── */}
      <section className="bg-surface-0" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 720 }}>
          <h2 className="font-bold tracking-tight mb-10 text-ink text-center" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            Common questions
          </h2>
          <div className="space-y-6">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-edge bg-surface-1 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-semibold text-ink select-none">
                  {q}
                  <ArrowRight size={14} className="shrink-0 text-ink-faint transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-5 text-sm text-ink-muted leading-relaxed -mt-1">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative border-t border-b" style={{ paddingTop: 88, paddingBottom: 88, background: 'oklch(72% 0.13 55 / 0.05)', borderColor: 'oklch(72% 0.13 55 / 0.2)' }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <div style={{ maxWidth: '52ch' }}>
            <h2 className="font-bold tracking-tight mb-5 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
              Stop fighting chart tools.
            </h2>
            <p className="mb-8 leading-relaxed text-ink-muted">
              Every feature is free. No credit card, no setup. Just type what you want to see.
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
            <span className="text-xs text-ink-faint opacity-50 cursor-not-allowed" title="Coming soon">Privacy</span>
            <span className="text-xs text-ink-faint opacity-50 cursor-not-allowed" title="Coming soon">Terms</span>
            <a href="mailto:aydinnasibli7@gmail.com" className="text-xs text-ink-faint hover:text-ink-muted transition-colors">Contact</a>
          </div>
          <p className="text-xs text-ink-faint">&copy; {new Date().getFullYear()} VisualMe</p>
        </div>
      </footer>

    </div>
  );
}
