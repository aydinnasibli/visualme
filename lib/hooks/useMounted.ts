import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Hydration-safe "has the client mounted yet" flag. Returns `false` during
 * SSR and the initial client render (matching the server snapshot), then
 * `true` after hydration — without calling `setState` inside an effect.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
