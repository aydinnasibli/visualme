"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

const OPTIONS = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

/**
 * Three-way light/dark/system switch. Mirrors the active OS preference when
 * "system" is selected (via next-themes' `enableSystem`) so the dashboard's
 * surfaces — and anything that reads the live theme, like the chart canvas —
 * always agree with what's on screen.
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — `theme` is only known once mounted on the client.
  useEffect(() => setMounted(true), []);

  const active = mounted ? theme : 'dark';

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-full surface-panel">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={`${label} theme`}
          aria-pressed={active === value}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            active === value
              ? 'bg-accent/15 text-accent'
              : 'text-ink-faint hover:text-ink-muted hover:bg-surface-2'
          }`}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  );
}
