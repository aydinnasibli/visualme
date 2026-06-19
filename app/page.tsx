import Link from 'next/link';
import { Bricolage_Grotesque } from 'next/font/google';
import {
  ArrowRight, ArrowUpRight, Check,
  Upload, MessageSquare, Palette, Code2, BarChart3, Share2,
  FlaskConical, RefreshCw,
} from 'lucide-react';
import { CHART_TYPES } from '@/lib/utils/chart-types';
import Header from '@/components/layout/Header';
import HeroBg from '@/components/landing/HeroBg';
import HeroMockup from '@/components/landing/HeroMockup';
import ChartShowcase from '@/components/landing/ChartShowcase';
import InteractiveDemo from '@/components/landing/InteractiveDemo';
import FadeIn from '@/components/landing/FadeIn';
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

/* ── Compact feature list ── */
const CAPABILITIES = [
  { Icon: MessageSquare, text: 'Refine charts in plain English' },
  { Icon: Upload, text: 'Upload CSV, JSON, XLSX, or paste data' },
  { Icon: FlaskConical, text: 'Built-in t-test, ANOVA, chi-square' },
  { Icon: Palette, text: 'Brand themes applied instantly' },
  { Icon: RefreshCw, text: 'Live data from Google Sheets' },
  { Icon: Share2, text: 'Export PNG, SVG, HTML, JSON, CSV' },
  { Icon: Code2, text: 'Dashboard builder' },
  { Icon: BarChart3, text: 'Weekly email digests' },
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
          {/* Text block — centered */}
          <div className="text-center mx-auto" style={{ maxWidth: '640px' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5 text-ink-muted">
              AI-powered data visualization
            </p>
            <h1 className="font-extrabold leading-none tracking-tight mb-5 text-ink" style={{ fontSize: 'clamp(2.75rem, 5.5vw, 4.25rem)', lineHeight: 1.05 }}>
              Describe it. Refine it. Done.
            </h1>
            <p className="mb-8 leading-relaxed text-ink-muted mx-auto" style={{ fontSize: '1.0625rem', maxWidth: '42ch' }}>
              Type what you want to see. Upload your data. Refine until it&apos;s right. Export in any format.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/sign-up" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20">
                Create your first chart free <ArrowRight size={14} />
              </Link>
              <a href="#try-it" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium text-ink-muted hover:text-ink border border-edge hover:border-surface-3 transition-colors">
                Try it live
              </a>
            </div>
            <p className="mt-4 text-xs text-ink-faint">Free forever. No credit card. Sign up in 10 seconds.</p>
          </div>

          {/* Mockup — full width, prominent */}
          <div className="mt-14" style={{ maxWidth: 960, margin: '56px auto 0' }}>
            <HeroMockup />
          </div>
        </div>
      </HeroBg>

      {/* ── Interactive demo ── */}
      <section id="try-it" className="bg-surface-1" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <FadeIn>
            <h2 className="font-bold tracking-tight mb-8 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
              See how it works
            </h2>
            <InteractiveDemo />
          </FadeIn>
        </div>
      </section>

      {/* ── Chart types (visual centerpiece) ── */}
      <section className="bg-surface-0" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <FadeIn>
          <h2 className="font-bold tracking-tight mb-10 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            {CHART_TYPES.length} chart types, every variant
          </h2>
          <ChartShowcase />
          <div className="flex flex-wrap gap-2">
            {CHART_TYPES.map(t => (
              <span key={t.series} className="text-xs px-3 py-1.5 rounded-full bg-surface-0 border border-edge text-ink-faint">{t.label}</span>
            ))}
          </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Capabilities (compact strip) ── */}
      <section id="features" className="bg-surface-1" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <FadeIn>
          <div className="flex flex-col lg:flex-row lg:items-center gap-10">
            <h2 className="font-bold tracking-tight text-ink shrink-0" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>
              Everything you need,<br className="hidden lg:block" /> nothing you don&apos;t.
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 flex-1">
              {CAPABILITIES.map(({ Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <Icon size={15} className="text-accent mt-0.5 shrink-0" strokeWidth={1.8} />
                  <span className="text-sm text-ink-muted leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-surface-0" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 1120 }}>
          <FadeIn>
          <h2 className="font-bold tracking-tight mb-8 text-ink" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>Simple pricing</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div key={plan.name} className={`rounded-2xl p-8 flex flex-col relative border transition-all duration-200 ${plan.highlight ? 'hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1' : 'hover:border-surface-3 hover:-translate-y-0.5'}`} style={{ background: plan.highlight ? 'oklch(72% 0.13 55 / 0.05)' : 'var(--color-surface-1)', borderColor: plan.highlight ? 'var(--color-accent)' : 'var(--color-edge)' }}>
                {plan.highlight && <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-xs font-bold border border-accent text-accent bg-surface-0">Most popular</span>}
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
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-surface-1" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="mx-auto px-6" style={{ maxWidth: 720 }}>
          <FadeIn>
          <h2 className="font-bold tracking-tight mb-10 text-ink text-center" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-edge bg-surface-0 overflow-hidden hover:border-surface-3 transition-colors">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-semibold text-ink select-none">
                  {q}
                  <ArrowRight size={14} className="shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-5 text-sm text-ink-muted leading-relaxed -mt-1">
                  {a}
                </div>
              </details>
            ))}
          </div>
          </FadeIn>
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
