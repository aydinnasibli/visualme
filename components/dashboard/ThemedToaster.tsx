"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

/** Keeps sonner's toast styling in sync with the active app theme (light/dark/system). */
export default function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Toaster
      position="bottom-right"
      richColors
      theme={mounted ? (resolvedTheme as 'light' | 'dark') : 'dark'}
    />
  );
}
