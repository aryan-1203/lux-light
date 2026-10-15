import { animate, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '../cn';
import { formatNumber } from '../format';
import { durations, ease, useReducedMotionSafe } from '../motion';

export type AnimatedCounterProps = {
  value: number;
  from?: number;
  /** Seconds. */
  duration?: number;
  format?: (n: number) => string;
  className?: string;
};

/**
 * Counts up when scrolled into view. Writes textContent directly (no React re-render per frame);
 * the final value is rendered invisibly underneath to reserve width (no layout shift), and is what
 * screen readers read. Reduced motion: shows the final value immediately.
 */
export function AnimatedCounter({
  value,
  from = 0,
  duration = durations.cinematic * 1.6,
  format = formatNumber,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = format(value);
      return;
    }
    if (!inView) return;
    const controls = animate(from, value, {
      duration,
      ease: ease.out,
      onUpdate: (latest) => {
        el.textContent = format(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value, from, duration, format]);

  const final = format(value);
  return (
    <span className={cn('inline-grid tabular-nums', className)}>
      <span className="invisible col-start-1 row-start-1">{final}</span>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden="true" className="col-start-1 row-start-1">
        {reduce ? final : format(from)}
      </span>
    </span>
  );
}
