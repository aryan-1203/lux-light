import type { CSSProperties } from 'react';
import { cn } from '../cn';

export type SkeletonProps = {
  className?: string;
  /** Reserve exact space (prevents CLS): e.g. `aspectRatio: '4 / 5'`. */
  style?: CSSProperties;
  shape?: 'rect' | 'text' | 'circle';
};

/** Decorative placeholder; wrap groups in an element with `aria-busy="true"` + a status label. */
export function Skeleton({ className, style, shape = 'rect' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        'relative overflow-hidden bg-surface-2',
        shape === 'rect' && 'rounded-lg',
        shape === 'text' && 'h-4 rounded-sm',
        shape === 'circle' && 'aspect-square rounded-full',
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/5 to-transparent motion-reduce:hidden" />
    </div>
  );
}
