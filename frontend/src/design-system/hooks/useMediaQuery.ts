import { useMemo, useSyncExternalStore } from 'react';

function subscribe(query: string) {
  return (onChange: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  };
}

/** Subscribe to a media query (derived boolean — avoids re-rendering on every resize). */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  const sub = useMemo(() => subscribe(query), [query]);
  return useSyncExternalStore(
    sub,
    () =>
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia(query).matches
        : serverFallback,
    () => serverFallback,
  );
}

/** Coarse pointer = touch device: disable hover-only and pointer-follow effects. */
export function useIsTouch(): boolean {
  return useMediaQuery('(pointer: coarse)');
}
