import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Page Not Found | Visuologia',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold font-display text-ink tracking-tight">404</p>
      <p className="mt-3 text-ink-muted text-lg">This page doesn't exist.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-control bg-accent text-surface-0 text-sm font-medium hover:bg-accent-hover transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
