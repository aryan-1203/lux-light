import type Lenis from 'lenis';
import { useEffect, useState, type ReactNode } from 'react';
import { LenisContext } from '../hooks/useLenis';
import { useReducedMotionSafe } from '../motion';

export type SmoothScrollProviderProps = {
  children: ReactNode;
  /** Force-disable (e.g. admin). */
  disabled?: boolean;
};

/**
 * Lenis smooth scrolling for wheel/trackpad, loaded lazily after first paint (not on the critical
 * path). Lenis drives the native scroll position, so Framer Motion `useScroll()` / `whileInView`
 * keep working unchanged. Off under prefers-reduced-motion and on touch-only devices (native
 * momentum scrolling is better there). Overlays pause it with `useLenisLock(open)`; scrollable
 * children opt out via `data-lenis-prevent`.
 */
export function SmoothScrollProvider({ children, disabled = false }: SmoothScrollProviderProps) {
  const reduce = useReducedMotionSafe();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reduce || disabled || typeof window === 'undefined') return;
    if (window.matchMedia?.('(hover: none) and (pointer: coarse)').matches) return;
    let instance: Lenis | null = null;
    let cancelled = false;
    void import('lenis').then(({ default: LenisCtor }) => {
      if (cancelled) return;
      instance = new LenisCtor({ autoRaf: true, lerp: 0.12, smoothWheel: true, anchors: true });
      setLenis(instance);
    });
    return () => {
      cancelled = true;
      instance?.destroy();
      setLenis(null);
    };
  }, [reduce, disabled]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
