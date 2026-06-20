'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#111', color: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ marginTop: '0.5rem', color: '#999' }}>A critical error occurred.</p>
          <button
            onClick={unstable_retry}
            style={{ marginTop: '1.5rem', padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#fff', color: '#111', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
