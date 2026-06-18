'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl font-bold font-display text-ink tracking-tight">Something went wrong</p>
      <p className="mt-3 text-ink-muted">An unexpected error occurred. Please try again.</p>
      <button
        onClick={retry}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-control bg-accent text-surface-0 text-sm font-medium hover:bg-accent-hover transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
