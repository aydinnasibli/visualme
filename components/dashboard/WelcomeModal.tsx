'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, ArrowLeft, Undo2, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'visualme_welcomed_v2';

function hasSeenWelcome(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

/* ─── Step visuals ────────────────────────────────────────────────────────── */

function HeroVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none">
      {/* Soft glow */}
      <div className="absolute w-48 h-48 rounded-full opacity-20 blur-3xl"
        style={{ background: 'oklch(72% 0.13 55)' }} />

      {/* Floating charts */}
      <div className="relative flex items-end gap-3">
        {/* Bar chart mini */}
        <div className="flex items-end gap-1 p-2.5 rounded-xl border"
          style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-edge)' }}>
          {[55, 80, 45, 95, 65].map((h, i) => (
            <div key={i} className="w-3 rounded-sm"
              style={{
                height: h * 0.55 + 'px',
                background: i === 3 ? 'var(--color-accent)' : 'oklch(72% 0.13 55 / 0.35)',
              }} />
          ))}
        </div>

        {/* Center: V logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-lg"
            style={{
              background: 'oklch(72% 0.13 55 / 0.12)',
              borderColor: 'oklch(72% 0.13 55 / 0.4)',
              boxShadow: '0 0 32px oklch(72% 0.13 55 / 0.2)',
            }}>
            <span className="font-display font-bold text-accent text-2xl leading-none">V</span>
          </div>
          <span className="text-[11px] font-semibold text-ink-faint tracking-wide">VisualMe</span>
        </div>

        {/* Line chart mini */}
        <div className="p-2.5 rounded-xl border"
          style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-edge)' }}>
          <svg width="56" height="36" viewBox="0 0 56 36">
            <polyline points="0,28 11,18 22,22 33,8 44,14 56,4"
              fill="none" stroke="oklch(72% 0.13 55 / 0.35)" strokeWidth="1.5" strokeLinejoin="round" />
            <polyline points="0,32 11,24 22,26 33,14 44,18 56,8"
              fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round"
              strokeLinecap="round" />
            <circle cx="33" cy="14" r="2.5" fill="var(--color-accent)" />
          </svg>
        </div>
      </div>

      {/* Floating pill labels */}
      <div className="absolute top-3 left-4 text-[10px] font-medium px-2 py-0.5 rounded-full border"
        style={{ background: 'oklch(72% 0.13 55 / 0.08)', borderColor: 'oklch(72% 0.13 55 / 0.2)', color: 'var(--color-accent)' }}>
        19 chart types
      </div>
      <div className="absolute bottom-3 right-4 text-[10px] font-medium px-2 py-0.5 rounded-full border"
        style={{ background: 'oklch(72% 0.13 55 / 0.08)', borderColor: 'oklch(72% 0.13 55 / 0.2)', color: 'var(--color-accent)' }}>
        AI-powered
      </div>
    </div>
  );
}

function GenerateVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center gap-3 px-4 select-none">
      {/* Input mockup */}
      <div className="flex-1 max-w-[180px] rounded-xl border p-3 flex flex-col gap-2"
        style={{ background: 'var(--color-surface-2)', borderColor: 'oklch(72% 0.13 55 / 0.25)' }}>
        <div className="text-[10px] text-ink-faint leading-relaxed">
          <span className="text-ink-muted">&ldquo;</span>Revenue by product line for Q4, highlight top performer<span className="text-ink-muted">&rdquo;</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 rounded" style={{ background: 'oklch(72% 0.13 55 / 0.15)' }} />
            <div className="w-3.5 h-3.5 rounded" style={{ background: 'oklch(72% 0.13 55 / 0.15)' }} />
          </div>
          <div className="w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-accent)' }}>
            <ArrowRight size={9} className="text-white" />
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <Sparkles size={11} className="text-accent animate-pulse" />
        <ArrowRight size={14} className="text-ink-faint" />
      </div>

      {/* Chart mockup */}
      <div className="flex-1 max-w-[160px] rounded-xl border p-3"
        style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-edge)' }}>
        <div className="text-[9px] text-ink-faint mb-2 font-medium">Q4 Revenue</div>
        <div className="flex items-end gap-1 h-10">
          {[40, 65, 52, 88, 44].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm"
              style={{
                height: (h / 88 * 40) + 'px',
                background: i === 3 ? 'var(--color-accent)' : 'oklch(72% 0.13 55 / 0.3)',
              }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EditVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center px-5 select-none">
      <div className="w-full max-w-[340px] flex gap-2.5">
        {/* Chart area with toolbar */}
        <div className="flex-1 rounded-xl border overflow-hidden"
          style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-edge)' }}>
          {/* Toolbar strip */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b"
            style={{ borderColor: 'var(--color-edge)' }}>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border"
              style={{ background: 'oklch(73% 0.14 152 / 0.08)', borderColor: 'oklch(73% 0.14 152 / 0.25)', color: 'oklch(73% 0.14 152)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'oklch(73% 0.14 152)' }} />
              Saved
            </div>
            {/* Undo button highlight */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border animate-pulse"
              style={{ background: 'oklch(72% 0.13 55 / 0.1)', borderColor: 'oklch(72% 0.13 55 / 0.3)', color: 'var(--color-accent)' }}>
              <Undo2 size={8} />
              Undo
            </div>
          </div>
          {/* Mini chart */}
          <div className="p-2">
            <svg width="100%" height="44" viewBox="0 0 100 44">
              <polyline points="0,38 20,28 40,32 60,14 80,20 100,8"
                fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              <polyline points="0,38 20,28 40,32 60,14 80,20 100,8"
                fill="oklch(72% 0.13 55 / 0.08)" stroke="none" />
              {[0, 20, 40, 60, 80, 100].map((x, i) =>
                <circle key={i} cx={x} cy={[38, 28, 32, 14, 20, 8][i]} r="2" fill="var(--color-accent)" />
              )}
            </svg>
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-[120px] rounded-xl border flex flex-col overflow-hidden"
          style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-edge)' }}>
          <div className="px-2 py-1.5 border-b text-[9px] font-semibold text-accent"
            style={{ borderColor: 'var(--color-edge)' }}>AI Edit</div>
          <div className="flex-1 p-2 space-y-1.5">
            {/* User msg */}
            <div className="flex justify-end">
              <div className="text-[9px] px-1.5 py-1 rounded-lg max-w-[90%] leading-relaxed"
                style={{ background: 'oklch(72% 0.13 55 / 0.2)', color: 'var(--color-ink-muted)' }}>
                Add data labels to each point
              </div>
            </div>
            {/* AI msg */}
            <div className="flex justify-start">
              <div className="text-[9px] px-1.5 py-1 rounded-lg max-w-[90%] leading-relaxed"
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-ink-faint)' }}>
                Done! Labels added ✓
              </div>
            </div>
          </div>
          {/* Input area */}
          <div className="flex items-center gap-1 px-1.5 py-1.5 border-t"
            style={{ borderColor: 'var(--color-edge)' }}>
            <div className="flex-1 h-4 rounded text-[8px] px-1 flex items-center"
              style={{ background: 'var(--color-surface-3)', color: 'var(--color-ink-faint)' }}>
              Ask anything…
            </div>
            <div className="w-4 h-4 rounded flex items-center justify-center"
              style={{ background: 'var(--color-accent)' }}>
              <ArrowRight size={7} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TokenVisual() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-6 select-none">
      {/* Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold"
        style={{
          background: 'oklch(72% 0.13 55 / 0.08)',
          borderColor: 'oklch(72% 0.13 55 / 0.25)',
          color: 'var(--color-accent)',
        }}>
        <Zap size={14} />
        <span>87 tokens remaining</span>
      </div>

      {/* Bar */}
      <div className="w-full max-w-[260px]">
        <div className="flex justify-between text-[10px] text-ink-faint mb-1.5">
          <span>0</span>
          <span>200 / month (Free)</span>
        </div>
        <div className="h-2 rounded-full w-full" style={{ background: 'var(--color-surface-3)' }}>
          <div className="h-full rounded-full" style={{ width: '79%', background: 'var(--color-accent)' }} />
        </div>
        <p className="text-[10px] text-ink-faint mt-1 text-center">21 tokens used this month</p>
      </div>

      {/* Plan comparison */}
      <div className="flex gap-2 w-full max-w-[260px]">
        <div className="flex-1 rounded-lg border p-2.5 text-center"
          style={{ background: 'oklch(72% 0.13 55 / 0.05)', borderColor: 'oklch(72% 0.13 55 / 0.2)' }}>
          <p className="text-[10px] text-ink-faint">Free</p>
          <p className="text-sm font-bold text-ink mt-0.5">200</p>
          <p className="text-[9px] text-ink-faint">≈18 charts/mo</p>
        </div>
        <div className="flex-1 rounded-lg border p-2.5 text-center"
          style={{ background: 'oklch(72% 0.13 55 / 0.1)', borderColor: 'oklch(72% 0.13 55 / 0.3)' }}>
          <p className="text-[10px] text-accent font-medium">Pro</p>
          <p className="text-sm font-bold text-ink mt-0.5">5,400</p>
          <p className="text-[9px] text-ink-faint">≈490 charts/mo</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Slide definitions ───────────────────────────────────────────────────── */

const SLIDES = [
  {
    visual: HeroVisual,
    title: 'Welcome to VisualMe',
    body: 'Turn any data description into a production-ready chart — no spreadsheet skills, no design tools. Just describe what you want.',
    cta: 'Show me around',
  },
  {
    visual: GenerateVisual,
    title: 'Describe it. Get a chart.',
    body: 'Type what you want to visualize, paste a CSV, or pick one of the 8 built-in templates with sample data already loaded. VisualMe picks the right chart type automatically.',
    cta: 'Next',
  },
  {
    visual: EditVisual,
    title: 'Refine with AI. Undo anything.',
    body: 'Open the AI Edit panel on any chart and ask for changes in plain English. Made a wrong edit? The Undo button steps back one change at a time.',
    cta: 'Next',
  },
  {
    visual: TokenVisual,
    title: 'Your monthly token budget',
    body: "Each generation uses tokens. Free accounts start with 200 tokens per month. The ⚡ badge in the top bar shows your live balance. Tokens reset on the 1st of each month.",
    cta: 'Start Visualizing',
  },
] as const;

/* ─── Main modal ──────────────────────────────────────────────────────────── */

export default function WelcomeModal() {
  const [open, setOpen] = useState(() => !hasSeenWelcome());
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward, -1 = backward

  const total = SLIDES.length;
  const isLast = step === total - 1;
  const isFirst = step === 0;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  const goNext = () => {
    if (isLast) { dismiss(); return; }
    setDir(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    if (isFirst) return;
    setDir(-1);
    setStep(s => s - 1);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d * 32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -32, opacity: 0 }),
  };

  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const el = modalRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { dismiss(); return; }
      if (e.key !== 'Tab') return;
      const focusable = el.querySelectorAll<HTMLElement>('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const { visual: Visual, title, body, cta } = SLIDES[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="welcome-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'oklch(0% 0 0 / 0.65)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            key="welcome-panel"
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to VisualMe"
            className="w-full max-w-[480px] rounded-2xl border shadow-[0_40px_80px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col"
            style={{ background: 'var(--color-surface-1)', borderColor: 'var(--color-edge)' }}
          >
            {/* Skip row */}
            <div className="flex items-center justify-between px-5 pt-4">
              <div className="flex gap-1.5">
                {SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? 18 : 5,
                      height: 5,
                      background: i === step ? 'var(--color-accent)' : 'oklch(72% 0.13 55 / 0.2)',
                    }}
                  />
                ))}
              </div>
              {!isLast && (
                <button
                  onClick={dismiss}
                  className="text-[11px] font-medium text-ink-faint hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-surface-3"
                >
                  Skip
                </button>
              )}
            </div>

            {/* Visual area */}
            <div className="relative h-[192px] mx-5 mt-4 rounded-xl overflow-hidden"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-edge)' }}>
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <Visual />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Text */}
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="px-6 pt-5 pb-2"
              >
                <h2 className="text-[15px] font-semibold text-ink leading-snug">{title}</h2>
                <p className="text-[12.5px] text-ink-faint leading-relaxed mt-1.5">{body}</p>
              </motion.div>
            </AnimatePresence>

            {/* Footer nav */}
            <div className="flex items-center gap-2 px-6 pb-6 pt-4">
              {!isFirst && (
                <button
                  onClick={goBack}
                  className="h-9 px-4 rounded-xl flex items-center gap-1.5 text-[12px] font-medium text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors border border-edge"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
              )}
              <button
                onClick={goNext}
                className="flex-1 h-9 rounded-xl flex items-center justify-center gap-2 text-[12.5px] font-semibold transition-all duration-150"
                style={{ background: 'var(--color-accent)', color: 'var(--color-surface-0)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
              >
                {cta}
                {!isLast && <ArrowRight size={13} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
