import type { HTMLAttributes } from 'react';
import { cn } from '../cn';

export type BadgeTone = 'neutral' | 'sunrise' | 'success' | 'danger' | 'info' | 'outline';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-fg',
  sunrise: 'bg-sunrise text-on-sunrise',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-info/15 text-info',
  outline: 'border border-border-strong text-fg',
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone };

/** Static label/status chip. Never rely on colour alone — the text carries the meaning. */
export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 font-display text-xs font-medium leading-none',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
