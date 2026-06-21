'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import { ArrowRight, Sun, Moon, Monitor, Menu, X } from 'lucide-react';
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

const NAV_LINKS: [string, string][] = [
  ['#try-it', 'How it works'],
  ['#features', 'Features'],
  ['#pricing', 'Pricing'],
];

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Landing page nav/header ── */
export default function Header() {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y < 60) {
        setVisible(true);
      } else {
        setVisible(y < lastY.current);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    smoothScrollTo(id);
    setMobileOpen(false);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        height: 52,
        background: scrolled ? 'oklch(from var(--color-surface-0) l c h / 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px) saturate(1.2)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--color-edge)' : 'transparent'}`,
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease',
      }}
    >
      <div className="mx-auto px-6 h-full flex items-center justify-between" style={{ maxWidth: 1120 }}>
        <Link href="/" aria-label="Visuologia homepage" className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
            <rect x="1"  y="1"  width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.9" />
            <rect x="12" y="1"  width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.4" />
            <rect x="1"  y="12" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.4" />
            <rect x="12" y="12" width="9" height="9" rx="2" fill="var(--color-accent)" opacity="0.7" />
          </svg>
          <span className="text-sm font-bold tracking-tight text-ink">Visuologia</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={(e) => handleNavClick(e, href)} className="text-sm text-ink-faint hover:text-ink transition-colors">
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center border border-edge hover:bg-surface-2 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={16} className="text-ink-muted" /> : <Menu size={16} className="text-ink-muted" />}
          </button>
          <Show when="signed-out">
            <Link href="/sign-in" className="hidden sm:inline text-sm text-ink-faint hover:text-ink transition-colors px-2">Sign in</Link>
            <Link href="/sign-up" className="px-4 py-2 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors">Start free</Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-semibold text-surface-0 bg-accent hover:bg-accent-hover transition-colors flex items-center gap-1.5">Dashboard <ArrowRight size={13} /></Link>
            <UserButton />
          </Show>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-edge bg-surface-0 px-6 py-4 flex flex-col gap-3">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={(e) => handleNavClick(e, href)} className="text-sm text-ink-faint hover:text-ink transition-colors py-1">
              {label}
            </a>
          ))}
          <Show when="signed-out">
            <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="text-sm text-ink-faint hover:text-ink transition-colors py-1">Sign in</Link>
          </Show>
        </div>
      )}
    </nav>
  );
}
