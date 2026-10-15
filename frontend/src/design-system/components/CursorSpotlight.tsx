import { useEffect, useRef } from 'react';
import { cn } from '../cn';
import { useIsTouch } from '../hooks/useMediaQuery';
import { useReducedMotionSafe } from '../motion';
import { cssVar, type ColorToken } from '../tokens';

export type CursorSpotlightProps = {
  /** Diameter of the light pool in px. */
  size?: number;
  /** 0–1 peak opacity of the light. */
  intensity?: number;
  color?: ColorToken;
  /**
   * 'viewport' = fixed layer following the pointer anywhere;
   * 'contained' = absolutely positioned in the nearest positioned parent (e.g. the hero).
   */
  mode?: 'viewport' | 'contained';
  className?: string;
};

/**
 * Radial light that follows the pointer. Compositor-only: a single pre-painted gradient layer
 * moved with translate3d inside requestAnimationFrame (one write per frame, no layout reads in
 * the loop besides the cached parent rect). Not rendered on touch devices or under reduced motion.
 */
export function CursorSpotlight({
  size = 560,
  intensity = 0.22,
  color = 'sunrise-strong',
  mode = 'viewport',
  className,
}: CursorSpotlightProps) {
  const reduce = useReducedMotionSafe();
  const touch = useIsTouch();
  const ref = useRef<HTMLDivElement>(null);
  const enabled = !reduce && !touch;

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const host: HTMLElement | Window =
      mode === 'contained' && el.parentElement ? el.parentElement : window;
    let rect: DOMRect | null = null;
    let frame = 0;
    let x = -size;
    let y = -size;

    const measure = () => {
      rect = host instanceof HTMLElement ? host.getBoundingClientRect() : null;
    };
    const paint = () => {
      frame = 0;
      el.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
    };
    const onMove = (e: Event) => {
      const pe = e as PointerEvent;
      if (pe.pointerType && pe.pointerType !== 'mouse') return;
      if (rect === null && host instanceof HTMLElement) measure();
      x = pe.clientX - (rect?.left ?? 0);
      y = pe.clientY - (rect?.top ?? 0);
      el.style.opacity = '1';
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      el.style.opacity = '0';
    };
    const invalidate = () => {
      rect = null;
    };

    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
    };
  }, [enabled, mode, size]);

  if (!enabled) return null;
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none left-0 top-0 z-spotlight overflow-hidden',
        mode === 'viewport' ? 'fixed inset-0' : 'absolute inset-0',
        className,
      )}
    >
      <div
        ref={ref}
        className="absolute left-0 top-0 rounded-full opacity-0 transition-opacity duration-slow will-change-transform"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at center, ${cssVar(color, intensity)} 0%, ${cssVar(color, intensity * 0.35)} 35%, transparent 70%)`,
        }}
      />
    </div>
  );
}
