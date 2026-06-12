import { useCallback, useSyncExternalStore } from 'react';

const getServerSnapshot = () => false;

/**
 * Hydration-safe media query match. Returns `false` during SSR and the
 * initial client render, then the live `matches` value — and re-renders on
 * change — without calling `setState` inside an effect.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
