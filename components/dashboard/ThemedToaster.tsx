"use client";

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { useMounted } from '@/lib/hooks/useMounted';

/** Keeps sonner's toast styling in sync with the active app theme (light/dark/system). */
export default function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Toaster
      position="bottom-right"
      richColors
      theme={mounted ? (resolvedTheme as 'light' | 'dark') : 'dark'}
    />
  );
}
