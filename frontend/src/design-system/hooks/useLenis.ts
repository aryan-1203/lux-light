import { createContext, useContext, useEffect } from 'react';
import type Lenis from 'lenis';

export const LenisContext = createContext<Lenis | null>(null);

/** The Lenis instance (null when smooth scrolling is off — reduced motion / tests). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

/** Pause smooth scrolling while an overlay is open (dialogs, drawers). */
export function useLenisLock(locked: boolean): void {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis || !locked) return;
    lenis.stop();
    return () => lenis.start();
  }, [lenis, locked]);
}
