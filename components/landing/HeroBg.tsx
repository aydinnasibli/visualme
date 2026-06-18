'use client';

import { useTheme } from 'next-themes';
import { useMounted } from '@/lib/hooks/useMounted';

/**
 * Thin client wrapper that applies the theme-dependent dotted background
 * to the hero section. All children (static text, links) remain server-rendered.
 */
export default function HeroBg({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted ? resolvedTheme !== 'light' : true;
  const dotColor = isDark ? 'oklch(22% 0.010 252)' : 'oklch(84% 0.012 252)';

  return (
    <section
      className="relative"
      style={{
        paddingTop: 80,
        paddingBottom: 96,
        backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {children}
    </section>
  );
}
