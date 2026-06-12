'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import { ArrowRight, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/lib/hooks/useMounted';

/* ── Theme toggle ── */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <div className="w-8 h-8" />;

  const cycle = () =>
    setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system');

  return (
    <button onClick={cycle} className="w-8 h-8 rounded-lg flex items-center justify-center border border-edge hover:bg-surface-2 transition-colors" title={`Theme: ${theme}`}>
      {theme === 'light' ? <Sun size={14} className="text-ink-muted" /> : theme === 'dark' ? <Moon size={14} className="text-ink-muted" /> : <Monitor size={14} className="text-ink-muted" />}
    </button>
  );
}

/* ── Landing page nav/header ── */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className="sticky top-0 z-50 transition-all duration-300" style={{ height: 52, background: scrolled ? 'var(--color-surface-0)' : 'transparent', backdropFilter: scrolled ? 'blur(14px)' : 'none', borderBottom: `1px solid ${scrolled ? 'var(--color-edge)' : 'transparent'}` }}>
      <div className="mx-auto px-6 h-full flex items-center justify-between" style={{ maxWidth: 1120 }}>
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
            <rect x="1"  y="1"  width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.9" />
            <rect x="12" y="1"  width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.4" />
            <rect x="1"  y="12" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.4" />
            <rect x="12" y="12" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.7" />
          </svg>
          <span className="text-sm font-bold tracking-tight text-ink">VisualMe</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[['#how-it-works', 'How it works'], ['#features', 'Features'], ['#pricing', 'Pricing']].map(([href, label]) => (
            <a key={href} href={href} className="text-sm text-ink-faint hover:text-ink transition-colors">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm text-ink-faint hover:text-ink transition-colors px-2">Sign in</Link>
            <Link href="/sign-up" className="px-4 py-2 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors">Start free</Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors flex items-center gap-1.5">Dashboard <ArrowRight size={13} /></Link>
            <UserButton />
          </Show>
        </div>
      </div>
    </nav>
  );
}
