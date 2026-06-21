'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Settings, FolderOpen, LayoutDashboard, Menu, X, Zap } from 'lucide-react';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import { getUserLimits } from '@/lib/actions/profile';

function TokenBadge() {
  const [data, setData] = useState<{ remaining: number; limit: number; pct: number } | null>(null);

  const refresh = () => {
    getUserLimits().then(res => {
      if (res.success && res.data) {
        const { remaining, limit, percentageUsed } = res.data.tokens;
        setData({ remaining, limit, pct: percentageUsed });
      }
    });
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('tokens-changed', handler);
    return () => window.removeEventListener('tokens-changed', handler);
  }, []);

  if (!data) return null;

  const isLow = data.pct >= 80;
  const color = isLow ? 'var(--color-danger)' : 'var(--color-accent)';

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors"
      style={{
        background: isLow ? 'oklch(64% 0.19 23 / 0.08)' : 'oklch(72% 0.13 55 / 0.06)',
        borderColor: isLow ? 'oklch(64% 0.19 23 / 0.3)' : 'oklch(72% 0.13 55 / 0.2)',
        color,
      }}
      title={`${data.remaining.toLocaleString()} / ${data.limit.toLocaleString()} tokens remaining`}
    >
      <Zap size={11} />
      {data.remaining.toLocaleString()}
    </div>
  );
}

interface HeaderProps {
  label?: string;
  actions?: React.ReactNode;
}

const Header = ({ label = 'Playground', actions }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 sm:px-6 z-50 border-b border-edge/60 bg-surface-0/70 backdrop-blur-md">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/dashboard" className="flex items-center gap-3 group shrink-0" title="Back to dashboard">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-edge flex items-center justify-center text-accent font-display font-semibold group-hover:border-accent/40 transition-colors">V</div>
          <h1 className="font-display text-ink text-xl font-semibold leading-normal tracking-tight group-hover:text-accent transition-colors">Visuologia</h1>
        </Link>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-surface-1 text-ink-faint border border-edge ml-2 shrink-0">{label}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {actions}

        {/* Desktop / tablet actions */}
        <div className="hidden sm:flex items-center gap-3">
          <TokenBadge />
          <ThemeToggle />
          <div className="h-6 w-px bg-edge/70" />
          <Link href="/my-visualizations" className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors" title="My Visualizations">
            <FolderOpen className="w-[18px] h-[18px]" />
          </Link>
          <Link href="/dashboard/builder" className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors" title="Dashboard Builder">
            <LayoutDashboard className="w-[18px] h-[18px]" />
          </Link>
          <Link href="/dashboard/settings" className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors" title="Settings">
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        </div>

        {/* Mobile menu */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setMenuOpen(p => !p)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors"
          >
            {menuOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-45"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-edge bg-surface-1 shadow-[0_16px_48px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-1.5">
                <div className="flex items-center justify-between px-3 py-2 border-b border-edge/60 mb-1">
                  <span className="text-[11px] font-medium text-ink-faint uppercase tracking-wide">Theme</span>
                  <ThemeToggle />
                </div>
                <Link
                  href="/my-visualizations"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  My Visualizations
                </Link>
                <Link
                  href="/dashboard/builder"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard Builder
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            </>
          )}
        </div>

        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-9 h-9',
            },
          }}
        />
      </div>
    </header>
  );
};

export default Header;
